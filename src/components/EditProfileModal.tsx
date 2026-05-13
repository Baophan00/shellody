'use client'

import { useState, useRef, useCallback } from 'react'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { prepareProfile, commitProfile } from '@/lib/shelby'
import { UserProfile } from '@/lib/types'
import { setCachedProfile } from '@/hooks/useProfile'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, Camera, Loader2, CheckCircle2 } from 'lucide-react'

function hexToBytes(hex: string): Uint8Array {
  const h = hex.replace(/^0x/, '')
  const bytes = new Uint8Array(h.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

function buildRegisterPayload(
  deployerAddress: string,
  params: { blobName: string; merkleRootHex: string; numChunksets: number; blobSize: number },
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
  }
}

function resizeImage(file: File, maxPx: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1)
      const w = Math.round(img.width * ratio)
      const h = Math.round(img.height * ratio)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')) }
    img.src = url
  })
}

type Status = 'idle' | 'preparing' | 'signing' | 'uploading' | 'done'

interface Props {
  current: UserProfile | null
  onClose: () => void
  onSaved: (profile: UserProfile) => void
}

export default function EditProfileModal({ current, onClose, onSaved }: Props) {
  const { account, signAndSubmitTransaction } = useWallet()
  const address = account?.address.toString() ?? ''

  const [displayName, setDisplayName] = useState(current?.displayName ?? '')
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | undefined>(current?.avatarDataUrl)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const busy = status !== 'idle'

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await resizeImage(file, 256)
      setAvatarDataUrl(dataUrl)
    } catch {
      setError('Could not load image')
    }
  }, [])

  const handleSave = async () => {
    if (!address || !displayName.trim()) return
    setError('')

    try {
      setStatus('preparing')
      const prep = await prepareProfile(address, displayName.trim(), avatarDataUrl)

      setStatus('signing')
      const tx = await signAndSubmitTransaction({
        data: buildRegisterPayload(prep.deployerAddress, prep.profile, prep.expirationMicros, prep.encoding),
      })

      setStatus('uploading')
      await commitProfile(tx.hash, address, prep.profile.blobName, prep.profileContent)

      // Use the exact profile the server serialized so the cache matches on-chain data
      const saved: UserProfile = JSON.parse(prep.profileContent)
      setCachedProfile(address, saved)

      setStatus('done')
      onSaved(saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setStatus('idle')
    }
  }

  const statusLabel = () => {
    if (status === 'preparing') return 'Computing commitments…'
    if (status === 'signing') return 'Approve in Petra…'
    if (status === 'uploading') return 'Saving to Shelby…'
    return ''
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!busy ? onClose : undefined} />
      <div className="relative bg-background border border-border rounded-xl p-6 w-full max-w-sm shadow-xl">
        {status === 'done' ? (
          <div className="text-center py-4">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Profile Saved</h3>
            <p className="text-sm text-muted-foreground mb-6">Your profile has been updated on Shelby.</p>
            <Button className="bg-foreground text-background hover:bg-foreground/90" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Edit Profile</h2>
              {!busy && (
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <div
                  className="h-24 w-24 rounded-full overflow-hidden bg-muted cursor-pointer border-2 border-border hover:border-primary transition-colors flex items-center justify-center"
                  onClick={() => !busy && fileInputRef.current?.click()}
                >
                  {avatarDataUrl ? (
                    <img src={avatarDataUrl} alt="Avatar preview" className="h-full w-full object-cover" />
                  ) : (
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <button
                  onClick={() => !busy && fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-foreground/80 transition-colors"
                  disabled={busy}
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground mt-2">Click to upload avatar</p>
            </div>

            {/* Display name */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Display Name</label>
              <Input
                placeholder="Your name or artist handle"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={busy}
                className="h-11"
                maxLength={64}
              />
            </div>

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
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onClose}
                >
                  Cancel
                </Button>
              )}
              <Button
                className="flex-1 bg-foreground text-background hover:bg-foreground/90"
                disabled={!displayName.trim() || busy}
                onClick={handleSave}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Profile'}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground mt-4">
              One Petra approval required to save on Shelby Protocol
            </p>
          </>
        )}
      </div>
    </div>
  )
}
