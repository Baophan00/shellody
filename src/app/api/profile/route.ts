import { NextRequest, NextResponse } from 'next/server'
import { getShelbyClient } from '@/lib/shelby-server'
import { Order_By } from '@shelby-protocol/sdk/node'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')
  if (!address) return NextResponse.json({ profile: null })

  try {
    const client = getShelbyClient()

    // Query for all profile blobs for this address (timestamped names)
    const blobs = await client.coordination.getBlobs({
      where: {
        blob_name: { _like: '%/shellody/profile-%.json' },
        owner: { _eq: address },
      },
      orderBy: { blob_name: Order_By.Desc }, // descending → most recent first
    })

    const latest = blobs.find((b) => b.isWritten && !b.isDeleted)
    if (!latest) return NextResponse.json({ profile: null })

    const blob = await client.download({
      account: address,
      blobName: latest.blobNameSuffix,
    })
    const text = await new Response(blob.readable as ReadableStream).text()
    const profile = JSON.parse(text)
    return NextResponse.json({ profile })
  } catch {
    return NextResponse.json({ profile: null })
  }
}
