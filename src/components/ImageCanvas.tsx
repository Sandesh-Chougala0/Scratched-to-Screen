// ---------------------------------------------------------------------------
// ImageCanvas — uploaded frame with optional auto-detected mask overlay
// ---------------------------------------------------------------------------

interface ImageCanvasProps {
  imageDataUrl: string;
  maskDataUrl: string | null;
  showMaskOverlay: boolean;
}

export default function ImageCanvas({
  imageDataUrl,
  maskDataUrl,
  showMaskOverlay,
}: ImageCanvasProps) {
  const overlayOn = showMaskOverlay && !!maskDataUrl;

  return (
    <div className="relative select-none overflow-hidden rounded-2xl border border-zinc-800 bg-[radial-gradient(circle_at_center,#18181b,transparent_70%)] bg-zinc-950 shadow-inner">
      <div className="film-sprockets pointer-events-none absolute inset-y-0 left-0 w-5 opacity-40" />
      <div className="film-sprockets pointer-events-none absolute inset-y-0 right-0 w-5 opacity-40" />

      <img
        src={imageDataUrl}
        alt="Uploaded archival frame"
        draggable={false}
        className="block h-full max-h-[520px] w-full object-contain"
      />

      {overlayOn && (
        <div
          className="pointer-events-none absolute inset-0 bg-rose-500/55 mix-blend-screen"
          style={{
            WebkitMaskImage: `url(${maskDataUrl})`,
            maskImage: `url(${maskDataUrl})`,
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
          }}
        />
      )}

      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-300 backdrop-blur-sm ring-1 ring-white/10">
          <span className={`h-1.5 w-1.5 rounded-full ${overlayOn ? 'animate-pulse bg-rose-400' : 'bg-emerald-400'}`} />
          {overlayOn ? 'Mask overlay' : 'Original frame'}
        </span>
      </div>
    </div>
  );
}
