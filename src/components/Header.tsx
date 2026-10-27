// ---------------------------------------------------------------------------
// Header — top navigation bar
// ---------------------------------------------------------------------------

import { Film, Github } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 shadow-lg shadow-indigo-900/50">
            <Film className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <h1 className="text-base font-bold tracking-tight text-white">
              Scratched<span className="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">-to-</span>Screen
            </h1>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
              Visual archival restoration
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" />
            Hacktoberfest 2026
          </span>
          <span className="rounded-full border border-zinc-700/80 bg-zinc-800/60 px-2.5 py-1 text-xs text-zinc-400">
            Auto-detect
          </span>
        </div>

        <a
          href="https://github.com/Sandesh-Chougala0/Scratched-to-Screen"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-xl border border-zinc-700/80 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-700 hover:text-white"
        >
          <Github className="h-4 w-4" />
          <span className="hidden sm:inline">GitHub</span>
        </a>
      </div>
    </header>
  );
}
