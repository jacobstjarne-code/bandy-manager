import type { SaveGame } from '../entities/SaveGame'
import { FixtureStatus } from '../enums'

/**
 * matchflode-forbered-linjar ingrepp 3, DESIGN_UPPDRAG_FORMATCHVINJETT_
 * 2026-09-06.md §3: "bara första mötet mot varje klubb... triggern finns
 * redan i koden (Berättaren-callbacksystemet)". PRE-SPEC CROSS-CHECK
 * (2026-09-07, Code): den namngivna triggern, `managerReturnService.ts`s
 * `getManagerReturnContext`, löser ett ANNAT problem (managerns egen
 * återkomst till en FORMER klubb) — dess egen kommentar säger uttryckligen
 * att den ger upp för en pågående klubbperiod som började en tidigare
 * säsong, eftersom `game.fixtures` nollställs varje rollover
 * (samma rotfel `berattaren-en-kronologi` fixade i `currentChronology.ts`
 * idag). Att återanvända den rakt av hade gett falska "första mötet"-
 * vinjetter varje gång en gammal klubbperiod återupptas.
 *
 * Robust väg utan ny sparfil-state: ligan är en fast dubbel round-robin,
 * 22 omgångar / 12 lag (`scheduleGenerator.ts`) — varje klubbpar möts
 * garanterat inom manager-KARRIÄRENS första säsong, aldrig först senare
 * (bekräftat: 22 rundor täcker alla 11 möjliga motståndare två gånger).
 * "Första mötet" kan alltså bara vara sant under den allra första säsongen
 * — och `game.seasonSummaries` (till skillnad från `game.fixtures`) är
 * DURABELT, ackumuleras för alltid, nollställs aldrig vid rollover. Ett
 * tomt `seasonSummaries` betyder därför "ingen säsong har avslutats än,
 * oavsett hur många gånger managerklubben bytts" — precis den signal som
 * behövs, utan att fråga en fixture-lista som redan kan vara tömd.
 */
export function isFirstMeetingWithOpponent(game: SaveGame, opponentClubId: string): boolean {
  if ((game.seasonSummaries ?? []).length > 0) return false
  return !game.fixtures.some(f =>
    f.status === FixtureStatus.Completed
    && ((f.homeClubId === game.managedClubId && f.awayClubId === opponentClubId)
      || (f.awayClubId === game.managedClubId && f.homeClubId === opponentClubId)),
  )
}
