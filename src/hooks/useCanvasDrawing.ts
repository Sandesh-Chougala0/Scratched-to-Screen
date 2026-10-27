// ---------------------------------------------------------------------------
// useCanvasDrawing — manages mask painting on the HTML5 Canvas overlay
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CanvasMode, Stroke, StrokePoint } from '../types';

interface UseCanvasDrawingOptions {
  mode: CanvasMode;
  brushSize: number;
  imageLoaded: boolean;
}

interface UseCanvasDrawingReturn {
  maskCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  strokes: Stroke[];
  clearMask: () => void;
  undoLastStroke: () => void;
  exportMask: (width: number, height: number) => string;
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onTouchStart: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  onTouchMove: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  onTouchEnd: () => void;
}

function getCanvasPoint(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number
): StrokePoint {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

export function useCanvasDrawing({
  mode,
  brushSize,
  imageLoaded,
}: UseCanvasDrawingOptions): UseCanvasDrawingReturn {
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const isDrawing = useRef(false);
  const currentStroke = useRef<Stroke | null>(null);

  // Re-render all strokes on the mask canvas
  const redrawMask = useCallback((strokeList: Stroke[]) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const stroke of strokeList) {
      if (stroke.points.length === 0) continue;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 60, 60, 0.75)'; // red-ish on canvas overlay
      ctx.lineWidth = stroke.brushSize;
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (const pt of stroke.points.slice(1)) {
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      // Also draw dot for single-point strokes
      if (stroke.points.length === 1) {
        ctx.beginPath();
        ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.brushSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 60, 60, 0.75)';
        ctx.fill();
      }
    }
  }, []);

  const startStroke = useCallback(
    (canvas: HTMLCanvasElement, clientX: number, clientY: number) => {
      if (!imageLoaded || mode !== 'draw') return;
      isDrawing.current = true;
      const pt = getCanvasPoint(canvas, clientX, clientY);
      currentStroke.current = { points: [pt], brushSize };
    },
    [imageLoaded, mode, brushSize]
  );

  const continueStroke = useCallback(
    (canvas: HTMLCanvasElement, clientX: number, clientY: number) => {
      if (!isDrawing.current || !currentStroke.current) return;
      const pt = getCanvasPoint(canvas, clientX, clientY);
      currentStroke.current.points.push(pt);

      // Live draw the current stroke on canvas
      const ctx = canvas.getContext('2d')!;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(255, 60, 60, 0.75)';
      ctx.lineWidth = currentStroke.current.brushSize;
      const pts = currentStroke.current.points;
      ctx.beginPath();
      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
    },
    []
  );

  const endStroke = useCallback(() => {
    if (!isDrawing.current || !currentStroke.current) return;
    isDrawing.current = false;
    const stroke = currentStroke.current;
    currentStroke.current = null;
    if (stroke.points.length > 0) {
      setStrokes((prev) => {
        const next = [...prev, stroke];
        return next;
      });
    }
  }, []);

  // Redraw whenever strokes list changes (undo / clear)
  useEffect(() => {
    redrawMask(strokes);
  }, [strokes, redrawMask]);

  const clearMask = useCallback(() => setStrokes([]), []);

  const undoLastStroke = useCallback(() => {
    setStrokes((prev) => prev.slice(0, -1));
  }, []);

  /**
   * Export a pure black & white binary mask suitable for inpainting APIs.
   * Strokes are drawn in WHITE on a BLACK canvas background.
   */
  const exportMask = useCallback(
    (width: number, height: number): string => {
      const offscreen = document.createElement('canvas');
      offscreen.width = width;
      offscreen.height = height;
      const ctx = offscreen.getContext('2d')!;

      // Black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // White strokes
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#ffffff';

      for (const stroke of strokes) {
        if (stroke.points.length === 0) continue;
        const displayCanvas = maskCanvasRef.current;
        if (!displayCanvas) continue;
        // Scale from display canvas coords → export canvas coords
        const scaleX = width / displayCanvas.width;
        const scaleY = height / displayCanvas.height;

        ctx.lineWidth = stroke.brushSize * Math.max(scaleX, scaleY);
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x * scaleX, stroke.points[0].y * scaleY);
        for (const pt of stroke.points.slice(1)) {
          ctx.lineTo(pt.x * scaleX, pt.y * scaleY);
        }
        ctx.stroke();
        if (stroke.points.length === 1) {
          ctx.beginPath();
          ctx.arc(
            stroke.points[0].x * scaleX,
            stroke.points[0].y * scaleY,
            (stroke.brushSize / 2) * Math.max(scaleX, scaleY),
            0,
            Math.PI * 2
          );
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
      }

      return offscreen.toDataURL('image/png');
    },
    [strokes]
  );

  // ── Event handlers ──────────────────────────────────────────────────────

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = maskCanvasRef.current;
      if (!canvas) return;
      startStroke(canvas, e.clientX, e.clientY);
    },
    [startStroke]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = maskCanvasRef.current;
      if (!canvas) return;
      continueStroke(canvas, e.clientX, e.clientY);
    },
    [continueStroke]
  );

  const onMouseUp = useCallback(() => endStroke(), [endStroke]);
  const onMouseLeave = useCallback(() => endStroke(), [endStroke]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const canvas = maskCanvasRef.current;
      if (!canvas || e.touches.length === 0) return;
      const touch = e.touches[0];
      startStroke(canvas, touch.clientX, touch.clientY);
    },
    [startStroke]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const canvas = maskCanvasRef.current;
      if (!canvas || e.touches.length === 0) return;
      const touch = e.touches[0];
      continueStroke(canvas, touch.clientX, touch.clientY);
    },
    [continueStroke]
  );

  const onTouchEnd = useCallback(() => endStroke(), [endStroke]);

  return {
    maskCanvasRef,
    strokes,
    clearMask,
    undoLastStroke,
    exportMask,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}

