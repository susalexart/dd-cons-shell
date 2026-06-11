/**
 * Admin console — grant/revoke product access per user.
 *
 * Non-admins get a 404 (notFound) so the page's existence isn't leaked.
 * Zero client JS: plain <form action={serverAction}> toggles.
 */
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '../../lib/auth';
import {
  isShellAdmin,
  listUsers,
  PRODUCT_IDS,
} from '../../lib/entitlements';
import { toggleProduct } from './actions';

export const metadata: Metadata = { title: 'Admin · dd-cons' };
export const dynamic = 'force-dynamic';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/sign-in');
  if (!isShellAdmin(session.user)) notFound();

  const users = listUsers();

  return (
    <>
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
              <li>
                <Link
                  href="/launch"
                  className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                >
                  Launcher
                </Link>
              </li>
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
          User access
        </h1>
        <p className="mt-2 text-[var(--color-fg-muted)]">
          {users.length} user{users.length === 1 ? '' : 's'} · grant or revoke
          product access. Admins always have everything.
        </p>

        {users.length === 0 ? (
          <div className="glass mt-8 rounded-xl px-6 py-8 text-center text-[var(--color-fg-muted)]">
            No users yet — the first sign-up becomes an admin automatically.
          </div>
        ) : (
          <div className="glass mt-8 overflow-x-auto rounded-xl">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wide text-[var(--color-fg-muted)]">
                  <th scope="col" className="px-5 py-3 font-semibold">User</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Joined</th>
                  {PRODUCT_IDS.map((p) => (
                    <th scope="col" key={p} className="px-5 py-3 font-mono font-semibold">
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.id === session.user.id;
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-[var(--color-border)] last:border-b-0"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-[var(--color-fg)]">
                          <span>{u.email}</span>
                          {isSelf && (
                            <span className="text-xs text-[var(--color-fg-muted)]">
                              (you)
                            </span>
                          )}
                          {u.isAdmin && (
                            <span className="rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-xs font-semibold text-[var(--color-accent-fg)]">
                              Admin
                            </span>
                          )}
                        </div>
                        {u.name && (
                          <div className="mt-0.5 text-xs text-[var(--color-fg-muted)]">
                            {u.name}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-[var(--color-fg-muted)]">
                        {formatDate(u.createdAt)}
                      </td>
                      {PRODUCT_IDS.map((p) => {
                        if (u.isAdmin) {
                          return (
                            <td
                              key={p}
                              className="px-5 py-4 text-xs text-[var(--color-fg-muted)]"
                            >
                              always (admin)
                            </td>
                          );
                        }
                        const granted = u.products.includes(p);
                        return (
                          <td key={p} className="px-5 py-4">
                            <form action={toggleProduct}>
                              <input type="hidden" name="userId" value={u.id} />
                              <input type="hidden" name="product" value={p} />
                              <button
                                type="submit"
                                aria-label={`${granted ? 'Revoke' : 'Grant'} ${p} for ${u.email}`}
                                className={
                                  granted
                                    ? 'rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-hover)]'
                                    : 'rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-fg-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-fg)]'
                                }
                              >
                                {granted ? 'Granted ✓' : 'Grant'}
                              </button>
                            </form>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
