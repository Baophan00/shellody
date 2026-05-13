'use client';
import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { preparePublish, commitPublish, BlobPayloadParams } from '@/lib/shelby';
import { removePrivateTrack } from '@/lib/storage';
import { PrivateTrack } from '@/lib/types';
import { TrackArt } from '@/components/TrackArt';
import { Button } from '@/components/ui/button';
import { X, Loader2, CheckCircle2 } from 'lucide-react';

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
      await commitPublish(metaTx.hash, address, prep.metaBlobName, prep.metadataContent);

      setStatus('done');
      removePrivateTrack(track.id);
      onPublished(track.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Publish failed';
      setError(msg);
      setStatus('idle');
    }
  };

  const statusLabel = () => {
    if (status === 'preparing') return 'Computing metadata commitments…'
    if (status === 'signing') return 'Approve in Petra…'
    if (status === 'uploading') return 'Publishing to Shelby Protocol…'
    return ''
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!busy ? onClose : undefined}
      />
      <div className="relative bg-background border border-border rounded-xl p-6 w-full max-w-sm shadow-xl">
        {status === 'done' ? (
          <div className="text-center py-4">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Published!</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Your track is now live on the public feed.
            </p>
            <Button className="bg-foreground text-background hover:bg-foreground/90" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Make Public</h2>
              {!busy && (
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Track preview */}
            <div className="flex items-center gap-3 bg-muted/50 border border-border rounded-lg px-4 py-3 mb-6">
              <TrackArt trackId={track.id} isPlaying={false} className="h-10 w-10 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{track.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {track.artist}
                  {track.genre && <span className="text-muted-foreground/60"> · {track.genre}</span>}
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              One wallet approval required to publish this track to the public feed.
            </p>

            {/* Error */}
            {error && (
              <p className="text-sm text-destructive mb-4">{error}</p>
            )}

            {/* Status */}
            {busy && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{statusLabel()}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {!busy && (
                <Button variant="outline" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
              )}
              <Button
                className="flex-1 bg-foreground text-background hover:bg-foreground/90"
                disabled={busy}
                onClick={handlePublish}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Publish Track'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
