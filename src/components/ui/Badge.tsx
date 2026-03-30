'use client'

import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'confirmed' | 'maybe' | 'declined' | 'default'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  confirmed: 'bg-tertiary/10 text-tertiary border border-tertiary/20',
  maybe:     'bg-secondary/10 text-secondary border border-secondary/20',
  declined:  'bg-error/10 text-error border border-error/20',
  default:   'bg-primary/10 text-primary border border-primary/20',
}

const variantLabels: Record<BadgeVariant, string> = {
  confirmed: 'Confermato',
  maybe:     'Forse',
  declined:  'Declinato',
  default:   '',
}

const Badge = ({ variant = 'default', className, children, ...props }: BadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children ?? (variant !== 'default' ? variantLabels[variant] : null)}
    </span>
  )
}

export { Badge }
export type { BadgeProps, BadgeVariant }
