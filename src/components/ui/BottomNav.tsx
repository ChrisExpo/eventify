'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { House, Plus, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function BottomNav() {
  const pathname = usePathname()

  // Nascondere su /evento/[slug] (ma NON su /evento/[slug]/modifica)
  const isEventDetail = /^\/evento\/[^/]+$/.test(pathname)
  if (isEventDetail) return null

  const isHome = pathname === '/'
  const isCrea = pathname === '/crea'
  const isProfilo = pathname === '/profilo'

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-background/80 backdrop-blur-xl border-t border-primary/10 shadow-[0_0_20px_rgba(211,148,255,0.1)]"
      role="navigation"
      aria-label="Navigazione principale"
    >
      <div className="flex items-end justify-around h-16 px-6 pb-[env(safe-area-inset-bottom)] max-w-lg mx-auto">
        {/* Home */}
        <Link
          href="/"
          className={cn(
            'flex flex-col items-center justify-center gap-0.5 py-2 px-3 transition-all',
            isHome ? 'text-primary' : 'text-on-surface-variant/60 hover:text-on-surface-variant'
          )}
        >
          <House size={22} className={cn(isHome && 'drop-shadow-[0_0_8px_rgba(211,148,255,0.5)]')} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
        </Link>

        {/* Crea - Pill prominente */}
        <Link
          href="/crea"
          className={cn(
            'flex items-center justify-center -mt-5',
            'w-14 h-14 rounded-full',
            'bg-gradient-to-br from-primary to-primary-dim',
            'text-white',
            'shadow-[0_0_25px_rgba(211,148,255,0.4)]',
            'active:scale-90 hover:scale-105 transition-all',
            isCrea && 'ring-2 ring-primary/50 ring-offset-2 ring-offset-background'
          )}
          aria-label="Crea evento"
        >
          <Plus size={26} strokeWidth={2.5} />
        </Link>

        {/* Profilo */}
        <Link
          href="/profilo"
          className={cn(
            'flex flex-col items-center justify-center gap-0.5 py-2 px-3 transition-all',
            isProfilo ? 'text-primary' : 'text-on-surface-variant/60 hover:text-on-surface-variant'
          )}
        >
          <User size={22} className={cn(isProfilo && 'drop-shadow-[0_0_8px_rgba(211,148,255,0.5)]')} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Profilo</span>
        </Link>
      </div>
    </nav>
  )
}
