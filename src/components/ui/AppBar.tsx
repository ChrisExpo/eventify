'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppBarProps {
  title?: string
  showBack?: boolean
  rightAction?: React.ReactNode
  className?: string
}

export default function AppBar({ title, showBack = false, rightAction, className }: AppBarProps) {
  const router = useRouter()

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 h-14',
      'bg-background/60 backdrop-blur-xl',
      'border-b border-primary/10',
      'shadow-[0_0_20px_rgba(211,148,255,0.1)]',
      'flex items-center px-4',
      'pt-[env(safe-area-inset-top)]',
      className
    )}>
      <div className="flex items-center justify-between w-full max-w-lg mx-auto">
        {/* Left */}
        <div className="w-10">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-full text-primary hover:bg-surface-container active:scale-95 transition-all"
              aria-label="Indietro"
            >
              <ArrowLeft size={20} />
            </button>
          )}
        </div>
        {/* Center */}
        <div className="flex-1 text-center">
          {title ? (
            <h1 className="text-sm font-bold font-headline text-on-surface truncate">{title}</h1>
          ) : (
            <span className="text-lg font-bold font-headline bg-gradient-to-r from-primary to-primary-dim bg-clip-text text-transparent">
              Eventify
            </span>
          )}
        </div>
        {/* Right */}
        <div className="w-10 flex justify-end">
          {rightAction}
        </div>
      </div>
    </header>
  )
}
