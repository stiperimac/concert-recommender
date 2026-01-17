'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import SignInButton from './SignInButton';
import SignOutButton from './SignOutButton';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen">
      <header className="border-b" style={{ borderColor: 'rgb(var(--border))' }}>
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <Link href="/" className="text-lg font-semibold" style={{ color: 'rgb(var(--fg))' }}>
              Concert Recommender
            </Link>
            <nav className="flex gap-3 text-sm" aria-label="Primarna navigacija">
              <Link href="/popular" className="hover:underline">Popularno</Link>
              <Link href="/recommendations" className="hover:underline">Preporuke</Link>
              <Link href="/feed" className="hover:underline">Feed</Link>
              <Link href="/settings" className="hover:underline">Postavke</Link>
            </nav>
          </div>

          <div className="flex items-center gap-3 text-sm">
            {status === 'authenticated' && session?.user ? (
              <>
                <span className="hidden sm:inline" style={{ color: 'rgb(var(--muted))' }}>
                  {session.user.email}
                </span>
                <SignOutButton />
              </>
            ) : (
              <SignInButton />
            )}
          </div>
        </div>
      </header>

      {children}

      <footer className="mt-12 border-t" style={{ borderColor: 'rgb(var(--border))' }}>
        <div className="mx-auto max-w-5xl px-4 py-8 text-sm" style={{ color: 'rgb(var(--muted))' }}>
          <p>
            Projekt: profil sadržaja, popularnost i personalizirane preporuke (Next.js + MongoDB).
          </p>
        </div>
      </footer>
    </div>
  );
}
