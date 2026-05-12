'use client';
import Link from 'next/link';
import { usePlayer } from '@/context/PlayerContext';
import { formatDuration, shortAddress } from '@/lib/utils';

export default function AudioPlayer() {
  const { currentTrack, playing, currentTime, duration, pause, resume, seek } =
    usePlayer();

  if (!currentTrack) return null;

  const progress = duration > 0 ? currentTime / duration : 0;
  const displayDuration = duration > 0 ? duration : currentTrack.duration;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-800/60">
      {/* Scrubber */}
      <div
        className="h-1 bg-zinc-700 cursor-pointer group/scrub"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          seek(((e.clientX - rect.left) / rect.width) * displayDuration);
        }}
      >
        <div
          className="h-full bg-violet-500 relative transition-none"
          style={{ width: `${progress * 100}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover/scrub:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Cover */}
        <div
          className={`w-10 h-10 rounded-lg bg-gradient-to-br ${currentTrack.coverColor} shrink-0`}
        />

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <Link href={`/track/${currentTrack.id}`}>
            <p className="text-white text-sm font-medium truncate hover:text-violet-400 transition-colors leading-tight">
              {currentTrack.title}
            </p>
          </Link>
          <p className="text-zinc-400 text-xs truncate leading-tight mt-0.5">
            {currentTrack.artist || shortAddress(currentTrack.address)}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-zinc-500 text-xs tabular-nums hidden sm:block">
            {formatDuration(currentTime)} / {formatDuration(displayDuration)}
          </span>

          <button
            onClick={playing ? pause : resume}
            className="w-10 h-10 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center justify-center transition-colors shadow-lg shadow-violet-900/50"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
