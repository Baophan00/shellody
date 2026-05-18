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
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#F9F9F7] border-t-4 border-[#111111]">
      <div className="mx-auto flex max-w-screen-xl items-center gap-4 px-4 py-3">
        {/* Track info */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <TrackArt trackId={currentTrack.id} isPlaying={playing} className="h-11 w-11 border border-[#111111]" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-sans text-sm font-semibold uppercase tracking-wider">{currentTrack.title}</p>
            <p className="truncate font-mono text-[10px] uppercase tracking-widest text-[#737373]">{currentTrack.artist}</p>
          </div>
          <WaveformVisualizer isPlaying={playing} className="hidden sm:flex h-8 w-20" />
        </div>

        {/* Controls */}
        <div className="flex flex-1 flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleShuffle}
              title="Shuffle"
              className={cn(
                'h-8 w-8 flex items-center justify-center border border-[#111111] transition-all duration-200',
                shuffle ? 'bg-[#111111] text-[#F9F9F7]' : 'text-[#737373] hover:text-[#111111] hover:bg-[#E5E5E0]'
              )}
            >
              <Shuffle className="h-3 w-3" />
            </button>

            <button
              onClick={playPrev}
              disabled={!canSkipPrev}
              className="h-8 w-8 flex items-center justify-center border border-[#111111] text-[#737373] hover:text-[#111111] hover:bg-[#E5E5E0] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <SkipBack className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={handlePlayPause}
              className="flex h-10 w-10 items-center justify-center border-2 border-[#111111] bg-[#111111] text-[#F9F9F7] hover:bg-[#F9F9F7] hover:text-[#111111] transition-all duration-200"
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
              className="h-8 w-8 flex items-center justify-center border border-[#111111] text-[#737373] hover:text-[#111111] hover:bg-[#E5E5E0] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <SkipForward className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={toggleRepeat}
              title="Repeat"
              className={cn(
                'h-8 w-8 flex items-center justify-center border border-[#111111] transition-all duration-200',
                repeat ? 'bg-[#111111] text-[#F9F9F7]' : 'text-[#737373] hover:text-[#111111] hover:bg-[#E5E5E0]'
              )}
            >
              <Repeat className="h-3 w-3" />
            </button>
          </div>

          {/* Seek bar */}
          <div className="flex w-full max-w-md items-center gap-2">
            <span className="w-10 text-right font-mono text-[10px] text-[#737373]">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[progress]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              className="flex-1"
            />
            <span className="w-10 font-mono text-[10px] text-[#737373]">
              {formatTime(duration || currentTrack.duration)}
            </span>
          </div>

          <p className="font-mono text-[9px] uppercase tracking-widest text-[#A3A3A3] leading-none h-3">
            {repeat
              ? 'Repeating'
              : shuffle
              ? 'Shuffling'
              : nextTrack
              ? `Next: ${nextTrack.title}`
              : ''}
          </p>
        </div>

        {/* Volume */}
        <div className="hidden lg:flex flex-1 items-center justify-end gap-3">
          <button
            className="h-8 w-8 flex items-center justify-center border border-[#111111] text-[#737373] hover:text-[#111111] hover:bg-[#E5E5E0] transition-all duration-200"
            onClick={toggleMute}
          >
            {muted || volume === 0 ? (
              <VolumeX className="h-3.5 w-3.5" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" />
            )}
          </button>
          <Slider
            value={[muted ? 0 : volume * 100]}
            onValueChange={(value) => setVolume(value[0] / 100)}
            max={100}
            className="w-20"
          />
        </div>
      </div>
    </div>
  )
}
