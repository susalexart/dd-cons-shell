/**
 * Shared marketing chrome: skip-link + header + footer.
 *
 * Used by `/`, `/pricing`, `/sign-in`, `/sign-up`. Keep it dumb on purpose —
 * P26 brief says "thin custom UI matching the marketing page chrome". No
 * theming context, no client JS. Just slots.
 */
import Link from 'next/link';
import type { ReactNode } from 'react';

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[var(--color-accent)] focus:px-4 focus:py-2 focus:text-[var(--color-accent-fg)] focus:font-semibold"
      >
        Skip to main content
      </a>
      <Header />
      <main id="main" className="min-h-[calc(100vh-12rem)]">
        {children}
      </main>
      <Footer />
    </>
  );
}

function Header() {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          aria-label="dd-cons home"
          className="flex items-center gap-2 font-mono text-base font-semibold tracking-tight text-[var(--color-fg)]"
        >
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-sm bg-[var(--color-accent)]"
          />
          dd<span className="text-[var(--color-fg-muted)]">/</span>cons
        </Link>
        <nav aria-label="Primary">
          <ul className="flex items-center gap-6 text-sm">
            <li>
              <Link
                href="/pricing"
                className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
              >
                Pricing
              </Link>
            </li>
            <li>
              <Link
                href="/sign-in"
                className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[var(--color-fg)] hover:border-[var(--color-accent)]"
              >
                Sign in
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg)] py-10 text-sm text-[var(--color-fg-muted)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 md:flex-row md:items-center md:justify-between">
        <p>
          <span className="font-mono text-[var(--color-fg)]">dd-cons</span> ·
          self-hosted, audited AI tooling
        </p>
        <nav aria-label="Legal">
          <ul className="flex flex-wrap gap-5">
            <li>
              <Link href="/legal/terms" className="hover:text-[var(--color-fg)]">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/legal/privacy" className="hover:text-[var(--color-fg)]">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/legal/cookies" className="hover:text-[var(--color-fg)]">
                Cookies
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
