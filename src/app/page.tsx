'use client'

import { useEffect, useState } from 'react'
import { Track } from '@/lib/types'
import { getTracks } from '@/lib/storage'
import { TrackCard } from '@/components/TrackCard'
import { Navigation } from '@/components/Navigation'
import { Player } from '@/components/Player'
import Link from 'next/link'
import { Music, TrendingUp, Sparkles } from 'lucide-react'

export default function FeedPage() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    const localById = new Map(getTracks().map((t) => [t.id, t]))

    fetch('/api/feed')
      .then((r) => r.json())
      .then(({ tracks: shelbyTracks }: { tracks: Track[] }) => {
        const merged = shelbyTracks.map((t) => ({
          ...t,
          plays: localById.get(t.id)?.plays ?? t.plays,
        }))
        setTracks(merged)
      })
      .catch(() => setError(true))
      .finally(() => setLoaded(true))
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pb-32">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                <Music className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Community Feed
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
              Discover Music from
              <span className="block text-primary">Global Creators</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              Explore tracks uploaded by artists worldwide. Connect your wallet to join the community and share your own music.
            </p>

            <div className="mt-8 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                <span className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{tracks.length}</span> public tracks
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">
                  Powered by <span className="font-semibold text-foreground">Shelby Protocol</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Tracks Grid */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-foreground">Latest Releases</h2>
            <span className="text-sm text-muted-foreground">Sorted by newest</span>
          </div>

          {!loaded ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-card/50 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20 mb-4">
                <Music className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Connection Error</h3>
              <p className="text-muted-foreground max-w-sm">
                Could not reach the network. Check your connection and try refreshing.
              </p>
            </div>
          ) : tracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Music className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No tracks yet</h3>
              <p className="text-muted-foreground max-w-sm mb-6">
                Be the first to upload a track and share it with the community.
              </p>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Upload a Track
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tracks.map((track) => (
                <TrackCard key={track.id} track={track} layout="card" />
              ))}
            </div>
          )}
        </section>
      </main>

      <Player />
    </div>
  )
}
