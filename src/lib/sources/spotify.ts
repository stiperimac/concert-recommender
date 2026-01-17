import { getSpotifyAccessToken } from '@/lib/env';

export type SpotifyArtistProfile = {
  id: string;
  popularity: number;
  followers: number;
  genres: string[];
};

export async function getArtistProfileByName(name: string): Promise<SpotifyArtistProfile | null> {
  const token = getSpotifyAccessToken();
  if (!token) return null;
  const params = new URLSearchParams();
  params.set('type', 'artist');
  params.set('limit', '1');
  params.set('q', name);

  const res = await fetch(`https://api.spotify.com/v1/search?${params.toString()}`, {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) return null;
  const json: any = await res.json();
  const a = json?.artists?.items?.[0];
  if (!a) return null;

  return {
    id: a.id,
    popularity: a.popularity ?? 0,
    followers: a.followers?.total ?? 0,
    genres: Array.isArray(a.genres) ? a.genres : [],
  };
}
