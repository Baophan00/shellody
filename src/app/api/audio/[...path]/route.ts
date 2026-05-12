import { NextRequest, NextResponse } from 'next/server';
import {
  getSigner,
  getShelbyClient,
  mimeTypeFromBlobName,
} from '@/lib/shelby-server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // path = ['shellody', 'trackId.mp3']  →  blobName = 'shellody/trackId.mp3'
    const blobName = params.path.join('/');
    if (!blobName) {
      return NextResponse.json({ error: 'Missing blob path' }, { status: 400 });
    }

    const signer = getSigner();
    const client = getShelbyClient();

    const blob = await client.download({
      account: signer.accountAddress,
      blobName,
    });

    const mimeType = mimeTypeFromBlobName(blobName);

    return new NextResponse(blob.readable as ReadableStream, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': blob.contentLength.toString(),
        'Cache-Control': 'public, max-age=86400, immutable',
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Not found';
    console.error('[/api/audio]', message);
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
