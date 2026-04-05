# FIXSPEC — Post-verifiering 5 april 2026

Verifierad av Opus mot CLAUDE.md-protokollet. Varje fix är
isolerad. Gör EN fix i taget. `npm run build && npm test` efter varje.

Commit-konvention: `fix: [kort beskrivning]`

---

## FIX 1 — OnboardingShell + BoardMeeting header/footer (KRITISK)

### 1A — OnboardingShell matchar inte GameHeader

**Problem:** OnboardingShell i NewGameScreen har en centrerad text
"BANDY MANAGER" som header, och en footer med `background: var(--bg)`
(= sidbakgrunden → ser transparent ut). Headern ska ha samma utseende
som GameHeader: logotyp vänster, mörk bakgrund, accent-border.
"← Tillbaka" ligger som textlänk i body — ska vara i headern.
CTA-footern har gradient som gör att sista klubben syns igenom.

**Fil:** `src/presentation/screens/NewGameScreen.tsx`

**Fix — OnboardingShell header:** Ersätt hela `<header>`-blocket:

```tsx
const OnboardingShell = ({ children, onBack }: { children: React.ReactNode; onBack?: () => void }) => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 12px',
      background: 'var(--bg-dark)',
      borderBottom: '2px solid var(--accent)',
      flexShrink: 0,
      minHeight: 44,
    }}>
      {/* Left: back button or logo */}
      {onBack ? (
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(245,241,235,0.7)', fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 4, padding: 0,
          }}
        >
          ← Tillbaka
        </button>
      ) : (
        <img
          src="/bandymanager-logo.png"
          alt="Bandy Manager"
          style={{ height: 26, width: 'auto', opacity: 0.85 }}
        />
      )}

      {/* Center: title */}
      <span style={{
        color: 'var(--text-light)', fontSize: 11, letterSpacing: 3,
        textTransform: 'uppercase', fontFamily: 'var(--font-body)', fontWeight: 600,
        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
      }}>
        NYTT SPEL
      </span>

      {/* Right: spacer */}
      <div style={{ width: 60 }} />
    </div>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', position: 'relative' }}>
      {children}
    </div>
    <footer style={{
      height: 40, background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2 }}>BURY FEN</span>
    </footer>
  </div>
)
```

Nyckeländringar:
- Header: `var(--bg-dark)` + `borderBottom: 2px solid var(--accent)` = samma som GameHeader
- Logo till vänster (name-steget) ELLER "← Tillbaka" (club-steget)
- `position: relative` på headern för centrerad text
- Footer: `var(--bg-surface)` istället för `var(--bg)` → synlig bakgrund

**Fix — Name step:** Anropa med `<OnboardingShell>` (ingen onBack).

**Fix — Club step:**
1. Anropa med `<OnboardingShell onBack={() => setStep('name')}>`
2. TA BORT "← Tillbaka"-knappen ur body (textlänken i club list).
3. TA BORT "Välj klubb" + namn/säsong-diven ur body — flytta till
   OnboardingShell center-text, eller behåll som rubrik men ta bort
   den redundanta toppen.

**Fix — CTA footer (club step):** Ersätt den transparenta gradienten:
```tsx
// FÖRE:
background: 'linear-gradient(to top, var(--bg) 70%, transparent)',

// EFTER:
background: 'var(--bg-surface)',
borderTop: '1px solid var(--border)',
```

### 1B — BoardMeetingScreen samma fix

**Fil:** `src/presentation/screens/BoardMeetingScreen.tsx`

Samma problem: centrerad "BANDY MANAGER" + transparent footer.

**Fix — Header:** Ersätt `<header>`-blocket med logotyp-variant:
```tsx
<div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 12px',
  background: 'var(--bg-dark)',
  borderBottom: '2px solid var(--accent)',
  flexShrink: 0,
  minHeight: 44,
}}>
  <img
    src="/bandymanager-logo.png"
    alt="Bandy Manager"
    style={{ height: 26, width: 'auto', opacity: 0.85 }}
  />
  <span style={{
    color: 'var(--text-light)', fontSize: 11, letterSpacing: 3,
    textTransform: 'uppercase', fontFamily: 'var(--font-body)', fontWeight: 600,
  }}>
    STYRELSEMÖTE
  </span>
  <div style={{ width: 26 }} />
</div>
```

**Fix — Footer:** Ändra `background: 'var(--bg)'` → `background: 'var(--bg-surface)'`.

### 1C — BoardMeetingScreen dubbelheader (APPLICERAD)

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

## FIX 8 — Dashboard-cards ojämn bredd (strukturell fix)

**Problem:** Korten på dashboard har olika bredd/margin. Varje kort
sätter sin egen `margin-bottom` (4px, 8px, 10px, 12px) och det
glider isär. Att normalisera margin per kort är en slarvfix —
samma problem uppstår nästa gång ett kort läggs till.

### Steg 1 — Lägg till `.card-stack` i global.css

**Fil:** `src/styles/global.css`

Lägg till efter `.card-round` blocket:

```css
/* ── Card stack: vertical card layout with consistent spacing ── */
.card-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 12px;
}

.card-stack > * {
  margin-bottom: 0 !important;  /* override inline styles */
}
```

### Steg 2 — Använd `.card-stack` i DashboardScreen

**Fil:** `src/presentation/screens/DashboardScreen.tsx`

Hitta den scrollbara containern som wrappar alla kort. Den har
troligen en stil som `padding: '0 12px'`. Ersätt med:

```tsx
<div className="card-stack" style={{ paddingTop: 12, paddingBottom: 90 }}>
  {/* alla kort här — NextMatchCard, Tabell, Cup, Trupp, etc. */}
</div>
```

TA BORT `margin: '0 0 10px'` / `margin: '0 0 8px'` / `margin: '0 0 4px'`
från varje enskilt kort inuti containern. `gap: 8px` hanterar
all spacing. Behåll `padding` INUTI korten (10px 14px etc.).

### Steg 3 — Använd `card-stack` även i andra skärmar

Samma klass bör användas överallt där kort staplas vertikalt:
- `ClubScreen.tsx` (träning/ekonomi/orten/akademi-tabbar)
- `TransfersScreen.tsx` (marknad/scouting/kontrakt)
- `BoardMeetingScreen.tsx` (kort-stapeln)

Men gör det BARA på DashboardScreen nu. De andra kan migreras
sedan utan risk.

**Usecase att verifiera:**
1. Öppna Dashboard.
2. ALLA kort ska ha exakt 8px mellanrum, inga undantag.
3. Inga kort som sticker ut eller är smalare/bredare.
4. Lägg till ett nytt test-kort med bara
   `<div className="card-sharp">test</div>` — det ska automatiskt
   få rätt spacing utan någon inline margin.

---

## FIX 9 — Ta bort oanvänd portraits.ts

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
1. FIX 1A — OnboardingShell header/footer (10 min)
2. FIX 1B — BoardMeetingScreen header/footer (5 min)
3. FIX 2 — MatchHeader dubblering (2 min)
4. FIX 3 — TabellScreen tab-beskrivningar (5 min)
5. FIX 4 — Utvisning layouthopp (10 min)
6. FIX 5 — Kontroller visuellt sammanhang (10 min)
7. FIX 7 — Spara-knapp persist (5 min)
8. FIX 8 — Dashboard-cards enhetlig bredd (10 min)
9. FIX 9 — Ta bort portraits.ts (1 min)
10. FIX 6 — Cup-lottning (15 min, berör spellogik — SIST)
```

`npm run build && npm test` efter VARJE steg.
Committa efter varje steg: `fix: [kort beskrivning]`

---

## VERIFIERINGSPROTOKOLL EFTER DEPLOY

Jacob kör dessa usecases i ordning efter att alla fixar deployats:

### UC1: Nytt spel — onboarding-flöde
1. Gå till startsidan → "Nytt spel"
2. "Vad heter du"-skärmen:
   ✅ Header: mörk bakgrund, logotyp vänster, accent-border under. Samma känsla som GameHeader.
   ✅ Footer: "BURY FEN" med synlig bakgrund (inte transparent/samma som sidan).
3. Skriv namn → "Gå vidare"
4. "Välj klubb"-skärmen:
   ✅ Header: "← Tillbaka" till vänster i headern (inte som textlänk i body).
   ✅ Ingen dubbel rubrik — "Välj klubb" syns som rubrik i content.
   ✅ CTA-footer ("Acceptera uppdraget") har solid bakgrund, inte gradient.
   ✅ Footer: "BURY FEN" med synlig bakgrund.
5. Välj klubb → "Acceptera uppdraget"
6. Styrelsemötet:
   ✅ Header: logotyp vänster, "STYRELSEMÖTE" i mitten. Ingen GameHeader.
   ✅ Footer: synlig "BURY FEN".
   ✅ Styrelsemål visar specifik text ("Håll er i övre halvan...")
7. Klicka "Kör igång!" → ✅ Dashboard utan problem.

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
