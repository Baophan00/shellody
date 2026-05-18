'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Track } from '@/lib/types'
import { getTrackById } from '@/lib/storage'
import { usePlayer } from '@/context/PlayerContext'
import { Navigation } from '@/components/Navigation'
import { Player } from '@/components/Player'
import { TrackArt } from '@/components/TrackArt'
import { formatDuration, shortAddress } from '@/lib/utils'
import { Play, Pause, Copy, Check } from 'lucide-react'

export default function TrackPage() {
  const { id } = useParams<{ id: string }>()
  const [track, setTrack] = useState<Track | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [copied, setCopied] = useState(false)
  const { currentTrack, playing, play, pause, resume } = usePlayer()

  useEffect(() => {
    // First try local storage
    const local = getTrackById(id)
    if (local) {
      setTrack(local)
      setLoaded(true)
      return
    }

    // Fallback: fetch from feed API
    fetch('/api/feed')
      .then((r) => r.json())
      .then(({ tracks }: { tracks: Track[] }) => {
        const found = tracks.find((t) => t.id === id)
        setTrack(found ?? null)
      })
      .catch(() => setTrack(null))
      .finally(() => setLoaded(true))
  }, [id])

  const isActive = currentTrack?.id === track?.id
  const isPlaying = isActive && playing

  const handlePlayPause = () => {
    if (!track) return
    if (isActive) {
      if (isPlaying) pause()
      else resume()
    } else {
      play(track)
    }
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <Navigation />

      <main className="mx-auto max-w-2xl px-4 pt-32 pb-32">
        {!loaded ? (
          <div>
            <div className="w-full aspect-square border-2 border-[#111111] bg-[#E5E5E0] animate-pulse mb-8" />
            <div className="h-8 bg-[#E5E5E0] animate-pulse mb-3" />
            <div className="h-5 bg-[#E5E5E0] animate-pulse w-1/2" />
          </div>
        ) : !track ? (
          <div className="text-center py-24 border-4 border-[#111111] p-12">
            <p className="font-serif text-2xl font-bold mb-4">Track not found.</p>
            <Link href="/" className="font-sans text-xs uppercase tracking-widest underline underline-offset-4 decoration-2 decoration-[#CC0000] hover:text-[#CC0000]">
              ← Back to feed
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Cover art - 3 columns */}
            <div className="lg:col-span-3">
              <div className="relative w-full aspect-square border-4 border-[#111111]">
                <TrackArt trackId={track.id} isPlaying={isPlaying} className="w-full h-full" />
                {isPlaying && (
                  <div className="absolute inset-0 border-2 border-[#111111]/10 animate-pulse pointer-events-none" />
                )}
                <button
                  onClick={handlePlayPause}
                  className="absolute bottom-4 right-4 flex h-16 w-16 items-center justify-center border-2 border-[#111111] bg-[#111111] text-[#F9F9F7] hover:bg-[#F9F9F7] hover:text-[#111111] transition-all duration-200"
                >
                  {isPlaying ? (
                    <Pause className="h-7 w-7" />
                  ) : (
                    <Play className="h-7 w-7 translate-x-0.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Details - 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title + artist */}
              <div className="border-b-4 border-[#111111] pb-6">
                <h1 className="font-serif text-4xl lg:text-5xl font-black tracking-tighter mb-2">{track.title}</h1>
                <Link
                  href={`/profile/${track.address}`}
                  className="font-mono text-xs uppercase tracking-widest text-[#CC0000] hover:text-[#111111] transition-colors"
                >
                  {track.artist || shortAddress(track.address)}
                </Link>
                {track.genre && (
                  <span className="ml-3 font-mono text-[10px] uppercase tracking-widest text-[#737373] border border-[#111111] px-2 py-0.5">
                    {track.genre}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 border-2 border-[#111111]">
                <div className="text-center py-5 px-3 border-r-2 border-[#111111]">
                  <p className="font-serif text-3xl font-black tabular-nums">{track.plays.toLocaleString()}</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#737373] mt-1">Plays</p>
                </div>
                <div className="text-center py-5 px-3 border-r-2 border-[#111111]">
                  <p className="font-mono text-2xl font-bold">{formatDuration(track.duration)}</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#737373] mt-1">Duration</p>
                </div>
                <div className="text-center py-5 px-3">
                  <p className="font-sans text-lg font-bold truncate">{track.genre || '—'}</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#737373] mt-1">Genre</p>
                </div>
              </div>

              {/* On-chain info */}
              <div className="border-2 border-[#111111] p-5 space-y-4">
                <div>
                  <p className="font-sans text-[10px] uppercase tracking-widest font-medium mb-1">Shelby CID</p>
                  <p className="font-mono text-[10px] break-all leading-relaxed text-[#737373]">{track.cid}</p>
                </div>
                <div>
                  <p className="font-sans text-[10px] uppercase tracking-widest font-medium mb-1">Uploader</p>
                  <Link
                    href={`/profile/${track.address}`}
                    className="font-mono text-[10px] text-[#CC0000] hover:text-[#111111] break-all"
                  >
                    {track.address}
                  </Link>
                </div>
                {track.txHash && (
                  <div>
                    <p className="font-sans text-[10px] uppercase tracking-widest font-medium mb-1">Transaction</p>
                    <p className="font-mono text-[10px] break-all text-[#737373]">{track.txHash}</p>
                  </div>
                )}
                <div>
                  <p className="font-sans text-[10px] uppercase tracking-widest font-medium mb-1">Uploaded</p>
                  <p className="font-mono text-[10px] text-[#737373]">
                    {new Date(track.uploadedAt).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Share */}
              <button
                onClick={copyLink}
                className="w-full flex items-center justify-center gap-2 border-2 border-[#111111] py-3 font-sans text-xs uppercase tracking-widest text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5] transition-all duration-200"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Link copied!' : 'Copy share link'}
              </button>
            </div>
          </div>
        )}
      </main>

      <Player />
    </div>
  )
}
