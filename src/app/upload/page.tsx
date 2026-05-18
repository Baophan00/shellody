'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { addPrivateTrack } from '@/lib/storage'
import { prepareUpload, commitUpload, BlobPayloadParams } from '@/lib/shelby'
import { generateId } from '@/lib/utils'
import { Navigation } from '@/components/Navigation'
import { Player } from '@/components/Player'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, Music, Lock, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

const COVER_COLORS = [
  'from-violet-600 to-blue-600',
  'from-orange-500 to-pink-600',
  'from-green-500 to-teal-600',
  'from-purple-600 to-indigo-700',
  'from-red-500 to-orange-600',
  'from-cyan-500 to-blue-600',
  'from-yellow-500 to-orange-500',
  'from-pink-500 to-rose-600',
]

const GENRES = [
  'Electronic', 'Hip-Hop', 'Ambient', 'Funk', 'Jazz',
  'Rock', 'Pop', 'Classical', 'Lo-Fi', 'R&B', 'Other',
]

type Status = 'idle' | 'preparing' | 'signing' | 'uploading' | 'saving' | 'done'

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
  }
}

function statusLabel(status: Status): string {
  if (status === 'preparing') return 'Computing storage commitments…'
  if (status === 'signing') return 'Approve audio registration in Petra…'
  if (status === 'uploading') return 'Uploading to Shelby Protocol…'
  if (status === 'saving') return 'Saving track…'
  if (status === 'done') return 'Done! Redirecting to your profile…'
  return ''
}

export default function UploadPage() {
  const { account, connected, connect, signAndSubmitTransaction } = useWallet()
  const address = account?.address.toString() ?? null
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [genre, setGenre] = useState('')
  const [fileDuration, setFileDuration] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  const loadFile = useCallback(
    (f: File) => {
      setFile(f)
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''))
      const audio = new Audio()
      const url = URL.createObjectURL(f)
      audio.src = url
      audio.onloadedmetadata = () => {
        setFileDuration(Math.floor(audio.duration))
        URL.revokeObjectURL(url)
      }
    },
    [title]
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) loadFile(f)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith('audio/')) loadFile(f)
  }

  const handleUpload = async () => {
    if (!file || !title.trim() || !address) return
    setError('')
    const trackId = generateId()
    const coverColor = COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)]

    try {
      setStatus('preparing')
      const prep = await prepareUpload(file, address, trackId)

      setStatus('signing')
      const audioTx = await signAndSubmitTransaction({
        data: buildRegisterPayload(
          prep.deployerAddress,
          prep.audio,
          prep.expirationMicros,
          prep.encoding
        ),
      })

      setStatus('uploading')
      await commitUpload(file, audioTx.hash, address, prep.audioBlobName)

      setStatus('saving')
      addPrivateTrack({
        id: trackId,
        blobName: prep.audioBlobName,
        audioUrl: prep.audioUrl,
        address,
        cid: prep.cid,
        coverColor,
        duration: fileDuration,
        uploadedAt: Date.now(),
        title: title.trim(),
        artist: artist.trim() || address.slice(0, 8),
        genre: genre || undefined,
      })

      setStatus('done')
      router.push(`/profile/${address}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setError(msg)
      setStatus('idle')
    }
  }

  const busy = status !== 'idle'

  if (!connected) {
    return (
      <div className="min-h-screen bg-[#F9F9F7]">
        <Navigation />
        <main className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6">
          <div className="border-4 border-[#111111] p-12 max-w-md w-full text-center">
            <h1 className="font-serif text-4xl font-black mb-2">Wallet Required</h1>
            <p className="font-mono text-xs uppercase tracking-widest text-[#737373] mb-6">
              Connect your Petra wallet to upload and share your music.
            </p>
            <Button
              onClick={() => connect('Petra')}
              className="w-full"
            >
              Connect Petra Wallet
            </Button>
          </div>
        </main>
        <Player />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <Navigation />

      <main className="mx-auto max-w-2xl px-4 pt-32 pb-32">
        <div className="border-b-4 border-[#111111] pb-6 mb-12">
          <h1 className="font-serif text-5xl lg:text-6xl font-black tracking-tighter mb-2">Upload Track</h1>
          <p className="font-mono text-xs uppercase tracking-widest text-[#737373]">
            Stored on Shelby Protocol — one Petra approval required. Tracks are private by default.
          </p>
        </div>

        {status === 'done' ? (
          <div className="py-16 text-center border-4 border-[#111111] p-12">
            <CheckCircle2 className="h-12 w-12 text-[#111111] mx-auto mb-4" />
            <h2 className="font-serif text-3xl font-bold mb-2">Upload Complete</h2>
            <p className="font-mono text-xs uppercase tracking-widest text-[#737373]">
              Your track has been uploaded as private. Redirecting…
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Drop zone */}
            <div
              className={`relative border-2 border-[#111111] p-12 text-center transition-colors ${
                busy ? 'opacity-60 cursor-default' : 'cursor-pointer hover:bg-[#F5F5F5]'
              } ${dragActive || file ? 'bg-[#F5F5F5]' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !busy && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.flac,.ogg,.aac"
                onChange={handleFileSelect}
                className="hidden"
              />

              {file ? (
                <div className="flex flex-col items-center">
                  <Music className="h-8 w-8 text-[#111111] mb-4" />
                  <p className="font-sans text-sm font-semibold uppercase tracking-wider mb-1">{file.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#737373] mb-4">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                    {fileDuration > 0 && (
                      <> · {Math.floor(fileDuration / 60)}:{String(fileDuration % 60).padStart(2, '0')}</>
                    )}
                  </p>
                  {!busy && (
                    <button
                      className="font-sans text-xs uppercase tracking-widest underline underline-offset-4 decoration-2 decoration-[#CC0000] hover:text-[#CC0000]"
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                    >
                      Change file
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="h-8 w-8 text-[#737373] mb-4" />
                  <p className="font-sans text-sm font-semibold uppercase tracking-wider mb-1">Drop your audio file here</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#737373] mb-4">MP3, WAV, FLAC, or AAC up to 50MB</p>
                  <button className="font-sans text-xs uppercase tracking-widest underline underline-offset-4 decoration-2 decoration-[#CC0000] hover:text-[#CC0000]">Browse files</button>
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="space-y-6">
              <div>
                <label className="block font-sans text-xs uppercase tracking-widest font-medium mb-2">
                  Track Title <span className="text-[#CC0000]">*</span>
                </label>
                <Input
                  placeholder="Enter track title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={busy}
                  className="h-12"
                />
              </div>
              <div>
                <label className="block font-sans text-xs uppercase tracking-widest font-medium mb-2">Artist Name</label>
                <Input
                  placeholder="Your stage name (optional)"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  disabled={busy}
                  className="h-12"
                />
              </div>
              <div>
                <label className="block font-sans text-xs uppercase tracking-widest font-medium mb-2">Genre</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  disabled={busy}
                  className="w-full h-12 border-b-2 border-[#111111] bg-transparent px-3 font-mono text-sm text-[#111111] outline-none focus-visible:bg-[#F0F0F0] disabled:opacity-50"
                >
                  <option value="">Select genre…</option>
                  {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            {/* Privacy notice */}
            <div className="flex items-start gap-3 border border-[#111111] p-4">
              <Lock className="h-4 w-4 flex-shrink-0 mt-0.5 text-[#737373]" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#737373]">
                Your track will be uploaded as private. You can make it public from your profile at any time.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 border border-[#CC0000] p-4">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-[#CC0000]" />
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#CC0000]">{error}</p>
              </div>
            )}

            {/* Status */}
            {busy && (
              <div className="flex items-center gap-3 border border-[#111111] p-4">
                <Loader2 className="h-4 w-4 animate-spin text-[#111111]" />
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#737373]">{statusLabel(status)}</p>
              </div>
            )}

            <Button
              className="w-full h-12"
              disabled={!file || !title.trim() || busy}
              onClick={handleUpload}
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                'Upload Track'
              )}
            </Button>

            <p className="font-mono text-[10px] text-center uppercase tracking-widest text-[#737373]">
              By uploading, you confirm you own the rights to this music.
            </p>
          </div>
        )}
      </main>

      <Player />
    </div>
  )
}
