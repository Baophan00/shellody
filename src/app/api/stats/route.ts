import { NextRequest, NextResponse } from 'next/server';
import { getShelbyClient } from '@/lib/shelby-server';
import { getPlayCounts } from '@/lib/plays-store';
import { Order_By } from '@shelby-protocol/sdk/node';
import { Track } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const client = getShelbyClient();

    const blobs = await client.coordination.getBlobs({
      where: { blob_name: { _like: '%/shellody/tracks/%.json' } },
      orderBy: { blob_name: Order_By.Desc },
    });

    const written = blobs.filter((b) => b.isWritten && !b.isDeleted);
    const playCounts = getPlayCounts();

    const tracks = (
      await Promise.allSettled(
        written.map(async (blobMeta) => {
          const blob = await client.download({
            account: blobMeta.owner.toString(),
            blobName: blobMeta.blobNameSuffix,
          });
          const text = await new Response(blob.readable as ReadableStream).text();
          const track = JSON.parse(text) as Track;
          return { ...track, plays: playCounts[track.id] ?? track.plays };
        })
      )
    )
      .filter(
        (r): r is PromiseFulfilledResult<Track> => r.status === 'fulfilled'
      )
      .map((r) => r.value);

    // Compute stats
    const totalTracks = tracks.length;
    const totalPlays = tracks.reduce((sum: number, t: Track) => sum + (t.plays ?? 0), 0);
    const uniqueArtists = new Set(tracks.map((t: Track) => t.address?.toLowerCase()).filter(Boolean)).size;

    // Genre distribution
    const genreMap: Record<string, number> = {};
    tracks.forEach((t: Track) => {
      const g = t.genre || 'Unknown';
      genreMap[g] = (genreMap[g] || 0) + 1;
    });
    const genreDistribution = Object.entries(genreMap)
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count);

    // Top tracks by plays
    const topTracks = [...tracks]
      .sort((a: Track, b: Track) => (b.plays ?? 0) - (a.plays ?? 0))
      .slice(0, 10);

    // Recent activity (last 10 uploaded)
    const recentTracks = [...tracks]
      .sort((a: Track, b: Track) => (b.uploadedAt ?? 0) - (a.uploadedAt ?? 0))
      .slice(0, 10);

    // Top uploaders
    const uploaderMap: Record<string, number> = {};
    tracks.forEach((t: Track) => {
      const addr = t.address?.toLowerCase();
      if (addr) uploaderMap[addr] = (uploaderMap[addr] || 0) + 1;
    });
    const topUploaders = Object.entries(uploaderMap)
      .map(([address, count]) => ({ address, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      totalTracks,
      totalPlays,
      uniqueArtists,
      genreDistribution,
      topTracks,
      recentTracks,
      topUploaders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stats fetch failed';
    console.error('[/api/stats]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
