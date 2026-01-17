'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import CommentSection from '@/components/CommentSection';

type EventData = {
  event: {
    id: string;
    tmId: string;
    name: string;
    date: string;
    localDateTime?: string;
    city?: string;
    countryCode?: string;
    venue?: string;
    url?: string;
    images?: Array<{ url: string; width?: number; height?: number }>;
    location?: { lat: number; lon: number };
    createdAt: string;
    updatedAt: string;
  };
  artists: Array<{
    id: string | null;
    name: string;
    genres: string[];
  }>;
  stats: {
    saves: number;
    views: number;
  };
  weather: {
    label: string;
    temp?: number;
    precipitation?: number;
  } | null;
};

export default function EventDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { status } = useSession();
  const isAuthed = status === 'authenticated';

  const [data, setData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/events/${id}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to load event');
        }
        const json = await res.json();
        setData(json);

        // Record a view interaction
        if (isAuthed) {
          fetch('/api/interactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'view_event',
              targetType: 'event',
              targetId: json.event.id,
            }),
          }).catch(() => {});
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isAuthed]);

  async function handleSave() {
    if (!isAuthed || !data) return;
    setSaving(true);
    try {
      await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'save_event',
          targetType: 'event',
          targetId: data.event.id,
        }),
      });
      setSaved(true);
      setData((prev) =>
        prev ? { ...prev, stats: { ...prev.stats, saves: prev.stats.saves + 1 } } : prev
      );
    } finally {
      setSaving(false);
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
        <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>{error || 'Koncert nije pronađen.'}</p>
        <Link href="/" className="underline">Povratak na početnu</Link>
      </div>
    );
  }

  const { event, artists, stats, weather } = data;
  const mainImage = event.images?.find((img) => img.width && img.width >= 500) || event.images?.[0];

  return (
    <div className="space-y-8">
      {/* Hero Image */}
      {mainImage && (
        <div className="relative rounded-2xl overflow-hidden" style={{ maxHeight: '300px' }}>
          <img
            src={mainImage.url}
            alt={event.name}
            className="w-full h-full object-cover"
            style={{ maxHeight: '300px' }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}
          />
        </div>
      )}

      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{event.name}</h1>
            <p className="text-lg mt-2" style={{ color: 'rgb(var(--muted))' }}>
              {new Date(event.date).toLocaleDateString('hr-HR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!isAuthed || saving || saved}
              className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
              style={{
                borderColor: 'rgb(var(--border))',
                background: saved ? 'rgb(var(--accent))' : 'rgb(var(--card))',
                color: saved ? 'white' : 'inherit',
              }}
            >
              {saved ? '✓ Spremljeno' : saving ? '...' : '+ Spremi koncert'}
            </button>
            {event.url && (
              <a
                href={event.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border px-4 py-2 text-sm font-medium text-center"
                style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}
              >
                Kupi ulaznice →
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Info Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border p-4" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
          <p className="text-xs uppercase tracking-wide" style={{ color: 'rgb(var(--muted))' }}>Lokacija</p>
          <p className="text-lg font-bold mt-1">{event.city || '-'}</p>
          <p className="text-xs" style={{ color: 'rgb(var(--muted))' }}>{event.countryCode}</p>
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
          <p className="text-xs uppercase tracking-wide" style={{ color: 'rgb(var(--muted))' }}>Mjesto</p>
          <p className="text-lg font-bold mt-1">{event.venue || '-'}</p>
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
          <p className="text-xs uppercase tracking-wide" style={{ color: 'rgb(var(--muted))' }}>Spremljeno</p>
          <p className="text-2xl font-bold mt-1">{stats.saves}</p>
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
          <p className="text-xs uppercase tracking-wide" style={{ color: 'rgb(var(--muted))' }}>Pregleda</p>
          <p className="text-2xl font-bold mt-1">{stats.views}</p>
        </div>
      </div>

      {/* Weather Forecast */}
      {weather && (
        <section className="rounded-2xl border p-6" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
          <h2 className="text-lg font-semibold mb-2">Vremenska prognoza</h2>
          <div className="flex items-center gap-4">
            <div className="text-4xl">
              {weather.label.toLowerCase().includes('rain') || weather.label.toLowerCase().includes('kiša')
                ? '🌧️'
                : weather.label.toLowerCase().includes('cloud') || weather.label.toLowerCase().includes('oblač')
                ? '☁️'
                : weather.label.toLowerCase().includes('sun') || weather.label.toLowerCase().includes('vedro')
                ? '☀️'
                : '🌤️'}
            </div>
            <div>
              <p className="font-medium">{weather.label}</p>
              {weather.temp !== undefined && (
                <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
                  Temperatura: {weather.temp}°C
                </p>
              )}
              {weather.precipitation !== undefined && weather.precipitation > 0 && (
                <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
                  Oborine: {weather.precipitation} mm
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Performing Artists */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Izvođači ({artists.length})</h2>
        <ul className="space-y-2">
          {artists.map((artist, idx) => (
            <li
              key={artist.id || idx}
              className="rounded-xl border p-4 flex items-center justify-between gap-4"
              style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}
            >
              <div>
                {artist.id ? (
                  <Link href={`/artists/${artist.id}`} className="font-medium hover:underline">
                    {artist.name}
                  </Link>
                ) : (
                  <span className="font-medium">{artist.name}</span>
                )}
                {artist.genres.length > 0 && (
                  <p className="text-xs mt-1" style={{ color: 'rgb(var(--muted))' }}>
                    {artist.genres.slice(0, 4).join(', ')}
                  </p>
                )}
              </div>
              {artist.id && (
                <Link
                  href={`/artists/${artist.id}`}
                  className="text-xs underline"
                >
                  Profil →
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Map placeholder */}
      {event.location && (
        <section className="rounded-2xl border p-6" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
          <h2 className="text-lg font-semibold mb-2">Lokacija</h2>
          <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
            Koordinate: {event.location.lat.toFixed(4)}, {event.location.lon.toFixed(4)}
          </p>
          <a
            href={`https://www.google.com/maps?q=${event.location.lat},${event.location.lon}`}
            target="_blank"
            rel="noreferrer"
            className="inline-block mt-2 text-sm underline"
          >
            Otvori u Google Maps →
          </a>
        </section>
      )}

      {/* Comments */}
      <section className="rounded-2xl border p-6" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
        <CommentSection targetType="event" targetId={event.id} />
      </section>

      {/* Footer meta */}
      <footer className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
        <p>Ticketmaster ID: {event.tmId}</p>
        <p>Dodano u bazu: {new Date(event.createdAt).toLocaleDateString('hr-HR')}</p>
      </footer>
    </div>
  );
}

