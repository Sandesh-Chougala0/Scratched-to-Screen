// ---------------------------------------------------------------------------
// DropZone — file upload / demo selector when no image is loaded
// ---------------------------------------------------------------------------

import { useCallback, useRef, useState } from 'react';
import { ImagePlus, UploadCloud } from 'lucide-react';

interface DropZoneProps {
  onImageLoaded: (dataUrl: string) => void;
}

// A small palette of "demo" archival images using picsum
const DEMO_IMAGES = [
  { label: 'Film Still #1', url: 'https://picsum.photos/seed/film1/800/600' },
  { label: 'Film Still #2', url: 'https://picsum.photos/seed/vintage2/800/600' },
  { label: 'Portrait #3',   url: 'https://picsum.photos/seed/portrait3/800/600' },
];

async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function DropZone({ onImageLoaded }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      if (!file.type.startsWith('image/')) {
        setError('Please upload a PNG or JPG image.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => onImageLoaded(e.target?.result as string);
      reader.readAsDataURL(file);
    },
    [onImageLoaded]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const loadDemo = useCallback(
    async (label: string, url: string) => {
      setLoadingDemo(label);
      setError(null);
      try {
        const dataUrl = await urlToDataUrl(url);
        onImageLoaded(dataUrl);
      } catch {
        setError('Failed to load demo image. Check your internet connection.');
      } finally {
        setLoadingDemo(null);
      }
    },
    [onImageLoaded]
  );

  return (
    <div className="flex h-full min-h-[340px] flex-col items-center justify-center gap-6 p-6">
      {/* Main drop area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          flex w-full flex-1 cursor-pointer flex-col items-center justify-center gap-4
          rounded-2xl border-2 border-dashed transition-all duration-200
          ${isDragging
            ? 'border-indigo-400 bg-indigo-500/10 shadow-lg shadow-indigo-900/20'
            : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-500 hover:bg-zinc-800/50'}
        `}
      >
        <div className={`rounded-full p-4 transition-colors ${isDragging ? 'bg-indigo-500/20' : 'bg-zinc-800'}`}>
          <UploadCloud className={`h-10 w-10 transition-colors ${isDragging ? 'text-indigo-400' : 'text-zinc-500'}`} />
        </div>
        <div className="text-center">
          <p className="font-semibold text-zinc-300">
            {isDragging ? 'Drop to upload' : 'Drop your archival image here'}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            or <span className="text-indigo-400 underline underline-offset-2">click to browse</span> · PNG / JPG
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-lg bg-red-900/30 px-4 py-2 text-sm text-red-400 border border-red-800/50">
          {error}
        </p>
      )}

      {/* Demo selector */}
      <div className="w-full">
        <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
          <ImagePlus className="h-3.5 w-3.5" />
          Or try a demo image
        </p>
        <div className="grid grid-cols-3 gap-2">
          {DEMO_IMAGES.map(({ label, url }) => (
            <button
              key={label}
              onClick={() => loadDemo(label, url)}
              disabled={loadingDemo !== null}
              className="group relative overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 transition hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500/50 disabled:opacity-50"
            >
              <img
                src={url}
                alt={label}
                className="h-16 w-full object-cover opacity-60 transition group-hover:opacity-80"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-zinc-900/80 to-transparent p-1.5">
                <span className="text-[10px] font-medium text-zinc-300">
                  {loadingDemo === label ? 'Loading…' : label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

