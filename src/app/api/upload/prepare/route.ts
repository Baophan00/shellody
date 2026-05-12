import { NextRequest, NextResponse } from 'next/server';
import {
  SHELBY_DEPLOYER,
  generateCommitments,
  createDefaultErasureCodingProvider,
  expectedTotalChunksets,
  DEFAULT_CHUNKSET_SIZE_BYTES,
} from '@shelby-protocol/sdk/node';
import {
  blobNameForTrack,
  audioUrlFromBlobName,
  contentId,
} from '@/lib/shelby-server';
import { createSession } from '@/lib/session-store';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    const trackId = form.get('trackId');
    const userAddress = form.get('userAddress');

    if (
      !(file instanceof File) ||
      typeof trackId !== 'string' ||
      !trackId ||
      typeof userAddress !== 'string' ||
      !userAddress
    ) {
      return NextResponse.json(
        { error: 'Missing file, trackId, or userAddress' },
        { status: 400 }
      );
    }

    const blobName = blobNameForTrack(trackId, file.name);
    const arrayBuffer = await file.arrayBuffer();
    const blobData = new Uint8Array(arrayBuffer);
    const expirationMicros =
      Date.now() * 1000 + 365 * 24 * 3600 * 1_000_000;

    // Compute erasure-coded commitments (CPU-intensive, keep on server)
    const provider = await createDefaultErasureCodingProvider();
    const commitments = await generateCommitments(provider, blobData);
    const numChunksets = expectedTotalChunksets(
      blobData.length,
      DEFAULT_CHUNKSET_SIZE_BYTES
    );

    // Stash the blob bytes until the client returns with a signed tx
    const sessionId = createSession(blobData, blobName);
    const cid = await contentId(blobData);
    const audioUrl = audioUrlFromBlobName(blobName, userAddress);

    return NextResponse.json({
      sessionId,
      cid,
      blobName,
      audioUrl,
      expirationMicros,
      merkleRootHex: commitments.blob_merkle_root,
      numChunksets,
      blobSize: blobData.length,
      encoding: 0,
      deployerAddress: SHELBY_DEPLOYER,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Prepare failed';
    console.error('[/api/upload/prepare]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
