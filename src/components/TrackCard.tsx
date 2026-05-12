'use client';
import Link from 'next/link';
import { Track } from '@/lib/types';
import { usePlayer } from '@/context/PlayerContext';
import { formatDuration, shortAddress } from '@/lib/utils';

interface Props {
  track: Track;
  rank?: number;
}

function PlayIcon() {
  return (
    <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

export default function TrackCard({ track, rank }: Props) {
  const { currentTrack, playing, play, pause } = usePlayer();
  const isActive = currentTrack?.id === track.id;

  const handlePlayPause = () => {
    if (isActive && playing) pause();
    else play(track);
  };

  return (
    <div
      className={`group flex items-center gap-4 bg-zinc-900 rounded-xl px-4 py-3 hover:bg-zinc-800/80 transition-colors ${
        isActive ? 'ring-1 ring-violet-500/70' : ''
      }`}
    >
      {/* Optional rank number */}
      {rank !== undefined && (
        <span
          className={`w-6 text-center text-sm font-bold shrink-0 ${
            rank <= 3 ? 'text-violet-400' : 'text-zinc-600'
          }`}
        >
          {rank}
        </span>
      )}

      {/* Cover art / play button */}
      <button
        onClick={handlePlayPause}
        className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${track.coverColor} shrink-0 flex items-center justify-center hover:scale-105 transition-transform`}
      >
        {isActive && playing ? <PauseIcon /> : <PlayIcon />}
        {isActive && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-violet-500 rounded-full border-2 border-zinc-900" />
        )}
      </button>

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/track/${track.id}`}
          className="block text-white font-medium truncate hover:text-violet-400 transition-colors leading-tight"
        >
          {track.title}
        </Link>
        <Link
          href={`/profile/${track.address}`}
          className="block text-zinc-400 text-sm truncate hover:text-violet-400 transition-colors leading-tight mt-0.5"
        >
          {track.artist || shortAddress(track.address)}
        </Link>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-3 shrink-0">
        {track.genre && (
          <span className="hidden sm:block text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
            {track.genre}
          </span>
        )}
        <span className="text-xs text-zinc-500 tabular-nums">
          {track.plays.toLocaleString()} plays
        </span>
        <span className="text-xs text-zinc-600 tabular-nums w-10 text-right">
          {formatDuration(track.duration)}
        </span>
      </div>
    </div>
  );
}
