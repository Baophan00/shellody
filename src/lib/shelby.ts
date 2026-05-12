// Client-side Shelby Protocol upload helper.
// Actual storage (private key signing, ShelbyClient.upload) runs server-side
// via POST /api/upload so credentials never leave the server.

export interface UploadResult {
  cid: string;
  audioUrl: string;
  blobName: string;
}

export async function uploadToShelby(
  file: File,
  _address: string,
  trackId: string
): Promise<UploadResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('trackId', trackId);

  const res = await fetch('/api/upload', { method: 'POST', body: form });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Upload failed (${res.status})`);
  }

  return res.json() as Promise<UploadResult>;
}
