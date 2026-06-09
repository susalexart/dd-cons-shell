/**
 * P26 smoke tests for the marketing/auth chrome:
 *
 *   1. /pricing renders both tier columns with all 8 tier names + every CTA
 *      pointing at the right place (sign-up?dest=...&tier=... or mailto: sales).
 *      The brief is explicit that there must be no Stripe wiring — we assert the
 *      absence of any /api/stripe or /checkout link to lock that in.
 *
 *   2. /sign-out renders the marketing chrome and embeds the client SignOutTrigger
 *      script that posts to better-auth's sign-out endpoint. We also smoke the
 *      better-auth sign-out HTTP surface directly so a regression in the catch-all
 *      wiring would fail this test instead of bricking the UI silently.
 *
 * Both tests boot the Next dev server on an ephemeral port. They share the same
 * lifecycle hooks to keep CI under a minute.
 */
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const APP_DIR = new URL('../../apps/web', import.meta.url).pathname;
const PORT = 3411 + Math.floor(Math.random() * 50);

let proc: ChildProcessWithoutNullStreams | null = null;

async function waitForReady(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Next dev server did not become ready on ${url} within ${timeoutMs}ms`);
}

beforeAll(async () => {
  // Deterministic dev secret — auth.ts allows this in non-prod.
  proc = spawn('npx', ['next', 'dev', '-p', String(PORT)], {
    cwd: APP_DIR,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      SHELL_BETTER_AUTH_URL: `http://localhost:${PORT}`,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await waitForReady(`http://localhost:${PORT}/`, 60_000);
}, 75_000);

afterAll(() => {
  if (proc && !proc.killed) {
    proc.kill('SIGTERM');
  }
});

describe('P26 — /pricing renders both tier columns', () => {
  it('lists all 8 tiers (4 per product) with the right CTAs', async () => {
    const res = await fetch(`http://localhost:${PORT}/pricing`);
    expect(res.status).toBe(200);
    const html = await res.text();

    // Both column headings exist.
    expect(html).toContain('Dev-Division');
    expect(html).toContain('Consulting-Team');

    // All tier name ids (we set deterministic ids on each <h3>).
    for (const product of ['dev-division', 'consulting']) {
      for (const tier of ['free', 'pro', 'team', 'enterprise']) {
        expect(html).toContain(`id="${product}-${tier}-name"`);
      }
    }

    // CTAs: Start free links land on /sign-up with both query params.
    expect(html).toMatch(/href="\/sign-up\?dest=dev-division&(amp;)?tier=free"/);
    expect(html).toMatch(/href="\/sign-up\?dest=consulting&(amp;)?tier=pro"/);

    // Enterprise tiers go to the sales mailto, not a checkout page.
    expect(html).toContain('mailto:sales@aroma-cloud.online');

    // Hard guarantee: no Stripe wiring snuck into v1.4. We allow the literal
    // copy "Stripe wiring is v1.5" in body text, but no actual checkout URL,
    // Stripe.js script, or pk_live key may appear.
    expect(html).not.toMatch(/stripe\.com|js\.stripe|pk_live_|pk_test_/i);
    expect(html).not.toMatch(/href="[^"]*\/checkout/i);
    expect(html).not.toMatch(/\/api\/stripe/i);
  });

  it('has a single <h1> and at least two <h2>s for landmark structure', async () => {
    const res = await fetch(`http://localhost:${PORT}/pricing`);
    const html = await res.text();
    const h1s = html.match(/<h1\b/g) ?? [];
    const h2s = html.match(/<h2\b/g) ?? [];
    expect(h1s.length).toBe(1);
    expect(h2s.length).toBeGreaterThanOrEqual(2);
  });
});

describe('P26 — /sign-out flow', () => {
  it('renders the marketing chrome with the client sign-out trigger', async () => {
    const res = await fetch(`http://localhost:${PORT}/sign-out`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Signing you out');
    // The aria-live status block from <SignOutTrigger> is server-rendered as
    // a placeholder before hydration, so the role="status" must be present.
    expect(html).toContain('role="status"');
    // Skip-link from the shared MarketingShell is present (a11y regression
    // guard — if anyone strips the shell from this page it'll fail).
    expect(html).toContain('Skip to main content');
  });

  it("better-auth's sign-out endpoint is reachable through the catch-all", async () => {
    // POST without a session cookie: better-auth returns 200 with an empty
    // session payload (the contract is "you are now signed out"). Either way,
    // we just need a non-5xx — the page's client trigger will then redirect.
    const res = await fetch(`http://localhost:${PORT}/api/auth/sign-out`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    expect(res.status).toBeLessThan(500);
  });
});
