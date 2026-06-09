import { Suspense } from 'react';
import { AuthForm } from '../../components/auth-form';
import { MarketingShell } from '../../components/marketing-shell';

export const metadata = {
  title: 'Sign up · dd-cons',
};

export default function SignUpPage() {
  return (
    <MarketingShell>
      <Suspense fallback={<div className="mx-auto max-w-md px-6 py-20" />}>
        <AuthForm mode="sign-up" />
      </Suspense>
    </MarketingShell>
  );
}
