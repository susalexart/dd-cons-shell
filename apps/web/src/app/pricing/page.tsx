import Link from 'next/link';
import { MarketingShell } from '../../components/marketing-shell';

type Tier = {
  name: string;
  price: string;
  tagline: string;
  features: string[];
  cta:
    | { kind: 'signup'; tier: string }
    | { kind: 'sales' };
  highlighted?: boolean;
};

// Capabilities pulled from /home/ubuntu/dev-devision/.planning/STATE.md P22–P24
// + Provider-Routing cross-cut. Wording mirrors the audited capability list
// so we're not over-promising — the brief is explicit about reflecting v1.3.
const DEV_DIVISION_TIERS: Tier[] = [
  {
    name: 'Free',
    price: '$0/mo',
    tagline: 'Kick the tires.',
    features: [
      '1 project, 1 operator seat',
      'Six-role spine (PM → Architect → Delivery → Engineer → QA → DevOps)',
      'Hash-chained audit log',
      'SQLite vault (local only, no remote backup)',
      'Community Discord support',
    ],
    cta: { kind: 'signup', tier: 'free' },
  },
  {
    name: 'Pro',
    price: '$29/mo',
    tagline: 'Solo builder, real projects.',
    features: [
      'Unlimited projects, 1 operator seat',
      'Postgres-persistent storage (P22)',
      'Runtime error reporter with HMAC-signed events (P23)',
      'Pre-deploy npm install preflight + Dokploy log tail (P24)',
      'Email support, 48h response',
    ],
    cta: { kind: 'signup', tier: 'pro' },
    highlighted: true,
  },
  {
    name: 'Team',
    price: '$99/mo',
    tagline: 'A founding team.',
    features: [
      'Everything in Pro',
      'Up to 10 operator seats with admin/operator/viewer RBAC',
      'Workspace tenancy + per-workspace audit export',
      'Provider routing across Architect / Engineer / Dev Lead model kinds',
      'Priority support, 24h response',
    ],
    cta: { kind: 'signup', tier: 'team' },
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    tagline: 'Self-hosted, your infra.',
    features: [
      'Everything in Team',
      'Self-hosted Docker Compose with Caddy TLS',
      'BYO Postgres + S3-compatible vault backup',
      'SSO (OIDC) + SAML on request',
      'Custom SLA',
    ],
    cta: { kind: 'sales' },
  },
];

// Capabilities pulled from /home/ubuntu/consulting-agency/README.md —
// five-agent crew, deterministic citation verification, per-engagement RAG vault,
// custom Mastra scorers.
const CONSULTING_TIERS: Tier[] = [
  {
    name: 'Free',
    price: '$0/mo',
    tagline: 'One engagement to start.',
    features: [
      '1 engagement, 1 operator seat',
      'Researcher → Sceptic → Synthesiser → Editor crew',
      'Per-engagement RAG vault (local SQLite)',
      'Deterministic citation verification (web.verify_citation)',
      'Community Discord support',
    ],
    cta: { kind: 'signup', tier: 'free' },
  },
  {
    name: 'Pro',
    price: '$29/mo',
    tagline: 'Vendor due-diligence, weekly.',
    features: [
      'Unlimited engagements, 1 operator seat',
      'Three human-in-the-loop approval gates',
      'Citation-overlap + claim-faithfulness scorers',
      'PII redaction on Synthesiser + Editor inputs',
      'Email support, 48h response',
    ],
    cta: { kind: 'signup', tier: 'pro' },
    highlighted: true,
  },
  {
    name: 'Team',
    price: '$99/mo',
    tagline: 'A consulting practice.',
    features: [
      'Everything in Pro',
      'Up to 10 operator seats with role-scoped access',
      'Per-engagement audit replay export',
      'Provider routing (Synthesiser → Kimi K2.6, Editor → Opus)',
      'Priority support, 24h response',
    ],
    cta: { kind: 'signup', tier: 'team' },
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    tagline: 'Self-hosted, your infra.',
    features: [
      'Everything in Team',
      'Self-hosted Docker Compose with Caddy TLS',
      'BYO Postgres + S3-compatible vault backup',
      'SSO (OIDC) + SAML on request',
      'Custom SLA',
    ],
    cta: { kind: 'sales' },
  },
];

function tierHref(product: 'dev-division' | 'consulting', tier: Tier): string {
  if (tier.cta.kind === 'sales') return 'mailto:sales@aroma-cloud.online';
  return `/sign-up?dest=${product}&tier=${tier.cta.tier}`;
}

function tierCtaLabel(tier: Tier): string {
  return tier.cta.kind === 'sales' ? 'Contact sales' : 'Start free';
}

function TierCard({
  product,
  tier,
  accent,
}: {
  product: 'dev-division' | 'consulting';
  tier: Tier;
  accent: string;
}) {
  return (
    <article
      className={`flex flex-col rounded-lg border bg-[var(--color-bg)] p-6 ${
        tier.highlighted
          ? 'border-[color:var(--color-accent)]'
          : 'border-[var(--color-border)]'
      }`}
      aria-labelledby={`${product}-${tier.name.toLowerCase()}-name`}
    >
      <div className="flex items-baseline justify-between">
        <h3
          id={`${product}-${tier.name.toLowerCase()}-name`}
          className="text-lg font-semibold"
        >
          {tier.name}
        </h3>
        {tier.highlighted && (
          <span
            className="rounded-full px-2 py-0.5 font-mono text-xs"
            style={{ backgroundColor: accent, color: 'var(--color-accent-fg)' }}
          >
            popular
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{tier.tagline}</p>
      <p className="mt-4 text-3xl font-semibold tracking-tight">{tier.price}</p>

      <ul className="mt-6 flex-1 space-y-2 text-sm">
        {tier.features.map((f) => (
          <li key={f} className="flex gap-2">
            <span aria-hidden="true" style={{ color: accent }}>
              ✓
            </span>
            <span className="text-[var(--color-fg)]">{f}</span>
          </li>
        ))}
      </ul>

      <Link
        href={tierHref(product, tier)}
        className={`mt-6 inline-block rounded-md px-4 py-2 text-center font-semibold ${
          tier.highlighted
            ? 'bg-[var(--color-accent)] text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-hover)]'
            : 'border border-[var(--color-border)] text-[var(--color-fg)] hover:border-[color:var(--color-accent)]'
        }`}
      >
        {tierCtaLabel(tier)}
      </Link>
    </article>
  );
}

export const metadata = {
  title: 'Pricing · dd-cons',
  description:
    'Free, Pro, Team, Enterprise — for Dev-Division and Consulting-Team. Same audit invariant across every tier.',
};

export default function PricingPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-8">
        <h1 className="text-balance text-4xl font-semibold tracking-tight">
          Pricing — pick a product, pick a tier.
        </h1>
        <p className="mt-4 max-w-2xl text-[var(--color-fg-muted)]">
          Every tier ships the same audit invariant: per-project hash-chained
          events with operator attribution. Higher tiers add seats, persistence,
          and self-host options.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-10 md:grid-cols-2">
          <div aria-labelledby="dev-division-heading">
            <header className="mb-6">
              <h2
                id="dev-division-heading"
                className="font-mono text-sm uppercase tracking-wider text-[var(--color-accent)]"
              >
                Dev-Division
              </h2>
              <p className="mt-1 text-xl font-semibold">
                Idea → running code skeleton.
              </p>
            </header>
            <div className="grid gap-4">
              {DEV_DIVISION_TIERS.map((t) => (
                <TierCard
                  key={t.name}
                  product="dev-division"
                  tier={t}
                  accent="var(--color-accent)"
                />
              ))}
            </div>
          </div>

          <div aria-labelledby="consulting-heading">
            <header className="mb-6">
              <h2
                id="consulting-heading"
                className="font-mono text-sm uppercase tracking-wider text-[var(--color-violet)]"
              >
                Consulting-Team
              </h2>
              <p className="mt-1 text-xl font-semibold">
                Brief → cited deliverable.
              </p>
            </header>
            <div className="grid gap-4">
              {CONSULTING_TIERS.map((t) => (
                <TierCard
                  key={t.name}
                  product="consulting"
                  tier={t}
                  accent="var(--color-violet)"
                />
              ))}
            </div>
          </div>
        </div>

        <p className="mt-12 text-sm text-[var(--color-fg-muted)]">
          No Stripe wiring yet — &ldquo;Start free&rdquo; lands you in the
          product sign-up. Billing is a v1.5 phase. The{' '}
          <code className="font-mono">umbrellaSubs</code> column on your user
          row is reserved for it.
        </p>
      </section>
    </MarketingShell>
  );
}
