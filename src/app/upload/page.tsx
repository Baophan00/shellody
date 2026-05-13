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
      <div className="min-h-screen">
        <Navigation />
        <main className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6">
          <h1 className="text-2xl font-bold mb-2">Wallet Required</h1>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Connect your Petra wallet to upload and share your music.
          </p>
          <Button
            onClick={() => connect('Petra')}
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            Connect Petra Wallet
          </Button>
        </main>
        <Player />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="mx-auto max-w-xl px-6 pt-32 pb-32">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Upload Track</h1>
        <p className="text-muted-foreground mb-12">
          Stored on Shelby Protocol — one Petra approval required. Tracks are private by default.
        </p>

        {status === 'done' ? (
          <div className="py-16 text-center">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Upload Complete</h2>
            <p className="text-muted-foreground">
              Your track has been uploaded as private. Redirecting…
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Drop zone */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                busy ? 'opacity-60 cursor-default' : 'cursor-pointer'
              } ${
                dragActive || file
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground'
              }`}
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
                  <Music className="h-8 w-8 text-primary mb-4" />
                  <p className="font-medium mb-1">{file.name}</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                    {fileDuration > 0 && (
                      <> &middot; {Math.floor(fileDuration / 60)}:{String(fileDuration % 60).padStart(2, '0')}</>
                    )}
                  </p>
                  {!busy && (
                    <button
                      className="text-sm text-muted-foreground hover:text-foreground underline"
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                    >
                      Change file
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="h-8 w-8 text-muted-foreground mb-4" />
                  <p className="font-medium mb-1">Drop your audio file here</p>
                  <p className="text-sm text-muted-foreground mb-4">MP3, WAV, FLAC, or AAC up to 50MB</p>
                  <button className="text-sm underline hover:text-muted-foreground">Browse files</button>
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Track Title <span className="text-destructive">*</span>
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
                <label className="block text-sm font-medium mb-2">Artist Name</label>
                <Input
                  placeholder="Your stage name (optional)"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  disabled={busy}
                  className="h-12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Genre</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  disabled={busy}
                  className="w-full h-12 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring disabled:opacity-50"
                >
                  <option value="">Select genre…</option>
                  {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            {/* Privacy notice */}
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <Lock className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>Your track will be uploaded as private. You can make it public from your profile at any time.</p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* Status */}
            {busy && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p>{statusLabel(status)}</p>
              </div>
            )}

            <Button
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90"
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

            <p className="text-xs text-center text-muted-foreground">
              By uploading, you confirm you own the rights to this music.
            </p>
          </div>
        )}
      </main>

      <Player />
    </div>
  )
}
