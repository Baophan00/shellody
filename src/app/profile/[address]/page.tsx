'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Track, PrivateTrack } from '@/lib/types';
import { getTracks, getPrivateTracks, removePrivateTrack } from '@/lib/storage';
import TrackCard from '@/components/TrackCard';
import PublishModal from '@/components/PublishModal';
import { shortAddress } from '@/lib/utils';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

export default function ProfilePage() {
  const { address } = useParams<{ address: string }>();
  const { account } = useWallet();
  const myAddress = account?.address.toString() ?? null;
  const [tracks, setTracks] = useState<Track[]>([]);
  const [privateTracks, setPrivateTracks] = useState<PrivateTrack[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [publishTarget, setPublishTarget] = useState<PrivateTrack | null>(null);

  const isOwn = myAddress?.toLowerCase() === address?.toLowerCase();

  useEffect(() => {
    const localById = new Map(getTracks().map((t) => [t.id, t]));
    fetch(`/api/feed?address=${encodeURIComponent(address)}`)
      .then((r) => r.json())
      .then(({ tracks: shelbyTracks }: { tracks: Track[] }) => {
        const merged = shelbyTracks.map((t) => ({
          ...t,
          plays: localById.get(t.id)?.plays ?? t.plays,
        }));
        setTracks(merged);
      })
      .catch(() => {
        setTracks(getTracks().filter(
          (t) => t.address.toLowerCase() === address.toLowerCase()
        ));
      })
      .finally(() => setLoaded(true));
  }, [address]);

  useEffect(() => {
    if (isOwn) {
      setPrivateTracks(
        getPrivateTracks().filter(
          (t) => t.address.toLowerCase() === address.toLowerCase()
        )
      );
    }
  }, [isOwn, address]);

  const handlePublished = (id: string) => {
    removePrivateTrack(id);
    setPrivateTracks((prev) => prev.filter((t) => t.id !== id));
    setPublishTarget(null);
  };

  const totalPlays = tracks.reduce((sum, t) => sum + t.plays, 0);

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
          <p className="text-zinc-400 font-mono text-sm mt-1 break-all">{address}</p>

          <div className="flex items-center gap-6 mt-3">
            <div>
              <span className="text-white font-semibold text-lg">{tracks.length}</span>
              <span className="text-zinc-500 text-sm ml-1.5">public tracks</span>
            </div>
            {isOwn && privateTracks.length > 0 && (
              <div>
                <span className="text-white font-semibold text-lg">{privateTracks.length}</span>
                <span className="text-zinc-500 text-sm ml-1.5">private</span>
              </div>
            )}
            <div>
              <span className="text-white font-semibold text-lg">{totalPlays.toLocaleString()}</span>
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

      {/* Private tracks (owner only) */}
      {isOwn && privateTracks.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-zinc-400 text-sm font-medium uppercase tracking-wider">
              Private Tracks
            </h2>
            <span className="text-xs bg-zinc-800 text-zinc-500 border border-zinc-700 px-2 py-0.5 rounded-full">
              Only visible to you
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {privateTracks.map((track) => (
              <div
                key={track.id}
                className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
              >
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${track.coverColor} shrink-0 flex items-center justify-center`}
                >
                  <svg className="w-5 h-5 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-400 text-sm truncate font-mono">
                    {track.blobName.split('/').pop()}
                  </p>
                  <p className="text-zinc-600 text-xs mt-0.5">
                    {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}
                    {' · '}
                    {new Date(track.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setPublishTarget(track)}
                  className="shrink-0 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                >
                  Make Public
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Public tracks */}
      {!loaded ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[68px] bg-zinc-900 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl">
          <p className="text-zinc-500 text-lg mb-2">No public tracks yet.</p>
          {isOwn && (
            <p className="text-zinc-600 text-sm">
              Upload a track and hit <span className="text-violet-400">Make Public</span> to share it.
            </p>
          )}
        </div>
      ) : (
        <>
          <h2 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-3">
            Public Tracks
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
        <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Wallet</p>
        <p className="text-zinc-300 font-mono text-sm break-all">{address}</p>
        <p className="text-zinc-600 text-xs mt-2">Short: {shortAddress(address)}</p>
      </div>

      {publishTarget && (
        <PublishModal
          track={publishTarget}
          onClose={() => setPublishTarget(null)}
          onPublished={handlePublished}
        />
      )}
    </div>
  );
}
