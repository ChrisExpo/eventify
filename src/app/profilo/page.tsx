'use client'

import { useState, useRef } from 'react'
import { Pencil, Check, Camera, X, ImagePlus } from 'lucide-react'

import { useUserName } from '@/hooks/useUserName'
import { useMyEvents } from '@/hooks/useMyEvents'
import { EventListCard } from '@/components/event/EventListCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'
import { validateImage } from '@/lib/image-utils'
import { cn } from '@/lib/utils'

// ─── Skeleton loading ─────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <main className="min-h-dvh bg-background pt-[env(safe-area-inset-top)] px-4 pb-28">
      <div className="max-w-lg mx-auto pt-6 space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-surface-container animate-pulse" />
          <div className="h-6 w-32 bg-surface-container rounded animate-pulse" />
        </div>
      </div>
    </main>
  )
}

// ─── Welcome state (nessun nome salvato) ──────────────────────────────────────

interface WelcomeScreenProps {
  editName: string
  onChangeName: (v: string) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}

function WelcomeScreen({ editName, onChangeName, onSubmit }: WelcomeScreenProps) {
  return (
    <main className="min-h-dvh bg-background pt-[env(safe-area-inset-top)] px-4 pb-28">
      <div className="max-w-lg mx-auto pt-6">
        <div className="text-center py-16">
          <div
            className="w-24 h-24 rounded-full bg-primary/10 border border-primary/20 neon-glow-primary flex items-center justify-center mx-auto mb-6"
            aria-hidden="true"
          >
            <span className="text-5xl">👋</span>
          </div>

          <h1 className="text-2xl font-headline font-bold text-on-surface mb-2">
            Benvenuto su Eventify
          </h1>
          <p className="text-on-surface-variant mb-8">
            Inserisci il tuo nome per personalizzare l&apos;esperienza
          </p>

          <form
            className="max-w-xs mx-auto space-y-4"
            onSubmit={onSubmit}
            aria-label="Inserisci il tuo nome"
          >
            <Input
              id="welcome-name"
              label="Il tuo nome"
              placeholder="Come ti chiami?"
              value={editName}
              onChange={(e) => onChangeName(e.target.value)}
              maxLength={30}
              autoComplete="given-name"
            />
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={!editName.trim()}
            >
              Inizia
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}

// ─── Skeleton card evento ─────────────────────────────────────────────────────

function EventSkeletonCard() {
  return (
    <div className="bg-surface-container-high rounded-[1rem] p-4 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-surface-container flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-surface-container rounded w-3/4" />
          <div className="h-3 bg-surface-container rounded w-1/2" />
        </div>
      </div>
    </div>
  )
}

// ─── Pagina profilo principale ────────────────────────────────────────────────

export default function ProfiloPage() {
  const { userName, avatarUrl, loaded, saveUserName, saveAvatarUrl, clearAvatarUrl } = useUserName()
  const { events, loading } = useMyEvents()
  const { toast } = useToast()

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Upload avatar
  async function handleAvatarUpload(file: File) {
    const error = validateImage(file)
    if (error) {
      toast(error, 'error')
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()

      // Genera un ID unico per l'utente basato su ciò che ha in localStorage
      let userId = localStorage.getItem('eventify_user_id')
      if (!userId) {
        userId = crypto.randomUUID()
        localStorage.setItem('eventify_user_id', userId)
      }

      const ext = file.name.split('.').pop() || 'jpg'
      const filePath = `${userId}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: true,
        })

      if (uploadError) {
        toast('Errore nel caricamento della foto', 'error')
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath)

      // Aggiungi timestamp per cache busting
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`
      saveAvatarUrl(urlWithCacheBust)
      toast('Foto profilo aggiornata', 'success')
    } catch {
      toast('Errore nel caricamento della foto', 'error')
    } finally {
      setUploading(false)
    }
  }

  async function handleRemoveAvatar() {
    try {
      const supabase = createClient()
      const userId = localStorage.getItem('eventify_user_id')
      if (userId) {
        const { data: files } = await supabase.storage.from('user-avatars').list(userId)
        if (files && files.length > 0) {
          await supabase.storage.from('user-avatars').remove(files.map(f => `${userId}/${f.name}`))
        }
      }
    } catch {
      // Ignora errori di eliminazione
    }
    clearAvatarUrl()
    toast('Foto profilo rimossa', 'info')
  }

  // Stato skeleton
  if (!loaded) {
    return <ProfileSkeleton />
  }

  // Stato welcome: nessun nome salvato
  if (!userName) {
    return (
      <WelcomeScreen
        editName={editName}
        onChangeName={setEditName}
        onSubmit={(e) => {
          e.preventDefault()
          const trimmed = editName.trim()
          if (trimmed) saveUserName(trimmed)
        }}
      />
    )
  }

  // Stato normale: profilo con nome
  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const createdEvents = events.filter((e) => e.role === 'creator')
  const participatedEvents = events.filter((e) => e.role === 'participant')

  return (
    <main className="min-h-dvh bg-background pt-[env(safe-area-inset-top)] px-4 pb-28">
      <div className="max-w-lg mx-auto pt-6 space-y-8">

        {/* Header profilo */}
        <div className="text-center animate-fade-in">
          {/* Avatar con foto o iniziali */}
          <div className="relative inline-block mb-4">
            <div
              className={cn(
                'w-24 h-24 rounded-full overflow-hidden mx-auto',
                'shadow-[0_0_30px_rgba(211,148,255,0.3)]',
                !avatarUrl && 'bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center'
              )}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`Foto di ${userName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-headline font-bold text-white">{initials}</span>
              )}
            </div>

            {/* Pulsante cambio foto */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={cn(
                'absolute -bottom-1 -right-1 w-9 h-9 rounded-full',
                'bg-surface-container-highest border-2 border-background',
                'flex items-center justify-center',
                'text-primary hover:text-secondary transition-colors',
                'active:scale-95',
                uploading && 'opacity-50 pointer-events-none'
              )}
              aria-label="Cambia foto profilo"
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera size={16} />
              )}
            </button>

            {/* Pulsante rimuovi foto (solo se c'è una foto) */}
            {avatarUrl && !uploading && (
              <button
                onClick={handleRemoveAvatar}
                className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-error/80 text-white flex items-center justify-center active:scale-95 transition-all"
                aria-label="Rimuovi foto profilo"
              >
                <X size={12} />
              </button>
            )}

            {/* Input file nascosto */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) handleAvatarUpload(file)
              }}
            />
          </div>

          {/* Nome con modifica inline */}
          {isEditing ? (
            <form
              className="flex items-center justify-center gap-2 max-w-xs mx-auto"
              aria-label="Modifica il tuo nome"
              onSubmit={(e) => {
                e.preventDefault()
                const trimmed = editName.trim()
                if (trimmed) {
                  saveUserName(trimmed)
                  setIsEditing(false)
                }
              }}
            >
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-surface-container-low border-none rounded-full px-4 py-2 text-center text-on-surface font-headline font-bold text-lg focus:ring-1 focus:ring-primary neon-glow-focus w-full"
                autoFocus
                maxLength={30}
                aria-label="Nuovo nome"
              />
              <button
                type="submit"
                aria-label="Conferma nome"
                className="w-10 h-10 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center flex-shrink-0 active:scale-95 transition-all"
              >
                <Check size={18} aria-hidden="true" />
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-headline font-bold text-on-surface">{userName}</h1>
              <button
                onClick={() => {
                  setEditName(userName)
                  setIsEditing(true)
                }}
                aria-label="Modifica nome"
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors active:scale-95"
              >
                <Pencil size={14} aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Hint per aggiungere foto */}
          {!avatarUrl && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 text-sm text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5 mx-auto"
            >
              <ImagePlus size={14} />
              Aggiungi una foto profilo
            </button>
          )}
        </div>

        {/* Divider */}
        <div
          className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"
          aria-hidden="true"
        />

        {/* Skeleton eventi durante caricamento */}
        {loading && (
          <div className="space-y-3" aria-busy="true" aria-label="Caricamento eventi in corso">
            <EventSkeletonCard />
            <EventSkeletonCard />
          </div>
        )}

        {/* I miei eventi (creati) */}
        {!loading && (
          <section
            aria-labelledby="created-events-heading"
            className="animate-slide-in-up"
            style={{ animationDelay: '100ms', opacity: 0, animationFillMode: 'forwards' }}
          >
            <h2
              id="created-events-heading"
              className="text-sm font-bold uppercase tracking-widest text-primary mb-4"
            >
              I miei eventi ({createdEvents.length})
            </h2>

            {createdEvents.length > 0 ? (
              <ul className="space-y-3">
                {createdEvents.map((event, i) => (
                  <li
                    key={event.id}
                    className="animate-fade-in"
                    style={{
                      animationDelay: `${i * 60}ms`,
                      opacity: 0,
                      animationFillMode: 'forwards',
                    }}
                  >
                    <EventListCard event={event} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6">
                <p className="text-on-surface-variant">Non hai ancora creato eventi</p>
              </div>
            )}
          </section>
        )}

        {/* Divider tra sezioni (solo se ci sono partecipazioni) */}
        {!loading && participatedEvents.length > 0 && (
          <div
            className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"
            aria-hidden="true"
          />
        )}

        {/* Partecipazioni */}
        {!loading && participatedEvents.length > 0 && (
          <section
            aria-labelledby="participated-events-heading"
            className="animate-slide-in-up"
            style={{ animationDelay: '200ms', opacity: 0, animationFillMode: 'forwards' }}
          >
            <h2
              id="participated-events-heading"
              className="text-sm font-bold uppercase tracking-widest text-secondary mb-4"
            >
              Partecipazioni ({participatedEvents.length})
            </h2>

            <ul className="space-y-3">
              {participatedEvents.map((event, i) => (
                <li
                  key={event.id}
                  className="animate-fade-in"
                  style={{
                    animationDelay: `${i * 60}ms`,
                    opacity: 0,
                    animationFillMode: 'forwards',
                  }}
                >
                  <EventListCard event={event} />
                </li>
              ))}
            </ul>
          </section>
        )}

      </div>
    </main>
  )
}
