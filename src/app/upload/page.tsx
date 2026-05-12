'use client';
import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { addPrivateTrack } from '@/lib/storage';
import { prepareUpload, commitUpload, BlobPayloadParams } from '@/lib/shelby';
import { generateId } from '@/lib/utils';

const COVER_COLORS = [
  'from-violet-600 to-blue-600',
  'from-orange-500 to-pink-600',
  'from-green-500 to-teal-600',
  'from-purple-600 to-indigo-700',
  'from-red-500 to-orange-600',
  'from-cyan-500 to-blue-600',
  'from-yellow-500 to-orange-500',
  'from-pink-500 to-rose-600',
];

type Status = 'idle' | 'preparing' | 'signing' | 'uploading' | 'saving' | 'done';

function hexToBytes(hex: string): Uint8Array {
  const h = hex.replace(/^0x/, '');
  const bytes = new Uint8Array(h.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function buildRegisterPayload(
  deployerAddress: string,
  params: BlobPayloadParams,
  expirationMicros: number,
  encoding: number
) {
  return {
    function: `${deployerAddress}::blob_metadata::register_blob` as `${string}::${string}::${string}`,
    functionArguments: [
      params.blobName,
      expirationMicros,
      hexToBytes(params.merkleRootHex),
      params.numChunksets,
      params.blobSize,
      0,
      encoding,
    ],
  };
}

export default function UploadPage() {
  const { account, connected, connect, signAndSubmitTransaction } = useWallet();
  const address = account?.address.toString() ?? null;
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileDuration, setFileDuration] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const loadFile = useCallback((f: File) => {
    setFile(f);
    const audio = new Audio();
    const url = URL.createObjectURL(f);
    audio.src = url;
    audio.onloadedmetadata = () => {
      setFileDuration(Math.floor(audio.duration));
      URL.revokeObjectURL(url);
    };
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) loadFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith('audio/')) loadFile(f);
  };

  const handleUpload = async () => {
    if (!file || !address) return;
    setError('');
    const trackId = generateId();
    const coverColor = COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)];

    try {
      setStatus('preparing');
      const prep = await prepareUpload(file, address, trackId);

      setStatus('signing');
      const audioTx = await signAndSubmitTransaction({
        data: buildRegisterPayload(
          prep.deployerAddress,
          prep.audio,
          prep.expirationMicros,
          prep.encoding
        ),
      });

      setStatus('uploading');
      await commitUpload(prep.sessionId, audioTx.hash, address);

      setStatus('saving');
      addPrivateTrack({
        id: trackId,
        blobName: prep.audioBlobName,
        audioUrl: prep.audioUrl,
        address,
        cid: prep.cid,
        coverColor,
        duration: fileDuration,
        uploadedAt: Date.now(),
      });

      setStatus('done');
      router.push(`/profile/${address}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
      setStatus('idle');
    }
  };

  if (!connected) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-blue-600 mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-violet-900/50">
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Connect Your Wallet</h2>
        <p className="text-zinc-400 mb-8 leading-relaxed">
          Connect your Petra wallet to sign uploads and pay your own ShelbyUSD storage fees on Aptos Testnet.
        </p>
        <button
          onClick={() => connect('Petra')}
          className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-3 rounded-full transition-colors shadow-lg shadow-violet-900/40"
        >
          Connect Petra Wallet
        </button>
      </div>
    );
  }

  const busy = status !== 'idle';

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">Upload Track</h1>
      <p className="text-zinc-400 mb-2">
        Stored on <span className="text-violet-400">Shelby Protocol</span> — one Petra approval required.
      </p>
      <p className="text-zinc-600 text-sm mb-8">
        After uploading, go to your profile to add a title and make it public.
      </p>

      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !busy && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center mb-6 transition-colors ${
          busy ? 'cursor-default opacity-60' : 'cursor-pointer hover:border-violet-500/70'
        } ${file ? 'border-violet-500/60 bg-violet-500/5' : 'border-zinc-700 bg-zinc-900/50'}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.flac,.ogg,.aac"
          onChange={onFileChange}
          className="hidden"
        />
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center mb-1">
              <svg className="w-7 h-7 text-violet-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
              </svg>
            </div>
            <p className="text-white font-medium">{file.name}</p>
            <p className="text-zinc-500 text-sm">
              {(file.size / 1024 / 1024).toFixed(2)} MB
              {fileDuration > 0 && (
                <> &middot; {Math.floor(fileDuration / 60)}:{String(fileDuration % 60).padStart(2, '0')}</>
              )}
            </p>
            {!busy && <span className="text-xs text-violet-400 mt-1">Click to change file</span>}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center mb-1">
              <svg className="w-7 h-7 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-zinc-300 font-medium">Drop audio file here</p>
            <p className="text-zinc-500 text-sm">MP3, WAV, FLAC, OGG, AAC supported</p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {busy && (
        <div className="flex items-center gap-3 bg-zinc-900 rounded-xl px-4 py-3 mb-4">
          <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin shrink-0" />
          <span className="text-zinc-300 text-sm">
            {status === 'preparing' && 'Computing storage commitments…'}
            {status === 'signing' && 'Approve audio registration in Petra…'}
            {status === 'uploading' && 'Uploading to Shelby Protocol…'}
            {status === 'saving' && 'Saving track…'}
            {status === 'done' && 'Done! Redirecting to your profile…'}
          </span>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || busy}
        className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-full transition-colors shadow-lg shadow-violet-900/30"
      >
        Upload to Shellody
      </button>
    </div>
  );
}
