'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Upload, BarChart3, User, Wallet, LogOut, Shell, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { useProfile } from '@/hooks/useProfile'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const navItems = [
  { href: '/', icon: Home, label: 'Feed' },
  { href: '/upload', icon: Upload, label: 'Upload' },
  { href: '/charts', icon: BarChart3, label: 'Universe' },
]

export function Navigation() {
  const pathname = usePathname()
  const { connected, account, connect, disconnect } = useWallet()
  const address = account?.address.toString()
  const { profile } = useProfile(connected ? address : null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#F9F9F7] border-b-4 border-[#111111]">
      {/* Edition metadata bar */}
      <div className="border-b border-[#111111] bg-[#111111]">
        <div className="mx-auto max-w-screen-xl px-4 py-1 flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#F9F9F7]">
            Vol. 1 | {today}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#F9F9F7]">
            Shelby Edition
          </span>
        </div>
      </div>

      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center border-2 border-[#111111] bg-[#111111] text-[#F9F9F7] group-hover:bg-[#F9F9F7] group-hover:text-[#111111] transition-all duration-200">
            <Shell className="h-5 w-5" />
          </div>
          <span className="font-serif text-2xl font-black tracking-tighter text-[#111111]">
            Shellody
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-xs font-sans font-medium uppercase tracking-widest transition-colors border-b-2',
                  isActive
                    ? 'text-[#111111] border-[#111111]'
                    : 'text-[#737373] border-transparent hover:text-[#111111] hover:border-[#111111]'
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
          {connected && address && (
            <Link
              href={`/profile/${address}`}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-xs font-sans font-medium uppercase tracking-widest transition-colors border-b-2',
                pathname.startsWith('/profile')
                  ? 'text-[#111111] border-[#111111]'
                  : 'text-[#737373] border-transparent hover:text-[#111111] hover:border-[#111111]'
              )}
            >
              <User className="h-3.5 w-3.5" />
              <span>Profile</span>
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {connected ? (
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 border border-[#111111] px-3 py-1.5">
                <div className="h-2 w-2 bg-[#111111]" />
                {profile?.avatarDataUrl ? (
                  <img src={profile.avatarDataUrl} alt="" className="h-5 w-5 object-cover border border-[#111111]" />
                ) : null}
                <span className={profile?.displayName ? 'font-sans text-xs font-medium uppercase tracking-wider' : 'font-mono text-xs text-[#737373]'}>
                  {profile?.displayName ?? `${address?.slice(0, 6)}...${address?.slice(-4)}`}
                </span>
              </div>
              <button
                onClick={() => disconnect()}
                className="border border-[#111111] h-9 w-9 flex items-center justify-center hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200"
                aria-label="Disconnect"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <Button
              onClick={() => connect('Petra')}
              size="sm"
              className="hidden md:inline-flex"
            >
              <Wallet className="h-3.5 w-3.5" />
              Connect
            </Button>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden border border-[#111111] h-11 w-11 flex items-center justify-center hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t-2 border-[#111111] bg-[#F9F9F7]">
          <div className="px-4 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 text-sm font-sans font-medium uppercase tracking-widest transition-colors border-l-4',
                    isActive
                      ? 'text-[#111111] border-[#111111] bg-[#E5E5E0]'
                      : 'text-[#737373] border-transparent hover:text-[#111111] hover:border-[#111111]'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
            {connected && address && (
              <Link
                href={`/profile/${address}`}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 text-sm font-sans font-medium uppercase tracking-widest transition-colors border-l-4',
                  pathname.startsWith('/profile')
                    ? 'text-[#111111] border-[#111111] bg-[#E5E5E0]'
                    : 'text-[#737373] border-transparent hover:text-[#111111] hover:border-[#111111]'
                )}
              >
                <User className="h-4 w-4" />
                Profile
              </Link>
            )}
            <div className="border-t border-[#111111] pt-3 mt-3">
              {connected ? (
                <button
                  onClick={() => { disconnect(); setMobileOpen(false) }}
                  className="flex items-center gap-3 px-3 py-3 w-full text-sm font-sans font-medium uppercase tracking-widest text-[#737373] hover:text-[#111111] transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Disconnect
                </button>
              ) : (
                <Button
                  onClick={() => { connect('Petra'); setMobileOpen(false) }}
                  className="w-full"
                >
                  <Wallet className="h-4 w-4" />
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
