'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart2, Plus, Trash2, X } from 'lucide-react'
import { Card, CardHeader, CardContent, Button, Input, useToast } from '@/components/ui'
import { createPoll, votePoll, deletePoll } from '@/app/actions/polls'
import { useUserName } from '@/hooks/useUserName'
import { cn } from '@/lib/utils'
import type { Poll, PollOption } from '@/types'

export type PollWithOptions = Poll & { poll_options: PollOption[] }

interface PollSectionProps {
  eventId: string
  initialPolls: PollWithOptions[]
}

// ─── Singolo sondaggio ───────────────────────────────────────────────────────

interface PollCardProps {
  poll: PollWithOptions
  voterName: string
  onVoterNameChange: (name: string) => void
  isPending: boolean
  onVote: (optionId: string, pollId: string, pollType: 'single' | 'multiple') => void
  onDelete: (pollId: string) => void
}

function PollCard({
  poll,
  voterName,
  onVoterNameChange,
  isPending,
  onVote,
  onDelete,
}: PollCardProps) {
  const totalVotes = poll.poll_options.reduce((sum, o) => sum + o.votes.length, 0)

  return (
    <div className="rounded-[1rem] bg-surface-container-low border border-outline-variant/10 overflow-hidden">
      {/* Intestazione sondaggio */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-headline font-bold text-on-surface text-base leading-snug">
            {poll.question}
          </p>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {poll.type === 'single' ? 'Scelta singola' : 'Scelta multipla'} &middot;{' '}
            {totalVotes} {totalVotes === 1 ? 'voto' : 'voti'}
          </p>
        </div>
        <button
          onClick={() => onDelete(poll.id)}
          disabled={isPending}
          aria-label={`Elimina sondaggio: ${poll.question}`}
          className={cn(
            'shrink-0 flex items-center justify-center w-8 h-8 rounded-full',
            'text-on-surface-variant hover:text-error hover:bg-error/10',
            'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40',
            isPending && 'opacity-40 pointer-events-none'
          )}
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Input nome votante */}
      <div className="px-4 pb-3">
        <Input
          id={`voter-name-${poll.id}`}
          placeholder="Il tuo nome per votare"
          value={voterName}
          onChange={(e) => onVoterNameChange(e.target.value)}
          disabled={isPending}
          maxLength={60}
          autoComplete="given-name"
          aria-label="Il tuo nome"
        />
      </div>

      {/* Opzioni con barre animate */}
      <div className="px-4 pb-4 space-y-2.5" role="group" aria-label={`Opzioni: ${poll.question}`}>
        {poll.poll_options.map((option) => {
          const percentage =
            totalVotes === 0 ? 0 : Math.round((option.votes.length / totalVotes) * 100)
          const hasVoted = voterName.trim()
            ? option.votes.includes(voterName.trim())
            : false

          return (
            <button
              key={option.id}
              onClick={() => onVote(option.id, poll.id, poll.type)}
              disabled={isPending || !voterName.trim()}
              aria-pressed={hasVoted}
              aria-label={`${option.text} — ${percentage}%, ${option.votes.length} voti`}
              className={cn(
                'relative w-full h-11 rounded-[0.875rem] overflow-hidden text-left',
                'border transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                'active:scale-[0.985]',
                hasVoted
                  ? 'border-primary/60 bg-primary/10'
                  : 'border-outline-variant/15 bg-surface-container',
                (isPending || !voterName.trim()) && 'cursor-not-allowed opacity-80'
              )}
            >
              {/* Barra di sfondo */}
              <div
                className={cn(
                  'absolute inset-y-0 left-0 rounded-[0.875rem] transition-all duration-700 ease-out',
                  hasVoted
                    ? 'bg-gradient-to-r from-primary/50 to-primary-dim/40'
                    : 'bg-gradient-to-r from-primary/20 to-primary-dim/15'
                )}
                style={{ width: `${percentage}%` }}
                aria-hidden="true"
              />

              {/* Contenuto */}
              <div className="relative flex items-center justify-between h-full px-3 gap-2">
                <span
                  className={cn(
                    'text-sm font-medium truncate',
                    hasVoted ? 'text-on-surface font-semibold' : 'text-on-surface'
                  )}
                >
                  {option.text}
                  {hasVoted && (
                    <span className="ml-1.5 text-primary text-xs" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </span>
                <span className="text-sm font-bold text-on-surface-variant shrink-0">
                  {percentage}%{' '}
                  <span className="text-xs font-normal">({option.votes.length})</span>
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Form creazione sondaggio ─────────────────────────────────────────────────

interface CreatePollFormProps {
  eventId: string
  isPending: boolean
  onSubmit: (
    question: string,
    type: 'single' | 'multiple',
    options: string[]
  ) => void
}

function CreatePollForm({ isPending, onSubmit }: CreatePollFormProps) {
  const [question, setQuestion] = useState('')
  const [pollType, setPollType] = useState<'single' | 'multiple'>('single')
  const [options, setOptions] = useState(['', ''])
  const [errors, setErrors] = useState<{ question?: string; options?: string }>({})

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)))
    if (errors.options) setErrors((e) => ({ ...e, options: undefined }))
  }

  function addOption() {
    if (options.length < 10) setOptions((prev) => [...prev, ''])
  }

  function removeOption(index: number) {
    if (options.length > 2) setOptions((prev) => prev.filter((_, i) => i !== index))
  }

  function validate(): boolean {
    const newErrors: typeof errors = {}
    if (!question.trim()) newErrors.question = 'Inserisci la domanda del sondaggio'
    const validOptions = options.filter((o) => o.trim().length > 0)
    if (validOptions.length < 2) newErrors.options = 'Aggiungi almeno 2 opzioni'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSubmit(question, pollType, options)
    // Reset form
    setQuestion('')
    setPollType('single')
    setOptions(['', ''])
    setErrors({})
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Separatore */}
      <div
        className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent mb-4"
        aria-hidden="true"
      />

      <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
        Crea sondaggio
      </p>

      {/* Domanda */}
      <div className="mb-3">
        <Input
          id="poll-question"
          placeholder="Domanda del sondaggio…"
          value={question}
          onChange={(e) => {
            setQuestion(e.target.value)
            if (errors.question) setErrors((er) => ({ ...er, question: undefined }))
          }}
          disabled={isPending}
          maxLength={200}
          error={errors.question}
          aria-label="Domanda del sondaggio"
        />
      </div>

      {/* Toggle tipo */}
      <div
        className="flex gap-1.5 mb-4 p-1 rounded-full bg-surface-container-low border border-outline-variant/10 w-fit"
        role="radiogroup"
        aria-label="Tipo di sondaggio"
      >
        {(['single', 'multiple'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={pollType === t}
            onClick={() => setPollType(t)}
            disabled={isPending}
            className={cn(
              'h-8 px-4 text-xs font-semibold rounded-full transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
              pollType === t
                ? 'bg-gradient-to-r from-primary to-primary-dim text-white shadow-[0_0_12px_rgba(211,148,255,0.3)]'
                : 'text-on-surface-variant hover:text-on-surface'
            )}
          >
            {t === 'single' ? 'Scelta singola' : 'Scelta multipla'}
          </button>
        ))}
      </div>

      {/* Lista opzioni */}
      <div className="space-y-2 mb-3">
        {options.map((opt, i) => (
          <div key={i} className="flex gap-2 items-center">
            <div className="flex-1">
              <Input
                id={`poll-option-${i}`}
                placeholder={`Opzione ${i + 1}`}
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                disabled={isPending}
                maxLength={100}
                aria-label={`Opzione ${i + 1}`}
              />
            </div>
            {options.length > 2 && (
              <button
                type="button"
                onClick={() => removeOption(i)}
                disabled={isPending}
                aria-label={`Rimuovi opzione ${i + 1}`}
                className={cn(
                  'shrink-0 flex items-center justify-center w-10 h-10 rounded-full',
                  'text-on-surface-variant hover:text-error hover:bg-error/10',
                  'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40'
                )}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
      </div>

      {errors.options && (
        <p role="alert" className="text-xs text-error mb-3">
          {errors.options}
        </p>
      )}

      {/* Aggiungi opzione */}
      {options.length < 10 && (
        <button
          type="button"
          onClick={addOption}
          disabled={isPending}
          className={cn(
            'flex items-center gap-1.5 text-sm text-primary font-medium mb-4',
            'hover:text-primary/80 transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded'
          )}
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Aggiungi opzione
        </button>
      )}

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        size="md"
        loading={isPending}
        disabled={isPending}
        className="w-full"
      >
        Crea sondaggio
      </Button>
    </form>
  )
}

// ─── Componente principale ────────────────────────────────────────────────────

export default function PollSection({ eventId, initialPolls }: PollSectionProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { userName, loaded: userLoaded, saveUserName } = useUserName()
  const [isPending, startTransition] = useTransition()

  // Nome votante condiviso tra tutti i sondaggi
  const [voterName, setVoterName] = useState('')

  // Pre-compila il nome dal profilo salvato
  useEffect(() => {
    if (userLoaded && userName && !voterName) {
      setVoterName(userName)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoaded, userName])

  const handleVoterNameChange = useCallback((name: string) => {
    setVoterName(name)
  }, [])

  function handleVote(optionId: string, pollId: string, pollType: 'single' | 'multiple') {
    if (!voterName.trim()) {
      toast('Inserisci il tuo nome per votare', 'error')
      return
    }
    startTransition(async () => {
      const result = await votePoll(optionId, voterName, pollType, pollId)
      if (result.error) {
        toast(result.error, 'error')
        return
      }
      // Memorizza il nome per usi futuri
      saveUserName(voterName.trim())
      router.refresh()
    })
  }

  function handleCreate(
    question: string,
    type: 'single' | 'multiple',
    options: string[]
  ) {
    startTransition(async () => {
      const result = await createPoll(eventId, question, type, options)
      if (result.error) {
        toast(result.error, 'error')
        return
      }
      toast('Sondaggio creato!', 'success')
      router.refresh()
    })
  }

  function handleDelete(pollId: string) {
    startTransition(async () => {
      const result = await deletePoll(pollId)
      if (result.error) {
        toast(result.error, 'error')
        return
      }
      toast('Sondaggio eliminato', 'success')
      router.refresh()
    })
  }

  return (
    <section aria-labelledby="polls-heading">
      <Card>
        <CardHeader>
          <h2
            id="polls-heading"
            className="flex items-center gap-2 font-headline text-lg font-bold text-on-surface"
          >
            <BarChart2 className="h-5 w-5 text-primary" aria-hidden="true" />
            Sondaggi
          </h2>
        </CardHeader>

        <CardContent>
          {/* Lista sondaggi */}
          {initialPolls.length === 0 ? (
            <div className="text-center py-8 mb-2">
              <div className="text-4xl mb-3 inline-block">📊</div>
              <p className="text-on-surface-variant font-medium">Nessun sondaggio ancora</p>
              <p className="text-on-surface-variant/70 text-sm mt-1">
                Crea il primo sondaggio per il gruppo!
              </p>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {initialPolls.map((poll, index) => (
                <div
                  key={poll.id}
                  className="animate-slide-in-up"
                  style={{
                    animationDelay: `${index * 60}ms`,
                    opacity: 0,
                    animationFillMode: 'forwards',
                  }}
                >
                  <PollCard
                    poll={poll}
                    voterName={voterName}
                    onVoterNameChange={handleVoterNameChange}
                    isPending={isPending}
                    onVote={handleVote}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Form creazione */}
          <CreatePollForm
            eventId={eventId}
            isPending={isPending}
            onSubmit={handleCreate}
          />
        </CardContent>
      </Card>
    </section>
  )
}
