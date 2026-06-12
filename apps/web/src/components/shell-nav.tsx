/**
 * Global navigation — rendered on every authenticated shell page so the
 * workspace switcher, both division entries, and the chat trigger are always
 * one click away. The division apps (dev-division, consulting-agency) render
 * their own mirror of this strip, so the same destinations are reachable no
 * matter which surface the operator is on.
 */
import Link from 'next/link';

export type ShellNavActive = 'workspace' | 'launch' | 'admin';

export function ShellNav({
  admin = false,
  email,
  active,
}: {
  admin?: boolean;
  email?: string | null;
  active?: ShellNavActive;
}) {
  const domain = process.env.DEPLOY_DOMAIN || 'localhost';
  const devPublic = `https://dev-division.${domain}`;
  const consultingPublic = `https://consulting.${domain}`;

  const mutedLink = 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]';
  const activeLink = 'font-semibold text-[var(--color-fg)]';

  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-y-2 px-6 py-4">
        <div className="flex flex-wrap items-center gap-5">
          <Link
            href="/launch"
            className="flex items-center gap-2 font-mono text-base font-semibold tracking-tight text-[var(--color-fg)]"
          >
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 rounded-sm bg-[var(--color-accent)]"
            />
            dd<span className="text-[var(--color-fg-muted)]">/</span>cons
          </Link>
          <nav aria-label="Primary">
            <ul className="flex flex-wrap items-center gap-4 text-sm">
              <li>
                <Link
                  href="/workspace"
                  aria-current={active === 'workspace' ? 'page' : undefined}
                  className={`rounded-md border px-3 py-1.5 ${
                    active === 'workspace'
                      ? 'border-[var(--color-accent)] text-[var(--color-fg)]'
                      : 'border-[var(--color-border)] text-[var(--color-fg)] hover:border-[var(--color-accent)]'
                  }`}
                >
                  Workspace
                </Link>
              </li>
              <li>
                <a
                  href={`${devPublic}/dashboard`}
                  className={`flex items-center gap-1.5 ${mutedLink}`}
                >
                  <span
                    aria-hidden="true"
                    className="inline-block h-2 w-2 rounded-sm bg-[var(--color-accent)]"
                  />
                  dev-division <span aria-hidden="true">↗</span>
                </a>
              </li>
              <li>
                <a href={`${consultingPublic}/`} className={`flex items-center gap-1.5 ${mutedLink}`}>
                  <span
                    aria-hidden="true"
                    className="inline-block h-2 w-2 rounded-sm bg-[var(--color-violet)]"
                  />
                  consulting <span aria-hidden="true">↗</span>
                </a>
              </li>
              <li>
                <a href={`${devPublic}/dashboard/chat`} className={mutedLink}>
                  Chat <span aria-hidden="true">↗</span>
                </a>
              </li>
              <li>
                <Link
                  href="/launch"
                  aria-current={active === 'launch' ? 'page' : undefined}
                  className={active === 'launch' ? activeLink : mutedLink}
                >
                  Launcher
                </Link>
              </li>
              {admin && (
                <li>
                  <Link
                    href="/admin"
                    aria-current={active === 'admin' ? 'page' : undefined}
                    className={active === 'admin' ? activeLink : mutedLink}
                  >
                    Admin
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
        <nav aria-label="Account">
          <ul className="flex items-center gap-5 text-sm">
            {email && (
              <li className="hidden text-[var(--color-fg-muted)] sm:block">{email}</li>
            )}
            <li>
              <Link href="/sign-out" className={mutedLink}>
                Sign out
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
