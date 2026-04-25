# Sprint 25g — Matchens karaktärer (domare + matchskador)

**Status:** SPEC KLAR — REDO ATT IMPLEMENTERAS
**Prioritet:** MEDEL (playtest-upplevelse, inte motor-kalibrering)
**Estimat:** 8-10h kod + 2-3h kurerad text

---

## SYFTE

Två paketerade funktioner som båda lyfter matchupplevelsen utan att röra motorkärnan:

1. **Domarsystem** — 6-8 namngivna huvuddomare med personlighet och kvirk. Bandygrytans matchvy ger domare samma visuella plats som tränare — en stor del av bandyns kultur som nu saknas i spelet.
2. **Matchskador** — 6 skadetyp-arketyper med olika frekvens och följder. Idag har motorn `MatchEventType.Injury` i enum men använder det inte. Matchskador är en del av bandyns karaktär.

**Gemensam princip:** Båda berikar post-match-narrativet och matchkommentarer utan att röra själva spelresultat-motorn. Ingen risk för regressioner i `goalsPerMatch`, `htLeadWinPct`, etc.

---

## DEL 1 — DOMARSYSTEM

### Datamodell

**Ny fil:** `src/domain/entities/Referee.ts`

```typescript
export type RefereeStyle = 'strict' | 'lenient' | 'inconsistent'
export type RefereePersonality = 'neutral' | 'derby-specialist' | 'rookie' | 'veteran' | 'controversial'

export interface Referee {
  id: string
  firstName: string
  lastName: string
  homeTown: string           // ex "Gävle", "Kalix"
  yearsOfExperience: number  // 2-30
  style: RefereeStyle        // hur strikt domaren dömer
  personality: RefereePersonality
  quirk?: string             // valfri personlig detalj, visas i bio
  managedMatches: number     // hur många av spelarens matcher har dömts
}

export interface RefereeRelation {
  refereeId: string
  lastMatchSeason: number
  lastMatchRound: number
  totalMatches: number
  totalCardsGiven: number
  totalPenaltiesGiven: number
  clubReaction: -2 | -1 | 0 | 1 | 2  // relationsstatus med spelarens klubb
}
```

**I SaveGame:**

```typescript
referees: Referee[]
refereeRelations: RefereeRelation[]  // bara för spelarens klubb
```

### Referenslista (kurerad av Opus)

Opus skriver 8 domare med namn, hemort, år i bandyallsvenskan, stil och kvirk. Exempel på ton:

```typescript
export const REFEREES: Omit<Referee, 'id' | 'managedMatches'>[] = [
  {
    firstName: 'Ove', lastName: 'Hansson',
    homeTown: 'Gävle', yearsOfExperience: 22,
    style: 'strict', personality: 'veteran',
    quirk: 'Blåser i den gamla mässingspipan han fick av sin far.',
  },
  {
    firstName: 'Tommy', lastName: 'Bäckström',
    homeTown: 'Arvika', yearsOfExperience: 5,
    style: 'lenient', personality: 'rookie',
    quirk: 'Läser av matchprogrammet mellan perioderna.',
  },
  // ... 6 till
]
```

Kureras av Opus separat innan Code implementerar. Mål: skulle kunna vara en riktig bandydomare från verklighetens Sverige. Ingen ska vara rolig på tvång.

### Integration i match

**Vid matchgenerering (`roundProcessor.ts`):**
- Välj domare via vägd selektion: `refereeRelations.lastMatchRound < currentRound - 3` har högre vikt (undvik att samma domare dyker upp flera matcher i rad)
- Lagra `fixture.refereeId`
- `refStyle` i `matchCore.ts` läses från domaren istället för att slumpas — domaren *är* `refStyle`

**Fixture-typ utökas:**
```typescript
export interface Fixture {
  // ...befintliga fält
  refereeId?: string
}
```

**Matchkommentarer:**
- Öppningskommentar: *"Idag dömer Ove Hansson (Gävle, 22 år i bandyallsvenskan)."*
- Efter första utvisningen: *"Hansson är inte nådig idag. Man märker hans gamla skola."* (om strict)
- Efter tredje utvisningen: *"Bäckström tappar greppet. Tre utvisningar på tio minuter — det här eskalerar."* (om inconsistent)

Commentary-data kureras av Opus.

### Post-match: Domarmöte (ny scen, ~20-30% av matcher)

Trigger-kriterier (alla måste uppfyllas):
- Minst 3 utvisningar eller 1 straffmål i matchen
- Domarens stil är `strict` eller `inconsistent`
- Spelarens klubb spelade
- Random 40% chans när kriterierna stämmer → ger ~20-30% av alla spelade matcher

Visas som kort i GranskaScreen (efter `Motståndet säger`), inte overlay:

```
🎙 DOMARMÖTE
Ove Hansson (Gävle, 22 år)
"Tre utvisningar på er sida idag. Jag märker när 
pressen går för högt — ni hade en försvarslinje 
som inte hann med."
```

Tre val (enkla, påverkar relation ±1):
- *"Tack för matchen. Jag respekterar dina beslut."* → +1 relation
- *"Jag såg det annorlunda. Men det är vad det är."* → 0
- *"Det här var inte okej. Jag skickar in en anmärkning."* → −1 relation, chans för inbox-retur från förbundet

### Service-filer

**Ny:** `src/domain/services/refereeService.ts`
- `generateReferees(seed: number): Referee[]` — 8 domare från kuraterad lista
- `pickRefereeForMatch(refs: Referee[], relations: RefereeRelation[], currentRound: number, rand): Referee`
- `updateRefereeRelation(rel: RefereeRelation, match: Fixture, choice: ChoiceId): RefereeRelation`

### Textomfattning Opus skriver

- 8 domar-profiler (~80 ord vardera)
- 15-20 öppningskommentarer (variant per stil × personality)
- 10-15 post-event commentarer (efter utvisningar/straff/hörnmål)
- 12-15 domarmötes-scener (3 val × 4-5 variationer av utfall)

---

## DEL 2 — MATCHSKADOR

### Datamodell

**Ny typ:** `MatchInjuryType`

```typescript
export type MatchInjuryType =
  | 'skenan'              // hälsena/achilles, ~1/500, 30-45 omg
  | 'fall_pa_is'          // handled/axel, ~1/40, 2-4 omg
  | 'krock_malstolpe'     // krock med mål/iskant, ~1/80, 1-3 omg
  | 'boll_i_ansiktet'     // bruten näsa/tand, ~1/50, 0-1 omg (endast ≥18 år)
  | 'muskel_overbelastning' // ljumske/lår/vad, ~1/25, 2-5 omg
  | 'hjarnskakning'       // ~1/100, 1-2 omg

export interface MatchInjuryEvent {
  playerId: string
  type: MatchInjuryType
  minute: number
  weeksOut: number
  requiresSubstitution: boolean  // true = byte måste ske
  description: string
}
```

**Player-entiteten är redan rustad:** `isInjured` + `injuryDaysRemaining` finns. Inga nya fält på Player krävs — bara att `MatchEventType.Injury` nu faktiskt emitteras.

### Frekvenser och triggers

```typescript
const INJURY_BASE_RATES: Record<MatchInjuryType, number> = {
  skenan:                1 / 500,
  fall_pa_is:            1 / 40,
  krock_malstolpe:       1 / 80,
  boll_i_ansiktet:       1 / 50,
  muskel_overbelastning: 1 / 25,
  hjarnskakning:         1 / 100,
}

const INJURY_WEEKS: Record<MatchInjuryType, [number, number]> = {
  skenan:                [30, 45],
  fall_pa_is:            [2, 4],
  krock_malstolpe:       [1, 3],
  boll_i_ansiktet:       [0, 1],
  muskel_overbelastning: [2, 5],
  hjarnskakning:         [1, 2],
}
```

**Multiplikatorer:**
- Dålig is (thaw/heavySnow): × 1.5
- Derby-match: × 1.3
- Låg morale (< 40): × 1.2
- Aggressiv taktik (high press + high tempo): × 1.25 (ny `injuryRiskModifier` i `tacticModifiers.ts`)
- Spelarens `injuryProneness` (finns redan): × (0.5 + injuryProneness/100)

**Junior-skyddsregel:**
```typescript
if (player.age < 18) {
  // Bollen-i-ansiktet exkluderas (galler)
  // Övriga frekvenser oförändrade
}
```

### Matchbyte vid allvarlig skada

Allvarlig skada = `weeksOut > 1`. Matchen pausas, `SubstitutionModal` (zIndex 600) öppnas med:

```
⚠️ SKADA
Stefan Lindberg (MV) — fall på is, 3 veckor
Välj ersättare från bänken.
```

Byteslista = bänkspelare som inte själva är skadade eller utvisade. Om ingen lämplig finns: AI byter ut med godtycklig position, spelaren får notis *"Bara Östlund kvar — fel position men vi måste."*

**Lätta skador (blåmärken, weeksOut = 0):** Ingen modal. Bara commentary: *"Lindberg tar emot Erikssons skott med låret. Haltar till hörnet men stannar kvar."* Ingen mekanisk effekt.

### Integration

**`matchCore.ts`:** I foul-sequens-resolutionen (där utvisning idag triggas) — lägg till 8% chans att en kollision resulterar i skada istället för utvisning. I attack-sequensen — 0.3% chans per skott på mål att *målvakten* får `boll_i_ansiktet` (omvänt perspektiv — skytten kan också få skada vid blockerade skott).

**Hjärnskakning:** Kräver speciell commentary och inbox-event: *"Lindberg blev stående en stund efter krocken. Lämnade isen på egen kraft men kommer genomgå hjärnskakningsprotokoll."*

**Allvarlig skada (`skenan`):** Inbox-händelse dag efter matchen från bandydoktorn: *"Hälsenan är en grym skada. 9 månader. Men han är ung, han kommer tillbaka."* (kureras av Opus)

### Kafferum & presskonferens-integration

- Kafferum-trigger efter allvarlig skada: *"Vaktmästaren: 'Såg ni Lindberg igår? Hemskt att se.'"*
- Presskonferens-fråga nästa omgång (om spelaren är nyckelspelare): *"Hur påverkar förlusten av Lindberg ert slutspel?"*

### Service-filer

**Ny:** `src/domain/services/matchInjuryService.ts`
- `checkForMatchInjury(context, rand): MatchInjuryEvent | null`
- `applyMatchInjury(player, event): Player`
- `generateInjuryInboxItem(player, event, club): InboxItem`

---

## TEXTOMFATTNING FÖR OPUS

Totalt ~60-80 svenska strängar att kurera:

**Domare:** 8 profiler, 15-20 öppningar, 10-15 post-event, 12-15 domarmöte-scener
**Skador:** 15-20 commentary-strängar (per skadetyp), 10 inbox-event från bandydoktorn, 5-8 kafferum-reaktioner

Opus skriver dem i separat fil efter att Code har stommen klar. Följer kuraterings-mönster från styrelsecitat (48 st) och FORMATION_META.

**Ton:** Understatement. Konkret vardag. Inga LLM-meningspar där rad två förklarar rad ett. Exempel — inte så här:

> "Ove Hansson dömer med sträng hand. Han är en erfaren domare från Gävle som har dömt i över tjugo år."

Utan så här:

> "Gammal skola. Sparsam med mejlen. Blåser när det är fel."

---

## VERIFIERING

Det finns inte mycket att mäta i stresstest — detta är narrativa features, inte motor. Istället manuell playtest:

1. Spela 5 matcher, observera domar-närvaron i öppningskommentarer
2. Hamna i en derby — observera domarens roll
3. Provocera domarmöte genom dåligt spel → kontrollera att det triggar vid ~20-30% av matcher när kriterierna uppfylls
4. Observera minst en allvarlig matchskada inom 10 matcher — verifiera att bytesmodal öppnas, spelaren försvinner från truppen, bandydoktorn skickar inbox-event
5. Observera minst en lätt skada (blåmärke) — verifiera att ingen modal öppnas, bara commentary

Sprint-audit enligt `CLAUDE.md` obligatorisk.

---

## VAD SOM INTE GÖRS I DENNA SPRINT

- Assisterande domare (duor, "Larshans-bröderna") — V2, framtida sprint
- Domarnas omdömen av spelare — V2
- Hjärnskakningsprotokoll med consult-val — V2
- Skadehistorik påverkar transfer-värde — V2
- Krigh-event som särskild minneshandelse — V2

---

## COMMIT-FORMAT

```
feat: sprint 25g — matchens karaktärer (domare + matchskador)

Del 1: Domarsystem
- 8 namngivna domare med stil och personlighet
- Domare väljs vägt per match, påverkar refStyle
- Domarmöte-scen i 20-30% av matcher med relations-tracking
- 60+ kurerade commentary-strängar av Opus

Del 2: Matchskador
- 6 skadetyp-arketyper med fas-baserade frekvenser
- Junior-skyddsregel (< 18 år) för ansikts-skador
- SubstitutionModal vid allvarlig skada
- Blåmärken som narrativ-detalj utan mekanisk effekt
- 40+ kurerade strängar av Opus

Ingen ändring i motor-kärnan. Inga regressioner i goalsPerMatch 
eller andra kalibreringssiffror förväntas.
```

---

## KLARTEXT TILL CODE

```
Sprint 25g (matchens karaktärer — domare + matchskador).
Full spec: docs/sprints/SPRINT_25G_MATCHENS_KARAKTARER.md

Två paketerade features, paralleliserade:

DEL 1 — Domare:
- Ny entity: Referee + RefereeRelation i src/domain/entities/Referee.ts
- Ny service: src/domain/services/refereeService.ts
- Fixture utökas med refereeId
- SaveGame utökas med referees + refereeRelations
- matchCore.ts: refStyle läses från domaren istället för att slumpas
- Nytt domarmöte-kort i GranskaScreen (20-30% av matcher)
- PLATSHÅLLARE för domardata och commentary — Opus levererar 
  kurerad text separat

DEL 2 — Matchskador:
- Ny typ: MatchInjuryType (6 arketyper)
- Ny service: src/domain/services/matchInjuryService.ts
- matchCore.ts: injury-check i foul-sequens (8% av kollisioner)
  och attack-sequens (0.3% målvaktsskador)
- SubstitutionModal öppnas vid allvarlig skada
- Junior-skyddsregel för bollen-i-ansiktet (< 18 år)
- PLATSHÅLLARE för commentary och inbox-texter — Opus levererar
  kurerad text separat

Bygg stommen först. Opus skickar kurerad text i uppföljningsmeddelande
när stommen är klar. Där fyller jag in REFEREES-arrayen och 
commentary-pools baserat på hur Code strukturerat det.

Ingen stresstest krävs — detta rör inte motor-kärnan. Manuell 
playtest-verifiering räcker. Sprint-audit obligatorisk enligt 
CLAUDE.md.
```
