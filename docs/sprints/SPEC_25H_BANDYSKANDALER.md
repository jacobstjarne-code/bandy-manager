# Sprint 25h — Bandyskandaler (SKARP SPEC)

**Status:** KLAR ATT IMPLEMENTERAS
**Estimat:** 9h kod (Code) + 2-3h kurerad text (Opus, parallellt)
**Förutsättningar:** Sprint 26b ekonomi, Sprint 25g matchens karaktärer, TS-1 roundProcessor refactor — alla LEVERERADE 2026-04-24

---

## DESIGNPRINCIP

Skandaler primärt i **andras klubbar** — atmosfär utan frustration.
Skandaler i spelarens egen klubb **bara som konsekvens av egna val** —
engagement, inte slumpvåld.

Spelet ska ge känslan av att leva i bandy-Sverige där VSK 2024,
Hammarby/Choki AB och Edsbyn/Järvefelt finns i bakgrunden — utan att
straffa spelaren för saker hen inte beslutat om.

---

## TRE LAGER

```
Lager 1: Världshändelser (andras klubbar)        — atmosfär
Lager 2: Egna beslut med risk                     — engagement
Lager 3: Licensnämnden (långsiktig broms)         — konsekvens
```

Implementeras i ordningen 1 → 2 → 3. Varje lager är leveransbart för
sig — kan playtestas separat.

---

## LAGER 1 — Världshändelser (~4h kod + ~1h text)

### Frekvens

2-4 större skandaler per säsong, fördelade på AI-klubbar. Aldrig på
spelarens egen klubb (lager 2 hanterar det).

**Trigger-fönster:**
- Omg 6-8: 25% chans en skandal triggas
- Omg 12-14: 25% chans
- Omg 18-20: 25% chans
- Omg 24-26 (deadline-period): 25% chans

Per fönster väljs en klubb vägt på `reputation` (låg-medel mest sannolikt;
toppklubbar och bottenklubbar mer sällan). Klubb kan inte träffas mer än
en gång per säsong.

### Sex skandalarketyper

| Arketyp | Frekvens | Mekanisk effekt | Inbox-trigger |
|---------|----------|-----------------|---------------|
| Sponsor-kollaps | 25% | Klubbens budget −400k. Kan trigga panic-sale på spelare. | Inbox + tidningsrubrik |
| Klubb-till-klubb-lån | 15% | Två klubbar i samma kommun delar pengar — den ena får poängavdrag −3 nästa säsong | Inbox + kafferum |
| Kassör avgick | 20% | Klubbens transferaktivitet pausas i 3 omgångar | Inbox |
| Fantomlöner | 15% | Skattegranskning → poängavdrag −2 nuvarande säsong | Inbox + tidningsrubrik + kafferum |
| Insamling försvann | 15% | CS för den klubben −15 (orten arg på styrelsen). Återhämtas över 5 omgångar. | Inbox + kafferum |
| Tränaren-haveri | 10% | Klubben byter tränare mid-säsong. Form −15% i 4 omgångar. | Inbox + tidningsrubrik |

**Notering:** Procenten gäller fördelning OM en skandal triggas, inte
absolut sannolikhet.

### Service-design

Ny fil: `src/domain/services/scandalService.ts`

```typescript
export type ScandalType =
  | 'sponsor_collapse'
  | 'club_to_club_loan'
  | 'treasurer_resigned'
  | 'phantom_salaries'
  | 'fundraiser_vanished'
  | 'coach_meltdown'

export interface Scandal {
  id: string
  season: number
  triggerRound: number
  type: ScandalType
  affectedClubId: string
  secondaryClubId?: string  // för club_to_club_loan
  resolutionRound: number
  isResolved: boolean
}

export interface ScandalEffect {
  budgetDelta?: number
  reputationDelta?: number
  csDelta?: number
  pointDeduction?: { season: number; points: number }
  formPenalty?: { rounds: number; modifier: number }
  transferFreeze?: { rounds: number }
}

export function checkScandalTrigger(
  game: SaveGame,
  rand: () => number,
): Scandal | null

export function applyScandalEffect(
  game: SaveGame,
  scandal: Scandal,
): { updatedGame: SaveGame; inboxItems: InboxItem[] }

export function resolveExpiredScandals(
  game: SaveGame,
  currentRound: number,
): SaveGame
```

### Integration i pipelinen

Efter TS-1: skandal-trigger placeras i `eventProcessor` som tar emot
`RoundContext` från `preRoundContextProcessor`. Concrete:

- `eventProcessor.ts` får en `processScandals(game, ctx, rand)`-funktion
- Anropas efter befintlig event-generering
- Returnerar `Scandal[]`, `inboxItems[]`, `gameEventDeltas`
- `roundProcessor` mergrar resultatet i `updatedGame`

`resolveExpiredScandals` körs i samma processor i början, innan nya
triggers kollas. Säkerställer att avslutade skandalers state städas upp.

### SaveGame-utökning

```typescript
activeScandals: Scandal[]
scandalHistory: Scandal[]  // resolved scandals för tidnings-arkivet
```

### Tester

- `scandalService.test.ts`:
  - Trigger respekterar fönster (inte i omg 1-5)
  - En klubb träffas inte två gånger samma säsong
  - Fördelning över 100 säsonger ≈ 2-4 skandaler per säsong
  - Varje arketyp har korrekt mekanisk effekt
  - Resolution sker vid `resolutionRound`
  - Spelarens egen klubb träffas ALDRIG av lager 1

### Kurerad text (Opus levererar)

Per arketyp: 3 inbox-titlar + 3 inbox-bodies (väljs random vid trigger).
Plus tidningsrubriker (där relevant) och kafferum-quotes (där relevant).

Totalt för lager 1: ~6 arketyper × (3 titlar + 3 bodies + 2 rubriker + 2
kafferum) ≈ 60 strängar.

---

## LAGER 2 — Egna beslut med risk (~3h kod + ~1h text)

### Tre beslutspunkter

**2A. Värvning över budget**

När spelaren accepterar ett bud som överskrider `wageBudget` med >20%:
- Inbox-varning från ordföranden FÖRE bekräftelse: "Vi har inte täckning för det här. Tänk om."
- Om spelaren ändå går vidare: warning-state aktiveras
- Konsekvens efter 5 omgångar: ekonomisk varning från Licensnämnden (lager 3-trigger)
- Konsekvens efter 10 omgångar med fortsatt överskridande: poängavdrag −2 NÄSTA säsong

**2B. Marknadsavtal med skumma partners**

Slumpmässigt erbjudande i inbox (1-2 ggr per säsong):
- "Borgvik Bygg AB erbjuder 500k/säsong i marknadsavtal. Notera: företaget granskas av Skatteverket."
- Spelaren väljer: Acceptera | Avböj
- Om accepterad: 500k/säsong i 3 säsonger
- Risk: 25% chans efter 6-12 omgångar att Skatteverket-granskningen blir publik
  → klubben tvingas avsluta avtalet, betalar tillbaka 1 säsong, CS −10, reputation −5

**2C. Patron-krav som ignoreras**

Om patron-relationen sjunker under 30 (tre eller fler ignorerade krav):
- Inbox: "Patron drar sig ur. Han hade redan investerat. Ni ser inte de pengarna igen."
- Mekaniskt: tidigare patron-investeringar i facility/sponsor återbetalas
- Klubbens budget −500k till −1M (beroende på historisk investering)
- Patron lämnar klubben permanent (kan inte ersättas på 2+ säsonger)

### Service-design

Utökning av befintliga services hellre än ny fil:

- `transferService.ts`: lägg till `wageBudgetWarningState` på SaveGame, kontroll vid kontraktssigning
- `sponsorService.ts`: lägg till `riskySponsorOffer`-event-typ, generation och resolution
- `patronService.ts` (om finns) eller `eventProcessor.ts`: patron-uträde-trigger

### SaveGame-utökning

```typescript
wageBudgetOverrunRounds: number  // räknas upp/återställs
wageBudgetWarningSent: boolean
riskySponsorContract: { sponsorId: string; riskMaturityRound: number } | null
patronWithdrawnSeason: number | null  // markerar permanent uträde
```

### Tester

- Värvning över budget triggar varning först, konsekvens efter 5/10 omg
- Skum sponsor-erbjudande dyker upp 1-2 ggr/säsong
- Risk-mognad sker i 25% av fallen efter 6-12 omg
- Patron lämnar vid relation < 30 efter 3+ ignorerade krav

### Kurerad text (Opus levererar)

- 2A: 3 ordförande-varningar, 3 licensnämnd-varningar, 3 poängavdrag-meddelanden
- 2B: 4 sponsor-erbjudanden (varierande risknivå), 3 mognad-konsekvenser
- 2C: 3 patron-uträdes-meddelanden

Totalt: ~30 strängar.

---

## LAGER 3 — Licensnämnden (~2h kod + ~30min text)

### Trigger

Kontrolleras vid **säsongsslut** (i `seasonEndProcessor`).

```typescript
function checkLicenseStatus(game: SaveGame): LicenseAction | null {
  const consecutiveLossSeasons = countConsecutiveLossSeasons(game)
  const currentLicenseStatus = game.licenseStatus ?? 'clear'

  if (consecutiveLossSeasons === 0) {
    if (currentLicenseStatus !== 'clear') return { type: 'cleared' }
    return null
  }

  if (consecutiveLossSeasons === 2 && currentLicenseStatus === 'clear') {
    return { type: 'first_warning' }
  }

  if (consecutiveLossSeasons === 3 && currentLicenseStatus === 'first_warning') {
    return { type: 'point_deduction', points: 3 }
  }

  if (consecutiveLossSeasons === 4 && currentLicenseStatus === 'point_deduction') {
    return { type: 'license_denied' }
  }

  return null
}
```

### Statusövergångar

```
clear → first_warning → point_deduction → license_denied
        ↑ 2 förlustsäsonger i rad
                       ↑ 3 förlustsäsonger
                                          ↑ 4 förlustsäsonger
                                                            ↓
                                                        managerFired
```

Vilken som helst vinst-säsong (`finances.netResult > 0`) återställer
allt till `clear`.

### Konsekvenser

- **first_warning:** Inbox från Licensnämnden + krav på handlingsplan. Ingen direkt mekanisk effekt.
- **point_deduction:** Inbox + −3 poäng från NÄSTA säsongs ligatabell (appliceras vid `seasonStart`).
- **license_denied:** Inbox + manager fired + game-over screen.

### SaveGame-utökning

```typescript
licenseStatus: 'clear' | 'first_warning' | 'point_deduction' | 'license_denied'
licenseWarningSeason: number | null
pendingPointDeduction: number  // appliceras vid seasonStart
```

### Tester

- 1 förlustsäsong: ingen åtgärd
- 2 förlustsäsoner: first_warning
- 3 förlustsäsoner: point_deduction
- 4 förlustsäsoner: license_denied → managerFired
- 1 vinstsäsong efter 2 förlust: återställs till clear
- 1 vinstsäsong efter point_deduction: återställs men `pendingPointDeduction` appliceras ändå (säsongens straff står kvar)

### Kurerad text (Opus levererar)

- `first_warning`: 3 varianter
- `point_deduction`: 3 varianter
- `license_denied`: 3 varianter (game-over kan ha en specifik)
- `cleared`: 2 varianter ("Hemläxan godkänd")

Totalt: ~12 strängar.

---

## TEST-STRATEGI

### Per lager

1. **Lager 1:** `scandalService.test.ts` — 6-8 tester (en per arketyp + frekvens)
2. **Lager 2:** Utökade tester i `transferService.test.ts`, ny `riskySponsor.test.ts`
3. **Lager 3:** `licenseService.test.ts` (eller i `seasonEndProcessor.test.ts`)

### Stresstest-skydd

Skandaler ska INTE påverka motor-kalibreringen. Utnyttja
`skipSideEffects`-mönstret från TS-1 pass 3:
`processScandals` får option `{ skipSideEffects?: boolean }` som
returnerar tomt resultat när true. Då passerar stresstest hela TS-1-
mönstret konsekvent.

---

## IMPLEMENTATIONSORDNING

**Pass 1 (Lager 1, ~4h):** Världshändelser
- `scandalService.ts` + tester
- Integration i `eventProcessor`
- Opus levererar ~60 strängar parallellt

**Pass 2 (Lager 2, ~3h):** Egna beslut
- Wage budget warning-state
- Risky sponsor offer
- Patron withdrawal
- Opus levererar ~30 strängar parallellt

**Pass 3 (Lager 3, ~2h):** Licensnämnden
- Status-machine
- Integration i seasonEndProcessor
- Opus levererar ~12 strängar parallellt

Mellan varje pass: stresstest verifierar identiskt utfall (skandaler off).

---

## SJÄLVAUDIT

`docs/sprints/SPRINT_25H_PASS{N}_AUDIT.md` efter varje pass enligt CLAUDE.md.
“Verifierat i UI” gäller:
- Lager 1: skandalen syns i inbox? Tidningsrubrik? Klubbens kassa påverkad?
- Lager 2: värvning över budget triggar varning? Skum sponsor-erbjudande visas? Patron lämnar vid relation < 30?
- Lager 3: efter 2 simulerade förlustsäsonger — first_warning i inbox?

---

## VAD SOM INTE INGÅR

- “Krigh-event” som särskild dramaturgi (sparat)
- Hjärnskakningsprotokoll med val (sparat)
- Skadehistorik som transferpåverkare (sparat)
- Mer än 6 skandalarketyper (V2)
- Specifik narrativ koppling mellan lager 1 och 2 (V2)
