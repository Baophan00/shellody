'use client'

import { useEffect, useRef, useMemo } from 'react'
import { cn } from '@/lib/utils'

interface TrackArtProps {
  trackId: string
  isPlaying: boolean
  className?: string
}

function seededRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function trackSeed(trackId: string): number {
  let h = 0
  for (let i = 0; i < trackId.length; i++) {
    h = Math.imul(31, h) + trackId.charCodeAt(i)
  }
  return h >>> 0
}

function makePath(y: number, amplitude: number, frequency: number, phase: number, w: number): string {
  const segments = 64
  const step = w / segments
  let d = `M 0 ${y}`
  for (let i = 1; i <= segments; i++) {
    const x = i * step
    const py = y + Math.sin(i / segments * Math.PI * 2 * frequency + phase) * amplitude
    d += ` L ${x} ${py}`
  }
  return d
}

interface WaveConfig {
  y: number
  amplitude: number
  frequency: number
  speed: number
}

export function TrackArt({ trackId, isPlaying, className }: TrackArtProps) {
  const size = 48
  const pathsRef = useRef<(SVGPathElement | null)[]>([])
  const rafRef = useRef<number>(0)
  const phaseRef = useRef<number[]>([])

  const waves = useMemo<WaveConfig[]>(() => {
    const rand = seededRand(trackSeed(trackId))
    const count = 4 + Math.floor(rand() * 3) // 4–6 waves
    const configs: WaveConfig[] = []
    for (let i = 0; i < count; i++) {
      const t = (i + 1) / (count + 1)
      configs.push({
        y: size * t,
        amplitude: 2 + rand() * 5,
        frequency: 1.5 + rand() * 2,
        speed: 0.6 + rand() * 1.2,
      })
    }
    phaseRef.current = configs.map(() => 0)
    return configs
  }, [trackId])

  useEffect(() => {
    if (isPlaying) {
      let last = performance.now()
      const tick = (now: number) => {
        const dt = (now - last) / 1000
        last = now
        waves.forEach((wave, i) => {
          phaseRef.current[i] += wave.speed * dt * Math.PI * 2
          const el = pathsRef.current[i]
          if (el) {
            el.setAttribute('d', makePath(wave.y, wave.amplitude, wave.frequency, phaseRef.current[i], size))
          }
        })
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } else {
      cancelAnimationFrame(rafRef.current)
      waves.forEach((wave, i) => {
        const el = pathsRef.current[i]
        if (el) {
          el.setAttribute('d', makePath(wave.y, wave.amplitude, wave.frequency, phaseRef.current[i], size))
        }
      })
    }
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying, waves])

  const clipId = `clip-${trackId.replace(/[^a-zA-Z0-9]/g, '')}`

  return (
    <div className={cn('relative flex-shrink-0 overflow-hidden rounded-full', className)}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary"
      >
        <defs>
          <clipPath id={clipId}>
            <circle cx={size / 2} cy={size / 2} r={size / 2} />
          </clipPath>
        </defs>
        {/* Background circle */}
        <circle cx={size / 2} cy={size / 2} r={size / 2} fill="#E5E5E0" />
        {/* Wave lines */}
        <g clipPath={`url(#${clipId})`}>
          {waves.map((wave, i) => (
            <path
              key={i}
              ref={(el) => { pathsRef.current[i] = el }}
              d={makePath(wave.y, wave.amplitude, wave.frequency, 0, size)}
              fill="none"
              stroke="#111111"
              strokeWidth="0.9"
              strokeOpacity="0.85"
            />
          ))}
        </g>
      </svg>
    </div>
  )
}
