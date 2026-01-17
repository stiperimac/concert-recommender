import { getWeatherForDate } from '@/lib/sources/openmeteo';
import { ensureUserProfile, getAllUsersWithLikes, getDb, getEventById, getRecommendationsForUser, getUserLikedArtistIds, normalizeName, upsertRecommendations } from '@/lib/repo';
import { COLLECTIONS } from '@/lib/collections';
import type { EventDoc } from '@/lib/types';

function jaccard(a: Set<string>, b: Set<string>) {
  const inter = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);
  return union.size ? inter.size / union.size : 0;
}

function parseDate(date: string) {
  // date is YYYY-MM-DD
  const [y, m, d] = date.split('-').map((x) => Number(x));
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

export async function computeRecommendations({ userId, horizonDays = 60, limit = 15 }: { userId: string; horizonDays?: number; limit?: number }) {
  const profile = await ensureUserProfile(userId);
  const db = await getDb();
  const eventsCol = db.collection<EventDoc>(COLLECTIONS.events);

  const city = profile.city || undefined;
  const favoriteArtists = profile.favoriteArtists || [];

  // Candidate events: match any favorite artist + optional city.
  const artistRegexes = favoriteArtists.map((a) => new RegExp(`^${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'));
  const now = new Date();
  const horizon = new Date(now.getTime() + horizonDays * 24 * 3600 * 1000);

  const q: any = {
    date: { $gte: now.toISOString().slice(0, 10), $lte: horizon.toISOString().slice(0, 10) }
  };
  if (city) q.city = { $regex: new RegExp(city, 'i') };
  if (artistRegexes.length) q.artists = { $elemMatch: { $in: artistRegexes } };

  let candidates = await eventsCol.find(q).sort({ date: 1 }).limit(200).toArray();

  // Fallback: if no matches, use city-only or any upcoming.
  if (candidates.length === 0) {
    const q2: any = { date: { $gte: now.toISOString().slice(0, 10), $lte: horizon.toISOString().slice(0, 10) } };
    if (city) q2.city = { $regex: new RegExp(city, 'i') };
    candidates = await eventsCol.find(q2).sort({ date: 1 }).limit(200).toArray();
  }

  // Similar users based on likes.
  const myLikes = new Set(await getUserLikedArtistIds(userId));
  const others = await getAllUsersWithLikes(100);
  const scoredUsers = others
    .filter((u) => u._id !== userId)
    .map((u) => ({ userId: u._id, sim: jaccard(myLikes, new Set(u.likes)) }))
    .sort((x, y) => y.sim - x.sim)
    .slice(0, 5)
    .filter((x) => x.sim > 0);

  const similarLikedArtistIds = new Set<string>();
  for (const u of scoredUsers) {
    const likes = await getUserLikedArtistIds(u.userId, 100);
    likes.forEach((id) => similarLikedArtistIds.add(id));
  }


  const results: Array<{ id: string; name: string; score: number; meta: any }> = [];
  const favNormalized = new Set(favoriteArtists.map(normalizeName));

  for (const e of candidates) {
    const reasons: string[] = [];
    let score = 0;

    // Preference match
    const matchArtists = (e.artists || []).filter((a) => favNormalized.has(normalizeName(a)));
    if (matchArtists.length) {
      score += matchArtists.length * 120;
      reasons.push(`Poklapanje s omiljenim izvođačima: ${matchArtists.join(', ')}`);
    }

    // Similar users signal (using artist IDs liked by similar users is non-trivial to map to event artists without joins;
    // as a practical approach we add a small boost if user has many similar users).
    if (scoredUsers.length) {
      score += scoredUsers.reduce((acc, u) => acc + u.sim, 0) * 30;
      reasons.push(`Slični korisnici (Jaccard) doprinose skoru.`);
    }

    // Recency: sooner is slightly better.
    const daysAway = Math.max(0, Math.round((parseDate(e.date).getTime() - now.getTime()) / (24 * 3600 * 1000)));
    score += Math.max(0, 60 - daysAway);

    // Basic content features
    score += (e.artists?.length || 1) * 5;

    results.push({
      id: e._id.toHexString(),
      name: e.name,
      score,
      meta: {
        date: e.date,
        city: e.city,
        url: e.url,
        reason: reasons,
      }
    });
  }

  results.sort((a, b) => b.score - a.score);

  // Weather enrichment for top N
  for (const r of results.slice(0, Math.min(10, results.length))) {
    const e = await getEventById(r.id);
    if (!e?.location || !e?.date) continue;
    const w = await getWeatherForDate({ lat: e.location.lat, lon: e.location.lon, date: e.date });
    r.meta.weather = w.label;
    // Penalize heavy rain.
    if (typeof w.precipitation === 'number' && w.precipitation > 5) {
      r.score -= 15;
      r.meta.reason = [...(r.meta.reason || []), 'Vrijeme: očekuju se jače oborine (penalizacija).'];
    }
  }

  results.sort((a, b) => b.score - a.score);
  const top = results.slice(0, limit);

  await upsertRecommendations(userId, horizonDays, city, top);
  return { generatedAt: new Date().toISOString(), items: top };
}

export async function getLatestRecommendations(userId: string) {
  const rec = await getRecommendationsForUser(userId);
  if (!rec) return null;
  return {
    generatedAt: rec.generatedAt.toISOString(),
    items: rec.items
  };
}
