'use client';
import { useEffect, useState } from 'react';
import { Track } from '@/lib/types';
import { getTracks } from '@/lib/storage';
import TrackCard from '@/components/TrackCard';
import Link from 'next/link';

export default function HomePage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Build a play-count lookup from localStorage (real tracks only, no demos)
    const localById = new Map(getTracks().map((t) => [t.id, t]));

    fetch('/api/feed')
      .then((r) => r.json())
      .then(({ tracks: shelbyTracks }: { tracks: Track[] }) => {
        // Merge localStorage play counts into Shelby tracks
        const merged = shelbyTracks.map((t) => ({
          ...t,
          plays: localById.get(t.id)?.plays ?? t.plays,
        }));
        setTracks(merged);
      })
      .catch(() => setError(true))
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
          Latest Tracks
        </h1>
        <p className="text-zinc-400 text-lg">
          Decentralized music powered by{' '}
          <span className="text-violet-400">Shelby Protocol</span> &amp;{' '}
          <span className="text-blue-400">Aptos</span>
        </p>
      </div>

      {!loaded ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[68px] bg-zinc-900 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-24 border border-dashed border-zinc-800 rounded-2xl">
          <p className="text-zinc-500 text-lg mb-2">Couldn't reach the network.</p>
          <p className="text-zinc-600 text-sm">Check your connection and try refreshing.</p>
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-zinc-800 rounded-2xl">
          <p className="text-zinc-400 text-lg mb-2">No tracks on the network yet.</p>
          <p className="text-zinc-600 text-sm mb-6">Be the first to upload a track.</p>
          <Link
            href="/upload"
            className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-6 py-2.5 rounded-full transition-colors"
          >
            Upload a Track
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tracks.map((track) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </div>
      )}
    </div>
  );
}
