# Sprint 26 — Ekonomi & Bygdens Puls: Balansering

**Status:** SPEC KLAR — REDO ATT IMPLEMENTERAS
**Prioritet:** HÖG (spelkänsla direkt påverkad, blockar meningsfull skandal-feature)
**Estimat:** 4-6 timmar implementation + stresstest-mätning

---

## KONTEXT

Stresstest 24 säsonger × flera klubbstorlekar visar två problem:

**Ekonomi är inaktivt:**
- Median-klubb: 570k → 1,45M → 2,5M → 3,5M efter 4 säsonger (accelererande kurva)
- Forsbacka (rep=85): 4M efter 4 säsonger
- Korrelation rep ↔ kapital säsong 1: **r=0.97**
- 0% av klubbar under 100k efter säsong 4
- Ekonomiskt utfall bestäms vid klubbval, inte av spelarens beslut

**Puls är redundant:**
- 51% av alla omgångar i bucket 91-100
- Längsta streak ≥98: 34 omgångar i rad
- Återhämtning från låga nivåer: 0 av 24 säsonger
- Puls aldrig under 30 genom hela mätningen
- Korrelation puls ↔ kapital: **r=0.90-0.96** (samma mätning som reputation/kapital)

**Diagnos:** Båda metriker är passiva funktioner av reputation. Spelaren saknar agency. Problemet är inte bara "för generöst" — det är "saknar motkrafter".

---

## DESIGNMÅL

### Ekonomi
- Forsbacka (rep=85) netto: ~50-150k/säsong (var 500-600k)
- Söderfors (rep=55) netto: -50k till +50k/säsong (volatilt)
- Målilla (rep=42) netto: -100k till +30k/säsong (mest press)
- Andel omgångar med negativt netto: 30-45% per säsong (idag 48% per omgång men alltid plus per säsong)
- **Konkurs ska vara svårt men möjligt** efter flera dåliga säsonger i rad
- Korrelation rep ↔ kapital ska sjunka från 0.97 till ~0.5-0.7 (spelarens val ska märkas)

### Bygdens Puls
- Puls-fördelning (andel omgångar): bucket 0-30: 5-15%, 30-60: 30-45%, 60-90: 30-40%, 90-100: 10-20%
- Återhämtning från låga nivåer: möjligt inom 8-15 omgångar med aktivt arbete
- Korrelation puls ↔ kapital: ska sjunka från 0.90-0.96 till ~0.4 (oberoende system)
- Puls ska spegla **ortens engagemang med klubben**, inte "hur rik klubben är"

---

## IMPLEMENTATION

### 1. Halvera weeklyBase med progressiv fördelning

**Fil:** `src/domain/services/economyService.ts`

```typescript
// Idag:
const weeklyBase = Math.round(club.reputation * 120)

// Nytt:
const weeklyBase = Math.round(2000 + club.reputation * 50)
```

**Effekt per klubb per omgång:**
| Klubb | Rep | Idag | Nytt | Diff |
|-------|-----|------|------|------|
| Målilla | 42 | 5040 | 4100 | -940 |
| Söderfors | 55 | 6600 | 4750 | -1850 |
| Forsbacka | 85 | 10200 | 6250 | -3950 |

Stora klubbar tappar proportionellt mer. Liten klubb har kvar mer än halva sin baseline.

### 2. Inför arena-underhåll som återkommande kostnad

**Fil:** `src/domain/services/economyService.ts`

**Ny FinanceReason:**
```typescript
export type FinanceReason =
  | 'wages'
  | 'match_revenue'
  | 'weekly_base'
  | 'arena_maintenance'  // NY
  | 'sponsorship'
  // ... existing
```

**Ny fixed cost i `calcRoundIncome`:**
```typescript
const arenaCapacity = club.arenaCapacity ?? Math.round(club.reputation * 7 + 150)
const weeklyArenaCost = Math.round(arenaCapacity * 8)  // ~3200-6000 kr/omg
```

**Subtraheras från `netPerRound`:**
```typescript
const netPerRound = weeklyBase + sponsorIncome + matchRevenue
  + communityMatchIncome + communityRoundIncome + volunteerIncome
  + kommunBidrag - weeklyWages - weeklyArenaCost  // NY
```

**Uppdatera `RoundIncomeBreakdown`** med `weeklyArenaCost` fält.

**Uppdatera roundProcessor** att logga arena-underhåll som egen FinanceEntry med label "Arena-underhåll" så det syns i ekonomi-loggen.

**Effekt:** Forsbacka (capacity ~745): 5960/omg = 197k/säsong. Målilla (capacity ~444): 3552/omg = 117k/säsong.

### 3. Kommunbidrag skalas kvadratiskt med community standing

**Fil:** `src/domain/services/economyService.ts` rad ~200

```typescript
// Idag:
const csFactor = 0.7 + ((communityStanding ?? 50) / 100) * 0.6  // 0.7-1.3

// Nytt:
const csNormalized = 0.3 + ((communityStanding ?? 50) / 100) * 0.7  // 0.3-1.0
const csFactor = csNormalized * csNormalized  // 0.09-1.0 (kvadratisk)
```

**Effekt:**
- Puls 30: csFactor 0.25 (var 0.88) → kommunbidrag 25% av tidigare
- Puls 60: csFactor 0.52 (var 1.06) → kommunbidrag 49% av tidigare
- Puls 100: csFactor 1.0 (var 1.3) → kommunbidrag 77% av tidigare

Kommunbidrag blir en **belöning för hög puls** istället för nästan-garanterad utbetalning.

### 4. Cap volontärers bidrag till community standing

**Fil:** behöver hittas — sök efter "volunteerCommunityBonus" eller motsvarande i `volunteerService.ts` och `roundProcessor.ts`.

**Idag:** Varje volontär bidrar ~+0.3 till community standing per omgång. Med 10 volontärer blir det +3.0/omg.

**Nytt:** Cap på +1.5 per omgång oavsett antal volontärer.

```typescript
const rawVolunteerCsBonus = volunteers.length * 0.3
const cappedVolunteerCsBonus = Math.min(rawVolunteerCsBonus, 1.5)
```

Ekonomiskt bidrag från volontärer ska INTE cappas — bara puls-bidraget. Man ska fortfarande vilja värva volontärer för pengarna.

### 5. Community standing mean reversion

**Fil:** `src/application/useCases/roundProcessor.ts` — söksträng "communityStanding"

**Idag:** Puls ackumuleras uppåt från alla aktiviteter, aldrig nedåt utan specifika negativa events.

**Nytt:** Varje omgång, INNAN andra puls-ändringar appliceras, dra puls sakta mot 60:

```typescript
const DRIFT_TARGET = 60
const DRIFT_STRENGTH = 0.03

const currentCs = game.communityStanding ?? 50
const driftDelta = (DRIFT_TARGET - currentCs) * DRIFT_STRENGTH

// Tillämpa innan andra ändringar
const csAfterDrift = currentCs + driftDelta
```

**Effekt per omgång:**
- Puls 100 → drift till 98.8 (-1.2)
- Puls 80 → drift till 79.4 (-0.6)
- Puls 60 → ingen drift
- Puls 40 → drift till 40.6 (+0.6)
- Puls 20 → drift till 21.2 (+1.2)

Matchresultat, aktiviteter, volontärer och events MÅSTE aktivt motverka driften. Puls 100 blir möjligt men kräver konstant arbete. Puls 20 dränerar klubben men återhämtas över tid.

---

## VERIFIERING

**Kör samma stresstest som gav diagnosen** (24 säsonger, flera klubbstorlekar, samma seeds).

**Mät:**

### Ekonomi
- Median-klubb finances säsong 1, 2, 3, 4
- Forsbacka (rep=85) finances per säsong
- Söderfors (rep=55) finances per säsong
- Målilla (rep=42) finances per säsong
- Korrelation rep ↔ kapital säsong 1
- Andel omgångar med negativt netto per säsong (target: 30-45%)
- Antal klubbar som går under 0 någon gång under 4 säsonger (target: några, inte noll, inte alla)

### Puls
- Puls-fördelning över alla omgångar (target: bucket 91-100 < 25%)
- Längsta streak ≥ 95 (target: < 15 omgångar)
- Snittpuls alla klubbar alla omgångar (target: ~55-65)
- Andel säsonger med puls < 30 någon gång (target: 10-25%)
- Korrelation puls ↔ kapital (target: < 0.5)

**Rapportera som** `docs/sprints/SPRINT_26_BALANCE_MEASUREMENT.md`.

---

## KÄNT RISK

**Söderfors (rep=55) kan hamna i problem.** Pre-balansering ligger de redan nära noll. Med arena-underhåll + halverad baseline kan de hamna i permanent minus.

**Om mätning visar det:**
- Söderfors slutar säsong 1 med -150k eller värre → återkom med finjustering
- Möjlig fix: arena-underhåll skalas mer progressivt, t.ex. `arenaCapacity * 6` istället för `* 8`
- Eller: höj kommun-bidragets base från 60000 till 75000 (ger mer golv för låg-rep-klubbar)

**Gör INTE finjusteringar innan mätning.** Implementera alla fem ändringar samtidigt, mät resultat, justera sedan baserat på data.

---

## VAD SOM INTE GÖRS I DENNA SPRINT

- Bandyskandaler (Sprint 25h, kommer senare — kräver denna balansering först)
- Lönenycklar / årliga löneökningar (senare sprint om det visar sig behövas)
- Sponsor-värde-decay över tid (senare sprint)
- Ekonomisk UX-förändring (siffror ska bara bli mindre skrämmande, inte nytt UI)

---

## COMMIT-FORMAT

```
feat: halvera weekly base, införa arena-underhåll, kvadratisk kommunbidrag

- weeklyBase: rep × 120 → 2000 + rep × 50 (halvering, progressiv)
- Ny FinanceReason: arena_maintenance (arenaCapacity × 8 per omg)
- csFactor i kommunbidrag: linjär 0.7-1.3 → kvadratisk 0.09-1.0
- Volontär-cap på puls-bonus: max +1.5/omg oavsett antal
- Community standing drift mot 60: 3% per omg

Rotorsak: r=0.97 mellan rep och kapital visade att ekonomin är
passiv funktion av klubbval. r=0.96 mellan puls och kapital
visade att puls var redundant med ekonomi. Fem motkrafter
införs för att skapa verklig agency.
```
