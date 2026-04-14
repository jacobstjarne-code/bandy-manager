# SPRINT: Allt som kvarstår (14 april 2026)

Samlad spec för Code. Ersätter INTE tidigare spec-filer men SAMMANFATTAR allt som är kvar.

`npm run build && npm test` efter VARJE fix.

**Kvalitetsgates (CLAUDE.md):**
- ALDRIG verifiera komponenter i isolation — läs parent screen FÖRST
- trace full renderflöde (vad renderas, i vilken ordning, med vilka props)
- grep-verifiera att imports finns
- bygg + test efter varje steg

---

## DEL 1: BUGGAR (prioriterade)

### 1.1 Coach marks overlay — LÖST

**Status:** ✅ Implementationen var korrekt. Problemet var att `saveGameMigration` inte migrerade `tutorialSeen: true` → `coachMarksSeen: true`. Nu fixat. Stäng och gå vidare.

---

### 1.2 Hörn-SVG — inline-knappar krockar + "H. hörna" avklippt

**Fil:** `src/presentation/components/match/CornerInteraction.tsx`

**Problem 1:** SVG-zonknapparna (NÄRA/MITT/BORTRE) har y-positioner 20/40/60 med höjd 20 vardera — de sitter kant i kant utan gap.

**Fix:** Öka y-avstånd + tydligare visuell separation:
```typescript
// Ändra y-positioner:
// NÄRA:   y=15  height=18
// MITT:   y=38  height=18   (var 40, nu 5px gap)
// BORTRE: y=61  height=18   (var 60, nu 5px gap)
// Bredare stroke på aktiv: strokeWidth={zone === z ? '1.5' : '0.8'}
// Högre opacity på aktiv fill: zone === z ? 0.35 : 0.08
```

**Problem 2:** "H. hörna" avklipps i höger kant. Hörnpunkten vid (195,95) har text som inte ryms.

**Fix:** Flytta text till vänster om punkten:
```typescript
<text x="175" y="93" fontSize="6" fill="var(--accent)" fontWeight="600" textAnchor="end">
  Hörna från höger
</text>
```
Randomisera "Hörna från höger" / "Hörna från vänster" per tillfälle. Spegla punktens x-position (195 vs 5) beroende på sida.

---

### 1.3 Kontraktsförnyelse fastnar (BUG-7)

**Filer:** `TransfersScreen.tsx`, `RenewContractModal.tsx`, `DashboardScreen.tsx`

Verifiera att ALLA tre fixar finns:
1. `RenewContractModal`: `useState(2)` (INTE 1)
2. `TransfersScreen expiringPlayers`: `<= game.currentSeason` (INTE +1)
3. `handleRenew`: `saveSaveGame(updatedGame)` efter setState
4. `DashboardScreen` nudge: samma filter som TransfersScreen

---

### 1.4 Mecenater spawnar aldrig (BUG-4)

**Fil:** `roundProcessor.ts`

Verifiera att mecenat-spawn-logiken finns i roundProcessor. Krav:
- `generateMecenat` importerad från mecenatService
- Trigger: CS >= 65, rep >= 55, 15% chans, omgång 6-18, max 1/säsong
- Event med 'welcome'/'cautious'/'decline' val i eventResolver

---

### 1.5 cupRun board objective (BUG-3)

**Fil:** `boardObjectiveService.ts`

Verifiera att `m.loserId === game.managedClubId` kollas. Om eliminerad OCH maxRound < targetValue → `status: 'failed'`.

---

### 1.6 Troféer lösa på dashboarden (BUG-10)

**Filer:** `DashboardScreen.tsx` + `CareerStatsCard.tsx`

Flytta trofé-logiken IN i CareerStatsCard. Ta bort lösa TROFÉ-RAD-blocket. Skippa cup-emoji om CUP-badge redan finns.

---

### 1.7 Form-prickar inkonsekvent ordning (BUG-11)

**Fil:** `PlayoffIntroScreen.tsx`

Ta bort `.reverse()` på managedResults. Senaste match alltid längst till vänster.

---

### 1.8 DiamondDivider har flyttat (BUG-20)

**Fil:** `DashboardScreen.tsx`

Verifiera att DiamondDivider renderas på exakt ETT ställe — direkt före datum/omgång-raden och CTA-knappen.

---

### 1.9 Styrelsemöte dubbelcitat (BUG-12)

**Fil:** `BoardMeetingScreen.tsx`

Openertext nämner ordföranden vid namn + första citatet under "om läget" är också ordföranden. Fix: hoppa över ordföranden i citat-listan, ELLER gör openern generisk.

---

### 1.10 Presskonferens — 4 buggar

**Fil:** `pressConferenceService.ts` + renderingskomponent

**BUG-16:** "Neutral · Neutral" i header. Fix: om tone === relationship, visa bara en. Bättre: visa `journalistName · outletName` istället.

**BUG-17:** Alla val har 😊. Fixat via `responseEmoji()` — VERIFIERA att den anropas i renderingen. ID-konventionen: `_a` = 😤, `_h` = 🙏, `_d` = 😐, default baserat på moraleEffect.

**BUG-21:** "Bästa matchen?" vid omgång 2. Fix: `minRound`-fält finns nu i QUESTIONS — verifiera att filtreringen `round >= q.minRound` fungerar:
- bigWin[0]: minRound: 6
- win[3]: minRound: 3
- win[5]: minRound: 5
- loss[8]: minRound: 3

---

### 1.11 Kafferummet upprepar (BUG-18)

**Fil:** `coffeeRoomService.ts`

`lastCoffeeQuoteHash`-mekanismen finns. Verifiera att den sparas korrekt i game state efter varje omgång.

---

### 1.12 ?-knappen koppar (BUG-19)

**Fil:** `GameHeader.tsx`

?-ikonen ska vara dämpad som default:
```typescript
border: '1.5px solid var(--border)', color: 'var(--text-muted)'
```
Inte `var(--accent)`.

---

### 1.13 TransfersScreen flikar (BUG-5)

**Fil:** `TransfersScreen.tsx`

Verifiera: inga emojis i fliknamn, 6px prick-badges på relevanta flikar.

---

### 1.14 paddingBottom (BUG-6)

7 skärmar:

| Skärm | Fix |
|-------|-----|
| HalfTimeSummaryScreen | paddingBottom 120→160 |
| PlayoffIntroScreen | calc(24px + env(safe-area-inset-bottom)) |
| QFSummaryScreen | Samma |
| SeasonSummaryScreen | 100→180 |
| BoardMeetingScreen | 90→120 |
| PreSeasonScreen | Lägg till paddingBottom |
| ChampionScreen | flex-start + paddingTop + overflowY auto |

---

### 1.15 BALANS-1: CS diminishing returns

**Fil:** `processCommunity` i communityProcessor.ts

```typescript
const diminishingFactor = currentCS > 85 ? 0.25
  : currentCS > 70 ? 0.5
  : currentCS > 55 ? 0.75
  : 1.0
const effectiveBoost = rawBoost * diminishingFactor
```
Negativa effekter behåller FULL kraft.

---

### 1.16 Cupvy saknar resa-kontext (BUG-22)

**Filer:** `CupCard.tsx` + `DashboardScreen.tsx`

Lägg till progress-rad:
```
✓ Förstarunda → ✓ KF → ● SF → ○ Final
```

Mellanläge-text: "Ni är i semifinalen! Motståndare lottas snart." istället för bara "Semifinal spelas matchdag 13".

---

### 1.17 Arenanamn i GranskaScreen — LÖST

**Status:** ✅ "Spelades på Slagghögen" visas under åskådarraden. Också i NextMatchCard, Scoreboard, StartStep, MatchReportView.

---

## DEL 2: NYA FEATURES

### 2.1 Straffar under match (interaktiv)

**Nya filer:**
- `src/domain/services/penaltyInteractionService.ts`
- `src/presentation/components/match/PenaltyInteraction.tsx`

**Trigger i matchStepByStep.ts:** I foul-sekvensen, ~20% av fouls i anfallszon → straffslag. Bara för managed club (interaktiv). AI-lag löser automatiskt.

**penaltyInteractionService.ts:**
```typescript
export type PenaltyDirection = 'left' | 'center' | 'right'
export type PenaltyHeight = 'low' | 'high'

export interface PenaltyInteractionData {
  minute: number
  shooterName: string
  shooterId: string
  shooterSkill: number
  keeperName: string
  keeperSkill: number
}

export interface PenaltyOutcome {
  type: 'goal' | 'save' | 'miss'
  description: string
  shooterDirection: PenaltyDirection
  keeperDive: PenaltyDirection
}

export function resolveAIPenaltyKeeperDive(
  coachStyle: string,
  rand: () => number,
): PenaltyDirection {
  // Defensiv AI gissar mer (center bias)
  // Offensiv AI gissar brett (left/right bias)
  const r = rand()
  if (coachStyle === 'defensive') {
    if (r < 0.35) return 'left'
    if (r < 0.65) return 'center'
    return 'right'
  }
  if (r < 0.40) return 'left'
  if (r < 0.60) return 'center'
  return 'right'
}

export function resolvePenalty(
  data: PenaltyInteractionData,
  dir: PenaltyDirection,
  height: PenaltyHeight,
  keeperDive: PenaltyDirection,
  rand: () => number,
): PenaltyOutcome {
  const same = dir === keeperDive
  let goalChance = same ? 0.25 : 0.75

  // Skill adjustment
  goalChance += (data.shooterSkill - data.keeperSkill) / 100 * 0.15

  // High = harder to save but easier to miss
  if (height === 'high') {
    goalChance = same ? 0.35 : 0.80
    if (rand() < 0.15) {
      return { type: 'miss', description: 'Skottet seglar över ribban!',
               shooterDirection: dir, keeperDive }
    }
  }

  // Center = high risk/reward
  if (dir === 'center') {
    goalChance = keeperDive === 'center' ? 0.10 : 0.85
  }

  if (rand() < goalChance) {
    const dirText = dir === 'left' ? 'vänstra hörnet'
      : dir === 'right' ? 'högra hörnet' : 'rakt fram'
    return { type: 'goal',
      description: `MÅL! Bollen i ${dirText}. Målvakten chanslös.`,
      shooterDirection: dir, keeperDive }
  }

  return { type: 'save',
    description: 'Räddning! Målvakten läser skottet och parar.',
    shooterDirection: dir, keeperDive }
}
```

**PenaltyInteraction.tsx — UI:**

Enklare än hörnor. Ingen SVG behövs.

```tsx
// Layout:
// ┌──────────────────────────────┐
// │ 🏒 STRAFF — 34:e minuten    │
// │                               │
// │ Skytt: S. Kronberg            │
// │ Målvakt: K. Nilsson           │
// │                               │
// │ PLACERING                     │
// │ [Vänster]  [Mitt]  [Höger]   │
// │                               │
// │ HÖJD                         │
// │ [Lågt 🧊]      [Högt ⬆️]     │
// │                               │
// │ [    SKJUT STRAFFEN →     ]  │
// └──────────────────────────────┘
```

Samma card-sharp stil som CornerInteraction. Samma yield-mekanism i matchStepByStep.

**Integration i matchStepByStep.ts:**
```typescript
// I foul-sekvensen, efter utvisningscheck:
if (isPenalty && isManagedAttacking) {
  // yield penaltyInteraction-steg
  // Vänta på spelarens val
  // yield utfall (goal/save/miss)
} else if (isPenalty) {
  // AI-straff: resolveAIPenaltyKeeperDive + resolvePenalty automatiskt
}
```

Frekvens: `rand() < 0.20` av fouls i anfallszon. Anfallszon = `rand() < 0.35`. Ger ~0.5 straffar/match totalt. Matchar Bandygrytans 5.1%.

---

### 2.2 Kaptensmekanism

**Ny:** `captainPlayerId?: string` i SaveGame.

**Trigger:** PreSeasonScreen eller event vid säsongsstart. Spelaren väljer bland 5 mest erfarna outfield-spelare.

**Effekter:**
- +3 moral permanent
- Nämns i presskonferenser ("Kaptenen tog ton...")
- © i spelarkort + trupp-vy
- "Lagkapten: {namn}" i säsongssammanfattning
- Om säljs/skadas → event "Ny kapten behövs"

**UI:**
- Spelarkort: © bredvid namn
- SquadScreen: © i lineup-rad
- SeasonSummary: "Lagkapten: Erik Ström"
- PreSeason: Beslutskort med 5 alternativ

---

### 2.3 Hörn-SVG — ta bort dubbla knappar

**Fil:** `CornerInteraction.tsx`

Nuvarande: SVG med zonknappar + SEPARATA HTML-knappar under = dubblering.

**Fix:** Ta bort de HTML-knapparna under "VÄLJ ZON". Behåll BARA SVG-knapparna (med fixade gap från 1.2). Behåll LEVERANS-knapparna som HTML (de har ingen SVG-motsvarighet).

Resultat:
```
[SVG med pitch + inline zonknappar + hörnpunkt]
LEVERANS
[Hårt skott] [Låg pass] [Kort hörna]
[SLÅ HÖRNAN →]
```

---

### 2.4 Kalibrering — verifieringsskript

**Ny fil:** `scripts/calibrate.ts`

Kör 200 simuleringar, jämför mot `docs/data/bandygrytan_stats.json` calibrationTargets:
```typescript
const targets = {
  goalsPerMatch: { target: 10.0, tolerance: 1.5 },
  cornerGoalShare: { target: 0.232, tolerance: 0.03 },
  homeWinRate: { target: 0.507, tolerance: 0.05 },
  drawRate: { target: 0.090, tolerance: 0.03 },
  secondHalfShare: { target: 0.543, tolerance: 0.03 },
}
```

Logga avvikelser. Justera konstanterna iterativt tills alla targets är inom tolerance.

---

## DEL 3: PRIORITERING

### Fas 1 — Buggar (gör först)
1. ~~Coach marks (1.1)~~ ✅ LÖST (migrering)
2. Hörn-SVG knappar (1.2) — synlig varje match
3. Kontraktsförnyelse (1.3) — verifiera 4 delåtgärder
4. Mecenat spawn (1.4) — helt oanvänt system
5. cupRun failed (1.5)
6. Troféer (1.6)
7. Form-prickar (1.7)
8. DiamondDivider (1.8)
9. Styrelsemöte (1.9)
10. Presskonferens 4-pack (1.10)
11. Kafferum (1.11)
12. ?-knapp (1.12)
13. Transfers flikar (1.13)
14. paddingBottom (1.14)
15. BALANS-1 (1.15)
16. Cupvy kontext (1.16)
17. ~~Arenanamn i Granska (1.17)~~ ✅ LÖST

### Fas 2 — Features (efter alla buggar)
18. Straffar under match (2.1)
19. Kapten (2.2)
20. Hörn-SVG dubbla knappar (2.3)
21. Kalibrering verifiering (2.4)

---

## VERIFIERING EFTER ALLT

Starta nytt spel. Spela 5+ omgångar. Kontrollera:
- [x] Coach marks visas med dim + spotlight vid första start — LÖST (migrering)
- [ ] ?-knappen dämpad, inte koppar
- [x] Klacknamn ≠ Bandykorpen — LÖST (Brukskurvan)
- [x] Arenanamn visas i NextMatchCard, Scoreboard, Granska — LÖST
- [ ] Hörnor: zonknappar separerade, ingen dubblett, "Hörna från höger/vänster"
- [ ] Kontraktsförnyelse försvinner efter förlängning
- [ ] Form-prickar: senaste match till vänster överallt
- [ ] Presskonferens: inga "Neutral · Neutral", varierande emoji
- [x] Ekonomi-kort: kompakt layout — LÖST
- [x] Taktikjustering: visuellt skild från pep talk-knappar — LÖST
- [x] Matchsammanfattning: ingen "Motståndarna var starkare" vid vinst — LÖST
- [ ] Orten: CS når aldrig 100 på 10 omgångar (diminishing returns)
- [ ] Troféer inne i CareerStatsCard, inte lösa
- [ ] DiamondDivider på rätt plats
- [ ] Cupvy: progress-rad (✓ Förstarunda → ✓ KF → ● SF → ○ Final)
- [ ] paddingBottom: CTA-knappar synliga på alla overlay-skärmar
