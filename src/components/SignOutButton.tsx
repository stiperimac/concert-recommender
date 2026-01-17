'use client';

import { signOut } from 'next-auth/react';

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/' })}
      className="rounded-lg px-3 py-2 border"
      style={{ borderColor: 'rgb(var(--border))', background: 'transparent', color: 'rgb(var(--fg))' }}
    >
      Odjava
    </button>
  );
}
