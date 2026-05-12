// Server-only helpers. Never import this from client components.
import { Account, Ed25519PrivateKey, Network } from '@aptos-labs/ts-sdk';
import { ShelbyClient } from '@shelby-protocol/sdk/node';

export function getSigner(): Account {
  const raw = process.env.SHELBY_PRIVATE_KEY;
  if (!raw) throw new Error('SHELBY_PRIVATE_KEY is not set');
  // Env format: "ed25519-priv-0x<hex>" — strip the prefix, keep "0x"
  const hex = raw.replace(/^ed25519-priv-/, '');
  const privateKey = new Ed25519PrivateKey(hex);
  return Account.fromPrivateKey({ privateKey, legacy: true });
}

export function getShelbyClient(): ShelbyClient {
  const apiKey = process.env.SHELBY_API_KEY;
  if (!apiKey) throw new Error('SHELBY_API_KEY is not set');
  return new ShelbyClient({ network: Network.SHELBYNET, apiKey });
}

export function blobNameForTrack(trackId: string, filename: string): string {
  const dot = filename.lastIndexOf('.');
  const ext = dot !== -1 ? filename.slice(dot).toLowerCase() : '';
  return `shellody/${trackId}${ext}`;
}

export function audioUrlFromBlobName(blobName: string): string {
  // e.g. "shellody/abc123.mp3" → "/api/audio/shellody/abc123.mp3"
  return `/api/audio/${blobName}`;
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
