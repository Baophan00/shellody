'use client';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PlayerProvider } from '@/context/PlayerContext';
import { type ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AptosWalletAdapterProvider autoConnect={true} optInWallets={['Petra']}>
      <PlayerProvider>{children}</PlayerProvider>
    </AptosWalletAdapterProvider>
  );
}
