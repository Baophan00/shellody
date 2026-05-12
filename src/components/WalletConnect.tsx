'use client';
import { useWallet } from '@/context/WalletContext';
import { shortAddress } from '@/lib/utils';

export default function WalletConnect() {
  const { address, connected, connecting, error, connect, disconnect } =
    useWallet();

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
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={connect}
        disabled={connecting}
        className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
      >
        {connecting ? 'Connecting…' : 'Connect Petra'}
      </button>

      {error && (
        <span className="text-xs text-red-400 max-w-[200px] text-right leading-tight">
          {error}
        </span>
      )}
    </div>
  );
}
