import { NextRequest, NextResponse } from 'next/server';
import { getShelbyClient } from '@/lib/shelby-server';
import { consumeSession } from '@/lib/session-store';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, metadataTxHash, userAddress } = await req.json();

    if (!sessionId || !metadataTxHash || !userAddress) {
      return NextResponse.json(
        { error: 'Missing sessionId, metadataTxHash, or userAddress' },
        { status: 400 }
      );
    }

    const session = consumeSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Publish session expired or not found. Please retry.' },
        { status: 404 }
      );
    }

    const client = getShelbyClient();
    await client.aptos.waitForTransaction({ transactionHash: metadataTxHash });
    await Promise.all(
      session.blobs.map(({ blobData, blobName }) =>
        client.rpc.putBlob({ account: userAddress, blobName, blobData })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Publish commit failed';
    console.error('[/api/publish/commit]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
