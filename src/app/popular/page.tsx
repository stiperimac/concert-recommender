'use client';

import { useEffect, useState } from 'react';

type Item = { id: string; name: string; score: number; meta?: any };

export default function PopularPage() {
  const [scope, setScope] = useState<'artist' | 'event'>('artist');
  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('month');
  const [items, setItems] = useState<Item[]>([]);
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
        </p>
      </header>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs" style={{ color: 'rgb(var(--muted))' }}>Tip sadržaja</label>
          <select
            className="rounded-lg border px-3 py-2"
            style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--bg))' }}
            value={scope}
            onChange={(e) => setScope(e.target.value as any)}
          >
            <option value="artist">Izvođači</option>
            <option value="event">Koncerti</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs" style={{ color: 'rgb(var(--muted))' }}>Period</label>
          <select
            className="rounded-lg border px-3 py-2"
            style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--bg))' }}
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
          >
            <option value="day">Dan</option>
            <option value="month">Mjesec</option>
            <option value="year">Godina</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>Učitavanje...</p>
      ) : (
        <ol className="space-y-2">
          {items.map((it, idx) => (
            <li key={it.id} className="rounded-xl border p-3 flex items-center justify-between gap-3" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
              <div className="flex items-baseline gap-3">
                <span className="text-sm" style={{ color: 'rgb(var(--muted))' }}>{idx + 1}.</span>
                <div>
                  <p className="font-medium">{it.name}</p>
                  {scope === 'event' && it.meta?.date ? (
                    <p className="text-xs mt-1" style={{ color: 'rgb(var(--muted))' }}>
                      {it.meta.date} • {it.meta.city || '-'}
                    </p>
                  ) : null}
                </div>
              </div>
              <span className="text-sm" style={{ color: 'rgb(var(--muted))' }}>{Math.round(it.score)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
