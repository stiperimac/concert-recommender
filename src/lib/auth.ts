import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import { getMongoClientPromise } from './mongodb';
import { getGoogleClientId, getGoogleClientSecret, getMongoDbName, getNextAuthSecret } from './env';

export function getAuthOptions(): NextAuthOptions {
  const secret = getNextAuthSecret();
  const googleClientId = getGoogleClientId();
  const googleClientSecret = getGoogleClientSecret();
  const dbName = getMongoDbName();

  // Avoid throwing during builds. If provider secrets are missing, auth routes will respond,
  // but sign-in will not be available until env vars are set.
  const providers = [] as NextAuthOptions['providers'];
  if (googleClientId && googleClientSecret) {
    providers.push(
      GoogleProvider({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
      })
    );
  }

  return {
    adapter: MongoDBAdapter(getMongoClientPromise(), { databaseName: dbName }),
    providers,
    session: { strategy: 'database' },
    secret,
    callbacks: {
      async session({ session, user }) {
        if (session.user) {
          (session.user as any).id = user.id;
        }
        return session;
      },
    },
  };
}
