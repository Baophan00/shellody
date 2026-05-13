'use client'

import { useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { usePlayer } from '@/context/PlayerContext'
import { Slider } from '@/components/ui/slider'
import { WaveformVisualizer } from '@/components/WaveformVisualizer'
import { cn } from '@/lib/utils'

function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function Player() {
  const { currentTrack, playing, currentTime, duration, pause, resume, seek } = usePlayer()
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)

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
          <div className="relative h-12 w-12 flex-shrink-0">
            <div
              className={cn(
                'h-12 w-12 rounded',
                currentTrack.coverColor
                  ? `bg-gradient-to-br ${currentTrack.coverColor}`
                  : 'bg-gradient-to-br from-primary/60 to-primary/20'
              )}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{currentTrack.title}</p>
            <p className="truncate text-xs text-muted-foreground">{currentTrack.artist}</p>
          </div>
          <WaveformVisualizer isPlaying={playing} className="hidden sm:flex h-10 w-24" />
        </div>

        {/* Controls + seek */}
        <div className="flex flex-1 flex-col items-center gap-1">
          <div className="flex items-center gap-3">
            <button className="text-muted-foreground hover:text-foreground transition-colors" disabled>
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
            <button className="text-muted-foreground hover:text-foreground transition-colors" disabled>
              <SkipForward className="h-4 w-4" />
            </button>
          </div>
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
        </div>

        {/* Volume */}
        <div className="hidden flex-1 items-center justify-end gap-3 sm:flex">
          <button
            className="text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <Slider
            value={[isMuted ? 0 : volume * 100]}
            onValueChange={(value) => {
              setVolume(value[0] / 100)
              if (isMuted) setIsMuted(false)
            }}
            max={100}
            className="w-24"
          />
        </div>
      </div>
    </div>
  )
}
