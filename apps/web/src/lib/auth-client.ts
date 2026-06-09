/**
 * Browser-side better-auth client. Used by /sign-in, /sign-up, /sign-out.
 *
 * Same-origin: the catch-all route at /api/auth/* serves the issuer, so the
 * client just needs to point at the current origin. In SSR contexts the env
 * var override (SHELL_BETTER_AUTH_URL) keeps it honest.
 */
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL:
    typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_SHELL_BETTER_AUTH_URL ?? 'http://localhost:3000')
      : window.location.origin,
});
