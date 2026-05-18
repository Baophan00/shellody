import { NextResponse } from 'next/server';
import { getListeningStats } from '@/lib/listening-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = getListeningStats();
    return NextResponse.json(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load listening stats';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
