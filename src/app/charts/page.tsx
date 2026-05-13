'use client'

import { useEffect, useState } from 'react'
import { Track } from '@/lib/types'
import { getTracks } from '@/lib/storage'
import { usePlayer } from '@/context/PlayerContext'
import { Navigation } from '@/components/Navigation'
import { Player } from '@/components/Player'
import { TrackArt } from '@/components/TrackArt'
import { useProfile } from '@/hooks/useProfile'
import { cn, formatDuration, shortAddress } from '@/lib/utils'
import { Play, Pause, Trophy } from 'lucide-react'

interface ChartEntry {
  rank: number
  track: Track
  reason: string
}

export default function ChartsPage() {
  const [chart, setChart] = useState<ChartEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [aiError, setAiError] = useState(false)
  const { currentTrack, playing, play, pause, resume } = usePlayer()

  useEffect(() => {
    async function load() {
      let allTracks = getTracks()
      try {
        const feedRes = await fetch('/api/feed')
        const { tracks: shelbyTracks } = await feedRes.json()
        const localById = new Map(allTracks.map((t) => [t.id, t]))
        allTracks = shelbyTracks.map((t: Track) => ({
          ...t,
          plays: localById.get(t.id)?.plays ?? t.plays,
        }))
      } catch {
        // use local tracks
      }

      try {
        const res = await fetch('/api/charts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tracks: allTracks }),
        })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        if (data.chart?.length) {
          setChart(data.chart)
          return
        }
        throw new Error('Empty chart response')
      } catch {
        setAiError(true)
        const fallback = [...allTracks]
          .sort((a, b) => b.plays - a.plays)
          .slice(0, 10)
          .map((track, i) => ({ rank: i + 1, track, reason: '' }))
        setChart(fallback)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handlePlay = (track: Track) => {
    if (currentTrack?.id === track.id) {
      if (playing) pause()
      else resume()
    } else {
      play(track)
    }
  }

  const totalPlays = chart.reduce((acc, e) => acc + e.track.plays, 0)
  const totalArtists = new Set(chart.map((e) => e.track.artist)).size

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="pb-32 pt-16">
        <section className="mx-auto max-w-4xl px-6 py-24">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
            {aiError ? 'Ranked by Play Count' : 'AI-Generated Rankings'}
          </p>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-balance leading-none">
            Top 10 Charts
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl">
            The most played tracks on Shellody, ranked by our algorithm based on plays and engagement.
          </p>

          <div className="mt-8 flex items-center gap-8 text-sm text-muted-foreground">
            <span>
              <span className="font-semibold text-foreground">{totalPlays.toLocaleString()}</span> total plays
            </span>
            <span>
              <span className="font-semibold text-foreground">{chart.length}</span> charting
            </span>
            <span>
              <span className="font-semibold text-foreground">{totalArtists}</span> artists
            </span>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6">
          <div className="border-b border-border pb-4 mb-8">
            <h2 className="text-sm font-medium uppercase tracking-widest">Leaderboard</h2>
          </div>

          {loading && chart.length === 0 ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-[60px] animate-pulse bg-muted/30 rounded my-1" />
              ))}
            </div>
          ) : chart.length === 0 ? (
            <div className="py-24 text-center">
              <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Charts Yet</h3>
              <p className="text-muted-foreground">
                Be the first to upload a public track and claim the top spot.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {chart.map((entry, index) => (
                <ChartRow
                  key={entry.track.id}
                  entry={entry}
                  rank={index + 1}
                  isCurrentTrackActive={currentTrack?.id === entry.track.id}
                  playing={playing}
                  onPlay={() => handlePlay(entry.track)}
                  aiError={aiError}
                />
              ))}
            </div>
          )}

          <p className="mt-12 text-xs text-center text-muted-foreground">
            Rankings updated in real-time based on play counts and engagement metrics
          </p>
        </section>
      </main>

      <Player />
    </div>
  )
}

function ChartRow({
  entry,
  rank,
  isCurrentTrackActive,
  playing,
  onPlay,
  aiError,
}: {
  entry: ChartEntry
  rank: number
  isCurrentTrackActive: boolean
  playing: boolean
  onPlay: () => void
  aiError: boolean
}) {
  const { profile } = useProfile(entry.track.address)
  const isTrackPlaying = isCurrentTrackActive && playing
  const artistLabel = profile?.displayName || entry.track.artist || shortAddress(entry.track.address)

  return (
    <div
      className={cn(
        'flex items-center gap-6 py-4 group',
        isCurrentTrackActive && 'bg-muted/50 -mx-4 px-4'
      )}
    >
      <span
        className={cn(
          'w-8 text-2xl font-bold tabular-nums',
          rank === 1 ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        {rank}
      </span>

      <div className="relative">
        <TrackArt trackId={entry.track.id} isPlaying={isTrackPlaying} className="h-12 w-12" />
        <button
          className="absolute inset-0 m-auto flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onPlay}
        >
          {isTrackPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className={cn('font-medium truncate', isCurrentTrackActive && 'text-primary')}>
          {entry.track.title}
        </h3>
        <p className="text-sm text-muted-foreground truncate">{artistLabel}</p>
        {entry.reason && !aiError && (
          <p className="text-xs text-muted-foreground/60 italic truncate mt-0.5">
            &ldquo;{entry.reason}&rdquo;
          </p>
        )}
      </div>

      <div className="text-right font-mono text-sm shrink-0">
        <p className="font-semibold">{entry.track.plays.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">plays</p>
        <p className="text-xs text-muted-foreground">{formatDuration(entry.track.duration)}</p>
      </div>
    </div>
  )
}
