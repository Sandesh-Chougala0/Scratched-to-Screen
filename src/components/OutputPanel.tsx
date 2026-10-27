// ---------------------------------------------------------------------------
// OutputPanel — right column with tabs, side-by-side and export actions
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { Download, FileJson, Layers, SplitSquareHorizontal } from 'lucide-react';
import BeforeAfterSlider from './BeforeAfterSlider';
import MetadataCard from './MetadataCard';
import type { ImageMetrics } from '../types';

type OutputTab = 'slider' | 'sidebyside';

interface OutputPanelProps {
  originalImage: string | null;
  maskImage: string | null;
  restoredImage: string | null;
  metrics: ImageMetrics | null;
  isProcessing: boolean;
  algorithm: string;
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export default function OutputPanel({
  originalImage,
  maskImage,
  restoredImage,
  metrics,
  isProcessing,
  algorithm,
}: OutputPanelProps) {
  const [tab, setTab] = useState<OutputTab>('slider');

  const handleDownloadRestored = () => {
    if (!restoredImage) return;
    downloadDataUrl(restoredImage, 'scratched-to-screen-restored.png');
  };

  const handleExportMetadata = () => {
    if (!metrics) return;
    const payload = {
      tool: 'Scratched-to-Screen',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      algorithm,
      original_resolution: { width: metrics.width, height: metrics.height },
      scratch_coverage_percent: metrics.scratchCoveragePercent,
      processing_time_ms: metrics.processingTimeMs,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    downloadDataUrl(url, 'scratched-to-screen-metadata.json');
    URL.revokeObjectURL(url);
  };

  const hasResult = !!(originalImage && restoredImage);

  return (
    <div className="flex flex-col gap-4">
      {/* Tab bar */}
      <div className="flex overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        <button
          onClick={() => setTab('slider')}
          className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-xs font-medium transition ${
            tab === 'slider'
              ? 'bg-indigo-600 text-white'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <SplitSquareHorizontal className="h-3.5 w-3.5" />
          Before / After Slider
        </button>
        <button
          onClick={() => setTab('sidebyside')}
          className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-xs font-medium transition ${
            tab === 'sidebyside'
              ? 'bg-indigo-600 text-white'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Side-by-Side
        </button>
      </div>

      {/* Output viewport */}
      <div className="min-h-[300px] rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        {isProcessing ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4">
            <div className="relative h-14 w-14">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-zinc-700 border-t-indigo-500" />
              <div className="absolute inset-2 animate-spin rounded-full border-4 border-transparent border-t-violet-400" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-zinc-300">Restoring frame…</p>
              <p className="text-xs text-zinc-500 mt-1">Applying {algorithm === 'telea' ? 'Telea' : 'Navier-Stokes'} inpainting</p>
            </div>
          </div>
        ) : !hasResult ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="rounded-full bg-zinc-800 p-4">
              <SplitSquareHorizontal className="h-8 w-8 text-zinc-600" />
            </div>
            <p className="text-sm text-zinc-500">
              Restored output will appear here after you run{' '}
              <span className="text-indigo-400">⚡ Restore Frame</span>
            </p>
          </div>
        ) : tab === 'slider' ? (
          <div className="p-3">
            <BeforeAfterSlider before={originalImage} after={restoredImage} />
          </div>
        ) : (
          /* Side-by-side grid */
          <div className="grid grid-cols-3 gap-2 p-3">
            {[
              { label: 'Original', src: originalImage, accent: 'text-zinc-400' },
              { label: 'Mask', src: maskImage, accent: 'text-amber-400' },
              { label: 'Restored', src: restoredImage, accent: 'text-indigo-400' },
            ].map(({ label, src, accent }) => (
              <div key={label} className="overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800">
                {src ? (
                  <img
                    src={src}
                    alt={label}
                    className="h-36 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-36 items-center justify-center">
                    <span className="text-xs text-zinc-600">No mask</span>
                  </div>
                )}
                <p className={`px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-wider ${accent}`}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Metadata card */}
      <MetadataCard metrics={metrics} isProcessing={isProcessing} />

      {/* Export actions */}
      <div className="flex gap-3">
        <button
          onClick={handleDownloadRestored}
          disabled={!restoredImage}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="h-4 w-4" />
          Download Restored (PNG)
        </button>
        <button
          onClick={handleExportMetadata}
          disabled={!metrics || metrics.processingTimeMs === null}
          className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FileJson className="h-4 w-4" />
          Export JSON
        </button>
      </div>
    </div>
  );
}

