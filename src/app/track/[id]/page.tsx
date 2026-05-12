'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Track } from '@/lib/types';
import { getTrackById } from '@/lib/storage';
import { usePlayer } from '@/context/PlayerContext';
import { formatDuration, shortAddress } from '@/lib/utils';

export default function TrackPage() {
  const { id } = useParams<{ id: string }>();
  const [track, setTrack] = useState<Track | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { currentTrack, playing, play, pause } = usePlayer();

  useEffect(() => {
    setTrack(getTrackById(id));
    setLoaded(true);
  }, [id]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!loaded) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="w-full aspect-square max-w-sm mx-auto rounded-3xl bg-zinc-900 animate-pulse mb-8" />
        <div className="h-8 bg-zinc-900 rounded animate-pulse mb-3" />
        <div className="h-5 bg-zinc-900 rounded animate-pulse w-1/2 mx-auto" />
      </div>
    );
  }

  if (!track) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center text-zinc-500">
        <p className="text-lg mb-4">Track not found.</p>
        <Link href="/" className="text-violet-400 hover:text-violet-300 transition-colors">
          ← Back to feed
        </Link>
      </div>
    );
  }

  const isActive = currentTrack?.id === track.id;
  const isPlaying = isActive && playing;

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      {/* Cover art with play button */}
      <div
        className={`relative w-full aspect-square max-w-sm mx-auto rounded-3xl bg-gradient-to-br ${track.coverColor} mb-8 flex items-center justify-center shadow-2xl`}
        style={{ boxShadow: '0 40px 80px -20px rgba(124, 58, 237, 0.4)' }}
      >
        {/* Pulsing ring when playing */}
        {isPlaying && (
          <div className="absolute inset-0 rounded-3xl ring-2 ring-white/20 animate-pulse" />
        )}

        <button
          onClick={() => (isPlaying ? pause() : play(track))}
          className="w-20 h-20 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Title + artist */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
          {track.title}
        </h1>
        <Link
          href={`/profile/${track.address}`}
          className="text-violet-400 hover:text-violet-300 text-lg transition-colors"
        >
          {track.artist || shortAddress(track.address)}
        </Link>
        {track.genre && (
          <div className="mt-3">
            <span className="text-xs text-zinc-500 bg-zinc-800 px-3 py-1 rounded-full">
              {track.genre}
            </span>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 bg-zinc-900 rounded-2xl overflow-hidden mb-4">
        <div className="text-center py-5 px-3">
          <p className="text-2xl font-bold text-white">
            {track.plays.toLocaleString()}
          </p>
          <p className="text-zinc-500 text-xs mt-1">Plays</p>
        </div>
        <div className="text-center py-5 px-3 border-x border-zinc-800">
          <p className="text-2xl font-bold text-white">
            {formatDuration(track.duration)}
          </p>
          <p className="text-zinc-500 text-xs mt-1">Duration</p>
        </div>
        <div className="text-center py-5 px-3">
          <p className="text-lg font-bold text-white truncate">
            {track.genre || '—'}
          </p>
          <p className="text-zinc-500 text-xs mt-1">Genre</p>
        </div>
      </div>

      {/* On-chain info */}
      <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 mb-4 space-y-3">
        <div>
          <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">
            Shelby CID
          </p>
          <p className="text-zinc-300 text-xs font-mono break-all leading-relaxed">
            {track.cid}
          </p>
        </div>

        <div>
          <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">
            Uploader
          </p>
          <Link
            href={`/profile/${track.address}`}
            className="text-violet-400 text-xs font-mono hover:text-violet-300 transition-colors break-all"
          >
            {track.address}
          </Link>
        </div>

        {track.txHash && (
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">
              Transaction
            </p>
            <p className="text-zinc-300 text-xs font-mono break-all">
              {track.txHash}
            </p>
          </div>
        )}

        <div>
          <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">
            Uploaded
          </p>
          <p className="text-zinc-400 text-xs">
            {new Date(track.uploadedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Share */}
      <button
        onClick={copyLink}
        className="w-full border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white py-3 rounded-full transition-colors text-sm font-medium"
      >
        {copied ? '✓ Link copied!' : 'Copy Share Link'}
      </button>
    </div>
  );
}
