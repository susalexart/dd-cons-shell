import { LegalPlaceholder } from '../../../components/legal-placeholder';
import { MarketingShell } from '../../../components/marketing-shell';

export const metadata = { title: 'Terms · dd-cons' };

export default function TermsPage() {
  return (
    <MarketingShell>
      <article className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
        {/* Real terms of service copy is a user deliverable — see LegalPlaceholder. */}
        <LegalPlaceholder policy="Terms of Service" />
      </article>
    </MarketingShell>
  );
}
