import { getCurrentUser } from '@/lib/auth';
import { LandingPage } from '@/components/landing/LandingPage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const currentUser = await getCurrentUser();
  return <LandingPage currentUser={currentUser} />;
}
