'use client'

import { useState } from 'react'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { PrivateTrack } from '@/lib/types'
import { preparePublish, commitPublish } from '@/lib/shelby'
import { addTrack, removePrivateTrack } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Globe, Loader2, X, AlertCircle, CheckCircle2 } from 'lucide-react'

function hexToBytes(hex: string): Uint8Array {
  const h = hex.replace(/^0x/, '')
  const bytes = new Uint8Array(h.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

interface PublishModalProps {
  track: PrivateTrack
  onClose: () => void
  onPublished: (id: string) => void
}

export default function PublishModal({ track, onClose, onPublished }: PublishModalProps) {
  const { signAndSubmitTransaction } = useWallet()
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handlePublish = async () => {
    setPublishing(true)
    setError('')
    try {
      const prep = await preparePublish(
        track.id,
        track.address,
        track.title,
        track.artist,
        track.genre ?? '',
        track.coverColor,
        track.duration,
        track.audioUrl,
        track.blobName,
        track.cid
      )

      const tx = await signAndSubmitTransaction({
        data: {
          function: `${prep.deployerAddress}::blob_metadata::register_blob` as `${string}::${string}::${string}`,
          functionArguments: [
            prep.metaBlobName,
            prep.expirationMicros,
            hexToBytes(prep.metadata.merkleRootHex),
            prep.metadata.numChunksets,
            prep.metadata.blobSize,
            0,
            prep.encoding,
          ],
        },
      })

      await commitPublish(tx.hash, track.address, prep.metaBlobName, prep.metadataContent)

      // Move from private to public
      addTrack({
        id: track.id,
        title: track.title,
        artist: track.artist,
        address: track.address,
        cid: track.cid,
        audioUrl: track.audioUrl,
        coverColor: track.coverColor,
        duration: track.duration,
        plays: 0,
        uploadedAt: track.uploadedAt,
        genre: track.genre,
      })
      removePrivateTrack(track.id)

      setDone(true)
      setTimeout(() => onPublished(track.id), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publishing failed')
      setPublishing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md border-4 border-[#111111] bg-[#F9F9F7] p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl font-black tracking-tighter">
            {done ? 'Published!' : 'Make Public'}
          </h2>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center border border-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {done ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-[#111111] mx-auto mb-4" />
            <p className="font-sans text-sm font-semibold uppercase tracking-wider mb-2">{track.title}</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#737373]">
              is now public on the feed
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-6 border border-[#111111] p-4">
              <Globe className="h-8 w-8 text-[#111111]" />
              <div>
                <p className="font-sans text-sm font-semibold uppercase tracking-wider">{track.title}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#737373]">{track.artist}</p>
              </div>
            </div>

            <p className="font-mono text-[10px] uppercase tracking-widest text-[#737373] mb-6 leading-relaxed">
              This will register the track on-chain and make it visible to everyone on the feed. A Petra approval is required.
            </p>

            {error && (
              <div className="flex items-start gap-3 border border-[#CC0000] p-4 mb-4">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-[#CC0000]" />
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#CC0000]">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={publishing}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handlePublish}
                disabled={publishing}
              >
                {publishing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing…
                  </>
                ) : (
                  'Publish'
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
