import { getEventById, countInteractionsByTarget, getArtistByName } from '@/lib/repo';
import { getWeatherForDate } from '@/lib/sources/openmeteo';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id || id.length !== 24) {
    return Response.json({ error: 'Invalid event ID' }, { status: 400 });
  }

  try {
    const event = await getEventById(id);
    if (!event) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get interaction stats
    const saveCount = await countInteractionsByTarget('event', id, 'save_event');
    const viewCount = await countInteractionsByTarget('event', id, 'view_event');

    // Get artist details for linked artists
    const artistDetails = await Promise.all(
      (event.artists || []).map(async (artistName) => {
        const artist = await getArtistByName(artistName);
        return artist
          ? { id: artist._id.toHexString(), name: artist.name, genres: artist.genres }
          : { id: null, name: artistName, genres: [] };
      })
    );

    // Get weather forecast if location and date are available
    let weather = null;
    if (event.location && event.date) {
      try {
        weather = await getWeatherForDate({
          lat: event.location.lat,
          lon: event.location.lon,
          date: event.date,
        });
      } catch {
        // Weather fetch failed, continue without it
      }
    }

    return Response.json({
      event: {
        id: event._id.toHexString(),
        tmId: event.tmId,
        name: event.name,
        date: event.date,
        localDateTime: event.localDateTime,
        city: event.city,
        countryCode: event.countryCode,
        venue: event.venue,
        url: event.url,
        images: event.images,
        location: event.location,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
      },
      artists: artistDetails,
      stats: {
        saves: saveCount,
        views: viewCount,
      },
      weather,
    });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Error fetching event' }, { status: 500 });
  }
}

