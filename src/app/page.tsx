'use client';
import { useEffect, useState } from 'react';
import { Track } from '@/lib/types';
import { getTracks } from '@/lib/storage';
import TrackCard from '@/components/TrackCard';

export default function HomePage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTracks(getTracks());
    setLoaded(true);
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Hero */}
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
            <div
              key={i}
              className="h-[68px] bg-zinc-900 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-24 text-zinc-500">
          <p className="text-lg">No tracks yet. Be the first to upload!</p>
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
