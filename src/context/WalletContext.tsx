'use client';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

interface WalletContextType {
  address: string | null;
  connected: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const petra = (): any => (window as any).aptos;

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Re-hydrate from Petra if the extension was already connected
  useEffect(() => {
    if (typeof window === 'undefined' || !('aptos' in window)) return;
    petra()
      .account()
      .then((acc: { address: string }) => setAddress(acc.address))
      .catch(() => {});
  }, []);

  const connect = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (!('aptos' in window)) {
      alert(
        'Petra wallet not found. Please install the Petra browser extension.'
      );
      window.open('https://petra.app/', '_blank');
      return;
    }
    setConnecting(true);
    try {
      const res = await petra().connect();
      setAddress(res.address);
    } catch (err) {
      console.error('Wallet connect failed:', err);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (typeof window === 'undefined' || !('aptos' in window)) return;
    try {
      await petra().disconnect();
    } catch {
      // ignore
    }
    setAddress(null);
  }, []);

  return (
    <WalletContext.Provider
      value={{ address, connected: !!address, connecting, connect, disconnect }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
