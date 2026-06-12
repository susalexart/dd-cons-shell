/**
 * Admin console — grant/revoke product access per user.
 *
 * Non-admins get a 404 (notFound) so the page's existence isn't leaked.
 * Zero client JS: plain <form action={serverAction}> toggles.
 */
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { ShellNav } from '../../components/shell-nav';
import { auth } from '../../lib/auth';
import {
  isShellAdmin,
  listPendingGrants,
  listUsers,
  PRODUCT_IDS,
} from '../../lib/entitlements';
import { addPendingGrant, removeUser, revokePendingGrant, setRole, toggleProduct } from './actions';

export const metadata: Metadata = { title: 'Admin · dd-cons' };
export const dynamic = 'force-dynamic';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Actions redirect back with short codes; thrown Error messages are redacted
// by Next.js in production, so this is the only way operators see a reason.
const ERROR_MESSAGES: Record<string, string> = {
  'email-required': 'Enter an email address to pre-authorize.',
  'invalid-email': 'That does not look like a valid email address.',
  'invalid-request': 'Invalid request — please retry from this page.',
  'unknown-user': 'That user no longer exists.',
  'self-remove': 'You cannot remove yourself.',
  'admin-remove': 'Admins cannot be removed — revoke admin first.',
  'self-role': 'You cannot change your own role.',
  'role-locked':
    'This admin is set by SHELL_ADMIN_EMAILS or first-user bootstrap and cannot be edited here.',
};

const NOTICE_MESSAGES: Record<string, string> = {
  preauthorized: 'Email pre-authorized — access applies on their first sign-in.',
  'granted-existing':
    'That email already has an account, so the selected products were granted to it directly (see the table above).',
  promoted: 'User promoted to admin.',
  demoted: 'Admin role revoked.',
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/sign-in');
  if (!isShellAdmin(session.user)) notFound();

  const { error, notice } = await searchParams;
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? 'Something went wrong.') : null;
  const noticeMessage = notice ? NOTICE_MESSAGES[notice] : null;

  const users = listUsers();
  const pending = listPendingGrants();

  return (
    <>
      <ShellNav active="admin" admin email={session.user.email} />

      <main id="main" className="mx-auto max-w-6xl px-6 py-12">
        {errorMessage && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {errorMessage}
          </div>
        )}
        {noticeMessage && (
          <div
            role="status"
            className="mb-6 rounded-lg border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 px-4 py-3 text-sm text-[var(--color-fg)]"
          >
            {noticeMessage}
          </div>
        )}

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
                  <th scope="col" className="px-5 py-3 font-semibold">Role</th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    <span className="sr-only">Remove</span>
                  </th>
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
                      <td className="px-5 py-4">
                        {u.adminLocked ? (
                          <span className="text-xs text-[var(--color-fg-muted)]">
                            admin (owner)
                          </span>
                        ) : isSelf ? (
                          <span className="text-xs text-[var(--color-fg-muted)]">
                            {u.isAdmin ? 'admin' : 'member'} (you)
                          </span>
                        ) : (
                          <form action={setRole}>
                            <input type="hidden" name="userId" value={u.id} />
                            <input
                              type="hidden"
                              name="role"
                              value={u.isAdmin ? 'member' : 'admin'}
                            />
                            <button
                              type="submit"
                              aria-label={`${u.isAdmin ? 'Revoke admin for' : 'Make admin:'} ${u.email}`}
                              className={
                                u.isAdmin
                                  ? 'rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-hover)]'
                                  : 'rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-fg-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-fg)]'
                              }
                            >
                              {u.isAdmin ? 'Admin ✓' : 'Make admin'}
                            </button>
                          </form>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {!u.isAdmin && !isSelf && (
                          <form action={removeUser}>
                            <input type="hidden" name="userId" value={u.id} />
                            <button
                              type="submit"
                              aria-label={`Remove ${u.email}`}
                              className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-fg-muted)] hover:border-red-400/60 hover:text-red-300"
                            >
                              Remove
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <section aria-labelledby="pending-heading" className="mt-12">
          <h2
            id="pending-heading"
            className="text-xl font-semibold tracking-tight text-[var(--color-fg)]"
          >
            Pre-authorized emails
          </h2>
          <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
            Grant access before someone signs up. When they first sign in with a
            matching email, the products below are applied automatically.
          </p>

          <div className="glass mt-4 rounded-xl px-5 py-5">
            <form action={addPendingGrant} className="flex flex-wrap items-center gap-4">
              <label htmlFor="pending-email" className="sr-only">
                Email address
              </label>
              <input
                id="pending-email"
                name="email"
                type="email"
                required
                placeholder="person@example.com"
                className="w-64 rounded-md border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-muted)] focus:border-[var(--color-accent)] focus:outline-none"
              />
              {PRODUCT_IDS.map((p) => (
                <label
                  key={p}
                  className="flex items-center gap-2 font-mono text-xs text-[var(--color-fg-muted)]"
                >
                  <input
                    type="checkbox"
                    name="product"
                    value={p}
                    className="h-4 w-4 accent-[var(--color-accent)]"
                  />
                  {p}
                </label>
              ))}
              <button
                type="submit"
                className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-hover)]"
              >
                Pre-authorize
              </button>
            </form>

            {pending.length === 0 ? (
              <p className="mt-5 border-t border-[var(--color-border)] pt-4 text-sm text-[var(--color-fg-muted)]">
                No pending pre-authorizations.
              </p>
            ) : (
              <ul className="mt-5 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
                {pending.map((g) => (
                  <li key={g.email} className="flex items-center justify-between gap-4 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm text-[var(--color-fg)]">{g.email}</span>
                      {g.products.length === 0 ? (
                        <span className="text-xs text-[var(--color-fg-muted)]">no products</span>
                      ) : (
                        g.products.map((p) => (
                          <span
                            key={p}
                            className="rounded-full border border-[var(--color-border)] px-2 py-0.5 font-mono text-xs text-[var(--color-fg-muted)]"
                          >
                            {p}
                          </span>
                        ))
                      )}
                    </div>
                    <form action={revokePendingGrant}>
                      <input type="hidden" name="email" value={g.email} />
                      <button
                        type="submit"
                        aria-label={`Revoke pre-authorization for ${g.email}`}
                        className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-fg-muted)] hover:border-red-400/60 hover:text-red-300"
                      >
                        Revoke
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
