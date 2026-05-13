'use client';
import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { preparePublish, commitPublish, BlobPayloadParams } from '@/lib/shelby';
import { removePrivateTrack } from '@/lib/storage';
import { PrivateTrack } from '@/lib/types';

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

  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const busy = status !== 'idle';

  const handlePublish = async () => {
    if (!address) return;
    setError('');

    try {
      setStatus('preparing');
      const prep = await preparePublish(
        track.id,
        address,
        track.title,
        track.artist,
        track.genre ?? '',
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
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={!busy ? onClose : undefined}
      />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        {status === 'done' ? (
          <div className="text-center py-4">
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

            {/* Track preview */}
            <div className="flex items-center gap-3 bg-zinc-800 rounded-xl px-4 py-3 mb-5">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${track.coverColor} shrink-0`} />
              <div className="min-w-0">
                <p className="text-white font-medium text-sm truncate">{track.title}</p>
                <p className="text-zinc-500 text-xs truncate">{track.artist}</p>
                {track.genre && (
                  <p className="text-zinc-600 text-xs">{track.genre}</p>
                )}
              </div>
            </div>

            <p className="text-zinc-500 text-sm mb-5">
              One Petra approval required to publish this track to the public feed.
            </p>

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
                  {status === 'signing' && 'Approve in Petra…'}
                  {status === 'uploading' && 'Publishing to Shelby Protocol…'}
                </span>
              </div>
            )}

            <button
              onClick={handlePublish}
              disabled={busy}
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
