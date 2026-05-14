import { NextRequest, NextResponse } from 'next/server';

const CLIENT_ID = process.env.JAMENDO_CLIENT_ID ?? 'b6747d04';

export interface JamendoTrack {
  id: string;
  name: string;
  artist_name: string;
  album_name: string;
  duration: number;
  genre: string;
  audio: string;
  audiodownload: string;
  image: string;
  shareurl: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') ?? '20';
    const order = searchParams.get('order') ?? 'popularity_week';

    const tags = searchParams.get('tags') ?? '';

    const url = new URL('https://api.jamendo.com/v3.0/tracks/');
    url.searchParams.set('client_id', CLIENT_ID);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', limit);
    url.searchParams.set('order', order);
    url.searchParams.set('include', 'musicinfo');
    url.searchParams.set('audioformat', 'mp31');
    url.searchParams.set('audiodlformat', 'mp31');
    if (tags) url.searchParams.set('tags', tags);

    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`Jamendo API error: ${res.status}`);

    const data = await res.json();
    const tracks: JamendoTrack[] = (data.results ?? []).map((t: Record<string, unknown>) => {
      const musicinfo = t.musicinfo as Record<string, unknown> | undefined;
      const tags = musicinfo?.tags as Record<string, string[]> | undefined;
      return {
        id: String(t.id),
        name: String(t.name),
        artist_name: String(t.artist_name),
        album_name: String(t.album_name ?? ''),
        duration: Number(t.duration),
        genre: tags?.genres?.[0] ?? '',
        audio: String(t.audio),
        audiodownload: String(t.audiodownload ?? t.audio),
        image: String(t.image ?? ''),
        shareurl: String(t.shareurl ?? ''),
      };
    });

    return NextResponse.json({ tracks });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Discover fetch failed';
    console.error('[/api/discover]', message);
    return NextResponse.json({ error: message, tracks: [] }, { status: 500 });
  }
}
