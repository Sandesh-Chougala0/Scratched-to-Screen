// ---------------------------------------------------------------------------
// Global types for Scratched-to-Screen (Auto-Detection mode)
// ---------------------------------------------------------------------------

export type Algorithm = 'telea' | 'ns';

/** Core application state */
export interface AppState {
  /** Original uploaded image as a data-URL */
  image: string | null;
  /** Auto-generated binary scratch mask returned by the backend */
  autoMask: string | null;
  /** Whether the API call is in-flight */
  isProcessing: boolean;
  /** Inpainted result as a data-URL */
  restoredImage: string | null;
  /** Processing time returned by the API (ms) */
  processingTime: number | null;
}

/** POST body sent to /api/auto-inpaint */
export interface AutoInpaintRequest {
  image_base64: string;
  scratch_sensitivity: number;
  algorithm: Algorithm;
}

/** Response body from /api/auto-inpaint */
export interface AutoInpaintResponse {
  restored_image_base64: string;
  auto_detected_mask_base64: string;
  processing_time_ms: number;
}

/** Computed image metrics shown in the MetadataCard */
export interface ImageMetrics {
  width: number;
  height: number;
  /** Percentage of mask pixels that are white (detected scratch area) */
  defectCoveragePercent: number;
  processingTimeMs: number | null;
  algorithmUsed: string;
}
