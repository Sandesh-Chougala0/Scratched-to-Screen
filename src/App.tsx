// ---------------------------------------------------------------------------
// App.tsx — root component wiring all pieces together
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react';
import { Zap } from 'lucide-react';

import Header from './components/Header';
import CanvasToolbar from './components/CanvasToolbar';
import DropZone from './components/DropZone';
import ImageCanvas from './components/ImageCanvas';
import OutputPanel from './components/OutputPanel';

import { useCanvasDrawing } from './hooks/useCanvasDrawing';
import { callInpaintAPI, computeScratchCoverage } from './services/inpaintApi';

import type { Algorithm, CanvasMode, ImageMetrics } from './types';

export default function App() {
  // ── Image state ──────────────────────────────────────────────────────────
  const [image, setImage] = useState<string | null>(null);
  const [mask, setMask] = useState<string | null>(null);
  const [restoredImage, setRestoredImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // ── Canvas controls ───────────────────────────────────────────────────────
  const [canvasMode, setCanvasMode] = useState<CanvasMode>('draw');
  const [brushSize, setBrushSize] = useState(12);
  const [algorithm, setAlgorithm] = useState<Algorithm>('telea');

  // ── Metrics ───────────────────────────────────────────────────────────────
  const [metrics, setMetrics] = useState<ImageMetrics | null>(null);
  const imageDimensions = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  // ── Drawing hook ──────────────────────────────────────────────────────────
  const drawing = useCanvasDrawing({
    mode: canvasMode,
    brushSize,
    imageLoaded: !!image,
  });

  // Load image dimensions when image changes
  useEffect(() => {
    if (!image) { imageDimensions.current = { width: 0, height: 0 }; return; }
    const img = new Image();
    img.onload = () => {
      imageDimensions.current = { width: img.naturalWidth, height: img.naturalHeight };
      setMetrics({
        width: img.naturalWidth,
        height: img.naturalHeight,
        scratchCoveragePercent: 0,
        processingTimeMs: null,
      });
    };
    img.src = image;
  }, [image]);

  // Update scratch coverage whenever strokes change
  useEffect(() => {
    if (!image || drawing.strokes.length === 0) return;
    const { width, height } = imageDimensions.current;
    if (!width || !height) return;
    const maskDataUrl = drawing.exportMask(width, height);
    computeScratchCoverage(maskDataUrl).then((pct) => {
      setMetrics((m) =>
        m ? { ...m, scratchCoveragePercent: pct } : null
      );
    });
  }, [drawing.strokes, image, drawing]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleImageLoaded = useCallback((dataUrl: string) => {
    setImage(dataUrl);
    setMask(null);
    setRestoredImage(null);
    drawing.clearMask();
  }, [drawing]);

  const handleResetImage = useCallback(() => {
    setImage(null);
    setMask(null);
    setRestoredImage(null);
    setMetrics(null);
    drawing.clearMask();
  }, [drawing]);

  const handleRestoreFrame = useCallback(async () => {
    if (!image) return;
    const { width, height } = imageDimensions.current;
    const maskDataUrl = drawing.exportMask(width || 800, height || 600);
    setMask(maskDataUrl);
    setIsProcessing(true);

    try {
      const result = await callInpaintAPI({
        image_base64: image,
        mask_base64: maskDataUrl,
        algorithm,
        radius: Math.ceil(brushSize / 2),
      });

      setRestoredImage(result.restored_image_base64);
      const coverage = await computeScratchCoverage(maskDataUrl);
      setMetrics((m) =>
        m
          ? { ...m, scratchCoveragePercent: coverage, processingTimeMs: result.processing_time_ms }
          : null
      );
    } finally {
      setIsProcessing(false);
    }
  }, [image, drawing, algorithm, brushSize]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <Header />

      <main className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col gap-6 p-4 md:p-6 lg:flex-row lg:items-start">
        {/* ── LEFT COLUMN ── */}
        <div className="flex flex-1 flex-col gap-4 lg:max-w-[58%]">
          {/* Canvas toolbar */}
          {image && (
            <CanvasToolbar
              mode={canvasMode}
              brushSize={brushSize}
              strokeCount={drawing.strokes.length}
              onModeChange={setCanvasMode}
              onBrushSizeChange={setBrushSize}
              onClearMask={drawing.clearMask}
              onUndo={drawing.undoLastStroke}
              onResetImage={handleResetImage}
            />
          )}

          {/* Canvas / Dropzone */}
          <div className="flex-1">
            {image ? (
              <ImageCanvas
                imageDataUrl={image}
                mode={canvasMode}
                brushSize={brushSize}
                strokes={drawing.strokes}
                maskCanvasRef={drawing.maskCanvasRef}
                onMouseDown={drawing.onMouseDown}
                onMouseMove={drawing.onMouseMove}
                onMouseUp={drawing.onMouseUp}
                onMouseLeave={drawing.onMouseLeave}
                onTouchStart={drawing.onTouchStart}
                onTouchMove={drawing.onTouchMove}
                onTouchEnd={drawing.onTouchEnd}
              />
            ) : (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900">
                <DropZone onImageLoaded={handleImageLoaded} />
              </div>
            )}
          </div>

          {/* Bottom action bar */}
          {image && (
            <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
              {/* Algorithm selector */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  Algorithm
                </label>
                <select
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value as Algorithm)}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-300 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="telea">Telea (Fast)</option>
                  <option value="navier-stokes">Navier-Stokes (Smooth)</option>
                </select>
              </div>

              {/* Stroke count pill */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  Mask Strokes
                </span>
                <span className="text-sm font-bold text-zinc-300">
                  {drawing.strokes.length}
                  <span className="ml-1 text-xs font-normal text-zinc-600">painted</span>
                </span>
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Restore button */}
              <button
                onClick={handleRestoreFrame}
                disabled={isProcessing || drawing.strokes.length === 0}
                className={`
                  flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white shadow-lg transition
                  ${isProcessing
                    ? 'cursor-not-allowed bg-indigo-700/60'
                    : drawing.strokes.length === 0
                    ? 'cursor-not-allowed bg-zinc-700 opacity-50'
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-900/50 hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-700/40'}
                `}
              >
                {isProcessing ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Restoring…
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Restore Frame
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="flex w-full flex-col gap-4 lg:w-[42%]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-400">Output & Comparison</h2>
            {restoredImage && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Restored
              </span>
            )}
          </div>

          <OutputPanel
            originalImage={image}
            maskImage={mask}
            restoredImage={restoredImage}
            metrics={metrics}
            isProcessing={isProcessing}
            algorithm={algorithm}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 py-4 text-center text-xs text-zinc-600">
        Scratched-to-Screen · Open Source · Hacktoberfest 2026 ·{' '}
        <a href="https://github.com" className="text-zinc-500 hover:text-zinc-300">
          Contribute on GitHub
        </a>
      </footer>
    </div>
  );
}

