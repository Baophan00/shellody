import { NextRequest, NextResponse } from 'next/server';
import { getShelbyClient } from '@/lib/shelby-server';
import { consumeSession } from '@/lib/session-store';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, txHash, userAddress, blobName } = await req.json();

    if (!sessionId || !txHash || !userAddress || !blobName) {
      return NextResponse.json(
        { error: 'Missing sessionId, txHash, userAddress, or blobName' },
        { status: 400 }
      );
    }

    const session = consumeSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Upload session expired or not found. Please retry the upload.' },
        { status: 404 }
      );
    }

    const client = getShelbyClient();

    // Wait for the on-chain registerBlob tx to be confirmed
    await client.aptos.waitForTransaction({ transactionHash: txHash });

    // Push the blob bytes to the Shelby RPC storage layer (no signing needed)
    await client.rpc.putBlob({
      account: userAddress,
      blobName,
      blobData: session.blobData,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Commit failed';
    console.error('[/api/upload/commit]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
