'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Upload, User, BarChart3, Wallet, LogOut, Shell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/', icon: Home, label: 'Feed' },
  { href: '/upload', icon: Upload, label: 'Upload' },
  { href: '/charts', icon: BarChart3, label: 'Charts' },
]

export function Navigation() {
  const pathname = usePathname()
  const { connected, account, connect, disconnect } = useWallet()
  const address = account?.address.toString()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Shell className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight text-primary">Shellody</span>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            )
          })}
          {connected && address && (
            <Link
              href={`/profile/${address}`}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
                pathname.startsWith('/profile')
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {connected ? (
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 sm:flex">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="font-mono text-sm text-muted-foreground">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              </div>
              <button
                onClick={() => disconnect()}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Button
              onClick={() => connect('Petra')}
              className="gap-2 bg-foreground text-background hover:bg-foreground/90"
            >
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Connect</span>
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
