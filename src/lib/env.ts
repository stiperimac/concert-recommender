/**
 * Environment helpers.
 *
 * Design goal:
 * - Never throw on module import (so `next build` and Docker builds do not require secrets).
 * - Validate only when a feature is actually used (auth, Ticketmaster fetch, etc.).
 */

function read(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim().length ? v.trim() : undefined;
}

function required(name: string): string {
  const v = read(name);
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

export function getMongoUri(): string {
  return required('MONGODB_URI');
}

export function getMongoDbName(): string {
  return read('MONGODB_DB') || 'concert_recommender';
}

/**
 * NextAuth secret.
 *
 * We avoid throwing during build by providing a placeholder if missing.
 * Runtime deployments should always set NEXTAUTH_SECRET.
 */
export function getNextAuthSecret(): string {
  return read('NEXTAUTH_SECRET') || 'dev-secret-change-me';
}

export function getNextAuthUrl(): string | undefined {
  return read('NEXTAUTH_URL');
}

export function getGoogleClientId(): string | undefined {
  return read('GOOGLE_CLIENT_ID');
}

export function getGoogleClientSecret(): string | undefined {
  return read('GOOGLE_CLIENT_SECRET');
}

export function getTicketmasterApiKey(): string {
  return required('TICKETMASTER_API_KEY');
}

export function getSpotifyAccessToken(): string | undefined {
  return read('SPOTIFY_ACCESS_TOKEN');
}

export function getLastfmApiKey(): string | undefined {
  return read('LASTFM_API_KEY');
}

export function getAdminEmails(): string[] {
  const raw = read('ADMIN_EMAILS');
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}
