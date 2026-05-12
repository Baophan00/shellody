// Server-only helpers. Never import this from client components.
import { Network } from '@aptos-labs/ts-sdk';
import { ShelbyNodeClient } from '@shelby-protocol/sdk/node';

export function getShelbyClient(): ShelbyNodeClient {
  const apiKey = process.env.SHELBY_API_KEY;
  if (!apiKey) throw new Error('SHELBY_API_KEY is not set');
  return new ShelbyNodeClient({
    network: Network.TESTNET,
    apiKey,
    rpc: { apiKey },
  });
}

export function blobNameForTrack(trackId: string, filename: string): string {
  const dot = filename.lastIndexOf('.');
  const ext = dot !== -1 ? filename.slice(dot).toLowerCase() : '';
  return `shellody/${trackId}${ext}`;
}

// URL encodes the blob owner's address so the proxy can look up the right account.
export function audioUrlFromBlobName(blobName: string, ownerAddress: string): string {
  return `/api/audio/${ownerAddress}/${blobName}`;
}

export function mimeTypeFromBlobName(blobName: string): string {
  const ext = blobName.split('.').pop()?.toLowerCase() ?? '';
  return (
    {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      flac: 'audio/flac',
      ogg: 'audio/ogg',
      aac: 'audio/aac',
      m4a: 'audio/mp4',
      opus: 'audio/opus',
    }[ext] ?? 'audio/octet-stream'
  );
}

export async function contentId(data: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', data.slice(0, 65536));
  const hex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `Qm${hex.slice(0, 44)}`;
}
