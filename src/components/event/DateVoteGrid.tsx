'use client'

import { useState, useEffect, useOptimistic, useTransition } from 'react'
import { Check, Trophy, ChevronDown, ChevronUp } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { useUserName } from '@/hooks/useUserName'
import { toggleDateVote } from '@/app/actions/date-votes'
import {
  cn,
  generateWeekDays,
  formatDayShort,
  formatDayLabel,
} from '@/lib/utils'
import type { DateVote } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DateVoteGridProps {
  eventId: string
  weekStart: string       // "2026-04-06" (lunedì)
  initialVotes: DateVote[]
}

// Stato ottimistico locale
type LocalVotes = Record<string, string[]> // dateStr -> voter_name[]

// ─── Helper: costruisce la mappa date->votanti da un array di DateVote ────────

function buildVoteMap(votes: DateVote[]): LocalVotes {
  const map: LocalVotes = {}
  for (const v of votes) {
    if (!map[v.date_option]) map[v.date_option] = []
    map[v.date_option].push(v.voter_name)
  }
  return map
}

// ─── Componente principale ────────────────────────────────────────────────────

export default function DateVoteGrid({
  eventId,
  weekStart,
  initialVotes,
}: DateVoteGridProps) {
  const { toast } = useToast()
  const { userName, loaded: userLoaded, saveUserName } = useUserName()
  const [voterName, setVoterName] = useState('')
  const [expandedDate, setExpandedDate] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Pre-compila il nome dal profilo salvato
  useEffect(() => {
    if (userLoaded && userName && !voterName) {
      setVoterName(userName)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoaded, userName])

  // Stato ottimistico: riflette immediatamente il toggle prima della risposta server
  const [optimisticMap, updateOptimistic] = useOptimistic(
    buildVoteMap(initialVotes),
    (
      current: LocalVotes,
      action: { dateStr: string; name: string; add: boolean }
    ) => {
      const existing = current[action.dateStr] ?? []
      const updated = action.add
        ? [...existing, action.name]
        : existing.filter((n) => n !== action.name)
      return { ...current, [action.dateStr]: updated }
    }
  )

  const weekDays = generateWeekDays(weekStart)

  // Calcola il giorno con più voti
  let maxVotes = 0
  let topDay: string | null = null
  for (const dateStr of weekDays) {
    const count = (optimisticMap[dateStr] ?? []).length
    if (count > maxVotes) {
      maxVotes = count
      topDay = dateStr
    }
  }
  // Nessun top se nessuno ha ancora votato
  if (maxVotes === 0) topDay = null

  function handleToggleExpand(dateStr: string) {
    setExpandedDate((prev) => (prev === dateStr ? null : dateStr))
  }

  async function handleVote(dateStr: string) {
    const trimmed = voterName.trim()
    if (!trimmed) {
      toast('Inserisci il tuo nome prima di votare', 'error')
      return
    }

    const voters = optimisticMap[dateStr] ?? []
    const hasVoted = voters.includes(trimmed)

    startTransition(async () => {
      // Aggiorna ottimisticamente l'UI
      updateOptimistic({ dateStr, name: trimmed, add: !hasVoted })

      const result = await toggleDateVote(eventId, dateStr, trimmed)

      if (result && 'error' in result && result.error) {
        toast(result.error, 'error')
        return
      }

      // Salva il nome per uso futuro
      saveUserName(trimmed)
    })
  }

  return (
    <Card className="glass-panel border border-outline-variant/10">
      <CardContent className="pt-5 pb-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg" aria-hidden="true">📅</span>
          <h2 className="font-headline text-base font-bold text-on-surface">
            Quando ci vediamo?
          </h2>
        </div>

        {/* Input nome votante */}
        <div className="mb-5">
          <Input
            id="date-vote-name"
            label="Il tuo nome"
            placeholder="Es. Marco, Giulia…"
            value={voterName}
            onChange={(e) => setVoterName(e.target.value)}
            autoComplete="name"
            maxLength={80}
          />
        </div>

        {/* Griglia giorni */}
        <div
          className="grid grid-cols-7 gap-1 mb-2"
          role="group"
          aria-label="Griglia votazione giorni"
        >
          {weekDays.map((dateStr) => {
            const { dayName, dayNum, month } = formatDayShort(dateStr)
            const voters = optimisticMap[dateStr] ?? []
            const count = voters.length
            const hasVoted = voterName.trim()
              ? voters.includes(voterName.trim())
              : false
            const isTop = topDay === dateStr && maxVotes > 0
            const isExpanded = expandedDate === dateStr

            return (
              <div key={dateStr} className="flex flex-col items-center gap-1">
                {/* Label giorno */}
                <div className="flex flex-col items-center gap-0 text-center w-full">
                  <span className="text-[9px] sm:text-[10px] font-bold text-primary capitalize leading-none">
                    {dayName}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-on-surface leading-none">
                    {dayNum}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-on-surface-variant capitalize leading-none">
                    {month}
                  </span>
                </div>

                {/* Cella voto */}
                <button
                  type="button"
                  onClick={() => handleVote(dateStr)}
                  disabled={isPending}
                  aria-label={`${hasVoted ? 'Rimuovi voto' : 'Vota'} per ${formatDayLabel(dateStr)} — ${count} voti`}
                  aria-pressed={hasVoted}
                  className={cn(
                    'w-full aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-0.5',
                    'transition-all duration-200 active:scale-95',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    hasVoted
                      ? 'bg-tertiary/20 border-tertiary'
                      : 'bg-surface-container-low border-outline-variant/20 hover:border-primary/40 hover:bg-primary/5',
                    isTop && 'neon-glow-tertiary'
                  )}
                >
                  <span
                    className={cn(
                      'text-sm sm:text-base font-bold tabular-nums leading-none',
                      hasVoted ? 'text-tertiary' : 'text-on-surface'
                    )}
                  >
                    {count}
                  </span>
                  {hasVoted && (
                    <Check
                      className="h-3 w-3 text-tertiary"
                      aria-hidden="true"
                    />
                  )}
                </button>

                {/* Bottone espandi votanti */}
                <button
                  type="button"
                  onClick={() => handleToggleExpand(dateStr)}
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? 'Chiudi' : 'Mostra'} chi ha votato ${formatDayLabel(dateStr)}`}
                  className="text-on-surface-variant hover:text-primary transition-colors p-0.5 rounded"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-3 w-3" aria-hidden="true" />
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Pannello espanso votanti */}
        {expandedDate && (
          <div
            key={expandedDate}
            className="mt-1 mb-3 bg-surface-container-low rounded-xl p-3 animate-fade-in border border-outline-variant/10"
            role="region"
            aria-label={`Chi ha votato ${formatDayLabel(expandedDate)}`}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
              Chi è disponibile — {formatDayLabel(expandedDate)}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(optimisticMap[expandedDate] ?? []).length > 0 ? (
                (optimisticMap[expandedDate] ?? []).map((name) => (
                  <span
                    key={name}
                    className="text-xs px-2 py-1 bg-tertiary/10 text-tertiary rounded-full border border-tertiary/20"
                  >
                    {name}
                  </span>
                ))
              ) : (
                <p className="text-xs text-on-surface-variant">
                  Nessuno ancora
                </p>
              )}
            </div>
          </div>
        )}

        {/* Giorno più votato */}
        {topDay && (
          <div
            className="flex items-center gap-2 pt-3 border-t border-outline-variant/10"
            aria-live="polite"
            aria-atomic="true"
          >
            <Trophy
              className="h-4 w-4 text-tertiary shrink-0"
              aria-hidden="true"
            />
            <p className="text-sm text-on-surface-variant">
              <span className="font-bold text-tertiary">Giorno più votato:</span>{' '}
              <span className="capitalize text-on-surface">
                {formatDayLabel(topDay)}
              </span>{' '}
              <span className="text-on-surface-variant tabular-nums">
                ({maxVotes} {maxVotes === 1 ? 'voto' : 'voti'})
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
