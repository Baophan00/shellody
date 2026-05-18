import { NextRequest, NextResponse } from 'next/server';
import { ShelbyBlobClient } from '@shelby-protocol/sdk/node';

export async function POST(req: NextRequest) {
  try {
    const { blobName } = await req.json();

    if (typeof blobName !== 'string' || !blobName) {
      return NextResponse.json({ error: 'Missing blobName' }, { status: 400 });
    }

    // Build the delete transaction payload using the static helper.
    // The sender of the transaction will be the blob owner.
    const txPayload = ShelbyBlobClient.createDeleteBlobPayload({
      blobName,
    });

    return NextResponse.json({
      txPayload,
      blobName,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Delete prepare failed';
    console.error('[/api/delete-track]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
