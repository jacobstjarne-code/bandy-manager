import type { SaveGame } from '../domain/entities/SaveGame'
import { FixtureStatus } from '../domain/enums'

/**
 * PT-8 (2026-07-18): samma "en klubb spelar inte varje matchday"-bugg bet tre
 * separata gånger innan den blev en delad hjälpare — M66e (cup_first_match-
 * gaten i anslagService.ts krävde hårdkodat roundNumber===1), PT-3-harnesset
 * (live-sim-sequence.ts's drain-helper satte aldrig lineup för mellanliggande
 * matchdagar) och 1c-testerna (roundProcessor.test.ts, club_forsbacka/seed 42
 * har bye i cupkvalet — spelar först matchday 5). Tre instanser av samma
 * mönster är systematiskt: en klubb kan ha bye i cupkvalet, och cupen skapar
 * nya rundor DYNAMISKT (R2 beror på R1:s utfall) — en dräneringsloop som bara
 * kollar en hårdkodad matchday, eller bara sätter lineup vid mål-matchdagen,
 * fastnar permanent på en matchday klubben inte spelar.
 *
 * Denna hjälpare äger BARA loop-villkoret (när ska draineringen stanna) —
 * INTE hur ett enskilt varv avanceras. Test-sviten och stress-skripten har
 * olika, redan etablerade sätt att sätta lineup (advanceWithLineup:s
 * cup-retry-mönster i test, autoSelectLineup i skripten) — att tvinga fram
 * EN lineup-strategi hade varit en separat, större refaktor. `advanceOneRound`
 * injiceras därför av callern; denna funktion garanterar bara att loopen
 * aldrig stannar på en matchday managed club inte har en fixture på (utan
 * `targetMatchday`), eller dränerar korrekt fram till en specifik matchday
 * (med `targetMatchday`, skriptens användningsfall).
 */
export function advanceUntilManagedFixture(
  game: SaveGame,
  advanceOneRound: (game: SaveGame, roundIndex: number) => SaveGame,
  opts: { targetMatchday?: number; maxRounds?: number } = {},
): SaveGame {
  const maxRounds = opts.maxRounds ?? 60
  for (let i = 0; i < maxRounds; i++) {
    const scheduled = game.fixtures.filter(f => f.status === FixtureStatus.Scheduled)
    if (scheduled.length === 0) return game
    const nextMd = scheduled.reduce((mn, f) => f.matchday < mn ? f.matchday : mn, Infinity)

    const shouldStop = opts.targetMatchday !== undefined
      ? nextMd >= opts.targetMatchday
      : scheduled.some(f =>
          f.matchday === nextMd && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
        )
    if (shouldStop) return game

    game = advanceOneRound(game, i)
  }
  return game
}
