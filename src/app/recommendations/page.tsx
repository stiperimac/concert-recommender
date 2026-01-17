'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

type RecItem = {
  id: string;
  name: string;
  score: number;
  meta?: {
    date?: string;
    city?: string;
    url?: string;
    reason?: string[];
    weather?: string;
  };
};

export default function RecommendationsPage() {
  const { status } = useSession();
  const [items, setItems] = useState<RecItem[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isAuthed = status === 'authenticated';

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
      const res = await fetch('/api/recommendations', { method: 'POST' });
      const data = await res.json();
      setItems(data.items || []);
      setGeneratedAt(data.generatedAt || null);
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
          Preporuke koriste omiljene izvođače, ponašanje sličnih korisnika, trendove u aplikaciji i vremensku prognozu.
        </p>
      </header>

      <div className="flex flex-wrap gap-3 items-center">
        <button
          type="button"
          onClick={compute}
          className="rounded-lg border px-3 py-2"
          style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}
          disabled={loading}
        >
          Izračunaj preporuke
        </button>
        <button
          type="button"
          onClick={load}
          className="rounded-lg border px-3 py-2"
          style={{ borderColor: 'rgb(var(--border))', background: 'transparent' }}
          disabled={loading}
        >
          Osvježi
        </button>
        {generatedAt ? (
          <span className="text-sm" style={{ color: 'rgb(var(--muted))' }}>Generirano: {generatedAt}</span>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>Učitavanje...</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border p-4" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
          <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
            Nema preporuka. Idi na Onboarding, spremi omiljene izvođače i postavi grad, zatim ponovno izračunaj.
          </p>
        </div>
      ) : (
        <ol className="space-y-2">
          {items.map((it, idx) => (
            <li key={it.id} className="rounded-xl border p-4" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{idx + 1}. {it.name}</p>
                  <p className="text-xs mt-1" style={{ color: 'rgb(var(--muted))' }}>
                    {it.meta?.date || '-'} • {it.meta?.city || '-'}
                  </p>
                  {it.meta?.weather ? (
                    <p className="text-xs mt-1" style={{ color: 'rgb(var(--muted))' }}>
                      Vrijeme: {it.meta.weather}
                    </p>
                  ) : null}
                  {it.meta?.reason?.length ? (
                    <ul className="text-xs mt-2 list-disc pl-5" style={{ color: 'rgb(var(--muted))' }}>
                      {it.meta.reason.slice(0, 4).map((r) => <li key={r}>{r}</li>)}
                    </ul>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>Score {Math.round(it.score)}</p>
                  {it.meta?.url ? (
                    <a className="text-sm underline" href={it.meta.url} target="_blank" rel="noreferrer">
                      Ticketmaster
                    </a>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
