'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'

import { useLocalToken } from '@/hooks/useLocalToken'
import { createClient } from '@/lib/supabase/client'
import { EditEventForm } from '@/components/event/EditEventForm'
import { Card, CardContent } from '@/components/ui/Card'
import AppBar from '@/components/ui/AppBar'
import type { Event } from '@/types'

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function EditPageSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Caricamento in corso">
      <Card>
        {/* Emoji */}
        <CardContent className="pt-6 pb-4 border-b border-outline-variant/10">
          <div className="h-4 w-40 bg-surface-container rounded mb-3" />
          <div className="flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 w-10 bg-surface-container rounded-[1rem]" />
            ))}
          </div>
        </CardContent>

        {/* Campi */}
        {Array.from({ length: 3 }).map((_, section) => (
          <CardContent
            key={section}
            className="flex flex-col gap-4 pt-5 pb-4 border-b border-outline-variant/10"
          >
            <div className="h-3 w-28 bg-surface-container rounded" />
            <div className="space-y-2">
              <div className="h-3 w-20 bg-surface-container rounded" />
              <div className="h-10 bg-surface-container rounded-[1rem]" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-24 bg-surface-container rounded" />
              <div className="h-10 bg-surface-container rounded-[1rem]" />
            </div>
          </CardContent>
        ))}

        {/* Pulsante */}
        <CardContent className="pt-5 pb-5">
          <div className="h-12 bg-surface-container rounded-[1rem]" />
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Accesso negato ───────────────────────────────────────────────────────────

function AccessDenied({ slug }: { slug: string }) {
  return (
    <Card>
      <CardContent className="py-10 flex flex-col items-center gap-4 text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
          <Lock className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <div className="space-y-1.5">
          <p className="font-semibold text-on-surface">Accesso non autorizzato</p>
          <p className="text-sm text-on-surface-variant leading-relaxed max-w-xs">
            Solo il creatore dell&apos;evento può modificarlo. Se hai creato questo evento
            su un altro dispositivo o browser, il token non è disponibile qui.
          </p>
        </div>
        <Link
          href={`/evento/${slug}`}
          className="text-sm font-medium text-primary hover:text-secondary underline underline-offset-2 transition-colors"
        >
          Torna all&apos;evento
        </Link>
      </CardContent>
    </Card>
  )
}

// ─── Errore fetch ─────────────────────────────────────────────────────────────

function FetchError({ slug }: { slug: string }) {
  return (
    <Card>
      <CardContent className="py-10 flex flex-col items-center gap-4 text-center">
        <p className="font-semibold text-on-surface">Evento non trovato</p>
        <p className="text-sm text-on-surface-variant">
          L&apos;evento potrebbe essere stato eliminato o il link non è valido.
        </p>
        <Link
          href="/"
          className="text-sm font-medium text-primary hover:text-secondary underline underline-offset-2 transition-colors"
        >
          Torna alla home
        </Link>
      </CardContent>
    </Card>
  )
}

// ─── Pagina ───────────────────────────────────────────────────────────────────

export default function EditEventPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const { creatorToken, loaded } = useLocalToken(slug)

  const [event, setEvent] = useState<Event | null>(null)
  const [fetchError, setFetchError] = useState(false)
  const [fetchDone, setFetchDone] = useState(false)

  // Fetch dell'evento solo quando il token è confermato
  useEffect(() => {
    if (!loaded || !creatorToken) return

    const supabase = createClient()

    supabase
      .from('events')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setFetchError(true)
        } else {
          setEvent(data)
        }
        setFetchDone(true)
      })
  }, [loaded, creatorToken, slug])

  return (
    <main className="min-h-screen bg-background">
      <AppBar title="Modifica evento" showBack />

      <div className="mx-auto max-w-lg px-4 pt-[calc(3.5rem+env(safe-area-inset-top))] pb-24 space-y-5">
        <div>
          <p className="text-sm text-on-surface-variant mt-1">
            Le modifiche saranno visibili a tutti i partecipanti.
          </p>
        </div>

        {/* Stati di rendering */}
        {!loaded && <EditPageSkeleton />}

        {loaded && !creatorToken && <AccessDenied slug={slug} />}

        {loaded && creatorToken && !fetchDone && <EditPageSkeleton />}

        {loaded && creatorToken && fetchDone && fetchError && (
          <FetchError slug={slug} />
        )}

        {loaded && creatorToken && fetchDone && !fetchError && event && (
          <EditEventForm event={event} creatorToken={creatorToken} />
        )}
      </div>
    </main>
  )
}
