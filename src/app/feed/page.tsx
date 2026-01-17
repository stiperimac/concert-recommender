'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

type FeedItem = {
  id: string;
  userId: string;
  userName: string;
  userImage?: string;
  type: string;
  actionText: string;
  targetType: string;
  targetId: string;
  targetName: string;
  targetUrl: string;
  createdAt: string;
};

type SimilarUser = {
  userId: string;
  similarity: number;
  likesCount: number;
  isFollowing: boolean;
  name?: string;
  image?: string;
  likedArtists: string[];
};

export default function FeedPage() {
  const { status } = useSession();
  const isAuthed = status === 'authenticated';

  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [similarUsers, setSimilarUsers] = useState<SimilarUser[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [followingState, setFollowingState] = useState<Record<string, boolean>>({});

  async function loadFeed() {
    setLoadingFeed(true);
    try {
      const res = await fetch('/api/feed');
      const data = await res.json();
      setFeedItems(data.items || []);
    } finally {
      setLoadingFeed(false);
    }
  }

  async function loadSimilarUsers() {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/users?action=similar');
      const data = await res.json();
      setSimilarUsers(data.users || []);
      // Initialize following state
      const state: Record<string, boolean> = {};
      (data.users || []).forEach((u: SimilarUser) => {
        state[u.userId] = u.isFollowing;
      });
      setFollowingState(state);
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    if (!isAuthed) return;
    loadFeed();
    loadSimilarUsers();
  }, [isAuthed]);

  async function handleFollow(targetUserId: string) {
    const isCurrentlyFollowing = followingState[targetUserId];

    // Optimistic update
    setFollowingState((prev) => ({ ...prev, [targetUserId]: !isCurrentlyFollowing }));

    try {
      if (isCurrentlyFollowing) {
        await fetch(`/api/follow?userId=${targetUserId}`, { method: 'DELETE' });
      } else {
        await fetch('/api/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUserId }),
        });
      }
      // Reload feed after following/unfollowing
      loadFeed();
    } catch {
      // Revert on error
      setFollowingState((prev) => ({ ...prev, [targetUserId]: isCurrentlyFollowing }));
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'upravo sada';
    if (diffMins < 60) return `prije ${diffMins} min`;
    if (diffHours < 24) return `prije ${diffHours}h`;
    if (diffDays < 7) return `prije ${diffDays} dana`;
    return date.toLocaleDateString('hr-HR');
  }

  function getActivityIcon(type: string) {
    switch (type) {
      case 'like_artist':
        return '❤️';
      case 'save_event':
        return '📌';
      case 'view_event':
        return '👀';
      default:
        return '📍';
    }
  }

  if (!isAuthed) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Feed aktivnosti</h1>
        <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
          Za pregled feed-a potrebna je prijava.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Feed aktivnosti</h1>
        <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
          Prati što rade korisnici sa sličnim ukusom u glazbi.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Nedavna aktivnost</h2>
            <button
              type="button"
              onClick={loadFeed}
              className="text-sm underline"
              disabled={loadingFeed}
            >
              Osvježi
            </button>
          </div>

          {loadingFeed ? (
            <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>Učitavanje...</p>
          ) : feedItems.length === 0 ? (
            <div className="rounded-2xl border p-6 text-center" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
              <p className="text-lg mb-2">🔍</p>
              <p className="text-sm font-medium">Nema aktivnosti</p>
              <p className="text-xs mt-1" style={{ color: 'rgb(var(--muted))' }}>
                Prati slične korisnike da bi viđao njihovu aktivnost.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {feedItems.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border p-4"
                  style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}
                >
                  <div className="flex items-start gap-3">
                    {/* User avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-medium"
                      style={{
                        background: item.userImage ? 'transparent' : 'rgb(var(--accent))',
                        color: 'white',
                      }}
                    >
                      {item.userImage ? (
                        <img
                          src={item.userImage}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        (item.userName?.[0] || 'K').toUpperCase()
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{item.userName}</span>
                        {' '}{item.actionText}{' '}
                        <Link href={item.targetUrl} className="font-medium hover:underline">
                          {item.targetName}
                        </Link>
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'rgb(var(--muted))' }}>
                        {getActivityIcon(item.type)} {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Similar Users Sidebar */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Slični korisnici</h2>
          <p className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
            Korisnici s sličnim glazbenim ukusom (temeljem omiljenih izvođača)
          </p>

          {loadingUsers ? (
            <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>Učitavanje...</p>
          ) : similarUsers.length === 0 ? (
            <div className="rounded-xl border p-4" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
              <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
                Nema sličnih korisnika. Označi neke izvođače kao omiljene na{' '}
                <Link href="/onboarding" className="underline">Onboarding</Link> stranici.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {similarUsers.map((user) => (
                <li
                  key={user.userId}
                  className="rounded-xl border p-3"
                  style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-medium"
                      style={{
                        background: user.image ? 'transparent' : 'rgb(var(--accent))',
                        color: 'white',
                      }}
                    >
                      {user.image ? (
                        <img
                          src={user.image}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        (user.name?.[0] || 'K').toUpperCase()
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {user.name || 'Korisnik'}
                      </p>
                      <p className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
                        {user.similarity}% sličnost • {user.likesCount} omiljenih
                      </p>
                      {user.likedArtists.length > 0 && (
                        <p className="text-xs truncate mt-1" style={{ color: 'rgb(var(--muted))' }}>
                          Voli: {user.likedArtists.join(', ')}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleFollow(user.userId)}
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium flex-shrink-0"
                      style={{
                        borderColor: 'rgb(var(--border))',
                        background: followingState[user.userId] ? 'transparent' : 'rgb(var(--accent))',
                        color: followingState[user.userId] ? 'inherit' : 'white',
                      }}
                    >
                      {followingState[user.userId] ? 'Prestani pratiti' : 'Prati'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

