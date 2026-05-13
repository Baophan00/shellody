'use client'

import { Play, Pause, Trash2, Download } from 'lucide-react'
import { Track } from '@/lib/types'
import { usePlayer } from '@/context/PlayerContext'
import { TrackArt } from '@/components/TrackArt'
import { useProfile } from '@/hooks/useProfile'
import { cn, formatDuration, shortAddress } from '@/lib/utils'

function formatPlays(plays: number) {
  if (plays >= 1_000_000) return `${(plays / 1_000_000).toFixed(1)}M`
  if (plays >= 1_000) return `${(plays / 1_000).toFixed(1)}K`
  return plays.toString()
}

interface TrackCardProps {
  track: Track
  showArtist?: boolean
  rank?: number
  onDelete?: () => void
}

export function TrackCard({ track, showArtist = true, rank, onDelete }: TrackCardProps) {
  const { currentTrack, playing, plays, play, pause, resume } = usePlayer()
  const { profile } = useProfile(track.address)
  const isCurrentTrack = currentTrack?.id === track.id
  const isCurrentlyPlaying = isCurrentTrack && playing
  const artistLabel = profile?.displayName || track.artist || shortAddress(track.address)
  const displayPlays = plays[track.id] ?? track.plays

  const handlePlay = () => {
    if (isCurrentTrack) {
      if (playing) pause()
      else resume()
    } else {
      play(track)
    }
  }

  return (
    <div
      className={cn(
        'group relative flex items-center gap-4 py-3 transition-colors',
        'hover:bg-muted/50',
        isCurrentTrack && 'bg-muted/50'
      )}
    >
      {rank !== undefined && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
          <span
            className={cn(
              'text-2xl font-bold tabular-nums',
              rank === 1 && 'text-primary',
              rank === 2 && 'text-foreground',
              rank === 3 && 'text-foreground',
              rank > 3 && 'text-muted-foreground'
            )}
          >
            {rank}
          </span>
        </div>
      )}

      <div className="relative flex-shrink-0">
        <TrackArt
          trackId={track.id}
          isPlaying={isCurrentlyPlaying}
          className="h-12 w-12 transition-opacity group-hover:opacity-75"
        />
        <button
          onClick={handlePlay}
          className={cn(
            'absolute inset-0 m-auto flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background opacity-0 transition-opacity',
            'group-hover:opacity-100',
            isCurrentlyPlaying && 'opacity-100'
          )}
        >
          {isCurrentlyPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 translate-x-0.5" />
          )}
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm font-medium', isCurrentTrack && 'text-primary')}>
          {track.title}
        </p>
        {showArtist && (
          <p className="truncate text-xs text-muted-foreground">
            {artistLabel}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
        <span className="hidden sm:inline">{formatPlays(displayPlays)} plays</span>
        <span>{formatDuration(track.duration)}</span>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <a
            href={(() => {
              const ext = track.audioUrl.split('.').pop()?.split('?')[0] ?? 'mp3'
              const filename = encodeURIComponent(`${track.title} - ${track.artist}.${ext}`)
              return `${track.audioUrl}?dl=${filename}`
            })()}
            download
            onClick={(e) => e.stopPropagation()}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Download track"
          >
            <Download className="h-3.5 w-3.5" />
          </a>
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Delete track"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default TrackCard
