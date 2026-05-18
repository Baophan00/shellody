'use client'

import { useState } from 'react'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { getTracks, saveTracks, removePrivateTrack } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2, X, AlertCircle, CheckCircle2, Wallet } from 'lucide-react'

interface DeleteTrackModalProps {
  track: { id: string; title: string; artist: string; isPublic: boolean; blobName?: string }
  userAddress: string
  onClose: () => void
  onDeleted: (id: string) => void
}

export default function DeleteTrackModal({ track, userAddress, onClose, onDeleted }: DeleteTrackModalProps) {
  const { signAndSubmitTransaction } = useWallet()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  // If the track has a blobName, it exists on Shelby Protocol (blockchain) and needs a wallet signature to delete.
  // If no blobName, it's only in local storage.
  const needsChainDelete = !!track.blobName

  const handleDelete = async () => {
    setDeleting(true)
    setError('')
    try {
      if (needsChainDelete) {
        // 1. Get the delete transaction payload from the server
        const res = await fetch('/api/delete-track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blobName: track.blobName }),
        })
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}))
          throw new Error((errBody as { error?: string }).error ?? 'Failed to prepare delete transaction')
        }
        const { txPayload } = await res.json()

        // 2. Sign and submit the transaction (costs gas)
        const txResult = await signAndSubmitTransaction({
          data: txPayload,
        })
        console.log('Delete tx submitted:', txResult)

        // 3. Remove from local storage
        if (track.isPublic) {
          const tracks = getTracks().filter((t) => t.id !== track.id)
          saveTracks(tracks)
        } else {
          removePrivateTrack(track.id)
        }
      } else {
        // No blobName → only exists locally, just remove from storage
        if (track.isPublic) {
          const tracks = getTracks().filter((t) => t.id !== track.id)
          saveTracks(tracks)
        } else {
          removePrivateTrack(track.id)
        }
      }

      setDone(true)
      setTimeout(() => onDeleted(track.id), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md border-4 border-[#111111] bg-[#F9F9F7] p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl font-black tracking-tighter">
            {done ? 'Deleted' : 'Delete Track'}
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
              has been deleted
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-6 border border-[#CC0000] p-4">
              <Trash2 className="h-8 w-8 text-[#CC0000]" />
              <div>
                <p className="font-sans text-sm font-semibold uppercase tracking-wider">{track.title}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#737373]">{track.artist}</p>
              </div>
            </div>

            <p className="font-mono text-[10px] uppercase tracking-widest text-[#737373] mb-6 leading-relaxed">
              {needsChainDelete
                ? 'This track exists on Shelby Protocol (blockchain). Deleting it requires signing a transaction (costs gas on Aptos).'
                : 'This track only exists locally. It will be permanently removed from your collection.'}
            </p>

            {needsChainDelete && (
              <div className="flex items-start gap-3 border border-[#111111] p-4 mb-4 bg-[#F5F5F5]">
                <Wallet className="h-4 w-4 flex-shrink-0 mt-0.5 text-[#111111]" />
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#737373]">
                  Wallet approval required. This transaction will cost gas on Aptos testnet.
                </p>
              </div>
            )}

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
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {needsChainDelete ? 'Signing…' : 'Deleting…'}
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
