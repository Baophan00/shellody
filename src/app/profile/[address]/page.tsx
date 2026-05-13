'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Track, PrivateTrack } from '@/lib/types'
import { getTracks, getPrivateTracks, removePrivateTrack } from '@/lib/storage'
import { TrackCard } from '@/components/TrackCard'
import PublishModal from '@/components/PublishModal'
import { cn, shortAddress, formatDuration } from '@/lib/utils'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { usePlayer } from '@/context/PlayerContext'
import { Navigation } from '@/components/Navigation'
import { Player } from '@/components/Player'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Play, Pause, Upload, Globe, Lock, Music } from 'lucide-react'

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

  const isOwn = myAddress?.toLowerCase() === address?.toLowerCase()
  const { play, pause, resume, playing, currentTrack } = usePlayer()

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

  const totalPlays = tracks.reduce((sum, t) => sum + t.plays, 0)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="mx-auto max-w-4xl px-4 py-10 pb-32">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10">
          <div
            className={cn(
              'w-24 h-24 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-xl',
              `bg-gradient-to-br ${avatarColor}`
            )}
          >
            <span className="text-white text-3xl font-bold">
              {address?.slice(2, 4).toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">
                {isOwn ? 'Your Profile' : 'Artist Profile'}
              </h1>
              {isOwn && (
                <span className="text-xs bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full">
                  You
                </span>
              )}
            </div>
            <p className="text-muted-foreground font-mono text-sm mt-1 break-all">{address}</p>

            <div className="flex items-center gap-6 mt-3">
              <div>
                <span className="text-foreground font-semibold text-lg">{tracks.length}</span>
                <span className="text-muted-foreground text-sm ml-1.5">public</span>
              </div>
              {isOwn && privateTracks.length > 0 && (
                <div>
                  <span className="text-foreground font-semibold text-lg">{privateTracks.length}</span>
                  <span className="text-muted-foreground text-sm ml-1.5">private</span>
                </div>
              )}
              <div>
                <span className="text-foreground font-semibold text-lg">{totalPlays.toLocaleString()}</span>
                <span className="text-muted-foreground text-sm ml-1.5">plays</span>
              </div>
            </div>
          </div>

          {isOwn && (
            <Link href="/upload">
              <Button className="gap-2 shrink-0">
                <Upload className="h-4 w-4" />
                Upload Track
              </Button>
            </Link>
          )}
        </div>

        {/* Tabs */}
        {isOwn ? (
          <Tabs defaultValue="public">
            <TabsList className="mb-6">
              <TabsTrigger value="public" className="gap-2">
                <Globe className="h-4 w-4" />
                Public ({tracks.length})
              </TabsTrigger>
              <TabsTrigger value="private" className="gap-2">
                <Lock className="h-4 w-4" />
                Private ({privateTracks.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="public">
              <PublicTracksSection tracks={tracks} loaded={loaded} isOwn={isOwn} />
            </TabsContent>

            <TabsContent value="private">
              <PrivateTracksSection
                privateTracks={privateTracks}
                currentTrack={currentTrack}
                playing={playing}
                play={play}
                pause={pause}
                resume={resume}
                onPublish={setPublishTarget}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <PublicTracksSection tracks={tracks} loaded={loaded} isOwn={isOwn} />
        )}

        {/* Wallet card */}
        <Card className="mt-10 bg-card/50 border-border/50">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Wallet Address</p>
            <p className="text-foreground font-mono text-sm break-all">{address}</p>
            <p className="text-muted-foreground text-xs mt-1">{shortAddress(address)}</p>
          </CardContent>
        </Card>
      </main>

      {publishTarget && (
        <PublishModal
          track={publishTarget}
          onClose={() => setPublishTarget(null)}
          onPublished={handlePublished}
        />
      )}

      <Player />
    </div>
  )
}

function PublicTracksSection({
  tracks,
  loaded,
  isOwn,
}: {
  tracks: Track[]
  loaded: boolean
  isOwn: boolean
}) {
  if (!loaded) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-[72px] rounded-xl bg-card/50 animate-pulse" />
        ))}
      </div>
    )
  }
  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-2xl">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <Music className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No public tracks yet</h3>
        {isOwn && (
          <p className="text-muted-foreground text-sm">
            Upload a track and click <span className="text-primary">Make Public</span> to share it.
          </p>
        )}
      </div>
    )
  }
  return (
    <div className="space-y-2">
      {tracks.map((track) => (
        <TrackCard key={track.id} track={track} layout="row" />
      ))}
    </div>
  )
}

function PrivateTracksSection({
  privateTracks,
  currentTrack,
  playing,
  play,
  pause,
  resume,
  onPublish,
}: {
  privateTracks: PrivateTrack[]
  currentTrack: Track | null
  playing: boolean
  play: (track: Track) => void
  pause: () => void
  resume: () => void
  onPublish: (track: PrivateTrack) => void
}) {
  if (privateTracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-2xl">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No private tracks</h3>
        <p className="text-muted-foreground text-sm">Tracks you upload will appear here first.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {privateTracks.map((track) => {
        const asTrack: Track = {
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
        }
        const isThisTrack = currentTrack?.id === track.id
        const isThisPlaying = isThisTrack && playing

        return (
          <div
            key={track.id}
            className={cn(
              'flex items-center gap-3 rounded-xl border border-border bg-card/50 px-4 py-3 transition-colors',
              'hover:bg-card',
              isThisTrack && 'border-primary/30 bg-card'
            )}
          >
            {/* Cover + play */}
            <div className="relative flex-shrink-0">
              <div
                className={cn(
                  'w-12 h-12 rounded-lg',
                  `bg-gradient-to-br ${track.coverColor}`
                )}
              />
              <Button
                size="icon"
                className="absolute inset-0 m-auto h-8 w-8 rounded-full opacity-0 hover:opacity-100 transition-opacity"
                onClick={() => {
                  if (isThisTrack) {
                    if (isThisPlaying) pause()
                    else resume()
                  } else {
                    play(asTrack)
                  }
                }}
              >
                {isThisPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 translate-x-0.5" />
                )}
              </Button>
            </div>

            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-medium truncate', isThisTrack && 'text-primary')}>
                {track.title}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {track.artist}
                {track.genre && <span className="text-muted-foreground/60"> · {track.genre}</span>}
                <span className="text-muted-foreground/40"> · {formatDuration(track.duration)}</span>
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => onPublish(track)}
              className="shrink-0 gap-1.5 text-xs"
            >
              <Globe className="h-3.5 w-3.5" />
              Make Public
            </Button>
          </div>
        )
      })}
    </div>
  )
}
