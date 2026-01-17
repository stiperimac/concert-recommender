import { getArtistById, countInteractionsByTarget, findEventsByQuery } from '@/lib/repo';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id || id.length !== 24) {
    return Response.json({ error: 'Invalid artist ID' }, { status: 400 });
  }

  try {
    const artist = await getArtistById(id);
    if (!artist) {
      return Response.json({ error: 'Artist not found' }, { status: 404 });
    }

    // Get interaction stats
    const likeCount = await countInteractionsByTarget('artist', id, 'like_artist');

    // Get upcoming events for this artist
    const events = await findEventsByQuery({ artist: artist.name, limit: 20 });

    return Response.json({
      artist: {
        id: artist._id.toHexString(),
        name: artist.name,
        genres: artist.genres,
        signals: {
          spotify: artist.signals.spotify,
          lastfm: artist.signals.lastfm,
        },
        createdAt: artist.createdAt.toISOString(),
        updatedAt: artist.updatedAt.toISOString(),
      },
      stats: {
        likes: likeCount,
      },
      events,
    });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Error fetching artist' }, { status: 500 });
  }
}

