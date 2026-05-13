import { NextRequest, NextResponse } from 'next/server';
import { getShelbyClient } from '@/lib/shelby-server';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    const audioTxHash = form.get('audioTxHash');
    const userAddress = form.get('userAddress');
    const blobName = form.get('blobName');

    if (
      !(file instanceof File) ||
      typeof audioTxHash !== 'string' || !audioTxHash ||
      typeof userAddress !== 'string' || !userAddress ||
      typeof blobName !== 'string' || !blobName
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const blobData = new Uint8Array(arrayBuffer);

    const client = getShelbyClient();
    await client.aptos.waitForTransaction({ transactionHash: audioTxHash });
    await client.rpc.putBlob({ account: userAddress, blobName, blobData });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Commit failed';
    console.error('[/api/upload/commit]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
