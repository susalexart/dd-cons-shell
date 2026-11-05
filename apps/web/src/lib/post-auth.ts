/**
 * Single source of truth for where a user lands after authentication.
 *
 * Every sign-in lands on the product launcher (/launch) by default — it shows
 * exactly the products the user is entitled to, a pending-access state for
 * new sign-ups, and admin ops links. A known `dest` is carried through as a
 * query param so the launcher can highlight the intended product card.
 *
 * A `next` URL (the page the division app actually bounced the user from) wins
 * over the launcher when it is safe: relative paths and absolute URLs on the
 * umbrella's own hosts only. This is what stops the post-auth bounce from
 * repeating the original sign-in redirect.
 */
export const POST_AUTH_ROUTES = {
  'dev-division': '/dev-division/dashboard',
  consulting: '/consulting/dashboard',
} as const satisfies Record<string, string>;

export const DEFAULT_POST_AUTH_ROUTE = '/launch';

function isKnownDest(dest: string): dest is keyof typeof POST_AUTH_ROUTES {
  return Object.hasOwn(POST_AUTH_ROUTES, dest);
}

function isAllowedHost(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') {
    return true;
  }

  const compare = (value: string | undefined): boolean => {
    if (!value) return false;
    try {
      return new URL(value).hostname === hostname;
    } catch {
      return false;
    }
  };

  if (compare(process.env.SHELL_BETTER_AUTH_URL)) return true;

  const cookieDomain = process.env.SHELL_COOKIE_DOMAIN?.trim().replace(/^\./, '');
  if (cookieDomain && (hostname === cookieDomain || hostname.endsWith(`.${cookieDomain}`))) {
    return true;
  }

  for (const origin of (process.env.SHELL_TRUSTED_ORIGINS ?? '').split(',')) {
    if (compare(origin)) return true;
  }

  return false;
}

/**
 * Validate a `next`/`returnTo` value before using it as an OAuth callback.
 * Accepts same-origin paths (`/dashboard`) and absolute http(s) URLs whose
 * host belongs to the umbrella. Returns null for anything else, so an
 * attacker can never turn sign-in into an open redirect.
 */
export function safeReturnTo(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;

  // Relative path. Reject protocol-relative (`//evil`) and backslash tricks.
  if (value.startsWith('/')) {
    if (value.startsWith('//') || value.startsWith('/\\')) return null;
    return value;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (!isAllowedHost(url.hostname)) return null;
  return url.toString();
}

export function resolvePostAuthRoute(
  dest: string | null | undefined,
  next?: string | null,
): string {
  const target = safeReturnTo(next);
  if (target) return target;
  if (dest && isKnownDest(dest)) {
    return `/launch?dest=${dest}`;
  }
  return DEFAULT_POST_AUTH_ROUTE;
}
