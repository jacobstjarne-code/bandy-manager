# DIAGNOS — B1+B2 cup-avancemang (live-spelad cupmatch)

**Datum:** 2026-06-23 · **Av:** Opus (källspårning) · **Till:** Code
**Korrigerar:** `INSTRUKTION-CODE-OPUS-2026-06-23-KVALL.md` punkt 1 + `KORRVANDA-3B` B1/B2.

## Hypotesen i instruktionen är fel — vinnaren avläses INTE fel
Jag har spårat hela kedjan mot källan. **Vinnarlogiken är korrekt:**
- `cupService.updateCupBracketAfterRound`: `homeWon = homeScore > awayScore` → rätt winnerId för en 2–3-match.
- `MatchLiveScreen` sparar `lastStep.homeScore/awayScore` **fixtur-orienterat** (hemma = homeClubId), inte managed-orienterat.
- `matchActions.saveLiveMatchResult` skriver dem rakt på fixturen → bracketen får rätt winnerId.

Jaga alltså INTE en inverterad/fel-lag-jämförelse. Den finns inte.

## Roten: `saveLiveMatchResult` genererar aldrig nästa cuprunda
Asymmetri i `matchActions.saveLiveMatchResult`: **slutspelsgrenen gör inline-avancemang** (kollar `phaseComplete` → `advancePlayoffRound` → `updatedFixtures.push(...newPlayoffFixtures)`). **Cup-grenen gör det inte** — den uppdaterar bara bracketen + hanterar finalen (round 4), men anropar aldrig `generateNextCupRound` för en avslutad icke-final-runda.

Varför det smäller bara på den live-spelade matchen:
1. Advance som upptäcker din väntande cupmatch: `simulateRound` hoppar över DIN match men **simulerar de 3 AI-play-in-matcherna**. De får winnerId. Rundan är inte klar (din saknas). Du ruttas till matchen.
2. Du spelar live → `saveLiveMatchResult` sätter din winnerId. **Nu är rundan komplett** (3 AI + du + 4 byes). Men ingen R2 genereras här.
3. Nästa `advanceToNextEvent` → `derivePreRoundContext` räknar `nextMatchday = min(schemalagda)`. R2 finns inte än (genereras först i `processCupRound`, senare i samma advance). Matchday 1 är slut → **nextMatchday = 5 (liga-omgång 1)**. Du dumpas där (B1).
4. `processCupRound` kör sent i samma advance, ser rundan komplett, genererar R2 vid matchday 2 — men du är redan processad in i ligan, och cup-vyn såg ingen kommande cupmatch → **"Utslagen"** (B2, samma rot).

## Fixen — spegla slutspelsgrenens inline-avancemang i cup-grenen
I `src/presentation/store/actions/matchActions.ts`, `saveLiveMatchResult`, cup-blocket. Idag:

```ts
if (completedCupFixture && updatedCupBracket && !updatedCupBracket.completed) {
  updatedCupBracket = updateCupBracketAfterRound(updatedCupBracket, [completedCupFixture])
  const finalMatch = updatedCupBracket.matches.find(m => m.round === 4 && m.winnerId)
  if (finalMatch) {
    updatedCupBracket = { ...updatedCupBracket, winnerId: finalMatch.winnerId, completed: true }
  }
}
```

Lägg till: efter bracket-uppdateringen, om den just spelade matchens runda (< 4) nu är komplett → generera nästa runda och pusha fixturerna INNAN nästa advance. Skiss:

```ts
if (completedCupFixture && updatedCupBracket && !updatedCupBracket.completed) {
  updatedCupBracket = updateCupBracketAfterRound(updatedCupBracket, [completedCupFixture])

  const playedMatch = updatedCupBracket.matches.find(m => m.fixtureId === completedCupFixture.id)
  const round = playedMatch?.round ?? 0

  if (round === 4) {
    const finalMatch = updatedCupBracket.matches.find(m => m.round === 4 && m.winnerId)
    if (finalMatch) updatedCupBracket = { ...updatedCupBracket, winnerId: finalMatch.winnerId, completed: true }
  } else if (round > 0) {
    // Spegla slutspelsgrenen: om rundan är klar, generera nästa runda NU
    // så nextMatchday i nästa advance ser cup-R(n+1), inte hoppar till ligan.
    const roundMatches = updatedCupBracket.matches.filter(m => m.round === round)
    if (roundMatches.every(m => m.winnerId)) {
      const { updatedBracket, newFixtures } = generateNextCupRound(updatedCupBracket, round, game.currentSeason)
      const stamped = stampFixturesFromCalendar(newFixtures, game.seasonCalendar ?? [])
      updatedCupBracket = updatedBracket
      if (stamped.length > 0) updatedFixtures.push(...stamped)
    }
  }
}
```

Importer (matchActions importerar redan `updateCupBracketAfterRound`):
```ts
import { updateCupBracketAfterRound, generateNextCupRound } from '../../../domain/services/cupService'
import { stampFixturesFromCalendar } from '../../../domain/services/scheduleGenerator'
```

`generateNextCupRound` är idempotent (guard mot dubbelgenerering finns), så `processCupRound` senare gör ingen skada. Gör samma sak i `concedeWalkover` cup-blocket för konsekvens (walkover i cup ska också avancera motståndaren).

## Verifiera (render-i-kontext, två fall)
- **Hemmafall + bortafall:** spela cup-R1 live som hemmalag respektive bortalag → bekräfta att nästa fixture är cup-R2 (kvartsfinal, matchday 2), inte liga-omgång 1, och att cup-vyn visar "Kvar i cupen" utan "Utslagen".
- Bekräfta att AI-only-cuprundor (när du har bye) fortfarande funkar via `processCupRound` — fixen rör bara den live-spelade vägen.
