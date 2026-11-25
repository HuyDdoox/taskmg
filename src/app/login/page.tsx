import { getDemoAccounts } from '@/app/actions/auth-actions';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LoginPage() {
  const currentUser = await getCurrentUser();
  if (currentUser) {
    redirect('/');
  }

  const demoRes = await getDemoAccounts();
  return <LoginForm demoAccounts={demoRes.users || []} />;
}
