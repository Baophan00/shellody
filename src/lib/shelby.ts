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
  audioBlobName: string;
  expirationMicros: number;
  encoding: number;
  deployerAddress: string;
  audio: BlobPayloadParams;
}

export interface PublishPrepareResult {
  sessionId: string;
  expirationMicros: number;
  encoding: number;
  deployerAddress: string;
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
  trackId: string
): Promise<PrepareResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('trackId', trackId);
  form.append('userAddress', userAddress);
  return apiFetch<PrepareResult>('/api/upload/prepare', { method: 'POST', body: form });
}

export async function commitUpload(
  sessionId: string,
  audioTxHash: string,
  userAddress: string
): Promise<void> {
  await apiFetch<{ ok: boolean }>('/api/upload/commit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, audioTxHash, userAddress }),
  });
}

export async function preparePublish(
  trackId: string,
  userAddress: string,
  title: string,
  artist: string,
  genre: string,
  coverColor: string,
  duration: number,
  audioUrl: string,
  blobName: string,
  cid: string
): Promise<PublishPrepareResult> {
  return apiFetch<PublishPrepareResult>('/api/publish/prepare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trackId, userAddress, title, artist, genre, coverColor, duration, audioUrl, blobName, cid }),
  });
}

export async function commitPublish(
  sessionId: string,
  metadataTxHash: string,
  userAddress: string
): Promise<void> {
  await apiFetch<{ ok: boolean }>('/api/publish/commit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, metadataTxHash, userAddress }),
  });
}
