import { formatDateItalian } from './utils'

interface EventData {
  emoji: string
  title: string
  date: string
  location_name: string | null
  location_url: string | null
  slug: string
}

interface ParticipantData {
  name: string
  status: string
}

interface ItemData {
  name: string
  assigned_to: string | null
}

export function formatEventMessage(
  event: EventData,
  participants: ParticipantData[],
  items: ItemData[]
): string {
  const confirmed = participants.filter(p => p.status === 'confirmed')
  const maybe = participants.filter(p => p.status === 'maybe')

  let msg = `${event.emoji} *${event.title}*\n\n`
  msg += `📅 ${formatDateItalian(event.date)}\n`

  if (event.location_name) {
    msg += `📍 ${event.location_name}\n`
    if (event.location_url) msg += `   ${event.location_url}\n`
  }

  if (participants.length > 0) {
    msg += `\n👥 Partecipanti (${confirmed.length} confermati`
    if (maybe.length) msg += `, ${maybe.length} forse`
    msg += `):\n`
    if (confirmed.length) msg += `✅ ${confirmed.map(p => p.name).join(', ')}\n`
    if (maybe.length) msg += `🤔 ${maybe.map(p => p.name).join(', ')}\n`
  }

  if (items.length > 0) {
    msg += `\n📋 Da portare:\n`
    items.forEach(item => {
      const who = item.assigned_to || '⚠️ Nessuno'
      msg += `• ${item.name} — ${who}\n`
    })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://friendsfest.vercel.app'
  msg += `\n🔗 Rispondi qui: ${baseUrl}/evento/${event.slug}`

  return msg
}

export function getWhatsAppUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}

export function formatBalanceMessage(
  eventTitle: string,
  debts: { from: string; to: string; amount: number }[],
  totalAmount: number
): string {
  let msg = `💰 *Saldi — ${eventTitle}*\n\n`

  if (debts.length === 0) {
    msg += `✅ Tutti pari!\n`
  } else {
    debts.forEach(d => {
      msg += `• ${d.from} deve €${d.amount.toFixed(2)} a ${d.to}\n`
    })
  }

  msg += `\nTotale spese evento: €${totalAmount.toFixed(2)}`
  return msg
}
