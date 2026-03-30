'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Link2, AlignLeft, User, Tag } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { EventImagePicker } from '@/components/ui/EventImagePicker'
import { useToast } from '@/components/ui/Toast'

import { createEvent } from '@/app/actions/events'
import { EVENT_CATEGORIES, DEFAULT_EMOJI } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useUserName } from '@/hooks/useUserName'

const categoryOptions = EVENT_CATEGORIES.map((c) => ({
  value: c.value,
  label: `${c.emoji} ${c.label}`,
}))

// Helper per il min datetime: adesso + 30 minuti
function getMinDatetime(): string {
  const d = new Date(Date.now() + 30 * 60 * 1000)
  // formato YYYY-MM-DDTHH:MM richiesto da datetime-local
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface FormState {
  emoji: string
  title: string
  category: string
  date: string
  dateEnd: string
  locationName: string
  locationUrl: string
  description: string
  creatorName: string
}

interface FormErrors {
  title?: string
  creatorName?: string
}

export function CreateEventForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const { userName, loaded: userLoaded, saveUserName } = useUserName()

  const [form, setForm] = useState<FormState>({
    emoji: DEFAULT_EMOJI,
    title: '',
    category: 'altro',
    date: '',
    dateEnd: '',
    locationName: '',
    locationUrl: '',
    description: '',
    creatorName: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Pre-compila il nome organizzatore dal profilo salvato
  useEffect(() => {
    if (userLoaded && userName && !form.creatorName) {
      setForm((f) => ({ ...f, creatorName: userName }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoaded, userName])

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field in errors) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function validate(): boolean {
    const next: FormErrors = {}
    if (!form.title.trim()) next.title = 'Il titolo è obbligatorio'
    if (!form.creatorName.trim()) next.creatorName = 'Inserisci il tuo nome'
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
    fd.set('creator_name', form.creatorName.trim())

    if (imageFile) {
      fd.set('image', imageFile)
    }

    startTransition(async () => {
      const result = await createEvent(fd)

      if ('error' in result && result.error) {
        toast(result.error, 'error')
        return
      }

      if ('slug' in result && result.slug && result.creatorToken) {
        // Salva il creator token con la chiave dello slug reale
        localStorage.setItem(`event_${result.slug}_creator`, result.creatorToken)
        // Memorizza il nome per pre-compilazioni future
        saveUserName(form.creatorName.trim())
        toast('Evento creato con successo!', 'success')
        router.push(`/evento/${result.slug}`)
      }
    })
  }

  const minDatetime = getMinDatetime()

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Modulo creazione evento">
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
            }}
            onImageRemove={() => {
              setImageFile(null)
              setImagePreview(null)
            }}
          />
        </CardContent>
        <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent mx-4" aria-hidden="true" />

        {/* Sezione Info principali */}
        <CardContent className="flex flex-col gap-4 pt-5 pb-4">
          <SectionLabel icon={<Tag className="h-3.5 w-3.5" />} text="Informazioni principali" />

          <Input
            id="event-title"
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
            id="event-category"
            label="Categoria"
            name="category"
            options={categoryOptions}
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
          />

          <Input
            id="event-date"
            label="Data e ora"
            name="date"
            type="datetime-local"
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            min={minDatetime}
            className="cursor-pointer"
          />

          {form.date && (
            <Input
              id="event-date-end"
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
            id="event-location-name"
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
              id="event-location-url"
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
            id="event-description"
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

        {/* Sezione Organizzatore */}
        <CardContent className="flex flex-col gap-4 pt-5 pb-6">
          <SectionLabel icon={<User className="h-3.5 w-3.5" />} text="Chi organizza" />

          <Input
            id="event-creator-name"
            label="Il tuo nome *"
            name="creator_name"
            placeholder="Es. Marco, Giulia..."
            value={form.creatorName}
            onChange={(e) => set('creatorName', e.target.value)}
            error={errors.creatorName}
            autoComplete="name"
            maxLength={80}
          />

          <p className="text-xs text-on-surface-variant leading-relaxed">
            Il tuo nome verrà mostrato come organizzatore. Non serve registrarsi — salviamo un token
            nel tuo browser per riconoscerti come creatore.
          </p>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isPending}
            className="w-full mt-1"
          >
            {isPending ? 'Creazione in corso…' : 'Crea evento'}
          </Button>
        </CardContent>
      </Card>
    </form>
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
