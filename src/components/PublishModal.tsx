'use client';
import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { preparePublish, commitPublish, BlobPayloadParams } from '@/lib/shelby';
import { removePrivateTrack } from '@/lib/storage';
import { PrivateTrack } from '@/lib/types';

const GENRES = [
  'Electronic', 'Hip-Hop', 'Ambient', 'Funk', 'Jazz',
  'Rock', 'Pop', 'Classical', 'Lo-Fi', 'R&B', 'Other',
];

type Status = 'idle' | 'preparing' | 'signing' | 'uploading' | 'done';

function hexToBytes(hex: string): Uint8Array {
  const h = hex.replace(/^0x/, '');
  const bytes = new Uint8Array(h.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function buildRegisterPayload(
  deployerAddress: string,
  params: BlobPayloadParams,
  expirationMicros: number,
  encoding: number
) {
  return {
    function: `${deployerAddress}::blob_metadata::register_blob` as `${string}::${string}::${string}`,
    functionArguments: [
      params.blobName,
      expirationMicros,
      hexToBytes(params.merkleRootHex),
      params.numChunksets,
      params.blobSize,
      0,
      encoding,
    ],
  };
}

interface Props {
  track: PrivateTrack;
  onClose: () => void;
  onPublished: (id: string) => void;
}

export default function PublishModal({ track, onClose, onPublished }: Props) {
  const { account, signAndSubmitTransaction } = useWallet();
  const address = account?.address.toString() ?? '';

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const busy = status !== 'idle';

  const handlePublish = async () => {
    if (!title.trim() || !address) return;
    setError('');

    try {
      setStatus('preparing');
      const prep = await preparePublish(
        track.id,
        address,
        title.trim(),
        artist.trim() || address.slice(0, 8),
        genre,
        track.coverColor,
        track.duration,
        track.audioUrl,
        track.blobName,
        track.cid
      );

      setStatus('signing');
      const metaTx = await signAndSubmitTransaction({
        data: buildRegisterPayload(
          prep.deployerAddress,
          prep.metadata,
          prep.expirationMicros,
          prep.encoding
        ),
      });

      setStatus('uploading');
      await commitPublish(prep.sessionId, metaTx.hash, address);

      setStatus('done');
      removePrivateTrack(track.id);
      onPublished(track.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Publish failed';
      setError(msg);
      setStatus('idle');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={!busy ? onClose : undefined} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {status === 'done' ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-white font-bold text-lg mb-1">Published!</h3>
            <p className="text-zinc-400 text-sm mb-5">Your track is now live on the public feed.</p>
            <button
              onClick={onClose}
              className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-6 py-2.5 rounded-full transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg">Make Public</h3>
              {!busy && (
                <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <p className="text-zinc-500 text-sm mb-5">
              One Petra approval required to publish your track to the public feed.
            </p>

            <div className="flex flex-col gap-4 mb-5">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-zinc-400">Track Title <span className="text-red-400">*</span></span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={busy}
                  placeholder="My awesome track"
                  className="bg-zinc-800 border border-zinc-700 focus:border-violet-500 rounded-xl px-4 py-3 text-white placeholder-zinc-600 outline-none transition-colors disabled:opacity-50"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-zinc-400">Artist Name</span>
                <input
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  disabled={busy}
                  placeholder="Your stage name (optional)"
                  className="bg-zinc-800 border border-zinc-700 focus:border-violet-500 rounded-xl px-4 py-3 text-white placeholder-zinc-600 outline-none transition-colors disabled:opacity-50"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-zinc-400">Genre</span>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  disabled={busy}
                  className="bg-zinc-800 border border-zinc-700 focus:border-violet-500 rounded-xl px-4 py-3 text-white outline-none transition-colors disabled:opacity-50 appearance-none"
                >
                  <option value="">Select genre…</option>
                  {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </label>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-4 text-sm">
                {error}
              </div>
            )}

            {busy && (
              <div className="flex items-center gap-3 bg-zinc-800 rounded-xl px-4 py-3 mb-4">
                <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin shrink-0" />
                <span className="text-zinc-300 text-sm">
                  {status === 'preparing' && 'Computing metadata commitments…'}
                  {status === 'signing' && 'Approve metadata registration in Petra…'}
                  {status === 'uploading' && 'Publishing to Shelby Protocol…'}
                </span>
              </div>
            )}

            <button
              onClick={handlePublish}
              disabled={!title.trim() || busy}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-full transition-colors"
            >
              Publish Track
            </button>
          </>
        )}
      </div>
    </div>
  );
}
