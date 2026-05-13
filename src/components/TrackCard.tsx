'use client'

import { Play, Pause } from 'lucide-react'
import { Track } from '@/lib/types'
import { usePlayer } from '@/context/PlayerContext'
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
}

export function TrackCard({ track, showArtist = true, rank }: TrackCardProps) {
  const { currentTrack, playing, play, pause, resume } = usePlayer()
  const isCurrentTrack = currentTrack?.id === track.id
  const isCurrentlyPlaying = isCurrentTrack && playing

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
        <div
          className={cn(
            'h-12 w-12 rounded transition-opacity group-hover:opacity-75',
            track.coverColor
              ? `bg-gradient-to-br ${track.coverColor}`
              : 'bg-gradient-to-br from-primary/60 to-primary/20'
          )}
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
            {track.artist || shortAddress(track.address)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-6 text-xs text-muted-foreground font-mono">
        <span className="hidden sm:inline">{formatPlays(track.plays)} plays</span>
        <span>{formatDuration(track.duration)}</span>
      </div>
    </div>
  )
}

export default TrackCard
