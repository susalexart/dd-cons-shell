import { type NextRequest, NextResponse } from 'next/server';

/**
 * Legacy-cookie healer.
 *
 * Browsers can carry several copies of the same session cookie: a stale
 * host-only copy from a period when SHELL_COOKIE_DOMAIN was unset (or a
 * dev-mode build ignored it), plus the current wide copy. better-auth reads
 * the first occurrence in the Cookie header, which may be the stale narrow
 * one → get-session looks null despite a valid wide session ("sign-in loop").
 *
 * When duplicates are detected, expire the copies that cannot be the current
 * issuer: the host-only copy and any legacy-domain copy. The configured
 * SHELL_COOKIE_DOMAIN copy is preserved. Strict no-op otherwise.
 *
 * Note: NextRequest.cookies dedupes by name (Map), so duplicate detection must
 * parse the raw Cookie header.
 */
const SESSION_COOKIE_NAMES = ['__Secure-shell.session_token', 'shell.session_token'];

// Only set during a domain migration: the previous apex whose wide cookie
// copies should be expired. No default — never clear against a guessed domain.
const LEGACY_COOKIE_DOMAIN = process.env.SHELL_LEGACY_COOKIE_DOMAIN?.trim() || undefined;
const CURRENT_COOKIE_DOMAIN = process.env.SHELL_COOKIE_DOMAIN?.trim() || undefined;

/**
 * Umbrella path aliases. Caddy used to bounce /dev-division/dashboard and
 * /consulting/dashboard to the product subdomains; the tunnel now points
 * straight at this app, so the shell must do it or those bookmarks 404.
 */
const PRODUCT_PREFIXES = [
  { prefix: '/dev-division', env: 'DEV_DIVISION_PUBLIC_URL', product: 'dev-division' },
  { prefix: '/consulting', env: 'CONSULTING_PUBLIC_URL', product: 'consulting' },
] as const;

function apexDomain(): string | null {
  const configured = CURRENT_COOKIE_DOMAIN?.replace(/^\./, '');
  if (configured) return configured;
  const deploy = process.env.DEPLOY_DOMAIN?.trim();
  if (deploy && deploy !== 'localhost') return deploy;
  try {
    const host = new URL(process.env.SHELL_BETTER_AUTH_URL ?? '').hostname;
    const parts = host.split('.');
    if (parts.length >= 2) return parts.slice(-2).join('.');
  } catch {
    // fall through
  }
  return null;
}

function productOrigin(envName: string, product: string): string | null {
  const explicit = process.env[envName]?.trim().replace(/\/+$/, '');
  if (explicit) return explicit;
  const apex = apexDomain();
  return apex ? `https://${product}.${apex}` : null;
}

function dashboardRedirect(pathname: string, search: string): string | null {
  for (const { prefix, env, product } of PRODUCT_PREFIXES) {
    if (
      pathname === prefix ||
      pathname === `${prefix}/dashboard` ||
      pathname.startsWith(`${prefix}/dashboard/`)
    ) {
      const rest = pathname === prefix ? '/dashboard' : pathname.slice(prefix.length);
      const origin = productOrigin(env, product);
      if (origin) return `${origin}${rest}${search}`;
    }
  }
  return null;
}

export function middleware(request: NextRequest) {
  const redirect = dashboardRedirect(request.nextUrl.pathname, request.nextUrl.search);
  if (redirect) return NextResponse.redirect(redirect, 302);

  const rawCookie = request.headers.get('cookie');
  if (!rawCookie) return NextResponse.next();

  const names = rawCookie
    .split(';')
    .map((pair) => pair.slice(0, pair.indexOf('=')).trim())
    .filter(Boolean);

  const response = NextResponse.next();
  const secure = request.nextUrl.protocol === 'https:' ? '; Secure' : '';

  for (const name of SESSION_COOKIE_NAMES) {
    const count = names.filter((n) => n === name).length;
    if (count <= 1) continue;

    // Host-only copy (no Domain attribute).
    response.headers.append(
      'Set-Cookie',
      `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`,
    );
    // Legacy wide copy — only when an operator explicitly configured the old
    // apex, and it is not the domain we are currently issuing on.
    if (LEGACY_COOKIE_DOMAIN && LEGACY_COOKIE_DOMAIN !== CURRENT_COOKIE_DOMAIN) {
      response.headers.append(
        'Set-Cookie',
        `${name}=; Domain=${LEGACY_COOKIE_DOMAIN}; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`,
      );
    }
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
