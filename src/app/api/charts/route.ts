import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Track } from '@/lib/types';

interface ChartEntry {
  rank: number;
  id: string;
  reason: string;
}

export async function POST(req: NextRequest) {
  try {
    const { tracks }: { tracks: Track[] } = await req.json();

    if (!tracks || tracks.length === 0) {
      return NextResponse.json({ chart: [] });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    // Pre-sort by plays so Claude has context; send at most 20 tracks
    const candidates = [...tracks]
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 20);

    const trackLines = candidates
      .map(
        (t, i) =>
          `${i + 1}. id="${t.id}" | "${t.title}" by ${t.artist || t.address.slice(0, 8)} | ${t.plays.toLocaleString()} plays | genre: ${t.genre ?? 'unknown'} | duration: ${Math.floor(t.duration / 60)}:${String(t.duration % 60).padStart(2, '0')}`
      )
      .join('\n');

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system:
        'You are a chart curator for Shellody, a decentralized music platform on Aptos. ' +
        'Rank tracks by appeal, novelty, and engagement. ' +
        'Return ONLY valid JSON — no markdown, no explanation, no extra text.',
      messages: [
        {
          role: 'user',
          content: `Produce a top-10 chart from these tracks. For each entry write a punchy reason (≤12 words). Return JSON exactly matching this shape:\n{"chart":[{"rank":1,"id":"...","reason":"..."}]}\n\nTracks:\n${trackLines}`,
        },
      ],
    });

    const raw =
      message.content[0].type === 'text' ? message.content[0].text.trim() : '';

    // Strip accidental markdown code fences if present
    const json = raw.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '');
    const parsed: { chart: ChartEntry[] } = JSON.parse(json);

    const chart = parsed.chart
      .map((entry) => {
        const track = candidates.find((t) => t.id === entry.id);
        return track ? { rank: entry.rank, track, reason: entry.reason } : null;
      })
      .filter(Boolean);

    return NextResponse.json({ chart });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/charts]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
