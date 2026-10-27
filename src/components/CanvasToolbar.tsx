// ---------------------------------------------------------------------------
// CanvasToolbar — mode toggle, brush size, action buttons
// ---------------------------------------------------------------------------

import { Eraser, Hand, Paintbrush, RotateCcw, Undo2 } from 'lucide-react';
import type { CanvasMode } from '../types';

interface CanvasToolbarProps {
  mode: CanvasMode;
  brushSize: number;
  strokeCount: number;
  onModeChange: (mode: CanvasMode) => void;
  onBrushSizeChange: (size: number) => void;
  onClearMask: () => void;
  onUndo: () => void;
  onResetImage: () => void;
}

export default function CanvasToolbar({
  mode,
  brushSize,
  strokeCount,
  onModeChange,
  onBrushSizeChange,
  onClearMask,
  onUndo,
  onResetImage,
}: CanvasToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
      {/* Mode toggle */}
      <div className="flex overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800">
        <button
          onClick={() => onModeChange('draw')}
          title="Draw Mask mode"
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition ${
            mode === 'draw'
              ? 'bg-indigo-600 text-white shadow-inner'
              : 'text-zinc-400 hover:bg-zinc-700 hover:text-white'
          }`}
        >
          <Paintbrush className="h-3.5 w-3.5" />
          Draw Mask
        </button>
        <button
          onClick={() => onModeChange('pan')}
          title="Pan/Zoom mode"
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition ${
            mode === 'pan'
              ? 'bg-indigo-600 text-white shadow-inner'
              : 'text-zinc-400 hover:bg-zinc-700 hover:text-white'
          }`}
        >
          <Hand className="h-3.5 w-3.5" />
          Pan / Zoom
        </button>
      </div>

      {/* Brush size */}
      <div className="flex flex-1 items-center gap-3 min-w-[160px]">
        <label className="shrink-0 text-xs text-zinc-500">
          Brush
        </label>
        <input
          type="range"
          min={1}
          max={50}
          value={brushSize}
          onChange={(e) => onBrushSizeChange(Number(e.target.value))}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-700 accent-indigo-500"
        />
        {/* Visual size preview */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700">
          <div
            className="rounded-full bg-indigo-500/80"
            style={{
              width: Math.min(brushSize, 36),
              height: Math.min(brushSize, 36),
            }}
          />
        </div>
        <span className="w-6 shrink-0 text-right text-xs tabular-nums text-zinc-400">
          {brushSize}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onUndo}
          disabled={strokeCount === 0}
          title="Undo last stroke"
          className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Undo2 className="h-3.5 w-3.5" />
          Undo
        </button>
        <button
          onClick={onClearMask}
          disabled={strokeCount === 0}
          title="Clear all mask strokes"
          className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Eraser className="h-3.5 w-3.5" />
          Clear
        </button>
        <button
          onClick={onResetImage}
          title="Remove image and start over"
          className="flex items-center gap-1.5 rounded-lg border border-red-900/50 bg-red-900/20 px-2.5 py-1.5 text-xs font-medium text-red-400 transition hover:border-red-700 hover:bg-red-900/40"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>
    </div>
  );
}

