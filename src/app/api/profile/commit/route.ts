import { NextRequest, NextResponse } from 'next/server'
import { getShelbyClient } from '@/lib/shelby-server'

export async function POST(req: NextRequest) {
  try {
    const { txHash, address, blobName, profileContent } = await req.json()

    if (!txHash || !address || !blobName || !profileContent) {
      return NextResponse.json({ error: 'Missing txHash, address, blobName, or profileContent' }, { status: 400 })
    }

    const blobData = new TextEncoder().encode(profileContent)
    const client = getShelbyClient()
    await client.aptos.waitForTransaction({ transactionHash: txHash })
    await client.rpc.putBlob({ account: address, blobName, blobData })

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Profile commit failed'
    console.error('[/api/profile/commit]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
