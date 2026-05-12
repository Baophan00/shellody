'use client';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { shortAddress } from '@/lib/utils';

export default function WalletConnect() {
  const { account, connected, connect, disconnect, isLoading } = useWallet();
  const address = account?.address.toString() ?? null;

  if (connected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden sm:block text-xs text-zinc-400 bg-zinc-800 px-3 py-1.5 rounded-full font-mono border border-zinc-700">
          {shortAddress(address)}
        </span>
        <button
          onClick={disconnect}
          className="text-xs text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-full border border-zinc-700 hover:border-zinc-500"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => connect('Petra')}
      disabled={isLoading}
      className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
    >
      {isLoading ? 'Connecting…' : 'Connect Petra'}
    </button>
  );
}
