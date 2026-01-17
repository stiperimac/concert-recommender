'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import CommentSection from '@/components/CommentSection';

type ArtistData = {
  artist: {
    id: string;
    name: string;
    genres: string[];
    signals: {
      spotify?: {
        id?: string;
        popularity?: number;
        followers?: number;
        genres?: string[];
      };
      lastfm?: {
        mbid?: string;
        listeners?: number;
        playcount?: number;
        tags?: string[];
      };
    };
    createdAt: string;
    updatedAt: string;
  };
  stats: {
    likes: number;
  };
  events: Array<{
    id: string;
    name: string;
    date: string;
    city?: string;
    url?: string;
  }>;
};

function formatNumber(num: number | undefined) {
  if (num === undefined) return '-';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export default function ArtistDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { status } = useSession();
  const isAuthed = status === 'authenticated';

  const [data, setData] = useState<ArtistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liking, setLiking] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/artists/${id}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to load artist');
        }
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleLike() {
    if (!isAuthed || !data) return;
    setLiking(true);
    try {
      await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'like_artist',
          targetType: 'artist',
          targetId: data.artist.id,
        }),
      });
      setLiked(true);
      setData((prev) =>
        prev ? { ...prev, stats: { ...prev.stats, likes: prev.stats.likes + 1 } } : prev
      );
    } finally {
      setLiking(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>Učitavanje...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Greška</h1>
        <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>{error || 'Izvođač nije pronađen.'}</p>
        <Link href="/" className="underline">Povratak na početnu</Link>
      </div>
    );
  }

  const { artist, stats, events } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{artist.name}</h1>
            {artist.genres.length > 0 && (
              <p className="text-sm mt-2" style={{ color: 'rgb(var(--muted))' }}>
                Žanrovi: {artist.genres.slice(0, 8).join(', ')}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleLike}
            disabled={!isAuthed || liking || liked}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
            style={{
              borderColor: 'rgb(var(--border))',
              background: liked ? 'rgb(var(--accent))' : 'rgb(var(--card))',
              color: liked ? 'white' : 'inherit',
            }}
          >
            {liked ? '♥ Označeno' : liking ? '...' : '♥ Označi kao omiljeno'}
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border p-4" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
          <p className="text-xs uppercase tracking-wide" style={{ color: 'rgb(var(--muted))' }}>Spotify Popularnost</p>
          <p className="text-2xl font-bold mt-1">{artist.signals.spotify?.popularity ?? '-'}</p>
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
          <p className="text-xs uppercase tracking-wide" style={{ color: 'rgb(var(--muted))' }}>Spotify Pratitelji</p>
          <p className="text-2xl font-bold mt-1">{formatNumber(artist.signals.spotify?.followers)}</p>
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
          <p className="text-xs uppercase tracking-wide" style={{ color: 'rgb(var(--muted))' }}>Last.fm Slušatelji</p>
          <p className="text-2xl font-bold mt-1">{formatNumber(artist.signals.lastfm?.listeners)}</p>
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
          <p className="text-xs uppercase tracking-wide" style={{ color: 'rgb(var(--muted))' }}>Korisnici aplikacije</p>
          <p className="text-2xl font-bold mt-1">{stats.likes} ♥</p>
        </div>
      </div>

      {/* External Signals Detail */}
      <section className="rounded-2xl border p-6" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
        <h2 className="text-lg font-semibold mb-4">Društveni signali</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Spotify */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Spotify
            </h3>
            {artist.signals.spotify ? (
              <ul className="text-sm space-y-1" style={{ color: 'rgb(var(--muted))' }}>
                <li>Popularnost: {artist.signals.spotify.popularity}/100</li>
                <li>Pratitelji: {formatNumber(artist.signals.spotify.followers)}</li>
                {artist.signals.spotify.genres?.length ? (
                  <li>Žanrovi: {artist.signals.spotify.genres.slice(0, 5).join(', ')}</li>
                ) : null}
              </ul>
            ) : (
              <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>Nema podataka</p>
            )}
          </div>

          {/* Last.fm */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Last.fm
            </h3>
            {artist.signals.lastfm ? (
              <ul className="text-sm space-y-1" style={{ color: 'rgb(var(--muted))' }}>
                <li>Slušatelji: {formatNumber(artist.signals.lastfm.listeners)}</li>
                <li>Reprodukcije: {formatNumber(artist.signals.lastfm.playcount)}</li>
                {artist.signals.lastfm.tags?.length ? (
                  <li>Tagovi: {artist.signals.lastfm.tags.slice(0, 5).join(', ')}</li>
                ) : null}
              </ul>
            ) : (
              <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>Nema podataka</p>
            )}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Nadolazeći koncerti ({events.length})</h2>
        {events.length === 0 ? (
          <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
            Nema pronađenih koncerata u bazi. Možeš ih dohvatiti na početnoj stranici.
          </p>
        ) : (
          <ul className="space-y-2">
            {events.map((event) => (
              <li
                key={event.id}
                className="rounded-xl border p-4 flex items-center justify-between gap-4"
                style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}
              >
                <div>
                  <Link href={`/events/${event.id}`} className="font-medium hover:underline">
                    {event.name}
                  </Link>
                  <p className="text-xs mt-1" style={{ color: 'rgb(var(--muted))' }}>
                    {event.date} • {event.city || 'Nepoznat grad'}
                  </p>
                </div>
                {event.url && (
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs underline"
                  >
                    Ticketmaster
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Comments */}
      <section className="rounded-2xl border p-6" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
        <CommentSection targetType="artist" targetId={artist.id} />
      </section>

      {/* Footer meta */}
      <footer className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
        <p>Profil kreiran: {new Date(artist.createdAt).toLocaleDateString('hr-HR')}</p>
        <p>Zadnje ažuriranje: {new Date(artist.updatedAt).toLocaleDateString('hr-HR')}</p>
      </footer>
    </div>
  );
}

