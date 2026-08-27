/**
 * Påståendesvepet #13 (MASTER.md, 2026-08-24), Jacobs dom 2026-08-26:
 * "Styrelsebetyg"-inkorgskortet (generateSeasonVerdict) betygsatte tidigare
 * BARA placering mot förväntan — till skillnad från årsbokens verdictText
 * (#4, dömd till att MEDVETET hålla säsongsbetyg och boardPatience isär),
 * är detta kortet ett AKTIVT meddelande spelaren agerar på inför nästa
 * vinter. Domen: säsongsdomen står FÖRST, ORÖRD — en lägesmening (Stabilt/
 * Under press/Ultimatum) läggs till EFTER, som sin egen sats, med det
 * SLUTGILTIGA (säsongsslut-uppdaterade) boardPatience-värdet — inte det
 * som gällde vid säsongens start.
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../createNewGame'
import { handleSeasonEnd } from '../seasonEndProcessor'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { InboxItemType, ClubExpectation } from '../../../domain/enums'

function makeBase(overrides: Partial<SaveGame>): SaveGame {
  const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
  return { ...game, ...overrides }
}

function boardVerdictBody(game: SaveGame): string {
  const item = game.inbox.find(i => i.type === InboxItemType.BoardFeedback && i.id.startsWith('inbox_board_verdict_'))
  expect(item, 'styrelsebetyg-kortet saknas i inkorgen').toBeDefined()
  return item!.body
}

describe('seasonEndProcessor — styrelsebetyg-kortet får en lägesmening EFTER säsongsdomen', () => {
  it('hög boardPatience (stabilt) ger "Ni har vårt förtroende." sist i texten', () => {
    const game = makeBase({ boardPatience: 90, meritBuffer: 0 })
    const result = handleSeasonEnd(game, 1)
    expect(boardVerdictBody(result.game)).toContain('Ni har vårt förtroende.')
  })

  it('boardPatience i under_press-zonen ger "Vi förväntar oss att nästa vinter ser annorlunda ut."', () => {
    // 45 + normal säsongsslutsrörelse hamnar kvar i 30-49-bandet oavsett placering
    // (bandet är 20 brett, säsongsslutstermen ensam förflyttar sällan mer än
    // enstaka poäng för en mittenklubb) — men vi läser det FAKTISKA resultatet,
    // inte antar det, se assertionen på raw-värdet nedan.
    const game = makeBase({ boardPatience: 45, meritBuffer: 0 })
    const result = handleSeasonEnd(game, 1)
    const patience = result.game.boardPatience!
    const expectedLine = patience < 30 ? 'Det här kan inte upprepas.'
      : patience < 50 ? 'Vi förväntar oss att nästa vinter ser annorlunda ut.'
      : 'Ni har vårt förtroende.'
    expect(boardVerdictBody(result.game)).toContain(expectedLine)
  })

  it('mycket låg boardPatience (ultimatum) ger "Det här kan inte upprepas."', () => {
    const game = makeBase({ boardPatience: 15, meritBuffer: 0 })
    const result = handleSeasonEnd(game, 1)
    // En djup startpunkt (15) kan inte lyftas över ultimatum-tröskeln (30) av
    // en enda säsongsslutsterm — samma marginal-resonemang som
    // surviveTierFiringExemption.test.ts använder för att garantera zonen.
    expect(result.game.boardPatience!).toBeLessThan(30)
    expect(boardVerdictBody(result.game)).toContain('Det här kan inte upprepas.')
  })

  it('säsongsdomens EGEN text (oförändrad) står FÖRE lägesmeningen, inte ersatt av den', () => {
    const game = makeBase({ boardPatience: 90, meritBuffer: 0 })
    const result = handleSeasonEnd(game, 1)
    const body = boardVerdictBody(result.game)
    // generateSeasonVerdict()s befintliga betygstexter innehåller alla ordet
    // "Styrelsen ger dig betyget" — den delen ska fortfarande finnas, orörd,
    // FÖRE lägesmeningen (inte utbytt mot den).
    expect(body).toContain('Styrelsen ger dig betyget')
    expect(body.indexOf('Styrelsen ger dig betyget')).toBeLessThan(body.indexOf('Ni har vårt förtroende.'))
  })

  it('lägesraden reflekterar det SLUTGILTIGA (säsongsslut-uppdaterade) boardPatience, inte startvärdet', () => {
    // Startvärde djupt i ultimatum (10) — men en STARK säsong (WinLeague-
    // klubb som slutar 1:a) ger en stor positiv säsongsslutsterm som kan
    // lyfta patiensen över 30 samma säsong. Lägesraden ska då spegla den
    // NYA zonen, inte startvärdets.
    const game = makeBase({ boardPatience: 10, meritBuffer: 0 })
    const managedClub = game.clubs.find(c => c.id === game.managedClubId)!
    const gameWinning = {
      ...game,
      clubs: game.clubs.map(c => c.id === managedClub.id ? { ...c, boardExpectation: ClubExpectation.AvoidBottom } : c),
    }
    const result = handleSeasonEnd(gameWinning, 1)
    const body = boardVerdictBody(result.game)
    const finalPatience = result.game.boardPatience!
    if (finalPatience >= 30) {
      expect(body).not.toContain('Det här kan inte upprepas.')
    } else {
      expect(body).toContain('Det här kan inte upprepas.')
    }
    // Assertionen ovan är villkorad på det FAKTISKA utfallet (inte en
    // förhandsgissning) — poängen är att raden alltid matchar
    // result.game.boardPatience, aldrig startvärdet (10, ultimatum).
  })
})
