import { getAdminEmails } from '@/lib/env';
import { ingestArtistByName, ingestEventsForArtist } from '@/lib/services/ingest';
import { getOrComputePopularity } from '@/lib/services/popularity';
import { listArtists } from '@/lib/repo';
import { getSessionUser } from '@/lib/server-auth';

export async function POST(req: Request) {
  const { userId, email } = await getSessionUser();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const adminList = getAdminEmails();
  if (adminList.length && (!email || !adminList.includes(email))) {
    return Response.json({ error: 'Forbidden - Admin only' }, { status: 403 });
  }

  try {
    const body: any = await req.json().catch(() => ({}));
    const action = body.action;

    if (action === 'refresh_artists') {
      // Refresh all existing artists from external sources
      const artists = await listArtists(500);
      const results: { name: string; status: string }[] = [];

      for (const artist of artists) {
        try {
          await ingestArtistByName(artist.name);
          results.push({ name: artist.name, status: 'ok' });
        } catch (e: any) {
          results.push({ name: artist.name, status: `error: ${e?.message}` });
        }
      }

      return Response.json({ action: 'refresh_artists', count: artists.length, results });
    }

    if (action === 'refresh_events') {
      // Fetch new events for all existing artists
      const artists = await listArtists(500);
      const city = typeof body.city === 'string' ? body.city.trim() : undefined;
      const results: { name: string; eventCount: number; status: string }[] = [];

      for (const artist of artists) {
        try {
          const res = await ingestEventsForArtist({ artistName: artist.name, city, limit: 30 });
          results.push({ name: artist.name, eventCount: res.count, status: 'ok' });
        } catch (e: any) {
          results.push({ name: artist.name, eventCount: 0, status: `error: ${e?.message}` });
        }
      }

      return Response.json({ action: 'refresh_events', count: artists.length, results });
    }

    if (action === 'regenerate_popularity') {
      // Regenerate popularity snapshots
      const artistDay = await getOrComputePopularity({ scope: 'artist', period: 'day', limit: 100 });
      const artistMonth = await getOrComputePopularity({ scope: 'artist', period: 'month', limit: 100 });
      const eventDay = await getOrComputePopularity({ scope: 'event', period: 'day', limit: 100 });
      const eventMonth = await getOrComputePopularity({ scope: 'event', period: 'month', limit: 100 });

      return Response.json({
        action: 'regenerate_popularity',
        snapshots: {
          artistDay: artistDay.items.length,
          artistMonth: artistMonth.items.length,
          eventDay: eventDay.items.length,
          eventMonth: eventMonth.items.length,
        },
      });
    }

    if (action === 'batch_ingest') {
      // Batch ingest artists from a list
      const artistNames = (body.artists || '')
        .split('\n')
        .map((s: string) => s.trim())
        .filter(Boolean)
        .slice(0, 50);
      
      const city = typeof body.city === 'string' ? body.city.trim() : undefined;
      const withEvents = Boolean(body.withEvents);
      const results: { name: string; artistId?: string; eventCount?: number; status: string }[] = [];

      for (const name of artistNames) {
        try {
          const artistId = await ingestArtistByName(name);
          let eventCount = 0;
          if (withEvents) {
            const eventsRes = await ingestEventsForArtist({ artistName: name, city, limit: 30 });
            eventCount = eventsRes.count;
          }
          results.push({ name, artistId, eventCount, status: 'ok' });
        } catch (e: any) {
          results.push({ name, status: `error: ${e?.message}` });
        }
      }

      return Response.json({ action: 'batch_ingest', count: artistNames.length, results });
    }

    return Response.json({ error: 'Unknown action. Use: refresh_artists, refresh_events, regenerate_popularity, batch_ingest' }, { status: 400 });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}

