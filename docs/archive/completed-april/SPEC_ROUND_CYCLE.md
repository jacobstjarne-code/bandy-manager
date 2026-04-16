# SPEC: Omgångscykeln — Förbered → Spela → Granska

Läs HELA specen + DESIGN_SYSTEM.md innan du börjar. Öppna `docs/mockups/round_cycle_mockup.html` i en webbläsare som visuell referens — implementera det du ser, inte vad du tror det ska se ut som.

---

## KONCEPT

Varje omgång är en cykel med tre faser:
- **① Förbered** — "Vad ska jag göra?" Dashboard med agenda + överblick.
- **② Spela** — matchflödet (lineup → taktik → match).
- **③ Granska** — "Vad hände?" Resultat + events + sammanfattning i EN vy.

En fasindikator syns ALLTID i GameHeader. Bottennaven fungerar som vanligt — den är verktyg, inte flöde.

---

## DEL 1: FASINDIKATOR (GameHeader)

### Ny komponent: `PhaseIndicator.tsx`

Placeras i GameShell, under GameHeader, ovanför Outlet. ALLTID synlig.

```
src/presentation/components/PhaseIndicator.tsx
```

Fasen bestäms av ROUTE:

```typescript
function getCurrentPhase(pathname: string): 'prepare' | 'play' | 'review' {
  if (pathname.includes('/match')) return 'play'
  if (pathname.includes('/review')) return 'review'
  return 'prepare'
}
```

Se mockupen för exakt styling: tre prickar + labels + linjer, mörk bakgrund (del av header-zonen). States: done (filled copper), active (copper border + glow), pending (faint border).

Renderas INTE under: intro, new-game, board-meeting, pre-season, champion, game-over, season-summary.

---

## DEL 2: FÖRBERED-FASEN (Dashboard redesign)

### Bort med flikarna

Ta bort tab-baren (Match | Klubb | Orten) helt. Radera MatchTab.tsx, KlubbTab.tsx, OrtenTab.tsx. En enda sida.

### Layout — uppifrån och ner (se mockup för pixlar)

**1. AGENDA (nudgar med progress)**

Rubrik: "Inför matchen" vänster + "N av M klart" höger. fontSize 8, uppercase.

Nudgarna trackar om spelaren besökt relevant skärm denna omgång. Nytt SaveGame-fält:
```typescript
visitedScreensThisRound?: string[]  // ['squad', 'transfers', 'club']
```
Sätts i respektive skärms useEffect (push 'squad' om inte redan där). Nollställs i roundProcessor vid advance().

Done-nudge: opacity 0.5, text line-through, grön ✓ högerställd.
Aktiv nudge: röd/gul prick, klickbar → navigerar.

Max 3 nudgar. Om inga: visa INTE sektionen.

**2. MATCHKORT (NextMatchCard — befintlig, oförändrad)**

**3. DAGBOKEN — dynamiskt kort (NYTT)**

EN rad i `card-round`, padding `8px 12px`. Visar det mest intressanta just nu:

| Prio | Villkor | Text |
|------|---------|------|
| 1 | Derby | "🔥 Derby. {rivalryName}. V{w} O{d} F{l} i historiken." |
| 2 | Spelare ≥3 mål senaste 5 | "📈 {namn} i glödande form — {N} mål senaste {M} matcherna." |
| 3 | Patron har krav | "👤 {namn}: \"{demand}\"" |
| 4 | Akademispelare hög CA | "🎓 {namn} (P19) visar A-lagsklass. Styrka {CA}." |
| 5 | Transferfönster inom 3 omg | "💼 Transferfönstret {öppnar/stänger} om {N} omgångar." |
| 6 | Tidningsrubrik | "📰 {localPaperName}: {headline}" |
| 7 | Inget | Visa inte kortet |

Ny fil: `src/domain/services/dailyBriefingService.ts` + `src/presentation/components/dashboard/DailyBriefing.tsx`

**4. ÖVERBLICK — 2×2 grid**

```tsx
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, margin: '0 0 6px' }}>
```

Rad 1: **Tabell** (position stor Georgia, poäng, ms, form-prickar, avstånd grannar) | **Senast** (score, pill, motståndare, POTM)
Rad 2: **Orten** (puls-siffra, bar, citat) | **Ekonomi** (kassa, netto/omg)

Alla celler: `card-sharp`, padding `8px 10px`, klickbara → navigerar. Se mockupen för exakt layout per cell.

**5. ENRADERS-KORT**

Trupp, Cup/Playoff, Akademi. Varje kort: `card-sharp`, padding `7px 10px`, margin-bottom `4px`.

Format: `EMOJI LABEL     info-text     ›`

En rad per kort. Label i uppercase 8px. Info i 11px secondary. ›-knapp 16×16.

**6. CTA-SEKTION**

Datum + Omgång (10px, muted) → DiamondDivider → Trainer arc mood (11px italic center, EN rad) → CTA-knapp.

CTA-text: "Redo — spela omgång {N} →". Samma gradient-styling som befintlig.

**TOTAL MÅL: hela dashen ryms utan scroll på 667px (iPhone SE).**

---

## DEL 3: GRANSKA-FASEN (konsoliderad post-match)

### Ny vy: GranskaScreen.tsx

EN skärm som ersätter MatchResultScreen + EventOverlay + RoundSummaryScreen.

Route: `/game/review` (ersätter `/game/match-result` och `/game/round-summary`)

### Layout (se mockup)

Scrollbar sida, sektioner med stagger fade-in:

1. **RESULTAT-HERO** — "SLUTRESULTAT", score (36px Georgia 800), vinst/förlust-pill, POTM + attendance
2. **NYCKELMOMENT** — mini-timeline (hem vänster, borta höger), mål + röda kort
3. **EVENTS INLINE** — presskonferens och andra events som kort med val-knappar. När spelaren väljer → kortet kollapsar till vald text med ✓. Nästa event expanderar. Inte overlay.
4. **OMGÅNGSSAMMANFATTNING** — kompakta rader med FÖRÄNDRING (7→6 ↑, +8400 kr, 72→74 ↑). Varje rad klickbar → deep-link.
5. **CTA** — "Nästa omgång →" (primär) + "Se fullständig rapport →" (ghost)

### Events inline istället för overlay

`resolveEvent()` anropas direkt i GranskaScreen vid knapptryck. EventOverlay blockeras under `/game/review`.

### Routing-ändringar

```tsx
// AppRouter.tsx:
// Byt /game/round-summary och /game/match-result → /game/review
<Route path="/game/review" element={<GranskaScreen />} />
```

Alla `navigate('/game/round-summary')` och `navigate('/game/match-result')` → `navigate('/game/review')`.

MatchDoneOverlay "Fortsätt →" → `/game/review`.

---

## DEL 4: VISUELLA REGLER (OBLIGATORISKA)

Alla regler från DESIGN_SYSTEM.md gäller. Extra:

- `card-sharp`: padding `10px 12px` (inte 14px). Enraders-kort: `7px 10px`.
- `card-round`: padding `8px 12px`. Bara för dagbok och atmosfärscitat.
- Sektions-labels: fontSize `8` (inte 9), letterSpacing `2px`.
- Grid gap: `6px`. Card margin-bottom: `6px` (grid), `4px` (enraders).
- Georgia (`var(--font-display)`): placeringssiffra, matchresultat, ekonomi-siffra, puls-siffra.
- system-ui (`var(--font-body)`): allt annat.
- ENBART CSS-variabler. Inga hex. Inga rgba utom semi-transparenta bakgrunder.
- ›-knappar: 16×16 (inte 18×18 — tightare).

---

## DEL 5: FILSTRUKTUR

### Nya filer
```
src/presentation/components/PhaseIndicator.tsx
src/presentation/components/dashboard/DailyBriefing.tsx
src/presentation/screens/GranskaScreen.tsx
src/domain/services/dailyBriefingService.ts
```

### Raderade filer
```
src/presentation/components/dashboard/MatchTab.tsx
src/presentation/components/dashboard/KlubbTab.tsx
src/presentation/components/dashboard/OrtenTab.tsx
```

### Modifierade filer
```
src/presentation/screens/DashboardScreen.tsx         ← ny layout utan flikar
src/presentation/navigation/GameShell.tsx            ← PhaseIndicator
src/presentation/navigation/AppRouter.tsx            ← /game/review route
src/presentation/components/match/MatchDoneOverlay.tsx ← navigate → /game/review
src/presentation/components/EventOverlay.tsx         ← blocka under /game/review
src/domain/entities/SaveGame.ts                      ← visitedScreensThisRound
src/application/useCases/roundProcessor.ts           ← nollställ visitedScreensThisRound
```

---

## DEL 6: IMPLEMENTATIONSORDNING

### Sprint A: Fasindikator + routing
1. Skapa PhaseIndicator.tsx
2. Lägg till i GameShell.tsx
3. Route /game/review → tom placeholder
4. Alla navigate('/game/round-summary') och navigate('/game/match-result') → navigate('/game/review')
5. MatchDoneOverlay → /game/review
6. EventOverlay: blocka under /game/review

**npm run build && npm test. Committa: `feat: phase indicator + review route`**

### Sprint B: GranskaScreen
1. GranskaScreen.tsx med full layout
2. Flytta logik från MatchResultScreen + RoundSummaryScreen
3. Inline event-rendering
4. resolveEvent direkt i GranskaScreen
5. "Nästa omgång →" → clearRoundSummary() + navigate('/game/dashboard')

**npm run build && npm test. Committa: `feat: GranskaScreen consolidated post-match`**

### Sprint C: Dashboard utan flikar
1. Radera MatchTab.tsx, KlubbTab.tsx, OrtenTab.tsx
2. Skriv om DashboardScreen med ny layout (nudge-agenda, matchkort, dagbok, 2×2, enraders, CTA)
3. visitedScreensThisRound i SaveGame + roundProcessor
4. Nudge check-marking

**npm run build && npm test. Committa: `feat: single-page nudge dashboard`**

### Sprint D: Dagboken
1. dailyBriefingService.ts (generateBriefing med 6 prioriterade typer)
2. DailyBriefing.tsx
3. findHotPlayer(), findAcademyProspect(), getTransferWindowCountdown()
4. Integrera i DashboardScreen

**npm run build && npm test. Committa: `feat: daily briefing dynamic content`**

---

## DEL 7: VERIFIERING

### Visuellt:
```bash
grep -rn "#[0-9a-fA-F]\{6\}" src/presentation/components/PhaseIndicator.tsx src/presentation/components/dashboard/DailyBriefing.tsx src/presentation/screens/GranskaScreen.tsx src/presentation/screens/DashboardScreen.tsx 2>/dev/null

grep -c "card-sharp\|card-round" src/presentation/screens/DashboardScreen.tsx src/presentation/screens/GranskaScreen.tsx 2>/dev/null

grep -n "borderRadius:" src/presentation/screens/DashboardScreen.tsx 2>/dev/null | grep -v "tab\|button\|nudge\|bar\|pill\|99\|50%\|cta\|phase"
```

### Funktionellt:
```bash
npm run build && npm test
wc -c src/presentation/screens/DashboardScreen.tsx    # < 15KB
wc -c src/presentation/screens/GranskaScreen.tsx      # < 20KB
```

### Manuellt:
1. Dashboard → fasindikator visar "Förbered"
2. "Redo →" → fas = "Spela", matchflöde
3. Match slut → MatchDoneOverlay → "Fortsätt →" → GranskaScreen
4. Fas = "Granska", presskonferens inline
5. Välj pressvar → kort kollapsar
6. "Nästa omgång →" → dashboard, fas = "Förbered"
7. Besök Trupp via bottomnav → fas fortfarande "Förbered"
8. Tillbaka till Hem → nudge "Kontrollera truppen" grön ✓
9. Dagboken visar relevant innehåll

---

## TEXTGRANSKNING

Skapa `docs/textgranskning/ROUND_CYCLE_TEXTER.md` med alla nya svenska strängar.
