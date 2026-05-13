'use client'

import { useEffect, useState } from 'react'
import { Track } from '@/lib/types'
import { getTracks } from '@/lib/storage'
import { TrackCard } from '@/components/TrackCard'
import { Navigation } from '@/components/Navigation'
import { Player } from '@/components/Player'
import Link from 'next/link'

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
    <div className="min-h-screen">
      <Navigation />

      <main className="pb-32 pt-16">
        <section className="mx-auto max-w-4xl px-6 py-24">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
            Community Feed
          </p>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-balance leading-none">
            Discover music from<br />global creators
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl">
            Explore tracks uploaded by artists worldwide. Connect your wallet to join the community.
          </p>

          <div className="mt-8 flex items-center gap-8 text-sm text-muted-foreground">
            <span>
              <span className="font-semibold text-foreground">{tracks.length}</span> public tracks
            </span>
            <span>
              Powered by <span className="font-semibold text-foreground">Shelby Protocol</span>
            </span>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6">
          <div className="flex items-baseline justify-between mb-8 border-b border-border pb-4">
            <h2 className="text-sm font-medium uppercase tracking-widest">Latest Releases</h2>
            <span className="text-xs text-muted-foreground">Sorted by newest</span>
          </div>

          {!loaded ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-[60px] animate-pulse bg-muted/30 rounded my-1" />
              ))}
            </div>
          ) : error ? (
            <div className="py-24 text-center">
              <h3 className="text-lg font-medium mb-2">Connection error</h3>
              <p className="text-muted-foreground">Could not reach the network. Try refreshing.</p>
            </div>
          ) : tracks.length === 0 ? (
            <div className="py-24 text-center">
              <h3 className="text-lg font-medium mb-2">No tracks yet</h3>
              <p className="text-muted-foreground mb-6">Be the first to upload a track.</p>
              <Link
                href="/upload"
                className="text-sm underline text-muted-foreground hover:text-foreground transition-colors"
              >
                Upload a track →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {tracks.map((track) => (
                <TrackCard key={track.id} track={track} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Player />
    </div>
  )
}
