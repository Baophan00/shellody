'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Track } from '@/lib/types';
import { getTracksByAddress } from '@/lib/storage';
import TrackCard from '@/components/TrackCard';
import { shortAddress } from '@/lib/utils';
import { useWallet } from '@/context/WalletContext';

export default function ProfilePage() {
  const { address } = useParams<{ address: string }>();
  const { address: myAddress } = useWallet();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTracks(getTracksByAddress(address));
    setLoaded(true);
  }, [address]);

  const isOwn =
    myAddress?.toLowerCase() === address?.toLowerCase();

  const totalPlays = tracks.reduce((sum, t) => sum + t.plays, 0);

  // Pick a deterministic gradient from the address bytes
  const gradients = [
    'from-violet-600 to-blue-600',
    'from-orange-500 to-pink-600',
    'from-green-500 to-teal-600',
    'from-purple-600 to-indigo-700',
    'from-red-500 to-orange-600',
    'from-cyan-500 to-blue-600',
  ];
  const avatarColor =
    gradients[parseInt(address?.slice(2, 4) ?? '0', 16) % gradients.length];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10">
        <div
          className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${avatarColor} flex items-center justify-center shrink-0 shadow-2xl shadow-violet-900/30`}
        >
          <span className="text-white text-3xl font-bold">
            {address?.slice(2, 4).toUpperCase()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">
              {isOwn ? 'Your Profile' : 'Artist Profile'}
            </h1>
            {isOwn && (
              <span className="text-xs bg-violet-500/20 text-violet-400 border border-violet-500/30 px-2 py-0.5 rounded-full">
                You
              </span>
            )}
          </div>
          <p className="text-zinc-400 font-mono text-sm mt-1 break-all">
            {address}
          </p>

          <div className="flex items-center gap-6 mt-3">
            <div>
              <span className="text-white font-semibold text-lg">
                {tracks.length}
              </span>
              <span className="text-zinc-500 text-sm ml-1.5">tracks</span>
            </div>
            <div>
              <span className="text-white font-semibold text-lg">
                {totalPlays.toLocaleString()}
              </span>
              <span className="text-zinc-500 text-sm ml-1.5">total plays</span>
            </div>
          </div>
        </div>

        {isOwn && (
          <Link
            href="/upload"
            className="shrink-0 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors shadow-lg shadow-violet-900/30"
          >
            + Upload Track
          </Link>
        )}
      </div>

      {/* Tracks */}
      {!loaded ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[68px] bg-zinc-900 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl">
          <p className="text-zinc-500 text-lg mb-2">No tracks uploaded yet.</p>
          {isOwn && (
            <Link
              href="/upload"
              className="text-violet-400 hover:text-violet-300 text-sm transition-colors"
            >
              Upload your first track →
            </Link>
          )}
        </div>
      ) : (
        <>
          <h2 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-3">
            Tracks
          </h2>
          <div className="flex flex-col gap-2">
            {tracks.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        </>
      )}

      {/* Wallet info */}
      <div className="mt-10 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
        <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">
          Wallet
        </p>
        <p className="text-zinc-300 font-mono text-sm break-all">{address}</p>
        <p className="text-zinc-600 text-xs mt-2">
          Short: {shortAddress(address)}
        </p>
      </div>
    </div>
  );
}
