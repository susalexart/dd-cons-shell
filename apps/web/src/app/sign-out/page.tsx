import { MarketingShell } from '../../components/marketing-shell';
import { SignOutTrigger } from './sign-out-trigger';

export const metadata = {
  title: 'Signing out · dd-cons',
};

/**
 * /sign-out — POSTs to better-auth's sign-out endpoint via the client helper,
 * then bounces to `/`. The brief allows either a POST route or a tiny client
 * component; we chose the latter so the user sees a confirmation panel
 * instead of a blank redirect.
 */
export default function SignOutPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Signing you out…</h1>
        <p className="mt-3 text-[var(--color-fg-muted)]">
          Clearing your session cookie. You&apos;ll land back on the home page.
        </p>
        <SignOutTrigger />
      </div>
    </MarketingShell>
  );
}
