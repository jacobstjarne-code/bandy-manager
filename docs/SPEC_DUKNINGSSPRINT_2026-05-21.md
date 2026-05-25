# SPEC — Dukningssprint (plumbing inför Design lördag)

**Datum:** 2026-05-21
**Status:** Klar för Code. Tre tickets, alla ren infrastruktur.
**Bakgrund:** `AUDIT_SYNLIGHET_2026-05-21.md`. Mål: bygg datalager +
instrumentering så Design kommer till ett dukat bord lördag — utan att
föregripa designbeslut (rendering, prioritering, trösklar).

**INGEN svensk spelartext i denna sprint.** Alla tre tickets är
infrastruktur. Code kan köra hela utan Opus-textleverans.

---

## TICKET 1 — collectActiveMemories(game): ActiveMemory[]

**Plats:** `src/domain/services/clubMemoryService.ts` (samma fil som
findActiveAnniversaries — de är släkt)

Ren aggregator som normaliserar alla aktiva narrativa minnen till EN ström.
Ingen picker, ingen prioritering utöver rå weight, ingen rendering.

```typescript
interface ActiveMemory {
  source: 'moment' | 'klack' | 'journalist' | 'nemesis' | 'rival_sale'
        | 'follow_up' | 'letter' | 'board_history' | 'economic_crisis'
  matchday: number
  season: number
  weight: number        // rå: recency × källvikt. INGEN prioritering.
  kind: 'triumph' | 'scar' | 'tension' | 'neutral'
  title: string
  body: string
  subjectPlayerId?: string
  subjectClubId?: string
}
```

Källmappning:
- `recentMoments[]` → mappas rakt in (har redan title/body/source/matchday/
  season/subject*). kind härleds från source: derby_win/sponsor_positive/
  era_shift(establishment|legacy) = triumph; star_injury/mecenat_left/
  rival_sale/captain_crisis/sponsor_negative = scar; nemesis_signed = tension;
  övriga = neutral
- `klackEcho` → ETT memory om currentWeight > 0. kind från NotableEventType
- `journalist.memory[]` → senaste 1-2 entries. VERIFIERA fältaccess mot
  Narrative.ts först (enda osäkra källan i auditen)
- `nemesisTracker` → ett memory per spelare med goalsAgainstUs >= 3. kind = tension
- `lastRivalSaleMatchday` → ett memory om inom 5 omg. kind = scar
- `pendingFollowUps[]` → ett memory per pending. kind = neutral
- `bandyLetters[]` → senaste osedda. kind = triumph
- `boardObjectiveHistory[]` → senaste säsongens met/failed. kind = triumph/scar
- `economicCrisisState` → ett memory om phase != 'resolved'. kind = scar

weight-formel (rå, deterministisk):
```
weight = sourceBaseWeight[source] × recencyFactor
recencyFactor = max(0.2, 1 - (currentMatchday - memory.matchday) / 10)
sourceBaseWeight: moment=70, klack=60, nemesis=55, rival_sale=65,
journalist=50, board_history=55, economic_crisis=60, letter=45, follow_up=40
```

Sorteras på weight desc. Ingen slice — returnera allt. Design bestämmer
hur många som visas.

**Tester (de är hur Design ser strömmen):**
- Bygg ett rikt game-state-fixture (derby-moment + klackEcho + nemesis +
  rivalförsäljning + board-history) och snapshot:a hela ActiveMemory[]-outputen
- Tomt game → tom lista, ingen krasch
- Verifiera weight-sortering

~3h.

---

## TICKET 2 — classifyInterrupt + kö-instrumentering

**Plats:** ny `src/domain/services/interruptClassifier.ts`

Två rena funktioner. FÅR INTE ändra throttle-beteendet i roundProcessor —
bara klassificera och mäta. (Throttle-trösklar är Designs beslut.)

```typescript
type InterruptKind = 'actionable' | 'informational'

function classifyInterrupt(item: {
  category: 'anslag' | 'event' | 'weekly_decision' | 'phase_mark' | 'scene'
  ...
}): InterruptKind
```

Regler (utgångspunkt — Design justerar):
- weekly_decision → actionable
- event med choices → actionable
- event utan choices (atmosfäriskt) → informational
- anslag → informational
- phase_mark → informational
- scene med val (sceneChoices) → actionable; annars informational

```typescript
function countPendingInterrupts(game): Record<category, {
  total: number; actionable: number; informational: number
}>
```

Räknar vad som FAKTISKT väntar i game-state nu (pendingEvents,
pendingWeeklyDecision, seenAnslag-diff, phaseMarksSeen-diff, pendingScene).
Avslöjar om de "åtta" är mest informational (= ska till inbox per FM-principen)
eller faktiska beslut.

**Audit-fynd att dokumentera i koden:** roundProcessor har redan
`MAX_ATMOSPHERIC_PER_ROUND=2` + `MAX_LOW_IN_QUEUE=5` med spill-to-inbox, men
bara för low-prio events. Anslag/beslut/marks går förbi. Denna klassificering
täcker alla kategorier — men ÄNDRAR inget förrän Design beslutar policyn.

**Tester:** varje kategori klassificeras rätt; countPendingInterrupts på state
med 8 väntande → korrekt uppdelning; inga sidoeffekter.

~2h.

---

## TICKET 3 — managerChoiceLog i MatchReport

**Plats:** `src/domain/entities/Fixture.ts` (MatchReport-typen) + fångst i
matchSimProcessor/MatchLiveScreen

```typescript
managerChoiceLog?: Array<{
  type: 'halftime_tactic' | 'started_tired' | 'pep_talk' | 'captain' | 'bench_fit'
  playerId?: string
  detail: string      // strukturerad, ej spelartext — t.ex. 'lowered_tempo'
  minute?: number
}>
```

Fångst (datafångst, ingen rendering, ingen svensk text):
- halftime_tactic: när halvtidsbeslut tas (lugna/pressa/prata)
- started_tired: startande spelare med condition < 40 → playerId + 'condition_NN'
- pep_talk: om pep-talk-val sparas
- captain: captainPlayerId vid matchstart
- bench_fit: spelare med condition > 80 på bänken

Ger Ticket #4 (efter-match-kvitto, senare) riktig data istället för härledning.

**Tester:** halvtidsbeslut loggas; sliten startspelare loggas; managerChoiceLog
överlever match-completion (stripCompletedFixture får INTE strippa
report.managerChoiceLog).

~2h.

---

## VAD SOM INTE ÄR I DENNA SPRINT (Designs bord lördag)

- Moment-fönstret (rendering av collectActiveMemories) — datan finns, ytan är design
- Throttle-policyn (vilka informational-avbrott till inbox) — verktyget finns, tröskeln är design
- Efter-match-kvittots formulering (Ticket #4) — managerChoiceLog ger råvaran
- Portal-hierarki, guide-vid-start

## LEVERANSORDNING

1, 2, 3 oberoende. Valfri ordning. Inga textpooler, ingen Opus-blockering.
Ingen UI-regressionsrisk mot R3.

## ACCEPTANSKRITERIER

- [ ] collectActiveMemories returnerar normaliserad, weight-sorterad ström från
      9 källor, snapshot-testad
- [ ] classifyInterrupt + countPendingInterrupts rena, testade, ÄNDRAR inget
      throttle-beteende
- [ ] managerChoiceLog fångas + överlever match-completion
- [ ] journalist.memory-fältaccess verifierad mot Narrative.ts
- [ ] Alla 922+ tester gröna

— Opus, 2026-05-21
