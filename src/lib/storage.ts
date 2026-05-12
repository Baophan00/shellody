import { Track, PrivateTrack } from './types';

const TRACKS_KEY = 'shellody_tracks';

const DEMO_TRACKS: Track[] = [
  {
    id: 'demo-1',
    title: 'Neon Drift',
    artist: 'AptosBeats',
    address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    cid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    audioUrl: '/api/audio/silence',
    coverColor: 'from-violet-600 to-blue-600',
    duration: 187,
    plays: 2840,
    uploadedAt: Date.now() - 86400000 * 3,
    genre: 'Electronic',
  },
  {
    id: 'demo-2',
    title: 'Blockchain Sunrise',
    artist: 'CryptoSoul',
    address: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c',
    cid: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    audioUrl: '/api/audio/silence',
    coverColor: 'from-orange-500 to-pink-600',
    duration: 243,
    plays: 1920,
    uploadedAt: Date.now() - 86400000 * 5,
    genre: 'Ambient',
  },
  {
    id: 'demo-3',
    title: 'Decentralized Funk',
    artist: 'Web3Wave',
    address: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
    cid: 'QmZ3QaxrMNYcKV7H83HNb1RmV9ERFQUwLbGH7KpNnrHBQe',
    audioUrl: '/api/audio/silence',
    coverColor: 'from-green-500 to-teal-600',
    duration: 198,
    plays: 3150,
    uploadedAt: Date.now() - 86400000 * 2,
    genre: 'Funk',
  },
  {
    id: 'demo-4',
    title: 'Protocol Pulse',
    artist: 'AptosBeats',
    address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    cid: 'QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtioEB',
    audioUrl: '/api/audio/silence',
    coverColor: 'from-purple-600 to-indigo-700',
    duration: 221,
    plays: 987,
    uploadedAt: Date.now() - 86400000 * 7,
    genre: 'Electronic',
  },
  {
    id: 'demo-5',
    title: 'Hash Rate',
    artist: 'MintMaster',
    address: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e',
    cid: 'QmRgBnFHnksMHdMBe5F1gqzMJJLPME8kHPGAoGhwWTefxd',
    audioUrl: '/api/audio/silence',
    coverColor: 'from-red-500 to-orange-600',
    duration: 176,
    plays: 4200,
    uploadedAt: Date.now() - 86400000 * 1,
    genre: 'Hip-Hop',
  },
  {
    id: 'demo-6',
    title: 'Zero Knowledge',
    artist: 'CryptoSoul',
    address: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c',
    cid: 'QmSrPmbaUKA3ZodhzPWZnpFgkgEPgtQhkmFuGbc2vavkAh',
    audioUrl: '/api/audio/silence',
    coverColor: 'from-cyan-500 to-blue-600',
    duration: 264,
    plays: 1560,
    uploadedAt: Date.now() - 86400000 * 4,
    genre: 'Lo-Fi',
  },
  {
    id: 'demo-7',
    title: 'Gas Fee Blues',
    artist: 'Web3Wave',
    address: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
    cid: 'QmTCsWzudYhXjYdmAtNPBFcCbxrGfhPEgsPcFi6kMKFQJk',
    audioUrl: '/api/audio/silence',
    coverColor: 'from-yellow-500 to-orange-500',
    duration: 209,
    plays: 2100,
    uploadedAt: Date.now() - 86400000 * 6,
    genre: 'Jazz',
  },
  {
    id: 'demo-8',
    title: 'Shelby Storm',
    artist: 'MintMaster',
    address: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e',
    cid: 'QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn',
    audioUrl: '/api/audio/silence',
    coverColor: 'from-pink-500 to-rose-600',
    duration: 192,
    plays: 3780,
    uploadedAt: Date.now() - 86400000 * 8,
    genre: 'Electronic',
  },
];

export function getTracks(): Track[] {
  if (typeof window === 'undefined') return DEMO_TRACKS;
  const raw = localStorage.getItem(TRACKS_KEY);
  if (!raw) {
    localStorage.setItem(TRACKS_KEY, JSON.stringify(DEMO_TRACKS));
    return DEMO_TRACKS;
  }
  try {
    return JSON.parse(raw) as Track[];
  } catch {
    return DEMO_TRACKS;
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
