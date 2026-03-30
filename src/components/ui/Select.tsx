'use client'

import { forwardRef, SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="flex flex-col">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-bold uppercase tracking-widest text-primary mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative rounded-[1rem] neon-glow-focus transition duration-150">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={!!error}
            aria-describedby={error && selectId ? `${selectId}-error` : undefined}
            className={cn(
              'w-full h-10 pl-3 pr-9 rounded-[1rem] border-none bg-surface-container-low',
              'text-on-surface appearance-none',
              'focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container-highest',
              'transition duration-150 cursor-pointer',
              !props.value && placeholder && 'text-outline-variant',
              error && 'ring-1 ring-error focus:ring-error',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {/* Chevron icon */}
          <span
            className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-outline-variant"
            aria-hidden="true"
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </div>
        {error && (
          <p
            id={selectId ? `${selectId}-error` : undefined}
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

Select.displayName = 'Select'

export { Select }
export type { SelectProps, SelectOption }
