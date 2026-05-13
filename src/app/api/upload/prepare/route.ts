import { NextRequest, NextResponse } from 'next/server';
import {
  SHELBY_DEPLOYER,
  generateCommitments,
  createDefaultErasureCodingProvider,
  expectedTotalChunksets,
  DEFAULT_CHUNKSET_SIZE_BYTES,
} from '@shelby-protocol/sdk/node';
import { blobNameForTrack, audioUrlFromBlobName, contentId } from '@/lib/shelby-server';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    const trackId = form.get('trackId');
    const userAddress = form.get('userAddress');

    if (
      !(file instanceof File) ||
      typeof trackId !== 'string' || !trackId ||
      typeof userAddress !== 'string' || !userAddress
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const audioBlobName = blobNameForTrack(trackId, file.name);
    const audioUrl = audioUrlFromBlobName(audioBlobName, userAddress);
    const expirationMicros = Date.now() * 1000 + 90 * 24 * 3600 * 1_000_000;

    const arrayBuffer = await file.arrayBuffer();
    const audioBlobData = new Uint8Array(arrayBuffer);
    const provider = await createDefaultErasureCodingProvider();
    const audioCommitments = await generateCommitments(provider, audioBlobData);
    const audioNumChunksets = expectedTotalChunksets(audioBlobData.length, DEFAULT_CHUNKSET_SIZE_BYTES);
    const cid = await contentId(audioBlobData);

    return NextResponse.json({
      cid,
      audioUrl,
      audioBlobName,
      expirationMicros,
      encoding: 0,
      deployerAddress: SHELBY_DEPLOYER,
      audio: {
        blobName: audioBlobName,
        merkleRootHex: audioCommitments.blob_merkle_root,
        numChunksets: audioNumChunksets,
        blobSize: audioBlobData.length,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Prepare failed';
    console.error('[/api/upload/prepare]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
