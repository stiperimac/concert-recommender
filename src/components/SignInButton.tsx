'use client';

import { signIn } from 'next-auth/react';

export default function SignInButton() {
  return (
    <button
      type="button"
      onClick={() => signIn('google')}
      className="rounded-lg px-3 py-2 border"
      style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))', color: 'rgb(var(--fg))' }}
    >
      Prijava
    </button>
  );
    {/*trenutno sam stavio Google, ali prebacite na nesto drugo ako mislite da je bolje*/}
}
