import Link from 'next/link';
import { HeroStage } from '../components/hero-stage';
import { MarketingShell } from '../components/marketing-shell';
import { RevealOnScroll } from '../components/reveal-on-scroll';

export default function HomePage() {
  return (
    <MarketingShell>
      {/* ---------- Hero: cathedral video stage ---------- */}
      <HeroStage>
        <p className="mb-6 inline-block rounded-full border border-[var(--glass-border)] bg-[color-mix(in_oklch,var(--color-bg)_60%,transparent)] px-3 py-1 font-mono text-xs text-[var(--color-fg-muted)] backdrop-blur">
          Two products · one sign-in · every step audited
        </p>
        <h1 className="max-w-5xl text-balance text-7xl font-extrabold leading-[0.95] tracking-tight md:text-8xl lg:text-9xl">
          Two tools.
          <br />
          <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-violet)] bg-clip-text text-transparent">
            One door.
          </span>
        </h1>
        <p className="mt-8 max-w-2xl text-lg text-[var(--color-fg-muted)]">
          dd-cons hosts two self-hosted AI workforces under one roof.{' '}
          <strong className="text-[var(--color-fg)]">Dev-Division</strong>{' '}
          turns a business idea into a running codebase.{' '}
          <strong className="text-[var(--color-fg)]">Consulting-Team</strong>{' '}
          turns a partner brief into a cited deliverable. Every agent call,
          every gate approval, every tool invocation is written to a
          per-project, hash-chained audit log.{' '}
          <span className="text-[var(--color-fg)]">
            The audit log is the product.
          </span>
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/sign-up?dest=dev-division"
            className="glow-mint rounded-md bg-[var(--color-accent)] px-6 py-3 font-semibold text-[var(--color-accent-fg)] transition-shadow duration-200 hover:bg-[var(--color-accent-hover)]"
          >
            Try Dev-Division →
          </Link>
          <Link
            href="/sign-up?dest=consulting"
            className="glow-violet rounded-md border border-[var(--color-border)] bg-[color-mix(in_oklch,var(--color-bg-elev)_70%,transparent)] px-6 py-3 font-semibold text-[var(--color-fg)] backdrop-blur transition-shadow duration-200 hover:border-[var(--color-violet)]"
          >
            Try Consulting →
          </Link>
        </div>
      </HeroStage>

      {/* ---------- Bento: what each product is ---------- */}
      <section aria-labelledby="what-heading" className="relative">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <RevealOnScroll>
            <h2 id="what-heading" className="text-4xl font-semibold tracking-tight">
              What each product is
            </h2>
            <p className="mt-2 max-w-2xl text-[var(--color-fg-muted)]">
              Plain language. No buzzwords.
            </p>
          </RevealOnScroll>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <RevealOnScroll
              as="article"
              className="glass p-7 lg:col-span-2"
            >
              <h3 className="font-mono text-sm uppercase tracking-wider text-[var(--color-accent)]">
                Dev-Division
              </h3>
              <p className="mt-3 text-3xl font-semibold tracking-tight">
                Six roles. One running app.
              </p>
              <p className="mt-4 text-[var(--color-fg-muted)]">
                Submit a business idea. A Product Manager agent writes the
                spec. An Architect agent picks the stack. A Delivery Lead
                breaks the work down. An Engineer agent writes the code in a
                sandbox. QA tests it. DevOps wires the deploy. You approve at
                three human gates along the way. What you get back: a real,
                running code skeleton — plus a tamper-evident record of who
                (and which model) did what.
              </p>
            </RevealOnScroll>

            <RevealOnScroll as="article" className="glass p-7">
              <h3 className="font-mono text-sm uppercase tracking-wider text-[var(--color-violet)]">
                Consulting-Team
              </h3>
              <p className="mt-3 text-3xl font-semibold tracking-tight">
                Five agents. One cited deliverable.
              </p>
              <p className="mt-4 text-[var(--color-fg-muted)]">
                Submit a partner brief. A Researcher gathers sources. A Sceptic
                re-fetches every cited URL and confirms the claim. A
                Synthesiser writes the plan. An Editor polishes. A Partner
                supervises across three gates.
              </p>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ---------- How they're different — bento with table ---------- */}
      <section aria-labelledby="diff-heading" className="relative border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <RevealOnScroll>
            <h2 id="diff-heading" className="text-4xl font-semibold tracking-tight">
              How they&apos;re different
            </h2>
            <p className="mt-2 max-w-2xl text-[var(--color-fg-muted)]">
              Same audit invariant, different artifact.
            </p>
          </RevealOnScroll>

          <RevealOnScroll className="mt-10 overflow-hidden glass">
            <table className="w-full text-left text-sm">
              <thead className="bg-[color-mix(in_oklch,var(--color-bg-elev)_60%,transparent)] text-[var(--color-fg-muted)]">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">&nbsp;</th>
                  <th scope="col" className="px-5 py-3 font-medium">Dev-Division</th>
                  <th scope="col" className="px-5 py-3 font-medium">Consulting-Team</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                <tr>
                  <th scope="row" className="px-5 py-3 font-medium text-[var(--color-fg-muted)]">Input</th>
                  <td className="px-5 py-3">A business idea</td>
                  <td className="px-5 py-3">A partner brief</td>
                </tr>
                <tr>
                  <th scope="row" className="px-5 py-3 font-medium text-[var(--color-fg-muted)]">Roles</th>
                  <td className="px-5 py-3">PM → Architect → Delivery Lead → Engineer → QA → DevOps</td>
                  <td className="px-5 py-3">Researcher → Sceptic → Synthesiser → Editor (Partner supervises)</td>
                </tr>
                <tr>
                  <th scope="row" className="px-5 py-3 font-medium text-[var(--color-fg-muted)]">Output</th>
                  <td className="px-5 py-3">A running code skeleton</td>
                  <td className="px-5 py-3">A cited, structured deliverable</td>
                </tr>
                <tr>
                  <th scope="row" className="px-5 py-3 font-medium text-[var(--color-fg-muted)]">Verification</th>
                  <td className="px-5 py-3">
                    Sandbox build + <code className="font-mono">npm install</code> preflight
                  </td>
                  <td className="px-5 py-3">Every citation re-fetched and re-confirmed</td>
                </tr>
                <tr>
                  <th scope="row" className="px-5 py-3 font-medium text-[var(--color-fg-muted)]">Audit log</th>
                  <td className="px-5 py-3" colSpan={2}>
                    Per-project, hash-chained, tamper-evident, operator-attributed
                  </td>
                </tr>
              </tbody>
            </table>
          </RevealOnScroll>

          <p className="mt-10 max-w-2xl text-[var(--color-fg-muted)]">
            Same sign-in works across both. Pick whichever fits your task.{' '}
            <Link
              href="/pricing"
              className="text-[var(--color-accent)] underline underline-offset-4 hover:text-[var(--color-accent-hover)]"
            >
              See pricing →
            </Link>
          </p>
        </div>
      </section>
    </MarketingShell>
  );
}
