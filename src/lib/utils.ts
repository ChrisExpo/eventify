import { nanoid } from 'nanoid'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function generateSlug(): string {
  return nanoid(10)
}

export function generateToken(): string {
  return nanoid(20)
}

export function formatDateItalian(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, "EEEE d MMMM yyyy, 'ore' HH:mm", { locale: it })
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, "d MMM yyyy, HH:mm", { locale: it })
}

export function formatEventDate(date: string | null, dateEnd?: string | null): string {
  if (!date) return 'Data da definire'
  const start = formatDateItalian(date)
  if (dateEnd) {
    const end = formatDateItalian(dateEnd)
    return `Dal ${start} al ${end}`
  }
  return start
}
