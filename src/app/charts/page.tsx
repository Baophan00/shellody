'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Track } from '@/lib/types'
import { usePlayer } from '@/context/PlayerContext'
import { Navigation } from '@/components/Navigation'
import { Player } from '@/components/Player'
import { TrackArt } from '@/components/TrackArt'
import { useProfile } from '@/hooks/useProfile'
import { cn, formatDuration, shortAddress } from '@/lib/utils'
import { Play, Pause, Globe, TrendingUp, Music, Users, Radio, Activity } from 'lucide-react'
import ConstellationMap from '@/components/ConstellationMap'

// ─── Types ───────────────────────────────────────────
interface StatsData {
  totalTracks: number
  totalPlays: number
  uniqueArtists: number
  genreDistribution: { genre: string; count: number }[]
  topTracks: Track[]
  recentTracks: Track[]
  topUploaders: { address: string; count: number }[]
}

// ─── Animated Counter ────────────────────────────────
function AnimatedCounter({ value, label }: { value: number; label: string }) {
  const [display, setDisplay] = useState(0)
  const raf = useRef<number>(0)
  const start = useRef(0)

  useEffect(() => {
    start.current = performance.now()
    const from = display
    const to = value
    const duration = 1500

    const tick = (now: number) => {
      const elapsed = now - start.current
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.floor(from + (to - from) * eased))
      if (progress < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="text-center border border-[#111111] p-5">
      <p className="font-serif text-4xl lg:text-5xl font-black tabular-nums">{display.toLocaleString()}</p>
      <p className="font-mono text-[10px] uppercase tracking-widest text-[#737373] mt-1">{label}</p>
    </div>
  )
}

// ─── Shelby Wave (real-time activity chart) ──────────
function ShelbyWave({ tracks }: { tracks: Track[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const timeRef = useRef(0)

  // Create wave data from tracks
  const waveData = tracks.slice(0, 20).map((t, i) => ({
    plays: t.plays || 0,
    index: i,
    phase: (i / 20) * Math.PI * 2,
  }))

  const maxPlays = Math.max(...waveData.map((w) => w.plays), 1)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (rect) {
        canvas.width = rect.width * 2
        canvas.height = 200 * 2
        ctx.scale(2, 2)
      }
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = (now: number) => {
      const dt = (now - timeRef.current) / 1000
      timeRef.current = now
      if (!ctx || !canvas) return

      const w = canvas.width / 2
      const h = canvas.height / 2

      // Clear with fade effect
      ctx.fillStyle = 'rgba(249, 249, 247, 0.3)'
      ctx.fillRect(0, 0, w, h)

      // Draw grid lines
      ctx.strokeStyle = '#E5E5E0'
      ctx.lineWidth = 0.5
      for (let i = 0; i < 5; i++) {
        const y = (h / 5) * i
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }

      // Draw wave
      const barWidth = w / waveData.length - 4
      waveData.forEach((data, i) => {
        const x = (w / waveData.length) * i + 2
        const normalizedHeight = (data.plays / maxPlays) * (h * 0.8)
        const waveOffset = Math.sin(now / 1000 + data.phase) * 5
        const barHeight = Math.max(2, normalizedHeight + waveOffset)

        // Gradient bar
        const gradient = ctx.createLinearGradient(x, h, x, h - barHeight)
        gradient.addColorStop(0, '#111111')
        gradient.addColorStop(1, '#737373')
        ctx.fillStyle = gradient

        // Rounded top
        const radius = Math.min(2, barWidth / 2)
        ctx.beginPath()
        ctx.moveTo(x + radius, h)
        ctx.lineTo(x + barWidth - radius, h)
        ctx.arcTo(x + barWidth, h, x + barWidth, h - radius, radius)
        ctx.lineTo(x + barWidth, h - barHeight + radius)
        ctx.arcTo(x + barWidth, h - barHeight, x + barWidth - radius, h - barHeight, radius)
        ctx.lineTo(x + radius, h - barHeight)
        ctx.arcTo(x, h - barHeight, x, h - barHeight + radius, radius)
        ctx.lineTo(x, h)
        ctx.closePath()
        ctx.fill()
      })

      rafRef.current = requestAnimationFrame(draw)
    }
    timeRef.current = performance.now()
    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waveData.length, maxPlays])

  return (
    <div className="border border-[#111111] p-4 bg-[#F9F9F7]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#111111]" />
          <span className="font-sans text-xs font-medium uppercase tracking-widest">Shelby Wave</span>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-widest text-[#737373]">Live · {waveData.length} tracks</span>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: '200px' }}
      />
      <p className="font-mono text-[9px] text-center uppercase tracking-widest text-[#A3A3A3] mt-2">
        Real-time activity · bar height = play count
      </p>
    </div>
  )
}

// ─── Genre Distribution Bar Chart ────────────────────
function GenreChart({ data }: { data: { genre: string; count: number }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="border border-[#111111] p-4">
      <div className="flex items-center gap-2 mb-4">
        <Radio className="h-4 w-4 text-[#111111]" />
        <span className="font-sans text-xs font-medium uppercase tracking-widest">Genre Distribution</span>
      </div>
      <div className="space-y-2">
        {data.slice(0, 8).map((item) => {
          const pct = (item.count / maxCount) * 100
          return (
            <div key={item.genre} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#737373]">{item.genre}</span>
                <span className="font-mono text-[10px] text-[#111111] font-semibold">{item.count}</span>
              </div>
              <div className="h-2 bg-[#E5E5E0] border border-[#111111]">
                <div
                  className="h-full bg-[#111111] transition-all duration-1000 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Top 10 Bubble Chart ─────────────────────────────
function BubbleChart({ tracks }: { tracks: Track[] }) {
  const maxPlays = Math.max(...tracks.map((t) => t.plays || 0), 1)

  return (
    <div className="border border-[#111111] p-4 self-start">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-[#111111]" />
        <span className="font-sans text-xs font-medium uppercase tracking-widest">Top 10</span>
      </div>
      <div className="flex flex-col">
        {tracks.slice(0, 10).map((track, i) => {
          // Fixed size for all - 32px, no scaling to ensure all 10 fit
          return (
            <BubbleRow key={track.id} track={track} rank={i + 1} />
          )
        })}
      </div>
    </div>
  )
}

function BubbleRow({ track, rank }: { track: Track; rank: number }) {
  const { currentTrack, playing, play, pause, resume } = usePlayer()
  const { profile } = useProfile(track.address)
  const isActive = currentTrack?.id === track.id
  const isPlaying = isActive && playing
  const artistLabel = profile?.displayName || track.artist || shortAddress(track.address)

  const handlePlay = () => {
    if (isActive) {
      if (playing) pause()
      else resume()
    } else {
      play(track)
    }
  }

  return (
    <div className={cn('flex items-center gap-2 py-0.5 group hover:bg-[#F5F5F5] transition-colors px-1', isActive && 'bg-[#F5F5F5]')}>
      <span className={cn('w-5 font-serif text-sm font-black tabular-nums', rank <= 3 ? 'text-[#CC0000]' : 'text-[#737373]')}>
        {rank}
      </span>
      <button
        onClick={handlePlay}
        className="relative flex-shrink-0 w-8 h-8"
      >
        <TrackArt trackId={track.id} isPlaying={isPlaying} className="w-full h-full border border-[#111111]" />
        <div className="absolute inset-0 flex items-center justify-center bg-[#111111]/0 group-hover:bg-[#111111]/60 transition-all duration-200">
          {isPlaying ? (
            <Pause className="h-3 w-3 text-[#F9F9F7] opacity-0 group-hover:opacity-100" />
          ) : (
            <Play className="h-3 w-3 text-[#F9F9F7] opacity-0 group-hover:opacity-100 translate-x-0.5" />
          )}
        </div>
      </button>
      <div className="min-w-0 flex-1">
        <Link href={`/track/${track.id}`} className="block">
          <p className={cn('truncate font-sans text-[10px] font-semibold uppercase tracking-wider hover:underline decoration-[#CC0000]', isActive && 'text-[#CC0000]')}>
            {track.title}
          </p>
        </Link>
        <p className="truncate font-mono text-[8px] uppercase tracking-widest text-[#737373]">{artistLabel}</p>
      </div>
      <span className="font-mono text-[9px] text-[#737373] shrink-0">{track.plays.toLocaleString()}</span>
    </div>
  )
}

// ─── Live Activity Feed ──────────────────────────────
function LiveFeed({ tracks }: { tracks: Track[] }) {
  const [visible, setVisible] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible((prev) => (prev + 1) % Math.min(tracks.length, 20))
    }, 3000)
    return () => clearInterval(interval)
  }, [tracks.length])

  const recentItems = tracks.slice(0, 20)

  return (
    <div className="border border-[#111111] p-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-4 w-4 text-[#111111]" />
        <span className="font-sans text-xs font-medium uppercase tracking-widest">Live Activity</span>
      </div>
      <div className="space-y-2 min-h-[200px]">
        {recentItems.map((track, i) => (
          <div
            key={track.id}
            className={cn(
              'flex items-center gap-2 py-1.5 transition-all duration-500',
              i === visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 absolute'
            )}
          >
            <span className="h-2 w-2 bg-[#CC0000] animate-pulse flex-shrink-0" />
            <Link href={`/track/${track.id}`} className="font-mono text-[10px] uppercase tracking-widest text-[#737373] hover:text-[#111111] truncate">
              {track.title}
            </Link>
            <span className="font-mono text-[9px] text-[#A3A3A3] shrink-0">
              · {track.plays} plays
            </span>
          </div>
        ))}
      </div>
      <p className="font-mono text-[9px] text-center uppercase tracking-widest text-[#A3A3A3] mt-2">
        Cycling through {Math.min(tracks.length, 20)} recent tracks
      </p>
    </div>
  )
}

// ─── Top Uploaders ───────────────────────────────────
function UploadersList({ uploaders }: { uploaders: { address: string; count: number }[] }) {
  return (
    <div className="border border-[#111111] p-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-4 w-4 text-[#111111]" />
        <span className="font-sans text-xs font-medium uppercase tracking-widest">Top Uploaders</span>
      </div>
      <div className="space-y-2">
        {uploaders.slice(0, 8).map((u, i) => (
          <div key={u.address} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className={cn('font-serif text-sm font-bold', i < 3 ? 'text-[#CC0000]' : 'text-[#737373]')}>
                #{i + 1}
              </span>
              <Link
                href={`/profile/${u.address}`}
                className="font-mono text-[10px] uppercase tracking-widest text-[#737373] hover:text-[#111111] truncate"
              >
                {shortAddress(u.address)}
              </Link>
            </div>
            <span className="font-mono text-[10px] text-[#111111] font-semibold shrink-0">{u.count} tracks</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────
export default function ChartsPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Constellation data
  const [constellation, setConstellation] = useState<{
    nodes: { address: string; type: 'listener' | 'artist' | 'both'; totalPlays: number }[]
    edges: { from: string; to: string; count: number }[]
    totalEvents: number
  } | null>(null)

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setStats(data)
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadConstellation = useCallback(async () => {
    try {
      const res = await fetch('/api/listening-stats')
      if (res.ok) {
        const data = await res.json()
        setConstellation(data)
      }
    } catch {
      // Silently fail — constellation is optional
    }
  }, [])

  useEffect(() => {
    loadStats()
    loadConstellation()
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadStats()
      loadConstellation()
    }, 30000)
    return () => clearInterval(interval)
  }, [loadStats, loadConstellation])

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <Navigation />

      <main className="pb-32 pt-24">
        {/* Hero */}
        <section className="mx-auto max-w-screen-xl px-4 py-16 lg:py-20">
          <div className="border-b-4 border-[#111111] pb-8 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="h-6 w-6 text-[#111111]" />
              <p className="font-mono text-xs uppercase tracking-widest text-[#737373]">
                Global Track Explorer
              </p>
            </div>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-8xl xl:text-9xl font-black leading-[0.9] tracking-tighter text-balance">
              Shelby<br />Universe
            </h1>
            <p className="mt-6 font-body text-base lg:text-lg leading-relaxed text-[#525252] max-w-2xl">
              Explore the entire Shelby Protocol ecosystem in real-time. Track counts, plays, genres, and top uploaders — all powered by on-chain data.
            </p>
          </div>

          {/* Animated Counters */}
          {loading ? (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse bg-[#E5E5E0] border border-[#111111]" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 border border-[#111111] p-8 mb-8">
              <p className="font-serif text-xl font-bold mb-2">Connection Error</p>
              <p className="font-mono text-xs uppercase tracking-widest text-[#737373] mb-4">Could not load network stats</p>
              <button onClick={loadStats} className="font-sans text-xs uppercase tracking-widest underline underline-offset-4 decoration-2 decoration-[#CC0000] hover:text-[#CC0000]">
                Retry
              </button>
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <AnimatedCounter value={stats.totalTracks} label="Total Tracks" />
                <AnimatedCounter value={stats.totalPlays} label="Total Plays" />
                <AnimatedCounter value={stats.uniqueArtists} label="Unique Artists" />
              </div>

              {/* Shelby Wave */}
              <div className="mb-8">
                <ShelbyWave tracks={stats.topTracks} />
              </div>

              {/* Two columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <BubbleChart tracks={stats.topTracks} />
                <GenreChart data={stats.genreDistribution} />
              </div>

              {/* Two columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <LiveFeed tracks={stats.recentTracks} />
                <UploadersList uploaders={stats.topUploaders} />
              </div>

              {/* Shelby Constellation */}
              {constellation && (
                <div className="mb-8">
                  <ConstellationMap
                    nodes={constellation.nodes}
                    edges={constellation.edges}
                    totalEvents={constellation.totalEvents}
                  />
                </div>
              )}
            </>
          ) : null}
        </section>
      </main>

      <Player />
    </div>
  )
}

function TrackRow({ track, rank }: { track: Track; rank: number }) {
  const { currentTrack, playing, play, pause, resume } = usePlayer()
  const { profile } = useProfile(track.address)
  const isActive = currentTrack?.id === track.id
  const isPlaying = isActive && playing
  const artistLabel = profile?.displayName || track.artist || shortAddress(track.address)

  const handlePlay = () => {
    if (isActive) {
      if (playing) pause()
      else resume()
    } else {
      play(track)
    }
  }

  return (
    <div className={cn('flex items-center gap-4 py-3 px-2 group hover:bg-[#F5F5F5] transition-colors', isActive && 'bg-[#F5F5F5]')}>
      <span className={cn('w-8 font-serif text-2xl font-black tabular-nums', rank <= 3 ? 'text-[#CC0000]' : 'text-[#737373]')}>
        {rank}
      </span>
      <div className="relative flex-shrink-0">
        <TrackArt trackId={track.id} isPlaying={isPlaying} className="h-10 w-10 border border-[#111111]" />
        <button
          onClick={handlePlay}
          className="absolute inset-0 m-auto flex h-7 w-7 items-center justify-center border border-[#111111] bg-[#111111] text-[#F9F9F7] opacity-0 group-hover:opacity-100 transition-all duration-200"
        >
          {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 translate-x-0.5" />}
        </button>
      </div>
      <div className="min-w-0 flex-1">
        <Link href={`/track/${track.id}`} className="block">
          <p className={cn('truncate font-sans text-sm font-semibold uppercase tracking-wider hover:underline decoration-[#CC0000]', isActive && 'text-[#CC0000]')}>
            {track.title}
          </p>
        </Link>
        <p className="truncate font-mono text-[10px] uppercase tracking-widest text-[#737373]">{artistLabel}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-mono text-xs font-semibold">{track.plays.toLocaleString()}</p>
        <p className="font-mono text-[9px] uppercase tracking-widest text-[#737373]">plays</p>
      </div>
      <span className="font-mono text-[10px] text-[#737373] hidden sm:inline">{formatDuration(track.duration)}</span>
    </div>
  )
}
