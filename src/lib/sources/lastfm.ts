import { getLastfmApiKey } from '@/lib/env';

export type LastfmArtistProfile = {
  mbid?: string;
  listeners?: number;
  playcount?: number;
  tags?: string[];
};

export async function getArtistInfoByName(name: string): Promise<LastfmArtistProfile | null> {
  const apiKey = getLastfmApiKey();
  if (!apiKey) return null;
  const params = new URLSearchParams();
  params.set('method', 'artist.getinfo');
  params.set('artist', name);
  params.set('api_key', apiKey);
  params.set('format', 'json');

  const url = `https://ws.audioscrobbler.com/2.0/?${params.toString()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  const json: any = await res.json();
  const artist = json?.artist;
  if (!artist) return null;

  const listeners = Number(artist?.stats?.listeners ?? 0);
  const playcount = Number(artist?.stats?.playcount ?? 0);
  const tags = Array.isArray(artist?.tags?.tag) ? artist.tags.tag.map((t: any) => t?.name).filter(Boolean) : [];

  return {
    mbid: artist.mbid || undefined,
    listeners: Number.isFinite(listeners) ? listeners : undefined,
    playcount: Number.isFinite(playcount) ? playcount : undefined,
    tags,
  };
}
