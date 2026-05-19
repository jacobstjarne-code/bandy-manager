import type { SaveGame } from '../entities/SaveGame'
import type { Fixture } from '../entities/Fixture'
import type { NotableEventType } from '../data/klackEchoText'
import { getRivalry } from '../data/rivalries'

export interface KlackEchoEvent {
  type: NotableEventType
  resultMatchday: number
  initialWeight: number
  decayPerRound: number
}

// High-reputation clubs (shortNames) that count as "storstad"
// Clubs with reputation >= 70 from worldGenerator CLUB_TEMPLATES
export const STORSTAD_SHORT_NAMES = ['SBK', 'VBK', 'FBK', 'HBK']

export function detectNotableResult(fixture: Fixture, game: SaveGame): KlackEchoEvent | null {
  const managedId = game.managedClubId
  const isHome = fixture.homeClubId === managedId
  const myScore = isHome ? fixture.homeScore : fixture.awayScore
  const theirScore = isHome ? fixture.awayScore : fixture.homeScore
  if (myScore === undefined || theirScore === undefined) return null

  const oppId = isHome ? fixture.awayClubId : fixture.homeClubId
  const oppClub = game.clubs.find(c => c.id === oppId)
  const hasRivalry = getRivalry(managedId, oppId) !== null

  // derby_*: always if opponent in rivalry list
  if (hasRivalry) {
    const won = myScore > theirScore
    const drew = myScore === theirScore
    const type: NotableEventType = won ? 'derby_win' : drew ? 'derby_draw' : 'derby_loss'
    return { type, resultMatchday: fixture.matchday, initialWeight: 1.0, decayPerRound: 0.5 }
  }

  const oppPos = game.standings.find(s => s.clubId === oppId)?.position ?? 6

  // heavy_home_loss: home + loss by >= 4
  if (isHome && theirScore - myScore >= 4) {
    return { type: 'heavy_home_loss', resultMatchday: fixture.matchday, initialWeight: 1.0, decayPerRound: 0.5 }
  }

  // top_team_win: win against team in position <= 3
  if (myScore > theirScore && oppPos <= 3) {
    return { type: 'top_team_win', resultMatchday: fixture.matchday, initialWeight: 1.0, decayPerRound: 0.33 }
  }

  // storstad_loss: loss against a high-reputation club
  const isStorstad = oppClub && (STORSTAD_SHORT_NAMES.includes(oppClub.shortName ?? '') || oppPos <= 2)
  if (myScore < theirScore && isStorstad) {
    return { type: 'storstad_loss', resultMatchday: fixture.matchday, initialWeight: 1.0, decayPerRound: 0.5 }
  }

  return null
}

export function decayKlackEcho(echo: NonNullable<SaveGame['klackEcho']>): SaveGame['klackEcho'] {
  const newWeight = echo.currentWeight * (1 - echo.decayPerRound)
  if (newWeight < 0.1) return undefined
  return { ...echo, currentWeight: newWeight }
}
