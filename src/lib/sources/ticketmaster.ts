import { getTicketmasterApiKey } from '@/lib/env';

export type TicketmasterEvent = {
  tmId: string;
  name: string;
  url?: string;
  date: string; // YYYY-MM-DD
  localDateTime?: string;
  city?: string;
  countryCode?: string;
  venue?: string;
  images?: { url: string; width?: number; height?: number }[];
  location?: { lat: number; lon: number };
  artists: string[];
};

export async function searchEventsByArtist({ artist, city, size = 20 }: { artist: string; city?: string; size?: number }) {
  const apiKey = getTicketmasterApiKey();
  const params = new URLSearchParams();
  params.set('apikey', apiKey);
  params.set('classificationName', 'music');
  params.set('keyword', artist);
  params.set('size', String(size));
  if (city) params.set('city', city);

  const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ticketmaster error (${res.status}): ${text.slice(0, 200)}`);
  }
  const json: any = await res.json();
  const events: any[] = json?._embedded?.events || [];

  return events.map((e) => {
    const venue = e?._embedded?.venues?.[0];
    const attractions = (e?._embedded?.attractions || []).map((a: any) => a?.name).filter(Boolean);
    const loc = venue?.location?.latitude && venue?.location?.longitude
      ? { lat: Number(venue.location.latitude), lon: Number(venue.location.longitude) }
      : undefined;

    return {
      tmId: e.id,
      name: e.name,
      url: e.url,
      date: e?.dates?.start?.localDate,
      localDateTime: e?.dates?.start?.dateTime,
      city: venue?.city?.name,
      countryCode: venue?.country?.countryCode,
      venue: venue?.name,
      images: Array.isArray(e.images) ? e.images.map((im: any) => ({ url: im.url, width: im.width, height: im.height })) : undefined,
      location: loc,
      artists: attractions.length ? attractions : [artist],
    } as TicketmasterEvent;
  }).filter((x) => Boolean(x.tmId) && Boolean(x.date));
}
