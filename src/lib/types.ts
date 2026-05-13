export interface Track {
  id: string;
  title: string;
  artist: string;
  address: string;
  cid: string;
  audioUrl: string;
  coverColor: string;
  duration: number;
  plays: number;
  uploadedAt: number;
  txHash?: string;
  genre?: string;
}

export interface PrivateTrack {
  id: string;
  blobName: string;
  audioUrl: string;
  address: string;
  cid: string;
  coverColor: string;
  duration: number;
  uploadedAt: number;
  title: string;
  artist: string;
  genre?: string;
}
