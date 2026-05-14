import { NextRequest, NextResponse } from 'next/server';
import {
  SHELBY_DEPLOYER,
  generateCommitments,
  createDefaultErasureCodingProvider,
  expectedTotalChunksets,
  DEFAULT_CHUNKSET_SIZE_BYTES,
} from '@shelby-protocol/sdk/node';
import { audioUrlFromBlobName, contentId } from '@/lib/shelby-server';

export async function POST(req: NextRequest) {
  try {
    const { jamendoAudioUrl, trackId, userAddress } = await req.json();
    if (!jamendoAudioUrl || !trackId || !userAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const audioRes = await fetch(jamendoAudioUrl);
    if (!audioRes.ok) throw new Error(`Failed to download audio: ${audioRes.status}`);
    const arrayBuffer = await audioRes.arrayBuffer();
    const blobData = new Uint8Array(arrayBuffer);

    const blobName = `shellody/${trackId}.mp3`;
    const audioUrl = audioUrlFromBlobName(blobName, userAddress);
    const expirationMicros = Date.now() * 1000 + 90 * 24 * 3600 * 1_000_000;

    const provider = await createDefaultErasureCodingProvider();
    const commitments = await generateCommitments(provider, blobData);
    const numChunksets = expectedTotalChunksets(blobData.length, DEFAULT_CHUNKSET_SIZE_BYTES);
    const cid = await contentId(blobData);

    return NextResponse.json({
      cid,
      audioUrl,
      audioBlobName: blobName,
      expirationMicros,
      encoding: 0,
      deployerAddress: SHELBY_DEPLOYER,
      audio: {
        blobName,
        merkleRootHex: commitments.blob_merkle_root,
        numChunksets,
        blobSize: blobData.length,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Prepare failed';
    console.error('[/api/discover/prepare]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
