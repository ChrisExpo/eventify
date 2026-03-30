'use client'
import { cn } from '@/lib/utils'
import { Pencil } from 'lucide-react'
import Link from 'next/link'

interface FABProps {
  href: string
  icon?: React.ReactNode
  className?: string
  label?: string
}

export default function FAB({ href, icon, className, label = 'Modifica' }: FABProps) {
  return (
    <Link
      href={href}
      className={cn(
        'fixed z-40 w-14 h-14 rounded-full',
        'bg-gradient-to-br from-primary to-primary-dim',
        'text-white',
        'shadow-[0_0_30px_rgba(211,148,255,0.4)]',
        'flex items-center justify-center',
        'active:scale-90 hover:scale-105 transition-all',
        'group',
        className
      )}
      aria-label={label}
    >
      {icon || <Pencil size={22} />}
      {/* Tooltip on hover */}
      <span className="absolute right-16 bg-surface-container-highest text-on-surface px-3 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-outline-variant/20 pointer-events-none">
        {label}
      </span>
    </Link>
  )
}
