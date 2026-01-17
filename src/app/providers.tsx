'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';

const STORAGE_KEYS = {
  contrast: 'cr_contrast',
  fontScale: 'cr_fontScale',
};

export default function Providers({ children }: { children: React.ReactNode }) {
  // Apply accessibility preferences early on client.
  useEffect(() => {
    const contrast = localStorage.getItem(STORAGE_KEYS.contrast) || 'normal';
    const fontScale = localStorage.getItem(STORAGE_KEYS.fontScale) || '1';

    if (contrast === 'high') {
      document.documentElement.dataset.contrast = 'high';
    } else {
      delete document.documentElement.dataset.contrast;
    }

    const parsed = Number(fontScale);
    document.documentElement.style.setProperty('--font-scale', Number.isFinite(parsed) ? String(parsed) : '1');
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}

export function setContrast(mode: 'normal' | 'high') {
  localStorage.setItem(STORAGE_KEYS.contrast, mode);
  if (mode === 'high') document.documentElement.dataset.contrast = 'high';
  else delete document.documentElement.dataset.contrast;
}

export function setFontScale(scale: number) {
  localStorage.setItem(STORAGE_KEYS.fontScale, String(scale));
  document.documentElement.style.setProperty('--font-scale', String(scale));
}
