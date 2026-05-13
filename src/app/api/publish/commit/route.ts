import { NextRequest, NextResponse } from 'next/server';
import { getShelbyClient } from '@/lib/shelby-server';

export async function POST(req: NextRequest) {
  try {
    const { metadataTxHash, userAddress, metaBlobName, metadataContent } = await req.json();

    if (!metadataTxHash || !userAddress || !metaBlobName || !metadataContent) {
      return NextResponse.json(
        { error: 'Missing metadataTxHash, userAddress, metaBlobName, or metadataContent' },
        { status: 400 }
      );
    }

    const blobData = new TextEncoder().encode(metadataContent);
    const client = getShelbyClient();
    await client.aptos.waitForTransaction({ transactionHash: metadataTxHash });
    await client.rpc.putBlob({ account: userAddress, blobName: metaBlobName, blobData });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Publish commit failed';
    console.error('[/api/publish/commit]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
