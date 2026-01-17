'use client';

import Link from 'next/link';

type Props = {
  id: string;
  name: string;
  genres?: string[];
  signals?: {
    spotifyPopularity?: number;
    spotifyFollowers?: number;
    lastfmListeners?: number;
  };
  rank?: number;
  showStats?: boolean;
  compact?: boolean;
};

function formatNumber(num: number | undefined) {
  if (num === undefined) return '-';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export default function ArtistCard({ id, name, genres, signals, rank, showStats = true, compact = false }: Props) {
  if (compact) {
    return (
      <Link
        href={`/artists/${id}`}
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
          {genres && genres.length > 0 && (
            <p className="text-xs truncate" style={{ color: 'rgb(var(--muted))' }}>
              {genres.slice(0, 3).join(', ')}
            </p>
          )}
        </div>
        {showStats && signals?.spotifyPopularity !== undefined && (
          <div className="flex items-center gap-1 text-xs" style={{ color: 'rgb(var(--muted))' }}>
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {signals.spotifyPopularity}
          </div>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={`/artists/${id}`}
      className="rounded-2xl border p-4 block hover:border-[rgb(var(--accent))] transition-colors group"
      style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}
    >
      <div className="flex items-start gap-4">
        {/* Avatar placeholder */}
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
          style={{ background: 'rgb(var(--bg))' }}
        >
          {name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              {rank !== undefined && (
                <span className="text-xs px-2 py-0.5 rounded-full mr-2" style={{ background: 'rgb(var(--accent))', color: 'white' }}>
                  #{rank}
                </span>
              )}
              <h3 className="font-semibold text-lg group-hover:underline inline">{name}</h3>
            </div>
          </div>

          {genres && genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {genres.slice(0, 4).map((genre) => (
                <span
                  key={genre}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgb(var(--bg))' }}
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {showStats && signals && (
            <div className="flex flex-wrap gap-4 mt-3 text-xs" style={{ color: 'rgb(var(--muted))' }}>
              {signals.spotifyPopularity !== undefined && (
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Popularnost: {signals.spotifyPopularity}
                </div>
              )}
              {signals.spotifyFollowers !== undefined && (
                <div>Pratitelji: {formatNumber(signals.spotifyFollowers)}</div>
              )}
              {signals.lastfmListeners !== undefined && (
                <div>Slušatelji: {formatNumber(signals.lastfmListeners)}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

