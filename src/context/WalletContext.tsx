'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WalletContextType {
  address: string | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  connected: false,
  connecting: false,
  error: null,
  connect: () => {},
  disconnect: () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On mount: if Petra is already connected, restore the address.
  useEffect(() => {
    if (!window.aptos) return;
    window.aptos
      .isConnected()
      .then((yes) => {
        if (yes) return window.aptos!.account();
        return null;
      })
      .then((acc) => {
        if (acc?.address) setAddress(acc.address);
      })
      .catch(() => {});
  }, []);

  function connect() {
    setError(null);

    if (!window.aptos) {
      setError('Petra wallet not found. Install it at petra.app');
      return;
    }

    setConnecting(true);

    window.aptos
      .connect()
      .then((res) => {
        setAddress(res.address);
      })
      .catch((err: { code?: number; message?: string }) => {
        // 4001 = user rejected — not an error worth showing
        if (err?.code !== 4001) {
          setError(err?.message ?? 'Connection failed');
        }
      })
      .finally(() => {
        setConnecting(false);
      });
  }

  function disconnect() {
    window.aptos?.disconnect().catch(() => {});
    setAddress(null);
    setError(null);
  }

  return (
    <WalletContext.Provider
      value={{ address, connected: !!address, connecting, error, connect, disconnect }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
