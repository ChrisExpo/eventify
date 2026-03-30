'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Users } from 'lucide-react'
import { Card, CardHeader, CardContent, Button, Input, Badge, useToast } from '@/components/ui'
import { PARTICIPANT_STATUS_CONFIG } from '@/lib/constants'
import { addParticipant, updateParticipantStatus } from '@/app/actions/participants'
import { useLocalToken } from '@/hooks/useLocalToken'
import { useUserName } from '@/hooks/useUserName'
import { cn } from '@/lib/utils'
import type { Participant, ParticipantStatus } from '@/types'

interface ParticipantSectionProps {
  eventId: string
  eventSlug: string
  initialParticipants: Participant[]
}

const STATUS_BUTTON_CONFIG: {
  status: ParticipantStatus
  label: string
  className: string
}[] = [
  {
    status: 'confirmed',
    label: 'Ci sono!',
    className:
      'bg-gradient-to-r from-primary to-primary-dim text-on-primary shadow-[0_0_15px_rgba(211,148,255,0.35)] hover:shadow-[0_0_22px_rgba(211,148,255,0.5)] focus-visible:ring-primary/50 active:shadow-[0_0_25px_rgba(211,148,255,0.5)]',
  },
  {
    status: 'maybe',
    label: 'Forse',
    className:
      'bg-surface-container-highest text-on-surface hover:bg-surface-bright focus-visible:ring-primary/30',
  },
  {
    status: 'declined',
    label: 'Non vengo',
    className:
      'bg-error/10 text-error hover:bg-error/20 focus-visible:ring-error/30',
  },
]

// Ordine di visualizzazione
const STATUS_ORDER: ParticipantStatus[] = ['confirmed', 'maybe', 'declined']

function groupParticipants(participants: Participant[]) {
  const groups: Record<ParticipantStatus, Participant[]> = {
    confirmed: [],
    maybe: [],
    declined: [],
  }
  for (const p of participants) {
    if (p.status in groups) {
      groups[p.status as ParticipantStatus].push(p)
    }
  }
  return groups
}

export default function ParticipantSection({
  eventId,
  eventSlug,
  initialParticipants,
}: ParticipantSectionProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { participantToken, loaded, saveParticipantToken } = useLocalToken(eventSlug)
  const { userName, loaded: userLoaded, saveUserName } = useUserName()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')

  // Trova il partecipante corrente (se già registrato)
  const currentParticipant = loaded
    ? initialParticipants.find((p) => p.token === participantToken) ?? null
    : null

  const confirmed = initialParticipants.filter((p) => p.status === 'confirmed').length
  const maybe = initialParticipants.filter((p) => p.status === 'maybe').length
  const groups = groupParticipants(initialParticipants)

  // Pre-compila il nome dal profilo salvato (solo se non già partecipante e campo vuoto)
  useEffect(() => {
    if (userLoaded && userName && !name && !currentParticipant) {
      setName(userName)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoaded, userName])

  async function handleNewRsvp(status: ParticipantStatus) {
    const trimmed = name.trim()
    if (!trimmed) {
      setNameError('Inserisci il tuo nome per partecipare')
      return
    }
    setNameError('')

    startTransition(async () => {
      const result = await addParticipant(eventId, trimmed, status)
      if ('error' in result && result.error) {
        toast(result.error, 'error')
        return
      }
      if ('token' in result && result.token) {
        saveParticipantToken(result.token)
        // Memorizza il nome per pre-compilazioni future
        saveUserName(trimmed)
        toast('Risposta inviata!', 'success')
        setName('')
        router.refresh()
      }
    })
  }

  async function handleUpdateStatus(status: ParticipantStatus) {
    if (!currentParticipant || !participantToken) return

    startTransition(async () => {
      const result = await updateParticipantStatus(currentParticipant.id, status, participantToken)
      if ('error' in result && result.error) {
        toast(result.error, 'error')
        return
      }
      toast('Risposta aggiornata!', 'success')
      router.refresh()
    })
  }

  return (
    <section aria-labelledby="participants-heading">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2
              id="participants-heading"
              className="flex items-center gap-2 font-headline text-lg font-bold text-on-surface"
            >
              <Users className="h-5 w-5 text-primary" aria-hidden="true" />
              Partecipanti
            </h2>
            <div className="flex items-center gap-1.5">
              {confirmed > 0 && (
                <span key={confirmed} className="animate-fade-in">
                  <Badge variant="confirmed">
                    {confirmed} {confirmed === 1 ? 'confermato' : 'confermati'}
                  </Badge>
                </span>
              )}
              {maybe > 0 && (
                <span key={`maybe-${maybe}`} className="animate-fade-in">
                  <Badge variant="maybe">
                    {maybe} forse
                  </Badge>
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Lista partecipanti */}
          {initialParticipants.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-4 inline-block animate-[pulse-ring_2s_ease-in-out_infinite]">
                👥
              </div>
              <p className="text-on-surface-variant font-medium text-lg">
                Nessun partecipante ancora
              </p>
              <p className="text-on-surface-variant/70 text-sm mt-1">
                Sii il primo a rispondere!
              </p>
            </div>
          ) : (
            <ul className="space-y-1 mb-5" aria-label="Lista partecipanti">
              {STATUS_ORDER.map((status) => {
                const group = groups[status]
                if (group.length === 0) return null
                const config = PARTICIPANT_STATUS_CONFIG[status]
                return (
                  <li key={status}>
                    <ul className="space-y-1">
                      {group.map((participant, index) => (
                        <li
                          key={participant.id}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-[1rem] text-sm animate-fade-in',
                            participant.token === participantToken
                              ? 'bg-surface-container-high font-medium text-on-surface'
                              : 'text-on-surface-variant'
                          )}
                          style={{
                            animationDelay: `${index * 50}ms`,
                            opacity: 0,
                            animationFillMode: 'forwards',
                          }}
                        >
                          <span aria-hidden="true">{config.emoji}</span>
                          <span>{participant.name}</span>
                          {participant.token === participantToken && (
                            <span className="ml-auto text-xs text-on-surface-variant">(tu)</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Separatore */}
          {initialParticipants.length > 0 && (
            <div
              className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent mb-4"
              aria-hidden="true"
            />
          )}

          {/* Form RSVP */}
          {!loaded ? (
            // Skeleton minimo mentre carichiamo localStorage
            <div className="h-10 rounded-[1rem] bg-surface-container animate-pulse" aria-hidden="true" />
          ) : currentParticipant ? (
            // Utente già registrato
            <div>
              <p className="text-sm font-medium text-on-surface-variant mb-3">
                Ciao{' '}
                <span className="text-on-surface font-semibold">{currentParticipant.name}</span>!
                Vuoi cambiare risposta?
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Cambia risposta">
                {STATUS_BUTTON_CONFIG.map(({ status, label, className }) => (
                  <button
                    key={status}
                    onClick={() => handleUpdateStatus(status)}
                    disabled={isPending || currentParticipant.status === status}
                    aria-pressed={currentParticipant.status === status}
                    className={cn(
                      'inline-flex items-center justify-center gap-1.5 min-h-[44px] h-11 px-4 text-sm font-medium rounded-[1rem]',
                      'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                      'cursor-pointer select-none active:scale-95',
                      className,
                      (isPending || currentParticipant.status === status) &&
                        'opacity-50 cursor-not-allowed pointer-events-none'
                    )}
                  >
                    <span aria-hidden="true">{PARTICIPANT_STATUS_CONFIG[status].emoji}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Nuovo utente
            <div>
              <Input
                id="participant-name"
                label="Come ti chiami?"
                placeholder="Il tuo nome"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (nameError) setNameError('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (name.trim()) handleNewRsvp('confirmed')
                  }
                }}
                error={nameError}
                disabled={isPending}
                autoComplete="given-name"
                maxLength={60}
                className="mb-3"
              />
              <div className="flex flex-wrap gap-2" role="group" aria-label="Scegli la tua risposta">
                {STATUS_BUTTON_CONFIG.map(({ status, label, className }) => (
                  <button
                    key={status}
                    onClick={() => handleNewRsvp(status)}
                    disabled={isPending}
                    className={cn(
                      'inline-flex items-center justify-center gap-1.5 min-h-[44px] h-11 px-4 text-sm font-medium rounded-[1rem]',
                      'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                      'cursor-pointer select-none active:scale-95',
                      className,
                      isPending && 'opacity-50 cursor-not-allowed pointer-events-none'
                    )}
                  >
                    <span aria-hidden="true">{PARTICIPANT_STATUS_CONFIG[status].emoji}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
