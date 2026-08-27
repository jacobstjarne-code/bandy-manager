/**
 * A-H4a (SEXSÄSONGSAUDITEN 2026-08-26, docs/incoming/
 * BANDY_MANAGER_AUDIT_6_SASONGER_2026-08-26.md #H4): journalistreportagets
 * gamla dedup jämförde eventets EGET roundPlayed mot sig självt (alltid
 * sant, aldrig en spärr), och subject var alltid lagets högst rankade
 * friska spelare — samma spelare/citat kunde återkomma flera gånger per
 * karriär, ibland i två raka slutspelsmatcher. Testar de två extraherade
 * rena funktionerna direkt (inte via generatePostAdvanceEvents, som har
 * 15+ konkurrerande händelsetyper som gör end-to-end-tester bräckliga mot
 * icke-relaterade slumpmässiga triggers).
 */
import { describe, it, expect } from 'vitest'
import { journalistExclusiveFiredThisSeason, pickJournalistExclusiveSubject } from '../postAdvanceEvents'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import type { SaveGame } from '../../../entities/SaveGame'
import type { Player } from '../../../entities/Player'
import type { NarrativeLogEntry } from '../../../entities/Narrative'

function makePlayers(ids: string[]): Player[] {
  return ids.map((id, i) => ({
    id,
    firstName: 'Spelare',
    lastName: id,
    clubId: 'club_test',
    currentAbility: 50 + i, // stigande — sista i listan är "bäst"
  } as unknown as Player))
}

const baseGame = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })

describe('journalistExclusiveFiredThisSeason', () => {
  it('false utan narrativeBeatLog', () => {
    expect(journalistExclusiveFiredThisSeason(baseGame, baseGame.currentSeason)).toBe(false)
  })

  it('true om en journalist_exclusive_player_-post finns för AKTUELL säsong', () => {
    const entry: NarrativeLogEntry = { semanticKey: 'journalist_exclusive_player_p1', season: baseGame.currentSeason, round: 5 }
    const game: SaveGame = { ...baseGame, narrativeBeatLog: [entry] }
    expect(journalistExclusiveFiredThisSeason(game, game.currentSeason)).toBe(true)
  })

  it('false om posten är från en TIDIGARE säsong — spärren är per säsong, inte permanent', () => {
    const entry: NarrativeLogEntry = { semanticKey: 'journalist_exclusive_player_p1', season: baseGame.currentSeason - 1, round: 5 }
    const game: SaveGame = { ...baseGame, narrativeBeatLog: [entry] }
    expect(journalistExclusiveFiredThisSeason(game, game.currentSeason)).toBe(false)
  })

  it('rot-regression: den gamla koden jämförde roundPlayed mot sig självt (alltid sant) — denna funktion läser narrativeBeatLog, inte roundPlayed', () => {
    // Ingen logg alls, men flera "roundPlayed"-liknande fält i spelet — ska
    // ändå vara false, eftersom funktionen aldrig tittar på roundPlayed.
    expect(journalistExclusiveFiredThisSeason(baseGame, baseGame.currentSeason)).toBe(false)
  })
})

describe('pickJournalistExclusiveSubject — spelarrotation', () => {
  const players = makePlayers(['p1', 'p2', 'p3'])

  it('utan historik: väljer den högst rankade (p3)', () => {
    const subject = pickJournalistExclusiveSubject(baseGame, players)
    expect(subject?.id).toBe('p3')
  })

  it('p3 har redan figurerat — väljer näst högst rankade (p2), inte p3 igen', () => {
    const game: SaveGame = {
      ...baseGame,
      narrativeBeatLog: [{ semanticKey: 'journalist_exclusive_player_p3', season: baseGame.currentSeason - 1, round: 10 }],
    }
    const subject = pickJournalistExclusiveSubject(game, players)
    expect(subject?.id).toBe('p2')
  })

  it('p3 och p2 har figurerat — väljer p1 (sista i poolen), inte en redan-vald', () => {
    const game: SaveGame = {
      ...baseGame,
      narrativeBeatLog: [
        { semanticKey: 'journalist_exclusive_player_p3', season: baseGame.currentSeason - 2, round: 5 },
        { semanticKey: 'journalist_exclusive_player_p2', season: baseGame.currentSeason - 1, round: 8 },
      ],
    }
    const subject = pickJournalistExclusiveSubject(game, players)
    expect(subject?.id).toBe('p1')
  })

  it('poolen rullat ETT FULLT VARV (alla tre figurerat) — spärren släpper, p3 (bäst) blir valbar igen', () => {
    const game: SaveGame = {
      ...baseGame,
      narrativeBeatLog: [
        { semanticKey: 'journalist_exclusive_player_p1', season: baseGame.currentSeason - 3, round: 1 },
        { semanticKey: 'journalist_exclusive_player_p2', season: baseGame.currentSeason - 2, round: 5 },
        { semanticKey: 'journalist_exclusive_player_p3', season: baseGame.currentSeason - 1, round: 8 },
      ],
    }
    const subject = pickJournalistExclusiveSubject(game, players)
    expect(subject?.id).toBe('p3')
  })

  it('tom trupp ger null, ingen krasch', () => {
    expect(pickJournalistExclusiveSubject(baseGame, [])).toBeNull()
  })
})
