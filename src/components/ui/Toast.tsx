'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast deve essere usato all\'interno di <ToastProvider>')
  }
  return ctx
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const CheckIcon = () => (
  <svg
    className="h-4 w-4 shrink-0"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
      clipRule="evenodd"
    />
  </svg>
)

const XIcon = () => (
  <svg
    className="h-4 w-4 shrink-0"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
  </svg>
)

const InfoIcon = () => (
  <svg
    className="h-4 w-4 shrink-0"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
      clipRule="evenodd"
    />
  </svg>
)

const iconMap: Record<ToastType, ReactNode> = {
  success: <CheckIcon />,
  error: <XIcon />,
  info: <InfoIcon />,
}

const iconColorMap: Record<ToastType, string> = {
  success: 'text-tertiary',
  error: 'text-error',
  info: 'text-secondary',
}

// ─── Single Toast Item ────────────────────────────────────────────────────────

interface SingleToastProps {
  item: ToastItem
  onDismiss: (id: string) => void
}

const TOAST_DURATION = 3000
const FADE_DURATION = 300

const SingleToast = ({ item, onDismiss }: SingleToastProps) => {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fade in on mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  // Auto-dismiss
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss(item.id), FADE_DURATION)
    }, TOAST_DURATION)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [item.id, onDismiss])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{ transition: `opacity ${FADE_DURATION}ms ease, transform ${FADE_DURATION}ms ease` }}
      className={cn(
        'flex items-center gap-2.5',
        'bg-surface-container-highest text-on-surface rounded-xl px-4 py-2.5',
        'border border-outline-variant/20 shadow-[0_0_30px_rgba(211,148,255,0.2)]',
        'min-w-[240px] max-w-[360px] w-max',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      )}
    >
      <span className={iconColorMap[item.type]}>{iconMap[item.type]}</span>
      <span className="text-sm font-medium leading-snug">{item.message}</span>
      <button
        onClick={() => {
          setVisible(false)
          setTimeout(() => onDismiss(item.id), FADE_DURATION)
        }}
        aria-label="Chiudi notifica"
        className="ml-auto -mr-1 p-1 rounded-lg hover:bg-outline-variant/10 transition text-on-surface-variant hover:text-on-surface"
      >
        <svg
          className="h-3.5 w-3.5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
        </svg>
      </button>
    </div>
  )
}

// ─── Toast Container ──────────────────────────────────────────────────────────

interface ToastContainerProps {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

const ToastContainer = ({ toasts, onDismiss }: ToastContainerProps) => {
  if (toasts.length === 0) return null

  return (
    <div
      aria-label="Notifiche"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 items-center pt-[env(safe-area-inset-top)]"
    >
      {toasts.map((item) => (
        <SingleToast key={item.id} item={item} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

// ─── Provider ─────────────────────────────────────────────────────────────────

let _counter = 0

interface ToastProviderProps {
  children: ReactNode
}

const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${++_counter}`
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export { ToastProvider, ToastContainer }
export type { ToastType, ToastItem }
