import { Suspense } from 'react';
import { AuthForm } from '../../components/auth-form';
import { MarketingShell } from '../../components/marketing-shell';

export const metadata = {
  title: 'Sign in · dd-cons',
};

export default function SignInPage() {
  return (
    <MarketingShell>
      {/* useSearchParams() requires a Suspense boundary in App Router. */}
      <Suspense fallback={<div className="mx-auto max-w-md px-6 py-20" />}>
        <AuthForm mode="sign-in" />
      </Suspense>
    </MarketingShell>
  );
}
