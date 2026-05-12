import { NextResponse } from 'next/server';

// Returns a 1-second silent WAV (8-bit unsigned PCM, 8 kHz, mono).
// Demo tracks use this so the audio element always has a valid src.
export async function GET() {
  const sampleRate = 8000;
  const numSamples = sampleRate;
  const dataSize = numSamples;
  const fileSize = 44 + dataSize;

  const buf = new ArrayBuffer(fileSize);
  const v = new DataView(buf);

  const str = (s: string, offset: number) => {
    for (let i = 0; i < s.length; i++) v.setUint8(offset + i, s.charCodeAt(i));
  };

  str('RIFF', 0);
  v.setUint32(4, fileSize - 8, true);
  str('WAVE', 8);
  str('fmt ', 12);
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);  // PCM
  v.setUint16(22, 1, true);  // mono
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate, true); // byte rate = sampleRate * 1ch * 1byte
  v.setUint16(32, 1, true);  // block align
  v.setUint16(34, 8, true);  // bits per sample
  str('data', 36);
  v.setUint32(40, dataSize, true);
  // 0x80 = zero-amplitude in unsigned 8-bit PCM
  for (let i = 44; i < fileSize; i++) v.setUint8(i, 128);

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'audio/wav',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
