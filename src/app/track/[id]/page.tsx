'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Track } from '@/lib/types'
import { getTrackById } from '@/lib/storage'
import { usePlayer } from '@/context/PlayerContext'
import { Navigation } from '@/components/Navigation'
import { Player } from '@/components/Player'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn, formatDuration, shortAddress } from '@/lib/utils'
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

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="mx-auto max-w-md px-4 py-10 pb-32">
        {!loaded ? (
          <div>
            <div className="w-full aspect-square max-w-sm mx-auto rounded-3xl bg-card/50 animate-pulse mb-8" />
            <div className="h-8 bg-card/50 rounded animate-pulse mb-3" />
            <div className="h-5 bg-card/50 rounded animate-pulse w-1/2 mx-auto" />
          </div>
        ) : !track ? (
          <div className="text-center py-24">
            <p className="text-lg text-muted-foreground mb-4">Track not found.</p>
            <Link href="/" className="text-primary hover:text-primary/80 transition-colors">
              ← Back to feed
            </Link>
          </div>
        ) : (
          <>
            {/* Cover art */}
            <div
              className={cn(
                'relative w-full aspect-square max-w-sm mx-auto rounded-3xl mb-8 flex items-center justify-center shadow-2xl shadow-primary/20',
                track.coverColor
                  ? `bg-gradient-to-br ${track.coverColor}`
                  : 'bg-gradient-to-br from-primary/60 to-accent/60'
              )}
            >
              {isPlaying && (
                <div className="absolute inset-0 rounded-3xl ring-2 ring-white/20 animate-pulse" />
              )}
              <Button
                onClick={handlePlayPause}
                size="icon"
                className="h-20 w-20 rounded-full bg-background/20 hover:bg-background/40 backdrop-blur-sm"
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8 translate-x-0.5" />
                )}
              </Button>
            </div>

            {/* Title + artist */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
                {track.title}
              </h1>
              <Link
                href={`/profile/${track.address}`}
                className="text-primary hover:text-primary/80 text-lg transition-colors"
              >
                {track.artist || shortAddress(track.address)}
              </Link>
              {track.genre && (
                <div className="mt-3">
                  <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {track.genre}
                  </span>
                </div>
              )}
            </div>

            {/* Stats */}
            <Card className="bg-card/50 border-border/50 mb-4 overflow-hidden">
              <div className="grid grid-cols-3 divide-x divide-border">
                <div className="text-center py-5 px-3">
                  <p className="text-2xl font-bold text-foreground">{track.plays.toLocaleString()}</p>
                  <p className="text-muted-foreground text-xs mt-1">Plays</p>
                </div>
                <div className="text-center py-5 px-3">
                  <p className="text-2xl font-bold text-foreground">{formatDuration(track.duration)}</p>
                  <p className="text-muted-foreground text-xs mt-1">Duration</p>
                </div>
                <div className="text-center py-5 px-3">
                  <p className="text-lg font-bold text-foreground truncate">{track.genre || '—'}</p>
                  <p className="text-muted-foreground text-xs mt-1">Genre</p>
                </div>
              </div>
            </Card>

            {/* On-chain info */}
            <Card className="bg-card/50 border-border/50 mb-4">
              <CardContent className="p-5 space-y-4">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Shelby CID</p>
                  <p className="text-foreground text-xs font-mono break-all leading-relaxed">{track.cid}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Uploader</p>
                  <Link
                    href={`/profile/${track.address}`}
                    className="text-primary text-xs font-mono hover:text-primary/80 transition-colors break-all"
                  >
                    {track.address}
                  </Link>
                </div>
                {track.txHash && (
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Transaction</p>
                    <p className="text-foreground text-xs font-mono break-all">{track.txHash}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Uploaded</p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(track.uploadedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Share */}
            <Button variant="outline" className="w-full gap-2" onClick={copyLink}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Link copied!' : 'Copy Share Link'}
            </Button>
          </>
        )}
      </main>

      <Player />
    </div>
  )
}
