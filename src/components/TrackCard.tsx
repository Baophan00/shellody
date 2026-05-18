'use client'

import Link from 'next/link'
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
        'group flex items-center gap-4 py-3 px-2 transition-colors border-b border-[#111111] last:border-b-0',
        'hover:bg-[#F5F5F5]',
        isCurrentTrack && 'bg-[#F5F5F5]'
      )}
    >
      {rank !== undefined && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
          <span
            className={cn(
              'font-serif text-2xl font-black tabular-nums leading-none',
              rank === 1 && 'text-[#CC0000]',
              rank > 1 && 'text-[#111111]'
            )}
          >
            {rank}
          </span>
        </div>
      )}

      <Link href={`/track/${track.id}`} className="relative flex-shrink-0">
        <TrackArt
          trackId={track.id}
          isPlaying={isCurrentlyPlaying}
          className="h-12 w-12 border border-[#111111] transition-opacity group-hover:opacity-75"
        />
        <button
          onClick={(e) => { e.preventDefault(); handlePlay() }}
          className={cn(
            'absolute inset-0 m-auto flex h-8 w-8 items-center justify-center border border-[#111111] bg-[#111111] text-[#F9F9F7] opacity-0 transition-all duration-200',
            'group-hover:opacity-100 group-hover:shadow-[4px_4px_0px_0px_#111111] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px]',
            isCurrentlyPlaying && 'opacity-100'
          )}
        >
          {isCurrentlyPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 translate-x-0.5" />
          )}
        </button>
      </Link>

      <div className="min-w-0 flex-1">
        <Link href={`/track/${track.id}`} className="block">
          <p className={cn('truncate font-sans text-sm font-semibold uppercase tracking-wider hover:underline decoration-2 decoration-[#CC0000]', isCurrentTrack && 'text-[#CC0000]')}>
            {track.title}
          </p>
        </Link>
        {showArtist && (
          <p className="truncate font-mono text-[10px] uppercase tracking-widest text-[#737373]">
            {artistLabel}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-[#737373]">
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
            className="h-7 w-7 flex items-center justify-center border border-[#111111] text-[#737373] hover:text-[#111111] hover:bg-[#E5E5E0] transition-all duration-200"
            aria-label="Download track"
          >
            <Download className="h-3 w-3" />
          </a>
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="h-7 w-7 flex items-center justify-center border border-[#111111] text-[#737373] hover:text-[#CC0000] hover:border-[#CC0000] transition-all duration-200"
              aria-label="Delete track"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default TrackCard
