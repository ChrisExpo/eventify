'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PackageCheck, Receipt, ChevronRight } from 'lucide-react'
import { Card, CardHeader, CardContent, Button, Input, useToast } from '@/components/ui'
import { addItem, assignItem } from '@/app/actions/items'
import { EVERYONE_ASSIGNMENT, EVERYONE_LABEL } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Item, Participant } from '@/types'
import ItemDetailModal from '@/components/event/ItemDetailModal'

interface ItemSectionProps {
  eventId: string
  initialItems: Item[]
  participants: Participant[]
}

export default function ItemSection({ eventId, initialItems, participants }: ItemSectionProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  // Form aggiunta item
  const [newItemName, setNewItemName] = useState('')
  const [newItemAssignTo, setNewItemAssignTo] = useState('')
  const [addError, setAddError] = useState('')

  // Item selezionato per il modale dettaglio
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)

  // Partecipanti confermati o forse (quelli che probabilmente vengono)
  const availableParticipants = participants.filter(
    (p) => p.status === 'confirmed' || p.status === 'maybe'
  )

  // Opzioni per la select di assegnazione rapida
  const assignSelectOptions = [
    { value: '', label: 'Nessuno' },
    { value: EVERYONE_ASSIGNMENT, label: `👥 ${EVERYONE_LABEL}` },
    ...availableParticipants.map((p) => ({ value: p.name, label: p.name })),
  ]

  async function handleAddItem() {
    const trimmed = newItemName.trim()
    if (!trimmed) {
      setAddError("Inserisci il nome dell'oggetto")
      return
    }
    setAddError('')

    startTransition(async () => {
      const result = await addItem(eventId, trimmed)
      if ('error' in result && result.error) {
        toast(result.error, 'error')
        return
      }

      // Se è stata scelta un'assegnazione, la applichiamo subito dopo la creazione
      // Dobbiamo ottenere l'ID del nuovo item — ma addItem non lo restituisce.
      // L'assegnazione verrà gestita via refresh: l'item appena creato sarà l'ultimo in lista.
      // Per ora, se c'è un assegnatario, usiamo l'approccio di assegnare dopo il refresh
      // interrogando l'item tramite il nome (non ideale). La soluzione corretta richiede
      // che addItem ritorni l'id — ma non possiamo modificare la server action in questo task.
      // Quindi: aggiungiamo l'item, poi se c'è assegnazione rapida la facciamo subito.
      if (newItemAssignTo) {
        // Recupera l'item appena creato per ottenere l'id
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: newItem } = await supabase
          .from('items')
          .select('id')
          .eq('event_id', eventId)
          .eq('name', trimmed)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (newItem?.id) {
          await assignItem(newItem.id, newItemAssignTo)
        }
      }

      setNewItemName('')
      setNewItemAssignTo('')
      router.refresh()
    })
  }

  return (
    <>
      <section aria-labelledby="items-heading">
        <Card>
          <CardHeader>
            <h2
              id="items-heading"
              className="flex items-center gap-2 font-headline text-lg font-bold text-on-surface"
            >
              <PackageCheck className="h-5 w-5 text-primary" aria-hidden="true" />
              Chi porta cosa
            </h2>
          </CardHeader>

          <CardContent>
            {/* Lista items */}
            {initialItems.length === 0 ? (
              <div className="text-center py-10 mb-4">
                <div className="text-5xl mb-4 inline-block animate-[pulse-ring_2s_ease-in-out_infinite]">
                  📦
                </div>
                <p className="text-on-surface-variant font-medium text-lg">
                  Nessun oggetto nella lista
                </p>
                <p className="text-on-surface-variant/70 text-sm mt-1">
                  Aggiungi qualcosa da portare!
                </p>
              </div>
            ) : (
              <ul className="space-y-2 mb-5" aria-label="Lista oggetti">
                {initialItems.map((item, index) => (
                  <li
                    key={item.id}
                    className="animate-fade-in"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      opacity: 0,
                      animationFillMode: 'forwards',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      aria-label={`Dettaglio: ${item.name}`}
                      className={cn(
                        'w-full flex items-center justify-between min-h-[44px] px-3 py-2',
                        'bg-surface-container-low rounded-[1rem]',
                        'cursor-pointer active:scale-[0.98] transition-all duration-150',
                        'hover:bg-surface-container-high',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                        isPending && 'opacity-60 pointer-events-none'
                      )}
                    >
                      {/* Parte sinistra: nome + prezzo */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-on-surface font-medium truncate">
                            {item.name}
                          </span>
                          {item.receipt_url && (
                            <Receipt
                              size={14}
                              className="text-tertiary flex-shrink-0"
                              aria-label="Scontrino presente"
                            />
                          )}
                        </div>
                        {item.amount != null && item.amount > 0 && (
                          <span className="text-sm text-tertiary font-medium">
                            €{item.amount.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Parte destra: badge assegnazione + chevron */}
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {item.assigned_to === EVERYONE_ASSIGNMENT ? (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
                            👥 {EVERYONE_LABEL}
                          </span>
                        ) : item.assigned_to ? (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-tertiary/10 text-tertiary border border-tertiary/20 max-w-[96px] truncate">
                            {item.assigned_to}
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/20 whitespace-nowrap">
                            Da assegnare
                          </span>
                        )}
                        <ChevronRight
                          size={16}
                          className="text-outline-variant"
                          aria-hidden="true"
                        />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Separatore */}
            {initialItems.length > 0 && (
              <div
                className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent mb-4"
                aria-hidden="true"
              />
            )}

            {/* Form aggiunta oggetto */}
            <div className="space-y-2">
              {/* Prima riga: input nome + select assegnazione */}
              <div className="flex gap-2">
                <Input
                  id="new-item"
                  aria-label="Cosa serve?"
                  placeholder="Cosa serve?"
                  value={newItemName}
                  onChange={(e) => {
                    setNewItemName(e.target.value)
                    if (addError) setAddError('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleAddItem() }
                  }}
                  error={addError}
                  disabled={isPending}
                  maxLength={100}
                  className="flex-1"
                />
                <div className="shrink-0 w-36">
                  <select
                    aria-label="Assegna a"
                    value={newItemAssignTo}
                    onChange={(e) => setNewItemAssignTo(e.target.value)}
                    disabled={isPending}
                    className={cn(
                      'w-full h-10 pl-3 pr-8 rounded-[1rem] border-none bg-surface-container-low',
                      'text-on-surface text-sm appearance-none',
                      'focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container-highest',
                      'transition duration-150 cursor-pointer',
                      !newItemAssignTo && 'text-outline-variant'
                    )}
                  >
                    {assignSelectOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Seconda riga: bottone aggiungi full width */}
              <Button
                onClick={handleAddItem}
                disabled={!newItemName.trim() || isPending}
                loading={isPending}
                size="md"
                className="w-full active:scale-95 transition-all"
                aria-label="Aggiungi oggetto alla lista"
              >
                Aggiungi
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Modale dettaglio item */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          eventId={eventId}
          participants={participants}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </>
  )
}
