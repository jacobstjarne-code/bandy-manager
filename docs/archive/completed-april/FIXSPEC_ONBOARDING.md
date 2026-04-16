# FIXSPEC: Onboarding — Coach Marks + Hjälp-overlay

`npm run build && npm test` efter varje feature.

**MOCKUP-REFERENS:** `docs/mockups/onboarding_mockup.html`

**ERSÄTTER:** Befintlig `TutorialOverlay.tsx` (4-stegs modal) tas bort. Coach marks tar över.

---

## Feature 1 — Coach Marks (3 steg vid första spelstart)

### Vad

En spotlight-baserad intro som PEKAR på faktiska UI-element. Inte en textmodal i mitten av skärmen — en dim som klipper ut ett specifikt kort, med en tooltip bredvid som förklarar vad det gör och varför det spelar roll.

3 steg. Kan hoppas över. Visas bara en gång (sparas i SaveGame).

### De tre stegen

**Steg 1 — CTA-knappen**
- Spotlight: CTA-knappen ("Redo — spela omgång 1 →")
- Tooltip under knappen, pil uppåt
- Emoji: 👆
- Titel: "Det här är din viktigaste knapp"
- Brödtext: "Tryck här för att spela nästa match. Men först — se till att du har en startelva. Utan spelare på isen vinner ingen."
- Fotnot (kursiv, text-muted): "(Oroa dig inte, vi påminner dig.)"

**Steg 2 — Orten-kortet**
- Spotlight: Orten-cellen i 2×2-griden
- Tooltip under kortet, pil uppåt
- Emoji: 🏘
- Titel: "Det här är inte bara ett lag"
- Brödtext: "Det är en förening. Frivilliga säljer korv. Kommunen ger bidrag. Klacken sjunger. Allt hänger ihop. Bygdens puls påverkar din ekonomi, ditt rykte och din hemmaplansfördel. Satsa på orten — inte bara truppen."

**Steg 3 — Klacken**
- Spotlight: KLACKEN-sektionen
- Tooltip under, pil uppåt
- Emoji: 📐
- Titel: "Klacken och hörnorna"
- Brödtext: "Fyra personer med åsikter. De sjunger, bråkar och älskar laget. Håll dem glada — de ger hemmabonus. Och i bandy avgörs matcher vid hörnor. Du får välja zon och leverans vid dina viktigaste hörnsituationer. Klackens energi gör skillnad."
- Fotnot: "Birger trummar redan. Dags att börja."
- Knapp: "Kör igång! 🏒" (inte "Nästa →")

### Implementation

**Fil:** Ny: `src/presentation/components/CoachMarks.tsx`

```typescript
interface CoachMarksProps {
  step: 0 | 1 | 2
  onNext: () => void
  onSkip: () => void
  targetRef: React.RefObject<HTMLElement>  // elementet som spotlightas
}
```

**Spotlight-mekanik:**
- Hämta `targetRef.current.getBoundingClientRect()` 
- Rendera en fullskärms-div med `position: fixed; inset: 0; z-index: 300`
- Spotlighten: en div positionerad exakt över target-elementet, med `box-shadow: 0 0 0 4000px rgba(0,0,0,0.65)` som skapar "hålet"
- Pulsande glow: `box-shadow` animation med `rgba(196,122,58,0.15)`
- Tooltip: absolut positionerad under (eller ovanför om inte plats) spotlighten
- Pil (`::before` pseudo-element) pekar mot spotlighten

**Steg-data:**
```typescript
const COACH_STEPS = [
  {
    targetId: 'cta-button',        // data-coach-id på CTA-knappen
    emoji: '👆',
    title: 'Det här är din viktigaste knapp',
    body: 'Tryck här för att spela nästa match. Men först — se till att du har en startelva. Utan spelare på isen vinner ingen.',
    footnote: '(Oroa dig inte, vi påminner dig.)',
    position: 'below' as const,
  },
  {
    targetId: 'orten-card',        // data-coach-id på Orten-cellen
    emoji: '🏘',
    title: 'Det här är inte bara ett lag',
    body: 'Det är en förening. Frivilliga säljer korv. Kommunen ger bidrag. Klacken sjunger. Allt hänger ihop.\n\nBygdens puls påverkar din ekonomi, ditt rykte och din hemmaplansfördel.',
    position: 'below' as const,
  },
  {
    targetId: 'klacken-card',      // data-coach-id på KLACKEN-sektionen
    emoji: '📐',
    title: 'Klacken och hörnorna',
    body: 'Fyra personer med åsikter. De sjunger, bråkar och älskar laget. Håll dem glada — de ger hemmabonus.\n\nOch i bandy avgörs matcher vid hörnor. Du får välja zon och leverans. Klackens energi gör skillnad.',
    footnote: 'Birger trummar redan. Dags att börja.',
    isLast: true,
    position: 'below' as const,
  },
]
```

**DashboardScreen-integration:**
1. Lägg till `data-coach-id` attribut på CTA-knappen, Orten-cellen och KLACKEN-sektionen
2. Ref:a dessa element med `useRef`
3. Om `!game.coachMarksSeen`: visa `<CoachMarks>` med aktuellt steg
4. Vid "Kör igång!" eller "Hoppa över": anropa `markCoachMarksSeen()` i gameStore

**Scroll-hantering:**
- Vid steg 2 och 3: scrolla automatiskt så target-elementet är synligt
- `targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })` innan spotlight renderas
- Fördröjning 300ms för scroll, sedan visa spotlight

### SaveGame

```typescript
// Lägg till:
coachMarksSeen?: boolean
```

### gameStore

```typescript
markCoachMarksSeen: () => {
  set(s => {
    if (!s.game) return s
    return { game: { ...s.game, coachMarksSeen: true } }
  })
}
```

### Ta bort

- `src/presentation/components/TutorialOverlay.tsx` — ersätts helt av CoachMarks
- `game.tutorialSeen` — ersätts av `coachMarksSeen`
- `markTutorialSeen()` i gameStore — ersätts av `markCoachMarksSeen()`
- Referensen till `TutorialOverlay` i DashboardScreen

**OBS:** Migrera befintliga spel: om `tutorialSeen === true` → sätt `coachMarksSeen = true` i en migration.

---

## Feature 2 — Hjälp-knapp i GameHeader

### Vad

En permanent **?**-ikon i GameHeader som öppnar en hjälp-overlay med 6 korta sektioner.

### Fil: `src/presentation/components/HelpOverlay.tsx`

```typescript
interface HelpOverlayProps {
  onClose: () => void
  onRestartCoachMarks: () => void
}

const HELP_SECTIONS = [
  { emoji: '🏒', title: 'Matchen', body: '22 omgångar + cup + slutspel. Välj lineup och taktik. Resten sköter sig — utom hörnorna.' },
  { emoji: '📐', title: 'Hörnor', body: 'I bandy kommer hälften av alla mål från hörnor. Du väljer zon och leverans. Hög hörnskill = fler mål.' },
  { emoji: '🏘', title: 'Orten', body: 'Frivilliga, kommun och aktiviteter ger pengar och bygdens puls. Hög puls = bättre ekonomi och hemmaplansfördel.' },
  { emoji: '📣', title: 'Klacken', body: 'Fyra karaktärer med åsikter. Deras humör ger hemmabonus. De har en favoritspelare. Ignorera dem på egen risk.' },
  { emoji: '💰', title: 'Ekonomi', body: 'Kassan är tight. Sponsorer + frivilliga + matchintäkter. Minusbudget = styrelsen tappar tålamodet.' },
  { emoji: '⚔️', title: 'Slutspel', body: 'Topp 8 efter grundserien → kvartsfinal → semifinal → SM-final. Bäst av fem.' },
]
```

**Layout:**
- Fullskärms-overlay (`position: fixed; inset: 0; z-index: 250`)
- Scrollbar content-area
- Header: "Hur funkar det?" (Georgia 18px 800) + "Allt du behöver veta. Resten lär du dig på isen." (11px text-muted)
- 6 sektioner: bg-surface, border-radius 8px, emoji + titel (13px bold) + body (11px text-secondary)
- Botten: "🔄 Visa introduktionen igen" → sätter `coachMarksSeen = false` + stänger overlay

### GameHeader-integration

Lägg till ?-knappen i befintliga knappgruppen (bredvid ljud/mute):

```typescript
<button
  onClick={() => setShowHelp(true)}
  style={{
    width: 22, height: 22, borderRadius: '50%',
    border: '2px solid var(--accent)',
    background: 'transparent', color: 'var(--accent)',
    fontSize: 11, fontWeight: 700, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}
>?</button>
```

State: `const [showHelp, setShowHelp] = useState(false)` i GameHeader eller DashboardScreen.

---

## Feature 3 — Kontextuella FirstVisitHints (per skärm)

### Vad

En liten 💡-banner högst upp på en skärm, FÖRSTA gången spelaren besöker den. Inte en overlay — en card-round med ✕-knapp. En mening. Försvinner permanent vid dismiss.

### Hints per skärm

| Skärm | screenId | Text |
|-------|----------|------|
| SquadScreen | 'squad' | "Dra spelare till positioner. Grön ring = rätt plats. Gul = kan funka. Utan lineup kan du inte spela." |
| ClubScreen (Orten) | 'orten' | "Aktivera kiosken och bandyskolan. Frivilliga och kommunbidrag håller klubben vid liv." |
| ClubScreen (Ekonomi) | 'ekonomi' | "Klubbkassan är liten. Sponsorer + frivilliga + matchintäkter. Röda siffror = styrelsen agerar." |
| MatchLiveScreen | 'matchLive' | "Matchen rullar automatiskt. Vid hörnor får du välja — titta efter hörn-kortet i feeden." |
| TransfersScreen | 'transfers' | "Transferfönstret stänger omgång 15. Scouta billigt. Sälj dyrt. Akademin är gratis." |

### Fil: `src/presentation/components/FirstVisitHint.tsx`

```typescript
interface Props {
  screenId: string
  text: string
  onDismiss: () => void
}

export function FirstVisitHint({ screenId, text, onDismiss }: Props) {
  return (
    <div className="card-round" style={{
      margin: '0 12px 8px', padding: '8px 12px',
      display: 'flex', alignItems: 'flex-start', gap: 8,
    }}>
      <span style={{ fontSize: 12, flexShrink: 0 }}>💡</span>
      <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1, margin: 0 }}>
        {text}
      </p>
      <button onClick={onDismiss} style={{
        fontSize: 10, color: 'var(--text-muted)', background: 'none',
        border: 'none', cursor: 'pointer', flexShrink: 0, padding: '0 2px',
      }}>✕</button>
    </div>
  )
}
```

### SaveGame + gameStore

```typescript
// SaveGame:
dismissedHints?: string[]

// gameStore:
dismissHint: (screenId: string) => {
  set(s => {
    if (!s.game) return s
    const prev = s.game.dismissedHints ?? []
    if (prev.includes(screenId)) return s
    return { game: { ...s.game, dismissedHints: [...prev, screenId] } }
  })
}
```

### Integration per skärm

```typescript
// Exempel: SquadScreen.tsx
const dismissed = game.dismissedHints ?? []
const dismissHint = useGameStore(s => s.dismissHint)

{!dismissed.includes('squad') && (
  <FirstVisitHint
    screenId="squad"
    text="Dra spelare till positioner. Grön ring = rätt plats. Gul = kan funka. Utan lineup kan du inte spela."
    onDismiss={() => dismissHint('squad')}
  />
)}
```

---

## Prioritering

1. **CoachMarks** — störst upplevelseskillnad, ersätter befintlig tutorial
2. **HelpOverlay** — liten insats, permanent värde
3. **FirstVisitHints** — enklast men minst impact

Alla tre kan implementeras oberoende.

## Verifiering

```bash
npm run build && npm test

# Coach marks renderas:
grep -rn 'CoachMarks\|coachMarksSeen\|data-coach-id' src/ --include="*.ts" --include="*.tsx"

# TutorialOverlay borttagen:
grep -rn 'TutorialOverlay\|tutorialSeen' src/ --include="*.ts" --include="*.tsx"
# (ska ge 0 resultat efter migration)

# HelpOverlay kopplad:
grep -rn 'HelpOverlay\|showHelp' src/ --include="*.tsx"
```
