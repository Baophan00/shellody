'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Track, PrivateTrack } from '@/lib/types'
import { getTracks, getPrivateTracks, removePrivateTrack } from '@/lib/storage'
import { TrackCard } from '@/components/TrackCard'
import { TrackArt } from '@/components/TrackArt'
import PublishModal from '@/components/PublishModal'
import DeleteTrackModal from '@/components/DeleteTrackModal'
import EditProfileModal from '@/components/EditProfileModal'
import { useProfile } from '@/hooks/useProfile'
import { cn, formatDuration } from '@/lib/utils'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { usePlayer } from '@/context/PlayerContext'
import { Navigation } from '@/components/Navigation'
import { Player } from '@/components/Player'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Play, Pause, Globe, Music, Wallet, Copy, Check, Pencil, Trash2 } from 'lucide-react'

const GRADIENTS = [
  'from-violet-600 to-blue-600',
  'from-orange-500 to-pink-600',
  'from-green-500 to-teal-600',
  'from-purple-600 to-indigo-700',
  'from-red-500 to-orange-600',
  'from-cyan-500 to-blue-600',
]

export default function ProfilePage() {
  const { address } = useParams<{ address: string }>()
  const { account } = useWallet()
  const myAddress = account?.address.toString() ?? null
  const [tracks, setTracks] = useState<Track[]>([])
  const [privateTracks, setPrivateTracks] = useState<PrivateTrack[]>([])
  const [loaded, setLoaded] = useState(false)
  const [publishTarget, setPublishTarget] = useState<PrivateTrack | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string; artist: string; isPublic: boolean } | null>(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [copied, setCopied] = useState(false)

  const isOwn = myAddress?.toLowerCase() === address?.toLowerCase()
  const { play, pause, resume, playing, currentTrack } = usePlayer()
  const { profile, refetch: refetchProfile } = useProfile(address)

  const avatarColor = GRADIENTS[parseInt(address?.slice(2, 4) ?? '0', 16) % GRADIENTS.length]

  useEffect(() => {
    const localById = new Map(getTracks().map((t) => [t.id, t]))
    fetch(`/api/feed?address=${encodeURIComponent(address)}`)
      .then((r) => r.json())
      .then(({ tracks: shelbyTracks }: { tracks: Track[] }) => {
        const merged = shelbyTracks.map((t) => ({
          ...t,
          plays: localById.get(t.id)?.plays ?? t.plays,
        }))
        setTracks(merged)
      })
      .catch(() => setTracks([]))
      .finally(() => setLoaded(true))
  }, [address])

  useEffect(() => {
    if (isOwn) {
      setPrivateTracks(
        getPrivateTracks().filter((t) => t.address.toLowerCase() === address.toLowerCase())
      )
    }
  }, [isOwn, address])

  const handlePublished = (id: string) => {
    removePrivateTrack(id)
    setPrivateTracks((prev) => prev.filter((t) => t.id !== id))
    setPublishTarget(null)
  }

  const handleDeleted = (id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id))
    setPrivateTracks((prev) => prev.filter((t) => t.id !== id))
    setDeleteTarget(null)
  }

  const handleProfileSaved = () => {
    refetchProfile()
    setTimeout(() => setEditingProfile(false), 1200)
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const displayName = profile?.displayName

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="pb-32 pt-16">
        {/* Header */}
        <section className="mx-auto max-w-4xl px-6 py-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {profile?.avatarDataUrl ? (
                <img
                  src={profile.avatarDataUrl}
                  alt={displayName ?? address}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div
                  className={cn(
                    'flex h-20 w-20 items-center justify-center rounded-full text-white text-2xl font-bold',
                    `bg-gradient-to-br ${avatarColor}`
                  )}
                >
                  {address?.slice(2, 4).toUpperCase()}
                </div>
              )}
              {isOwn && (
                <button
                  onClick={() => setEditingProfile(true)}
                  className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-foreground/80 transition-colors shadow"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold tracking-tight">
                  {displayName ?? (isOwn ? 'Your Profile' : `${address?.slice(0, 6)}...${address?.slice(-4)}`)}
                </h1>
                {isOwn && !displayName && (
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                  >
                    Set display name
                  </button>
                )}
              </div>
              <button
                onClick={copyAddress}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
              >
                <span className="font-mono text-xs">{address}</span>
                {copied ? (
                  <Check className="h-3 w-3 text-primary" />
                ) : (
                  <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>

              <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                <span>
                  <span className="font-semibold text-foreground">{tracks.length}</span> public
                </span>
                {isOwn && (
                  <span>
                    <span className="font-semibold text-foreground">{privateTracks.length}</span> private
                  </span>
                )}
                <span>
                  <span className="font-semibold text-foreground">
                    {tracks.reduce((s, t) => s + t.plays, 0).toLocaleString()}
                  </span> plays
                </span>
              </div>
            </div>

            {isOwn && (
              <div className="flex items-center gap-4 shrink-0">
                <button
                  onClick={() => setEditingProfile(true)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Profile
                </button>
                <Link
                  href="/upload"
                  className="text-sm font-medium underline text-muted-foreground hover:text-foreground transition-colors"
                >
                  Upload a track →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Tracks */}
        <section className="mx-auto max-w-4xl px-6">
          {isOwn ? (
            <Tabs defaultValue="public">
              <TabsList className="mb-8 bg-transparent p-0 h-auto border-b border-border rounded-none w-full justify-start gap-8">
                <TabsTrigger
                  value="public"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 pb-3 text-muted-foreground data-[state=active]:text-foreground"
                >
                  Public ({tracks.length})
                </TabsTrigger>
                <TabsTrigger
                  value="private"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 pb-3 text-muted-foreground data-[state=active]:text-foreground"
                >
                  Private ({privateTracks.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="public">
                <PublicSection
                  tracks={tracks}
                  loaded={loaded}
                  isOwn={isOwn}
                  onDelete={(t) => setDeleteTarget({ id: t.id, title: t.title, artist: t.artist, isPublic: true })}
                />
              </TabsContent>

              <TabsContent value="private">
                <PrivateSection
                  privateTracks={privateTracks}
                  currentTrack={currentTrack}
                  playing={playing}
                  play={play}
                  pause={pause}
                  resume={resume}
                  onPublish={setPublishTarget}
                  onDelete={(t) => setDeleteTarget({ id: t.id, title: t.title, artist: t.artist, isPublic: false })}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <>
              <div className="border-b border-border pb-4 mb-8">
                <h2 className="text-sm font-medium uppercase tracking-widest">Tracks</h2>
              </div>
              <PublicSection tracks={tracks} loaded={loaded} isOwn={false} onDelete={undefined} />
            </>
          )}
        </section>
      </main>

      {publishTarget && (
        <PublishModal
          track={publishTarget}
          onClose={() => setPublishTarget(null)}
          onPublished={handlePublished}
        />
      )}

      {deleteTarget && (
        <DeleteTrackModal
          track={deleteTarget}
          userAddress={myAddress ?? ''}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}

      {editingProfile && (
        <EditProfileModal
          current={profile}
          onClose={() => setEditingProfile(false)}
          onSaved={() => handleProfileSaved()}
        />
      )}

      <Player />
    </div>
  )
}

function PublicSection({
  tracks,
  loaded,
  isOwn,
  onDelete,
}: {
  tracks: Track[]
  loaded: boolean
  isOwn: boolean
  onDelete?: (track: Track) => void
}) {
  if (!loaded) {
    return (
      <div className="divide-y divide-border">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-[60px] animate-pulse bg-muted/30 rounded my-1" />
        ))}
      </div>
    )
  }
  if (tracks.length === 0) {
    return (
      <div className="py-16 text-center">
        <Music className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground max-w-sm mx-auto">
          {isOwn ? 'No public tracks yet. Upload a track and make it public.' : 'No public tracks yet.'}
        </p>
      </div>
    )
  }
  return (
    <div className="divide-y divide-border">
      {tracks.map((track) => (
        <TrackCard
          key={track.id}
          track={track}
          onDelete={isOwn && onDelete ? () => onDelete(track) : undefined}
        />
      ))}
    </div>
  )
}

function PrivateSection({
  privateTracks,
  currentTrack,
  playing,
  play,
  pause,
  resume,
  onPublish,
  onDelete,
}: {
  privateTracks: PrivateTrack[]
  currentTrack: Track | null
  playing: boolean
  play: (track: Track) => void
  pause: () => void
  resume: () => void
  onPublish: (track: PrivateTrack) => void
  onDelete: (track: PrivateTrack) => void
}) {
  if (privateTracks.length === 0) {
    return (
      <div className="py-16 text-center">
        <Wallet className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No private tracks. Uploaded tracks appear here first.</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {privateTracks.map((track) => {
        const asTrack: Track = {
          id: track.id, title: track.title, artist: track.artist, address: track.address,
          cid: track.cid, audioUrl: track.audioUrl, coverColor: track.coverColor,
          duration: track.duration, plays: 0, uploadedAt: track.uploadedAt, genre: track.genre,
        }
        const isThisTrack = currentTrack?.id === track.id
        const isThisPlaying = isThisTrack && playing

        return (
          <div key={track.id} className="group flex items-center gap-4 py-3">
            {/* Cover + play */}
            <div className="relative h-12 w-12 flex-shrink-0">
              <TrackArt
                trackId={track.id}
                isPlaying={isThisPlaying}
                className="h-12 w-12 transition-opacity group-hover:opacity-75"
              />
              <button
                onClick={() => {
                  if (isThisTrack) {
                    if (isThisPlaying) pause()
                    else resume()
                  } else {
                    play(asTrack)
                  }
                }}
                className={cn(
                  'absolute inset-0 m-auto flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background opacity-0 transition-opacity',
                  'group-hover:opacity-100',
                  isThisPlaying && 'opacity-100'
                )}
              >
                {isThisPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-0.5" />}
              </button>
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-primary">
                {track.title}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {track.artist}
                {track.genre && <span className="text-muted-foreground/60"> · {track.genre}</span>}
                <span className="text-muted-foreground/40"> · {formatDuration(track.duration)}</span>
              </p>
            </div>

            {/* Actions */}
            <div className="shrink-0 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => onPublish(track)}
              >
                <Globe className="h-3 w-3" />
                Make Public
              </button>
              <button
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
                onClick={() => onDelete(track)}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
