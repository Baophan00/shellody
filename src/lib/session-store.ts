interface BlobEntry {
  blobData: Uint8Array;
  blobName: string;
}

interface UploadSession {
  blobs: BlobEntry[];
  expiresAt: number;
}

const store = new Map<string, UploadSession>();
const TTL_MS = 5 * 60 * 1000;

export function createSession(blobs: BlobEntry[]): string {
  const id = crypto.randomUUID();
  store.set(id, { blobs, expiresAt: Date.now() + TTL_MS });
  store.forEach((v, k) => {
    if (v.expiresAt < Date.now()) store.delete(k);
  });
  return id;
}

export function consumeSession(id: string): UploadSession | null {
  const s = store.get(id);
  if (!s) return null;
  store.delete(id);
  if (s.expiresAt < Date.now()) return null;
  return s;
}
