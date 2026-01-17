'use client';

import { useEffect, useState } from 'react';
import { setContrast, setFontScale } from '@/app/providers';

export default function AccessibilityControls() {
  const [contrast, setContrastState] = useState<'normal' | 'high'>('normal');
  const [fontScale, setFontScaleState] = useState(1);

  useEffect(() => {
    const c = localStorage.getItem('cr_contrast') || 'normal';
    const f = Number(localStorage.getItem('cr_fontScale') || '1');
    setContrastState(c === 'high' ? 'high' : 'normal');
    setFontScaleState(Number.isFinite(f) ? f : 1);
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border p-4" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
        <h2 className="text-lg font-semibold">High-contrast mode</h2>
        <p className="text-sm mt-1" style={{ color: 'rgb(var(--muted))' }}>
          Pomaže korisnicima s oštećenjem vida ili u uvjetima slabog osvjetljenja.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            className="rounded-lg border px-3 py-2"
            style={{ borderColor: 'rgb(var(--border))', background: contrast === 'normal' ? 'rgb(var(--bg))' : 'transparent' }}
            onClick={() => { setContrastState('normal'); setContrast('normal'); }}
          >
            Normal
          </button>
          <button
            type="button"
            className="rounded-lg border px-3 py-2"
            style={{ borderColor: 'rgb(var(--border))', background: contrast === 'high' ? 'rgb(var(--bg))' : 'transparent' }}
            onClick={() => { setContrastState('high'); setContrast('high'); }}
          >
            High
          </button>
        </div>
      </div>

      <div className="rounded-2xl border p-4" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
        <h2 className="text-lg font-semibold">Povećanje teksta</h2>
        <p className="text-sm mt-1" style={{ color: 'rgb(var(--muted))' }}>
          Pomaže korisnicima koji trebaju veći font (npr. slabiji vid) bez zoomanja cijele stranice.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <input
            aria-label="Font scale"
            type="range"
            min={1}
            max={1.5}
            step={0.05}
            value={fontScale}
            onChange={(e) => {
              const v = Number(e.target.value);
              setFontScaleState(v);
              setFontScale(v);
            }}
          />
          <span className="text-sm" style={{ color: 'rgb(var(--muted))' }}>{Math.round(fontScale * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
