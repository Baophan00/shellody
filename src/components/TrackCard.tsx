'use client'

import { Play, Pause } from 'lucide-react'
import { Track } from '@/lib/types'
import { usePlayer } from '@/context/PlayerContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDuration, shortAddress } from '@/lib/utils'

interface TrackCardProps {
  track: Track
  showArtist?: boolean
  rank?: number
  layout?: 'card' | 'row'
}

export function TrackCard({ track, showArtist = true, rank, layout = 'card' }: TrackCardProps) {
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

  if (layout === 'row') {
    return (
      <div
        className={cn(
          'group relative flex items-center gap-4 rounded-xl p-3 transition-colors',
          'hover:bg-secondary/50',
          isCurrentTrack && 'bg-secondary'
        )}
      >
        {rank && (
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
            <span
              className={cn(
                'text-2xl font-bold',
                rank === 1 && 'text-yellow-500',
                rank === 2 && 'text-zinc-400',
                rank === 3 && 'text-amber-600',
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
              'h-14 w-14 rounded-lg transition-opacity group-hover:opacity-75',
              track.coverColor
                ? `bg-gradient-to-br ${track.coverColor}`
                : 'bg-gradient-to-br from-primary/60 to-accent/60'
            )}
          />
          <Button
            onClick={handlePlay}
            size="icon"
            className={cn(
              'absolute inset-0 m-auto h-10 w-10 rounded-full opacity-0 transition-opacity',
              'group-hover:opacity-100',
              isCurrentlyPlaying && 'opacity-100'
            )}
          >
            {isCurrentlyPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 translate-x-0.5" />
            )}
          </Button>
        </div>

        <div className="min-w-0 flex-1">
          <p className={cn('truncate font-medium', isCurrentTrack && 'text-primary')}>
            {track.title}
          </p>
          {showArtist && (
            <p className="truncate text-sm text-muted-foreground">
              {track.artist || shortAddress(track.address)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="hidden sm:inline">{track.plays.toLocaleString()} plays</span>
          <span>{formatDuration(track.duration)}</span>
        </div>
      </div>
    )
  }

  // Card layout (grid)
  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-xl border border-border bg-card/50 overflow-hidden transition-all duration-200',
        'hover:bg-card hover:shadow-lg hover:shadow-primary/5 hover:border-border',
        isCurrentTrack && 'ring-1 ring-primary/50 bg-card'
      )}
    >
      {/* Cover art */}
      <div className="relative aspect-square w-full overflow-hidden">
        <div
          className={cn(
            'absolute inset-0',
            track.coverColor
              ? `bg-gradient-to-br ${track.coverColor}`
              : 'bg-gradient-to-br from-primary/60 to-accent/60'
          )}
        />
        <Button
          onClick={handlePlay}
          size="icon"
          className={cn(
            'absolute bottom-3 right-3 h-12 w-12 rounded-full shadow-lg opacity-0 transition-opacity',
            'group-hover:opacity-100',
            isCurrentlyPlaying && 'opacity-100'
          )}
        >
          {isCurrentlyPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 translate-x-0.5" />
          )}
        </Button>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className={cn('truncate font-semibold text-foreground', isCurrentTrack && 'text-primary')}>
          {track.title}
        </p>
        {showArtist && (
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {track.artist || shortAddress(track.address)}
          </p>
        )}
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{track.plays.toLocaleString()} plays</span>
          <span>{formatDuration(track.duration)}</span>
        </div>
      </div>
    </div>
  )
}

// Default export for backward compat
export default TrackCard
