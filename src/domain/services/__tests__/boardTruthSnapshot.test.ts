/**
 * A-H4 (TRIAGE_AUDIT_2026-08-29.md, HIGH 4 i
 * BANDY_MANAGER_AUDIT_5_SASONGER_KUL_STICKINESS_VISUELL_2026-08-29.md):
 * "årsboken motsäger avskedet och de faktiska styrelsekraven" — årsboken
 * (seasonSummaryService.ts, expectationVerdict) och Game Over
 * (GameOverScreen.tsx, live game.boardPatience/consecutiveFailures) läste
 * tidigare VARSIN källa vid VARSIN tidpunkt och kunde säga emot varandra om
 * samma säsong (8:e plats "överträffade alla förväntningar" i årsboken,
 * "ihållande besvikelser" i Game Over).
 *
 * Detta test bevisar två saker om buildSeasonBoardTruth/gameOverBoardStatement
 * (boardService.ts), den nya delade sanningsmodellen:
 *
 * 1. De två axlarna (uttalat mål/utfall vs. relationens slutläge) är
 *    STRUKTURELLT oberoende — en säsong kan vara "exceeded" och samtidigt
 *    ha en "ultimatum"-relation, utan att någon av funktionerna slår ihop
 *    dem till en enda dom. Det är inte en bugg (det ÄR den verkliga
 *    Skutskär/Lesjöfors-situationen: ackumulerad historik väger tyngre än
 *    en enskild bra säsong) — testet bevisar bara att modellen HÅLLER ISÄR
 *    dem i stället för att kollapsa dem.
 * 2. gameOverBoardStatement (Game Over-texten) och outcome.verdict (årsbokens
 *    dom) härleds ur SAMMA SeasonBoardTruth-objekt — det finns ingen kodväg
 *    där de kan läsa olika snapshots av samma säsong.
 */
import { describe, it, expect } from 'vitest'
import { buildSeasonBoardTruth, gameOverBoardStatement } from '../boardService'
import { ClubExpectation } from '../../enums'

describe('buildSeasonBoardTruth — de tre axlarna kollapsas aldrig till en dom', () => {
  it('en säsong kan döms "exceeded" (uttalat mål/utfall) samtidigt som relationen är "ultimatum" (soured) — båda fakta läsbara oberoende', () => {
    // MidTable-anchor=6 (BOARD_EXPECTATION_ANCHOR_POSITION): plats 8 ligger
    // inom "exceeded"-bandet (computeSeasonVerdictRating: midpoint±2 = 4-8 →
    // rating 5) — exakt Lesjöfors-scenariot i auditen. boardPatienceAfter
    // sätts lågt (ackumulerad skuld från tidigare säsonger), oberoende av
    // den här säsongens goda placering.
    const truth = buildSeasonBoardTruth({
      expectation: ClubExpectation.MidTable,
      finalPosition: 8,
      totalTeams: 12,
      isChampion: false,
      boardPatienceAfter: 12,
      consecutiveFailuresAfter: 3,
      managerFired: true,
      firedReason: 'boardPatience',
    })

    expect(truth.outcome.verdict).toBe('exceeded')
    expect(truth.outcome.rating).toBe(5)
    expect(truth.relationship.zone).toBe('ultimatum')
    expect(truth.relationship.managerFired).toBe(true)

    // Game Over-texten pratar om relationen (den soured axeln) — inte om
    // säsongens placeringsdom. De två fakta motsäger inte varandra: båda
    // är sanna, och båda går att läsa ur SAMMA objekt.
    const statement = gameOverBoardStatement(truth, 'Lesjöfors BK')
    expect(statement).toContain('ihållande besvikelserna')
    expect(statement).toContain('Lesjöfors BK')
  })

  it('omvänt: en misslyckad säsong (failed) kan ha en stabil relation (meritbuffert från tidigare framgångar) — ingen automatisk sammankoppling', () => {
    const truth = buildSeasonBoardTruth({
      expectation: ClubExpectation.ChallengeTop,
      finalPosition: 9,
      totalTeams: 12,
      isChampion: false,
      boardPatienceAfter: 65,
      consecutiveFailuresAfter: 0,
      managerFired: false,
    })

    expect(truth.outcome.verdict).toBe('failed')
    expect(truth.relationship.zone).toBe('stabilt')
    expect(truth.relationship.managerFired).toBe(false)
    expect(truth.relationship.firedReason).toBeUndefined()
  })

  it('firedReason är alltid undefined när managerFired===false, oavsett vad anroparen skickar in', () => {
    const truth = buildSeasonBoardTruth({
      expectation: ClubExpectation.Survive,
      finalPosition: 12,
      totalTeams: 12,
      isChampion: false,
      boardPatienceAfter: 3,
      consecutiveFailuresAfter: 5,
      managerFired: false,
      firedReason: 'boardPatience', // ska ignoreras — managerFired är falskt
    })
    expect(truth.relationship.firedReason).toBeUndefined()
  })

  it('deterministisk: identiska indata ger identisk snapshot (ingen dold slumpkälla, ingen drift mellan anrop)', () => {
    const params = {
      expectation: ClubExpectation.WinLeague,
      finalPosition: 1,
      totalTeams: 12,
      isChampion: true,
      boardPatienceAfter: 95,
      consecutiveFailuresAfter: 0,
      managerFired: false,
    } as const
    expect(buildSeasonBoardTruth(params)).toEqual(buildSeasonBoardTruth(params))
  })

  it('statedGoal bär den KONKRETA ankarpositionen, inte bara enum-namnet (auditens exakta klagomål: "grov enum, inte det konkreta målet")', () => {
    const truth = buildSeasonBoardTruth({
      expectation: ClubExpectation.ChallengeTop,
      finalPosition: 4,
      totalTeams: 12,
      isChampion: false,
      boardPatienceAfter: 70,
      consecutiveFailuresAfter: 0,
      managerFired: false,
    })
    expect(truth.statedGoal.expectation).toBe(ClubExpectation.ChallengeTop)
    expect(truth.statedGoal.anchorPosition).toBe(4)
    expect(typeof truth.statedGoal.label).toBe('string')
    expect(truth.statedGoal.label.length).toBeGreaterThan(0)
  })
})

describe('gameOverBoardStatement — samma tre låsta texter som GameOverScreen.tsx hade, nu drivna av snapshotten', () => {
  it('consecutiveFailures-vägen', () => {
    const truth = buildSeasonBoardTruth({
      expectation: ClubExpectation.AvoidBottom,
      finalPosition: 11,
      totalTeams: 12,
      isChampion: false,
      boardPatienceAfter: 40,
      consecutiveFailuresAfter: 3,
      managerFired: true,
      firedReason: 'consecutiveFailures',
    })
    expect(gameOverBoardStatement(truth, 'Skutskär IF')).toBe(
      'Efter tre säsonger på rad utan förbättring ser styrelsen sig tvingad att göra en förändring. Skutskär IF tackar för insatsen men önskar dig lycka till i framtiden.'
    )
  })

  it('licenseDenied-vägen (generisk text, ingen av de två sportsliga skälen)', () => {
    const truth = buildSeasonBoardTruth({
      expectation: ClubExpectation.Survive,
      finalPosition: 12,
      totalTeams: 12,
      isChampion: false,
      boardPatienceAfter: 60,
      consecutiveFailuresAfter: 1,
      managerFired: true,
      firedReason: 'licenseDenied',
    })
    expect(gameOverBoardStatement(truth, 'Heros BK')).toBe(
      'Styrelsen har beslutat att göra en förändring i tränarrollen. Tack för din tid i Heros BK.'
    )
  })
})
