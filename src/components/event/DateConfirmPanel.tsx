'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Calendar, Share2 } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useLocalToken } from '@/hooks/useLocalToken'
import { useToast } from '@/components/ui/Toast'
import { confirmEventDate } from '@/app/actions/events'
import { generateWeekDays, formatDayLabel } from '@/lib/utils'
import type { DateVote } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DateConfirmPanelProps {
  eventSlug: string
  eventId: string
  weekStart: string
  dateVotes: DateVote[]
}

// ─── Helper: conta i voti per giorno ─────────────────────────────────────────

function buildVoteCount(votes: DateVote[], weekDays: string[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const day of weekDays) {
    counts[day] = 0
  }
  for (const v of votes) {
    if (counts[v.date_option] !== undefined) {
      counts[v.date_option]++
    }
  }
  return counts
}

// ─── Calcola il giorno/i vincitore/i ─────────────────────────────────────────

interface VoteResult {
  hasVotes: boolean
  maxVotes: number
  winners: string[] // uno o più giorni a parità
}

function computeWinners(counts: Record<string, number>): VoteResult {
  const values = Object.values(counts)
  const maxVotes = Math.max(...values)

  if (maxVotes === 0) {
    return { hasVotes: false, maxVotes: 0, winners: [] }
  }

  const winners = Object.keys(counts).filter((day) => counts[day] === maxVotes)
  return { hasVotes: true, maxVotes, winners }
}

// ─── Componente principale ────────────────────────────────────────────────────

export default function DateConfirmPanel({
  eventSlug,
  weekStart,
  dateVotes,
}: DateConfirmPanelProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { creatorToken, isCreator, loaded } = useLocalToken(eventSlug)

  const weekDays = generateWeekDays(weekStart)
  const voteCounts = buildVoteCount(dateVotes, weekDays)
  const { hasVotes, maxVotes, winners } = computeWinners(voteCounts)

  // Selezione in caso di parità
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [isPending, startTransition] = useTransition()

  // Attendi che il token sia caricato prima di renderizzare
  if (!loaded) return null

  // ─── Vista non-creatore ───────────────────────────────────────────────────

  if (!isCreator) {
    return (
      <Card className="glass-panel border border-outline-variant/10">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-secondary shrink-0" aria-hidden="true" />
            <h2 className="font-headline text-base font-bold text-on-surface">
              Conferma della data
            </h2>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            In attesa della conferma dell&apos;organizzatore. Vota le date disponibili
            nella griglia qui sopra.
          </p>
        </CardContent>
      </Card>
    )
  }

  // ─── Handler conferma ─────────────────────────────────────────────────────

  function handleConfirm(dateToConfirm: string) {
    if (!creatorToken) return

    startTransition(async () => {
      const result = await confirmEventDate(eventSlug, creatorToken, dateToConfirm)
      if (result && 'error' in result && result.error) {
        toast(result.error, 'error')
        return
      }
      toast('Data confermata! L\'evento è ora ufficiale.', 'success')
      router.refresh()
    })
  }

  function handleShare() {
    const url = `${window.location.origin}/evento/${eventSlug}`
    if (navigator.share) {
      navigator.share({ title: 'Vota la data!', url })
    } else {
      navigator.clipboard.writeText(url)
      toast('Link copiato negli appunti', 'success')
    }
  }

  // ─── Vista creatore ───────────────────────────────────────────────────────

  return (
    <Card className="glass-panel border border-secondary/20">
      <CardContent className="pt-5 pb-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4 text-secondary shrink-0" aria-hidden="true" />
          <h2 className="font-headline text-base font-bold text-on-surface">
            Conferma la data
          </h2>
        </div>

        {/* Stato: nessun voto */}
        {!hasVotes && (
          <div className="space-y-4">
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Nessun voto ancora. Condividi il link del sondaggio per far votare
              i tuoi amici!
            </p>
            <Button
              variant="secondary"
              size="md"
              className="w-full gap-2"
              onClick={handleShare}
              type="button"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              Condividi il sondaggio
            </Button>
          </div>
        )}

        {/* Stato: vincitore unico */}
        {hasVotes && winners.length === 1 && (
          <div className="space-y-4">
            <div
              className="bg-secondary/10 border border-secondary/20 rounded-2xl px-4 py-3"
              aria-live="polite"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-1">
                Giorno piu votato
              </p>
              <p className="text-on-surface font-bold capitalize text-base leading-snug">
                {formatDayLabel(winners[0])}
              </p>
              <p className="text-sm text-on-surface-variant tabular-nums mt-0.5">
                {maxVotes} {maxVotes === 1 ? 'voto' : 'voti'}
              </p>
            </div>

            <p className="text-sm text-on-surface-variant">
              Confermi{' '}
              <span className="text-on-surface font-semibold capitalize">
                {formatDayLabel(winners[0])}
              </span>{' '}
              come data ufficiale dell&apos;evento?
            </p>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              loading={isPending}
              onClick={() => handleConfirm(winners[0])}
              type="button"
            >
              Conferma questa data
            </Button>
          </div>
        )}

        {/* Stato: parità tra più giorni */}
        {hasVotes && winners.length > 1 && (
          <div className="space-y-4">
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Ci sono{' '}
              <span className="text-on-surface font-semibold">
                {winners.length} giorni
              </span>{' '}
              con{' '}
              <span className="text-on-surface font-semibold tabular-nums">
                {maxVotes} {maxVotes === 1 ? 'voto' : 'voti'}
              </span>{' '}
              ciascuno. Scegli tu la data:
            </p>

            <fieldset className="space-y-2">
              <legend className="sr-only">Seleziona la data da confermare</legend>
              {winners.map((day) => (
                <label
                  key={day}
                  className={[
                    'flex items-center gap-3 px-4 py-3 rounded-2xl border-2 cursor-pointer',
                    'transition-all duration-150',
                    selectedDate === day
                      ? 'bg-secondary/15 border-secondary text-on-surface'
                      : 'bg-surface-container-low border-outline-variant/20 text-on-surface-variant hover:border-secondary/40',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="confirm-date"
                    value={day}
                    checked={selectedDate === day}
                    onChange={() => setSelectedDate(day)}
                    className="sr-only"
                  />
                  {/* Radio visuale */}
                  <span
                    className={[
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                      selectedDate === day
                        ? 'border-secondary'
                        : 'border-outline-variant',
                    ].join(' ')}
                    aria-hidden="true"
                  >
                    {selectedDate === day && (
                      <span className="w-2 h-2 rounded-full bg-secondary" />
                    )}
                  </span>
                  <span className="capitalize font-medium text-sm leading-snug">
                    {formatDayLabel(day)}
                  </span>
                </label>
              ))}
            </fieldset>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              loading={isPending}
              disabled={!selectedDate}
              onClick={() => selectedDate && handleConfirm(selectedDate)}
              type="button"
            >
              Conferma data selezionata
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
