import { Track, PrivateTrack } from './types';

const TRACKS_KEY = 'shellody_tracks';

// Returns only real locally-tracked play counts — no demo seeding.
export function getTracks(): Track[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(TRACKS_KEY);
  if (!raw) return [];
  try {
    // Filter out any demo tracks that may have been seeded in previous sessions
    const parsed = JSON.parse(raw) as Track[];
    return parsed.filter((t) => !t.id.startsWith('demo-'));
  } catch {
    return [];
  }
}

export function saveTracks(tracks: Track[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TRACKS_KEY, JSON.stringify(tracks));
}

export function addTrack(track: Track): void {
  const tracks = getTracks();
  saveTracks([track, ...tracks]);
}

export function getTrackById(id: string): Track | null {
  return getTracks().find((t) => t.id === id) ?? null;
}

export function getTracksByAddress(address: string): Track[] {
  return getTracks().filter(
    (t) => t.address.toLowerCase() === address.toLowerCase()
  );
}

export function incrementPlays(id: string): void {
  const tracks = getTracks();
  const updated = tracks.map((t) =>
    t.id === id ? { ...t, plays: t.plays + 1 } : t
  );
  saveTracks(updated);
}

const PRIVATE_TRACKS_KEY = 'shellody_private_tracks';

export function getPrivateTracks(): PrivateTrack[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(PRIVATE_TRACKS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PrivateTrack[];
  } catch {
    return [];
  }
}

export function savePrivateTracks(tracks: PrivateTrack[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PRIVATE_TRACKS_KEY, JSON.stringify(tracks));
}

export function addPrivateTrack(track: PrivateTrack): void {
  savePrivateTracks([track, ...getPrivateTracks()]);
}

export function removePrivateTrack(id: string): void {
  savePrivateTracks(getPrivateTracks().filter((t) => t.id !== id));
}
