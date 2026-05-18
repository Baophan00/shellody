'use client'

import { useEffect, useState } from 'react'
import { Track } from '@/lib/types'
import { getTracks } from '@/lib/storage'
import { TrackCard } from '@/components/TrackCard'
import { Navigation } from '@/components/Navigation'
import { Player } from '@/components/Player'
import { usePlayer } from '@/context/PlayerContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DiscoverTab from '@/components/DiscoverTab'
import Link from 'next/link'

export default function FeedPage() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const { setQueue } = usePlayer()

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
        setQueue(merged)
      })
      .catch(() => setError(true))
      .finally(() => setLoaded(true))
  }, [setQueue])

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <Navigation />

      {/* Ticker */}
      <div className="ticker mt-[72px]">
        <div className="ticker-content">
          <span className="font-mono text-xs uppercase tracking-widest mx-8">
            <span className="text-[#CC0000] font-bold">● LIVE</span> Shellody — Decentralized Music Platform
          </span>
          <span className="font-mono text-xs uppercase tracking-widest mx-8">
            <span className="text-[#CC0000] font-bold">●</span> {tracks.length} tracks available
          </span>
          <span className="font-mono text-xs uppercase tracking-widest mx-8">
            <span className="text-[#CC0000] font-bold">●</span> Powered by Shelby Protocol & Aptos Blockchain
          </span>
          <span className="font-mono text-xs uppercase tracking-widest mx-8">
            <span className="text-[#CC0000] font-bold">●</span> Upload. Share. Discover.
          </span>
        </div>
      </div>

      <main className="pb-32">
        {/* Hero Section */}
        <section className="mx-auto max-w-screen-xl px-4 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main headline - 8 columns */}
            <div className="lg:col-span-8 border-b-4 border-[#111111] pb-8 lg:border-b-0 lg:pb-0 lg:border-r lg:border-[#111111] lg:pr-8">
              <p className="font-mono text-xs uppercase tracking-widest text-[#737373] mb-4">
                Community Feed
              </p>
              <h1 className="font-serif text-5xl sm:text-6xl lg:text-8xl xl:text-9xl font-black leading-[0.9] tracking-tighter text-balance">
                Discover music<br />from global<br />creators
              </h1>
              <p className="mt-6 font-body text-base lg:text-lg leading-relaxed text-[#525252] max-w-xl drop-cap">
                Explore tracks uploaded by artists worldwide. Connect your wallet to join the community and start sharing your sound.
              </p>

              <div className="mt-8 flex items-center gap-8 font-mono text-xs uppercase tracking-widest text-[#737373]">
                <span className="border-r border-[#111111] pr-8">
                  <span className="font-bold text-[#111111]">{tracks.length}</span> public tracks
                </span>
                <span>
                  Powered by <span className="font-bold text-[#111111]">Shelby Protocol</span>
                </span>
              </div>
            </div>

            {/* Sidebar - 4 columns */}
            <div className="lg:col-span-4 space-y-6">
              <div className="border border-[#111111] p-6">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#737373] mb-2">Edition</p>
                <p className="font-serif text-2xl font-bold">Vol. 1</p>
                <p className="font-mono text-xs text-[#737373] mt-1">
                  {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="border border-[#111111] p-6 bg-[#111111] text-[#F9F9F7]">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#A3A3A3] mb-2">Network Stats</p>
                <p className="font-serif text-3xl font-black">{tracks.length}</p>
                <p className="font-mono text-xs uppercase tracking-widest text-[#A3A3A3]">Tracks on Shelby</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tracks Section */}
        <section className="mx-auto max-w-screen-xl px-4">
          <Tabs defaultValue="feed">
            <div className="flex items-center justify-between border-b border-[#111111] pb-0 mb-8">
              <TabsList className="bg-transparent p-0 h-auto gap-8 border-b-0">
                <TabsTrigger
                  value="feed"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#111111] data-[state=active]:bg-transparent px-0 pb-3 text-[#737373] data-[state=active]:text-[#111111] font-sans text-xs font-medium uppercase tracking-widest"
                >
                  Feed
                </TabsTrigger>
                <TabsTrigger
                  value="discover"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#111111] data-[state=active]:bg-transparent px-0 pb-3 text-[#737373] data-[state=active]:text-[#111111] font-sans text-xs font-medium uppercase tracking-widest"
                >
                  Discover
                </TabsTrigger>
              </TabsList>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#737373] pb-3">Sorted by newest</span>
            </div>

            <TabsContent value="feed">
              {!loaded ? (
                <div className="divide-y divide-[#111111]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-[60px] animate-pulse bg-[#E5E5E0]/50 my-1" />
                  ))}
                </div>
              ) : error ? (
                <div className="py-24 text-center border border-[#111111] p-8">
                  <h3 className="font-serif text-2xl font-bold mb-2">Connection Error</h3>
                  <p className="font-mono text-xs uppercase tracking-widest text-[#737373]">Could not reach the network. Try refreshing.</p>
                </div>
              ) : tracks.length === 0 ? (
                <div className="py-24 text-center border border-[#111111] p-8">
                  <h3 className="font-serif text-2xl font-bold mb-2">No Tracks Yet</h3>
                  <p className="font-mono text-xs uppercase tracking-widest text-[#737373] mb-6">Be the first to upload a track.</p>
                  <Link
                    href="/upload"
                    className="font-sans text-xs uppercase tracking-widest underline underline-offset-4 decoration-2 decoration-[#CC0000] hover:text-[#CC0000] transition-colors"
                  >
                    Upload a track →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-[#111111] border border-[#111111]">
                  {tracks.map((track) => (
                    <TrackCard key={track.id} track={track} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="discover">
              <DiscoverTab />
            </TabsContent>
          </Tabs>
        </section>

        {/* Ornamental divider */}
        <div className="ornament-divider">✦ ✦ ✦</div>

        {/* Footer */}
        <footer className="mx-auto max-w-screen-xl px-4 border-t-4 border-[#111111] pt-8 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <span className="font-serif text-2xl font-black tracking-tighter">Shellody</span>
              <p className="font-mono text-xs uppercase tracking-widest text-[#737373] mt-2">
                Decentralized music on Shelby Protocol & Aptos
              </p>
            </div>
            <div>
              <p className="font-sans text-xs uppercase tracking-widest font-medium mb-3">Navigation</p>
              <div className="space-y-2">
                <Link href="/" className="block font-mono text-xs text-[#737373] hover:text-[#111111] transition-colors">Feed</Link>
                <Link href="/upload" className="block font-mono text-xs text-[#737373] hover:text-[#111111] transition-colors">Upload</Link>
                <Link href="/charts" className="block font-mono text-xs text-[#737373] hover:text-[#111111] transition-colors">Charts</Link>
              </div>
            </div>
            <div>
              <p className="font-sans text-xs uppercase tracking-widest font-medium mb-3">Info</p>
              <div className="space-y-2">
                <p className="font-mono text-xs text-[#737373]">Edition: Vol 1.0</p>
                <p className="font-mono text-xs text-[#737373]">Built on Aptos</p>
              </div>
            </div>
          </div>
        </footer>
      </main>

      <Player />
    </div>
  )
}
