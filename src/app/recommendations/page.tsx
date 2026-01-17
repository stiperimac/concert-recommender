'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

type BreakdownItem = {
  factor: string;
  points: number;
  percentage: number;
};

type RecItem = {
  id: string;
  name: string;
  score: number;
  meta?: {
    date?: string;
    city?: string;
    venue?: string;
    url?: string;
    artists?: string[];
    reason?: string[];
    breakdown?: BreakdownItem[];
    weather?: {
      label: string;
      temp?: number;
      precipitation?: number;
    };
    isColdStart?: boolean;
  };
};

const FACTOR_LABELS: Record<string, string> = {
  favorite_artist: 'Omiljeni izvođač',
  genre_match: 'Poklapanje žanrova',
  artist_popularity: 'Popularnost izvođača',
  similar_users: 'Slični korisnici',
  collaborative: 'Kolaborativno filtriranje',
  recency: 'Blizina datuma',
  trending: 'Trending',
};

const FACTOR_COLORS: Record<string, string> = {
  favorite_artist: '#3b82f6',
  genre_match: '#8b5cf6',
  artist_popularity: '#22c55e',
  similar_users: '#f59e0b',
  collaborative: '#ec4899',
  recency: '#06b6d4',
  trending: '#ef4444',
};

export default function RecommendationsPage() {
  const { status } = useSession();
  const [items, setItems] = useState<RecItem[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isColdStart, setIsColdStart] = useState(false);
  const isAuthed = status === 'authenticated';

  // Filters
  const [cityFilter, setCityFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showBreakdown, setShowBreakdown] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/recommendations');
      const data = await res.json();
      setItems(data.items || []);
      setGeneratedAt(data.generatedAt || null);
    } finally {
      setLoading(false);
    }
  }

  async function compute() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cityFilter.trim()) params.set('city', cityFilter.trim());
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await fetch(`/api/recommendations?${params.toString()}`, { method: 'POST' });
      const data = await res.json();
      setItems(data.items || []);
      setGeneratedAt(data.generatedAt || null);
      setIsColdStart(data.isColdStart || false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthed) return;
    load();
  }, [isAuthed]);

  if (!isAuthed) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Moje preporuke</h1>
        <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
          Za personalizirane preporuke potrebna je prijava.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Moje preporuke</h1>
        <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
          Personalizirane preporuke koriste: omiljene izvođače, žanrovsko poklapanje, ponašanje sličnih korisnika,
          popularnost izvođača i vremensku prognozu.
        </p>
      </header>

      {/* Filters */}
      <section className="rounded-2xl border p-4" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
        <h2 className="text-sm font-medium mb-3">Filteri</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs block mb-1" style={{ color: 'rgb(var(--muted))' }}>Grad</label>
            <input
              type="text"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder="npr. Zagreb"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--bg))' }}
            />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: 'rgb(var(--muted))' }}>Od datuma</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--bg))' }}
            />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: 'rgb(var(--muted))' }}>Do datuma</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--bg))' }}
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={compute}
              className="w-full rounded-lg border px-3 py-2 text-sm font-medium"
              style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--accent))', color: 'white' }}
              disabled={loading}
            >
              {loading ? 'Računam...' : 'Izračunaj preporuke'}
            </button>
          </div>
        </div>
      </section>

      {/* Cold start notice */}
      {isColdStart && (
        <div className="rounded-xl border-2 p-4" style={{ borderColor: 'rgb(var(--accent))', background: 'rgba(var(--accent), 0.1)' }}>
          <p className="text-sm font-medium">🌟 Novi korisnik</p>
          <p className="text-xs mt-1" style={{ color: 'rgb(var(--muted))' }}>
            Nemaš još omiljenih izvođača. Prikazujemo ti trending i popularne koncerte.
            <Link href="/onboarding" className="underline ml-1">Postavi preferencije →</Link>
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 items-center">
        <button
          type="button"
          onClick={load}
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'rgb(var(--border))', background: 'transparent' }}
          disabled={loading}
        >
          Osvježi
        </button>
        {generatedAt ? (
          <span className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
            Generirano: {new Date(generatedAt).toLocaleString('hr-HR')}
          </span>
        ) : null}
      </div>

      {/* Results */}
      {loading ? (
        <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>Učitavanje...</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border p-4" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
          <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
            Nema preporuka. Idi na <Link href="/onboarding" className="underline">Onboarding</Link>, spremi omiljene izvođače i postavi grad, zatim ponovno izračunaj.
          </p>
        </div>
      ) : (
        <ol className="space-y-4">
          {items.map((it, idx) => (
            <li
              key={it.id}
              className="rounded-xl border p-4"
              style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold" style={{ color: 'rgb(var(--accent))' }}>{idx + 1}</span>
                    <Link href={`/events/${it.id}`} className="text-lg font-medium hover:underline">
                      {it.name}
                    </Link>
                  </div>
                  <p className="text-sm mt-1" style={{ color: 'rgb(var(--muted))' }}>
                    📅 {it.meta?.date || '-'} • 📍 {it.meta?.city || '-'}
                    {it.meta?.venue && ` • ${it.meta.venue}`}
                  </p>
                  {it.meta?.artists && it.meta.artists.length > 0 && (
                    <p className="text-xs mt-1" style={{ color: 'rgb(var(--muted))' }}>
                      🎤 {it.meta.artists.slice(0, 5).join(', ')}
                    </p>
                  )}

                  {/* Weather */}
                  {it.meta?.weather && (
                    <p className="text-xs mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: 'rgba(var(--accent), 0.1)' }}>
                      {it.meta.weather.label}
                      {it.meta.weather.temp !== undefined && ` • ${it.meta.weather.temp}°C`}
                    </p>
                  )}

                  {/* Score breakdown toggle */}
                  <button
                    type="button"
                    onClick={() => setShowBreakdown(showBreakdown === it.id ? null : it.id)}
                    className="text-xs underline mt-2 block"
                  >
                    {showBreakdown === it.id ? 'Sakrij detalje' : 'Prikaži razloge preporuke'}
                  </button>

                  {/* Detailed breakdown */}
                  {showBreakdown === it.id && it.meta?.breakdown && (
                    <div className="mt-3 p-3 rounded-lg" style={{ background: 'rgb(var(--bg))' }}>
                      <p className="text-xs font-medium mb-2">Raščlamba skora:</p>
                      <div className="space-y-2">
                        {it.meta.breakdown.map((b, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${Math.max(b.percentage, 5)}%`,
                                background: FACTOR_COLORS[b.factor] || '#888',
                              }}
                            />
                            <span className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
                              {FACTOR_LABELS[b.factor] || b.factor}: {b.points} bodova ({b.percentage}%)
                            </span>
                          </div>
                        ))}
                      </div>
                      {it.meta.reason && it.meta.reason.length > 0 && (
                        <ul className="mt-3 text-xs space-y-1 list-disc pl-4" style={{ color: 'rgb(var(--muted))' }}>
                          {it.meta.reason.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-right flex flex-col gap-2">
                  <p className="text-sm font-bold">{Math.round(it.score)}</p>
                  <p className="text-xs" style={{ color: 'rgb(var(--muted))' }}>bodova</p>
                  {it.meta?.url && (
                    <a
                      className="text-xs underline"
                      href={it.meta.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ticketmaster
                    </a>
                  )}
                  <Link
                    href={`/events/${it.id}`}
                    className="text-xs underline"
                  >
                    Detalji →
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      {/* Legend */}
      {items.length > 0 && (
        <section className="rounded-xl border p-4" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
          <h3 className="text-sm font-medium mb-2">Legenda faktora</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(FACTOR_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ background: FACTOR_COLORS[key] }} />
                <span className="text-xs" style={{ color: 'rgb(var(--muted))' }}>{label}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
