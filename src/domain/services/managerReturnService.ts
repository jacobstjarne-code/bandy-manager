import type { Fixture } from '../entities/Fixture'
import type { ManagerClubSpell } from '../entities/ManagerProfile'
import type { SaveGame } from '../entities/SaveGame'

export interface ManagerReturnContext {
  formerClubId: string
  currentSpell: ManagerClubSpell
}

function fixtureOpponent(fixture: Fixture, managedClubId: string): string | null {
  if (fixture.homeClubId === managedClubId) return fixture.awayClubId
  if (fixture.awayClubId === managedClubId) return fixture.homeClubId
  return null
}

function isEarlierFixture(candidate: Fixture, fixture: Fixture): boolean {
  return candidate.season < fixture.season
    || (candidate.season === fixture.season && candidate.matchday < fixture.matchday)
}

/**
 * Första verifierbara återkomsten efter ett klubbyte. Fixtures nollställs
 * vid rollover, så en pågående klubbperiod som började en tidigare säsong
 * kan inte längre bevisa "första" och får hellre vara tyst än gissa.
 */
export function getManagerReturnContext(
  game: SaveGame,
  fixture: Fixture,
): ManagerReturnContext | null {
  const opponentId = fixtureOpponent(fixture, game.managedClubId)
  if (!opponentId) return null

  const spells = game.managerProfile?.clubSpells ?? []
  const currentSpell = [...spells].reverse().find(spell =>
    spell.clubId === game.managedClubId && spell.toSeason === undefined,
  )
  if (!currentSpell || currentSpell.fromSeason !== fixture.season) return null

  const formerClub = [...spells].reverse().find(spell =>
    spell.clubId === opponentId && spell.toSeason !== undefined,
  )
  if (!formerClub) return null

  const alreadyReturned = game.fixtures.some(candidate =>
    candidate.id !== fixture.id
    && candidate.status === 'completed'
    && isEarlierFixture(candidate, fixture)
    && fixtureOpponent(candidate, game.managedClubId) === opponentId,
  )
  return alreadyReturned ? null : { formerClubId: formerClub.clubId, currentSpell }
}

export function managerReturnKey(context: ManagerReturnContext): string {
  return `callback_manager_return_${context.formerClubId}_s${context.currentSpell.fromSeason}`
}
