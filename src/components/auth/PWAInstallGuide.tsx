'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

interface PWAInstallGuideProps {
  onClose: () => void
}

// ─── Icona Share di Safari (iOS) ──────────────────────────────────────────────

function ShareIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5 inline-block"
      aria-hidden="true"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}

// ─── Icona Menu tre puntini (Android) ─────────────────────────────────────────

function MenuDotsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5 inline-block"
      aria-hidden="true"
    >
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
    </svg>
  )
}

// ─── Step numerato ────────────────────────────────────────────────────────────

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center mt-0.5"
        aria-hidden="true"
      >
        {number}
      </span>
      <span className="text-on-surface-variant leading-snug">{children}</span>
    </li>
  )
}

// ─── Componente principale ────────────────────────────────────────────────────

export default function PWAInstallGuide({ onClose }: PWAInstallGuideProps) {
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent))
  }, [])

  // Costruisce le due sezioni in ordine: prima quella rilevante per il device
  const iosSection = (
    <div className="bg-surface-container rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden="true">
          <ShareIcon />
        </span>
        <h3 className="font-headline font-bold text-on-surface text-sm uppercase tracking-widest">
          Su iPhone / iPad
        </h3>
      </div>
      <ol className="space-y-3">
        <Step number={1}>
          Tocca l&apos;icona{' '}
          <span className="inline-flex items-center gap-1 text-primary font-medium">
            <ShareIcon /> Condividi
          </span>{' '}
          in basso nella barra di Safari
        </Step>
        <Step number={2}>
          Scorri verso il basso e tocca{' '}
          <span className="text-primary font-medium">"Aggiungi alla schermata Home"</span>
        </Step>
        <Step number={3}>
          Tocca <span className="text-primary font-medium">"Aggiungi"</span> in alto a destra
        </Step>
      </ol>
    </div>
  )

  const androidSection = (
    <div className="bg-surface-container rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden="true">
          <MenuDotsIcon />
        </span>
        <h3 className="font-headline font-bold text-on-surface text-sm uppercase tracking-widest">
          Su Android
        </h3>
      </div>
      <ol className="space-y-3">
        <Step number={1}>
          Tocca il menu{' '}
          <span className="inline-flex items-center gap-1 text-primary font-medium">
            <MenuDotsIcon /> tre puntini
          </span>{' '}
          in alto a destra nel browser
        </Step>
        <Step number={2}>
          Tocca{' '}
          <span className="text-primary font-medium">"Installa app"</span>
          {' '}o{' '}
          <span className="text-primary font-medium">"Aggiungi a schermata Home"</span>
        </Step>
        <Step number={3}>
          Conferma toccando <span className="text-primary font-medium">"Installa"</span>
        </Step>
      </ol>
    </div>
  )

  return (
    <div
      className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center px-6 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Guida installazione FriendsFest"
    >
      {/* Glow decorativo di sfondo */}
      <div
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(ellipse, #d394ff 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="w-full max-w-sm flex flex-col gap-6 relative">

        {/* Logo + titolo */}
        <div className="flex flex-col items-center gap-4 text-center">
          <img
            src="/logo.png"
            alt="FriendsFest"
            className="h-16 w-auto neon-glow-primary rounded-2xl"
          />
          <div>
            <h1 className="font-headline text-2xl font-bold text-on-surface leading-tight">
              Installa FriendsFest
            </h1>
            <p className="text-on-surface-variant mt-1.5 text-sm leading-relaxed">
              Aggiungila alla home screen per un&apos;esperienza completa,{' '}
              senza barra del browser
            </p>
          </div>
        </div>

        {/* Istruzioni: prima la sezione del device corrente */}
        <div className="space-y-3">
          {isIOS ? (
            <>
              {iosSection}
              {androidSection}
            </>
          ) : (
            <>
              {androidSection}
              {iosSection}
            </>
          )}
        </div>

        {/* Pulsante chiudi */}
        <Button
          variant="ghost"
          size="lg"
          className="w-full border border-outline-variant/30"
          onClick={onClose}
        >
          Chiudi e continua nel browser
        </Button>

      </div>
    </div>
  )
}
