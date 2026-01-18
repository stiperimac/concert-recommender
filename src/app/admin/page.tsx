'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

type IngestResult = {
  name: string;
  artistId?: string;
  eventCount?: number;
  status: string;
};

export default function AdminPage() {
  const { status } = useSession();
  const isAuthed = status === 'authenticated';

  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Batch ingest form
  const [artistsText, setArtistsText] = useState('');
  const [city, setCity] = useState('');
  const [withEvents, setWithEvents] = useState(true);

  async function runAction(action: string, extraBody: any = {}) {
    setLoading(action);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/admin/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extraBody }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }

      setResult(data);
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally {
      setLoading(null);
    }
  }

  if (!isAuthed) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
          Za pristup admin panelu potrebna je prijava.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
          Upravljanje sadržajem i osvježavanje podataka iz vanjskih izvora.
          Pristup je ograničen na admin korisnike.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {}
        <section className="rounded-2xl border p-6" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
          <h2 className="text-lg font-semibold mb-2">Batch uvoz izvođača</h2>
          <p className="text-xs mb-4" style={{ color: 'rgb(var(--muted))' }}>
            Unesi imena izvođača (jedan po retku, max 50). Dohvatit će profile iz Spotifyja i Last.fm-a,
            te opcionalno koncerte iz Ticketmastera.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs block mb-1" style={{ color: 'rgb(var(--muted))' }}>Izvođači (jedan po retku)</label>
              <textarea
                value={artistsText}
                onChange={(e) => setArtistsText(e.target.value)}
                rows={6}
                placeholder="Coldplay&#10;Ed Sheeran&#10;Taylor Swift"
                className="w-full rounded-lg border px-3 py-2 text-sm resize-none"
                style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--bg))' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs block mb-1" style={{ color: 'rgb(var(--muted))' }}>Grad (opcionalno)</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="npr. Zagreb"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--bg))' }}
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={withEvents}
                    onChange={(e) => setWithEvents(e.target.checked)}
                  />
                  Dohvati i koncerte
                </label>
              </div>
            </div>

            <button
              type="button"
              onClick={() => runAction('batch_ingest', { artists: artistsText, city, withEvents })}
              disabled={loading === 'batch_ingest' || !artistsText.trim()}
              className="w-full rounded-lg border px-4 py-2 text-sm font-medium"
              style={{
                borderColor: 'rgb(var(--border))',
                background: 'rgb(var(--accent))',
                color: 'white',
                opacity: loading === 'batch_ingest' || !artistsText.trim() ? 0.6 : 1,
              }}
            >
              {loading === 'batch_ingest' ? 'Uvoz u tijeku...' : 'Pokreni batch uvoz'}
            </button>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="rounded-2xl border p-6" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
          <h2 className="text-lg font-semibold mb-2">Brze akcije</h2>
          <p className="text-xs mb-4" style={{ color: 'rgb(var(--muted))' }}>
            Osvježi podatke za sve postojeće izvođače u bazi.
          </p>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => runAction('refresh_artists')}
              disabled={loading === 'refresh_artists'}
              className="w-full rounded-lg border px-4 py-3 text-sm text-left"
              style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--bg))' }}
            >
              <span className="font-medium">🔄 Osvježi profile izvođača</span>
              <p className="text-xs mt-1" style={{ color: 'rgb(var(--muted))' }}>
                Dohvati svježe podatke iz Spotifyja i Last.fm-a za sve izvođače u bazi.
              </p>
              {loading === 'refresh_artists' && <p className="text-xs mt-1">U tijeku...</p>}
            </button>

            <button
              type="button"
              onClick={() => runAction('refresh_events', { city })}
              disabled={loading === 'refresh_events'}
              className="w-full rounded-lg border px-4 py-3 text-sm text-left"
              style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--bg))' }}
            >
              <span className="font-medium">🎫 Dohvati nove koncerte</span>
              <p className="text-xs mt-1" style={{ color: 'rgb(var(--muted))' }}>
                Dohvati nadolazeće koncerte iz Ticketmastera za sve izvođače.
                {city && ` (grad: ${city})`}
              </p>
              {loading === 'refresh_events' && <p className="text-xs mt-1">U tijeku...</p>}
            </button>

            <button
              type="button"
              onClick={() => runAction('regenerate_popularity')}
              disabled={loading === 'regenerate_popularity'}
              className="w-full rounded-lg border px-4 py-3 text-sm text-left"
              style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--bg))' }}
            >
              <span className="font-medium">📊 Regeneriraj popularnost</span>
              <p className="text-xs mt-1" style={{ color: 'rgb(var(--muted))' }}>
                Preračunaj globalne liste popularnosti (dnevne i mjesečne snapshot-e).
              </p>
              {loading === 'regenerate_popularity' && <p className="text-xs mt-1">U tijeku...</p>}
            </button>
          </div>
        </section>
      </div>

      {/* Results */}
      {(result || error) && (
        <section className="rounded-2xl border p-6" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
          <h2 className="text-lg font-semibold mb-2">Rezultat</h2>

          {error && (
            <div className="rounded-lg p-4" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <p className="text-sm font-medium">Greška</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Akcija:</span>
                <span className="text-sm">{result.action}</span>
                {result.count !== undefined && (
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgb(var(--bg))' }}>
                    {result.count} stavki
                  </span>
                )}
              </div>

              {result.snapshots && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(result.snapshots).map(([key, value]) => (
                    <div key={key} className="rounded-lg p-2 text-center" style={{ background: 'rgb(var(--bg))' }}>
                      <p className="text-xs" style={{ color: 'rgb(var(--muted))' }}>{key}</p>
                      <p className="text-lg font-bold">{String(value)}</p>
                    </div>
                  ))}
                </div>
              )}

              {result.results && Array.isArray(result.results) && result.results.length > 0 && (
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'rgb(var(--border))' }}>
                        <th className="text-left py-2">Naziv</th>
                        <th className="text-left py-2">Status</th>
                        {result.results[0].eventCount !== undefined && (
                          <th className="text-right py-2">Koncerti</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {(result.results as IngestResult[]).map((r, i) => (
                        <tr key={i} className="border-b" style={{ borderColor: 'rgb(var(--border))' }}>
                          <td className="py-2">{r.name}</td>
                          <td className="py-2">
                            <span
                              className="text-xs px-2 py-0.5 rounded"
                              style={{
                                background: r.status === 'ok' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                color: r.status === 'ok' ? '#22c55e' : '#ef4444',
                              }}
                            >
                              {r.status}
                            </span>
                          </td>
                          {r.eventCount !== undefined && (
                            <td className="text-right py-2">{r.eventCount}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {}
      <section className="rounded-2xl border p-6" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
        <h2 className="text-lg font-semibold mb-2"></h2>
        <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
          
        </p>
        <ul className="mt-3 space-y-2 text-sm font-mono" style={{ color: 'rgb(var(--muted))' }}>
          </ul>
        <p className="text-xs mt-3" style={{ color: 'rgb(var(--muted))' }}>
         </p>
      </section>
    </div>
  );
}

