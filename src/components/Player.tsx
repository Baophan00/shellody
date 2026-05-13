'use client'

import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { usePlayer } from '@/context/PlayerContext'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { useState } from 'react'

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
    if (duration > 0) {
      seek((value[0] / 100) * duration)
    }
  }

  const handlePlayPause = () => {
    if (playing) {
      pause()
    } else {
      resume()
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-4">
        {/* Track info */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className={cn(
              'h-12 w-12 flex-shrink-0 rounded-lg',
              currentTrack.coverColor
                ? `bg-gradient-to-br ${currentTrack.coverColor}`
                : 'bg-gradient-to-br from-primary/60 to-accent/60'
            )}
          />
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{currentTrack.title}</p>
            <p className="truncate text-sm text-muted-foreground">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Controls + progress */}
        <div className="flex flex-1 flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" disabled>
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              onClick={handlePlayPause}
              size="icon"
              className="h-10 w-10 rounded-full"
            >
              {playing ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 translate-x-0.5" />
              )}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" disabled>
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex w-full max-w-md items-center gap-2">
            <span className="w-10 text-right text-xs text-muted-foreground">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[progress]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              className="flex-1"
            />
            <span className="w-10 text-xs text-muted-foreground">
              {formatTime(duration || currentTrack.duration)}
            </span>
          </div>
        </div>

        {/* Volume */}
        <div className="hidden flex-1 items-center justify-end gap-2 sm:flex">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
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
