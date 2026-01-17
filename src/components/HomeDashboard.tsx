'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import ArtistCard from './ArtistCard';
import EventCard from './EventCard';

type PopularArtist = {
  id: string;
  name: string;
  score: number;
};

type PopularEvent = {
  id: string;
  name: string;
  score: number;
  meta?: {
    date?: string;
    city?: string;
  };
};

type SearchResult = {
  type: 'artist' | 'event';
  id: string;
  name: string;
  genres?: string[];
  signals?: {
    spotifyPopularity?: number;
    spotifyFollowers?: number;
  };
  date?: string;
  city?: string;
};

export default function HomeDashboard() {
  const { status } = useSession();
  const [popularArtists, setPopularArtists] = useState<PopularArtist[]>([]);
  const [popularEvents, setPopularEvents] = useState<PopularEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const isAuthed = status === 'authenticated';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [artistsRes, eventsRes] = await Promise.all([
          fetch('/api/popular?scope=artist&period=month&limit=5'),
          fetch('/api/popular?scope=event&period=month&limit=5'),
        ]);
        const artistsData = await artistsRes.json();
        const eventsData = await eventsRes.json();
        if (!cancelled) {
          setPopularArtists(artistsData.items || []);
          setPopularEvents(eventsData.items || []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleSearch() {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const [artistsRes, eventsRes] = await Promise.all([
        fetch(`/api/search/artists?q=${encodeURIComponent(query)}`),
        fetch(`/api/search/events?q=${encodeURIComponent(query)}`),
      ]);
      const artistsData = await artistsRes.json();
      const eventsData = await eventsRes.json();

      const results: SearchResult[] = [];

      // Add artists
      (artistsData.items || []).forEach((a: any) => {
        results.push({
          type: 'artist',
          id: a.id,
          name: a.name,
          genres: a.genres,
          signals: a.signals,
        });
      });

      // Add events
      (eventsData.items || []).forEach((e: any) => {
        results.push({
          type: 'event',
          id: e.id,
          name: e.name,
          date: e.date,
          city: e.city,
        });
      });

      setSearchResults(results);
    } finally {
      setSearching(false);
    }
  }

  const hint = useMemo(() => {
    if (!isAuthed) return 'Za personalizirane preporuke prijavi se Google računom.';
    return 'Idi na onboarding i spremi omiljene izvođače za personalizirane preporuke.';
  }, [isAuthed]);

  return (
    <div className="space-y-8">
      {/* Search Section */}
      <section className="rounded-2xl border p-6" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
        <h2 className="text-lg font-semibold">Pretraži</h2>
        <p className="text-sm mt-1" style={{ color: 'rgb(var(--muted))' }}>
          Pretraži izvođače i koncerte u bazi podataka.
        </p>

        <div className="mt-4 flex gap-2">
          <label className="sr-only" htmlFor="searchq">Pretraga</label>
          <input
            id="searchq"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="npr. Coldplay, Zagreb, koncert..."
            className="flex-1 rounded-lg border px-4 py-2"
            style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--bg))' }}
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className="rounded-lg border px-4 py-2 font-medium"
            style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--accent))', color: 'white' }}
          >
            {searching ? '...' : 'Traži'}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
              {searchResults.length} rezultata
            </p>
            <ul className="space-y-2 max-h-80 overflow-y-auto">
              {searchResults.map((result) => (
                <li key={`${result.type}-${result.id}`}>
                  {result.type === 'artist' ? (
                    <ArtistCard
                      id={result.id}
                      name={result.name}
                      genres={result.genres}
                      signals={result.signals}
                      compact
                      showStats
                    />
                  ) : (
                    <EventCard
                      id={result.id}
                      name={result.name}
                      date={result.date}
                      city={result.city}
                      compact
                    />
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 text-sm">
          <p style={{ color: 'rgb(var(--muted))' }}>{hint}</p>
          <div className="mt-2 flex gap-3">
            <Link className="underline" href="/popular">Pogledaj popularno</Link>
            <Link className="underline" href="/recommendations">Moje preporuke</Link>
            <Link className="underline" href="/onboarding">Onboarding</Link>
          </div>
        </div>
      </section>

      {/* Popular Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Artists */}
        <section className="rounded-2xl border p-6" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Top izvođači</h2>
            <Link href="/popular?scope=artist" className="text-sm underline" style={{ color: 'rgb(var(--accent))' }}>
              Više →
            </Link>
          </div>
          <p className="text-sm mb-4" style={{ color: 'rgb(var(--muted))' }}>
            Najpopularniji izvođači ovaj mjesec
          </p>

          {loading ? (
            <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>Učitavanje...</p>
          ) : (
            <ul className="space-y-2">
              {popularArtists.map((artist, idx) => (
                <li key={artist.id}>
                  <ArtistCard
                    id={artist.id}
                    name={artist.name}
                    rank={idx + 1}
                    compact
                    showStats={false}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Top Events */}
        <section className="rounded-2xl border p-6" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Top koncerti</h2>
            <Link href="/popular?scope=event" className="text-sm underline" style={{ color: 'rgb(var(--accent))' }}>
              Više →
            </Link>
          </div>
          <p className="text-sm mb-4" style={{ color: 'rgb(var(--muted))' }}>
            Najpopularniji koncerti ovaj mjesec
          </p>

          {loading ? (
            <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>Učitavanje...</p>
          ) : (
            <ul className="space-y-2">
              {popularEvents.map((event, idx) => (
                <li key={event.id}>
                  <EventCard
                    id={event.id}
                    name={event.name}
                    date={event.meta?.date}
                    city={event.meta?.city}
                    rank={idx + 1}
                    score={event.score}
                    compact
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Quick Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border p-4 text-center" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
          <p className="text-3xl font-bold" style={{ color: 'rgb(var(--accent))' }}>
            {popularArtists.length > 0 ? '✓' : '-'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgb(var(--muted))' }}>Izvođači u bazi</p>
        </div>
        <div className="rounded-xl border p-4 text-center" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
          <p className="text-3xl font-bold" style={{ color: 'rgb(var(--accent))' }}>
            {popularEvents.length > 0 ? '✓' : '-'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgb(var(--muted))' }}>Koncerti u bazi</p>
        </div>
        <div className="rounded-xl border p-4 text-center" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
          <p className="text-3xl font-bold" style={{ color: 'rgb(var(--accent))' }}>4</p>
          <p className="text-xs mt-1" style={{ color: 'rgb(var(--muted))' }}>Vanjske izvore</p>
        </div>
        <div className="rounded-xl border p-4 text-center" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
          <p className="text-3xl font-bold" style={{ color: 'rgb(var(--accent))' }}>✓</p>
          <p className="text-xs mt-1" style={{ color: 'rgb(var(--muted))' }}>Personalizirano</p>
        </div>
      </section>
    </div>
  );
}
