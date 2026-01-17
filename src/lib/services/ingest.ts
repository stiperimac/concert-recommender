import { getArtistProfileByName } from '@/lib/sources/spotify';
import { getArtistInfoByName } from '@/lib/sources/lastfm';
import { searchEventsByArtist } from '@/lib/sources/ticketmaster';
import { getArtistByName, normalizeName, upsertArtist, upsertEventByTicketmaster } from '@/lib/repo';
import type { ArtistSignals } from '@/lib/types';

export async function ingestArtistByName(name: string) {
  const cleaned = name.trim();
  if (!cleaned) throw new Error('Artist name is required');

  const spotify = await getArtistProfileByName(cleaned);
  const lastfm = await getArtistInfoByName(cleaned);

  const genres = Array.from(new Set([...(spotify?.genres || []), ...(lastfm?.tags || [])])).slice(0, 20);

  const signals: ArtistSignals = {
    spotify: spotify ? { id: spotify.id, popularity: spotify.popularity, followers: spotify.followers, genres: spotify.genres } : undefined,
    lastfm: lastfm ? { mbid: lastfm.mbid, listeners: lastfm.listeners, playcount: lastfm.playcount, tags: lastfm.tags } : undefined,
  };

  const id = await upsertArtist({
    name: cleaned,
    normalizedName: normalizeName(cleaned),
    genres,
    signals,
  });

  return id;
}

export async function ingestEventsForArtist({ artistName, city, limit = 30 }: { artistName: string; city?: string; limit?: number }) {
  const cleaned = artistName.trim();
  if (!cleaned) throw new Error('Artist name is required');

  // Ensure artist exists.
  const existing = await getArtistByName(cleaned);
  if (!existing) {
    await ingestArtistByName(cleaned);
  }

  const tmEvents = await searchEventsByArtist({ artist: cleaned, city, size: limit });
  const insertedIds: string[] = [];

  for (const e of tmEvents) {
    const id = await upsertEventByTicketmaster(e.tmId, {
      name: e.name,
      date: e.date,
      localDateTime: e.localDateTime,
      url: e.url,
      city: e.city,
      countryCode: e.countryCode,
      venue: e.venue,
      images: e.images,
      location: e.location,
      artists: e.artists,
    });
    insertedIds.push(id);
  }

  return { count: insertedIds.length, ids: insertedIds };
}
