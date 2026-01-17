import { findArtistsByQuery } from '@/lib/repo';
import { ingestArtistByName } from '@/lib/services/ingest';
import { getSessionUser } from '@/lib/server-auth';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  if (!q) return Response.json({ items: [] });

  try {
    const items = await findArtistsByQuery(q, 10);
    return Response.json({ items });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Error' }, { status: 400 });
  }
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  const ingest = url.searchParams.get('ingest') === '1';

  const { userId } = await getSessionUser();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    if (ingest && q) {
      await ingestArtistByName(q);
    }
    const items = q ? await findArtistsByQuery(q, 10) : [];
    return Response.json({ items });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Error' }, { status: 400 });
  }
}
