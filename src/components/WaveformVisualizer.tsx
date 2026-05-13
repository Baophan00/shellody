'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface WaveformVisualizerProps {
  isPlaying: boolean
  className?: string
}

export function WaveformVisualizer({ isPlaying, className }: WaveformVisualizerProps) {
  const barsRef = useRef<HTMLDivElement[]>([])
  const animationRef = useRef<number[]>([])

  const barCount = 16

  useEffect(() => {
    if (isPlaying) {
      barsRef.current.forEach((bar, index) => {
        if (!bar) return

        const animate = () => {
          const time = Date.now() / 1000
          const frequency = 2 + (index % 5) * 0.5
          const phase = index * 0.3
          const baseHeight = 15 + Math.sin(index * 0.5) * 8
          const amplitude = 35 + Math.sin(index * 0.8) * 15

          const height = baseHeight + Math.abs(Math.sin(time * frequency + phase)) * amplitude
          const glow = 0.3 + Math.abs(Math.sin(time * frequency + phase)) * 0.7

          bar.style.height = `${height}%`
          bar.style.opacity = `${0.5 + glow * 0.5}`

          animationRef.current[index] = requestAnimationFrame(animate)
        }

        animationRef.current[index] = requestAnimationFrame(animate)
      })
    } else {
      animationRef.current.forEach((id) => cancelAnimationFrame(id))
      barsRef.current.forEach((bar) => {
        if (bar) {
          bar.style.height = '12%'
          bar.style.opacity = '0.25'
        }
      })
    }

    const ids = animationRef.current
    return () => {
      ids.forEach((id) => cancelAnimationFrame(id))
    }
  }, [isPlaying])

  return (
    <div className={cn('flex h-full items-end justify-center gap-[3px]', className)}>
      {Array.from({ length: barCount }).map((_, index) => (
        <div
          key={index}
          ref={(el) => {
            if (el) barsRef.current[index] = el
          }}
          className="w-[2px] rounded-full bg-primary transition-all duration-75"
          style={{ height: '12%', opacity: 0.25 }}
        />
      ))}
    </div>
  )
}
