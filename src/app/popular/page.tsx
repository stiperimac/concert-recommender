'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ArtistCard from '@/components/ArtistCard';
import EventCard from '@/components/EventCard';

type ArtistItem = {
  id: string;
  name: string;
  score: number;
  genres?: string[];
  signals?: {
    spotifyPopularity?: number;
    spotifyFollowers?: number;
    lastfmListeners?: number;
  };
};

type EventItem = {
  id: string;
  name: string;
  score: number;
  meta?: {
    date?: string;
    city?: string;
    url?: string;
    venue?: string;
    artists?: string[];
  };
};

export default function PopularPage() {
  const searchParams = useSearchParams();
  const initialScope = (searchParams.get('scope') as 'artist' | 'event') || 'artist';
  
  const [scope, setScope] = useState<'artist' | 'event'>(initialScope);
  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('month');
  const [items, setItems] = useState<(ArtistItem | EventItem)[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/popular?scope=${scope}&period=${period}&limit=30`);
        const data = await res.json();
        if (!cancelled) setItems(data.items || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [scope, period]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Popularno</h1>
        <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
          Globalna rang lista je ista za sve korisnike. Vremenska komponenta omogućuje pregled po danu/mjesecu/godini.
          Popularnost se računa kombinacijom vanjskih signala (Spotify, Last.fm) i internih interakcija korisnika.
        </p>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <label className="text-xs" style={{ color: 'rgb(var(--muted))' }}>Tip sadržaja</label>
          <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'rgb(var(--border))' }}>
            <button
              type="button"
              onClick={() => setScope('artist')}
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={{
                background: scope === 'artist' ? 'rgb(var(--accent))' : 'rgb(var(--bg))',
                color: scope === 'artist' ? 'white' : 'inherit',
              }}
            >
              🎤 Izvođači
            </button>
            <button
              type="button"
              onClick={() => setScope('event')}
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={{
                background: scope === 'event' ? 'rgb(var(--accent))' : 'rgb(var(--bg))',
                color: scope === 'event' ? 'white' : 'inherit',
              }}
            >
              🎫 Koncerti
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs" style={{ color: 'rgb(var(--muted))' }}>Period</label>
          <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'rgb(var(--border))' }}>
            {(['day', 'month', 'year'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  background: period === p ? 'rgb(var(--accent))' : 'rgb(var(--bg))',
                  color: period === p ? 'white' : 'inherit',
                }}
              >
                {p === 'day' ? 'Dan' : p === 'month' ? 'Mjesec' : 'Godina'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="py-8 text-center">
          <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>Učitavanje...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center rounded-2xl border" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
          <p className="text-lg mb-2">🔍</p>
          <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
            Nema podataka za odabrani period. Pokuši s drugim periodom ili uvezi više sadržaja.
          </p>
        </div>
      ) : scope === 'artist' ? (
        <div className="space-y-3">
          {(items as ArtistItem[]).map((item, idx) => (
            <ArtistCard
              key={item.id}
              id={item.id}
              name={item.name}
              genres={item.genres}
              signals={item.signals}
              rank={idx + 1}
              showStats
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(items as EventItem[]).map((item, idx) => (
            <EventCard
              key={item.id}
              id={item.id}
              name={item.name}
              date={item.meta?.date}
              city={item.meta?.city}
              venue={item.meta?.venue}
              artists={item.meta?.artists}
              url={item.meta?.url}
              rank={idx + 1}
              score={item.score}
            />
          ))}
        </div>
      )}

      {/* Info */}
      <section className="rounded-xl border p-4" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
        <h3 className="text-sm font-medium mb-2">Kako se računa popularnost?</h3>
        <ul className="text-xs space-y-1" style={{ color: 'rgb(var(--muted))' }}>
          <li><strong>Izvođači:</strong> Spotify popularnost × 10 + log(pratitelji) × 40 + log(Last.fm slušatelji) × 30 + interni lajkovi × 5</li>
          <li><strong>Koncerti:</strong> Broj izvođača × 50 + spremljeno × 10 + pregleda × 1</li>
          <li>Snapshot-i se generiraju po periodu (dan/mjesec/godina) i cache-iraju za brži dohvat.</li>
        </ul>
      </section>
    </div>
  );
}
