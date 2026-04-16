# CODE — 3 fixar efter verifiering

**Datum:** 16 april 2026  
**Kontext:** Verifieringsrapporten identifierade 1 bugg + 2 saknade saker. Fixa EXAKT dessa tre — inget annat.

`npm run build && npm test` efter varje fix. Kör `npx ts-node scripts/calibrate.ts` efter fix 1.

---

## FIX 1: secondHalfShare 0.488 → mål 0.543

### Problem
Andra halvlek genererar för få mål. Verklig Elitserie-data visar 60.7% av mål i andra halvlek. Vår motor producerar 48.8%.

### Orsak
GOAL_TIMING_BY_PERIOD ger bara ~51% för andra halvlek (vikterna är nära 1.0 för alla perioder). secondHalfGoalMod (chasing 1.08, controlling 0.92) tar ut varandra i genomsnitt.

### Fix
I `matchCore.ts`, i step-loopen (både simulateFirstHalf och simulateSecondHalf), där `stepGoalMod` beräknas — lägg till en global andra-halvlek-boost:

```typescript
// Lägg till som konstant högst i filen, efter PROFILE_GOAL_MODS:
// Empirisk boost: verklig Elitserie-data visar 60.7% av mål i 2:a halvlek.
// Timing weights producerar ~51%. Boost 1.25 → ~54.4% share + total ~10.0 mål.
const SECOND_HALF_BOOST = 1.25
```

I step-loopen i `simulateSecondHalf`, EFTER raden som beräknar `stepGoalMod`:
```typescript
// Redan existerande rad:
let stepGoalMod = weatherGoalMod * phaseConst.goalMod * GOAL_TIMING_BY_PERIOD[period] * profileGoalMod

// LÄGG TILL direkt efter:
stepGoalMod *= SECOND_HALF_BOOST
```

**OBS:** Applicera BARA i `simulateSecondHalf`, INTE i `simulateFirstHalf`. Applicera INTE i overtime-loopen (den har redan sin egen `otGoalMod`).

### Verifiering
```bash
npx ts-node scripts/calibrate.ts
```
Förväntat resultat:
- secondHalfShare: ~0.54 (inom ±0.03 av 0.543) ✅
- goalsPerMatch: ~10.0 (oförändrat eller marginellt högre) ✅
- Övriga targets: oförändrade

---

## FIX 2: Presskonferens community-frågor

### Problem
Presskonferensen saknar frågor som refererar orten, mecenater, anläggningar och akademin.

### Fix
I `pressConferenceService.ts`, lägg till community-frågor i QUESTIONS-objektet. Hitta rätt ställe — troligen finns det redan context-kategorier som 'bigWin', 'win', 'loss', 'draw'. Lägg till en ny kategori eller blanda in i befintliga:

```typescript
// Lägg till dessa frågor i relevanta kategorier (win/bigWin):
// Community standing hög (CS > 75):
{ text: 'Det pratas om er i hela kommunen. Är det press eller inspiration?',
  preferIds: ['w_h1', 'w_c1', 'cl01'], minRound: 5 },

// Community standing låg (CS < 35) — i loss-kategorin:
{ text: 'Publiken sviker. Hur påverkar det laget?',
  preferIds: ['l_h1', 'l_c2', 'cl14'], minRound: 5 },

// Mecenat just anslutit — i win/bigWin:
{ text: 'Ni har fått en ny mecenats stöd. Gör det skillnad i omklädningsrummet?',
  preferIds: ['w_p2', 'w_h2', 'cl07'], minRound: 6 },

// Akademispelare imponerar — i win:
{ text: 'Ni har en ung spelare som imponerar. Hur hanterar ni trycket?',
  preferIds: ['w_p3', 'w_h3', 'cl03'], minRound: 4 },
```

**Alternativt:** Om presskonferens-frågorna redan har en context-filter-funktion (en funktion som väljer frågor baserat på game state) — lägg till community-villkor där istället. Poängen är att frågorna ska triggas av CS, mecenat-status och akademi-status — inte bara matchresultat.

Kolla hur befintliga frågor filtreras (t.ex. `minRound`). Följ samma mönster.

### Verifiering
Grep efter de nya frågorna:
```bash
grep -n "hela kommunen\|Publiken sviker\|mecenats stöd\|ung spelare som imponerar" src/domain/services/pressConferenceService.ts
```
Ska returnera 4 rader.

---

## FIX 3: Cup self-pairing guard (defensiv)

### Problem
`generateCupFixtures` har ingen explicit guard mot att ett lag paras mot sig självt. Troligen OK (teamIds bör vara unika) men en guard kostar ingenting och förhindrar en katastrofal bugg.

### Fix
I `cupService.ts`, `generateCupFixtures`, EFTER shufflen och FÖRE pairing-loopen:

```typescript
// Guard: verify no duplicates in playInTeams after shuffle
if (new Set(playInTeams).size !== playInTeams.length) {
  console.error('[CUP BUG] Duplicate teams in play-in list:', playInTeams)
}

// Guard: verify no team appears in both bye and play-in
const byeSet = new Set(byeTeams)
if (playInTeams.some(id => byeSet.has(id))) {
  console.error('[CUP BUG] Team in both bye and play-in lists')
}
```

Det här är en DEFENSIV guard — den loggar men kraschar inte. Om den aldrig triggas i playtest var det inte ett problem. Om den triggas vet vi exakt var felet sitter.

### Verifiering
```bash
grep -n "CUP BUG" src/domain/services/cupService.ts
```
Ska returnera 2 rader.

---

## EFTER ALLA 3 FIXAR

Kör:
```bash
npm run build && npm test
npx ts-node scripts/calibrate.ts
```

Rapportera alla 5 kalibreringstargets. Klart.
