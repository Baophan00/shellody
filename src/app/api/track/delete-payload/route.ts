import { NextRequest, NextResponse } from 'next/server';
import { getShelbyClient } from '@/lib/shelby-server';
import { SHELBY_DEPLOYER } from '@shelby-protocol/sdk/node';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const trackId = searchParams.get('trackId');
  const address = searchParams.get('address');

  if (!trackId || !address) {
    return NextResponse.json({ error: 'trackId and address required' }, { status: 400 });
  }

  try {
    const client = getShelbyClient();
    const blobs = await client.coordination.getBlobs({
      where: {
        blob_name: { _like: `%/shellody/tracks/${trackId}-%.json` },
        owner: { _eq: address },
      },
    });

    const meta = blobs.find((b) => b.isWritten && !b.isDeleted);
    if (!meta) {
      return NextResponse.json({ error: 'Track metadata blob not found' }, { status: 404 });
    }

    return NextResponse.json({ blobName: meta.blobNameSuffix, deployerAddress: SHELBY_DEPLOYER });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch blob info';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
