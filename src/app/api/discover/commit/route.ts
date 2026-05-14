import { NextRequest, NextResponse } from 'next/server';
import { getShelbyClient } from '@/lib/shelby-server';

const TIMEOUT_MS = 30_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms / 1000}s: ${label}`)), ms)
    ),
  ]);
}

export async function POST(req: NextRequest) {
  try {
    const { jamendoAudioUrl, audioTxHash, userAddress, blobName } = await req.json();
    if (!jamendoAudioUrl || !audioTxHash || !userAddress || !blobName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const audioRes = await fetch(jamendoAudioUrl);
    if (!audioRes.ok) throw new Error(`Failed to download audio: ${audioRes.status}`);
    const arrayBuffer = await audioRes.arrayBuffer();
    const blobData = new Uint8Array(arrayBuffer);

    const client = getShelbyClient();

    await withTimeout(
      client.aptos.waitForTransaction({ transactionHash: audioTxHash }),
      TIMEOUT_MS,
      'waitForTransaction'
    );

    await withTimeout(
      client.rpc.putBlob({ account: userAddress, blobName, blobData }),
      TIMEOUT_MS,
      'putBlob'
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Commit failed';
    console.error('[/api/discover/commit]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
