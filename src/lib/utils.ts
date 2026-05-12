export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function shortAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr ?? '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
