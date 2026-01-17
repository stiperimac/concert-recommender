'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import ArtistSearch from './ArtistSearch';

type PopularItem = {
  id: string;
  name: string;
  score: number;
};

export default function HomeDashboard() {
  const { status } = useSession();
  const [popular, setPopular] = useState<PopularItem[]>([]);
  const [loading, setLoading] = useState(false);
  const isAuthed = status === 'authenticated';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/popular?scope=artist&period=month&limit=5');
        const data = await res.json();
        if (!cancelled) setPopular(data.items || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const hint = useMemo(() => {
    if (!isAuthed) return 'Za personalizirane preporuke prijavi se Google računom.';
    return 'Idi na onboarding i spremi omiljene izvođače.';
  }, [isAuthed]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section className="rounded-2xl border p-4" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
        <h2 className="text-lg font-semibold">Pretraži izvođače</h2>
        <p className="text-sm mt-1" style={{ color: 'rgb(var(--muted))' }}>
          Pretraga radi nad lokalnom bazom. Ako izvođač ne postoji, možeš ga uvesti (Spotify/Last.fm) i potom dohvatiti koncerte (Ticketmaster).
        </p>
        <div className="mt-4">
          <ArtistSearch />
        </div>
        <div className="mt-4 text-sm">
          <p style={{ color: 'rgb(var(--muted))' }}>{hint}</p>
          <div className="mt-2 flex gap-3">
            <Link className="underline" href="/popular">Pogledaj popularno</Link>
            <Link className="underline" href="/recommendations">Moje preporuke</Link>
            <Link className="underline" href="/onboarding">Onboarding</Link>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border p-4" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
        <h2 className="text-lg font-semibold">Top izvođači ovaj mjesec</h2>
        <p className="text-sm mt-1" style={{ color: 'rgb(var(--muted))' }}>
          Globalna popularnost (ista za sve korisnike) - kombinacija vanjskih signala i interakcija u aplikaciji.
        </p>

        {loading ? (
          <p className="mt-4 text-sm" style={{ color: 'rgb(var(--muted))' }}>Učitavanje...</p>
        ) : (
          <ol className="mt-4 space-y-2">
            {popular.map((p, idx) => (
              <li key={p.id} className="flex items-center justify-between gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm" style={{ color: 'rgb(var(--muted))' }}>{idx + 1}.</span>
                  <span className="font-medium">{p.name}</span>
                </div>
                <span className="text-sm" style={{ color: 'rgb(var(--muted))' }}>{Math.round(p.score)}</span>
              </li>
            ))}
          </ol>
        )}

        <div className="mt-4 text-sm">
          <Link className="underline" href="/popular">Detaljnije rang liste</Link>
        </div>
      </section>
    </div>
  );
}
