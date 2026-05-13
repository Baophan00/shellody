// Server-only — never import from client components.
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const STORE_PATH = join(process.cwd(), '.plays.json');

// In-memory cache so repeated reads within a request are instant.
let cache: Record<string, number> | null = null;

function load(): Record<string, number> {
  if (cache) return cache;
  if (existsSync(STORE_PATH)) {
    try {
      cache = JSON.parse(readFileSync(STORE_PATH, 'utf-8'));
      return cache!;
    } catch {}
  }
  cache = {};
  return cache;
}

function persist(data: Record<string, number>) {
  try {
    writeFileSync(STORE_PATH, JSON.stringify(data));
  } catch {
    // Read-only filesystem (e.g. Vercel) — in-memory only, survives the process lifetime.
  }
}

export function getPlayCounts(): Record<string, number> {
  return { ...load() };
}

export function incrementPlayCount(trackId: string): number {
  const data = load();
  data[trackId] = (data[trackId] ?? 0) + 1;
  persist(data);
  return data[trackId];
}
