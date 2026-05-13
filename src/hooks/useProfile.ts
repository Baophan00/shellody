'use client'

import { useState, useEffect } from 'react'
import { UserProfile } from '@/lib/types'

// Module-level cache — warm for the whole session
const cache = new Map<string, UserProfile | null>()
const inflight = new Map<string, Promise<UserProfile | null>>()

async function fetchProfile(address: string): Promise<UserProfile | null> {
  if (cache.has(address)) return cache.get(address)!
  if (inflight.has(address)) return inflight.get(address)!

  const p = fetch(`/api/profile?address=${encodeURIComponent(address)}`)
    .then((r) => (r.ok ? r.json() : { profile: null }))
    .then((d: { profile: UserProfile | null }) => d.profile ?? null)
    .catch(() => null)
    .finally(() => inflight.delete(address))

  inflight.set(address, p)
  const result = await p
  cache.set(address, result)
  return result
}

export function invalidateProfile(address: string) {
  cache.delete(address)
  inflight.delete(address)
}

export function setCachedProfile(address: string, profile: UserProfile) {
  cache.set(address, profile)
}

export function useProfile(address: string | null | undefined) {
  const key = address ?? ''

  const [profile, setProfile] = useState<UserProfile | null>(
    key && cache.has(key) ? cache.get(key)! : null
  )
  const [loading, setLoading] = useState(!!key && !cache.has(key))

  useEffect(() => {
    if (!key) {
      setProfile(null)
      setLoading(false)
      return
    }
    if (cache.has(key)) {
      setProfile(cache.get(key)!)
      setLoading(false)
      return
    }
    setLoading(true)
    fetchProfile(key).then((p) => {
      setProfile(p)
      setLoading(false)
    })
  }, [key])

  const refetch = () => {
    if (!key) return
    invalidateProfile(key)
    setLoading(true)
    fetchProfile(key).then((p) => {
      setProfile(p)
      setLoading(false)
    })
  }

  return { profile, loading, refetch }
}
