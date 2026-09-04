/**
 * cupprocessor-standing-kvarlamnad (DOM 2026-09-03): cupbye-inboxtexten
 * citerade tidigare game.standings ovillkorat — före ligans första omgång
 * är den listan alfabetiskt skräp (0 spelade matcher), samma felklass som
 * trainerArcs läst-före-initiering. Dessa tester låser de tre grenarna:
 * live-position när den betyder något, förra säsongens placering som
 * fallback, och en rykte-baserad sista utväg.
 */
import { describe, it, expect } from 'vitest'
import { processCupRound } from '../cupProcessor'
import { createNewGame } from '../../createNewGame'
import { CLUB_TEMPLATES } from '../../../../domain/services/worldGenerator'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import type { CupBracket } from '../../../../domain/entities/Cup'

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  const template = CLUB_TEMPLATES[0]
  const game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
  const managedClubId = game.managedClubId
  const opponentId = game.clubs.find(c => c.id !== managedClubId)!.id
  const cupBracket: CupBracket = {
    season: game.currentSeason,
    completed: false,
    matches: [
      { round: 2, homeClubId: managedClubId, awayClubId: opponentId, fixtureId: null, homeScore: null, awayScore: null, winnerId: null },
    ],
  } as unknown as CupBracket
  return { ...game, cupBracket, ...overrides }
}

describe('cupprocessor-standing-kvarlamnad — direktkvalificeringstexten', () => {
  it('citerar live-position när standing.played > 0', () => {
    const game = makeGame()
    const standing = game.standings.find(s => s.clubId === game.managedClubId)!
    standing.played = 5
    standing.position = 2

    const result = processCupRound(game, [], new Set(), '2026-03-01')
    const item = result.cupInboxItems.find(i => i.id.startsWith('inbox_cup_directqual_'))
    expect(item?.body).toContain('er ranking (2:a)')
  })

  it('faller tillbaka på förra säsongens placering när standing.played === 0', () => {
    const base = makeGame()
    const game = makeGame({
      seasonSummaries: [
        { season: base.currentSeason - 1, clubId: base.managedClubId, finalPosition: 4 } as never,
      ],
    })
    const standing = game.standings.find(s => s.clubId === game.managedClubId)!
    standing.played = 0

    const result = processCupRound(game, [], new Set(), '2026-03-01')
    const item = result.cupInboxItems.find(i => i.id.startsWith('inbox_cup_directqual_'))
    expect(item?.body).toContain('förra säsongens placering (4:a)')
  })

  it('faller tillbaka på rykte-formulering utan spelad match och utan tidigare säsong', () => {
    const game = makeGame({ seasonSummaries: [] })
    const standing = game.standings.find(s => s.clubId === game.managedClubId)!
    standing.played = 0

    const result = processCupRound(game, [], new Set(), '2026-03-01')
    const item = result.cupInboxItems.find(i => i.id.startsWith('inbox_cup_directqual_'))
    expect(item?.body).toContain('Som etablerad klubb')
  })
})
