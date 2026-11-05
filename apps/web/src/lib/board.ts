/**
 * Workspace kanban data plane.
 *
 * The shell fetches each division's own API over the compose network,
 * forwarding the user's shell session cookie verbatim. Both divisions run
 * AUTH_MODE=shell (they verify that cookie against this shell's
 * /api/auth/get-session), so the board shows exactly what the same user
 * would see inside the division — consulting's owner-scoped tenancy and
 * dev-division's workspace membership both apply unchanged. No service
 * identity, no second auth surface.
 *
 * A division being unreachable degrades to `null` (the board renders an
 * "unreachable" note) — never an error page.
 */

export interface PendingGate {
  gate: string;
  runId: string;
  suspendedAt: string;
}

export interface DevProject {
  name: string;
  events: number;
  lastEvent: string | null;
  lastTimestamp: string | null;
  deployed: boolean;
  status: 'empty' | 'waiting' | 'done' | 'failed' | 'running';
  pendingGate?: PendingGate | null;
}

export interface ConsultingEngagement {
  projectId: string;
  status: 'empty' | 'waiting' | 'done' | 'failed' | 'running';
  pendingGate: PendingGate | null;
  latestRunId: string | null;
  lastType: string | null;
  lastTs: string | null;
  events: number;
}

const FETCH_TIMEOUT_MS = 5_000;

/**
 * Division base URL. In compose the shell talks to service DNS; on a single
 * host (the current systemd deployment) it talks to loopback; with neither
 * env set it falls back to the product vhost. Previously an unset env made
 * /workspace render every board as "unreachable".
 */
function divisionBase(envName: string, product: 'dev-division' | 'consulting'): string {
  const explicit = process.env[envName]?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');

  const domain =
    process.env.DEPLOY_DOMAIN?.trim() ||
    process.env.SHELL_COOKIE_DOMAIN?.trim().replace(/^\./, '') ||
    'localhost';
  if (domain === 'localhost') {
    return product === 'dev-division' ? 'http://127.0.0.1:5173' : 'http://127.0.0.1:5174';
  }
  return `https://${product}.${domain}`;
}

async function divisionGet<T>(
  base: string | undefined,
  path: string,
  cookie: string | null,
): Promise<T | null> {
  if (!base) return null;
  try {
    const res = await fetch(`${base.replace(/\/+$/, '')}${path}`, {
      headers: cookie ? { cookie } : undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchDevProjects(cookie: string | null): Promise<DevProject[] | null> {
  const data = await divisionGet<DevProject[]>(
    divisionBase('DEV_DIVISION_INTERNAL_URL', 'dev-division'),
    '/api/projects',
    cookie,
  );
  return Array.isArray(data) ? data : null;
}

export async function fetchConsultingEngagements(
  cookie: string | null,
): Promise<ConsultingEngagement[] | null> {
  const data = await divisionGet<{ engagements: ConsultingEngagement[] }>(
    divisionBase('CONSULTING_INTERNAL_URL', 'consulting'),
    '/api/consulting/engagements',
    cookie,
  );
  return data && Array.isArray(data.engagements) ? data.engagements : null;
}
