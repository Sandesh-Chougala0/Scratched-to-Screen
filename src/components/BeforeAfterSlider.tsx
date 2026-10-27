// ---------------------------------------------------------------------------
// BeforeAfterSlider — interactive split-compare overlay
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react';
import { SplitSquareHorizontal } from 'lucide-react';

interface BeforeAfterSliderProps {
  before: string; // original image data-URL
  after: string;  // restored image data-URL
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

  const onMouseMove = useCallback(
    (e: MouseEvent) => { if (isDragging.current) updateSplit(e.clientX); },
    [updateSplit]
  );
  const onMouseUp = useCallback(() => { isDragging.current = false; }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  return (
    <div
      ref={containerRef}
      className="relative select-none overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 cursor-col-resize"
      onMouseDown={(e) => { isDragging.current = true; updateSplit(e.clientX); }}
      onTouchMove={(e) => updateSplit(e.touches[0].clientX)}
    >
      {/* "After" (restored) — full width base */}
      <img
        src={after}
        alt="Restored"
        draggable={false}
        className="block h-full max-h-[480px] w-full object-contain"
      />

      {/* "Before" (original) — clipped to left of divider */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${splitPct}%` }}
      >
        <img
          src={before}
          alt="Original"
          draggable={false}
          className="h-full w-full object-contain"
          style={{ minWidth: `${10000 / splitPct}%` }}
        />
      </div>

      {/* Divider line */}
      <div
        className="absolute inset-y-0 z-10 flex flex-col items-center"
        style={{ left: `${splitPct}%`, transform: 'translateX(-50%)' }}
      >
        <div className="h-full w-0.5 bg-white/80 shadow-xl" />
        <div className="absolute top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-white shadow-xl">
          <SplitSquareHorizontal className="h-4 w-4 text-zinc-900" />
        </div>
      </div>

      {/* Labels */}
      <div className="pointer-events-none absolute bottom-3 left-3">
        <span className="rounded bg-zinc-900/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 backdrop-blur-sm">
          Before
        </span>
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3">
        <span className="rounded bg-indigo-600/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
          After
        </span>
      </div>
    </div>
  );
}

