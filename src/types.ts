// ---------------------------------------------------------------------------
// Global types for Scratched-to-Screen
// ---------------------------------------------------------------------------

export type CanvasMode = 'draw' | 'pan';

export type Algorithm = 'telea' | 'navier-stokes';

export interface AppState {
  /** Original image as a data-URL */
  image: string | null;
  /** Binary mask as a data-URL (white strokes on black background) */
  mask: string | null;
  /** Whether the API call is in-flight */
  isProcessing: boolean;
  /** Inpainted result as a data-URL */
  restoredImage: string | null;
}

export interface InpaintRequest {
  image_base64: string;
  mask_base64: string;
  algorithm: Algorithm;
  radius: number;
}

export interface InpaintResponse {
  restored_image_base64: string;
  processing_time_ms: number;
}

export interface ImageMetrics {
  width: number;
  height: number;
  scratchCoveragePercent: number;
  processingTimeMs: number | null;
}

export interface StrokePoint {
  x: number;
  y: number;
}

export interface Stroke {
  points: StrokePoint[];
  brushSize: number;
}

