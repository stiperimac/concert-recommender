'use client';

import { useSession } from 'next-auth/react';
import { useMemo, useState } from 'react';

type ArtistResult = {
  id: string;
  name: string;
  genres?: string[];
  signals?: {
    spotifyPopularity?: number;
    spotifyFollowers?: number;
    lastfmListeners?: number;
    lastfmPlaycount?: number;
  };
};

export default function ArtistSearch() {
  const { status } = useSession();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<ArtistResult[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const canMutate = status === 'authenticated';

  const helper = useMemo(() => {
    if (canMutate) return 'Možeš uvesti izvođača i označiti ga kao omiljenog.';
    return 'Za uvoz ili spremanje omiljenih izvođača potrebna je prijava.';
  }, [canMutate]);

  async function search() {
    const query = q.trim();
    if (!query) {
      setResults([]);
      return;
    }
    setBusy('search');
    try {
      const res = await fetch(`/api/search/artists?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.items || []);
    } finally {
      setBusy(null);
    }
  }

  async function ingest(name: string) {
    if (!canMutate) return;
    setBusy(name);
    try {
      const res = await fetch(`/api/search/artists?ingest=1&q=${encodeURIComponent(name)}`, { method: 'POST' });
      const data = await res.json();
      setResults(data.items || []);
    } finally {
      setBusy(null);
    }
  }

  async function like(artistId: string) {
    if (!canMutate) return;
    setBusy(`like:${artistId}`);
    try {
      await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'like_artist', targetType: 'artist', targetId: artistId })
      });
    } finally {
      setBusy(null);
    }
  }

  async function fetchEvents(artistName: string) {
    if (!canMutate) return;
    setBusy(`events:${artistName}`);
    try {
      await fetch(`/api/search/events?ingest=1&artist=${encodeURIComponent(artistName)}`, { method: 'POST' });
      // no-op; user can see results on recommendations/popular
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="artistq">Naziv izvođača</label>
        <input
          id="artistq"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="npr. Coldplay"
          className="flex-1 rounded-lg border px-3 py-2"
          style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--bg))' }}
        />
        <button
          type="button"
          onClick={search}
          className="rounded-lg border px-3 py-2"
          style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}
          disabled={busy === 'search'}
        >
          Traži
        </button>
      </div>
      <p className="text-xs" style={{ color: 'rgb(var(--muted))' }}>{helper}</p>

      {results.length > 0 && (
        <ul className="space-y-2">
          {results.map((a) => (
            <li key={a.id} className="rounded-xl border p-3" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--bg))' }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{a.name}</p>
                  {a.genres?.length ? (
                    <p className="text-xs mt-1" style={{ color: 'rgb(var(--muted))' }}>
                      Žanrovi: {a.genres.slice(0, 5).join(', ')}
                    </p>
                  ) : null}
                  {a.signals ? (
                    <p className="text-xs mt-1" style={{ color: 'rgb(var(--muted))' }}>
                      Signali: Spotify pop {a.signals.spotifyPopularity ?? '-'} • followers {a.signals.spotifyFollowers ?? '-'} • Last.fm listeners {a.signals.lastfmListeners ?? '-'}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => ingest(a.name)}
                    className="rounded-lg border px-3 py-2 text-xs"
                    style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}
                    disabled={!canMutate || busy === a.name}
                  >
                    Uvezi/Obnovi
                  </button>
                  <button
                    type="button"
                    onClick={() => fetchEvents(a.name)}
                    className="rounded-lg border px-3 py-2 text-xs"
                    style={{ borderColor: 'rgb(var(--border))', background: 'transparent' }}
                    disabled={!canMutate || busy === `events:${a.name}`}
                  >
                    Dohvati koncerte
                  </button>
                  <button
                    type="button"
                    onClick={() => like(a.id)}
                    className="rounded-lg border px-3 py-2 text-xs"
                    style={{ borderColor: 'rgb(var(--border))', background: 'transparent' }}
                    disabled={!canMutate || busy === `like:${a.id}`}
                  >
                    Omiljeni
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
