'use client'

import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat } from 'lucide-react'
import { usePlayer } from '@/context/PlayerContext'
import { Slider } from '@/components/ui/slider'
import { WaveformVisualizer } from '@/components/WaveformVisualizer'
import { TrackArt } from '@/components/TrackArt'
import { cn } from '@/lib/utils'

function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function Player() {
  const {
    currentTrack, playing, currentTime, duration,
    canSkipPrev, canSkipNext,
    shuffle, repeat, nextTrack,
    volume, muted,
    pause, resume, seek,
    playNext, playPrev,
    toggleShuffle, toggleRepeat,
    setVolume, toggleMute,
  } = usePlayer()

  if (!currentTrack) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleSeek = (value: number[]) => {
    if (duration > 0) seek((value[0] / 100) * duration)
  }

  const handlePlayPause = () => {
    if (playing) pause()
    else resume()
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-6 px-6">

        {/* Track info */}
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <TrackArt trackId={currentTrack.id} isPlaying={playing} className="h-12 w-12" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{currentTrack.title}</p>
            <p className="truncate text-xs text-muted-foreground">{currentTrack.artist}</p>
          </div>
          <WaveformVisualizer isPlaying={playing} className="hidden sm:flex h-10 w-24" />
        </div>

        {/* Controls + seek + next up */}
        <div className="flex flex-1 flex-col items-center gap-1">
          <div className="flex items-center gap-3">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              title="Shuffle"
              className={cn(
                'transition-colors',
                shuffle ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Shuffle className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={playPrev}
              disabled={!canSkipPrev}
              className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            <button
              onClick={handlePlayPause}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors"
            >
              {playing ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 translate-x-0.5" />
              )}
            </button>

            <button
              onClick={playNext}
              disabled={!canSkipNext}
              className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <SkipForward className="h-4 w-4" />
            </button>

            {/* Repeat */}
            <button
              onClick={toggleRepeat}
              title="Repeat"
              className={cn(
                'transition-colors',
                repeat ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Repeat className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Seek bar */}
          <div className="flex w-full max-w-md items-center gap-2">
            <span className="w-10 text-right text-xs text-muted-foreground font-mono">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[progress]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              className="flex-1"
            />
            <span className="w-10 text-xs text-muted-foreground font-mono">
              {formatTime(duration || currentTrack.duration)}
            </span>
          </div>

          {/* Next up */}
          <p className="text-[10px] text-muted-foreground/60 leading-none h-3">
            {repeat
              ? 'Repeating'
              : shuffle
              ? 'Shuffling'
              : nextTrack
              ? `Next up: ${nextTrack.title}`
              : ''}
          </p>
        </div>

        {/* Volume */}
        <div className="hidden flex-1 items-center justify-end gap-3 sm:flex">
          <button
            className="text-muted-foreground hover:text-foreground transition-colors"
            onClick={toggleMute}
          >
            {muted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <Slider
            value={[muted ? 0 : volume * 100]}
            onValueChange={(value) => setVolume(value[0] / 100)}
            max={100}
            className="w-24"
          />
        </div>
      </div>
    </div>
  )
}
