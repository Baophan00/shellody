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
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAptos(): any {
  if (typeof window === 'undefined') return null;
  return (window as any).aptos ?? null;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-hydrate only if Petra says it's already connected
  useEffect(() => {
    const aptos = getAptos();
    if (!aptos) return;
    aptos
      .isConnected()
      .then((yes: boolean) => (yes ? aptos.account() : null))
      .then((acc: { address: string } | null) => {
        if (acc?.address) setAddress(acc.address);
      })
      .catch(() => {});
  }, []);

  const connect = useCallback(async () => {
    setError(null);

    const aptos = getAptos();
    if (!aptos) {
      setError('Petra wallet not found — install it at petra.app');
      window.open('https://petra.app/', '_blank');
      return;
    }

    setConnecting(true);
    try {
      const res = await aptos.connect();
      if (!res?.address) throw new Error('No address returned by Petra');
      setAddress(res.address);
    } catch (err: unknown) {
      // Code 4001 = user rejected — not an error worth showing
      const code = (err as { code?: number })?.code;
      if (code !== 4001) {
        const msg =
          (err as { message?: string })?.message ?? 'Connection failed';
        setError(msg);
      }
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    const aptos = getAptos();
    try {
      await aptos?.disconnect();
    } catch {
      // ignore
    }
    setAddress(null);
    setError(null);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        connected: !!address,
        connecting,
        error,
        connect,
        disconnect,
      }}
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
