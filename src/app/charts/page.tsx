'use client'

import { useEffect, useState } from 'react'
import { Track } from '@/lib/types'
import { getTracks } from '@/lib/storage'
import { usePlayer } from '@/context/PlayerContext'
import { Navigation } from '@/components/Navigation'
import { Player } from '@/components/Player'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn, formatDuration, shortAddress } from '@/lib/utils'
import { Trophy, Play, Pause, TrendingUp, Sparkles, Crown, Medal } from 'lucide-react'

interface ChartEntry {
  rank: number
  track: Track
  reason: string
}

function getRankIcon(index: number) {
  if (index === 0) return <Crown className="h-6 w-6 text-amber-400" />
  if (index === 1) return <Medal className="h-5 w-5 text-zinc-300" />
  if (index === 2) return <Medal className="h-5 w-5 text-amber-600" />
  return <span className="text-lg font-bold text-muted-foreground w-6 text-center">{index + 1}</span>
}

function getRankGradient(index: number) {
  if (index === 0) return 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border-amber-500/30'
  if (index === 1) return 'bg-gradient-to-r from-zinc-400/15 via-zinc-400/5 to-transparent border-zinc-400/20'
  if (index === 2) return 'bg-gradient-to-r from-amber-700/15 via-amber-700/5 to-transparent border-amber-700/20'
  return 'bg-card/50 border-border/50'
}

export default function ChartsPage() {
  const [chart, setChart] = useState<ChartEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [aiError, setAiError] = useState(false)
  const { currentTrack, playing, play, pause, resume } = usePlayer()

  useEffect(() => {
    async function load() {
      const localTracks = getTracks()

      // Try to get tracks from Shelby feed too
      let allTracks = localTracks
      try {
        const feedRes = await fetch('/api/feed')
        const { tracks: shelbyTracks } = await feedRes.json()
        const localById = new Map(localTracks.map((t) => [t.id, t]))
        allTracks = shelbyTracks.map((t: Track) => ({
          ...t,
          plays: localById.get(t.id)?.plays ?? t.plays,
        }))
      } catch {
        // use local tracks as fallback
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
          .map((track, i) => ({ rank: i + 1, track, reason: 'Ranked by play count' }))
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8 pb-32">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {aiError ? 'Ranked by Play Count' : 'AI-Generated Rankings'}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
              Top 10 Charts
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              {aiError
                ? 'Showing tracks sorted by most plays'
                : 'The most played tracks on Shellody, ranked by our AI algorithm'}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{totalPlays.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Plays</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 text-center">
                <Trophy className="h-5 w-5 text-amber-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{chart.length}</p>
                <p className="text-xs text-muted-foreground">Charting Tracks</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 text-center">
                <Sparkles className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">
                  {new Set(chart.map((e) => e.track.artist)).size}
                </p>
                <p className="text-xs text-muted-foreground">Artists</p>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard */}
          {loading && chart.length === 0 ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-card/50 animate-pulse" />
              ))}
            </div>
          ) : chart.length === 0 ? (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-12 text-center">
                <Trophy className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Charts Yet</h3>
                <p className="text-muted-foreground">
                  Be the first to upload a public track and claim the top spot!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {chart.map((entry, index) => {
                const isCurrentTrack = currentTrack?.id === entry.track.id
                const isTrackPlaying = isCurrentTrack && playing

                return (
                  <Card
                    key={entry.track.id}
                    className={cn(
                      getRankGradient(index),
                      'border transition-all duration-300 hover:scale-[1.01]',
                      isCurrentTrack && 'ring-1 ring-primary/50'
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className="flex items-center justify-center w-10">
                          {getRankIcon(index)}
                        </div>

                        {/* Cover Art */}
                        <div className="relative group/cover">
                          <div
                            className={cn(
                              'w-14 h-14 rounded-lg',
                              entry.track.coverColor
                                ? `bg-gradient-to-br ${entry.track.coverColor}`
                                : 'bg-gradient-to-br from-primary/60 to-accent/60'
                            )}
                          />
                          <Button
                            size="icon"
                            variant="secondary"
                            className="absolute inset-0 m-auto w-8 h-8 rounded-full opacity-0 group-hover/cover:opacity-100 transition-opacity bg-background/90 hover:bg-background"
                            onClick={() => handlePlay(entry.track)}
                          >
                            {isTrackPlaying ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4 ml-0.5" />
                            )}
                          </Button>
                        </div>

                        {/* Track Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {entry.track.title}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {entry.track.artist || shortAddress(entry.track.address)}
                          </p>
                          {entry.reason && !aiError && (
                            <p className="text-xs text-muted-foreground/60 italic truncate mt-0.5">
                              &ldquo;{entry.reason}&rdquo;
                            </p>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="text-right shrink-0">
                          <p className="font-bold text-foreground">
                            {entry.track.plays.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">plays</p>
                          <p className="text-xs text-muted-foreground">{formatDuration(entry.track.duration)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Rankings updated in real-time based on play counts and engagement
            </p>
          </div>
        </div>
      </main>

      <Player />
    </div>
  )
}
