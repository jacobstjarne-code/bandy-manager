# FIXSPEC — Post-verifiering 5 april 2026

Verifierad av Opus mot CLAUDE.md-protokollet. Varje fix är
isolerad. Gör EN fix i taget. `npm run build && npm test` efter varje.

Commit-konvention: `fix: [kort beskrivning]`

---

## FIX 1 — BoardMeetingScreen dubbelheader (KRITISK)

**Problem:** `/game/board-meeting` ligger under `<GameGuard>` i
AppRouter.tsx. GameGuard renderar `<GameHeader>`. BoardMeetingScreen
renderar DESSUTOM sin egen "BANDY MANAGER"-header + "BURY FEN"-footer.
Resultat: dubbelheader (GameHeader + BANDY MANAGER).

**Fil:** `src/presentation/navigation/AppRouter.tsx`

**Fix:** Flytta board-meeting-routen ut ur `<GameGuard>` till en
fristående route (som `/new-game`). BoardMeetingScreen har redan
sin egen shell med header+footer.

```tsx
// FÖRE:
<Route element={<GameGuard />}>
  <Route path="/game/round-summary" element={<RoundSummaryScreen />} />
  <Route path="/game/match-result" element={<MatchResultScreen />} />
  <Route path="/game/board-meeting" element={<BoardMeetingScreen />} />
  <Route path="/game/game-over" element={<GameOverScreen />} />
</Route>

// EFTER:
<Route element={<GameGuard />}>
  <Route path="/game/round-summary" element={<RoundSummaryScreen />} />
  <Route path="/game/match-result" element={<MatchResultScreen />} />
  <Route path="/game/game-over" element={<GameOverScreen />} />
</Route>
<Route path="/game/board-meeting" element={<BoardMeetingGuard />} />
```

Skapa `BoardMeetingGuard` i samma fil eller i GameShell.tsx:
```tsx
function BoardMeetingGuard() {
  const game = useGameStore(s => s.game)
  if (!game) return <Navigate to="/" replace />
  return <BoardMeetingScreen />
}
```

Importera BoardMeetingScreen och useGameStore i AppRouter om
de inte redan importeras.
EventOverlay behöver INTE renderas på BoardMeetingScreen.

**Usecase att verifiera:**
1. Starta nytt spel → välj klubb → styrelsemötet visas
2. Kontrollera: BARA "BANDY MANAGER"-headern (mörk). INGEN GameHeader
   ovanför med klubbnamn/omgång/klocka.
3. "BURY FEN" syns längst ner.
4. Klicka "Kör igång!" → ska navigera till dashboard.

---

## FIX 2 — MatchHeader duplicerar roundLabel

**Problem:** MatchScreen renderar en card-round med roundLabel
("Omgång X · vs Opponent") OCH sedan `<MatchHeader>` som renderar
EXAKT SAMMA info: "Omgång X · vs {opponent} · HEMMA/BORTA".
Spelaren ser samma info två gånger.

**Fil:** `src/presentation/components/match/MatchHeader.tsx`

**Fix:** Ta bort det översta blocket i MatchHeader som visar
matchinfo. Sök efter raden med `Omgång {fixture.roundNumber}`:

```tsx
// TA BORT detta block (ca rad 48-52):
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
    Omgång {fixture.roundNumber} · vs {opponent} · {isHome ? 'HEMMA' : 'BORTA'}
  </span>
</div>
```

MatchHeader ska BARA visa:
- atmo.label (derby/cup/slutspel, om tillämpligt)
- Väder (steg 1+)
- Väderhint (steg 2+)
- Taktiksammanfattning + tränarcitat (steg 3)

`opponent` och `isHome` kan tas bort ur props/destructuring om de
inte längre används.

**Usecase att verifiera:**
1. Gå till Match-fliken med en kommande match.
2. Kontrollera: "Omgång X" och "vs Opponent" visas BARA EN GÅNG
   (i det övre card-round-kortet med hemma/borta-tag).
3. MatchHeader-kortet under visar väder, hint, taktik — INTE
   matchinfo igen.

---

## FIX 3 — TabellScreen tab-beskrivningar

**Problem:** TransfersScreen och ClubScreen har tab-beskrivningar.
TabellScreen saknar dem.

**Fil:** `src/presentation/screens/TabellScreen.tsx`

**Fix:** Direkt UNDER tab-switcherns avslutande `</div>`, FÖRE
`{activeTab === 'statistik' && ...}`, lägg till:

```tsx
{/* Tab description */}
{activeTab === 'tabell' && (
  <p style={{
    padding: '6px 16px 10px',
    fontSize: 11,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-body)',
    borderBottom: '1px solid var(--border)',
    marginBottom: 10,
  }}>
    Aktuell tabell med form och målskillnad.
  </p>
)}
{activeTab === 'statistik' && (
  <p style={{
    padding: '6px 16px 10px',
    fontSize: 11,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-body)',
    borderBottom: '1px solid var(--border)',
    marginBottom: 10,
  }}>
    Ligans toppskyttar, assistkungar och betyg.
  </p>
)}
```

SquadScreen har inga tabs (bara filter/sortering) — hoppa över.

**Usecase att verifiera:**
1. Gå till Tabell-fliken → se "Aktuell tabell med form och
   målskillnad." under tab-switchern.
2. Byt till Statistik-tabben → se "Ligans toppskyttar, assistkungar
   och betyg."

---

## FIX 4 — MatchLiveScreen utvisning-layouthopp

**Problem:** Utvisningsraden under scoreboarden renderas villkorligt.
När utvisningar börjar/slutar läggs elementet in/tas bort ur DOM
→ layouthopp. Skärmbild visar att tavlan "hoppar till".

**Fil:** `src/presentation/screens/MatchLiveScreen.tsx`

**Fix:** Ersätt det villkorliga blocket (sök efter kommentaren
`{/* Active suspensions below scoreboard */}`) med en version som
ALLTID renderar en div med fast höjd, men byter opacity:

```tsx
{/* Active suspensions below scoreboard — fixed height to prevent layout shift */}
{(() => {
  const hasSusp = currentMatchStep &&
    (currentMatchStep.activeSuspensions.homeCount > 0 ||
     currentMatchStep.activeSuspensions.awayCount > 0)

  if (!currentMatchStep) return (
    <div style={{ height: 20, flexShrink: 0 }} />
  )

  const allEventsSoFar = displayedSteps.flatMap(s => s.events)
  const currentMin = currentMatchStep.minute
  const homeSusp = allEventsSoFar
    .filter(e => e.type === MatchEventType.RedCard && e.clubId === fixture.homeClubId && currentMin - e.minute < 10)
    .map(e => {
      const p = e.playerId ? (game?.players ?? []).find(pl => pl.id === e.playerId) : null
      return p?.shirtNumber != null ? `#${p.shirtNumber}` : (p ? p.lastName.slice(0, 5) : '?')
    })
  const awaySusp = allEventsSoFar
    .filter(e => e.type === MatchEventType.RedCard && e.clubId === fixture.awayClubId && currentMin - e.minute < 10)
    .map(e => {
      const p = e.playerId ? (game?.players ?? []).find(pl => pl.id === e.playerId) : null
      return p?.shirtNumber != null ? `#${p.shirtNumber}` : (p ? p.lastName.slice(0, 5) : '?')
    })

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', padding: '4px 16px',
      fontSize: 11, fontWeight: 600, color: 'var(--danger)', flexShrink: 0,
      height: 20,
      opacity: hasSusp ? 1 : 0,
      transition: 'opacity 0.3s ease',
    }}>
      <div>{homeSusp.map(s => `Utv ${s}`).join(' · ')}</div>
      <div>{awaySusp.map(s => `Utv ${s}`).join(' · ')}</div>
    </div>
  )
})()}
```

Ta bort det gamla villkorliga blocket som ersätts.

**Usecase att verifiera:**
1. Spela en livematch.
2. Snabbspola med ⏩ tills en utvisning sker.
3. "Utv #X" ska fada in UTAN att layouten hoppar/studsar.
4. När utvisningen löper ut → fada ut, layouten förblir stabil.

---

## FIX 5 — Kontroller + StatsFooter visuellt sammanhang

**Problem:** Kontrollerknapparna (⏸ ⏩ 🔄 🔊), intensity bar, och
StatsFooter renderas som separata fristående block under scoreboarden.
De ser visuellt frånkopplade ut.

**Fil:** `src/presentation/screens/MatchLiveScreen.tsx`

**Fix:** Wrappa utvisningsrad + kontroller + intensity bar +
StatsFooter i EN gemensam container:

```tsx
{/* Match controls container */}
<div style={{
  background: 'var(--bg-surface)',
  borderBottom: '1px solid var(--border)',
  flexShrink: 0,
}}>
  {/* Suspensions row (FIX 4 ovan) */}

  {/* Controls */}
  <div style={{
    display: 'flex', justifyContent: 'center', gap: 8,
    padding: '6px 16px',
  }}>
    {/* befintliga knappar ⏸ ⏩ 🔄 🔊 — flytta hit */}
  </div>

  {/* Intensity bar */}
  {currentMatchStep && (
    <div style={{ height: 3, background: 'var(--bg-dark-surface)', overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: currentMatchStep.intensity === 'high' ? '100%' : currentMatchStep.intensity === 'medium' ? '66%' : '33%',
        background: currentMatchStep.intensity === 'high' ? 'var(--accent)' : currentMatchStep.intensity === 'medium' ? 'var(--ice)' : 'rgba(245,241,235,0.15)',
        transition: 'width 600ms ease-out, background-color 600ms ease-out',
        borderRadius: '0 2px 2px 0',
      }} />
    </div>
  )}

  {/* Live stats */}
  {currentMatchStep && (
    <StatsFooter stats={calculateLiveStats(currentMatchStep)} />
  )}
</div>
```

OBS: Flytta de befintliga elementen in i containern — skapa INGA
nya element, bara wrappa dem. Ta bort eventuell `borderTop` från
StatsFooter.tsx (sök `borderTop: '1px solid var(--border)'` och
ta bort den raden).

**Usecase att verifiera:**
1. Spela livematch.
2. Kontrollknappar + intensitetsmätare + stats (Skott/Hörnor/Utvisn)
   ska vara visuellt grupperade med samma bakgrundsfärg.
3. Ingen visuell "lucka" mellan scoreboard och stats-block.

---

## FIX 6 — Cup-lottning: bye-lag möter R1-vinnare

**Problem:** `generateNextCupRound()` samlar winners i ordning
[matchvinnare..., byevinnare...]. Parning [0,1],[2,3]... gör att
byes möter varandra i kvartsfinal istället för R1-vinnare.

**Fil:** `src/domain/services/cupService.ts`

**Fix:** I `generateNextCupRound`, EFTER raden
`const winners = bracket.matches.filter(...)...`,
ersätt winner-insamlingen med seedat interleave:

```typescript
// ERSÄTT:
const winners = bracket.matches
  .filter(m => m.round === completedRound && m.winnerId)
  .map(m => m.winnerId!)

// MED:
const roundMatches = bracket.matches.filter(m => m.round === completedRound && m.winnerId)
const byeWinners = roundMatches
  .filter(m => m.homeClubId === m.awayClubId)
  .map(m => m.winnerId!)
const matchWinners = roundMatches
  .filter(m => m.homeClubId !== m.awayClubId)
  .map(m => m.winnerId!)

// Interleave so bye-teams face match-winners
let winners: string[]
if (byeWinners.length > 0 && matchWinners.length > 0) {
  winners = []
  const maxLen = Math.max(byeWinners.length, matchWinners.length)
  for (let i = 0; i < maxLen; i++) {
    if (i < byeWinners.length) winners.push(byeWinners[i])
    if (i < matchWinners.length) winners.push(matchWinners[i])
  }
} else {
  // No byes (round 2+) — use original order
  winners = roundMatches.map(m => m.winnerId!)
}
```

Resten av funktionen (fixture-skapande-loopen) är oförändrad.

**Usecase att verifiera:**
1. Starta nytt spel, spela framåt till cup-kvartsfinal (matchday 8).
2. Öppna match-fliken eller inkorg. Kontrollera QF-matcherna.
3. Varje kvartsfinal ska ställa ett topp-4-lag mot en R1-vinnare.
   (Inte topp vs topp eller R1-vinnare vs R1-vinnare.)
4. Alternativt: lägg till `console.log` i generateNextCupRound
   som skriver ut parningarna.

---

## FIX 7 — Spara-knappen i settings gör inget

**Problem:** GameHeader settings-menyn visar "💾 Spara spel" men
anropar bara `setSaveToast(true)` utan att faktiskt persista.

**Fil:** `src/presentation/components/GameHeader.tsx`

**Fix:** Kontrollera först vad persist-funktionen heter. Kör:
```bash
grep -n "export.*save\|export.*persist" src/infrastructure/persistence/saveGameStorage.ts
```

Anropa sedan rätt funktion. Troligtvis:

```tsx
// I GameHeader.tsx, importera:
import { saveToLocalStorage } from '../../infrastructure/persistence/saveGameStorage'
// (anpassa funktionsnamnet efter vad grep returnerar)

// Ändra spara-knappens action:
{ label: '💾 Spara spel', action: () => {
  const currentGame = useGameStore.getState().game
  if (currentGame) {
    saveToLocalStorage(currentGame)
  }
  setSaveToast(true)
  setTimeout(() => setSaveToast(false), 2000)
}},
```

**Usecase att verifiera:**
1. Spela 2-3 omgångar.
2. Klicka ⚙️ → "💾 Spara spel" → se toast "✓ Sparat".
3. Ladda om sidan helt (Cmd+Shift+R).
4. Spelet ska vara kvar på samma ställe (samma omgång, samma trupp).

---

## FIX 8 — Ta bort oanvänd portraits.ts

**Problem:** Två portrait-filer finns:
- `src/domain/services/portraitService.ts` (ANVÄNDS av PlayerCard + SquadScreen)
- `src/presentation/utils/portraits.ts` (troligtvis OANVÄND)

**Fix:** Verifiera först:
```bash
grep -rn "from.*portraits" src/ --include="*.ts" --include="*.tsx" | grep -v portraitService | grep -v node_modules
```

Om inga resultat → ta bort:
```bash
rm src/presentation/utils/portraits.ts
```

Om filen IMPORTERAS någonstans — ändra den importen till
`portraitService` istället, och ta sedan bort filen.

**Usecase:** `npm run build` ska lyckas utan fel.

---

## IMPLEMENTATIONSORDNING

```
1. FIX 1 — BoardMeeting dubbelheader (5 min)
2. FIX 2 — MatchHeader dubblering (2 min)
3. FIX 3 — TabellScreen tab-beskrivningar (5 min)
4. FIX 4 — Utvisning layouthopp (10 min)
5. FIX 5 — Kontroller visuellt sammanhang (10 min)
6. FIX 7 — Spara-knapp persist (5 min)
7. FIX 8 — Ta bort portraits.ts (1 min)
8. FIX 6 — Cup-lottning (15 min, berör spellogik — SIST)
```

`npm run build && npm test` efter VARJE steg.
Committa efter varje steg: `fix: [kort beskrivning]`

---

## VERIFIERINGSPROTOKOLL EFTER DEPLOY

Jacob kör dessa usecases i ordning efter att alla fixar deployats:

### UC1: Nytt spel — onboarding-flöde
1. Gå till startsidan → "Nytt spel"
2. Skriv namn → "Gå vidare"
3. ✅ "Välj klubb"-skärmen: BARA "BANDY MANAGER"-header. Ingen GameHeader.
4. Välj klubb → "Acceptera uppdraget"
5. ✅ Styrelsemötet: BARA "BANDY MANAGER"-header. Ingen GameHeader ovanför.
6. ✅ Styrelsemål visar specifik text ("Håll er i övre halvan...")
7. ✅ "BURY FEN" footer längst ner.
8. Klicka "Kör igång!" → ✅ Dashboard utan problem.

### UC2: Match-flöde — ingen dubblering
1. Gå till Match-fliken.
2. ✅ Matchinfo (omgång, motståndare, hemma/borta) visas EN gång.
3. ✅ MatchHeader under visar väder — INTE matchinfo igen.
4. Klicka igenom steg 1 → 2 → 3.
5. ✅ StartStep visar atmosfärtext (italic) överst.

### UC3: Livematch — kontroller + utvisningar
1. Starta livematch (live-läge).
2. ✅ Kontroller + stats grupperade visuellt under scoreboarden.
3. Snabbspola med ⏩ till utvisning.
4. ✅ "Utv #X" fadar in utan layouthopp.
5. Utvisning löper ut → ✅ fadar ut utan hopp.

### UC4: Tabell + Settings + Spara
1. Gå till Tabell-fliken → ✅ Tab-beskrivning syns.
2. Byt till Statistik → ✅ annan beskrivning.
3. Klicka ⚙️ → "Spara spel" → ✅ toast "✓ Sparat".
4. Ladda om sidan (Cmd+Shift+R) → ✅ spelet finns kvar.

### UC5: Cup-lottning (kräver framspelning)
1. Spela framåt till cup-kvartsfinal (matchday 8).
2. ✅ Varje QF ställer seedat lag (topp 4) mot R1-vinnare.
   Inte topp vs topp.
