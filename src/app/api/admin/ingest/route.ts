import { getAdminEmails } from '@/lib/env';
import { ingestArtistByName, ingestEventsForArtist } from '@/lib/services/ingest';
import { getSessionUser } from '@/lib/server-auth';

export async function POST(req: Request) {
  const { userId, email } = await getSessionUser();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const adminList = getAdminEmails();
  if (adminList.length && (!email || !adminList.includes(email))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body: any = await req.json().catch(() => ({}));
  const artist = String(body.artist || '').trim();
  const city = typeof body.city === 'string' ? body.city.trim() : undefined;
  const withEvents = Boolean(body.withEvents);

  if (!artist) return Response.json({ error: 'artist is required' }, { status: 400 });

  try {
    const artistId = await ingestArtistByName(artist);
    let events: any = null;
    if (withEvents) {
      events = await ingestEventsForArtist({ artistName: artist, city, limit: 50 });
    }
    return Response.json({ artistId, events });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Error' }, { status: 400 });
  }
}
