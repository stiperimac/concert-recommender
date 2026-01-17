'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

type Comment = {
  id: string;
  userId: string;
  userName?: string;
  userImage?: string;
  text: string;
  createdAt: string;
};

type Props = {
  targetType: 'artist' | 'event';
  targetId: string;
};

export default function CommentSection({ targetType, targetId }: Props) {
  const { data: session, status } = useSession();
  const isAuthed = status === 'authenticated';
  const currentUserId = (session?.user as any)?.id;

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadComments() {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?targetType=${targetType}&targetId=${targetId}`);
      const data = await res.json();
      setComments(data.comments || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComments();
  }, [targetType, targetId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthed || !text.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, text: text.trim() }),
      });
      if (res.ok) {
        setText('');
        loadComments();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm('Jeste li sigurni da želite obrisati ovaj komentar?')) return;
    
    try {
      const res = await fetch(`/api/comments?id=${commentId}`, { method: 'DELETE' });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch {
      // Ignore errors
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

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Komentari ({comments.length})</h2>

      {/* Comment form */}
      {isAuthed ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Napiši komentar..."
            rows={3}
            maxLength={1000}
            className="w-full rounded-lg border px-3 py-2 text-sm resize-none"
            style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--bg))' }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
              {text.length}/1000
            </span>
            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className="rounded-lg border px-4 py-2 text-sm font-medium"
              style={{
                borderColor: 'rgb(var(--border))',
                background: text.trim() ? 'rgb(var(--accent))' : 'rgb(var(--card))',
                color: text.trim() ? 'white' : 'inherit',
                opacity: submitting || !text.trim() ? 0.6 : 1,
              }}
            >
              {submitting ? 'Slanje...' : 'Objavi'}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
          Prijavi se za ostavljanje komentara.
        </p>
      )}

      {/* Comments list */}
      {loading ? (
        <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>Učitavanje...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
          Još nema komentara. Budi prvi!
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="rounded-xl border p-4"
              style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-medium"
                  style={{
                    background: comment.userImage ? 'transparent' : 'rgb(var(--accent))',
                    color: 'white',
                  }}
                >
                  {comment.userImage ? (
                    <img
                      src={comment.userImage}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    (comment.userName?.[0] || 'K').toUpperCase()
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {comment.userName || 'Korisnik'}
                      </span>
                      <span className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    {currentUserId === comment.userId && (
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        className="text-xs hover:underline"
                        style={{ color: 'rgb(var(--muted))' }}
                      >
                        Obriši
                      </button>
                    )}
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap break-words">
                    {comment.text}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

