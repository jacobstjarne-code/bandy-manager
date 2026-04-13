# FIXSPEC: Playtest Runda 2 — Buggar & Balans

`npm run build && npm test` efter varje fix.

---

## BUG-1: showHalfTimeSummary saknas i advance()-navigation (KRITISK)

**Fil:** `src/presentation/store/actions/gameFlowActions.ts`

**Problem:** advance() kollar showPlayoffIntro och showQFSummary men INTE showHalfTimeSummary. Halvtidssummary visas aldrig direkt — istället flashar dashboard och redirectar via useEffect.

**Verifierad via playtest:** Spelaren kom tvåa efter 22 omgångar men hamnade på Match-tabben med "Säsongen är slut" istället för playoff-intro. Root cause: advance() navigerade till /game/review efter omgång 22, sedan till dashboard. showPlayoffIntro=true sattes i state men fångades aldrig av navigationskedjan. Om spelaren navigerade via BottomNav till Match-tabben före dashboard-useEffect hann köra → redirecten missades helt.

Dessutom: "Simulera resterande"-loopen bröts vid showHalfTimeSummary (omgång 11) → halv simulering → halvtidssummary fastnade → resterande omgångar spelades manuellt → slutspelstransition missade.

**Fix:** Lägg till showHalfTimeSummary-check FÖRE showPlayoffIntro i navigationskedjan:

```typescript
} else if (!suppressMatchNavigation) {
  if (result.game.showHalfTimeSummary) {
    navigateTo('/game/half-time-summary', { replace: true })
  } else if (result.game.showPlayoffIntro) {
```

---

## BUG-2: managedIsHome saknas i simulateMatchStepByStep-anropet (KRITISK)

**Fil:** `src/presentation/screens/MatchLiveScreen.tsx`

**Problem:** managedIsHome skickas aldrig till generatorn → isManagedCorner alltid false → inga interaktiva hörnor.

**Fix:** Lägg till i BÅDA anropen (simulateMatchStepByStep och simulateSecondHalf):
```typescript
managedIsHome: fixture.homeClubId === game.managedClubId,
```

---

## BUG-3: cupRun board objective markeras aldrig som failed

**Fil:** `src/domain/services/boardObjectiveService.ts`

**Fix:** I evaluateObjective, case 'cupRun':
```typescript
case 'cupRun': {
  const bracket = game.cupBracket
  if (!bracket) return { value: 0, status: 'active' }
  const managedMatches = bracket.matches.filter(m =>
    m.homeClubId === game.managedClubId || m.awayClubId === game.managedClubId
  )
  const maxRound = Math.max(0, ...managedMatches
    .filter(m => m.winnerId === game.managedClubId).map(m => m.round))
  const eliminated = managedMatches.some(m => m.loserId === game.managedClubId)
  if (maxRound >= objective.targetValue) return { value: maxRound, status: 'met' }
  if (eliminated) return { value: maxRound, status: 'failed' }
  return { value: maxRound, status: maxRound >= 2 ? 'active' : 'at_risk' }
}
```

---

## BUG-4: Mecenater spawnar aldrig (ALLVARLIG)

**Problem:** `generateMecenat()` och `generateMecenatIntroEvent()` existerar i `mecenatService.ts` men anropas aldrig i roundProcessor. `game.mecenater` är alltid `[]`. Det rika systemet med backstories, social events och silent shout är helt oanvänt.

**Fix:** Lägg till mecenat-spawn i roundProcessor, efter community-processing:

```typescript
// ── Mecenat spawn ─────────────────────────────────────────────────────
// Trigger: communityStanding >= 65, reputation >= 55, inga aktiva mecenater
// Max 1 mecenat per säsong. Spawnar som GameEvent (intro) som spelaren accepterar/avvisar.
if (
  !isSecondPassForManagedMatch &&
  currentLeagueRound !== null &&
  currentLeagueRound >= 6 &&
  currentLeagueRound <= 18
) {
  const cs = updatedGame.communityStanding ?? 50
  const rep = postTransferClubs.find(c => c.id === game.managedClubId)?.reputation ?? 50
  const activeMecenater = (updatedGame.mecenater ?? []).filter(m => m.isActive)
  const maxMecenater = cs >= 85 ? 3 : cs >= 70 ? 2 : 1
  const alreadySpawnedThisSeason = (updatedGame.mecenater ?? []).some(
    m => m.arrivedSeason === game.currentSeason
  )

  if (
    cs >= 65 &&
    rep >= 55 &&
    activeMecenater.length < maxMecenater &&
    !alreadySpawnedThisSeason &&
    localRand() < 0.15  // ~15% per omgång = ~2 tillfällen per säsong
  ) {
    const newMecenat = generateMecenat(game.managedClubId, game.currentSeason, localRand)
    const introEvent = generateMecenatIntroEvent(newMecenat)
    // Mecenat läggs till som inaktiv tills spelaren accepterar via event
    updatedGame = {
      ...updatedGame,
      mecenater: [...(updatedGame.mecenater ?? []), { ...newMecenat, isActive: false }],
    }
    allNewEvents.push(introEvent)
  }
}
```

**Dessutom:** Event-resolvern måste hantera 'welcome'/'cautious'/'decline' för mecenat-intro:
- 'welcome' → sätt mecenat.isActive = true, happiness +20
- 'cautious' → sätt mecenat.isActive = true, happiness +5
- 'decline' → ta bort mecenaten (eller markera som avvisad)

Kolla om eventResolver.ts redan hanterar patronEvent-typer och utöka med mecenat-specifik logik.

**Import:** Lägg till i roundProcessor:
```typescript
import { generateMecenat, generateMecenatIntroEvent } from '../../domain/services/mecenatService'
```

---

## BUG-5: TransfersScreen — flikar scrollar ut, inga flik-badges

**Fil:** `src/presentation/screens/TransfersScreen.tsx`

**Fix 1:** Ta bort emojis från fliknamn:
```
'Marknad' | 'Scouting' | 'Kontrakt' | 'Fria' | 'Sälj'
```

**Fix 2:** Flik-badges — liten prick (6px) på flikar med actionable items:
- 'contracts': röd prick om expiringPlayers.length > 0
- 'marknad': accent-prick om transferBids med direction === 'incoming' && status === 'pending'
- 'freeagents': accent-prick om freeAgents.length > 0 && windowOpen

```typescript
// I flik-rendering, efter tab.label:
{badgeForTab(tab.key) && (
  <span style={{
    position: 'absolute', top: 2, right: 2,
    width: 6, height: 6, borderRadius: '50%',
    background: tab.key === 'contracts' ? 'var(--danger)' : 'var(--accent)',
  }} />
)}
```

Flik-knapparna behöver `position: 'relative'`.

---

## BUG-6: Overlay/CTA paddingBottom — systematisk fix

| Skärm | Nuvarande | Fix |
|-------|-----------|-----|
| HalfTimeSummaryScreen | paddingBottom: 120 | → 160 |
| PlayoffIntroScreen | Ingen safe-area på CTA | paddingBottom: calc(24px + env(safe-area-inset-bottom)) |
| QFSummaryScreen | Ingen safe-area | Samma som PlayoffIntro |
| SeasonSummaryScreen | paddingBottom: 100 | → 180 |
| BoardMeetingScreen | paddingBottom: 90 | → 120 |
| PreSeasonScreen | Ingen paddingBottom | Lägg till paddingBottom: calc(24px + env(safe-area-inset-bottom)) |
| ChampionScreen | justifyContent: center | → flex-start + paddingTop: max(24px, 5vh) + overflowY: auto |

---

## BALANS-1: communityStanding för lätt att maxa

**Problem:** CS når 100 efter ~10 omgångar och stannar där. Varje vinst, sponsorevent och frivilligaktivitet ger flat boost utan diminishing returns.

**Fix i processCommunity:** Inför en avtagande multiplikator:
```typescript
// Diminishing returns: boosts halveras successivt över CS 70
const rawBoost = [matchBoost, sponsorBoost, activityBoost, playoffBoost].reduce((s, b) => s + b, 0)
const currentCS = game.communityStanding ?? 50
const diminishingFactor = currentCS > 85 ? 0.25 
  : currentCS > 70 ? 0.5 
  : currentCS > 55 ? 0.75 
  : 1.0
const effectiveBoost = rawBoost * diminishingFactor
```

Dessutom: negativa effekter (förluster, skandaler) bör INTE ha diminishing returns — det ska vara lika lätt att tappa från 90 som från 50.

---

## DESIGN: beatRival som event-driven feature (parkerad)

**Flytta från boardObjectiveService till en mid-season event.** Om du förlorar ett derby → nästa omgång dyker supporter-styrelsemedlemmen upp: "Vi MÅSTE slå dem i returen." Genereras som ett nytt BoardObjective mid-season.

**Parkeras i FIXSPEC_PARKERAT.md** — inte i denna sprint.

---

## BUG-7: Kontraktsförnyelse "fastnar" — spelare dyker upp igen direkt

**Filer:** `TransfersScreen.tsx` + `RenewContractModal.tsx`

**Root cause:** Tre samverkande problem:

1. **Default år = 1.** `RenewContractModal` har `useState(1)`. Spelaren väljer ofta default → kontrakt förlängs till `currentSeason + 1`.

2. **Filtret fångar currentSeason + 1.** `expiringPlayers` filtrerar `contractUntilSeason <= game.currentSeason + 1`. Om du förlänger med 1 år → samma spelare uppfyller fortfarande filtret → dyker upp igen.

3. **Ingen autosave.** `handleRenew` gör `useGameStore.setState(...)` men anropar aldrig `saveSaveGame()`. Om appen laddas om innan nästa advance() → förnyelsen är borta.

**Fix 1 — Ändra default till 2 år:**
```typescript
// RenewContractModal.tsx
const [years, setYears] = useState(2)  // var: 1
```

**Fix 2 — Ändra filtret till BARA innevarande säsong:**
```typescript
// TransfersScreen.tsx
const expiringPlayers = managedClubPlayers
  .filter(p => p.contractUntilSeason <= game.currentSeason)  // var: + 1
  .sort((a, b) => a.contractUntilSeason - b.contractUntilSeason)
```
Spelare med kontrakt t.o.m. NÄSTA säsong visas inte som "utgående" — de har fortfarande ett helt år kvar.

**Fix 3 — Spara till disk efter förnyelse:**
```typescript
// TransfersScreen.tsx, i handleRenew, efter useGameStore.setState:
import { saveSaveGame } from '../../infrastructure/persistence/saveGameStorage'
// ...
useGameStore.setState({ game: updatedGame })
saveSaveGame(updatedGame).catch(e => console.warn('Save failed:', e))
```

**Fix 4 — Visa bekräftelse istället för att stänga modalen tyst:**
Efter lyckad förnyelse, visa kort feedback: "✅ Kontrakt förlängt till {år}" i 2 sekunder. Inte bara stäng modalen — spelaren ska se att något hände.

**Fix 5 — Dashboard-nudgen ska inte visa redan förnyade spelare:**
```typescript
// DashboardScreen.tsx, nudge-logiken:
const expiringPlayer = squadPlayers.find(p => 
  p.contractUntilSeason <= game.currentSeason  // var: + 1
)
```

---

## BUG-8: NextMatchCard — ojämn höjd + saknad coach-rivalry

**Fil:** `src/presentation/components/dashboard/NextMatchCard.tsx`

**Problem 1 — Höjdskillnad:** Motståndarsidan visar AI-tränare (namn + stil) under badgen, men spelarens sida visar ingenting motsvarande. Det gör kolumnerna ojämna — motståndarsidans badge hamnar högre upp.

**Problem 2 — Coach rivalry saknas:** Designen förutsatte att BÅDA sidor visar sin tränare (coach-rivalry-känsla). Spelarens tränare (game.managerName) visas aldrig.

**Fix:** Visa spelarens namn + stil på managed-sidan, symmetriskt med motståndaren:

```typescript
// Under mySubTag i managed-club-sektionen:
<p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '4px 0 0' }}>{game.managerName}</p>
{(() => {
  const myCoach = game.aiCoaches?.[game.managedClubId]
  if (!myCoach) return null
  return <p style={{ fontSize: 9, color: 'var(--text-muted)', margin: '1px 0 0', fontStyle: 'italic' }}>{getCoachStyleLabel(myCoach.style)}</p>
})()}
```

Alternativt, om managed club inte har en AI-coach (spelaren ÄR tränaren): visa bara `game.managerName` utan stil-label. Det räcker för att balansera höjden.

Säkerställ `alignItems: 'flex-start'` på den yttre flex-containern så badges linjerar i topp oavsett textmängd under.

---

## BUG-9: CornerInteraction — position + knappar

**Fil:** `src/presentation/components/match/CornerInteraction.tsx`

**Problem 1 — Hörnpunkten ser ut som halvplan:** Hörnmarkören ligger vid (195, 5) i SVG:n — långt borta från målet vid (0, 35). Visuellt ser det ut som hörnslaget tas från halvplan.

**Problem 2 — Zonknappar i straffboxen överlappar lite** på små skärmar.

**Fix — Nytt SVG-perspektiv:**

Byt från sidovy (mål vänster, hörna höger) till **uppifrånvy med mål i toppen**:

```
┌─────────────────────────┐
│          ═══            │  ← Mål (centrerat i toppen)
│       ┌───────┐         │
│       │ NÄRA  │         │  ← Zonknappar INNE i straffområdet
│       ├───────┤         │
│       │ MITT  │         │     (vertikalt staplade, inte horisontellt)
│       ├───────┤         │
│       │BORTRE │         │
│       └───────┘         │
│                         │
│  ●                      │  ← Hörnpunkt (nedre vänster ELLER höger)
│ HÖRNA                   │
└─────────────────────────┘
```

- Mål i toppen → intuitivt att slå MOT mål
- Hörnpunkt i nedre hörnet → visuellt korrekt (nära kort linje)
- Randomisera höger/vänster hörna per tillfälle (rent kosmetiskt)
- Zonknapparna UTANFÖR SVG:n, under bilden, med tydligare separation

**Alternativ enklare fix:** Flytta hörnpunkten till (195, 95) — nedre höger istället för övre höger. Lägg till text "H. hörna" eller "V. hörna". Fortfarande inte perfekt men betydligt bättre.

**Knappseparation:** Öka gap från 4px till 6px mellan zonknappar. Lägg till `minHeight: 44` på varje knapp (touch target).

---

## BUG-10: Trofé-emojis flyter fritt på dashboarden

**Filer:** `DashboardScreen.tsx` + `CareerStatsCard.tsx`

**Problem:** Trofé-raden (🏆🏅🥈) renderas som ett löst block mellan tidningsraden och TRÄNARKARRIÄR-kortet. Ingen bakgrund, inget sammanhang. Dessutom dubblett: cup-vinst visas både som emoji OCH som "CUP 2026"-badge i CareerStatsCard.

**Fix:**
1. Flytta trofé-logiken från DashboardScreen IN i CareerStatsCard
2. Ta bort det lösa TROFÉ-RAD-blocket från DashboardScreen
3. I CareerStatsCard: skippa cup-emoji om CUP-badge redan finns för samma säsong
4. Rendera troféer + CUP-badges på en rad ovanför statistiken i kortet

---

## BUG-11: Form-prickar inkonsekvent ordning

**Problem:** Senaste match är ibland längst till vänster, ibland längst till höger. PlayoffIntroScreen använder `.reverse()` som vänder ordningen jämfört med alla andra ställen.

**Regel:** Senaste match ALLTID längst till vänster.

**Fix:** Ta bort `.reverse()` i PlayoffIntroScreen.tsx (~rad 85). Inga andra ändringar behövs — övriga ställen är redan korrekta.

---

## Prioriteringsordning

1. BUG-1 (halvvägs-navigation) — blockerar spelflödet, orsakar slutspelsbugg
2. BUG-2 (managedIsHome) — hela hörnmekaniken trasig
3. BUG-7 (kontraktsförnyelse) — extremt synlig, irriterande
4. BUG-4 (mecenat spawn) — stort system helt oanvänt
5. BUG-3 (cupRun failed) — synlig i UI varje spelgenomgång
6. BUG-8 (NextMatchCard alignment + coach) — visuellt störande
7. BUG-9 (CornerInteraction SVG) — förvirrande hörnposition
8. BUG-10 (troféer lösa på dash) — visuell röra + dubblett
9. BUG-6 (paddingBottom) — UX-irritation
10. BUG-5 (transfers flikar) — UX-irritation
11. BALANS-1 (CS diminishing returns) — balansändring
