/**
 * Single source of truth for where a user lands after authentication.
 *
 * The shell is a session issuer, not a product — landing on the static
 * marketing page after OAuth makes a signed-in user look signed out
 * (the "sign-in loop"). So the default is the dev-division dashboard,
 * never '/'.
 */
export const POST_AUTH_ROUTES = {
  'dev-division': '/dev-division/dashboard',
  consulting: '/consulting/dashboard',
} as const satisfies Record<string, string>;

export const DEFAULT_POST_AUTH_ROUTE = POST_AUTH_ROUTES['dev-division'];

function isKnownDest(dest: string): dest is keyof typeof POST_AUTH_ROUTES {
  return Object.prototype.hasOwnProperty.call(POST_AUTH_ROUTES, dest);
}

export function resolvePostAuthRoute(dest: string | null | undefined): string {
  if (dest && isKnownDest(dest)) {
    return POST_AUTH_ROUTES[dest];
  }
  return DEFAULT_POST_AUTH_ROUTE;
}
