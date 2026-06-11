/**
 * Workspace — per-division kanban over the divisions→projects hierarchy.
 *
 * Each division the user is entitled to gets its own board (cyan for
 * dev-division, orange for consulting). Cards are grouped by run state;
 * human approval gates surface as To-Do cards that deep-link into the
 * division to approve — the approval itself always happens inside the
 * division so the hash-chained audit log keeps true operator attribution.
 */
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '../../lib/auth';
import {
  fetchConsultingEngagements,
  fetchDevProjects,
  type PendingGate,
} from '../../lib/board';
import { effectiveProducts, type ProductId } from '../../lib/entitlements';

export const metadata: Metadata = { title: 'Workspace · dd-cons' };
export const dynamic = 'force-dynamic';

type CardStatus = 'empty' | 'waiting' | 'done' | 'failed' | 'running';

interface BoardCard {
  id: string;
  title: string;
  status: CardStatus;
  pendingGate: PendingGate | null;
  lastTs: string | null;
  meta: string | null;
  href: string;
}

const COLUMNS: Array<{ key: 'todo' | 'running' | 'backlog' | 'done' | 'failed'; label: string }> = [
  { key: 'todo', label: 'To do — your approval' },
  { key: 'running', label: 'Running' },
  { key: 'backlog', label: 'Backlog' },
  { key: 'done', label: 'Done' },
  { key: 'failed', label: 'Failed' },
];

function columnOf(status: CardStatus): (typeof COLUMNS)[number]['key'] {
  switch (status) {
    case 'waiting':
      return 'todo';
    case 'running':
      return 'running';
    case 'done':
      return 'done';
    case 'failed':
      return 'failed';
    default:
      return 'backlog';
  }
}

function timeAgo(iso: string | null): string | null {
  if (!iso) return null;
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms) || ms < 0) return null;
  const min = Math.floor(ms / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Card({ card, accentVar }: { card: BoardCard; accentVar: string }) {
  const ago = timeAgo(card.lastTs);
  return (
    <li>
      <a
        href={card.href}
        className="glass block rounded-lg border border-[var(--color-border)] p-3 transition-colors hover:border-[var(--accent,var(--color-accent))]"
        style={{ ['--accent' as string]: `var(${accentVar})` }}
      >
        <p className="font-mono text-sm font-semibold text-[var(--color-fg)]">{card.title}</p>
        {card.pendingGate ? (
          <p className="mt-1.5 text-xs font-semibold" style={{ color: `var(${accentVar})` }}>
            Approve “{card.pendingGate.gate}” gate →
          </p>
        ) : null}
        <p className="mt-1.5 flex flex-wrap gap-x-2 text-xs text-[var(--color-dim)]">
          {card.meta ? <span>{card.meta}</span> : null}
          {ago ? <span>{ago}</span> : null}
        </p>
      </a>
    </li>
  );
}

function Board({
  title,
  accentVar,
  cards,
  unreachable,
  openHref,
}: {
  title: string;
  accentVar: string;
  cards: BoardCard[];
  unreachable: boolean;
  openHref: string;
}) {
  const active = cards.filter((c) => c.status === 'running' || c.status === 'waiting');
  return (
    <section aria-label={`${title} workspace`} className="mt-10">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="flex items-center gap-2 font-mono text-xl font-semibold text-[var(--color-fg)]">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ background: `var(${accentVar})` }}
          />
          {title}
        </h2>
        {/* Hierarchy strip: division → active projects */}
        <p className="text-sm text-[var(--color-fg-muted)]">
          {active.length > 0 ? (
            <>
              <span aria-hidden="true">└─ </span>
              {active.map((c) => c.title).join(' · ')}
            </>
          ) : (
            'no active projects'
          )}
        </p>
        <a
          href={openHref}
          className="ml-auto text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
        >
          Open division ↗
        </a>
      </div>

      {unreachable ? (
        <p
          role="status"
          className="glass mt-4 rounded-lg px-4 py-3 text-sm text-[var(--color-fg-muted)]"
        >
          Division API unreachable right now — the board will populate once it is back.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          {COLUMNS.map((col) => {
            const colCards = cards.filter((c) => columnOf(c.status) === col.key);
            return (
              <div key={col.key} className="rounded-xl border border-[var(--color-border)] p-3">
                <h3 className="flex items-baseline justify-between text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">
                  {col.label}
                  <span className="font-mono">{colCards.length}</span>
                </h3>
                <ul className="mt-3 space-y-2">
                  {colCards.map((card) => (
                    <Card key={card.id} card={card} accentVar={accentVar} />
                  ))}
                </ul>
                {colCards.length === 0 ? (
                  <p className="mt-3 text-xs text-[var(--color-dim)]">—</p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default async function WorkspacePage() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session) redirect('/sign-in');

  const user = session.user as typeof session.user & { products?: string | null };
  const entitled = new Set<ProductId>(effectiveProducts(user));
  const cookie = reqHeaders.get('cookie');

  const domain = process.env.DEPLOY_DOMAIN || 'localhost';
  const devPublic = `https://dev-division.${domain}`;
  const consultingPublic = `https://consulting.${domain}`;

  const [devProjects, engagements] = await Promise.all([
    entitled.has('dev-division') ? fetchDevProjects(cookie) : Promise.resolve(null),
    entitled.has('consulting') ? fetchConsultingEngagements(cookie) : Promise.resolve(null),
  ]);

  const devCards: BoardCard[] = (devProjects ?? []).map((p) => ({
    id: `dev:${p.name}`,
    title: p.name,
    status: p.status,
    pendingGate: p.pendingGate ?? null,
    lastTs: p.lastTimestamp,
    meta: p.deployed ? 'deployed' : (p.lastEvent ?? null),
    href: `${devPublic}/dashboard/projects/${encodeURIComponent(p.name)}`,
  }));

  const consultingCards: BoardCard[] = (engagements ?? []).map((e) => ({
    id: `cons:${e.projectId}`,
    title: e.projectId,
    status: e.status,
    pendingGate: e.pendingGate,
    lastTs: e.lastTs,
    meta: e.lastType,
    href: `${consultingPublic}/engagements`,
  }));

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

      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-fg)]">Workspace</h1>
        <p className="mt-2 text-[var(--color-fg-muted)]">
          Your divisions and their projects — approval gates waiting on you land in “To do”.
        </p>

        {entitled.size === 0 && (
          <div role="status" className="glass mt-8 rounded-xl px-6 py-5 text-[var(--color-fg)]">
            <p className="font-semibold">Your account is awaiting access.</p>
            <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
              Once a workspace admin grants you a division, its board appears here.
            </p>
          </div>
        )}

        {entitled.has('dev-division') && (
          <Board
            title="dev-division"
            accentVar="--color-accent"
            cards={devCards}
            unreachable={devProjects === null}
            openHref={`${devPublic}/dashboard`}
          />
        )}

        {entitled.has('consulting') && (
          <Board
            title="consulting team"
            accentVar="--color-violet"
            cards={consultingCards}
            unreachable={engagements === null}
            openHref={`${consultingPublic}/`}
          />
        )}
      </main>
    </>
  );
}
