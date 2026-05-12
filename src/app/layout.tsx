import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { WalletProvider } from '@/context/WalletContext';
import { PlayerProvider } from '@/context/PlayerContext';
import Navbar from '@/components/Navbar';
import AudioPlayer from '@/components/AudioPlayer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Shellody — Decentralized Music',
  description:
    'Upload, share, and discover music stored on Shelby Protocol and the Aptos blockchain.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-white antialiased`}>
        <WalletProvider>
          <PlayerProvider>
            <Navbar />
            <main className="pt-16 pb-24 min-h-screen">{children}</main>
            <AudioPlayer />
          </PlayerProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
