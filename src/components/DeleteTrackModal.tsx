'use client';

import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { removePrivateTrack } from '@/lib/storage';
import { TrackArt } from '@/components/TrackArt';
import { Button } from '@/components/ui/button';
import { X, Loader2, Trash2 } from 'lucide-react';

interface DeleteTarget {
  id: string;
  title: string;
  artist: string;
  isPublic: boolean;
}

interface Props {
  track: DeleteTarget;
  userAddress: string;
  onClose: () => void;
  onDeleted: (id: string) => void;
}

export default function DeleteTrackModal({ track, userAddress, onClose, onDeleted }: Props) {
  const { signAndSubmitTransaction } = useWallet();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setBusy(true);
    setError('');

    try {
      if (track.isPublic) {
        const res = await fetch(
          `/api/track/delete-payload?trackId=${encodeURIComponent(track.id)}&address=${encodeURIComponent(userAddress)}`
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? 'Failed to get delete payload');
        }
        const { blobName, deployerAddress } = await res.json() as { blobName: string; deployerAddress: string };

        await signAndSubmitTransaction({
          data: {
            function: `${deployerAddress}::blob_metadata::delete_blob` as `${string}::${string}::${string}`,
            functionArguments: [blobName],
          },
        });
      } else {
        removePrivateTrack(track.id);
      }

      onDeleted(track.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!busy ? onClose : undefined}
      />
      <div className="relative bg-background border border-border rounded-xl p-6 w-full max-w-sm shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Remove Track</h2>
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
            <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Remove this track?{' '}
          {track.isPublic
            ? 'This will hide it from your profile and the public feed. The audio file will remain on Shelby until it expires.'
            : 'This will remove it from your private tracks.'}
        </p>

        {error && <p className="text-sm text-destructive mb-4">{error}</p>}

        {busy && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{track.isPublic ? 'Waiting for Petra approval…' : 'Removing…'}</span>
          </div>
        )}

        <div className="flex gap-3">
          {!busy && (
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button
            className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={busy}
            onClick={handleDelete}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-1.5" />
                Remove
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
