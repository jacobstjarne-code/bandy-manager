import type { SaveGame } from '../entities/SaveGame'
import { FixtureStatus } from '../enums'

const TRAINING_ROUNDS = [3, 8, 14, 20]

export function getTrainingScene(game: SaveGame): string | null {
  const round = game.fixtures
    .filter(f => f.status === FixtureStatus.Completed && !f.isCup)
    .reduce((max, f) => Math.max(max, f.roundNumber), 0)

  if (!TRAINING_ROUNDS.includes(round)) return null

  const focus = game.managedClubTraining?.type ?? 'physical'
  const players = game.players.filter(p => p.clubId === game.managedClubId)

  const hotPlayer = players
    .filter(p => p.seasonStats.goals >= 3)
    .sort((a, b) => b.seasonStats.goals - a.seasonStats.goals)[0]

  const coldPlayer = players
    .filter(p => p.form < 40 && p.seasonStats.gamesPlayed >= 3)
    .sort((a, b) => a.form - b.form)[0]

  const focusText: Record<string, string> = {
    skating: 'Intervaller på isen. Lungor som brinner.',
    ballControl: 'Bollkontroll i tight yta. En och en, ingen paus.',
    passing: 'Passningsövningar i trekanter. Tempo, tempo, tempo.',
    shooting: 'Skottövning från distans. Målvakten får jobba.',
    defending: 'Positionsspel i backlinje. Kommunikation i kylan.',
    tactical: 'Taktiktavla i omklädningsrummet. Sen ut på plan.',
    physical: 'Styrkepass. Ingen pratar. Alla jobbar.',
    matchPrep: 'Matchförberedelse. Genomgång av motståndaren.',
    recovery: 'Lättare pass. Stretch. Kroppen behöver vila.',
    cornerPlay: 'Hörnträning. Samma rutin, tjugonde gången idag.',
  }

  let scene = `Tisdag, 14:30. Plan 2. ${focusText[focus] ?? 'Träning.'}`

  if (hotPlayer) {
    scene += ` ${hotPlayer.lastName} hittar nätet varje gång.`
  } else if (coldPlayer) {
    scene += ` ${coldPlayer.lastName} sliter — men bollarna vill inte.`
  }

  return scene
}
