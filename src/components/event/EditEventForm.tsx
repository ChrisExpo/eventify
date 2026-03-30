'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Link2, AlignLeft, Tag, Trash2, AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { EventImagePicker } from '@/components/ui/EventImagePicker'
import { useToast } from '@/components/ui/Toast'

import { updateEvent, deleteEvent } from '@/app/actions/events'
import { EVENT_CATEGORIES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Event } from '@/types'

// ─── Utils ────────────────────────────────────────────────────────────────────

const categoryOptions = EVENT_CATEGORIES.map((c) => ({
  value: c.value,
  label: `${c.emoji} ${c.label}`,
}))

/**
 * Converte un timestamptz ISO (es. "2025-08-10T18:30:00+00:00") nel formato
 * richiesto dall'input datetime-local: "YYYY-MM-DDTHH:MM"
 */
function toDatetimeLocal(isoDate: string): string {
  const d = new Date(isoDate)
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  emoji: string
  title: string
  category: string
  date: string
  dateEnd: string
  locationName: string
  locationUrl: string
  description: string
}

interface FormErrors {
  title?: string
}

interface EditEventFormProps {
  event: Event
  creatorToken: string
}

// ─── Dialog di conferma eliminazione ─────────────────────────────────────────

interface DeleteDialogProps {
  open: boolean
  isDeleting: boolean
  onConfirm: () => void
  onCancel: () => void
}

function DeleteDialog({ open, isDeleting, onConfirm, onCancel }: DeleteDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Pannello */}
      <div className="relative w-full max-w-sm bg-surface-container-highest rounded-2xl shadow-xl border border-primary/20 p-6 flex flex-col gap-4">
        {/* Icona */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-error/10 mx-auto">
          <AlertTriangle className="h-6 w-6 text-error" aria-hidden="true" />
        </div>

        <div className="text-center space-y-1.5">
          <h2
            id="delete-dialog-title"
            className="text-base font-semibold text-on-surface"
          >
            Eliminare l&apos;evento?
          </h2>
          <p
            id="delete-dialog-desc"
            className="text-sm text-on-surface-variant leading-relaxed"
          >
            Questa azione è <strong className="text-on-surface">irreversibile</strong>.
            L&apos;evento e tutti i dati associati (partecipanti, oggetti, spese) verranno
            eliminati definitivamente.
          </p>
        </div>

        <div className="flex flex-col gap-2 mt-1">
          <Button
            variant="danger"
            size="md"
            loading={isDeleting}
            onClick={onConfirm}
            className="w-full shadow-[0_0_15px_rgba(255,110,132,0.3)]"
          >
            {isDeleting ? 'Eliminazione in corso…' : 'Sì, elimina evento'}
          </Button>
          <Button
            ref={cancelRef}
            variant="secondary"
            size="md"
            onClick={onCancel}
            disabled={isDeleting}
            className="w-full"
          >
            Annulla
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principale ────────────────────────────────────────────────────

export function EditEventForm({ event, creatorToken }: EditEventFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const [form, setForm] = useState<FormState>({
    emoji: event.emoji ?? '🎉',
    title: event.title ?? '',
    category: event.category ?? 'altro',
    date: event.date ? toDatetimeLocal(event.date) : '',
    dateEnd: event.date_end ? toDatetimeLocal(event.date_end) : '',
    locationName: event.location_name ?? '',
    locationUrl: event.location_url ?? '',
    description: event.description ?? '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(
    event.image_url ?? null
  )
  const [removeImage, setRemoveImage] = useState(false)

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field in errors) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function validate(): boolean {
    const next: FormErrors = {}
    if (!form.title.trim()) next.title = 'Il titolo è obbligatorio'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validate()) return

    const fd = new FormData()
    fd.set('emoji', form.emoji)
    fd.set('title', form.title.trim())
    fd.set('category', form.category)
    // Converti la data locale in ISO con timezone per evitare offset UTC
    if (form.date) {
      fd.set('date', new Date(form.date).toISOString())
    }
    if (form.dateEnd) {
      fd.set('date_end', new Date(form.dateEnd).toISOString())
    }
    fd.set('location_name', form.locationName.trim())
    fd.set('location_url', form.locationUrl.trim())
    fd.set('description', form.description.trim())

    if (imageFile) {
      fd.set('image', imageFile)
    }
    if (removeImage) {
      fd.set('remove_image', 'true')
    }

    startTransition(async () => {
      const result = await updateEvent(event.slug, creatorToken, fd)

      if ('error' in result && result.error) {
        toast(result.error, 'error')
        return
      }

      toast('Evento aggiornato con successo!', 'success')
      router.refresh()
    })
  }

  function handleDeleteConfirm() {
    startDeleteTransition(async () => {
      const result = await deleteEvent(event.slug, creatorToken)

      if ('error' in result && result.error) {
        toast(result.error, 'error')
        setShowDeleteDialog(false)
        return
      }

      toast('Evento eliminato.', 'info')
      router.push('/')
    })
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate aria-label="Modulo modifica evento">
        <Card>
          {/* Sezione immagine / emoji */}
          <CardContent className="pt-6 pb-4">
            <p className="text-sm font-medium text-on-surface-variant mb-3">
              Immagine dell&apos;evento
            </p>
            <EventImagePicker
              emoji={form.emoji}
              onEmojiChange={(emoji) => set('emoji', emoji)}
              imageFile={imageFile}
              imagePreview={imagePreview}
              onImageChange={(file) => {
                setImageFile(file)
                setImagePreview(file ? URL.createObjectURL(file) : null)
                setRemoveImage(false)
              }}
              onImageRemove={() => {
                setImageFile(null)
                setImagePreview(null)
                setRemoveImage(true)
              }}
            />
          </CardContent>
          <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent mx-4" aria-hidden="true" />

          {/* Sezione Info principali */}
          <CardContent className="flex flex-col gap-4 pt-5 pb-4">
            <SectionLabel icon={<Tag className="h-3.5 w-3.5" />} text="Informazioni principali" />

            <Input
              id="edit-event-title"
              label="Titolo evento *"
              name="title"
              placeholder="Es. Grigliata di Ferragosto"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              error={errors.title}
              autoComplete="off"
              maxLength={120}
            />

            <Select
              id="edit-event-category"
              label="Categoria"
              name="category"
              options={categoryOptions}
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
            />

            <Input
              id="edit-event-date"
              label="Data e ora"
              name="date"
              type="datetime-local"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              className="cursor-pointer"
            />

            {form.date && (
              <Input
                id="edit-event-date-end"
                label="Data fine (opzionale)"
                name="date_end"
                type="datetime-local"
                value={form.dateEnd}
                onChange={(e) => set('dateEnd', e.target.value)}
                min={form.date}
                className="cursor-pointer"
              />
            )}
          </CardContent>
          <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent mx-4" aria-hidden="true" />

          {/* Sezione Luogo */}
          <CardContent className="flex flex-col gap-4 pt-5 pb-4">
            <SectionLabel icon={<MapPin className="h-3.5 w-3.5" />} text="Dove" />

            <Input
              id="edit-event-location-name"
              label="Nome del luogo"
              name="location_name"
              placeholder="Es. Parco delle Cascine, Casa mia..."
              value={form.locationName}
              onChange={(e) => set('locationName', e.target.value)}
              autoComplete="off"
              maxLength={200}
            />

            <div className="flex flex-col">
              <Input
                id="edit-event-location-url"
                label="Link Google Maps"
                name="location_url"
                type="url"
                placeholder="https://maps.google.com/..."
                value={form.locationUrl}
                onChange={(e) => set('locationUrl', e.target.value)}
                autoComplete="off"
              />
              <p className="text-xs text-on-surface-variant mt-1.5 flex items-center gap-1">
                <Link2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                Incolla il link diretto per guidare i partecipanti
              </p>
            </div>
          </CardContent>
          <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent mx-4" aria-hidden="true" />

          {/* Sezione Descrizione */}
          <CardContent className="flex flex-col gap-4 pt-5 pb-4">
            <SectionLabel icon={<AlignLeft className="h-3.5 w-3.5" />} text="Dettagli" />

            <Textarea
              id="edit-event-description"
              label="Descrizione"
              name="description"
              placeholder="Racconta qualcosa in più sull'evento: cosa portare, programma, ecc."
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              maxLength={1000}
              className="min-h-[100px]"
            />
            <p className="text-xs text-on-surface-variant -mt-2 text-right tabular-nums">
              {form.description.length}/1000
            </p>
          </CardContent>
          <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent mx-4" aria-hidden="true" />

          {/* Pulsante salva */}
          <CardContent className="pt-5 pb-5">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isPending}
              className="w-full"
            >
              {isPending ? 'Salvataggio in corso…' : 'Salva modifiche'}
            </Button>
          </CardContent>
          <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent mx-4" aria-hidden="true" />

          {/* Zona pericolosa */}
          <CardContent className="pt-5 pb-6">
            <div className="rounded-[1rem] border border-error/20 bg-error/5 p-4 flex flex-col gap-3">
              <div>
                <p className={cn('text-xs font-bold uppercase tracking-widest text-error flex items-center gap-1.5 mb-1')}>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Zona pericolosa
                </p>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  L&apos;eliminazione dell&apos;evento è permanente e non può essere annullata.
                  Tutti i partecipanti, oggetti e spese verranno rimossi.
                </p>
              </div>

              <Button
                type="button"
                variant="danger"
                size="md"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isPending}
                className="w-full sm:w-auto shadow-[0_0_15px_rgba(255,110,132,0.25)]"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Elimina evento
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <DeleteDialog
        open={showDeleteDialog}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </>
  )
}

// ─── Helper interno ────────────────────────────────────────────────────────────

interface SectionLabelProps {
  icon: React.ReactNode
  text: string
}

function SectionLabel({ icon, text }: SectionLabelProps) {
  return (
    <div className={cn('flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary')}>
      {icon}
      <span>{text}</span>
    </div>
  )
}
