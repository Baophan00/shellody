'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Track } from '@/lib/types'
import { getTrackById } from '@/lib/storage'
import { usePlayer } from '@/context/PlayerContext'
import { Navigation } from '@/components/Navigation'
import { Player } from '@/components/Player'
import { TrackArt } from '@/components/TrackArt'
import { formatDuration, shortAddress } from '@/lib/utils'
import { Play, Pause, Copy, Check } from 'lucide-react'

export default function TrackPage() {
  const { id } = useParams<{ id: string }>()
  const [track, setTrack] = useState<Track | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [copied, setCopied] = useState(false)
  const { currentTrack, playing, play, pause, resume } = usePlayer()

  useEffect(() => {
    setTrack(getTrackById(id))
    setLoaded(true)
  }, [id])

  const isActive = currentTrack?.id === track?.id
  const isPlaying = isActive && playing

  const handlePlayPause = () => {
    if (!track) return
    if (isActive) {
      if (isPlaying) pause()
      else resume()
    } else {
      play(track)
    }
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="mx-auto max-w-md px-6 pt-32 pb-32">
        {!loaded ? (
          <div>
            <div className="w-full aspect-square rounded-lg bg-muted animate-pulse mb-8" />
            <div className="h-8 bg-muted rounded animate-pulse mb-3" />
            <div className="h-5 bg-muted rounded animate-pulse w-1/2" />
          </div>
        ) : !track ? (
          <div className="text-center py-24">
            <p className="text-lg text-muted-foreground mb-4">Track not found.</p>
            <Link href="/" className="text-sm underline text-muted-foreground hover:text-foreground">
              ← Back to feed
            </Link>
          </div>
        ) : (
          <>
            {/* Cover art */}
            <div className="relative w-full aspect-square mb-8">
              <TrackArt trackId={track.id} isPlaying={isPlaying} className="w-full h-full rounded-lg" />
              {isPlaying && (
                <div className="absolute inset-0 rounded-lg ring-2 ring-foreground/10 animate-pulse pointer-events-none" />
              )}
              <button
                onClick={handlePlayPause}
                className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
              >
                {isPlaying ? (
                  <Pause className="h-7 w-7 text-white" />
                ) : (
                  <Play className="h-7 w-7 text-white translate-x-0.5" />
                )}
              </button>
            </div>

            {/* Title + artist */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight mb-1">{track.title}</h1>
              <Link
                href={`/profile/${track.address}`}
                className="text-primary hover:text-primary/80 transition-colors"
              >
                {track.artist || shortAddress(track.address)}
              </Link>
              {track.genre && (
                <span className="ml-3 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {track.genre}
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 border border-border rounded-lg overflow-hidden mb-4">
              <div className="text-center py-5 px-3 border-r border-border">
                <p className="text-2xl font-bold tabular-nums">{track.plays.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Plays</p>
              </div>
              <div className="text-center py-5 px-3 border-r border-border">
                <p className="text-2xl font-bold font-mono">{formatDuration(track.duration)}</p>
                <p className="text-xs text-muted-foreground mt-1">Duration</p>
              </div>
              <div className="text-center py-5 px-3">
                <p className="text-lg font-bold truncate">{track.genre || '—'}</p>
                <p className="text-xs text-muted-foreground mt-1">Genre</p>
              </div>
            </div>

            {/* On-chain info */}
            <div className="border border-border rounded-lg p-5 mb-4 space-y-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Shelby CID</p>
                <p className="font-mono text-xs break-all leading-relaxed">{track.cid}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Uploader</p>
                <Link
                  href={`/profile/${track.address}`}
                  className="text-primary text-xs font-mono hover:text-primary/80 break-all"
                >
                  {track.address}
                </Link>
              </div>
              {track.txHash && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Transaction</p>
                  <p className="font-mono text-xs break-all">{track.txHash}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Uploaded</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(track.uploadedAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Share */}
            <button
              onClick={copyLink}
              className="w-full flex items-center justify-center gap-2 border border-border rounded-lg py-3 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Link copied!' : 'Copy share link'}
            </button>
          </>
        )}
      </main>

      <Player />
    </div>
  )
}
