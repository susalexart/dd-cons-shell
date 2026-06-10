import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AuthForm } from '../../components/auth-form';
import { AuthStage } from '../../components/auth-stage';
import { MarketingShell } from '../../components/marketing-shell';
import { auth } from '../../lib/auth';
import { resolvePostAuthRoute } from '../../lib/post-auth';

export const metadata = {
  title: 'Sign in · dd-cons',
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ dest?: string }>;
}) {
  const { dest } = await searchParams;
  // Already signed in? Skip the form — without this, a signed-in user who
  // revisits /sign-in re-runs OAuth and appears to "loop".
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    redirect(resolvePostAuthRoute(dest));
  }

  return (
    <MarketingShell>
      <AuthStage>
        {/* useSearchParams() requires a Suspense boundary in App Router. */}
        <Suspense fallback={<div className="mx-auto max-w-md px-6 py-10" />}>
          <AuthForm mode="sign-in" />
        </Suspense>
      </AuthStage>
    </MarketingShell>
  );
}
