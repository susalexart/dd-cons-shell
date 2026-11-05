import { LegalPlaceholder } from '../../../components/legal-placeholder';
import { MarketingShell } from '../../../components/marketing-shell';

export const metadata = { title: 'Cookies · dd-cons' };

export default function CookiesPage() {
  return (
    <MarketingShell>
      <article className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-3xl font-semibold tracking-tight">Cookie Policy</h1>
        {/* Real cookie policy copy is a user deliverable — see LegalPlaceholder. */}
        <LegalPlaceholder policy="Cookie Policy" />
      </article>
    </MarketingShell>
  );
}
