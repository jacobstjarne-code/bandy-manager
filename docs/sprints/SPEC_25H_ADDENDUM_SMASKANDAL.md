# Sprint 25h — Addendum: Småskandal-arketypen

**Status:** KLAR ATT IMPLEMENTERAS
**Estimat:** ~30 min Code + texten ingår
**Förutsätter:** Sprint 25h Pass 1 levererad (commit `9d82e28`)

---

## SYFTE

Lägga till en sjunde skandalarketyp `small_absurdity` — ren atmosfär utan
mekanisk effekt. Bandy-Sverige har småhändelser som rapporteras platt
i lokaltidningen och dyker upp i kafferummet utan att någon förklarar
varför, varifrån eller vad det betyder.

Referens: SVT 2026-02-18 (hund på upploppet i OS-sprintstafetten),
Aftonbladet (`"Vapen" på buss var bandyklubba`). Ton: rapporterande,
specifik, utan dramatik eller moralisk poäng.

**Designprincip:** En skandal som inte straffar någon. Bara världen som
rapporterar sig själv.

---

## TEKNISK ÄNDRING

### `scandalService.ts`

Utöka `ScandalType`:

```typescript
export type ScandalType =
  | 'sponsor_collapse'
  | 'club_to_club_loan'
  | 'treasurer_resigned'
  | 'phantom_salaries'
  | 'fundraiser_vanished'
  | 'coach_meltdown'
  | 'small_absurdity'  // NY
```

### Frekvens-fördelning

Justera så `small_absurdity` är 15% när en skandal triggas:

```typescript
const SCANDAL_TYPE_DISTRIBUTION: Record<ScandalType, number> = {
  sponsor_collapse:    0.22,  // var 0.25
  club_to_club_loan:   0.13,  // var 0.15
  treasurer_resigned:  0.18,  // var 0.20
  phantom_salaries:    0.13,  // var 0.15
  fundraiser_vanished: 0.13,  // var 0.15
  coach_meltdown:      0.06,  // var 0.10
  small_absurdity:     0.15,  // NY
}
```

### Mekanisk effekt

```typescript
case 'small_absurdity':
  return {
    // Inga effekter alls. Tom delta.
  }
```

`applyScandalEffect` returnerar `inboxItems: []` för småskandaler — INGEN
inbox till spelaren. Bara tidningsrubrik och kafferum-quote, som
hanteras av media-systemet respektive coffeeRoomService.

### Resolution

`small_absurdity` resolveras omedelbart vid trigger (`resolutionRound = triggerRound`).
Ingen pågående effekt att städa upp.

### Test-utökning

I `scandalService.test.ts`:
- `small_absurdity` triggas inom rätt frekvens-fördelning
- Inga budgetdelta, inga reputationsförändringar, inga poängavdrag
- Inga inbox-items genereras
- Resolveras direkt

---

## INTEGRATION I MEDIA-SYSTEMET

Tidningsrubriker och kafferum-quotes behöver dyka upp på rätt ställen:

**Tidningsrubrik:** Lägg till i media-pipeline (mediaProcessor) så att
en `small_absurdity`-skandal som triggas i omg N visas som rubrik i
omg N:s tidning.

**Kafferum:** Lägg till en ny pool i `coffeeRoomService.ts`:
`SCANDAL_ABSURDITY_EXCHANGES` som triggas en omgång efter att
en småskandal inträffat (kafferummet pratar om gårdagens nyhet).

---

## KURERAD TEXT — SEX VARIANTER

Varje variant: en tidningsrubrik + ett kafferum-utbyte.

### 1. Bandyklubban på bussen
**Rubrik:** `"Vapen" på buss var bandyklubba`
**Kafferum:**
> Kioskvakten: "Polisen drog vapen i Linköping igår."
> Vaktmästaren: "Mot vad?"
> Kioskvakten: "En bandyklubba."

### 2. Hund på planen
**Rubrik:** `Hund på planen avbröt hörna — "verkade som en hemmaspelare"`
**Kafferum:**
> Kioskvakten: "Den var ute i sju minuter."
> Vaktmästaren: "Vad gjorde den?"
> Kioskvakten: "Hörndomaren sa att den parerade ett skott."

### 3. Bananen och straffen
**Rubrik:** `Lesjöfors-spelare gick miste om straff — slet i sig en banan`
**Kafferum:**
> Vaktmästaren: "Han skulle slå straffen."
> Kioskvakten: "Och?"
> Vaktmästaren: "Han hade en banan i handen."

### 4. Pizzan till Söderhamn
**Rubrik:** `Söderfors fick ingen mat på borta-resan — beställd till fel adress`
**Kafferum:**
> Kioskvakten: "Pizzan kom till Söderhamn."
> Materialaren: "Och dom var i Söderfors?"
> Kioskvakten: "Det är 200 km."

### 5. Fel tröjor
**Rubrik:** `Forsbacka spelade hela första halvlek med fel tröjor`
**Kafferum:**
> Materialaren: "Dom märkte det i pausen."
> Vaktmästaren: "Hur då?"
> Materialaren: "Domaren räknade nummer."

### 6. Bortglömda matchbollar
**Rubrik:** `Materialaren glömde matchbollarna — fick låna av motståndaren`
**Kafferum:**
> Vaktmästaren: "Forsbacka åkte till Vänersborg utan bollar."
> Kioskvakten: "Och?"
> Vaktmästaren: "Vänersborg lånade ut tre."

---

## DATA-PLACERING

Ny fil: `src/domain/data/smallAbsurditiesData.ts`

```typescript
export interface SmallAbsurdity {
  id: string
  newspaperHeadline: string
  coffeeRoomExchange: { speaker: string; line: string }[]
}

export const SMALL_ABSURDITIES: SmallAbsurdity[] = [
  {
    id: 'bandy_klubba_buss',
    newspaperHeadline: '"Vapen" på buss var bandyklubba',
    coffeeRoomExchange: [
      { speaker: 'Kioskvakten', line: 'Polisen drog vapen i Linköping igår.' },
      { speaker: 'Vaktmästaren', line: 'Mot vad?' },
      { speaker: 'Kioskvakten', line: 'En bandyklubba.' },
    ],
  },
  // ... 5 till
]
```

Vid trigger: `scandalService` slumpar en av de 6 i listan. Varje
händelse markeras i `game.scandalHistory` så samma absurditet inte
återkommer samma säsong.

---

## VERIFIERING

```bash
npm run build && npm test  # alla gröna
npm run stress -- --seeds=3 --seasons=2  # 0 invariantbrott
```

**Visuellt:**
- Trigga `small_absurdity` manuellt (force i scandalService) → verifiera:
  - Tidningsrubrik visas korrekt i nästa media-uppdatering
  - Kafferum-utbyte visas i kafferummet kommande omgång
  - INGEN inbox till spelaren
  - INGEN budgetdelta
  - INGEN reputationsförändring

---

## COMMIT

```
feat: småskandal-arketyp (sprint 25h addendum)

Rot: bandy-Sverige har dumheter som rapporteras platt utan att straffa
någon — hund på upploppet, bandyklubba förväxlad med vapen. Lager 1
saknade dimensionen "atmosfär utan konsekvens".

7:e arketyp: small_absurdity. 15% av skandal-fördelningen. Endast
tidningsrubrik + kafferum-quote, ingen mekanisk effekt.

Stresstest: identiskt utfall (skandaler off via skipSideEffects).
```

---

## VAD SOM INTE INGÅR

- Mer än 6 absurditeter i pilot (kan utökas senare)
- Bilder eller video (vore kul men out-of-scope)
- Specifik koppling till spelarens egen klubb (lager 1 träffar bara
  AI-klubbar, men absurditeterna kan referera vilken klubb som helst i
  ligan)
