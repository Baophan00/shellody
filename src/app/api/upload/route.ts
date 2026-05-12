import { NextRequest, NextResponse } from 'next/server';
import {
  getSigner,
  getShelbyClient,
  blobNameForTrack,
  audioUrlFromBlobName,
  contentId,
} from '@/lib/shelby-server';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    const trackId = form.get('trackId');

    if (!(file instanceof File) || typeof trackId !== 'string' || !trackId) {
      return NextResponse.json(
        { error: 'Missing or invalid file / trackId' },
        { status: 400 }
      );
    }

    const signer = getSigner();
    const client = getShelbyClient();

    const blobName = blobNameForTrack(trackId, file.name);
    const arrayBuffer = await file.arrayBuffer();
    const blobData = new Uint8Array(arrayBuffer);

    // Expire 1 year from now (microseconds since Unix epoch)
    const expirationMicros = Date.now() * 1000 + 365 * 24 * 3600 * 1_000_000;

    await client.upload({ blobData, signer, blobName, expirationMicros });

    const cid = await contentId(blobData);
    const audioUrl = audioUrlFromBlobName(blobName);

    return NextResponse.json({
      cid,
      blobName,
      audioUrl,
      signerAddress: signer.accountAddress.toString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    console.error('[/api/upload]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
