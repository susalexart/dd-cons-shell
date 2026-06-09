import Link from 'next/link';
import { MarketingShell } from '../components/marketing-shell';

export default function HomePage() {
  return (
    <MarketingShell>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16">
        <p className="mb-4 inline-block rounded-full border border-[var(--color-border)] px-3 py-1 font-mono text-xs text-[var(--color-fg-muted)]">
          Two products · one sign-in · every step audited
        </p>
        <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-tight tracking-tight">
          AI that <span className="text-[var(--color-accent)]">ships</span> —
          and shows its work.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-[var(--color-fg-muted)]">
          dd-cons hosts two self-hosted AI workforces under one roof.{' '}
          <strong className="text-[var(--color-fg)]">Dev-Division</strong>{' '}
          turns a business idea into a running codebase.{' '}
          <strong className="text-[var(--color-fg)]">Consulting-Team</strong>{' '}
          turns a partner brief into a cited deliverable. Every agent call,
          every gate approval, every tool invocation is written to a
          per-project, hash-chained audit log. The audit log is the product.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/sign-up?dest=dev-division"
            className="rounded-md bg-[var(--color-accent)] px-6 py-3 font-semibold text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-hover)]"
          >
            Try Dev-Division →
          </Link>
          <Link
            href="/sign-up?dest=consulting"
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elev)] px-6 py-3 font-semibold text-[var(--color-fg)] hover:border-[var(--color-violet)]"
          >
            Try Consulting →
          </Link>
        </div>
      </section>

      {/* What each product is */}
      <section
        aria-labelledby="what-heading"
        className="border-t border-[var(--color-border)] bg-[var(--color-bg-elev)]/40"
      >
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 id="what-heading" className="text-3xl font-semibold tracking-tight">
            What each product is
          </h2>
          <p className="mt-2 max-w-2xl text-[var(--color-fg-muted)]">
            Plain language. No buzzwords.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <article className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-6">
              <h3 className="font-mono text-sm uppercase tracking-wider text-[var(--color-accent)]">
                Dev-Division
              </h3>
              <p className="mt-2 text-2xl font-semibold">
                Six roles. One running app.
              </p>
              <p className="mt-3 text-[var(--color-fg-muted)]">
                Submit a business idea. A Product Manager agent writes the
                spec. An Architect agent picks the stack. A Delivery Lead
                breaks the work down. An Engineer agent writes the code in a
                sandbox. QA tests it. DevOps wires the deploy. You approve at
                three human gates along the way. What you get back: a real,
                running code skeleton — plus a tamper-evident record of who
                (and which model) did what.
              </p>
            </article>

            <article className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-6">
              <h3 className="font-mono text-sm uppercase tracking-wider text-[var(--color-violet)]">
                Consulting-Team
              </h3>
              <p className="mt-2 text-2xl font-semibold">
                Five agents. One cited deliverable.
              </p>
              <p className="mt-3 text-[var(--color-fg-muted)]">
                Submit a partner brief — vendor due-diligence, market scan,
                RFP response. A Researcher agent gathers sources. A Sceptic
                agent re-fetches every cited URL and confirms the claim
                actually appears in the page. A Synthesiser writes the plan.
                An Editor does the final polish. A Partner agent supervises
                across three approval gates. The output is structured,
                cited, and replayable.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* How they're different */}
      <section
        aria-labelledby="diff-heading"
        className="border-t border-[var(--color-border)]"
      >
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 id="diff-heading" className="text-3xl font-semibold tracking-tight">
            How they&apos;re different
          </h2>
          <p className="mt-2 max-w-2xl text-[var(--color-fg-muted)]">
            Same audit invariant, different artifact.
          </p>

          <div className="mt-8 overflow-hidden rounded-lg border border-[var(--color-border)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--color-bg-elev)] text-[var(--color-fg-muted)]">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">
                    &nbsp;
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Dev-Division
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Consulting-Team
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                <tr>
                  <th scope="row" className="px-5 py-3 font-medium text-[var(--color-fg-muted)]">
                    Input
                  </th>
                  <td className="px-5 py-3">A business idea</td>
                  <td className="px-5 py-3">A partner brief</td>
                </tr>
                <tr>
                  <th scope="row" className="px-5 py-3 font-medium text-[var(--color-fg-muted)]">
                    Roles
                  </th>
                  <td className="px-5 py-3">
                    PM → Architect → Delivery Lead → Engineer → QA → DevOps
                  </td>
                  <td className="px-5 py-3">
                    Researcher → Sceptic → Synthesiser → Editor (Partner
                    supervises)
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="px-5 py-3 font-medium text-[var(--color-fg-muted)]">
                    Output
                  </th>
                  <td className="px-5 py-3">A running code skeleton</td>
                  <td className="px-5 py-3">A cited, structured deliverable</td>
                </tr>
                <tr>
                  <th scope="row" className="px-5 py-3 font-medium text-[var(--color-fg-muted)]">
                    Verification
                  </th>
                  <td className="px-5 py-3">
                    Sandbox build + <code className="font-mono">npm install</code> preflight
                  </td>
                  <td className="px-5 py-3">
                    Every citation re-fetched and re-confirmed
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="px-5 py-3 font-medium text-[var(--color-fg-muted)]">
                    Audit log
                  </th>
                  <td className="px-5 py-3" colSpan={2}>
                    Per-project, hash-chained, tamper-evident, operator-attributed
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-8 max-w-2xl text-[var(--color-fg-muted)]">
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
