// Shelby Protocol integration layer.
//
// Real upload flow (requires signer Account with private key):
//   import { ShelbyClient } from '@shelby-protocol/sdk/browser';
//   import { Network } from '@aptos-labs/ts-sdk';
//   const client = new ShelbyClient({ network: Network.SHELBYNET });
//   await client.upload({ blobData, signer, blobName, expirationMicros });
//
// In a Petra-wallet browser context the private key is not accessible,
// so uploads use the demo path below. Wire up a backend signer service
// or a wallet adapter that supports Aptos transaction signing to go live.

export interface UploadResult {
  cid: string;
  audioUrl: string;
  blobName: string;
}

export async function uploadToShelby(
  file: File,
  address: string,
  trackId: string
): Promise<UploadResult> {
  const blobName = `audio/${address}/${trackId}${getExtension(file.name)}`;

  // Real path: convert file to Uint8Array and call ShelbyClient.upload().
  // The download URL is served by the Shelby RPC node at:
  //   `${NetworkToShelbyRPCBaseUrl[Network.SHELBYNET]}/blob/${address}/${blobName}`
  //
  // Demo path: create a browser object URL so audio plays immediately.
  const audioUrl = URL.createObjectURL(file);

  // CID is the content-addressed key on Shelby — derive a mock one for demo.
  const mockCid = await deriveContentId(file);

  return { cid: mockCid, audioUrl, blobName };
}

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot !== -1 ? filename.slice(dot) : '';
}

async function deriveContentId(file: File): Promise<string> {
  try {
    const buf = await file.slice(0, 65536).arrayBuffer();
    const hash = await crypto.subtle.digest('SHA-256', buf);
    const hex = Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `Qm${hex.slice(0, 44)}`;
  } catch {
    return `Qm${Math.random().toString(36).slice(2).padEnd(44, '0')}`;
  }
}
