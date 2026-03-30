'use client'

import { useState, useEffect } from 'react'
import { useUserName } from '@/hooks/useUserName'
import { useIsPWA } from '@/hooks/useIsPWA'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import PWAInstallGuide from './PWAInstallGuide'

// ─── WelcomeScreen fullscreen inserimento nome ────────────────────────────────

interface WelcomeScreenProps {
  onSave: (name: string) => void
}

function WelcomeScreen({ onSave }: WelcomeScreenProps) {
  const [name, setName] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed) onSave(trimmed)
  }

  return (
    <div
      className="fixed inset-0 z-[90] bg-background flex flex-col items-center justify-center px-6 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Inserisci il tuo nome per iniziare"
    >
      {/* Glow decorativo */}
      <div
        className="pointer-events-none fixed bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] rounded-full opacity-15"
        style={{ background: 'radial-gradient(ellipse, #fd68b3 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="w-full max-w-sm flex flex-col items-center gap-8 relative">

        {/* Logo */}
        <img
          src="/logo.png"
          alt="FriendsFest"
          className="h-16 w-auto neon-glow-primary rounded-2xl"
        />

        {/* Testo di benvenuto */}
        <div className="text-center space-y-2">
          <h1 className="font-headline text-3xl font-bold text-on-surface">
            Benvenuto!
          </h1>
          <p className="text-on-surface-variant text-base leading-relaxed">
            Come ti chiami?
          </p>
        </div>

        {/* Form nome */}
        <form
          className="w-full space-y-4"
          onSubmit={handleSubmit}
          aria-label="Inserisci il tuo nome"
        >
          <Input
            id="welcome-name"
            label="Il tuo nome"
            placeholder="Es. Marco, Sara..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            autoComplete="given-name"
            autoFocus
          />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!name.trim()}
          >
            Inizia
          </Button>
        </form>

        {/* Nota informativa */}
        <p className="text-center text-xs text-on-surface-variant/60 leading-relaxed px-4">
          Il nome verrà usato per creare e partecipare agli eventi.
          <br />
          Puoi modificarlo in qualsiasi momento dal profilo.
        </p>

      </div>
    </div>
  )
}

// ─── AuthGate ─────────────────────────────────────────────────────────────────

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { userName, loaded: nameLoaded, saveUserName } = useUserName()
  const { isPWA, loaded: pwaLoaded } = useIsPWA()

  const [showPWAGuide, setShowPWAGuide] = useState(false)
  const [guideDismissed, setGuideDismissed] = useState(false)

  useEffect(() => {
    if (!pwaLoaded) return
    if (isPWA) return

    const dismissed = localStorage.getItem('pwa_guide_dismissed')
    if (!dismissed) {
      setShowPWAGuide(true)
    }
  }, [pwaLoaded, isPWA])

  function dismissGuide() {
    localStorage.setItem('pwa_guide_dismissed', 'true')
    setShowPWAGuide(false)
    setGuideDismissed(true)
  }

  // ── Stato di caricamento iniziale ──────────────────────────────────────────
  if (!nameLoaded || !pwaLoaded) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <img
          src="/logo.png"
          alt="FriendsFest"
          className="h-16 w-auto animate-pulse"
        />
      </div>
    )
  }

  // ── 1. Guida installazione PWA (solo browser, non ancora dismissata) ───────
  if (showPWAGuide && !guideDismissed) {
    return <PWAInstallGuide onClose={dismissGuide} />
  }

  // ── 2. Gate nome obbligatorio ──────────────────────────────────────────────
  if (!userName) {
    return <WelcomeScreen onSave={saveUserName} />
  }

  // ── 3. App normale ─────────────────────────────────────────────────────────
  return <>{children}</>
}
