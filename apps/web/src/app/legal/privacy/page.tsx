import { LegalPlaceholder } from '../../../components/legal-placeholder';
import { MarketingShell } from '../../../components/marketing-shell';

export const metadata = { title: 'Privacy · dd-cons' };

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <article className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        {/* Real privacy policy copy is a user deliverable — see LegalPlaceholder. */}
        <LegalPlaceholder policy="Privacy Policy" />
      </article>
    </MarketingShell>
  );
}
