import { NextRequest, NextResponse } from 'next/server';
import { getPlayCounts, incrementPlayCount } from '@/lib/plays-store';

export async function GET() {
  return NextResponse.json(getPlayCounts());
}

export async function POST(req: NextRequest) {
  try {
    const { trackId } = await req.json();
    if (!trackId || typeof trackId !== 'string') {
      return NextResponse.json({ error: 'trackId required' }, { status: 400 });
    }
    const plays = incrementPlayCount(trackId);
    return NextResponse.json({ plays });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to record play';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
