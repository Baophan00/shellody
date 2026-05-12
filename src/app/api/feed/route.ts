import { NextRequest, NextResponse } from 'next/server';
import { getShelbyClient } from '@/lib/shelby-server';
import { Order_By } from '@shelby-protocol/sdk/node';
import { Track } from '@/lib/types';

// List all track metadata blobs across every user's account and return them
// as Track objects. Optionally filter by ?address= for a profile feed.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const addressFilter = searchParams.get('address');

    const client = getShelbyClient();

    const where = addressFilter
      ? {
          blob_name: { _like: '%/shellody/tracks/%.json' },
          owner: { _eq: addressFilter },
        }
      : { blob_name: { _like: '%/shellody/tracks/%.json' } };

    const blobs = await client.coordination.getBlobs({
      where,
      orderBy: { blob_name: Order_By.Desc },
    });

    const written = blobs.filter((b) => b.isWritten && !b.isDeleted);

    const tracks = (
      await Promise.allSettled(
        written.map(async (blobMeta) => {
          const blob = await client.download({
            account: blobMeta.owner.toString(),
            blobName: blobMeta.blobNameSuffix,
          });
          const text = await new Response(blob.readable as ReadableStream).text();
          return JSON.parse(text) as Track;
        })
      )
    )
      .filter(
        (r): r is PromiseFulfilledResult<Track> => r.status === 'fulfilled'
      )
      .map((r) => r.value)
      .sort((a, b) => b.uploadedAt - a.uploadedAt);

    return NextResponse.json({ tracks });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Feed fetch failed';
    console.error('[/api/feed]', message);
    return NextResponse.json({ error: message, tracks: [] }, { status: 500 });
  }
}
