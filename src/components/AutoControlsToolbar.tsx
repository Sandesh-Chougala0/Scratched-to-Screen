// ---------------------------------------------------------------------------
// AutoControlsToolbar — sensitivity slider, algorithm picker, mask toggle
// ---------------------------------------------------------------------------

import { Eye, EyeOff, Info, RotateCcw } from 'lucide-react';
import type { Algorithm } from '../types';

interface AutoControlsToolbarProps {
  sensitivity: number;
  algorithm: Algorithm;
  showMaskOverlay: boolean;
  hasImage: boolean;
  onSensitivityChange: (v: number) => void;
  onAlgorithmChange: (a: Algorithm) => void;
  onToggleMaskOverlay: () => void;
  onResetImage: () => void;
}

const ALGO_LABELS: Record<Algorithm, string> = {
  telea: 'Telea (Fast)',
  ns: 'Navier-Stokes (Smooth)',
};

/** Derives a human tooltip for the current sensitivity level */
function sensitivityLabel(v: number): string {
  if (v <= 10) return 'Very subtle — catches faint grain and micro-scratches';
  if (v <= 20) return 'Balanced — targets typical film scratches and dust';
  if (v <= 35) return 'Aggressive — highlights deep defects and tears';
  return 'Maximum — marks all bright high-contrast regions';
}

export default function AutoControlsToolbar({
  sensitivity,
  algorithm,
  showMaskOverlay,
  hasImage,
  onSensitivityChange,
  onAlgorithmChange,
  onToggleMaskOverlay,
  onResetImage,
}: AutoControlsToolbarProps) {
  const pct = ((sensitivity - 5) / (50 - 5)) * 100;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-lg shadow-black/20 backdrop-blur-sm">
      {/* ── Sensitivity slider ── */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Scratch Detection Threshold
            <span className="group relative">
              <Info className="h-3 w-3 cursor-help text-zinc-600 hover:text-zinc-400" />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-56 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-900 p-2.5 text-[11px] leading-relaxed text-zinc-300 shadow-xl group-hover:block">
                {sensitivityLabel(sensitivity)}
              </span>
            </span>
          </label>
          <span className="rounded-md bg-indigo-600/20 px-2 py-0.5 text-xs font-bold tabular-nums text-indigo-400">
            {sensitivity}
          </span>
        </div>

        {/* Track */}
        <div className="relative h-5 flex items-center">
          <div className="relative h-1.5 w-full rounded-full bg-zinc-700">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-600 to-violet-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <input
            type="range"
            min={5}
            max={50}
            step={1}
            value={sensitivity}
            onChange={(e) => onSensitivityChange(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-5"
          />
        </div>

        <div className="mt-1 flex justify-between text-[10px] text-zinc-600">
          <span>Subtle</span>
          <span className="text-center text-zinc-500 italic text-[9px]">{sensitivityLabel(sensitivity)}</span>
          <span>Deep</span>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="border-t border-zinc-800" />

      {/* ── Algorithm + Mask overlay row ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Algorithm selector */}
        <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Inpainting Algorithm
          </label>
          <select
            value={algorithm}
            onChange={(e) => onAlgorithmChange(e.target.value as Algorithm)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
          >
            {(Object.keys(ALGO_LABELS) as Algorithm[]).map((key) => (
              <option key={key} value={key}>
                {ALGO_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        {/* Mask overlay toggle */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Mask Overlay
          </label>
          <button
            onClick={onToggleMaskOverlay}
            disabled={!hasImage}
            title={showMaskOverlay ? 'Hide mask overlay' : 'Show auto-detected mask overlay'}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition
              ${showMaskOverlay
                ? 'border-violet-500/50 bg-violet-600/20 text-violet-300 hover:bg-violet-600/30'
                : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500 hover:text-white'}
              disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {showMaskOverlay ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {showMaskOverlay ? 'Visible' : 'Hidden'}
          </button>
        </div>

        {/* Reset */}
        {hasImage && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              &nbsp;
            </label>
            <button
              onClick={onResetImage}
              className="flex items-center gap-1.5 rounded-lg border border-red-900/50 bg-red-900/20 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:border-red-700 hover:bg-red-900/30"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

