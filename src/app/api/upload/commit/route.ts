import { NextRequest, NextResponse } from 'next/server';
import { getShelbyClient } from '@/lib/shelby-server';
import { consumeSession } from '@/lib/session-store';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, audioTxHash, metadataTxHash, userAddress } = await req.json();

    if (!sessionId || !audioTxHash || !metadataTxHash || !userAddress) {
      return NextResponse.json(
        { error: 'Missing sessionId, audioTxHash, metadataTxHash, or userAddress' },
        { status: 400 }
      );
    }

    const session = consumeSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Upload session expired or not found. Please retry.' },
        { status: 404 }
      );
    }

    const client = getShelbyClient();

    // Wait for both on-chain transactions to be confirmed concurrently
    await Promise.all([
      client.aptos.waitForTransaction({ transactionHash: audioTxHash }),
      client.aptos.waitForTransaction({ transactionHash: metadataTxHash }),
    ]);

    // Push both blobs to the Shelby RPC storage layer concurrently
    await Promise.all(
      session.blobs.map(({ blobData, blobName }) =>
        client.rpc.putBlob({ account: userAddress, blobName, blobData })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Commit failed';
    console.error('[/api/upload/commit]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
