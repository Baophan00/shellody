'use client';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { Network } from '@aptos-labs/ts-sdk';
import { PlayerProvider } from '@/context/PlayerContext';
import { type ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      optInWallets={['Petra']}
      dappConfig={{ network: Network.TESTNET }}
      onError={(error) => console.error('[WalletAdapter]', error)}
    >
      <PlayerProvider>{children}</PlayerProvider>
    </AptosWalletAdapterProvider>
  );
}
