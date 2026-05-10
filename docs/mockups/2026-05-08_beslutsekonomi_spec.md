# Beslutsekonomi — throttling-system för pending decisions

**Datum:** 2026-05-08
**Spec-typ:** Systemdesign — förebygger decision-overload
**Bakgrund:** Playtest visar att Omg 1 säsong 1 kan generera 4+ events samtidigt + 7 inbox-notiser + boardObjectives + weeklyDecision + match-förberedelse. Det är overload — spelaren känner att inget val "matter" eftersom alla val sker i en sekvens utan andrum.

## Problem

Bandymanagern har minst åtta decision-källor som kan trigger samtidigt:
- `boardObjectives` (bakgrund, hela säsongen)
- `weeklyDecisionService` (en per vecka)
- `events` (random händelser via `eventQueueService`)
- `rumorService` (transferrykten)
- `mecenatDinnerService` (sponsor-events)
- `hallDebateService` (kommunfrågor, säsong 2+)
- `playerVoiceService` (spelarröster)
- `arcService` (narrative arcs phase-events)

Var och en fungerar isolerat. Tillsammans kan de trigga 4-6 pending events i samma omgång — speciellt vid säsongsstart där boardObjectives + weeklyDecision + 2-3 random events + spelarröster råkar samla sig.

## Designprincip

**Spelaren ska aldrig ha mer än 2 active decisions att hantera samtidigt** (säsong 1 Omg 1: max 1). Resten köas och dyker upp i framtida omgångar när tidigare blivit avklarade.

Detta gör varje val mer **viktigt** (det är ETT av få) och mer **hanterbart** (overload försvinner).

## API-design

```ts
// Ny state-fält i game-store
game.pendingDecisions: PendingDecision[]   // 0..N

// Decision-budget per omgång
const MAX_ACTIVE_DECISIONS = 2
const MAX_ACTIVE_SEASON_1_ROUND_1 = 1

// Helper
function getActiveDecisionCount(game: Game): number {
  return game.pendingDecisions.filter(d => d.status === 'pending').length
}

function canAddDecision(game: Game): boolean {
  const limit = (game.currentSeason === 1 && game.currentRound === 1) 
    ? MAX_ACTIVE_SEASON_1_ROUND_1 
    : MAX_ACTIVE_DECISIONS
  return getActiveDecisionCount(game) < limit
}
```

## Trigger-flöden

Varje decision-source-service förändras till:

```ts
// Före (existing pattern):
function generateWeeklyDecision(game: Game): WeeklyDecision | null {
  if (!shouldGenerate(game)) return null
  return makeDecision(game)
}

// Efter (med throttling):
function generateWeeklyDecision(game: Game): WeeklyDecision | null {
  if (!shouldGenerate(game)) return null
  if (!canAddDecision(game)) return null  // ← throttling
  return makeDecision(game)
}
```

Alla services som lägger till pending-events går genom `canAddDecision`-gate. När budgeten är full skippas trigger denna omgång — möjligen försök igen nästa omgång (eller queue:as i `game.deferredDecisions[]` för senare).

## Cooldowns per kategori

Ut över global budget — varje source får egen cooldown:

| Source | Min cooldown mellan events |
|---|---|
| `weeklyDecisionService` | 1 vecka (definitionsmässigt) |
| `mecenatDinnerService` | 4 omgångar |
| `hallDebateService` | 8 omgångar (existing) |
| `eventQueueService` (random events) | 2 omgångar |
| `rumorService` | 3 omgångar |
| `arcService` phase-events | 2 omgångar mellan phase-trigger |

`playerVoiceService` är 20% chans + form-villkor — den har naturlig throttling och behöver inte cooldown.

`boardObjectives` triggas en gång per säsong — ingen cooldown behövs.

## UI-effekt

Inbox-räknare ("X notiser i inboxen") ska bara räkna **active** decisions, inte alla händelser. Spelaren ska se 0-2 (sällan 3) i räknaren, inte 7+.

Om köade decisions finns (deferredDecisions), kan UI mjukt antyda i Portal: "2 nya händelser i kö" med en grå pip — men ingen acceleration tills budget öppnar.

## Säsongs- och omgångs-sabbat

**Säsong 1 Omg 1 har max 1 active decision.** Anledning: spelaren är ny, lär sig systemet, ska inte överväldigas. Decisions köas upp under Omg 1-2 så de möter spelaren när hen är inläst.

**Vid säsongsslut/säsongsstart**: `boardObjectives` triggas alltid. Andra decision-sources släpps **mjukt** under första 2-3 omgångar nästa säsong, inte alla samtidigt.

## Implementation steg

1. **Skapa state-fält:** `game.pendingDecisions` + `game.deferredDecisions`
2. **Skapa helper:** `canAddDecision(game): boolean`
3. **Migrera existing services:** alla decision-generators (weeklyDecision, mecenatDinner, hallDebate, events, rumors, arc-phases) wrappar i `canAddDecision`-gate
4. **Implementera cooldowns** per source (se tabell)
5. **UI-räknare** uppdateras till bara active count
6. **Säsong 1 Omg 1-undantag** — extra hård gränsen
7. **Tester:** snapshot per säsong/omgång, verifiera att count aldrig överstiger budget

## Verifiering i playtest

- Starta nytt spel säsong 1 → Omg 1 har max 1 active decision
- Spela 5 omgångar → räknaren går aldrig över 2 active
- Om 6+ händelser triggas samtidigt: 2 visas, 4 köas → de dyker upp gradvis i kommande omgångar

## Inte i scope

- Användar-konfigurerbar budget ("jag vill ha mer chaos")
- Decisions som kan dismisseras utan val
- Visuell representation av deferred-queue (kan komma som tillägg)

## Status

Detta är **systemkonsekvent förbättring** som rör 6+ existing services. Inte trivial implementation — kräver disciplinerad migrering. Stor playtest-vinst eftersom det löser overload-känslan på ett strukturellt sätt.
