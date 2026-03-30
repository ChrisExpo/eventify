# Eventify — PWA Organizzatore Eventi

## Overview

PWA per organizzare eventi di gruppo (uscite, grigliate, Pasquetta, compleanni, gite, cene, ecc.). Nessun login obbligatorio per i partecipanti — solo il creatore dell'evento può modificarlo. Condivisione nativa via WhatsApp con messaggi pre-formattati e link con preview Open Graph.

**Deploy:** Vercel (free tier)
**Stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Supabase (DB + Auth opzionale), PWA via `next-pwa` o `@serwist/next`

---

## Tech Stack & Dipendenze

```
next: 14+
typescript
tailwindcss
supabase-js (client)
@supabase/ssr (per server components)
next-pwa o @serwist/next (service worker / PWA)
nanoid (generazione ID brevi per link evento)
date-fns (gestione date, locale it)
lucide-react (icone)
```

---

## Database Schema (Supabase / PostgreSQL)

### Tabella `events`

| Colonna         | Tipo                  | Note                                         |
|-----------------|-----------------------|----------------------------------------------|
| id              | uuid (PK, default)    | gen_random_uuid()                            |
| slug            | text (unique, indexed) | Generato con nanoid(10), usato nell'URL      |
| title           | text (not null)       | Nome evento                                  |
| description     | text                  | Descrizione opzionale                        |
| emoji           | text                  | Emoji icona evento (default: 🎉)             |
| category        | text                  | enum-like: grigliata, cena, gita, sport, compleanno, festa, altro |
| date            | timestamptz (not null)| Data e ora evento                            |
| location_name   | text                  | Nome luogo (es. "Villa a Castel Volturno")   |
| location_url    | text                  | Link Google Maps                             |
| creator_name    | text (not null)       | Nome di chi crea l'evento                    |
| creator_token   | text (not null)       | Token segreto per edit (salvato in localStorage) |
| created_at      | timestamptz           | default now()                                |
| updated_at      | timestamptz           | default now()                                |

### Tabella `participants`

| Colonna    | Tipo                    | Note                                     |
|------------|-------------------------|------------------------------------------|
| id         | uuid (PK, default)      |                                          |
| event_id   | uuid (FK → events.id)   | ON DELETE CASCADE                        |
| name       | text (not null)         | Nome partecipante                        |
| status     | text (not null)         | 'confirmed' / 'maybe' / 'declined'      |
| token      | text (not null)         | Token per modificare la propria risposta |
| created_at | timestamptz             | default now()                            |

**Unique constraint:** (event_id, name) — un nome per evento.

### Tabella `items` (Chi porta cosa)

| Colonna    | Tipo                    | Note                                     |
|------------|-------------------------|------------------------------------------|
| id         | uuid (PK, default)      |                                          |
| event_id   | uuid (FK → events.id)   | ON DELETE CASCADE                        |
| name       | text (not null)         | Cosa portare (es. "Bibite", "Carbonella")|
| assigned_to| text                    | Nome di chi se lo prende (nullable)      |
| created_at | timestamptz             | default now()                            |

### Tabella `expenses`

| Colonna    | Tipo                    | Note                                     |
|------------|-------------------------|------------------------------------------|
| id         | uuid (PK, default)      |                                          |
| event_id   | uuid (FK → events.id)   | ON DELETE CASCADE                        |
| description| text (not null)         | Cosa è stato pagato                      |
| amount     | numeric(10,2) (not null)| Importo in euro                          |
| paid_by    | text (not null)         | Nome di chi ha pagato                    |
| split_among| text[] (not null)       | Array nomi tra cui dividere              |
| created_at | timestamptz             | default now()                            |

### Tabella `polls`

| Colonna    | Tipo                    | Note                                     |
|------------|-------------------------|------------------------------------------|
| id         | uuid (PK, default)      |                                          |
| event_id   | uuid (FK → events.id)   | ON DELETE CASCADE                        |
| question   | text (not null)         | Domanda del sondaggio                    |
| type       | text (not null)         | 'single' / 'multiple'                   |
| created_at | timestamptz             | default now()                            |

### Tabella `poll_options`

| Colonna    | Tipo                    | Note                                     |
|------------|-------------------------|------------------------------------------|
| id         | uuid (PK, default)      |                                          |
| poll_id    | uuid (FK → polls.id)    | ON DELETE CASCADE                        |
| text       | text (not null)         | Testo opzione                            |
| votes      | text[] (default '{}')   | Array nomi di chi ha votato              |

### RLS (Row Level Security)

Abilitare RLS su tutte le tabelle. Policy:
- **SELECT**: aperto a tutti (anon) — gli eventi sono pubblici via link
- **INSERT**: aperto a tutti (anon) — chiunque con il link può partecipare
- **UPDATE/DELETE su events**: solo chi presenta il `creator_token` corretto (via header custom o filtro nella query)
- **UPDATE su participants**: solo chi presenta il proprio `token`

---

## Struttura Pagine (App Router)

```
app/
├── page.tsx                    # Homepage: crea nuovo evento
├── evento/[slug]/
│   ├── page.tsx                # Vista evento pubblica (partecipanti, items, spese, sondaggi)
│   └── modifica/
│       └── page.tsx            # Edit evento (protetto da creator_token in localStorage)
├── layout.tsx                  # Layout base con PWA meta tags
├── manifest.json               # PWA manifest
└── api/
    └── og/[slug]/route.tsx     # Dynamic Open Graph image generation
```

---

## Funzionalità Dettagliate

### 1. Creazione Evento (Homepage)

Form con:
- **Emoji picker** semplice (griglia di emoji comuni per categoria evento)
- **Titolo** (obbligatorio)
- **Categoria** (select: grigliata 🔥, cena 🍽️, gita 🏔️, sport ⚽, compleanno 🎂, festa 🎉, altro 📌)
- **Data e ora** (date-time picker)
- **Luogo** (nome + link Google Maps opzionale)
- **Descrizione** (textarea opzionale)
- **Il tuo nome** (obbligatorio — sei il creatore)

Al submit:
1. Genera `slug` con `nanoid(10)`
2. Genera `creator_token` con `nanoid(20)`
3. Salva su Supabase
4. Salva `creator_token` in `localStorage` con chiave `event_{slug}_token`
5. Redirect a `/evento/{slug}`

### 2. Vista Evento (`/evento/[slug]`)

Layout a sezioni (tab o accordion su mobile):

#### Header Evento
- Emoji grande + titolo
- Data formattata in italiano (es. "Lunedì 21 Aprile 2025, ore 13:00")
- Luogo con link Maps cliccabile
- Descrizione
- **Pulsante "Condividi su WhatsApp"** (prominente, verde WhatsApp)
- **Pulsante "Copia link"**

#### Sezione Partecipanti
- Lista partecipanti raggruppati per stato: ✅ Confermati, 🤔 Forse, ❌ Non vengono
- Conteggio (es. "8 confermati, 2 forse")
- Form in basso: "Come ti chiami?" + 3 pulsanti stato
- Chi ha già risposto può modificare (riconoscimento via token in localStorage)

#### Sezione "Chi porta cosa"
- Lista items con checkbox assegnazione
- Chiunque può aggiungere voci
- Chiunque può assegnarsi una voce (click → inserisci nome o seleziona tra partecipanti)
- Voce non assegnata = evidenziata come "Da assegnare"

#### Sezione Spese
- Lista spese: "Marco ha pagato 30€ per Carbonella (diviso tra 8)"
- Form: descrizione + importo + chi ha pagato + dividi tra (multi-select partecipanti)
- **Riepilogo saldi:** algoritmo di semplificazione debiti
  - Calcola saldo netto per persona
  - Minimizza numero transazioni
  - Output: "Marco deve 12,50€ a Luca", "Sara deve 8,00€ a Marco"
- **Pulsante "Invia saldi su WhatsApp"**

#### Sezione Sondaggi
- Creazione sondaggio: domanda + opzioni (aggiungi dinamicamente)
- Tipo: scelta singola o multipla
- Votazione: inserisci nome e vota
- Visualizzazione risultati con barre percentuali animate
- Chi ha votato può cambiare voto (token localStorage)

### 3. Modifica Evento (`/evento/[slug]/modifica`)

- Accessibile solo se `localStorage` contiene il `creator_token` corretto
- Se token non presente → messaggio "Solo il creatore può modificare l'evento"
- Permette modifica di tutti i campi dell'evento
- Permette eliminazione evento (con conferma)

### 4. Integrazione WhatsApp

#### Condivisione Evento
Pulsante genera messaggio pre-formattato e apre `https://wa.me/?text={encoded}`:

```
🎉 *Grigliata a Castel Volturno*

📅 Lunedì 21 Aprile 2025, ore 13:00
📍 Villa Mare, Castel Volturno
   https://maps.google.com/...

👥 Partecipanti (8 confermati, 2 forse):
✅ Marco, Luca, Sara, Giovanni, Anna, Paolo, Chiara, Davide
🤔 Elena, Roberto

📋 Da portare:
• Carbonella — Marco
• Bibite — Sara
• Dolce — ⚠️ Nessuno
• Piatti e posate — Anna

🔗 Rispondi qui: https://eventify.vercel.app/evento/abc123def4
```

#### Condivisione Saldi
Pulsante separato per i saldi:

```
💰 *Saldi — Grigliata a Castel Volturno*

• Marco deve 12,50€ a Luca
• Sara deve 8,00€ a Marco  
• Giovanni deve 5,00€ a Luca

Totale spese evento: 85,00€
```

#### Open Graph Meta Tags
Per ogni evento, generare dinamicamente:
- `og:title` → emoji + titolo evento
- `og:description` → data + luogo + numero partecipanti
- `og:image` → immagine generata dinamicamente (Next.js OG Image Generation via `ImageResponse`)
- `og:url` → URL canonico evento

Così quando il link viene incollato su WhatsApp appare una card con preview.

### 5. PWA

- `manifest.json` con nome, icone, theme_color, display: standalone
- Service worker per caching pagine visitate (offline visualizzazione eventi già aperti)
- Installazione su home screen
- **Notifiche push** (opzionale, fase 2): reminder 1 giorno prima e 2 ore prima dell'evento

---

## UI / Design Direction

### Stile: "Warm Mediterranean Social"
- **Palette:** tonalità calde — sabbia, terracotta, bianco caldo, accento verde salvia e azzurro mare
- **Font:** display font caratteristico (es. "Outfit" o "Bricolage Grotesque" da Google Fonts) per titoli, "DM Sans" per body
- **Emoji come hero:** l'emoji dell'evento è sempre protagonista, grande e animata
- **Cards con ombre morbide** e bordi arrotondati generosi (radius 16-20px)
- **Micro-animazioni:** transizioni fluide tra stati, contatori animati partecipanti
- **Mobile-first:** l'80% dell'uso sarà da smartphone via link WhatsApp
- **Dark mode:** supportato via Tailwind `dark:` classes
- **Colore WhatsApp (#25D366)** per tutti i pulsanti di condivisione
- **Empty states illustrativi:** messaggi simpatici quando non ci sono ancora partecipanti/spese/items

### Componenti chiave
- `EventCard` — card riepilogo evento
- `ParticipantList` — lista con avatar emoji generati dal nome
- `ItemChecklist` — lista interattiva chi-porta-cosa
- `ExpenseTracker` — form + lista + saldi calcolati
- `PollWidget` — sondaggio con barre risultati animate
- `WhatsAppButton` — pulsante verde con icona WA, genera messaggio e apre link
- `ShareBar` — barra sticky in basso con azioni condivisione

---

## Algoritmo Semplificazione Debiti

```typescript
interface Debt {
  from: string;
  to: string;
  amount: number;
}

function simplifyDebts(expenses: Expense[], participants: string[]): Debt[] {
  // 1. Calcola saldo netto per persona
  //    saldo positivo = deve ricevere, negativo = deve dare
  // 2. Separa creditori (saldo > 0) e debitori (saldo < 0)
  // 3. Ordina entrambi per importo (decrescente abs)
  // 4. Greedy matching: il debitore più grande paga il creditore più grande
  //    fino a esaurimento, minimizzando il numero di transazioni
  // 5. Arrotonda a 2 decimali
  // 6. Ritorna lista Debt[]
}
```

---

## Supabase Setup

### Progetto
- Creare progetto su Supabase (free tier)
- Env vars in `.env.local`:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
  ```

### Migrations
Creare file SQL in `supabase/migrations/` con:
1. Creazione tabelle
2. Indici su `events.slug`
3. RLS policies
4. Trigger per `updated_at`

### Realtime (opzionale, fase 2)
- Abilitare Supabase Realtime sulle tabelle `participants`, `items`, `expenses`, `poll_options`
- Subscriptions client-side per aggiornamento live quando qualcuno partecipa

---

## Configurazione Vercel

- Framework preset: Next.js
- Build command: `next build`
- Node 18+
- Env vars: Supabase URL + anon key
- Domain: `eventify.vercel.app` o custom

---

## Struttura Cartelle Consigliata

```
src/
├── app/                        # Next.js App Router
├── components/
│   ├── ui/                     # Componenti base (Button, Card, Input, Badge...)
│   ├── event/                  # EventHeader, ParticipantList, ItemChecklist
│   ├── expense/                # ExpenseForm, ExpenseList, BalanceSummary
│   ├── poll/                   # PollCreate, PollVote, PollResults
│   └── share/                  # WhatsAppButton, ShareBar, CopyLinkButton
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server client
│   │   └── types.ts            # Database types (generati o manuali)
│   ├── whatsapp.ts             # Generazione messaggi formattati
│   ├── debts.ts                # Algoritmo semplificazione debiti
│   └── utils.ts                # Helpers vari (formatDate, generateSlug...)
├── hooks/
│   ├── useEvent.ts             # Fetch + cache evento
│   ├── useParticipants.ts      # CRUD partecipanti
│   └── useLocalToken.ts        # Gestione token localStorage
└── types/
    └── index.ts                # Types condivisi
```

---

## Fasi di Sviluppo

### Fase 1 — MVP (focus: funziona)
1. Setup progetto Next.js + Tailwind + Supabase
2. Schema DB + migrations + RLS
3. Creazione evento + pagina evento
4. Partecipanti (RSVP)
5. Chi porta cosa
6. Condivisione WhatsApp (messaggio evento)
7. Open Graph dynamic images
8. PWA manifest + service worker
9. Deploy su Vercel

### Fase 2 — Completo
10. Spese + algoritmo saldi
11. Condivisione saldi su WhatsApp
12. Sondaggi
13. Dark mode
14. Animazioni e polish UI

### Fase 3 — Extra
15. Notifiche push (reminder evento)
16. Supabase Realtime (aggiornamenti live)
17. Cronologia eventi passati (localStorage)
18. Export spese (CSV o PDF)

---

## Note per Claude Code

- **Lingua UI:** Italiano (tutti i testi, label, placeholder, messaggi)
- **Mobile-first:** progettare per viewport 375px, poi adattare a desktop
- **No auth required** per partecipanti — identità basata su nome + token localStorage
- **Validazione:** Zod per form validation (o validazione nativa)
- **Error handling:** toast notifications per errori Supabase
- **Accessibilità:** label corretti, focus management, contrasto colori WCAG AA
- **Performance:** lazy load sezioni sotto il fold, ottimizzare OG image generation
