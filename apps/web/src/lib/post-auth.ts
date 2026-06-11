/**
 * Single source of truth for where a user lands after authentication.
 *
 * Every sign-in lands on the product launcher (/launch) — it shows exactly
 * the products the user is entitled to, a pending-access state for new
 * sign-ups, and admin ops links. A known `dest` is carried through as a
 * query param so the launcher can highlight the intended product card.
 */
export const POST_AUTH_ROUTES = {
  'dev-division': '/dev-division/dashboard',
  consulting: '/consulting/dashboard',
} as const satisfies Record<string, string>;

export const DEFAULT_POST_AUTH_ROUTE = '/launch';

function isKnownDest(dest: string): dest is keyof typeof POST_AUTH_ROUTES {
  return Object.prototype.hasOwnProperty.call(POST_AUTH_ROUTES, dest);
}

export function resolvePostAuthRoute(dest: string | null | undefined): string {
  if (dest && isKnownDest(dest)) {
    return `/launch?dest=${dest}`;
  }
  return DEFAULT_POST_AUTH_ROUTE;
}
