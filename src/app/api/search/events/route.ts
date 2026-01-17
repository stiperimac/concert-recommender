import { findEventsByQuery } from '@/lib/repo';
import { ingestEventsForArtist } from '@/lib/services/ingest';
import { getSessionUser } from '@/lib/server-auth';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const artist = (url.searchParams.get('artist') || '').trim();
  const city = (url.searchParams.get('city') || '').trim();
  const limit = Number(url.searchParams.get('limit') || '20');

  try {
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
