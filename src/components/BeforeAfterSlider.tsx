// ---------------------------------------------------------------------------
// BeforeAfterSlider — interactive split-compare overlay
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react';
import { SplitSquareHorizontal } from 'lucide-react';

interface BeforeAfterSliderProps {
  before: string;
  after: string;
}

export default function BeforeAfterSlider({ before, after }: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [splitPct, setSplitPct] = useState(50);
  const isDragging = useRef(false);

  const updateSplit = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    setSplitPct(pct);
  }, []);

  const stopDrag = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging.current) updateSplit(e.clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging.current && e.touches[0]) updateSplit(e.touches[0].clientX);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', stopDrag);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', stopDrag);
    };
  }, [updateSplit, stopDrag]);

  return (
    <div
      ref={containerRef}
      className="relative cursor-col-resize select-none overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950"
      onMouseDown={(e) => {
        isDragging.current = true;
        updateSplit(e.clientX);
      }}
      onTouchStart={(e) => {
        isDragging.current = true;
        if (e.touches[0]) updateSplit(e.touches[0].clientX);
      }}
    >
      <img
        src={after}
        alt="Restored"
        draggable={false}
        className="block h-full max-h-[480px] w-full object-contain"
      />

      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - splitPct}% 0 0)` }}
      >
        <img
          src={before}
          alt="Original"
          draggable={false}
          className="h-full w-full object-contain"
        />
      </div>

      <div
        className="absolute inset-y-0 z-10 flex flex-col items-center"
        style={{ left: `${splitPct}%`, transform: 'translateX(-50%)' }}
      >
        <div className="h-full w-0.5 bg-white/85 shadow-[0_0_12px_rgba(255,255,255,0.5)]" />
        <div className="absolute top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-white shadow-xl">
          <SplitSquareHorizontal className="h-4 w-4 text-zinc-900" />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3">
        <span className="rounded-md bg-zinc-950/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-300 backdrop-blur-sm">
          Before
        </span>
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3">
        <span className="rounded-md bg-indigo-600/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
          After
        </span>
      </div>
    </div>
  );
}
