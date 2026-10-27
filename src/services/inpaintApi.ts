// ---------------------------------------------------------------------------
// Auto-Inpaint API service — real call with mock fallback
// ---------------------------------------------------------------------------

import type { AutoInpaintRequest, AutoInpaintResponse } from '../types';

const API_BASE = '';

function luminance(r: number, g: number, b: number) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function morphOpenVertical(
  gray: Float32Array,
  width: number,
  height: number,
  kernelHeight: number
): Float32Array {
  const half = Math.floor(kernelHeight / 2);
  const eroded = new Float32Array(width * height);
  const opened = new Float32Array(width * height);

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let minv = 255;
      for (let dy = -half; dy <= half; dy++) {
        const yy = Math.min(height - 1, Math.max(0, y + dy));
        minv = Math.min(minv, gray[yy * width + x]);
      }
      eroded[y * width + x] = minv;
    }
  }

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let maxv = 0;
      for (let dy = -half; dy <= half; dy++) {
        const yy = Math.min(height - 1, Math.max(0, y + dy));
        maxv = Math.max(maxv, eroded[yy * width + x]);
      }
      opened[y * width + x] = maxv;
    }
  }

  return opened;
}

function dilate3x3(mask: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(mask.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let hit = 0;
      for (let dy = -1; dy <= 1 && !hit; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
          if (mask[yy * width + xx]) {
            hit = 1;
            break;
          }
        }
      }
      out[y * width + x] = hit ? 255 : 0;
    }
  }
  return out;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode image'));
    img.src = src;
  });
}

/**
 * Client-side stand-in for the Python morphological scratch detector.
 */
async function generateMockMask(imageDataUrl: string, sensitivity: number): Promise<string> {
  const img = await loadImage(imageDataUrl);
  const src = document.createElement('canvas');
  src.width = img.naturalWidth;
  src.height = img.naturalHeight;
  const srcCtx = src.getContext('2d')!;
  srcCtx.drawImage(img, 0, 0);
  const { data, width, height } = srcCtx.getImageData(0, 0, src.width, src.height);

  const gray = new Float32Array(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = luminance(data[i], data[i + 1], data[i + 2]);
  }

  const opened = morphOpenVertical(gray, width, height, 15);
  const binary = new Uint8ClampedArray(width * height);
  const cutoff = Math.max(4, Math.min(80, sensitivity));

  for (let p = 0; p < gray.length; p++) {
    binary[p] = Math.abs(gray[p] - opened[p]) > cutoff ? 255 : 0;
  }

  const dilated = dilate3x3(binary, width, height);

  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const outCtx = out.getContext('2d')!;
  const outImg = outCtx.createImageData(width, height);
  for (let p = 0, i = 0; p < dilated.length; p++, i += 4) {
    const v = dilated[p];
    outImg.data[i] = v;
    outImg.data[i + 1] = v;
    outImg.data[i + 2] = v;
    outImg.data[i + 3] = 255;
  }
  outCtx.putImageData(outImg, 0, 0);
  return out.toDataURL('image/png');
}

/**
 * Simulate inpainting: blur the source and composite it where the mask is white.
 */
async function generateMockRestored(imageDataUrl: string, maskDataUrl: string): Promise<string> {
  const [img, maskImg] = await Promise.all([loadImage(imageDataUrl), loadImage(maskDataUrl)]);
  const width = img.naturalWidth;
  const height = img.naturalHeight;

  const src = document.createElement('canvas');
  src.width = width;
  src.height = height;
  const srcCtx = src.getContext('2d')!;
  srcCtx.drawImage(img, 0, 0);

  const blurred = document.createElement('canvas');
  blurred.width = width;
  blurred.height = height;
  const blurCtx = blurred.getContext('2d')!;
  blurCtx.filter = 'blur(6px)';
  blurCtx.drawImage(img, 0, 0);

  const mask = document.createElement('canvas');
  mask.width = width;
  mask.height = height;
  const maskCtx = mask.getContext('2d')!;
  maskCtx.drawImage(maskImg, 0, 0, width, height);

  const srcData = srcCtx.getImageData(0, 0, width, height);
  const blurData = blurCtx.getImageData(0, 0, width, height);
  const maskData = maskCtx.getImageData(0, 0, width, height);

  for (let i = 0; i < srcData.data.length; i += 4) {
    const t = maskData.data[i] / 255;
    if (t <= 0) continue;
    srcData.data[i] = srcData.data[i] * (1 - t) + blurData.data[i] * t;
    srcData.data[i + 1] = srcData.data[i + 1] * (1 - t) + blurData.data[i + 1] * t;
    srcData.data[i + 2] = srcData.data[i + 2] * (1 - t) + blurData.data[i + 2] * t;
  }

  srcCtx.putImageData(srcData, 0, 0);
  return src.toDataURL('image/png');
}

export function computeDefectCoverage(maskDataUrl: string): Promise<number> {
  return new Promise((resolve) => {
    if (!maskDataUrl) return resolve(0);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let whitePixels = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 200) whitePixels++;
      }
      resolve(parseFloat(((whitePixels / (data.length / 4)) * 100).toFixed(2)));
    };
    img.onerror = () => resolve(0);
    img.src = maskDataUrl;
  });
}

/** UI 5 (subtle) → high OpenCV threshold; UI 50 (deep) → low threshold. */
function toDetectionThreshold(sensitivity: number): number {
  return Math.max(1, Math.min(80, 55 - sensitivity));
}

export async function callAutoInpaintAPI(
  request: AutoInpaintRequest
): Promise<AutoInpaintResponse> {
  const startTime = performance.now();
  const payload: AutoInpaintRequest = {
    ...request,
    scratch_sensitivity: toDetectionThreshold(request.scratch_sensitivity),
  };

  try {
    const res = await fetch(`${API_BASE}/api/auto-inpaint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(45_000),
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return (await res.json()) as AutoInpaintResponse;
  } catch {
    console.info('[Scratched-to-Screen] Backend offline — using mock fallback.');

    const delay = payload.algorithm === 'ns' ? 1600 : 900;
    await new Promise((r) => setTimeout(r, delay));

    const mask = await generateMockMask(payload.image_base64, payload.scratch_sensitivity);
    const restored = await generateMockRestored(payload.image_base64, mask);

    return {
      restored_image_base64: restored,
      auto_detected_mask_base64: mask,
      processing_time_ms: Math.round(performance.now() - startTime),
    };
  }
}
