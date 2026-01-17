import { getWeatherForDate } from '@/lib/sources/openmeteo';
import {
  ensureUserProfile,
  getAllUsersWithLikes,
  getDb,
  getEventById,
  getRecommendationsForUser,
  getUserLikedArtistIds,
  normalizeName,
  upsertRecommendations,
  getArtistByName,
  getUserRecentInteractions,
} from '@/lib/repo';
import { COLLECTIONS } from '@/lib/collections';
import type { ArtistDoc, EventDoc } from '@/lib/types';

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

// Calculate recency weight - interactions in last 7 days get full weight, older ones decay
function recencyWeight(createdAt: Date, now: Date): number {
  const daysAgo = (now.getTime() - createdAt.getTime()) / (24 * 3600 * 1000);
  if (daysAgo <= 7) return 1.0;
  if (daysAgo <= 30) return 0.7;
  if (daysAgo <= 90) return 0.4;
  return 0.2;
}

type ScoreBreakdown = {
  factor: string;
  points: number;
  explanation: string;
};

export async function computeRecommendations({
  userId,
  horizonDays = 60,
  limit = 15,
  cityFilter,
  dateFrom,
  dateTo,
}: {
  userId: string;
  horizonDays?: number;
  limit?: number;
  cityFilter?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const profile = await ensureUserProfile(userId);
  const db = await getDb();
  const eventsCol = db.collection<EventDoc>(COLLECTIONS.events);
  const artistsCol = db.collection<ArtistDoc>(COLLECTIONS.artists);

  const city = cityFilter || profile.city || undefined;
  const favoriteArtists = profile.favoriteArtists || [];
  const now = new Date();

  // Check if this is a cold-start user (no preferences, no interactions)
  const userInteractions = await getUserRecentInteractions(userId, 100);
  const isColdStart = favoriteArtists.length === 0 && userInteractions.length === 0;

  // Build user's genre preferences from liked artists
  const userGenres = new Set<string>();
  const artistGenreMap = new Map<string, string[]>();

  for (const artistName of favoriteArtists) {
    const artist = await getArtistByName(artistName);
    if (artist) {
      artist.genres.forEach((g) => userGenres.add(g.toLowerCase()));
      artistGenreMap.set(normalizeName(artistName), artist.genres);
    }
  }

  // Also get genres from recently liked artists (interactions)
  const likedArtistIds = await getUserLikedArtistIds(userId, 50);
  for (const artistId of likedArtistIds.slice(0, 20)) {
    try {
      const artist = await db.collection<ArtistDoc>(COLLECTIONS.artists).findOne({ _id: new (await import('mongodb')).ObjectId(artistId) });
      if (artist) {
        artist.genres.forEach((g) => userGenres.add(g.toLowerCase()));
      }
    } catch {
      // Skip invalid IDs
    }
  }

  // Build date range query
  const startDate = dateFrom || now.toISOString().slice(0, 10);
  const horizon = new Date(now.getTime() + horizonDays * 24 * 3600 * 1000);
  const endDate = dateTo || horizon.toISOString().slice(0, 10);

  // For cold-start users, get popular events; otherwise match preferences
  let candidates: EventDoc[] = [];

  if (isColdStart) {
    // Cold-start: get trending/popular events
    const q: any = { date: { $gte: startDate, $lte: endDate } };
    if (city) q.city = { $regex: new RegExp(city, 'i') };
    candidates = await eventsCol.find(q).sort({ date: 1 }).limit(300).toArray();
  } else {
    // Normal user: try to match favorite artists first
    const artistRegexes = favoriteArtists.map((a) => new RegExp(`^${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'));
    const q: any = { date: { $gte: startDate, $lte: endDate } };
    if (city) q.city = { $regex: new RegExp(city, 'i') };
    if (artistRegexes.length) q.artists = { $elemMatch: { $in: artistRegexes } };

    candidates = await eventsCol.find(q).sort({ date: 1 }).limit(200).toArray();

    // Fallback: if no direct matches, get any events in city/date range
    if (candidates.length < 10) {
      const q2: any = { date: { $gte: startDate, $lte: endDate } };
      if (city) q2.city = { $regex: new RegExp(city, 'i') };
      const fallback = await eventsCol.find(q2).sort({ date: 1 }).limit(200).toArray();
      const existingIds = new Set(candidates.map((c) => c._id.toHexString()));
      for (const e of fallback) {
        if (!existingIds.has(e._id.toHexString())) {
          candidates.push(e);
        }
      }
    }
  }

  // Similar users based on likes (collaborative filtering)
  const myLikes = new Set(await getUserLikedArtistIds(userId));
  const others = await getAllUsersWithLikes(100);
  const scoredUsers = others
    .filter((u) => u._id !== userId)
    .map((u) => ({ userId: u._id, sim: jaccard(myLikes, new Set(u.likes)) }))
    .sort((x, y) => y.sim - x.sim)
    .slice(0, 5)
    .filter((x) => x.sim > 0);

  // Artists liked by similar users
  const similarUserLikedArtists = new Set<string>();
  for (const u of scoredUsers) {
    const likes = await getUserLikedArtistIds(u.userId, 100);
    for (const artistId of likes) {
      try {
        const artist = await db.collection<ArtistDoc>(COLLECTIONS.artists).findOne({ _id: new (await import('mongodb')).ObjectId(artistId) });
        if (artist) similarUserLikedArtists.add(normalizeName(artist.name));
      } catch {
        // Skip
      }
    }
  }

  const results: Array<{ id: string; name: string; score: number; meta: any }> = [];
  const favNormalized = new Set(favoriteArtists.map(normalizeName));

  for (const e of candidates) {
    const breakdown: ScoreBreakdown[] = [];
    let score = 0;

    // 1. Preference match (highest weight)
    const matchArtists = (e.artists || []).filter((a) => favNormalized.has(normalizeName(a)));
    if (matchArtists.length) {
      const points = matchArtists.length * 120;
      score += points;
      breakdown.push({
        factor: 'favorite_artist',
        points,
        explanation: `Omiljeni izvođač: ${matchArtists.join(', ')} (+${points})`,
      });
    }

    // 2. Genre matching
    let genreMatchCount = 0;
    for (const artistName of e.artists || []) {
      const artist = await getArtistByName(artistName);
      if (artist) {
        const artistGenresLower = artist.genres.map((g) => g.toLowerCase());
        const matchedGenres = artistGenresLower.filter((g) => userGenres.has(g));
        genreMatchCount += matchedGenres.length;
      }
    }
    if (genreMatchCount > 0) {
      const points = Math.min(genreMatchCount * 15, 60); // Cap at 60
      score += points;
      breakdown.push({
        factor: 'genre_match',
        points,
        explanation: `Poklapanje žanrova (${genreMatchCount} zajedničkih) (+${points})`,
      });
    }

    // 3. Artist popularity boost
    let popularityBoost = 0;
    for (const artistName of (e.artists || []).slice(0, 3)) {
      const artist = await getArtistByName(artistName);
      if (artist?.signals.spotify?.popularity) {
        popularityBoost += artist.signals.spotify.popularity * 0.3;
      }
    }
    if (popularityBoost > 0) {
      const points = Math.round(Math.min(popularityBoost, 30));
      score += points;
      breakdown.push({
        factor: 'artist_popularity',
        points,
        explanation: `Popularnost izvođača na Spotifyu (+${points})`,
      });
    }

    // 4. Similar users signal (collaborative filtering)
    const eventArtistsNormalized = (e.artists || []).map(normalizeName);
    const similarUserMatch = eventArtistsNormalized.some((a) => similarUserLikedArtists.has(a));
    if (similarUserMatch && scoredUsers.length > 0) {
      const avgSim = scoredUsers.reduce((acc, u) => acc + u.sim, 0) / scoredUsers.length;
      const points = Math.round(avgSim * 50);
      if (points > 0) {
        score += points;
        breakdown.push({
          factor: 'similar_users',
          points,
          explanation: `Slični korisnici vole ovog izvođača (+${points})`,
        });
      }
    } else if (scoredUsers.length > 0) {
      // Small boost just for having similar users
      const points = Math.round(scoredUsers.reduce((acc, u) => acc + u.sim, 0) * 10);
      if (points > 0) {
        score += points;
        breakdown.push({
          factor: 'collaborative',
          points,
          explanation: `Kolaborativno filtriranje (+${points})`,
        });
      }
    }

    // 5. Recency boost - sooner events get higher score
    const daysAway = Math.max(0, Math.round((parseDate(e.date).getTime() - now.getTime()) / (24 * 3600 * 1000)));
    const recencyPoints = Math.max(0, 50 - daysAway);
    if (recencyPoints > 0) {
      score += recencyPoints;
      breakdown.push({
        factor: 'recency',
        points: recencyPoints,
        explanation: `Koncert za ${daysAway} dana (+${recencyPoints})`,
      });
    }

    // 6. Content features (number of performers)
    const contentPoints = Math.min((e.artists?.length || 1) * 3, 15);
    score += contentPoints;

    // 7. Cold-start boost for popular artists
    if (isColdStart) {
      let coldStartBoost = 0;
      for (const artistName of (e.artists || []).slice(0, 2)) {
        const artist = await getArtistByName(artistName);
        if (artist?.signals.spotify?.popularity && artist.signals.spotify.popularity > 70) {
          coldStartBoost += 20;
        }
        if (artist?.signals.spotify?.followers && artist.signals.spotify.followers > 1000000) {
          coldStartBoost += 15;
        }
      }
      if (coldStartBoost > 0) {
        score += coldStartBoost;
        breakdown.push({
          factor: 'trending',
          points: coldStartBoost,
          explanation: `Trending izvođač (+${coldStartBoost})`,
        });
      }
    }

    // Calculate total for percentage breakdown
    const totalPoints = breakdown.reduce((sum, b) => sum + b.points, 0) || 1;

    results.push({
      id: e._id.toHexString(),
      name: e.name,
      score,
      meta: {
        date: e.date,
        city: e.city,
        url: e.url,
        venue: e.venue,
        artists: e.artists,
        reason: breakdown.map((b) => b.explanation),
        breakdown: breakdown.map((b) => ({
          factor: b.factor,
          points: b.points,
          percentage: Math.round((b.points / totalPoints) * 100),
        })),
        isColdStart,
      },
    });
  }

  results.sort((a, b) => b.score - a.score);

  // Weather enrichment for top N
  for (const r of results.slice(0, Math.min(10, results.length))) {
    const e = await getEventById(r.id);
    if (!e?.location || !e?.date) continue;
    try {
      const w = await getWeatherForDate({ lat: e.location.lat, lon: e.location.lon, date: e.date });
      r.meta.weather = w;

      // Weather-based scoring adjustments
      if (typeof w.precipitation === 'number') {
        if (w.precipitation > 10) {
          r.score -= 20;
          r.meta.reason = [...(r.meta.reason || []), 'Očekuju se jake oborine (-20)'];
        } else if (w.precipitation > 5) {
          r.score -= 10;
          r.meta.reason = [...(r.meta.reason || []), 'Moguće oborine (-10)'];
        } else if (w.precipitation < 1 && w.temp && w.temp > 15 && w.temp < 28) {
          r.score += 10;
          r.meta.reason = [...(r.meta.reason || []), 'Odlično vrijeme za koncert (+10)'];
        }
      }
    } catch {
      // Weather fetch failed, continue
    }
  }

  results.sort((a, b) => b.score - a.score);
  const top = results.slice(0, limit);

  await upsertRecommendations(userId, horizonDays, city, top);
  return { generatedAt: new Date().toISOString(), items: top, isColdStart };
}

export async function getLatestRecommendations(userId: string) {
  const rec = await getRecommendationsForUser(userId);
  if (!rec) return null;
  return {
    generatedAt: rec.generatedAt.toISOString(),
    items: rec.items,
  };
}
