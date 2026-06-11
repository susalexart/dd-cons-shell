/**
 * Product launcher — every sign-in lands here.
 *
 * Shows exactly the products the user is entitled to (locked cards for the
 * rest), a pending-access banner for brand-new sign-ups, and an admin-only
 * ops strip (Langfuse / Forgejo / Dokploy / Studio) per entitled product.
 */
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '../../lib/auth';
import {
  effectiveProducts,
  isShellAdmin,
  PRODUCT_IDS,
  type ProductId,
} from '../../lib/entitlements';
import { POST_AUTH_ROUTES } from '../../lib/post-auth';
import { serviceLinks } from '../../lib/services';

export const metadata: Metadata = { title: 'Launcher · dd-cons' };
export const dynamic = 'force-dynamic';

const PRODUCT_META: Record<
  ProductId,
  { name: string; tagline: string; accentVar: string; glow: string }
> = {
  'dev-division': {
    name: 'dev-division',
    tagline:
      'Six AI roles take a business idea to a running code skeleton — every handoff captured in a tamper-evident audit log.',
    accentVar: '--color-accent',
    glow: 'glow-mint',
  },
  consulting: {
    name: 'consulting team',
    tagline:
      'An AI consulting practice that researches, analyses and ships client-ready deliverables end to end.',
    accentVar: '--color-violet',
    glow: 'glow-violet',
  },
};

export default async function LaunchPage({
  searchParams,
}: {
  searchParams: Promise<{ dest?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/sign-in');

  const user = session.user as typeof session.user & { products?: string | null };
  const admin = isShellAdmin(user);
  const entitled = new Set(effectiveProducts(user));
  const { dest } = await searchParams;
  const highlighted = PRODUCT_IDS.find((p) => p === dest) ?? null;

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[var(--color-accent)] focus:px-4 focus:py-2 focus:font-semibold focus:text-[var(--color-accent-fg)]"
      >
        Skip to main content
      </a>

      <header className="border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="flex items-center gap-2 font-mono text-base font-semibold tracking-tight text-[var(--color-fg)]">
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 rounded-sm bg-[var(--color-accent)]"
            />
            dd<span className="text-[var(--color-fg-muted)]">/</span>cons
          </span>
          <nav aria-label="Account">
            <ul className="flex items-center gap-5 text-sm">
              <li className="hidden text-[var(--color-fg-muted)] sm:block">
                {user.email}
              </li>
              <li>
                <Link
                  href="/workspace"
                  className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[var(--color-fg)] hover:border-[var(--color-accent)]"
                >
                  Workspace
                </Link>
              </li>
              {admin && (
                <li>
                  <Link
                    href="/admin"
                    className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[var(--color-fg)] hover:border-[var(--color-accent)]"
                  >
                    Admin
                  </Link>
                </li>
              )}
              <li>
                <Link
                  href="/sign-out"
                  className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                >
                  Sign out
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-fg)]">
          Your products
        </h1>
        <p className="mt-2 text-[var(--color-fg-muted)]">
          {admin
            ? 'You have admin access to everything below.'
            : 'Open a product, or ask your workspace admin to unlock more.'}
        </p>

        {entitled.size === 0 && (
          <div
            role="status"
            className="glass mt-8 rounded-xl px-6 py-5 text-[var(--color-fg)]"
          >
            <p className="font-semibold">Your account is awaiting access.</p>
            <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
              Your sign-up is visible to the workspace admins — once they grant
              you a product, it will unlock here automatically.
            </p>
          </div>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {PRODUCT_IDS.map((id) => {
            const meta = PRODUCT_META[id];
            const open = entitled.has(id);
            const isHighlighted = highlighted === id;
            return (
              <section
                key={id}
                aria-label={
                  open ? meta.name : `${meta.name} (locked — access not granted)`
                }
                className={`glass relative flex flex-col rounded-xl p-6 transition-shadow ${
                  open ? meta.glow : 'opacity-60'
                } ${isHighlighted ? 'ring-2 ring-[var(--color-accent)]' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-mono text-lg font-semibold text-[var(--color-fg)]">
                    <span
                      aria-hidden="true"
                      className="inline-block h-2.5 w-2.5 rounded-sm"
                      style={{ background: `var(${meta.accentVar})` }}
                    />
                    {meta.name}
                  </h2>
                  {!open && (
                    <span className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">
                      Locked
                    </span>
                  )}
                </div>

                <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--color-fg-muted)]">
                  {meta.tagline}
                </p>

                {open ? (
                  <Link
                    href={POST_AUTH_ROUTES[id]}
                    className="mt-6 inline-flex w-fit items-center gap-1.5 rounded-md px-4 py-2 font-semibold text-[var(--color-accent-fg)]"
                    style={{ background: `var(${meta.accentVar})` }}
                  >
                    Open <span aria-hidden="true">→</span>
                  </Link>
                ) : (
                  <p className="mt-6 text-sm text-[var(--color-fg-muted)]">
                    You don&apos;t have access yet — ask your workspace admin to
                    grant it.
                  </p>
                )}

                {admin && open && (
                  <div className="mt-6 border-t border-[var(--color-border)] pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">
                      Operations
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {serviceLinks(id).map((svc) => (
                        <li key={svc.label}>
                          <a
                            href={svc.href}
                            {...(svc.external
                              ? { target: '_blank', rel: 'noopener' }
                              : {})}
                            title={svc.note}
                            className="inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-fg)] hover:border-[var(--color-accent)]"
                          >
                            {svc.label}
                            {svc.external && <span aria-hidden="true">↗</span>}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </main>
    </>
  );
}
