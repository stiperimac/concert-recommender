'use client';

import Link from 'next/link';

type Props = {
  id: string;
  name: string;
  date?: string;
  city?: string;
  venue?: string;
  artists?: string[];
  imageUrl?: string;
  url?: string;
  rank?: number;
  score?: number;
  compact?: boolean;
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('hr-HR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function getDaysUntil(dateStr: string) {
  const eventDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Danas';
  if (diffDays === 1) return 'Sutra';
  if (diffDays < 0) return 'Prošlo';
  if (diffDays < 7) return `Za ${diffDays} dana`;
  if (diffDays < 30) return `Za ${Math.round(diffDays / 7)} tjedan/a`;
  return `Za ${Math.round(diffDays / 30)} mjesec/a`;
}

export default function EventCard({
  id,
  name,
  date,
  city,
  venue,
  artists,
  imageUrl,
  url,
  rank,
  score,
  compact = false,
}: Props) {
  if (compact) {
    return (
      <Link
        href={`/events/${id}`}
        className="rounded-xl border p-3 flex items-center gap-3 hover:border-[rgb(var(--accent))] transition-colors"
        style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}
      >
        {rank !== undefined && (
          <span className="text-lg font-bold w-6" style={{ color: 'rgb(var(--accent))' }}>
            {rank}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{name}</p>
          <p className="text-xs truncate" style={{ color: 'rgb(var(--muted))' }}>
            {date ? formatDate(date) : '-'} • {city || '-'}
          </p>
        </div>
        {score !== undefined && (
          <span className="text-sm font-medium" style={{ color: 'rgb(var(--muted))' }}>
            {Math.round(score)}
          </span>
        )}
      </Link>
    );
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden hover:border-[rgb(var(--accent))] transition-colors"
      style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}
    >
      {/* Image */}
      {imageUrl && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}
          />
          {date && (
            <div className="absolute bottom-3 left-3">
              <span
                className="px-2 py-1 rounded text-xs font-medium"
                style={{ background: 'rgb(var(--accent))', color: 'white' }}
              >
                {getDaysUntil(date)}
              </span>
            </div>
          )}
          {rank !== undefined && (
            <div className="absolute top-3 left-3">
              <span
                className="px-2 py-1 rounded-full text-sm font-bold"
                style={{ background: 'white', color: 'rgb(var(--accent))' }}
              >
                #{rank}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <Link href={`/events/${id}`}>
          <h3 className="font-semibold text-lg hover:underline line-clamp-2">{name}</h3>
        </Link>

        <div className="mt-2 space-y-1 text-sm" style={{ color: 'rgb(var(--muted))' }}>
          {date && (
            <p className="flex items-center gap-2">
              <span>📅</span>
              {formatDate(date)}
            </p>
          )}
          {(city || venue) && (
            <p className="flex items-center gap-2">
              <span>📍</span>
              {venue ? `${venue}, ${city}` : city}
            </p>
          )}
        </div>

        {artists && artists.length > 0 && (
          <p className="mt-2 text-xs truncate" style={{ color: 'rgb(var(--muted))' }}>
            🎤 {artists.slice(0, 3).join(', ')}
            {artists.length > 3 && ` +${artists.length - 3}`}
          </p>
        )}

        <div className="flex items-center justify-between mt-4">
          <Link
            href={`/events/${id}`}
            className="text-sm font-medium hover:underline"
            style={{ color: 'rgb(var(--accent))' }}
          >
            Detalji →
          </Link>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-xs underline"
              style={{ color: 'rgb(var(--muted))' }}
            >
              Ticketmaster
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

