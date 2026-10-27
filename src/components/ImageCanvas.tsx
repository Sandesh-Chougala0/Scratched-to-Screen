// ---------------------------------------------------------------------------
// ImageCanvas — interactive canvas overlay on the uploaded image
// ---------------------------------------------------------------------------

import { useEffect, useRef } from 'react';
import type { CanvasMode, Stroke } from '../types';
import type { useCanvasDrawing } from '../hooks/useCanvasDrawing';

type DrawingHandlers = Pick<
  ReturnType<typeof useCanvasDrawing>,
  | 'maskCanvasRef'
  | 'onMouseDown'
  | 'onMouseMove'
  | 'onMouseUp'
  | 'onMouseLeave'
  | 'onTouchStart'
  | 'onTouchMove'
  | 'onTouchEnd'
>;

interface ImageCanvasProps extends DrawingHandlers {
  imageDataUrl: string;
  mode: CanvasMode;
  brushSize: number;
  strokes: Stroke[];
}

export default function ImageCanvas({
  imageDataUrl,
  mode,
  maskCanvasRef,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: ImageCanvasProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync canvas size with rendered image size
  useEffect(() => {
    const img = imageRef.current;
    const canvas = maskCanvasRef.current;
    if (!img || !canvas) return;

    const sync = () => {
      canvas.width = img.naturalWidth || img.offsetWidth;
      canvas.height = img.naturalHeight || img.offsetHeight;
    };

    if (img.complete) sync();
    img.addEventListener('load', sync);
    return () => img.removeEventListener('load', sync);
  }, [imageDataUrl, maskCanvasRef]);

  const cursorClass =
    mode === 'draw' ? 'canvas-cursor-draw' : 'canvas-cursor-pan';

  return (
    <div ref={containerRef} className="relative select-none overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900">
      {/* Base image */}
      <img
        ref={imageRef}
        src={imageDataUrl}
        alt="Uploaded archival frame"
        draggable={false}
        className="block h-full max-h-[500px] w-full object-contain"
      />

      {/* Mask painting overlay */}
      <canvas
        ref={maskCanvasRef as React.RefObject<HTMLCanvasElement>}
        className={`absolute inset-0 h-full w-full ${cursorClass}`}
        style={{ touchAction: 'none' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      />

      {/* Mode indicator badge */}
      <div className="pointer-events-none absolute bottom-3 left-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm ${
            mode === 'draw'
              ? 'bg-indigo-600/80 text-white'
              : 'bg-zinc-800/80 text-zinc-400'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${mode === 'draw' ? 'bg-red-400 animate-pulse' : 'bg-zinc-500'}`}
          />
          {mode === 'draw' ? 'Drawing Mask' : 'Pan Mode'}
        </span>
      </div>
    </div>
  );
}
