'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import WalletConnect from './WalletConnect';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

export default function Navbar() {
  const pathname = usePathname();
  const { account } = useWallet();
  const address = account?.address.toString() ?? null;

  const links = [
    { href: '/', label: 'Feed' },
    { href: '/charts', label: 'Charts' },
    { href: '/upload', label: 'Upload' },
    ...(address ? [{ href: `/profile/${address}`, label: 'Profile' }] : []),
  ];

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
            <svg
              className="w-4 h-4 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            Shellody
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  active
                    ? 'text-white bg-zinc-800 font-medium'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <WalletConnect />
      </div>
    </nav>
  );
}
