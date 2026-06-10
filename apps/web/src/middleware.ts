import { type NextRequest, NextResponse } from 'next/server';

/**
 * Legacy-cookie healer.
 *
 * Before SHELL_COOKIE_DOMAIN was widened to the apex, sessions were issued
 * with Domain=.dd-cons.<apex>. Browsers that signed in back then now carry
 * BOTH cookies on dd-cons hosts; better-auth reads the first occurrence in
 * the Cookie header, which may be the stale narrow one → get-session looks
 * null despite a valid wide session ("sign-in loop", cause 2).
 *
 * When duplicates are detected, expire the narrow-domain copy. Strict no-op
 * otherwise. Note: NextRequest.cookies dedupes by name (Map), so duplicate
 * detection must parse the raw Cookie header.
 */
const SESSION_COOKIE_NAMES = [
  '__Secure-shell.session_token',
  'shell.session_token',
];

const LEGACY_COOKIE_DOMAIN =
  process.env.SHELL_LEGACY_COOKIE_DOMAIN ?? '.dd-cons.aroma-cloud.online';

export function middleware(request: NextRequest) {
  const rawCookie = request.headers.get('cookie');
  if (!rawCookie) return NextResponse.next();

  const names = rawCookie
    .split(';')
    .map((pair) => pair.slice(0, pair.indexOf('=')).trim())
    .filter(Boolean);

  const response = NextResponse.next();
  for (const name of SESSION_COOKIE_NAMES) {
    const count = names.filter((n) => n === name).length;
    if (count > 1) {
      response.headers.append(
        'Set-Cookie',
        `${name}=; Domain=${LEGACY_COOKIE_DOMAIN}; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
      );
    }
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
