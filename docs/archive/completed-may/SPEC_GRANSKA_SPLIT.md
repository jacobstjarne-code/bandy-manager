# SPEC_GRANSKA_SPLIT — Bryt ut sub-skärmarna till egna filer

**Datum:** 2026-05-02
**Författare:** Opus
**Status:** Spec-klar för Code
**Estimat:** 2-3h
**Beroende:** Inga. Måste köras INNAN SPEC_GRANSKA_OMARBETNING.

---

## VARFÖR

`GranskaScreen.tsx` är 1500 rader med 5 sub-skärmar inline (Översikt/Spelare/Shotmap/Förlopp/Analys). SPEC_GRANSKA_OMARBETNING lägger ~300 rader till — då är vi vid 1800. Filen är redan på gränsen.

Splitten är ren mekanisk refactor: ingen funktionalitet ändras, bara filstruktur. Sub-skärmarna görs till egna komponenter med props.

---

## VAD VI BYGGER

Ny struktur:
src/presentation/screens/granska/
├── GranskaScreen.tsx              # Huvudkomponent — hooks, beräkningar, step-nav, CTA
├── GranskaOversikt.tsx            # Resultat, statistik, events, presskonferens, domarmöte, media, insändare, nyckelmoment, motståndare-quote
├── GranskaSpelare.tsx             # Startelva-betyg, bänk
├── GranskaShotmap.tsx             # SVG, statistik, insikt
├── GranskaForlop.tsx              # Omgångssammanfattning, händelsetidslinje, andra matcher, scouting
├── GranskaAnalys.tsx              # Coach-citat, konsekvenser, formspelare, nyckelinsikter
└── helpers.ts                     # generateQuickSummary, seededRand, choiceStyle, ratingColor

Alla 6 nya filer i ny mapp `src/presentation/screens/granska/`.

Befintlig `src/presentation/screens/GranskaScreen.tsx` raderas. AppRouter-import uppdateras till `granska/GranskaScreen`.

---

## REGLER FÖR SPLITTEN

### 1. Inga funktionsändringar.

Detta är **pure refactor**. Ingen JSX ändras, ingen logik ändras, inga props döps om. Om Code känner att något "kan göras snyggare" — gör det INTE i denna spec. Lägg som notering i KVAR.md för framtida session.

### 2. Sub-komponenterna tar props, inga hooks.

Alla `useState`, `useEffect`, `useRef`, `useGameStore`, `useNavigate` stannar i `GranskaScreen.tsx`. Sub-filerna får värdena som props.

### 3. Helpers flyttas till `helpers.ts`.

Pure functions som inte beror på React eller hooks:
- `generateQuickSummary(fixture, managedIsHome, players): string`
- `seededRand(seed: number): number`
- `choiceStyle(choiceId: string): React.CSSProperties`
- `ratingColor(r: number): string` (idag inline i `renderSpelare`)

### 4. Type definitions.

`GranskaStep` och `STEPS` stannar i `GranskaScreen.tsx` (de styr step-nav som lever där).

Skapa interface per sub-komponent:

```typescript
// GranskaOversikt.tsx
interface GranskaOversiktProps {
  game: SaveGame
  fixture: Fixture | undefined
  homeClub: Club | undefined
  awayClub: Club | undefined
  isHome: boolean
  myScore: number
  theirScore: number
  won: boolean
  lost: boolean
  resultColor: string
  resultLabel: string
  potm: Player | null
  potmRating: number | null | undefined
  penResult: PenaltyResult | undefined
  keyMoments: MatchEvent[]
  pendingEvents: GameEvent[]
  resolvedEventIds: Set<string>
  chosenLabels: Record<string, string>
  fadeIn: (i: number) => React.CSSProperties
  onChoice: (eventId: string, choiceId: string, choiceLabel: string) => void
}
```

Liknande för de andra. Ja, props blir många. Det är priset för att hålla refactor mekanisk. **Inga genvägar med "lägg allt i ett SaveGame-prop"** — explicit props gör det tydligt vad varje sub-komponent faktiskt använder.

### 5. `g`-aliaset borttas.

I nuvarande kod finns `const g = game` inne i varje render-funktion (TypeScript narrowing-trick). När sub-komponenten är en egen fil med props är detta onödigt. Använd `game` direkt från props.

### 6. Imports.

Sub-filerna importerar bara det de behöver. T.ex. `GranskaOversikt.tsx` importerar `generateInsandare`, `generatePostMatchOpponentQuote`, `generateSilentMatchReport` direkt från sina services. **Inte via parent.**

### 7. Inga nya tester behövs för splitten.

Befintliga tester i `screens/__tests__/GranskaScreen.test.tsx` ska fortsätta passera utan ändringar (utöver eventuell uppdatering av import-path).

---

## IMPLEMENTATIONSORDNING

1. **Skapa mappen** `src/presentation/screens/granska/`.
2. **Flytta helpers** till `granska/helpers.ts`. Verifiera build.
3. **Bryt ut `GranskaSpelare.tsx`** (minst beroenden, bra första). Verifiera build.
4. **Bryt ut `GranskaShotmap.tsx`**. Verifiera build.
5. **Bryt ut `GranskaForlop.tsx`**. Verifiera build.
6. **Bryt ut `GranskaAnalys.tsx`**. Verifiera build.
7. **Bryt ut `GranskaOversikt.tsx`** (störst, mest beroenden, sista). Verifiera build.
8. **Flytta `GranskaScreen.tsx`** till `granska/GranskaScreen.tsx`. Uppdatera AppRouter-import.
9. **Radera gamla `screens/GranskaScreen.tsx`.**
10. **Kör tester** — alla ska passera.

Mellan varje steg: `npm run build && npm test`. Om något bryts — STOPPA och fråga.

---

## VERIFIERINGSPROTOKOLL

Efter implementation, Code:

1. **Build:** `npm run build` — ren.
2. **Tester:** `npm test` — alla gröna (inga nya tester, befintliga ska fortsätta passera).
3. **Browser-playtest:** Spela 1 ligamatch + 1 cup-match. Öppna **alla 5 flikar** (Översikt, Spelare, Shotmap, Förlopp, Analys). Verifiera att varje flik ser **exakt likadan ut** som innan splitten.
4. **Skärmdump per flik** × 2 matcher (10 skärmdumpar). Lägg i SPRINT_AUDIT.md.

**Pixel-jämförelse mot pre-split:** Code tar skärmdump av varje flik *innan* splitten påbörjas (commit 1, "baseline"). Efter splitten (commit 2), tar samma skärmdumpar. Jämför sida vid sida. Om något har ändrats — fixa.

---

## VAD DETTA INTE ÄR

- **Inte funktionsändring.** Ingen ny feature, inget event-flöde ändras.
- **Inte städning.** "Förbättra" inte texter, layout, props-strukturer. Mekanisk flytt.
- **Inte SPEC_GRANSKA_OMARBETNING.** Den körs som separat spec efter splitten är klar.

---

## RISK

Princip 4-pixel-audit gäller inte för pure refactor (inga visuella ändringar planerade). MEN: refactor utan UI-verifiering kan introducera subtila buggar (se LESSONS.md #4). Code MÅSTE öppna varje flik i webbläsaren efter splitten och verifiera att inget syns annorlunda.

Risker som har hänt i tidigare refactors:
- Props som glömts skickas → komponenten renderar tomt
- TypeScript narrowing försvinner → `game?.x ?? 0`-fallback kickar in fel
- Imports som flyttats fel → runtime-fel, inte build-fel

Lärdom: build-fri ≠ funktionellt korrekt. Browser-playtest är obligatorisk.

---

## EFTER IMPLEMENTATION

KVAR.md uppdateras:
- "GranskaScreen split levererad — 6 filer i `screens/granska/`"
- SPEC_GRANSKA_OMARBETNING kan nu köras

Slut.
