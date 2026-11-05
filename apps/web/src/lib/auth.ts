/**
 * dd-cons-shell better-auth instance.
 *
 * This is the umbrella's auth issuer. The session cookie is set on the apex
 * of SHELL_BETTER_AUTH_URL (or SHELL_COOKIE_DOMAIN) in production so
 * dev-division (mounted at `/dev-division/*`) and consulting-agency (mounted
 * at `/consulting/*`) can both read it on subsequent requests and verify via
 * /api/auth/get-session.
 *
 * In development (NODE_ENV=development) the cookie falls back to host-only
 * (no Domain, no Secure) so local testing on http://localhost:3000 works.
 *
 * Storage: SQLite via better-auth's built-in adapter. P29 swaps this for
 * Postgres when the umbrella moves into Docker Compose.
 */
import { betterAuth } from 'better-auth';
import { customSession } from 'better-auth/plugins';
import { database } from '../db/sqlite';
import {
  effectiveProducts,
  getPendingGrant,
  isShellAdmin,
  removePendingGrant,
} from './entitlements';

const isProd = process.env.NODE_ENV === 'production';

const baseURL = process.env.SHELL_BETTER_AUTH_URL ?? 'http://localhost:3000';

// Apex domain used for cross-product cookies. Honour SHELL_COOKIE_DOMAIN
// whenever it is set — not only in production. Local testing behind real
// subdomains (agency./consulting./dev-division.) runs `next dev`, and
// ignoring the configured domain there made the shell set a host-only cookie
// the division apps could not read, which is a sign-in loop.
function apexFromUrl(raw: string): string | undefined {
  try {
    const host = new URL(raw).hostname;
    if (host === 'localhost' || host === '::1' || /^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
      return undefined;
    }
    const parts = host.split('.');
    return parts.length >= 2 ? `.${parts.slice(-2).join('.')}` : undefined;
  } catch {
    return undefined;
  }
}

// In prod the cookie MUST be set on the apex umbrella domain so the two
// products can read it. In dev, an explicit SHELL_COOKIE_DOMAIN still wins so
// subdomain testing works; on localhost the domain is always host-only (a
// real-domain cookie would be rejected by the browser and cause a loop).
const baseApex = apexFromUrl(baseURL);
const explicitCookieDomain = process.env.SHELL_COOKIE_DOMAIN?.trim() || undefined;

function resolveCookieDomain(): string | undefined {
  if (baseApex) return explicitCookieDomain ?? baseApex;
  if (!isProd) return undefined;
  if (explicitCookieDomain) return explicitCookieDomain;
  // next build evaluates this module during page-data collection with
  // NODE_ENV=production but no runtime env; the boot-time guard stays strict.
  if (process.env.NEXT_PHASE === 'phase-production-build') return undefined;
  // Never fall back to a hard-coded (possibly stale) domain in production: a
  // cookie issued on the wrong apex is an unreadable session for every
  // product, i.e. a sign-in loop that is very hard to diagnose.
  throw new Error(
    'Cannot derive the session cookie domain: set SHELL_COOKIE_DOMAIN explicitly, or set SHELL_BETTER_AUTH_URL to a public https URL with a real hostname (not localhost / an IP).',
  );
}

const cookieDomain = resolveCookieDomain();

const secureCookie = isProd || baseURL.startsWith('https://');

// Origins allowed to start an OAuth flow / call get-session. The shell serves
// the issuer; the division apps run on sibling subdomains (or localhost
// ports) and must be trusted explicitly for callbackURLs to survive.
function trustedOrigins(): string[] {
  const origins = new Set<string>();
  const add = (value: string | undefined | null) => {
    const trimmed = value?.trim().replace(/\/+$/, '');
    if (trimmed) origins.add(trimmed);
  };
  add(baseURL);
  for (const value of (process.env.SHELL_TRUSTED_ORIGINS ?? '').split(',')) add(value);
  const apex = cookieDomain?.replace(/^\./, '');
  if (apex) {
    add(`https://${apex}`);
    add(`https://dev-division.${apex}`);
    add(`https://consulting.${apex}`);
  }
  add('http://localhost:3000');
  add('http://localhost:5173');
  add('http://localhost:5174');
  add('http://127.0.0.1:3000');
  add('http://127.0.0.1:5173');
  add('http://127.0.0.1:5174');
  return [...origins];
}

export const auth = betterAuth({
  database,
  // P25: only social providers. Email+password may be added in P26 with the
  // marketing chrome. Keeping the surface minimal here.
  emailAndPassword: { enabled: false },
  socialProviders: {
    github: {
      clientId: process.env.SHELL_GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.SHELL_GITHUB_CLIENT_SECRET ?? '',
    },
    google: {
      clientId: process.env.SHELL_GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.SHELL_GOOGLE_CLIENT_SECRET ?? '',
    },
  },
  // Refuse to boot with a weak/missing secret — a static fallback would let an
  // attacker who reads the repo forge sessions against every operator that
  // forgot the env var.
  secret: (() => {
    const s = process.env.SHELL_BETTER_AUTH_SECRET;
    if (!s || s.length < 32) {
      // next build imports this module during page-data collection with
      // NODE_ENV=production but no runtime secrets in the builder stage.
      // Relax only for that phase; the boot-time guard stays strict.
      const isNextBuild = process.env.NEXT_PHASE === 'phase-production-build';
      if (!isProd || isNextBuild) {
        // Allow a deterministic dev secret so `pnpm test` doesn't need real
        // env wiring. NEVER reached in production thanks to the guard above.
        return 'dev-only-shell-secret-do-not-use-in-production-32chars!';
      }
      throw new Error(
        'SHELL_BETTER_AUTH_SECRET is required and must be at least 32 chars. Generate with: openssl rand -hex 32',
      );
    }
    return s;
  })(),
  baseURL,
  trustedOrigins: trustedOrigins(),

  // Cookie cross-domain shape. See top-of-file comment.
  advanced: {
    cookiePrefix: 'shell',
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: 'lax',
      secure: secureCookie,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    },
  },

  // Extend the user table with v1.5 Stripe state placeholder. better-auth's
  // built-in adapter materialises this column on first run.
  user: {
    additionalFields: {
      provider: {
        type: 'string',
        required: false,
        defaultValue: '',
      },
      umbrellaSubs: {
        // JSON blob — keys reserved for Stripe customer/subscription ids per
        // product in v1.5. Default empty object means "no active subs".
        type: 'string',
        required: false,
        defaultValue: '{}',
      },
      products: {
        // JSON array of granted product ids ('dev-division' | 'consulting').
        // Default-deny: new sign-ups get nothing until an admin grants access.
        type: 'string',
        required: false,
        defaultValue: '[]',
      },
      role: {
        // 'member' | 'admin' — DB-backed admin grant, editable from /admin.
        // Env-list (SHELL_ADMIN_EMAILS) and first-user admins are admin
        // regardless of this column (see entitlements.isShellAdmin).
        type: 'string',
        required: false,
        defaultValue: 'member',
      },
    },
  },

  // Pre-authorized emails: apply a pending grant to the user row at creation
  // time (before-hook, so the row is born with the right products), then
  // consume the grant in the after-hook — a failed create never burns it.
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const pending = getPendingGrant(user.email);
          if (pending && pending.length > 0) {
            return { data: { ...user, products: JSON.stringify(pending) } };
          }
        },
        after: async (user) => {
          removePendingGrant(user.email);
        },
      },
    },
  },

  // Every get-session response carries computed entitlement state so the
  // products never have to duplicate the admin / first-user logic.
  plugins: [
    customSession(async ({ user, session }) => {
      const u = user as typeof user & { products?: string | null };
      return {
        user: {
          ...user,
          isAdmin: isShellAdmin(u),
          effectiveProducts: effectiveProducts(u),
        },
        session,
      };
    }),
  ],
});

export type Auth = typeof auth;
