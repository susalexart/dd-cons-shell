/**
 * dd-cons-shell better-auth instance.
 *
 * This is the umbrella's auth issuer. The session cookie is set on
 * `.dd-cons.aroma-cloud.online` in production so dev-division (mounted at
 * `/dev-division/*`) and consulting-agency (mounted at `/consulting/*`) can
 * both read it on subsequent requests and verify via /api/auth/get-session.
 *
 * In development (NODE_ENV=development) the cookie falls back to host-only
 * (no Domain, no Secure) so local testing on http://localhost:3000 works.
 *
 * Storage: SQLite via better-auth's built-in adapter. P29 swaps this for
 * Postgres when the umbrella moves into Docker Compose.
 */
import { betterAuth } from 'better-auth';
import { database } from '../db/sqlite';

const isProd = process.env.NODE_ENV === 'production';

// In prod the cookie MUST be set on the apex umbrella domain so the two
// products' sub-paths can read it. In dev, leaving `domain` undefined makes
// better-auth fall back to host-only on localhost, which is what we want.
const cookieDomain = isProd
  ? (process.env.SHELL_COOKIE_DOMAIN ?? '.dd-cons.aroma-cloud.online')
  : undefined;

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
      if (!isProd) {
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
  baseURL: process.env.SHELL_BETTER_AUTH_URL ?? 'http://localhost:3000',

  // Cookie cross-domain shape. See top-of-file comment.
  advanced: {
    cookiePrefix: 'shell',
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
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
    },
  },
});

export type Auth = typeof auth;
