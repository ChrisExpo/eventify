import { nanoid } from 'nanoid'
import { format, addDays } from 'date-fns'
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

/**
 * Genera un array di 7 stringhe "YYYY-MM-DD" a partire dal lunedì dato.
 * @param mondayStr - es. "2026-04-06"
 */
export function generateWeekDays(mondayStr: string): string[] {
  const monday = new Date(mondayStr + 'T00:00:00')
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(monday, i)
    return format(day, 'yyyy-MM-dd')
  })
}

/**
 * Restituisce le parti localizzate di una data per la griglia.
 * @param dateStr - es. "2026-04-06"
 */
export function formatDayShort(dateStr: string): { dayName: string; dayNum: string; month: string } {
  const d = new Date(dateStr + 'T00:00:00')
  return {
    dayName: format(d, 'EEE', { locale: it }),
    dayNum: format(d, 'd'),
    month: format(d, 'MMM', { locale: it }),
  }
}

/**
 * Formatta una data "YYYY-MM-DD" in forma leggibile: "Lunedì 6 aprile"
 */
export function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return format(d, 'EEEE d MMMM', { locale: it })
}

/**
 * Calcola il lunedì della settimana di una data ISO "YYYY-MM-DD".
 * Restituisce la stringa "YYYY-MM-DD" del lunedì.
 */
export function getMonday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return format(d, 'yyyy-MM-dd')
}
