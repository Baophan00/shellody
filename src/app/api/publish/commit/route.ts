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
    const { metadataTxHash, userAddress, metaBlobName, metadataContent } = await req.json();

    if (!metadataTxHash || !userAddress || !metaBlobName || !metadataContent) {
      return NextResponse.json(
        { error: 'Missing metadataTxHash, userAddress, metaBlobName, or metadataContent' },
        { status: 400 }
      );
    }

    const blobData = new TextEncoder().encode(metadataContent);
    const client = getShelbyClient();

    await withTimeout(
      client.aptos.waitForTransaction({ transactionHash: metadataTxHash }),
      TIMEOUT_MS,
      'waitForTransaction'
    );

    await withTimeout(
      client.rpc.putBlob({ account: userAddress, blobName: metaBlobName, blobData }),
      TIMEOUT_MS,
      'putBlob'
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Publish commit failed';
    console.error('[/api/publish/commit]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
