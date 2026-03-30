'use client'

import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass'
}

const Card = ({ className, children, variant = 'default', ...props }: CardProps) => {
  return (
    <div
      className={cn(
        'rounded-[1rem] border overflow-hidden',
        variant === 'default' && 'bg-surface-container border-outline-variant/10',
        variant === 'glass' && 'glass-panel electric-glow border-outline-variant/10',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

const CardHeader = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn('px-5 py-4 border-b border-outline-variant/10', className)}
      {...props}
    >
      {children}
    </div>
  )
}

const CardContent = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn('px-5 py-4', className)} {...props}>
      {children}
    </div>
  )
}

export { Card, CardHeader, CardContent }
export type { CardProps }
