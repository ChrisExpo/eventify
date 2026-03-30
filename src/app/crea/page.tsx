import AppBar from '@/components/ui/AppBar'
import { CreateEventForm } from '@/components/event/CreateEventForm'

export const metadata = {
  title: 'Crea evento — Eventify',
  description: 'Organizza un nuovo evento e condividilo con i tuoi amici.',
}

export default function CreaPage() {
  return (
    <div className="flex flex-col min-h-full bg-background">
      <AppBar title="Crea evento" showBack />

      <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-[calc(3.5rem+env(safe-area-inset-top))] pb-16 sm:px-6">
        {/* Header compatto */}
        <header className="relative overflow-hidden text-center mb-8 pt-6">
          {/* Ambient glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(211,148,255,0.12),transparent_70%)] pointer-events-none"
            aria-hidden="true"
          />

          <div
            className="animate-slide-in-up"
            style={{ animationDelay: '0ms', opacity: 0, animationFillMode: 'forwards' }}
          >
            <div
              aria-hidden="true"
              className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 border-2 border-primary/20 mb-5 neon-glow-primary"
            >
              <span className="text-5xl leading-none">🎉</span>
            </div>

            <h1 className="font-headline text-4xl sm:text-5xl font-bold leading-tight tracking-tight mb-2 bg-gradient-to-r from-primary to-primary-dim bg-clip-text text-transparent">
              Crea il tuo evento
            </h1>

            <p className="text-on-surface-variant text-base leading-relaxed max-w-sm mx-auto">
              Organizza uscite, grigliate, cene e tanto altro.
              <br className="hidden sm:block" />
              Condividi su WhatsApp!
            </p>
          </div>
        </header>

        {/* Form */}
        <div
          className="animate-slide-in-up"
          style={{ animationDelay: '100ms', opacity: 0, animationFillMode: 'forwards' }}
        >
          <CreateEventForm />
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-6 px-4">
        <p className="text-xs text-on-surface-variant">
          Eventify &mdash; Organizza eventi senza stress
        </p>
      </footer>
    </div>
  )
}
