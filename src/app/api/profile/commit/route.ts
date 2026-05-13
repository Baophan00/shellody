import { NextRequest, NextResponse } from 'next/server'
import { getShelbyClient } from '@/lib/shelby-server'

const TIMEOUT_MS = 30_000

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms / 1000}s: ${label}`)), ms)
    ),
  ])
}

export async function POST(req: NextRequest) {
  try {
    const { txHash, address, blobName, profileContent } = await req.json()

    if (!txHash || !address || !blobName || !profileContent) {
      return NextResponse.json({ error: 'Missing txHash, address, blobName, or profileContent' }, { status: 400 })
    }

    const blobData = new TextEncoder().encode(profileContent)
    const client = getShelbyClient()

    await withTimeout(
      client.aptos.waitForTransaction({ transactionHash: txHash }),
      TIMEOUT_MS,
      'waitForTransaction'
    )

    await withTimeout(
      client.rpc.putBlob({ account: address, blobName, blobData }),
      TIMEOUT_MS,
      'putBlob'
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Profile commit failed'
    console.error('[/api/profile/commit]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
