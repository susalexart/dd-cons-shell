'use client';

import { useEffect, useState } from 'react';
import { authClient } from '../../lib/auth-client';

/**
 * Posts to better-auth's /api/auth/sign-out endpoint on mount via the
 * client helper, then redirects home. Renders an aria-live status so SR
 * users hear the outcome.
 */
export function SignOutTrigger() {
  const [status, setStatus] = useState<'pending' | 'done' | 'error'>('pending');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await authClient.signOut();
        if (cancelled) return;
        setStatus('done');
        // Tiny delay so the confirmation flashes before the redirect.
        setTimeout(() => {
          window.location.assign('/');
        }, 400);
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <p
      role="status"
      aria-live="polite"
      className="mt-6 text-sm text-[var(--color-fg-muted)]"
    >
      {status === 'pending' && 'Working…'}
      {status === 'done' && 'Signed out. Redirecting…'}
      {status === 'error' && (
        <>
          Sign-out failed. <a href="/" className="underline">Go home</a>.
        </>
      )}
    </p>
  );
}
