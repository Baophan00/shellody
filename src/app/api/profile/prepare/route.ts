import { NextRequest, NextResponse } from 'next/server'
import {
  SHELBY_DEPLOYER,
  generateCommitments,
  createDefaultErasureCodingProvider,
  expectedTotalChunksets,
  DEFAULT_CHUNKSET_SIZE_BYTES,
} from '@shelby-protocol/sdk/node'
import { UserProfile } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { address, displayName, avatarDataUrl } = await req.json()

    if (!address || !displayName?.trim()) {
      return NextResponse.json({ error: 'address and displayName are required' }, { status: 400 })
    }

    const now = Date.now()

    const profile: UserProfile = {
      address,
      displayName: displayName.trim(),
      avatarDataUrl: avatarDataUrl ?? undefined,
      updatedAt: now,
    }

    // Exact JSON — client sends this back in commit so bytes are identical
    const profileContent = JSON.stringify(profile)
    const blobData = new TextEncoder().encode(profileContent)
    const blobName = `shellody/profile-${now}.json`
    const expirationMicros = now * 1000 + 90 * 24 * 3600 * 1_000_000

    const provider = await createDefaultErasureCodingProvider()
    const commitments = await generateCommitments(provider, blobData)
    const numChunksets = expectedTotalChunksets(blobData.length, DEFAULT_CHUNKSET_SIZE_BYTES)

    return NextResponse.json({
      profileContent,
      expirationMicros,
      encoding: 0,
      deployerAddress: SHELBY_DEPLOYER,
      profile: {
        blobName,
        merkleRootHex: commitments.blob_merkle_root,
        numChunksets,
        blobSize: blobData.length,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Prepare profile failed'
    console.error('[/api/profile/prepare]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
