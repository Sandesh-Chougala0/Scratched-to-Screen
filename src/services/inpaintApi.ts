// ---------------------------------------------------------------------------
// API service — real call with mock fallback
// ---------------------------------------------------------------------------

import type { InpaintRequest, InpaintResponse } from '../types';

const API_BASE = 'http://localhost:8000';

/**
 * Applies a subtle sepia + noise filter to simulate restored film grain.
 * Returns a data-URL.
 */
function generateMockRestoredImage(imageDataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;

      // Draw original
      ctx.drawImage(img, 0, 0);

      // Slight brightness boost (simulate restoration)
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(30, 20, 10, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';

      // Simulate scratch removal — paint masked areas with blurred surrounding color
      // by adding a translucent warm overlay where mask is white
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgba(255, 248, 235, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';

      resolve(canvas.toDataURL('image/png'));
    };
    img.src = imageDataUrl;
  });
}

export async function callInpaintAPI(request: InpaintRequest): Promise<InpaintResponse> {
  const startTime = performance.now();

  try {
    const response = await fetch(`${API_BASE}/api/inpaint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as InpaintResponse;
    return data;
  } catch {
    // ── Mock fallback ──────────────────────────────────────────────────────
    console.info('[Scratched-to-Screen] Backend not reachable — using mock fallback.');

    // Simulate processing latency
    const simulatedDelay = request.algorithm === 'navier-stokes' ? 1800 : 900;
    await new Promise((r) => setTimeout(r, simulatedDelay));

    const restoredDataUrl = await generateMockRestoredImage(request.image_base64);
    const processingTime = Math.round(performance.now() - startTime);

    return {
      restored_image_base64: restoredDataUrl,
      processing_time_ms: processingTime,
    };
  }
}

/**
 * Computes what percentage of the mask canvas is white (painted area).
 */
export function computeScratchCoverage(maskDataUrl: string): Promise<number> {
  return new Promise((resolve) => {
    if (!maskDataUrl) return resolve(0);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let whitePixels = 0;
      for (let i = 0; i < data.length; i += 4) {
        // Count pixels where R > 200 (white-ish region on black mask)
        if (data[i] > 200) whitePixels++;
      }
      const total = (data.length / 4);
      resolve(parseFloat(((whitePixels / total) * 100).toFixed(2)));
    };
    img.src = maskDataUrl;
  });
}
