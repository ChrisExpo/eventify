'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Receipt, Trash2, Upload, Euro } from 'lucide-react'
import { Button, Input, useToast } from '@/components/ui'
import { updateItemDetails, deleteItem } from '@/app/actions/items'
import { validateImage } from '@/lib/image-utils'
import { EVERYONE_ASSIGNMENT, EVERYONE_LABEL } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Item, Participant } from '@/types'

interface ItemDetailModalProps {
  item: Item
  eventId: string
  onClose: () => void
  participants: Participant[]
}

export default function ItemDetailModal({
  item,
  eventId,
  onClose,
  participants,
}: ItemDetailModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  // Prezzo
  const [amountValue, setAmountValue] = useState(
    item.amount != null ? item.amount.toFixed(2) : ''
  )

  // Scontrino
  const [receiptPreview, setReceiptPreview] = useState<string | null>(
    item.receipt_url ?? null
  )
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptError, setReceiptError] = useState<string | null>(null)
  const receiptInputRef = useRef<HTMLInputElement>(null)

  // Conferma eliminazione
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Chiudi con Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Blocca scroll body quando il modal è aperto
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  function handleReceiptFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    e.target.value = ''
    if (!file) return

    const error = validateImage(file)
    if (error) {
      setReceiptError(error)
      return
    }

    setReceiptError(null)
    setReceiptFile(file)
    setReceiptPreview(URL.createObjectURL(file))
  }

  function handleRemoveReceiptLocal() {
    setReceiptFile(null)
    setReceiptPreview(null)
    setReceiptError(null)
  }

  async function handleSaveAmount() {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('amount', amountValue)
      const result = await updateItemDetails(item.id, eventId, fd)
      if ('error' in result && result.error) {
        toast(result.error, 'error')
        return
      }
      toast('Prezzo salvato', 'success')
      router.refresh()
      onClose()
    })
  }

  async function handleUploadReceipt() {
    if (!receiptFile && receiptPreview === null && item.receipt_url !== null) {
      // L'utente ha rimosso lo scontrino esistente
      startTransition(async () => {
        const fd = new FormData()
        fd.append('remove_receipt', 'true')
        const result = await updateItemDetails(item.id, eventId, fd)
        if ('error' in result && result.error) {
          toast(result.error, 'error')
          return
        }
        toast('Scontrino rimosso', 'success')
        router.refresh()
        onClose()
      })
      return
    }

    if (!receiptFile) return

    startTransition(async () => {
      const fd = new FormData()
      fd.append('receipt', receiptFile)
      const result = await updateItemDetails(item.id, eventId, fd)
      if ('error' in result && result.error) {
        toast(result.error, 'error')
        return
      }
      toast('Scontrino salvato', 'success')
      router.refresh()
      onClose()
    })
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    startTransition(async () => {
      const result = await deleteItem(item.id)
      if ('error' in result && result.error) {
        toast(result.error, 'error')
        return
      }
      toast('Oggetto eliminato', 'success')
      router.refresh()
      onClose()
    })
  }

  // Badge assegnazione
  function renderAssignmentBadge() {
    if (item.assigned_to === EVERYONE_ASSIGNMENT) {
      return (
        <span className="inline-flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          <span aria-hidden="true">👥</span> {EVERYONE_LABEL}
        </span>
      )
    }
    if (item.assigned_to) {
      return (
        <span className="inline-flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full bg-tertiary/10 text-tertiary border border-tertiary/20">
          {item.assigned_to}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
        Da assegnare
      </span>
    )
  }

  // Determina se lo scontrino è cambiato rispetto allo stato originale
  const receiptChanged =
    receiptFile !== null || (receiptPreview === null && item.receipt_url !== null)

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Bottom sheet panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-detail-title"
        className="fixed bottom-0 inset-x-0 z-50 bg-surface-container rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-in-up"
      >
        {/* Handle bar */}
        <div className="w-10 h-1 bg-outline-variant/30 rounded-full mx-auto mt-3 mb-1" aria-hidden="true" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/10">
          <h2
            id="item-detail-title"
            className="font-headline text-lg font-bold text-on-surface truncate pr-4"
          >
            {item.name}
          </h2>
          <button
            onClick={onClose}
            aria-label="Chiudi dettaglio"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 shrink-0"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Corpo */}
        <div className="px-5 py-4 space-y-6 pb-safe-area">

          {/* Assegnazione */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-on-surface-variant font-medium">Assegnato a:</span>
            {renderAssignmentBadge()}
          </div>

          {/* Separatore */}
          <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" aria-hidden="true" />

          {/* Sezione Prezzo */}
          <section aria-labelledby="price-section-heading">
            <h3
              id="price-section-heading"
              className="text-xs font-bold uppercase tracking-widest text-primary mb-3"
            >
              Prezzo
            </h3>

            <div className="flex gap-2 items-end">
              <div className="relative flex-1">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                  aria-hidden="true"
                >
                  <Euro size={15} />
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  aria-label="Prezzo dell'oggetto in euro"
                  placeholder="0.00"
                  value={amountValue}
                  onChange={(e) => setAmountValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleSaveAmount() }
                  }}
                  className={cn(
                    'w-full h-10 pl-9 pr-3 rounded-[1rem] border-none bg-surface-container-low',
                    'text-on-surface placeholder:text-outline-variant',
                    'focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container-highest',
                    'transition duration-150'
                  )}
                />
              </div>
              <Button
                size="md"
                onClick={handleSaveAmount}
                disabled={isPending}
                loading={isPending}
                className="shrink-0"
              >
                Salva
              </Button>
            </div>
          </section>

          {/* Separatore */}
          <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" aria-hidden="true" />

          {/* Sezione Scontrino */}
          <section aria-labelledby="receipt-section-heading">
            <h3
              id="receipt-section-heading"
              className="text-xs font-bold uppercase tracking-widest text-primary mb-3"
            >
              Scontrino
            </h3>

            {receiptPreview ? (
              /* Preview scontrino */
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-surface-container-high">
                  <img
                    src={receiptPreview}
                    alt="Anteprima foto scontrino"
                    className="w-full h-auto rounded-2xl object-contain max-h-64"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveReceiptLocal}
                    disabled={isPending}
                    className="text-error hover:bg-error/10 border border-error/20"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    Rimuovi
                  </Button>
                  {receiptChanged && (
                    <Button
                      size="sm"
                      onClick={handleUploadReceipt}
                      disabled={isPending}
                      loading={isPending}
                    >
                      {receiptFile ? 'Carica scontrino' : 'Rimuovi scontrino'}
                    </Button>
                  )}
                </div>
                {receiptChanged && receiptFile === null && receiptPreview === null && (
                  <p className="text-xs text-on-surface-variant">
                    Clicca &quot;Rimuovi scontrino&quot; per confermare la rimozione.
                  </p>
                )}
              </div>
            ) : (
              /* Area upload */
              <div className="space-y-3">
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-outline-variant/30 rounded-2xl p-6 text-center hover:border-primary/40 hover:bg-surface-container-high/50 transition-all active:scale-[0.98]">
                    <Receipt
                      size={36}
                      className="mx-auto text-on-surface-variant mb-2"
                      aria-hidden="true"
                    />
                    <p className="text-on-surface font-medium text-sm">Carica foto scontrino</p>
                    <p className="text-on-surface-variant text-xs mt-1">
                      JPG, PNG, WebP &bull; Max 5&nbsp;MB
                    </p>
                  </div>
                  <input
                    ref={receiptInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    aria-label="Carica foto scontrino"
                    onChange={handleReceiptFileSelect}
                  />
                </label>

                {receiptError && (
                  <p role="alert" className="text-xs text-error font-medium">
                    {receiptError}
                  </p>
                )}

                {receiptFile && (
                  <Button
                    size="sm"
                    onClick={handleUploadReceipt}
                    disabled={isPending}
                    loading={isPending}
                    className="w-full"
                  >
                    <Upload size={14} aria-hidden="true" />
                    Carica scontrino
                  </Button>
                )}
              </div>
            )}
          </section>

          {/* Separatore */}
          <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" aria-hidden="true" />

          {/* Sezione Azioni */}
          <section aria-labelledby="actions-section-heading">
            <h3
              id="actions-section-heading"
              className="text-xs font-bold uppercase tracking-widest text-primary mb-3"
            >
              Azioni
            </h3>

            {confirmDelete ? (
              <div className="space-y-2 p-4 rounded-2xl bg-error/5 border border-error/20">
                <p className="text-sm text-on-surface font-medium">
                  Eliminare &quot;{item.name}&quot;?
                </p>
                <p className="text-xs text-on-surface-variant">
                  Questa azione non può essere annullata.
                </p>
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isPending}
                    loading={isPending}
                    className="flex-1"
                  >
                    Elimina
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(false)}
                    disabled={isPending}
                    className="flex-1"
                  >
                    Annulla
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="danger"
                size="md"
                onClick={handleDelete}
                disabled={isPending}
                className="w-full"
              >
                <Trash2 size={16} aria-hidden="true" />
                Elimina oggetto
              </Button>
            )}
          </section>

          {/* Spazio sicuro in basso per i dispositivi con notch */}
          <div className="h-4" aria-hidden="true" />
        </div>
      </div>
    </>
  )
}
