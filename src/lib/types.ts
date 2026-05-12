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
