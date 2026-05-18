'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { shortAddress } from '@/lib/utils'
import { Users, ArrowRight } from 'lucide-react'

interface NodeData {
  address: string
  type: 'listener' | 'artist' | 'both'
  totalPlays: number
}

interface EdgeData {
  from: string
  to: string
  count: number
}

interface ConstellationMapProps {
  nodes: NodeData[]
  edges: EdgeData[]
  totalEvents: number
}

interface Position {
  x: number
  y: number
}

// ─── Circular Layout ────────────────────────────────
function computeLayout(nodes: NodeData[], w: number, h: number): Map<string, Position> {
  const positions = new Map<string, Position>()
  const cx = w / 2
  const cy = h / 2
  const radius = Math.min(w, h) * 0.35

  nodes.forEach((node, i) => {
    const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2
    positions.set(node.address, {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    })
  })

  return positions
}

// ─── Component ──────────────────────────────────────
export default function ConstellationMap({ nodes, edges, totalEvents }: ConstellationMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const timeRef = useRef(0)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [dimensions, setDimensions] = useState({ w: 700, h: 450 })

  // Compute node sizes based on plays
  const maxPlays = Math.max(...nodes.map((n) => n.totalPlays), 1)
  const maxEdgeCount = Math.max(...edges.map((e) => e.count), 1)

  // Layout
  const positions = computeLayout(nodes, dimensions.w, dimensions.h)

  // Resize
  useEffect(() => {
    const handleResize = () => {
      const parent = canvasRef.current?.parentElement
      if (parent) {
        setDimensions({
          w: parent.clientWidth,
          h: Math.max(350, Math.min(500, parent.clientWidth * 0.6)),
        })
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Recompute layout when dimensions change
  const layoutPositions = computeLayout(nodes, dimensions.w, dimensions.h)

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = dimensions.w * dpr
    canvas.height = dimensions.h * dpr
    ctx.scale(dpr, dpr)

    const draw = (now: number) => {
      if (!ctx || !canvas) return
      const dt = (now - timeRef.current) / 1000
      timeRef.current = now

      const w = dimensions.w
      const h = dimensions.h

      // Clear
      ctx.clearRect(0, 0, w, h)

      // Draw subtle radial gradient background
      const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.5)
      bgGrad.addColorStop(0, 'rgba(17, 17, 17, 0.03)')
      bgGrad.addColorStop(1, 'rgba(17, 17, 17, 0)')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, w, h)

      // Draw edges
      edges.forEach((edge) => {
        const fromPos = layoutPositions.get(edge.from)
        const toPos = layoutPositions.get(edge.to)
        if (!fromPos || !toPos) return

        const isHovered = hoveredNode === edge.from || hoveredNode === edge.to
        const edgeWidth = 1 + (edge.count / maxEdgeCount) * 3
        const opacity = isHovered ? 0.9 : 0.2 + (edge.count / maxEdgeCount) * 0.4

        ctx.strokeStyle = `rgba(17, 17, 17, ${opacity})`
        ctx.lineWidth = edgeWidth
        ctx.setLineDash([4, 4])
        ctx.lineDashOffset = -now / 200

        ctx.beginPath()
        ctx.moveTo(fromPos.x, fromPos.y)
        ctx.lineTo(toPos.x, toPos.y)
        ctx.stroke()

        ctx.setLineDash([])

        // Draw animated particle along edge
        const particleProgress = ((now / 1500 + edges.indexOf(edge) * 0.1) % 1)
        const px = fromPos.x + (toPos.x - fromPos.x) * particleProgress
        const py = fromPos.y + (toPos.y - fromPos.y) * particleProgress

        ctx.beginPath()
        ctx.arc(px, py, 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(17, 17, 17, ${isHovered ? 0.9 : 0.5})`
        ctx.fill()

        // Draw arrowhead at the end (listener → artist direction)
        const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x)
        const arrowSize = 5
        ctx.beginPath()
        ctx.moveTo(toPos.x, toPos.y)
        ctx.lineTo(
          toPos.x - arrowSize * Math.cos(angle - 0.4),
          toPos.y - arrowSize * Math.sin(angle - 0.4)
        )
        ctx.lineTo(
          toPos.x - arrowSize * Math.cos(angle + 0.4),
          toPos.y - arrowSize * Math.sin(angle + 0.4)
        )
        ctx.closePath()
        ctx.fillStyle = `rgba(17, 17, 17, ${opacity})`
        ctx.fill()
      })

      // Draw nodes
      nodes.forEach((node) => {
        const pos = layoutPositions.get(node.address)
        if (!pos) return

        const isHovered = hoveredNode === node.address
        const nodeRadius = 8 + (node.totalPlays / maxPlays) * 16
        const pulseRadius = nodeRadius + Math.sin(now / 800 + nodes.indexOf(node)) * 2

        // Glow effect
        if (isHovered) {
          const glow = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, pulseRadius * 3)
          glow.addColorStop(0, 'rgba(17, 17, 17, 0.15)')
          glow.addColorStop(1, 'rgba(17, 17, 17, 0)')
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(pos.x, pos.y, pulseRadius * 3, 0, Math.PI * 2)
          ctx.fill()
        }

        // Node circle
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, pulseRadius, 0, Math.PI * 2)

        if (node.type === 'artist') {
          // Artist: filled black
          ctx.fillStyle = '#111111'
          ctx.fill()
          ctx.strokeStyle = '#111111'
          ctx.lineWidth = 1.5
          ctx.stroke()
        } else if (node.type === 'listener') {
          // Listener: white with black border
          ctx.fillStyle = '#F9F9F7'
          ctx.fill()
          ctx.strokeStyle = '#111111'
          ctx.lineWidth = 1.5
          ctx.stroke()
        } else {
          // Both: gray fill
          ctx.fillStyle = '#737373'
          ctx.fill()
          ctx.strokeStyle = '#111111'
          ctx.lineWidth = 1.5
          ctx.stroke()
        }

        // Label
        const label = shortAddress(node.address)
        ctx.font = '9px monospace'
        ctx.fillStyle = isHovered ? '#111111' : '#737373'
        ctx.textAlign = 'center'
        ctx.fillText(label, pos.x, pos.y + pulseRadius + 14)
      })

      rafRef.current = requestAnimationFrame(draw)
    }

    timeRef.current = performance.now()
    rafRef.current = requestAnimationFrame(draw)

    return () => cancelAnimationFrame(rafRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, dimensions, hoveredNode, layoutPositions])

  // Mouse tracking for hover
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    let found: string | null = null
    for (const node of nodes) {
      const pos = layoutPositions.get(node.address)
      if (!pos) continue
      const nodeRadius = 8 + (node.totalPlays / maxPlays) * 16
      const dist = Math.sqrt((mx - pos.x) ** 2 + (my - pos.y) ** 2)
      if (dist < nodeRadius + 10) {
        found = node.address
        break
      }
    }
    setHoveredNode(found)
  }

  if (nodes.length === 0) {
    return (
      <div className="border border-[#111111] p-8 text-center">
        <Users className="h-8 w-8 text-[#737373] mx-auto mb-3" />
        <p className="font-sans text-sm font-semibold uppercase tracking-wider mb-1">No Connections Yet</p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-[#737373]">
          Start listening to tracks to build the constellation
        </p>
      </div>
    )
  }

  return (
    <div className="border border-[#111111] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[#111111]" />
          <span className="font-sans text-xs font-medium uppercase tracking-widest">Shelby Constellation</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#737373]">
            {nodes.length} nodes · {edges.length} connections
          </span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full border border-[#111111] cursor-crosshair"
        style={{ height: dimensions.h }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredNode(null)}
      />

      {/* Legend */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full border border-[#111111] bg-[#F9F9F7]" />
            <span className="font-mono text-[8px] uppercase tracking-widest text-[#737373]">Listener</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[#111111]" />
            <span className="font-mono text-[8px] uppercase tracking-widest text-[#737373]">Artist</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[#737373]" />
            <span className="font-mono text-[8px] uppercase tracking-widest text-[#737373]">Both</span>
          </div>
        </div>
        <span className="font-mono text-[8px] uppercase tracking-widest text-[#A3A3A3]">
          {totalEvents} total listens tracked
        </span>
      </div>

      {/* Hover info */}
      {hoveredNode && (
        <div className="mt-3 border border-[#111111] p-3 bg-[#F5F5F5]">
          <div className="flex items-center justify-between">
            <div>
              <Link href={`/profile/${hoveredNode}`} className="font-mono text-[10px] uppercase tracking-widest hover:underline decoration-[#CC0000]">
                {shortAddress(hoveredNode)}
              </Link>
              <span className="font-mono text-[9px] text-[#737373] ml-2">
                {nodes.find((n) => n.address === hoveredNode)?.type === 'artist' ? 'Artist' :
                 nodes.find((n) => n.address === hoveredNode)?.type === 'listener' ? 'Listener' : 'Artist & Listener'}
              </span>
            </div>
            <span className="font-mono text-[10px] font-semibold">
              {nodes.find((n) => n.address === hoveredNode)?.totalPlays ?? 0} plays
            </span>
          </div>
          {/* Show connections */}
          <div className="mt-2 space-y-0.5">
            {edges
              .filter((e) => e.from === hoveredNode || e.to === hoveredNode)
              .slice(0, 5)
              .map((e) => {
                const other = e.from === hoveredNode ? e.to : e.from
                const direction = e.from === hoveredNode ? '→' : '←'
                return (
                  <div key={`${e.from}-${e.to}`} className="flex items-center gap-1 text-[9px] font-mono text-[#737373]">
                    <span>{shortAddress(hoveredNode)}</span>
                    <ArrowRight className="h-2.5 w-2.5" />
                    <Link href={`/profile/${other}`} className="hover:underline decoration-[#CC0000]">
                      {shortAddress(other)}
                    </Link>
                    <span className="text-[#A3A3A3]">· {e.count} listens</span>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
