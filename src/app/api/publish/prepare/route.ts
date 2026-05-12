import { NextRequest, NextResponse } from 'next/server';
import {
  SHELBY_DEPLOYER,
  generateCommitments,
  createDefaultErasureCodingProvider,
  expectedTotalChunksets,
  DEFAULT_CHUNKSET_SIZE_BYTES,
} from '@shelby-protocol/sdk/node';
import { metadataBlobName } from '@/lib/shelby-server';
import { createSession } from '@/lib/session-store';

export async function POST(req: NextRequest) {
  try {
    const {
      trackId, userAddress, title, artist, genre,
      coverColor, duration, audioUrl, blobName, cid,
    } = await req.json();

    if (!trackId || !userAddress || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const metaBlobName = metadataBlobName(trackId);
    const expirationMicros = Date.now() * 1000 + 365 * 24 * 3600 * 1_000_000;

    const trackMetadata = {
      id: trackId,
      title,
      artist: artist || userAddress.slice(0, 8),
      genre: genre || undefined,
      address: userAddress,
      audioUrl,
      blobName,
      cid,
      coverColor,
      duration,
      plays: 0,
      uploadedAt: Date.now(),
    };

    const metadataBlobData = new TextEncoder().encode(JSON.stringify(trackMetadata));
    const provider = await createDefaultErasureCodingProvider();
    const metaCommitments = await generateCommitments(provider, metadataBlobData);
    const metaNumChunksets = expectedTotalChunksets(metadataBlobData.length, DEFAULT_CHUNKSET_SIZE_BYTES);

    const sessionId = createSession([{ blobData: metadataBlobData, blobName: metaBlobName }]);

    return NextResponse.json({
      sessionId,
      expirationMicros,
      encoding: 0,
      deployerAddress: SHELBY_DEPLOYER,
      metadata: {
        blobName: metaBlobName,
        merkleRootHex: metaCommitments.blob_merkle_root,
        numChunksets: metaNumChunksets,
        blobSize: metadataBlobData.length,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Prepare publish failed';
    console.error('[/api/publish/prepare]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
