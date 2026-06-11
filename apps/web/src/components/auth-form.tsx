'use client';

/**
 * Shared <AuthForm> for /sign-in and /sign-up.
 *
 * better-auth handles new-user creation on first social login automatically —
 * the two pages render the same primitives but differ in copy. We keep one
 * component so the chrome and a11y are identical.
 */
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { authClient } from '../lib/auth-client';
import { resolvePostAuthRoute } from '../lib/post-auth';

type Mode = 'sign-in' | 'sign-up';

export function AuthForm({ mode }: { mode: Mode }) {
  const params = useSearchParams();
  const dest = params.get('dest');
  const callbackURL = resolvePostAuthRoute(dest);

  const [loading, setLoading] = useState<'github' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signInWith(provider: 'github' | 'google') {
    setError(null);
    setLoading(provider);
    try {
      await authClient.signIn.social({ provider, callbackURL });
      // better-auth navigates the window for OAuth — control rarely returns here.
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Sign-in failed. Please try again.',
      );
      setLoading(null);
    }
  }

  const heading = mode === 'sign-in' ? 'Welcome back' : 'Create your account';
  const sub =
    mode === 'sign-in'
      ? 'Sign in with the same account on either product.'
      : 'One account, both products. First social login creates your user.';

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">{heading}</h1>
      <p className="mt-2 text-[var(--color-fg-muted)]">{sub}</p>

      <p className="mt-4 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elev)] px-4 py-2 text-sm text-[var(--color-fg-muted)]">
        After auth you&apos;ll land on your product launcher.
      </p>

      <div className="mt-8 space-y-3">
        <button
          type="button"
          onClick={() => signInWith('github')}
          disabled={loading !== null}
          className="glow-mint flex w-full items-center justify-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elev)] px-4 py-3 font-semibold text-[var(--color-fg)] transition-shadow hover:border-[var(--color-accent)] disabled:opacity-60"
        >
          {loading === 'github' ? 'Redirecting…' : 'Continue with GitHub'}
        </button>
        <button
          type="button"
          onClick={() => signInWith('google')}
          disabled={loading !== null}
          className="glow-violet flex w-full items-center justify-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elev)] px-4 py-3 font-semibold text-[var(--color-fg)] transition-shadow hover:border-[var(--color-violet)] disabled:opacity-60"
        >
          {loading === 'google' ? 'Redirecting…' : 'Continue with Google'}
        </button>
      </div>

      {/* aria-live so screen readers announce errors without taking focus. */}
      <div
        role="status"
        aria-live="polite"
        className="mt-4 min-h-[1.5rem] text-sm text-[var(--color-fg-muted)]"
      >
        {error ? (
          <p className="rounded-md border border-red-700/40 bg-red-950/40 px-3 py-2 text-red-200">
            {error}
          </p>
        ) : null}
      </div>

      <p className="mt-8 text-sm text-[var(--color-fg-muted)]">
        {mode === 'sign-in' ? (
          <>
            New here?{' '}
            <a
              href={`/sign-up${dest ? `?dest=${dest}` : ''}`}
              className="text-[var(--color-accent)] underline underline-offset-4"
            >
              Create an account
            </a>
            .
          </>
        ) : (
          <>
            Already have an account?{' '}
            <a
              href={`/sign-in${dest ? `?dest=${dest}` : ''}`}
              className="text-[var(--color-accent)] underline underline-offset-4"
            >
              Sign in
            </a>
            .
          </>
        )}
      </p>
    </div>
  );
}
