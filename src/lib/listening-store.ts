// Server-only — stores who listened to which track.
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const STORE_PATH = join(process.cwd(), '.listening.json');

export interface ListenEvent {
  listenerAddress: string;
  trackId: string;
  artistAddress: string;
  timestamp: number;
}

let cache: ListenEvent[] | null = null;

function load(): ListenEvent[] {
  if (cache) return cache;
  if (existsSync(STORE_PATH)) {
    try {
      cache = JSON.parse(readFileSync(STORE_PATH, 'utf-8'));
      return cache!;
    } catch {}
  }
  cache = [];
  return cache;
}

function persist(data: ListenEvent[]) {
  try {
    writeFileSync(STORE_PATH, JSON.stringify(data));
  } catch {
    // Read-only filesystem — in-memory only.
  }
}

export function recordListen(event: ListenEvent) {
  const data = load();
  data.push(event);
  // Keep only last 500 events to avoid unbounded growth
  if (data.length > 500) {
    data.splice(0, data.length - 500);
  }
  persist(data);
}

export function getListeningStats() {
  const events = load();

  // Build nodes (unique addresses)
  const addressMap = new Map<string, { listens: number; isArtist: boolean }>();
  const edges: { from: string; to: string; count: number }[] = [];
  const edgeKey = new Map<string, number>();

  for (const ev of events) {
    // Track listener
    if (!addressMap.has(ev.listenerAddress)) {
      addressMap.set(ev.listenerAddress, { listens: 0, isArtist: false });
    }
    addressMap.get(ev.listenerAddress)!.listens++;

    // Track artist
    if (!addressMap.has(ev.artistAddress)) {
      addressMap.set(ev.artistAddress, { listens: 0, isArtist: true });
    } else {
      addressMap.get(ev.artistAddress)!.isArtist = true;
    }

    // Edge: listener → artist
    const key = `${ev.listenerAddress}→${ev.artistAddress}`;
    edgeKey.set(key, (edgeKey.get(key) ?? 0) + 1);
  }

  for (const [key, count] of edgeKey) {
    const [from, to] = key.split('→');
    edges.push({ from, to, count });
  }

  const nodes = Array.from(addressMap.entries()).map(([address, info]) => ({
    address,
    type: info.isArtist && info.listens > 0 ? 'both' as const
         : info.isArtist ? 'artist' as const
         : 'listener' as const,
    totalPlays: info.listens,
  }));

  return { nodes, edges, totalEvents: events.length };
}
