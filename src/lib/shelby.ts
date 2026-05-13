export interface BlobPayloadParams {
  blobName: string;
  merkleRootHex: string;
  numChunksets: number;
  blobSize: number;
}

export interface PrepareResult {
  cid: string;
  audioUrl: string;
  audioBlobName: string;
  expirationMicros: number;
  encoding: number;
  deployerAddress: string;
  audio: BlobPayloadParams;
}

export interface PublishPrepareResult {
  metaBlobName: string;
  metadataContent: string;
  expirationMicros: number;
  encoding: number;
  deployerAddress: string;
  metadata: BlobPayloadParams;
}

export interface ProfilePrepareResult {
  profileContent: string;
  expirationMicros: number;
  encoding: number;
  deployerAddress: string;
  profile: BlobPayloadParams;
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
  file: File,
  audioTxHash: string,
  userAddress: string,
  blobName: string
): Promise<void> {
  const form = new FormData();
  form.append('file', file);
  form.append('audioTxHash', audioTxHash);
  form.append('userAddress', userAddress);
  form.append('blobName', blobName);
  await apiFetch<{ ok: boolean }>('/api/upload/commit', { method: 'POST', body: form });
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
  metadataTxHash: string,
  userAddress: string,
  metaBlobName: string,
  metadataContent: string
): Promise<void> {
  await apiFetch<{ ok: boolean }>('/api/publish/commit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metadataTxHash, userAddress, metaBlobName, metadataContent }),
  });
}

export async function prepareProfile(
  address: string,
  displayName: string,
  avatarDataUrl?: string
): Promise<ProfilePrepareResult> {
  return apiFetch<ProfilePrepareResult>('/api/profile/prepare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, displayName, avatarDataUrl }),
  });
}

export async function commitProfile(
  txHash: string,
  address: string,
  blobName: string,
  profileContent: string
): Promise<void> {
  await apiFetch<{ ok: boolean }>('/api/profile/commit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ txHash, address, blobName, profileContent }),
  });
}
