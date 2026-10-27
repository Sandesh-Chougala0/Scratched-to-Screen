// ---------------------------------------------------------------------------
// App.tsx — auto-detect scratches and restore the frame
// ---------------------------------------------------------------------------

import { useCallback, useState } from 'react';
import { Sparkles } from 'lucide-react';

import Header from './components/Header';
import AutoControlsToolbar from './components/AutoControlsToolbar';
import DropZone from './components/DropZone';
import ImageCanvas from './components/ImageCanvas';
import OutputPanel from './components/OutputPanel';

import { callAutoInpaintAPI, computeDefectCoverage } from './services/inpaintApi';

import type { Algorithm, ImageMetrics } from './types';

const ALGO_LABEL: Record<Algorithm, string> = {
  telea: 'Telea',
  ns: 'Navier-Stokes',
};

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [autoMask, setAutoMask] = useState<string | null>(null);
  const [restoredImage, setRestoredImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sensitivity, setSensitivity] = useState(18);
  const [algorithm, setAlgorithm] = useState<Algorithm>('telea');
  const [showMaskOverlay, setShowMaskOverlay] = useState(true);

  const [metrics, setMetrics] = useState<ImageMetrics | null>(null);
  const [staleControls, setStaleControls] = useState(false);

  const handleImageLoaded = useCallback((dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      setImage(dataUrl);
      setAutoMask(null);
      setRestoredImage(null);
      setError(null);
      setStaleControls(false);
      setMetrics({
        width: img.naturalWidth,
        height: img.naturalHeight,
        defectCoveragePercent: 0,
        processingTimeMs: null,
        algorithmUsed: ALGO_LABEL[algorithm],
      });
    };
    img.src = dataUrl;
  }, [algorithm]);

  const handleResetImage = useCallback(() => {
    setImage(null);
    setAutoMask(null);
    setRestoredImage(null);
    setMetrics(null);
    setError(null);
    setStaleControls(false);
  }, []);

  const handleSensitivityChange = useCallback((v: number) => {
    setSensitivity(v);
    if (restoredImage) setStaleControls(true);
  }, [restoredImage]);

  const handleAlgorithmChange = useCallback((a: Algorithm) => {
    setAlgorithm(a);
    if (restoredImage) setStaleControls(true);
  }, [restoredImage]);

  const handleRestoreFrame = useCallback(async () => {
    if (!image) return;
    setIsProcessing(true);
    setError(null);

    try {
      const result = await callAutoInpaintAPI({
        image_base64: image,
        scratch_sensitivity: sensitivity,
        algorithm,
      });

      setAutoMask(result.auto_detected_mask_base64);
      setRestoredImage(result.restored_image_base64);
      setStaleControls(false);

      const coverage = await computeDefectCoverage(result.auto_detected_mask_base64);
      setMetrics((m) =>
        m
          ? {
              ...m,
              defectCoveragePercent: coverage,
              processingTimeMs: result.processing_time_ms,
              algorithmUsed: ALGO_LABEL[algorithm],
            }
          : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restoration failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [image, sensitivity, algorithm]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1e1b4b_0%,transparent_45%),radial-gradient(ellipse_at_bottom_right,#3b0764_0%,transparent_40%)] opacity-40" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      <Header />

      <main className="relative mx-auto flex w-full max-w-screen-2xl flex-1 flex-col gap-6 p-4 md:p-6 lg:flex-row lg:items-start">
        <div className="flex flex-1 flex-col gap-4 lg:max-w-[58%]">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-zinc-500">
            <span className={`rounded-full px-2.5 py-1 ${image ? 'bg-indigo-500/15 text-indigo-300' : 'bg-zinc-800 text-zinc-400'}`}>
              1 · Load frame
            </span>
            <span className="text-zinc-700">→</span>
            <span className={`rounded-full px-2.5 py-1 ${image ? 'bg-indigo-500/15 text-indigo-300' : 'bg-zinc-800/60 text-zinc-600'}`}>
              2 · Detect
            </span>
            <span className="text-zinc-700">→</span>
            <span className={`rounded-full px-2.5 py-1 ${restoredImage ? 'bg-emerald-500/15 text-emerald-300' : 'bg-zinc-800/60 text-zinc-600'}`}>
              3 · Restore
            </span>
          </div>

          <AutoControlsToolbar
            sensitivity={sensitivity}
            algorithm={algorithm}
            showMaskOverlay={showMaskOverlay}
            hasImage={!!image}
            onSensitivityChange={handleSensitivityChange}
            onAlgorithmChange={handleAlgorithmChange}
            onToggleMaskOverlay={() => setShowMaskOverlay((v) => !v)}
            onResetImage={handleResetImage}
          />

          <div className="flex-1">
            {image ? (
              <ImageCanvas
                imageDataUrl={image}
                maskDataUrl={autoMask}
                showMaskOverlay={showMaskOverlay}
              />
            ) : (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-xl shadow-black/40 backdrop-blur-sm">
                <DropZone onImageLoaded={handleImageLoaded} />
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-xl border border-red-800/50 bg-red-950/40 px-4 py-2.5 text-sm text-red-300">
              {error}
            </p>
          )}

          {image && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3 shadow-lg shadow-black/20 backdrop-blur-sm">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-100">Auto-restore this frame</p>
                <p className="text-xs text-zinc-500">
                  {staleControls
                    ? 'Settings changed — run restore again to refresh the mask and output.'
                    : autoMask
                    ? 'Scratches detected. Toggle the overlay to inspect the mask.'
                    : 'Detects vertical scratches, dust, and tears, then inpaints them.'}
                </p>
              </div>

              <button
                onClick={handleRestoreFrame}
                disabled={isProcessing}
                className={`
                  flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition
                  ${isProcessing
                    ? 'cursor-wait bg-indigo-700/70'
                    : 'bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 shadow-indigo-950/50 hover:brightness-110'}
                `}
              >
                {isProcessing ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Restoring…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Restore Frame
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="flex w-full flex-col gap-4 lg:w-[42%]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-300">Output & comparison</h2>
            {restoredImage && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Restored
              </span>
            )}
          </div>

          <OutputPanel
            originalImage={image}
            maskImage={autoMask}
            restoredImage={restoredImage}
            metrics={metrics}
            isProcessing={isProcessing}
            algorithm={algorithm}
          />
        </div>
      </main>

      <footer className="relative border-t border-zinc-800/60 py-4 text-center text-xs text-zinc-600">
        Scratched-to-Screen · Open Source · Hacktoberfest 2026 ·{' '}
        <a
          href="https://github.com/Sandesh-Chougala0/Scratched-to-Screen"
          className="text-zinc-500 transition hover:text-zinc-300"
          target="_blank"
          rel="noreferrer"
        >
          Contribute on GitHub
        </a>
      </footer>
    </div>
  );
}
