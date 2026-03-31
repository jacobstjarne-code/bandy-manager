# Ekonomirefaktor — spec och teststrategi

## Problemet i korthet

Det finns **tre** parallella beräkningar av samma inkomster:

| Plats | Syfte | kiosk basic | vip-tält | lottery basic |
|-------|-------|-------------|----------|---------------|
| `economyService.calcWeeklyEconomy` | Display-helper (sällan använd) | 3 500 | 2 500 | 1 250 |
| `EkonomiTab.tsx` inline | Display i appen | 5 000 | 10 000 | 1 750 |
| `roundProcessor` inline | Faktisk mutation | ~−250 netto | ~1 250–3 750 netto | variabelt |

Det spelaren ser i "Netto/omg" och de pengar som faktiskt dras/tillförs skiljer sig åt. Lägger du till en inkomstkälla på ett ställe missar du de andra två.

Utöver det: 12 ställen gör `finances + x` inline utan central funktion, inget log, och transferBudget uppdateras bara vid säsongsslut.

---

## Mål med refaktorn

1. **En enda beräkningsfunktion** — `calcRoundIncome()` i `economyService.ts` är kanonisk. Används både av roundProcessor (mutation) och EkonomiTab (display). Kan aldrig drifta ifrån varandra.
2. **En central mutationsfunktion** — `applyFinanceChange(clubs, clubId, amount)` i `economyService.ts`. Alla 12 ställen som idag skriver `{ ...c, finances: c.finances + x }` anropar den istället.
3. **Lätt transaktionslog** — `FinanceEntry[]` på `SaveGame`. Senaste 50 poster, max. Ger debuggbarhet och visas i EkonomiTab.

---

## Nya typer

### `FinanceEntry` (ny, i `economyService.ts`)

```typescript
export type FinanceReason =
  | 'wages'
  | 'match_revenue'
  | 'sponsorship'
  | 'community_round'
  | 'cup_prize'
  | 'league_prize'
  | 'patron'
  | 'kommunbidrag'
  | 'budget_priority'
  | 'transfer_in'
  | 'transfer_out'
  | 'scout'
  | 'academy'
  | 'event'

export interface FinanceEntry {
  round: number
  amount: number           // positivt = inkomst, negativt = kostnad
  reason: FinanceReason
  label: string            // läsbar text, t.ex. "Matchintäkt hemma vs Västerås"
}
```

### Tillägg i `SaveGame`

```typescript
financeLog?: FinanceEntry[]   // senaste 50, för managed club
```

---

## Ny funktion: `applyFinanceChange`

Pure function i `economyService.ts`:

```typescript
export function applyFinanceChange(
  clubs: Club[],
  clubId: string,
  amount: number,
): Club[] {
  return clubs.map(c =>
    c.id === clubId ? { ...c, finances: c.finances + amount } : c
  )
}
```

Tanken är enkel — inga sidoeffekter, testbar isolerat. Loggen byggs separat av anroparen och samlas ihop i roundProcessor/seasonEndProcessor innan den skrivs till `SaveGame`.

---

## Ny funktion: `calcRoundIncome` (ersätter tre parallella beräkningar)

```typescript
export interface RoundIncomeBreakdown {
  weeklyBase: number          // reputation × 250
  sponsorIncome: number       // aktiva sponsorers weeklyIncome
  matchRevenue: number        // hemmamatch-intäkt (0 om borta/ingen match)
  communityMatchIncome: number // kiosk/vipTent/funktionärer per hemmamatch (netto)
  lotteryIncome: number       // lotteri/bandyschool per omgång (netto)
  weeklyWages: number         // månadslön / 4
  netPerRound: number         // summa inkomster − löner
}

export function calcRoundIncome(params: {
  club: Club
  players: Player[]
  sponsors: Sponsor[]
  communityActivities: CommunityActivities | undefined
  fanMood: number
  isHomeMatch: boolean
  matchIsKnockout: boolean
  matchIsCup: boolean
  matchHasRivalry: boolean
  standing: StandingRow | null
  rand: () => number
}): RoundIncomeBreakdown
```

Denna funktion innehåller all logik som idag är spridd i `calculateMatchRevenue`, `calculateLotteryIncome`, och `calcWeeklyEconomy`. Siffror beslutas en gång, används överallt.

**EkonomiTab** anropar `calcRoundIncome` med `rand: Math.random` och `isHomeMatch: true` för att visa uppskattad inkomst vid hemmamatch — samma formel, inga divergenser.

---

## Implementeringsplan

### DEL A — Typer + central funktion (inga beteendeförändringar)

1. Lägg till `FinanceReason`, `FinanceEntry`, `applyFinanceChange` i `economyService.ts`
2. Lägg till `financeLog?: FinanceEntry[]` i `SaveGame`
3. Lägg till `financeLog: []` i `createNewGame.ts`

**Verifiera:** bygget ska gå igenom utan fel. Inga beteenden har ändrats ännu.

---

### DEL B — Kanonisk inkomstberäkning

1. Skriv `calcRoundIncome()` i `economyService.ts` — port av all logik från `calculateMatchRevenue` + `calculateLotteryIncome` + `calcWeeklyEconomy`
2. Ta bort `calculateMatchRevenue` och `calculateLotteryIncome` som lokala funktioner i roundProcessor — ersätt deras anrop med `calcRoundIncome`
3. Uppdatera `roundProcessor` att bygga `FinanceEntry[]` för omgången och appenda till `game.financeLog` (cap 50)
4. Ta bort `calcWeeklyEconomy` i `economyService.ts` (ersatt av `calcRoundIncome`)

**Verifiera:**
- Bygget går igenom
- Befintliga ekonomitester passerar
- Kör `advanceToNextEvent` en omgång och kontrollera att `financeLog` har poster

---

### DEL C — Ersätt alla inline-mutationer

Ersätt varje `{ ...c, finances: c.finances + x }` med `applyFinanceChange(clubs, clubId, x)`:

| Fil | Orsak | `FinanceReason` |
|-----|-------|-----------------|
| `roundProcessor.ts:1141` | lön + inkomster | flera poster |
| `roundProcessor.ts:1170–1171` | cuppengar | `'cup_prize'` |
| `seasonEndProcessor.ts:194` | ligapris | `'league_prize'` |
| `seasonEndProcessor.ts:205` | patron | `'patron'` |
| `seasonEndProcessor.ts:229` | kommunbidrag | `'kommunbidrag'` |
| `seasonEndProcessor.ts:248+` | budgetpriority | `'budget_priority'` |
| `eventResolver.ts:219,281,303,371` | händelser | `'event'` |
| `transferService.ts:182,189` | transfer in/ut | `'transfer_in'/'transfer_out'` |
| `aiTransferService.ts:98` | AI-transfer | `'transfer_in'` |
| `gameStore.ts:340` | scout | `'scout'` |
| `transferActions.ts:70` | seek sponsor | `'scout'` |
| `academyActions.ts:73,114` | akademi | `'academy'` |

**Verifiera:** alla tester passerar. Grep på `finances: c.finances +` och `finances: c.finances -` ska ge 0 träffar (utom i applyFinanceChange själv).

---

### DEL D — Uppdatera EkonomiTab

1. Ta bort alla inline-beräkningar (kioskEst, lotteryEst etc.) i `EkonomiTab.tsx`
2. Anropa `calcRoundIncome` med `isHomeMatch: true` för uppskattning
3. Lägg till en "Senaste transaktioner"-sektion som läser `game.financeLog` (sista 10 poster)

**Verifiera:** siffrorna i "Netto/omg" matchar vad som faktiskt händer per omgång.

---

## Teststrategi

### Nivå 1 — Enhetstester för rena funktioner (snabba, isolerade)

Ny testfil: `src/domain/services/__tests__/economyService.test.ts`

#### `applyFinanceChange`
```
✓ lägger till positivt belopp på rätt klubb
✓ drar av negativt belopp (negativ finances möjlig)
✓ påverkar inte andra klubbar
✓ returnerar ny array, muterar inte originalet
```

#### `calcRoundIncome` — inkomstkomponenter isolerat
```
✓ weeklyBase = reputation × 250
✓ sponsorIncome = sum av aktiva sponsorers weeklyIncome (contractRounds > 0)
✓ sponsorIncome = 0 om inga aktiva sponsorer
✓ weeklyWages = Math.round(totalSalary / 4)
✓ netPerRound = weeklyIncome − weeklyWages

// Matchintäkter (hemmamatch)
✓ matchRevenue > 0 om isHomeMatch = true
✓ matchRevenue = 0 om isHomeMatch = false
✓ cup-match ger högre matchRevenue än ligamatch (eventBonus)
✓ derbymatch ger högre matchRevenue (derbyBonus)

// Kiosk/community per hemmamatch
✓ kiosk none → communityMatchIncome = 0
✓ kiosk basic → nettointäkt > 0
✓ kiosk upgraded → nettointäkt > kiosk basic
✓ vipTent aktiv → höjer communityMatchIncome

// Lotteri per omgång (oavsett hemma/borta)
✓ lottery none → lotteryIncome = 0
✓ lottery basic → lotteryIncome > 0
✓ lottery intensive → lotteryIncome > lottery basic
✓ bandySchool aktiv → höjer lotteryIncome
✓ socialMedia aktiv → drar kostnad (negativ del)

// Oväntade edge cases
✓ communityActivities = undefined → inga community-intäkter
✓ tom spelartrupp → weeklyWages = 0
✓ inga sponsorer → sponsorIncome = 0
```

---

### Nivå 2 — Integrationstester per dataväg

Ny testfil: `src/application/useCases/__tests__/economyIntegration.test.ts`

#### Omgångsekonomi
```
✓ financeLog innehåller poster efter en omgång
✓ financeLog.length ökar per omgång (upp till cap 50)
✓ financeLog trimmas till 50 poster efter 60 omgångar (simulera)
✓ finances efter omgång = finances innan + netDelta (summa av den omgångens log-poster)
✓ AI-klubbs finances ändras varje omgång (wages subtraheras)
✓ AI-klubb har ALDRIG sponsorIncome eller lotteryIncome i sin förändring
```

#### Cuppris
```
✓ vinnande klubb får rätt pris för rätt runda (R1: 10k, R2: 30k, R3: 100k)
✓ förlorande klubb i final får runner-up 50k
✓ förlorande klubb i semifinal får 0
✓ club utan match den omgången påverkas inte av cuppriser
```

#### Transferer
```
✓ köpande klubb: finances − offerAmount, transferBudget − offerAmount
✓ säljande klubb: finances + offerAmount
✓ tredje klubb orörd
✓ AI-transfer (aiTransferService): säljande klubb får fee
```

#### Direkta spelaråtgärder
```
✓ buyScoutRounds: finances − 15000, scoutBudget + 5
✓ buyScoutRounds avvisas om finances < 15000
✓ academyActions upgrade: finances − cost
✓ academyActions avvisas om finances < cost
✓ seekSponsor (transferActions): finances − 2500 oavsett utfall
```

#### Säsongsslut
```
✓ alla 12 klubbar får ligapris baserat på tabellposition
✓ plats 1 får mer än plats 12
✓ patron-bidrag läggs till managed club
✓ kommunbidrag läggs till managed club
✓ patron-bidrag läggs INTE till om patron.isActive = false
✓ kommunbidrag läggs INTE till om localPolitician saknas
✓ budgetPriority 'squad' justerar finanserna rätt
✓ transferBudget räknas om vid säsongsslut (finances × 0.15)
```

#### Event-effekter
```
✓ 'income' event-effekt ökar finances med effect.amount
✓ 'kommunGamble' event-effekt ändrar finances
✓ 'communityActivity' event med amount: ändrar finances
✓ event-effekt på managed club påverkar inte AI-klubbar
```

---

### Nivå 3 — Display/mutation-paritet

Ny testfil: `src/domain/services/__tests__/economyParity.test.ts`

```
✓ calcRoundIncome med identiska parametrar ger identiskt resultat oavsett anropare
✓ EkonomiTab-displayvärdet (isHomeMatch: true) ≥ faktisk mutation vid hemmamatch
  (display visar uppskattning, faktisk mutation inkluderar slump — men bör vara i samma storleksordning)
✓ calcRoundIncome.weeklyWages = roundProcessor wages-beräkning (regression)
✓ calcRoundIncome.sponsorIncome = roundProcessor sponsorIncome (regression)
```

---

### Nivå 4 — Regressionstester (befintliga ekonomitester måste fortfarande passera)

Befintlig fil: `src/application/useCases/__tests__/roundProcessor.test.ts`

```
✓ "finances ändras efter en omgång" (Group 3)
✓ "finances inom rimliga gränser efter 5 omgångar" (Group 3)
✓ Alla övriga befintliga tester oförändrade
```

---

## Manuell verifieringschecklista (kör i appen)

```
[ ] Öppna EkonomiTab — siffrorna matchar vad som faktiskt händer per omgång
[ ] Spela en hemmamatch — financeLog innehåller match_revenue, wages, sponsorship
[ ] Spela en bortamatch — financeLog innehåller INTE match_revenue-post
[ ] Vinn en cupmatch — financeLog innehåller cup_prize-post
[ ] Köp en scout-runda — financeLog innehåller scout-post
[ ] Gå igenom säsongsslut — financeLog innehåller league_prize-post
[ ] Fixa en händelse med ekonomisk effekt — financeLog innehåller event-post
[ ] Kör 5 omgångar — loggen är konsekvent och ackumuleras
[ ] Läs en gammal sparfil (utan financeLog) — inga krascher, financeLog börjar tom
```

---

## Vad som INTE ska göras

- Lägg inte till `finances`-mutationer utan att anropa `applyFinanceChange`
- Lägg inte till display-beräkningar i `EkonomiTab` utan att använda `calcRoundIncome`
- Ersätt inte `Club.finances: number` med en transaktionslista — det är overkill
- Lägg inte en `FinanceEntry` på `Club`-entiteten — loggen tillhör sparsessionen, inte klubbentiteten
