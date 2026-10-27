// ---------------------------------------------------------------------------
// MetadataCard — image info and metrics display
// ---------------------------------------------------------------------------

import { Activity, Clock, Image as ImageIcon, Scan } from 'lucide-react';
import type { ImageMetrics } from '../types';

interface MetadataCardProps {
  metrics: ImageMetrics | null;
  isProcessing: boolean;
}

function MetricRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-indigo-400">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{label}</p>
        <p className="truncate text-sm font-semibold text-zinc-200">{value}</p>
      </div>
    </div>
  );
}

export default function MetadataCard({ metrics, isProcessing }: MetadataCardProps) {
  if (!metrics) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-center text-sm text-zinc-600">No image loaded</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        <Activity className="h-3.5 w-3.5 text-indigo-400" />
        Image Metrics
      </h3>
      <div className="space-y-3">
        <MetricRow
          icon={<ImageIcon className="h-4 w-4" />}
          label="Original Resolution"
          value={`${metrics.width} × ${metrics.height} px`}
        />
        <MetricRow
          icon={<Scan className="h-4 w-4" />}
          label="Scratch Area Coverage"
          value={`${metrics.scratchCoveragePercent.toFixed(2)} %`}
        />
        <MetricRow
          icon={<Clock className="h-4 w-4" />}
          label="Processing Time"
          value={
            isProcessing
              ? 'Processing…'
              : metrics.processingTimeMs !== null
              ? `${metrics.processingTimeMs} ms`
              : '—'
          }
        />
      </div>
    </div>
  );
}

