import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from './auth';

export async function getSessionUser() {
  const session = await getServerSession(getAuthOptions());
  const userId = (session?.user as any)?.id as string | undefined;
  return { session, userId, email: session?.user?.email || undefined };
}
