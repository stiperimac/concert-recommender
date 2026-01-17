import { countInteractionsByTarget, getPopularitySnapshot, listArtists, listEvents, upsertPopularitySnapshot } from '@/lib/repo';

function keyFor(period: 'day' | 'month' | 'year', date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  if (period === 'day') return `${y}-${m}-${d}`;
  if (period === 'month') return `${y}-${m}`;
  return `${y}`;
}

function logScore(n: number | undefined) {
  const v = Number(n || 0);
  if (!Number.isFinite(v) || v <= 0) return 0;
  return Math.log10(v + 1);
}

export async function getOrComputePopularity({ scope, period, limit = 30 }: { scope: 'artist' | 'event'; period: 'day' | 'month' | 'year'; limit?: number }) {
  const key = keyFor(period);
  const existing = await getPopularitySnapshot(scope, period, key);
  if (existing) {
    return { key, generatedAt: existing.generatedAt.toISOString(), items: existing.items.slice(0, limit) };
  }

  if (scope === 'artist') {
    const artists = await listArtists(1000);
    const items = [] as Array<{ id: string; name: string; score: number }>;
    for (const a of artists) {
      const spotifyPop = a.signals.spotify?.popularity ?? 0;
      const spotifyFollowers = a.signals.spotify?.followers ?? 0;
      const lastfmListeners = a.signals.lastfm?.listeners ?? 0;
      const likes = await countInteractionsByTarget('artist', a._id.toHexString(), 'like_artist');

      const score = spotifyPop * 10 + logScore(spotifyFollowers) * 40 + logScore(lastfmListeners) * 30 + likes * 5;
      items.push({ id: a._id.toHexString(), name: a.name, score });
    }
    items.sort((x, y) => y.score - x.score);
    await upsertPopularitySnapshot(scope, period, key, items);
    return { key, generatedAt: new Date().toISOString(), items: items.slice(0, limit) };
  }

  // Events
  const events = await listEvents(3000);
  const items = [] as Array<{ id: string; name: string; score: number; meta: any }>;

  for (const e of events) {
    const saves = await countInteractionsByTarget('event', e._id.toHexString(), 'save_event');
    const views = await countInteractionsByTarget('event', e._id.toHexString(), 'view_event');

    // Lightweight: use artist count as proxy if artist profiles are missing.
    const performerScore = (e.artists?.length || 1) * 50;
    const score = performerScore + saves * 10 + views * 1;

    items.push({ id: e._id.toHexString(), name: e.name, score, meta: { date: e.date, city: e.city, url: e.url } });
  }

  items.sort((x, y) => y.score - x.score);
  await upsertPopularitySnapshot(scope, period, key, items);
  return { key, generatedAt: new Date().toISOString(), items: items.slice(0, limit) };
}
