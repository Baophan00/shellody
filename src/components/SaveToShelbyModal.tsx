'use client'

import { useState } from 'react'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { addPrivateTrack } from '@/lib/storage'
import { prepareJamendoSave, commitJamendoSave } from '@/lib/shelby'
import { generateId } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Download, Loader2, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { JamendoTrack } from '@/app/api/discover/route'

interface SaveToShelbyModalProps {
  track: JamendoTrack
  onClose: () => void
  onSaved: () => void
}

type Status = 'idle' | 'preparing' | 'signing' | 'uploading' | 'saving' | 'done'

export default function SaveToShelbyModal({ track, onClose, onSaved }: SaveToShelbyModalProps) {
  const { account, signAndSubmitTransaction } = useWallet()
  const address = account?.address.toString() ?? ''
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  const handleSave = async () => {
    setError('')
    const trackId = generateId()
    const coverColor = 'from-violet-600 to-blue-600'

    try {
      // Step 1: Server downloads from Jamendo + computes storage commitments
      setStatus('preparing')
      const prep = await prepareJamendoSave(track.audio, trackId, address)

      // Step 2: Sign on-chain registration in Petra
      setStatus('signing')
      const audioTx = await signAndSubmitTransaction({
        data: {
          function: `${prep.deployerAddress}::blob_metadata::register_blob` as `${string}::${string}::${string}`,
          functionArguments: [
            prep.audio.blobName,
            prep.expirationMicros,
            (() => {
              const h = prep.audio.merkleRootHex.replace(/^0x/, '')
              const bytes = new Uint8Array(h.length / 2)
              for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16)
              return bytes
            })(),
            prep.audio.numChunksets,
            prep.audio.blobSize,
            0,
            prep.encoding,
          ],
        },
      })

      // Step 3: Server uploads blob to Shelby
      setStatus('uploading')
      await commitJamendoSave(track.audio, audioTx.hash, address, prep.audioBlobName)

      // Step 4: Save to local private collection
      setStatus('saving')
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
      })

      setStatus('done')
      setTimeout(() => onSaved(), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setStatus('idle')
    }
  }

  const busy = status !== 'idle' && status !== 'done'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md border-4 border-[#111111] bg-[#F9F9F7] p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl font-black tracking-tighter">
            {status === 'done' ? 'Saved!' : 'Save to Shelby'}
          </h2>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center border border-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {status === 'done' ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-[#111111] mx-auto mb-4" />
            <p className="font-sans text-sm font-semibold uppercase tracking-wider mb-2">{track.name}</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#737373]">
              saved to your private collection
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-6 border border-[#111111] p-4">
              <Download className="h-8 w-8 text-[#111111]" />
              <div>
                <p className="font-sans text-sm font-semibold uppercase tracking-wider">{track.name}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#737373]">{track.artist_name}</p>
              </div>
            </div>

            <p className="font-mono text-[10px] uppercase tracking-widest text-[#737373] mb-6 leading-relaxed">
              This will download the track from Jamendo and upload it to the Shelby Protocol. A wallet approval is required.
            </p>

            {error && (
              <div className="flex items-start gap-3 border border-[#CC0000] p-4 mb-4">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-[#CC0000]" />
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#CC0000]">{error}</p>
              </div>
            )}

            {busy && (
              <div className="flex items-center gap-3 border border-[#111111] p-4 mb-4">
                <Loader2 className="h-4 w-4 animate-spin text-[#111111]" />
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#737373]">
                  {status === 'preparing' && 'Downloading from Jamendo & computing commitments…'}
                  {status === 'signing' && 'Approve in Petra…'}
                  {status === 'uploading' && 'Uploading to Shelby…'}
                  {status === 'saving' && 'Saving to your collection…'}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={busy}
              >
                {busy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save to Shelby'
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
