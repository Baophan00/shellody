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
  metadataBlobName,
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
    const title = form.get('title');
    const artist = form.get('artist') ?? '';
    const genre = form.get('genre') ?? '';
    const coverColor = form.get('coverColor') ?? 'from-violet-600 to-blue-600';
    const duration = Number(form.get('duration') ?? 0);

    if (
      !(file instanceof File) ||
      typeof trackId !== 'string' || !trackId ||
      typeof userAddress !== 'string' || !userAddress ||
      typeof title !== 'string' || !title
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const audioBlobName = blobNameForTrack(trackId, file.name);
    const metaBlobName = metadataBlobName(trackId);
    const audioUrl = audioUrlFromBlobName(audioBlobName, userAddress);
    const expirationMicros = Date.now() * 1000 + 365 * 24 * 3600 * 1_000_000;

    // Generate audio commitments (CPU-intensive)
    const arrayBuffer = await file.arrayBuffer();
    const audioBlobData = new Uint8Array(arrayBuffer);
    const provider = await createDefaultErasureCodingProvider();
    const audioCommitments = await generateCommitments(provider, audioBlobData);
    const audioNumChunksets = expectedTotalChunksets(audioBlobData.length, DEFAULT_CHUNKSET_SIZE_BYTES);
    const cid = await contentId(audioBlobData);

    // Build metadata JSON and generate its commitments
    const trackMetadata = {
      id: trackId,
      title,
      artist: String(artist),
      genre: String(genre) || undefined,
      address: userAddress,
      audioUrl,
      blobName: audioBlobName,
      cid,
      coverColor: String(coverColor),
      duration,
      plays: 0,
      uploadedAt: Date.now(),
    };
    const metadataBlobData = new TextEncoder().encode(JSON.stringify(trackMetadata));
    const metaCommitments = await generateCommitments(provider, metadataBlobData);
    const metaNumChunksets = expectedTotalChunksets(metadataBlobData.length, DEFAULT_CHUNKSET_SIZE_BYTES);

    const sessionId = createSession([
      { blobData: audioBlobData, blobName: audioBlobName },
      { blobData: metadataBlobData, blobName: metaBlobName },
    ]);

    return NextResponse.json({
      sessionId,
      cid,
      audioUrl,
      expirationMicros,
      encoding: 0,
      deployerAddress: SHELBY_DEPLOYER,
      audio: {
        blobName: audioBlobName,
        merkleRootHex: audioCommitments.blob_merkle_root,
        numChunksets: audioNumChunksets,
        blobSize: audioBlobData.length,
      },
      metadata: {
        blobName: metaBlobName,
        merkleRootHex: metaCommitments.blob_merkle_root,
        numChunksets: metaNumChunksets,
        blobSize: metadataBlobData.length,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Prepare failed';
    console.error('[/api/upload/prepare]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
