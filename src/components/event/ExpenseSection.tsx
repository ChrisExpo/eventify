'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Wallet, Trash2, ArrowRight, MessageCircle } from 'lucide-react'
import { Card, CardHeader, CardContent, Button, Input, Select, useToast } from '@/components/ui'
import { addExpense, deleteExpense } from '@/app/actions/expenses'
import { simplifyDebts, totalExpenses } from '@/lib/debts'
import { formatBalanceMessage, getWhatsAppUrl } from '@/lib/whatsapp'
import { cn } from '@/lib/utils'
import type { Expense, Participant } from '@/types'

interface ExpenseSectionProps {
  eventId: string
  eventTitle: string
  initialExpenses: Expense[]
  participants: Participant[]
}

function formatEuro(amount: number): string {
  return amount.toLocaleString('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const WhatsAppIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

export default function ExpenseSection({
  eventId,
  eventTitle,
  initialExpenses,
  participants,
}: ExpenseSectionProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form state
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [splitAmong, setSplitAmong] = useState<string[]>([])

  // Validation errors
  const [descError, setDescError] = useState('')
  const [amountError, setAmountError] = useState('')
  const [paidByError, setPaidByError] = useState('')
  const [splitError, setSplitError] = useState('')

  // Partecipanti confermati o forse
  const availableParticipants = useMemo(
    () => participants.filter((p) => p.status === 'confirmed' || p.status === 'maybe'),
    [participants]
  )

  const paidByOptions = useMemo(
    () => [
      { value: '', label: 'Chi ha pagato?' },
      ...availableParticipants.map((p) => ({ value: p.name, label: p.name })),
    ],
    [availableParticipants]
  )

  // Calcoli
  const debts = useMemo(() => simplifyDebts(initialExpenses), [initialExpenses])
  const total = useMemo(() => totalExpenses(initialExpenses), [initialExpenses])

  function toggleSplitPerson(name: string) {
    setSplitAmong((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
    if (splitError) setSplitError('')
  }

  function selectAll() {
    setSplitAmong(availableParticipants.map((p) => p.name))
    if (splitError) setSplitError('')
  }

  function deselectAll() {
    setSplitAmong([])
  }

  function resetForm() {
    setDescription('')
    setAmount('')
    setPaidBy('')
    setSplitAmong([])
    setDescError('')
    setAmountError('')
    setPaidByError('')
    setSplitError('')
  }

  async function handleAddExpense() {
    let valid = true

    if (!description.trim()) {
      setDescError('Inserisci una descrizione')
      valid = false
    } else {
      setDescError('')
    }

    const parsedAmount = parseFloat(amount)
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError('Inserisci un importo valido')
      valid = false
    } else {
      setAmountError('')
    }

    if (!paidBy.trim()) {
      setPaidByError('Seleziona chi ha pagato')
      valid = false
    } else {
      setPaidByError('')
    }

    if (splitAmong.length === 0) {
      setSplitError('Seleziona almeno una persona')
      valid = false
    } else {
      setSplitError('')
    }

    if (!valid) return

    startTransition(async () => {
      const result = await addExpense(
        eventId,
        description.trim(),
        Math.round(parsedAmount * 100) / 100,
        paidBy.trim(),
        splitAmong
      )
      if ('error' in result && result.error) {
        toast(result.error, 'error')
        return
      }
      toast('Spesa aggiunta!', 'success')
      resetForm()
      router.refresh()
    })
  }

  async function handleDeleteExpense(id: string) {
    if (!confirm('Eliminare questa spesa?')) return
    setDeletingId(id)
    startTransition(async () => {
      const result = await deleteExpense(id)
      if ('error' in result && result.error) {
        toast(result.error, 'error')
      } else {
        toast('Spesa eliminata', 'success')
        router.refresh()
      }
      setDeletingId(null)
    })
  }

  function handleShareBalances() {
    const message = formatBalanceMessage(eventTitle, debts, total)
    window.open(getWhatsAppUrl(message), '_blank', 'noopener,noreferrer')
  }

  return (
    <section aria-labelledby="expenses-heading">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2
              id="expenses-heading"
              className="flex items-center gap-2 font-headline text-lg font-bold text-on-surface"
            >
              <Wallet className="h-5 w-5 text-primary" aria-hidden="true" />
              Spese
            </h2>
            {initialExpenses.length > 0 && (
              <span className="text-sm font-semibold text-tertiary animate-fade-in">
                Totale: €{formatEuro(total)}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Lista spese */}
          {initialExpenses.length === 0 ? (
            <div className="text-center py-10 mb-4">
              <div className="text-5xl mb-4 inline-block animate-[pulse-ring_2s_ease-in-out_infinite]">
                💸
              </div>
              <p className="text-on-surface-variant font-medium text-lg">
                Nessuna spesa registrata
              </p>
              <p className="text-on-surface-variant/70 text-sm mt-1">
                Aggiungi le spese dell'evento!
              </p>
            </div>
          ) : (
            <>
              <ul className="space-y-2 mb-5" aria-label="Lista spese">
                {initialExpenses.map((expense, index) => (
                  <li
                    key={expense.id}
                    className="animate-fade-in"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      opacity: 0,
                      animationFillMode: 'forwards',
                    }}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-between gap-3 px-3 py-3',
                        'bg-surface-container-low rounded-[1rem]',
                        'transition-opacity duration-150',
                        deletingId === expense.id && 'opacity-40'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-on-surface">
                          <span className="font-bold text-tertiary">{expense.paid_by}</span>
                          {' ha pagato '}
                          <span className="font-semibold text-on-surface">
                            €{formatEuro(expense.amount)}
                          </span>
                        </p>
                        <p className="text-sm text-on-surface mt-0.5">
                          per{' '}
                          <span className="font-medium">{expense.description}</span>
                        </p>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          diviso tra {expense.split_among.length}{' '}
                          {expense.split_among.length === 1 ? 'persona' : 'persone'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(expense.id)}
                        disabled={isPending}
                        aria-label={`Elimina spesa: ${expense.description}`}
                        className={cn(
                          'flex items-center justify-center w-9 h-9 rounded-full shrink-0',
                          'text-error/60 hover:text-error hover:bg-error/10',
                          'transition-all duration-150 focus-visible:outline-none',
                          'focus-visible:ring-2 focus-visible:ring-error/40',
                          'active:scale-90',
                          isPending && 'opacity-40 cursor-not-allowed pointer-events-none'
                        )}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Separatore */}
              <div
                className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent mb-4"
                aria-hidden="true"
              />

              {/* Riepilogo saldi */}
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
                  Riepilogo Saldi
                </p>

                {debts.length === 0 ? (
                  <p className="text-sm text-on-surface-variant text-center py-2">
                    Tutti pari! 🎉
                  </p>
                ) : (
                  <ul className="space-y-2" aria-label="Saldi tra partecipanti">
                    {debts.map((debt, index) => (
                      <li
                        key={`${debt.from}-${debt.to}-${index}`}
                        className="flex items-center gap-2 text-sm animate-fade-in"
                        style={{
                          animationDelay: `${index * 60}ms`,
                          opacity: 0,
                          animationFillMode: 'forwards',
                        }}
                      >
                        <span className="font-semibold text-secondary">{debt.from}</span>
                        <ArrowRight
                          size={14}
                          className="text-outline-variant shrink-0"
                          aria-hidden="true"
                        />
                        <span className="font-semibold text-tertiary">{debt.to}</span>
                        <span className="ml-auto font-bold text-on-surface">
                          €{formatEuro(debt.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Pulsante condividi saldi */}
                <button
                  type="button"
                  onClick={handleShareBalances}
                  className={cn(
                    'mt-4 w-full inline-flex items-center justify-center gap-2',
                    'h-10 px-4 rounded-full text-sm font-medium',
                    'bg-whatsapp text-white',
                    'hover:brightness-110 active:scale-95',
                    'transition-all duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25d366]/50',
                    'shadow-[0_0_12px_rgba(37,211,102,0.25)]'
                  )}
                  aria-label="Condividi saldi su WhatsApp"
                >
                  <WhatsAppIcon />
                  Condividi saldi su WhatsApp
                </button>
              </div>

              {/* Separatore */}
              <div
                className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent mb-4"
                aria-hidden="true"
              />
            </>
          )}

          {/* Form aggiunta spesa */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              Aggiungi spesa
            </p>

            {/* Descrizione */}
            <Input
              id="expense-description"
              aria-label="Descrizione spesa"
              placeholder="Es. Carbonella, Bibite, Pizza..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (descError) setDescError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddExpense()
                }
              }}
              error={descError}
              disabled={isPending}
              maxLength={120}
            />

            {/* Importo + Chi ha pagato */}
            <div className="flex gap-2">
              {/* Importo con prefisso € */}
              <div className="flex-1 flex flex-col">
                <div
                  className={cn(
                    'relative rounded-[1rem] transition duration-150',
                    amountError && 'ring-1 ring-error rounded-[1rem]'
                  )}
                >
                  <span
                    className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-on-surface-variant text-sm font-medium"
                    aria-hidden="true"
                  >
                    €
                  </span>
                  <input
                    id="expense-amount"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0.01"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value)
                      if (amountError) setAmountError('')
                    }}
                    disabled={isPending}
                    aria-label="Importo in euro"
                    aria-invalid={!!amountError}
                    aria-describedby={amountError ? 'expense-amount-error' : undefined}
                    className={cn(
                      'w-full h-10 pl-7 pr-3 rounded-[1rem] border-none bg-surface-container-low',
                      'text-on-surface placeholder:text-outline-variant text-sm',
                      'focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container-highest',
                      'transition duration-150',
                      '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
                      amountError && 'ring-1 ring-error focus:ring-error'
                    )}
                  />
                </div>
                {amountError && (
                  <p
                    id="expense-amount-error"
                    role="alert"
                    className="text-xs text-error mt-1"
                  >
                    {amountError}
                  </p>
                )}
              </div>

              {/* Chi ha pagato */}
              <div className="flex-1">
                <Select
                  id="expense-paid-by"
                  aria-label="Chi ha pagato"
                  value={paidBy}
                  onChange={(e) => {
                    setPaidBy(e.target.value)
                    if (paidByError) setPaidByError('')
                  }}
                  options={paidByOptions}
                  error={paidByError}
                  disabled={isPending || availableParticipants.length === 0}
                />
              </div>
            </div>

            {/* Dividi tra */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">
                  Dividi tra
                </p>
                {availableParticipants.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAll}
                      disabled={isPending}
                      className="text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
                    >
                      Tutti
                    </button>
                    <span className="text-outline-variant text-xs" aria-hidden="true">·</span>
                    <button
                      type="button"
                      onClick={deselectAll}
                      disabled={isPending}
                      className="text-xs text-on-surface-variant hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
                    >
                      Nessuno
                    </button>
                  </div>
                )}
              </div>

              {availableParticipants.length === 0 ? (
                <p className="text-xs text-on-surface-variant text-center py-3">
                  Nessun partecipante disponibile. Aggiungi prima i partecipanti.
                </p>
              ) : (
                <div
                  className="grid grid-cols-2 gap-1.5"
                  role="group"
                  aria-label="Seleziona partecipanti per la divisione"
                >
                  {availableParticipants.map((participant) => {
                    const isChecked = splitAmong.includes(participant.name)
                    return (
                      <label
                        key={participant.id}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-[1rem] cursor-pointer',
                          'transition-all duration-150 select-none',
                          'focus-within:ring-2 focus-within:ring-primary/40',
                          isChecked
                            ? 'bg-primary/15 text-on-surface'
                            : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container',
                          isPending && 'pointer-events-none opacity-50'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSplitPerson(participant.name)}
                          disabled={isPending}
                          className="sr-only"
                          aria-label={participant.name}
                        />
                        <span
                          className={cn(
                            'flex items-center justify-center w-4 h-4 rounded shrink-0 border transition-all duration-150',
                            isChecked
                              ? 'bg-primary border-primary'
                              : 'border-outline-variant bg-transparent'
                          )}
                          aria-hidden="true"
                        >
                          {isChecked && (
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 10 10"
                              fill="none"
                              aria-hidden="true"
                            >
                              <path
                                d="M1.5 5L3.8 7.5L8.5 2.5"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </span>
                        <span className="text-sm font-medium truncate">
                          {participant.name}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}

              {splitError && (
                <p role="alert" className="text-xs text-error mt-1.5">
                  {splitError}
                </p>
              )}
            </div>

            {/* Pulsante aggiungi */}
            <Button
              onClick={handleAddExpense}
              disabled={isPending}
              loading={isPending}
              size="md"
              className="w-full active:scale-95 transition-all mt-1"
              aria-label="Aggiungi spesa"
            >
              <MessageCircle size={16} aria-hidden="true" />
              Aggiungi spesa
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
