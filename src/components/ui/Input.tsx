'use client'

import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="flex flex-col">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-bold uppercase tracking-widest text-primary mb-1.5"
          >
            {label}
          </label>
        )}
        <div className={cn('rounded-[1rem] neon-glow-focus transition duration-150', error && 'neon-glow-focus')}>
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error && inputId ? `${inputId}-error` : undefined}
            className={cn(
              'w-full h-10 px-3 rounded-[1rem] border-none bg-surface-container-low',
              'text-on-surface placeholder:text-outline-variant',
              'focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container-highest',
              'transition duration-150',
              error && 'ring-1 ring-error focus:ring-error',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p
            id={inputId ? `${inputId}-error` : undefined}
            role="alert"
            className="text-xs text-error mt-1"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
export type { InputProps }
