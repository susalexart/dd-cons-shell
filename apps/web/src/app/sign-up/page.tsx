import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AuthForm } from '../../components/auth-form';
import { AuthStage } from '../../components/auth-stage';
import { MarketingShell } from '../../components/marketing-shell';
import { auth } from '../../lib/auth';
import { resolvePostAuthRoute } from '../../lib/post-auth';

export const metadata = {
  title: 'Sign up · dd-cons',
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ dest?: string }>;
}) {
  const { dest } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    redirect(resolvePostAuthRoute(dest));
  }

  return (
    <MarketingShell>
      <AuthStage>
        <Suspense fallback={<div className="mx-auto max-w-md px-6 py-10" />}>
          <AuthForm mode="sign-up" />
        </Suspense>
      </AuthStage>
    </MarketingShell>
  );
}
