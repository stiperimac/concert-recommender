import NextAuth from 'next-auth';
import { getAuthOptions } from '@/lib/auth';

// compute options lazily enough that builds do not require secrets.
const handler = NextAuth(getAuthOptions());

export { handler as GET, handler as POST };
