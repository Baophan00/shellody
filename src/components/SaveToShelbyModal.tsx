'use client';

import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { prepareJamendoSave, commitJamendoSave, BlobPayloadParams } from '@/lib/shelby';
import { addPrivateTrack } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { X, Loader2, CheckCircle2, Download } from 'lucide-react';
import type { JamendoTrack } from '@/app/api/discover/route';

const COVER_COLORS = [
  'from-violet-600 to-blue-600',
  'from-orange-500 to-pink-600',
  'from-green-500 to-teal-600',
  'from-purple-600 to-indigo-700',
  'from-red-500 to-orange-600',
  'from-cyan-500 to-blue-600',
  'from-yellow-500 to-orange-500',
  'from-pink-500 to-rose-600',
];

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

type Status = 'idle' | 'downloading' | 'signing' | 'uploading' | 'saving' | 'done';

interface Props {
  track: JamendoTrack;
  onClose: () => void;
  onSaved: () => void;
}

export default function SaveToShelbyModal({ track, onClose, onSaved }: Props) {
  const { account, signAndSubmitTransaction } = useWallet();
  const address = account?.address.toString() ?? '';

  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const busy = status !== 'idle';

  const handleSave = async () => {
    if (!address) return;
    setError('');

    const trackId = generateId();
    const coverColor = COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)];

    try {
      setStatus('downloading');
      const prep = await prepareJamendoSave(track.audiodownload || track.audio, trackId, address);

      setStatus('signing');
      const audioTx = await signAndSubmitTransaction({
        data: buildRegisterPayload(
          prep.deployerAddress,
          prep.audio,
          prep.expirationMicros,
          prep.encoding
        ),
      });

      setStatus('uploading');
      await commitJamendoSave(track.audiodownload || track.audio, audioTx.hash, address, prep.audioBlobName);

      setStatus('saving');
      addPrivateTrack({
        id: trackId,
        blobName: prep.audioBlobName,
        audioUrl: prep.audioUrl,
        address,
        cid: prep.cid,
        coverColor,
        duration: track.duration,
        uploadedAt: Date.now(),
        title: track.name,
        artist: track.artist_name,
        genre: track.genre || undefined,
      });

      setStatus('done');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      setStatus('idle');
    }
  };

  const statusLabel = () => {
    if (status === 'downloading') return 'Downloading from Jamendo…';
    if (status === 'signing') return 'Approve in wallet…';
    if (status === 'uploading') return 'Uploading to Shelby Protocol…';
    if (status === 'saving') return 'Saving track…';
    return '';
  };

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
            <h3 className="text-xl font-semibold mb-2">Saved to Shelby!</h3>
            <p className="text-sm text-muted-foreground mb-6">
              The track is now in your private library. Publish it to share with the world.
            </p>
            <Button className="bg-foreground text-background hover:bg-foreground/90" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Save to Shelby</h2>
              {!busy && (
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Track preview */}
            <div className="bg-muted/50 border border-border rounded-lg px-4 py-3 mb-6">
              <p className="text-sm font-medium truncate">{track.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {track.artist_name}
                {track.genre && <span className="text-muted-foreground/60"> · {track.genre}</span>}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">via Jamendo</p>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              This will download the track from Jamendo and store it on Shelby Protocol under your wallet address. One wallet approval required.
            </p>

            {error && <p className="text-sm text-destructive mb-4">{error}</p>}

            {busy && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{statusLabel()}</span>
              </div>
            )}

            <div className="flex gap-3">
              {!busy && (
                <Button variant="outline" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
              )}
              <Button
                className="flex-1 bg-foreground text-background hover:bg-foreground/90"
                disabled={busy || !address}
                onClick={handleSave}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1.5" />
                    Save to Shelby
                  </>
                )}
              </Button>
            </div>

            {!address && (
              <p className="text-xs text-center text-muted-foreground mt-3">
                Connect your wallet to save tracks
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
