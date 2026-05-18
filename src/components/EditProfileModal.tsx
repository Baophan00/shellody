'use client'

import { useState, useRef } from 'react'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { prepareProfile, commitProfile } from '@/lib/shelby'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, X, CheckCircle2, Image } from 'lucide-react'

function hexToBytes(hex: string): Uint8Array {
  const h = hex.replace(/^0x/, '')
  const bytes = new Uint8Array(h.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

interface ProfileData {
  displayName?: string
  bio?: string
  avatarDataUrl?: string
}

interface EditProfileModalProps {
  current?: ProfileData | null
  onClose: () => void
  onSaved: () => void
}

export default function EditProfileModal({ current, onClose, onSaved }: EditProfileModalProps) {
  const { account, signAndSubmitTransaction } = useWallet()
  const address = account?.address.toString() ?? ''
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [displayName, setDisplayName] = useState(current?.displayName ?? '')
  const [bio, setBio] = useState(current?.bio ?? '')
  const [avatarPreview, setAvatarPreview] = useState(current?.avatarDataUrl ?? '')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const prep = await prepareProfile(address, displayName.trim(), avatarPreview || undefined)

      const tx = await signAndSubmitTransaction({
        data: {
          function: `${prep.deployerAddress}::blob_metadata::register_blob` as `${string}::${string}::${string}`,
          functionArguments: [
            prep.profile.blobName,
            prep.expirationMicros,
            hexToBytes(prep.profile.merkleRootHex),
            prep.profile.numChunksets,
            prep.profile.blobSize,
            0,
            prep.encoding,
          ],
        },
      })

      await commitProfile(tx.hash, address, prep.profile.blobName, prep.profileContent)

      setDone(true)
      setTimeout(() => onSaved(), 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md border-4 border-[#111111] bg-[#F9F9F7] p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl font-black tracking-tighter">
            {done ? 'Saved!' : 'Edit Profile'}
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
            <p className="font-sans text-sm font-semibold uppercase tracking-wider">Profile updated</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div
                className="h-16 w-16 border-2 border-[#111111] bg-[#E5E5E0] flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <Image className="h-6 w-6 text-[#737373]" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatar}
                className="hidden"
              />
              <div>
                <p className="font-sans text-xs font-semibold uppercase tracking-wider">Avatar</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#737373]">Click to upload</p>
              </div>
            </div>

            {/* Display name */}
            <div>
              <label className="block font-sans text-xs uppercase tracking-widest font-medium mb-2">Display Name</label>
              <Input
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={saving}
                className="h-12"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block font-sans text-xs uppercase tracking-widest font-medium mb-2">Bio</label>
              <textarea
                placeholder="Tell us about yourself…"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={saving}
                rows={3}
                className="w-full border-b-2 border-[#111111] bg-transparent px-3 py-2 font-mono text-sm placeholder:text-[#A3A3A3] focus-visible:bg-[#F0F0F0] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </div>

            {error && (
              <div className="border border-[#CC0000] p-3">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#CC0000]">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
