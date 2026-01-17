'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';

type Profile = {
  city?: string;
  favoriteArtists?: string[];
  onboardingCompleted?: boolean;
};

export default function OnboardingPage() {
  const { status } = useSession();
  const isAuthed = status === 'authenticated';

  const [profile, setProfile] = useState<Profile | null>(null);
  const [city, setCity] = useState('Zagreb');
  const [artistsText, setArtistsText] = useState('');
  const [saving, setSaving] = useState(false);

  const favoriteArtists = useMemo(() => {
    return artistsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 30);
  }, [artistsText]);

  useEffect(() => {
    if (!isAuthed) return;
    (async () => {
      const res = await fetch('/api/me/profile');
      const data = await res.json();
      setProfile(data.profile || null);
      setCity(data.profile?.city || 'Zagreb');
      setArtistsText((data.profile?.favoriteArtists || []).join('\n'));
    })();
  }, [isAuthed]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: city.trim(),
          favoriteArtists,
          onboardingCompleted: true
        })
      });
      const data = await res.json();
      setProfile(data.profile || null);
    } finally {
      setSaving(false);
    }
  }

  if (!isAuthed) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Onboarding</h1>
        <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
          Za spremanje preferencija potrebna je prijava.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Onboarding</h1>
        <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
          Ovdje se definiraju eksplicitne preferencije korisnika (omiljeni izvođači i grad) koje sustav koristi za preporuke.
        </p>
      </header>

      <section className="rounded-2xl border p-4 space-y-4" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
        <div>
          <label className="text-sm font-medium" htmlFor="city">Grad</label>
          <input
            id="city"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--bg))' }}
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <p className="text-xs mt-1" style={{ color: 'rgb(var(--muted))' }}>
            Ticketmaster pretraga koristi grad; promijeni ga prema potrebi.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="artists">Omiljeni izvođači (jedan po retku)</label>
          <textarea
            id="artists"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--bg))' }}
            rows={10}
            value={artistsText}
            onChange={(e) => setArtistsText(e.target.value)}
          />
          <p className="text-xs mt-1" style={{ color: 'rgb(var(--muted))' }}>
            Ograničenje: 30 izvođača.
          </p>
        </div>

        <div className="flex gap-3 items-center">
          <button
            type="button"
            onClick={save}
            className="rounded-lg border px-3 py-2"
            style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--bg))' }}
            disabled={saving}
          >
            Spremi preferencije
          </button>
          {profile?.onboardingCompleted ? (
            <span className="text-sm" style={{ color: 'rgb(var(--muted))' }}>Preferencije su spremljene.</span>
          ) : null}
        </div>
      </section>
    </div>
  );
}
