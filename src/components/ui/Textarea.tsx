'use client'

import { forwardRef, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const textareaId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="flex flex-col">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-bold uppercase tracking-widest text-primary mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="rounded-[1rem] neon-glow-focus transition duration-150">
          <textarea
            ref={ref}
            id={textareaId}
            aria-invalid={!!error}
            aria-describedby={error && textareaId ? `${textareaId}-error` : undefined}
            className={cn(
              'w-full min-h-[80px] px-3 py-2.5 rounded-[1rem] border-none bg-surface-container-low',
              'text-on-surface placeholder:text-outline-variant',
              'focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container-highest',
              'transition duration-150 resize-y',
              error && 'ring-1 ring-error focus:ring-error',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p
            id={textareaId ? `${textareaId}-error` : undefined}
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

Textarea.displayName = 'Textarea'

export { Textarea }
export type { TextareaProps }
