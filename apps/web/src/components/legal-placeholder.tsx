/**
 * Interim body for the /legal/* pages.
 *
 * The real Terms / Privacy / Cookie copy is a user deliverable (legal text is
 * not something to generate here). Until it lands, every legal page renders
 * this honest placeholder instead of a TODO marker. Replace the placeholder
 * with the final copy in the page files; this component then goes away.
 */

// TODO(owner): confirm contact address (same open question as the pricing sales mailto)
const CONTACT_EMAIL = 'sales@aroma-cloud.online';

export function LegalPlaceholder({ policy }: { policy: string }) {
  return (
    <section className="mt-6 space-y-3 text-[var(--color-fg-muted)]" aria-label="Status">
      <p>This page is being finalised.</p>
      <p>
        For the current {policy}, contact{' '}
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(policy)}`}
          className="underline underline-offset-4 hover:text-[var(--color-fg)]"
        >
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </section>
  );
}
