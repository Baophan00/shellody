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
import { Card, CardContent } from '@/components/ui/card'
import { Upload, Music, Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

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
      await commitUpload(prep.sessionId, audioTx.hash, address)

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
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Wallet Required</h1>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Connect your Petra wallet to sign uploads and pay storage fees on Aptos Testnet.
          </p>
          <Button onClick={() => connect('Petra')} className="gap-2">
            Connect Petra Wallet
          </Button>
        </main>
        <Player />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8 pb-32">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Upload Track</h1>
          <p className="text-muted-foreground">
            Stored on Shelby Protocol — one Petra approval required.
            After uploading, go to your profile to make it public.
          </p>
        </div>

        {status === 'done' ? (
          <Card className="border-accent/50 bg-accent/5">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/20 mb-4">
                <CheckCircle2 className="h-8 w-8 text-accent" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Upload Complete</h2>
              <p className="text-muted-foreground text-center">
                Your track has been uploaded as private. Redirecting to your profile…
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* File Upload Area */}
            <Card>
              <CardContent className="p-6">
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    busy
                      ? 'opacity-60 cursor-default'
                      : 'cursor-pointer'
                  } ${
                    dragActive
                      ? 'border-primary bg-primary/5'
                      : file
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-muted-foreground/50'
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
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/20 mb-4">
                        <Music className="h-7 w-7 text-accent" />
                      </div>
                      <p className="font-medium text-foreground mb-1">{file.name}</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                        {fileDuration > 0 && (
                          <> &middot; {Math.floor(fileDuration / 60)}:{String(fileDuration % 60).padStart(2, '0')}</>
                        )}
                      </p>
                      {!busy && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            fileInputRef.current?.click()
                          }}
                        >
                          Change File
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
                        <Upload className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <p className="font-medium text-foreground mb-1">
                        Drop your audio file here
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        MP3, WAV, FLAC, OGG, or AAC
                      </p>
                      <Button variant="outline">Browse Files</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Track Details */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Track Title <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="My awesome track"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={busy}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Artist Name
                  </label>
                  <Input
                    placeholder="Your stage name (optional)"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    disabled={busy}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Genre
                  </label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    disabled={busy}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring disabled:opacity-50"
                  >
                    <option value="">Select genre…</option>
                    {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Privacy notice */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Private by Default</p>
                <p className="text-sm text-muted-foreground">
                  Your track will be saved privately. You can make it public from your profile at any time.
                </p>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Status */}
            {busy && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <p className="text-sm text-foreground">{statusLabel(status)}</p>
              </div>
            )}

            {/* Upload button */}
            <Button
              className="w-full h-12 text-base"
              disabled={!file || !title.trim() || busy}
              onClick={handleUpload}
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Track
                </>
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
