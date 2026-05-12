// Client-side Shelby Protocol upload helpers.

export interface BlobPayloadParams {
  blobName: string;
  merkleRootHex: string;
  numChunksets: number;
  blobSize: number;
}

export interface PrepareResult {
  sessionId: string;
  cid: string;
  audioUrl: string;
  expirationMicros: number;
  encoding: number;
  deployerAddress: string;
  audio: BlobPayloadParams;
  metadata: BlobPayloadParams;
}

async function apiFetch<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function prepareUpload(
  file: File,
  userAddress: string,
  trackId: string,
  title: string,
  artist: string,
  genre: string,
  coverColor: string,
  duration: number
): Promise<PrepareResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('trackId', trackId);
  form.append('userAddress', userAddress);
  form.append('title', title);
  form.append('artist', artist);
  form.append('genre', genre);
  form.append('coverColor', coverColor);
  form.append('duration', String(duration));
  return apiFetch<PrepareResult>('/api/upload/prepare', { method: 'POST', body: form });
}

export async function commitUpload(
  sessionId: string,
  audioTxHash: string,
  metadataTxHash: string,
  userAddress: string
): Promise<void> {
  await apiFetch<{ ok: boolean }>('/api/upload/commit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, audioTxHash, metadataTxHash, userAddress }),
  });
}
