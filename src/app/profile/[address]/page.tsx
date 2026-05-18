'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Track, PrivateTrack } from '@/lib/types'
import { getTracks, getPrivateTracks, removePrivateTrack, getBookmarks, removeBookmark } from '@/lib/storage'
import type { Bookmark } from '@/lib/storage'
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
import { Play, Pause, Globe, Music, Wallet, Copy, Check, Pencil, Trash2, Heart, HeartOff } from 'lucide-react'

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
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loaded, setLoaded] = useState(false)
  const [publishTarget, setPublishTarget] = useState<PrivateTrack | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string; artist: string; isPublic: boolean; blobName?: string } | null>(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [copied, setCopied] = useState(false)

  const isOwn = myAddress?.toLowerCase() === address?.toLowerCase()
  const { play, pause, resume, playing, currentTrack, setQueue } = usePlayer()
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
        setQueue(merged)
      })
      .catch(() => setTracks([]))
      .finally(() => setLoaded(true))
  }, [address, setQueue])

  useEffect(() => {
    if (isOwn) {
      setPrivateTracks(
        getPrivateTracks().filter((t) => t.address.toLowerCase() === address.toLowerCase())
      )
      setBookmarks(getBookmarks())
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
    <div className="min-h-screen bg-[#F9F9F7]">
      <Navigation />

      <main className="pb-32 pt-24">
        {/* Header */}
        <section className="mx-auto max-w-screen-xl px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 border-b-4 border-[#111111] pb-8 lg:border-b-0 lg:pb-0 lg:border-r lg:border-[#111111] lg:pr-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {profile?.avatarDataUrl ? (
                    <img
                      src={profile.avatarDataUrl}
                      alt={displayName ?? address}
                      className="h-20 w-20 object-cover border-2 border-[#111111]"
                    />
                  ) : (
                    <div
                      className={cn(
                        'flex h-20 w-20 items-center justify-center text-white text-2xl font-bold border-2 border-[#111111]',
                        `bg-gradient-to-br ${avatarColor}`
                      )}
                    >
                      {address?.slice(2, 4).toUpperCase()}
                    </div>
                  )}
                  {isOwn && (
                    <button
                      onClick={() => setEditingProfile(true)}
                      className="absolute -bottom-1 -right-1 h-7 w-7 border border-[#111111] bg-[#111111] text-[#F9F9F7] flex items-center justify-center hover:bg-[#F9F9F7] hover:text-[#111111] transition-all duration-200"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="font-serif text-4xl lg:text-5xl font-black tracking-tighter">
                      {displayName ?? (isOwn ? 'Your Profile' : `${address?.slice(0, 6)}...${address?.slice(-4)}`)}
                    </h1>
                    {isOwn && !displayName && (
                      <button
                        onClick={() => setEditingProfile(true)}
                        className="font-sans text-[10px] uppercase tracking-widest underline underline-offset-4 decoration-2 decoration-[#CC0000] hover:text-[#CC0000] transition-colors"
                      >
                        Set display name
                      </button>
                    )}
                  </div>
                  <button
                    onClick={copyAddress}
                    className="flex items-center gap-2 font-mono text-xs text-[#737373] hover:text-[#111111] transition-colors group"
                  >
                    <span className="text-[10px]">{address}</span>
                    {copied ? (
                      <Check className="h-3 w-3 text-[#111111]" />
                    ) : (
                      <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>

                  <div className="flex items-center gap-6 mt-4 font-mono text-[10px] uppercase tracking-widest text-[#737373]">
                    <span className="border-r border-[#111111] pr-6">
                      <span className="font-bold text-[#111111]">{tracks.length}</span> public
                    </span>
                    {isOwn && (
                      <span className="border-r border-[#111111] pr-6">
                        <span className="font-bold text-[#111111]">{privateTracks.length}</span> private
                      </span>
                    )}
                    <span>
                      <span className="font-bold text-[#111111]">
                        {tracks.reduce((s, t) => s + t.plays, 0).toLocaleString()}
                      </span> plays
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4">
              {isOwn && (
                <>
                  <div className="border border-[#111111] p-4">
                    <button
                      onClick={() => setEditingProfile(true)}
                      className="flex items-center gap-2 font-sans text-xs uppercase tracking-widest font-medium hover:text-[#CC0000] transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit Profile
                    </button>
                  </div>
                  <Link
                    href="/upload"
                    className="block border border-[#111111] p-4 font-sans text-xs uppercase tracking-widest font-medium hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200"
                  >
                    Upload a track →
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Tracks */}
        <section className="mx-auto max-w-screen-xl px-4">
          {isOwn ? (
            <Tabs defaultValue="public">
              <TabsList className="mb-8 bg-transparent p-0 h-auto border-b border-[#111111] rounded-none w-full justify-start gap-8">
                <TabsTrigger
                  value="public"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#111111] data-[state=active]:bg-transparent px-0 pb-3 text-[#737373] data-[state=active]:text-[#111111] font-sans text-xs font-medium uppercase tracking-widest"
                >
                  Public ({tracks.length})
                </TabsTrigger>
                <TabsTrigger
                  value="private"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#111111] data-[state=active]:bg-transparent px-0 pb-3 text-[#737373] data-[state=active]:text-[#111111] font-sans text-xs font-medium uppercase tracking-widest"
                >
                  Private ({privateTracks.length})
                </TabsTrigger>
                <TabsTrigger
                  value="bookmarked"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#CC0000] data-[state=active]:bg-transparent px-0 pb-3 text-[#737373] data-[state=active]:text-[#CC0000] font-sans text-xs font-medium uppercase tracking-widest"
                >
                  <Heart className="h-3 w-3 mr-1" />
                  Bookmarked ({bookmarks.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="public">
                <PublicSection
                  tracks={tracks}
                  loaded={loaded}
                  isOwn={isOwn}
                  onDelete={(t) => setDeleteTarget({ id: t.id, title: t.title, artist: t.artist, isPublic: true, blobName: t.blobName })}
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
                  onDelete={(t) => setDeleteTarget({ id: t.id, title: t.title, artist: t.artist, isPublic: false, blobName: t.blobName })}
                />
              </TabsContent>

              <TabsContent value="bookmarked">
                <BookmarkedSection
                  bookmarks={bookmarks}
                  currentTrack={currentTrack}
                  playing={playing}
                  play={play}
                  pause={pause}
                  resume={resume}
                  setQueue={setQueue}
                  onRemove={(id) => {
                    removeBookmark(id)
                    setBookmarks(getBookmarks())
                  }}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <>
              <div className="border-b-4 border-[#111111] pb-4 mb-8">
                <h2 className="font-sans text-xs font-medium uppercase tracking-widest">Tracks</h2>
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
      <div className="divide-y divide-[#111111]">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-[60px] animate-pulse bg-[#E5E5E0]/50 my-1" />
        ))}
      </div>
    )
  }
  if (tracks.length === 0) {
    return (
      <div className="py-16 text-center border border-[#111111] p-8">
        <Music className="h-8 w-8 text-[#737373] mx-auto mb-4" />
        <p className="font-mono text-xs uppercase tracking-widest text-[#737373] max-w-sm mx-auto">
          {isOwn ? 'No public tracks yet. Upload a track and make it public.' : 'No public tracks yet.'}
        </p>
      </div>
    )
  }
  return (
    <div className="divide-y divide-[#111111] border border-[#111111]">
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

function BookmarkedSection({
  bookmarks,
  currentTrack,
  playing,
  play,
  pause,
  resume,
  setQueue,
  onRemove,
}: {
  bookmarks: Bookmark[]
  currentTrack: Track | null
  playing: boolean
  play: (track: Track) => void
  pause: () => void
  resume: () => void
  setQueue: (tracks: Track[]) => void
  onRemove: (id: string) => void
}) {
  if (bookmarks.length === 0) {
    return (
      <div className="py-16 text-center border border-[#111111] p-8">
        <Heart className="h-8 w-8 text-[#737373] mx-auto mb-4" />
        <p className="font-mono text-xs uppercase tracking-widest text-[#737373]">No bookmarked tracks. Discover music and bookmark your favorites.</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-[#111111] border border-[#111111]">
      {bookmarks.map((b) => {
        const asTrack: Track = {
          id: b.id, title: b.title, artist: b.artist, address: '',
          cid: '', audioUrl: b.audioUrl, coverColor: '',
          duration: b.duration, plays: 0, uploadedAt: b.savedAt, genre: b.genre,
        }
        const isThisTrack = currentTrack?.id === b.id
        const isThisPlaying = isThisTrack && playing

        return (
          <div key={b.id} className="group flex items-center gap-4 py-3 px-2 hover:bg-[#F5F5F5] transition-colors">
            {/* Cover + play */}
            <div className="relative h-12 w-12 flex-shrink-0">
              <TrackArt
                trackId={b.id}
                isPlaying={isThisPlaying}
                className="h-12 w-12 border border-[#111111] transition-opacity group-hover:opacity-75"
              />
              <button
                onClick={() => {
                  if (isThisTrack) {
                    if (isThisPlaying) pause()
                    else resume()
                  } else {
                    setQueue([asTrack])
                    play(asTrack)
                  }
                }}
                className={cn(
                  'absolute inset-0 m-auto flex h-8 w-8 items-center justify-center border border-[#111111] bg-[#111111] text-[#F9F9F7] opacity-0 transition-all duration-200',
                  'group-hover:opacity-100 group-hover:shadow-[4px_4px_0px_0px_#111111] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px]',
                  isThisPlaying && 'opacity-100'
                )}
              >
                {isThisPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-0.5" />}
              </button>
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className={cn('truncate font-sans text-sm font-semibold uppercase tracking-wider', isThisTrack && 'text-[#CC0000]')}>
                {b.title}
              </p>
              <p className="truncate font-mono text-[10px] uppercase tracking-widest text-[#737373]">
                {b.artist}
                {b.genre && <span className="text-[#A3A3A3]"> · {b.genre}</span>}
                <span className="text-[#A3A3A3]"> · {formatDuration(b.duration)}</span>
              </p>
            </div>

            {/* Remove bookmark */}
            <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onRemove(b.id)}
                className="flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-widest text-[#737373] hover:text-[#CC0000] transition-colors border border-[#111111] h-7 px-2 hover:border-[#CC0000]"
                title="Remove bookmark"
              >
                <HeartOff className="h-3 w-3" />
              </button>
            </div>
          </div>
        )
      })}
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
      <div className="py-16 text-center border border-[#111111] p-8">
        <Wallet className="h-8 w-8 text-[#737373] mx-auto mb-4" />
        <p className="font-mono text-xs uppercase tracking-widest text-[#737373]">No private tracks. Uploaded tracks appear here first.</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-[#111111] border border-[#111111]">
      {privateTracks.map((track) => {
        const asTrack: Track = {
          id: track.id, title: track.title, artist: track.artist, address: track.address,
          cid: track.cid, audioUrl: track.audioUrl, coverColor: track.coverColor,
          duration: track.duration, plays: 0, uploadedAt: track.uploadedAt, genre: track.genre,
        }
        const isThisTrack = currentTrack?.id === track.id
        const isThisPlaying = isThisTrack && playing

        return (
          <div key={track.id} className="group flex items-center gap-4 py-3 px-2 hover:bg-[#F5F5F5] transition-colors">
            {/* Cover + play */}
            <div className="relative h-12 w-12 flex-shrink-0">
              <TrackArt
                trackId={track.id}
                isPlaying={isThisPlaying}
                className="h-12 w-12 border border-[#111111] transition-opacity group-hover:opacity-75"
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
                  'absolute inset-0 m-auto flex h-8 w-8 items-center justify-center border border-[#111111] bg-[#111111] text-[#F9F9F7] opacity-0 transition-all duration-200',
                  'group-hover:opacity-100 group-hover:shadow-[4px_4px_0px_0px_#111111] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px]',
                  isThisPlaying && 'opacity-100'
                )}
              >
                {isThisPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-0.5" />}
              </button>
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="truncate font-sans text-sm font-semibold uppercase tracking-wider text-[#111111]">
                {track.title}
              </p>
              <p className="truncate font-mono text-[10px] uppercase tracking-widest text-[#737373]">
                {track.artist}
                {track.genre && <span className="text-[#A3A3A3]"> · {track.genre}</span>}
                <span className="text-[#A3A3A3]"> · {formatDuration(track.duration)}</span>
              </p>
            </div>

            {/* Actions */}
            <div className="shrink-0 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-widest text-[#737373] hover:text-[#111111] transition-colors border border-[#111111] h-7 px-2"
                onClick={() => onPublish(track)}
              >
                <Globe className="h-3 w-3" />
                Make Public
              </button>
              <button
                className="flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-widest text-[#737373] hover:text-[#CC0000] transition-colors border border-[#111111] h-7 px-2 hover:border-[#CC0000]"
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
