import { findEventsByQuery, getDb } from '@/lib/repo';
import { ingestEventsForArtist } from '@/lib/services/ingest';
import { getSessionUser } from '@/lib/server-auth';
import { COLLECTIONS } from '@/lib/collections';
import type { EventDoc } from '@/lib/types';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  const artist = (url.searchParams.get('artist') || '').trim();
  const city = (url.searchParams.get('city') || '').trim();
  const limit = Number(url.searchParams.get('limit') || '20');

  try {
    // If generic query (q), search by event name or artist
    if (q) {
      const db = await getDb();
      const col = db.collection<EventDoc>(COLLECTIONS.events);
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      
      const docs = await col.find({
        $or: [
          { name: rx },
          { artists: { $elemMatch: { $regex: rx } } },
          { city: rx },
        ],
      }).sort({ date: 1 }).limit(limit).toArray();

      const items = docs.map((d) => ({
        id: d._id.toHexString(),
        name: d.name,
        date: d.date,
        city: d.city,
        url: d.url,
        venue: d.venue,
        artists: d.artists,
      }));

      return Response.json({ items });
    }

    // Existing artist/city query
    const items = await findEventsByQuery({ artist: artist || undefined, city: city || undefined, limit });
    return Response.json({ items });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Error' }, { status: 400 });
  }
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const artist = (url.searchParams.get('artist') || '').trim();
  const city = (url.searchParams.get('city') || '').trim();
  const ingest = url.searchParams.get('ingest') === '1';

  const { userId } = await getSessionUser();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    if (ingest && artist) {
      await ingestEventsForArtist({ artistName: artist, city: city || undefined, limit: 30 });
    }
    const items = await findEventsByQuery({ artist: artist || undefined, city: city || undefined, limit: 20 });
    return Response.json({ items });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Error' }, { status: 400 });
  }
}
