import { NextRequest, NextResponse } from 'next/server';
import { getShelbyClient, mimeTypeFromBlobName } from '@/lib/shelby-server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // URL format: /api/audio/{ownerAddress}/shellody/{trackId}.mp3
    // params.path = ['0x123...', 'shellody', 'trackId.mp3']
    const [ownerAddress, ...rest] = params.path;
    const blobName = rest.join('/');

    if (!ownerAddress || !blobName) {
      return NextResponse.json(
        { error: 'Missing owner address or blob path' },
        { status: 400 }
      );
    }

    const client = getShelbyClient();

    const blob = await client.download({
      account: ownerAddress,
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
