// Client-side Shelby Protocol upload helpers.
// Step 1: prepareUpload — sends the file server-side so commitments are generated
//         and the in-memory session is created. Returns the Move tx payload for
//         the wallet to sign.
// Step 2: commitUpload — after the wallet signs+submits the on-chain tx, notify
//         the server to upload the blob bytes to the RPC storage layer.

export interface PrepareResult {
  sessionId: string;
  cid: string;
  blobName: string;
  audioUrl: string;
  expirationMicros: number;
  merkleRootHex: string;
  numChunksets: number;
  blobSize: number;
  encoding: number;
  deployerAddress: string;
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
  return apiFetch<PrepareResult>('/api/upload/prepare', {
    method: 'POST',
    body: form,
  });
}

export async function commitUpload(
  sessionId: string,
  txHash: string,
  userAddress: string,
  blobName: string
): Promise<void> {
  await apiFetch<{ ok: boolean }>('/api/upload/commit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, txHash, userAddress, blobName }),
  });
}
