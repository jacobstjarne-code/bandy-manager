/**
 * KÖRORDER 2026-09-18 §4.2 — når seasonForm ända fram till matchresultatet?
 *
 * Frågan ställdes för att `grep seasonForm src/domain/services/matchCore.ts` ger
 * noll träffar: effekten går indirekt, via taket på konditionens EFFEKT i
 * squadEvaluator (`effectiveFitness = min(fitness, seasonForm + SLACK)`).
 * Körordern: "Om skillnaden är under 2 % är hela periodiseringen kosmetisk
 * oavsett §4.1, och det ska upp till Jacob innan UI byggs."
 *
 * SVARET ÄR VILLKORAT, och villkoret är konditionsekonomin:
 *
 *   råkondition   sf=60    sf=85    skillnad
 *          45      35,4     35,4      0,0 %
 *          55      39,3     39,3      0,0 %
 *          65      42,3     43,1      1,9 %
 *          75      42,3     47,0     11,1 %
 *          85      42,3     50,8     20,1 %
 *
 * Taket biter bara när råkonditionen ligger ÖVER det. Före §3.0 låg bästa
 * elvan på 26,8 i snitt — långt under seasonForm 60:s tak på 63 — och då var
 * periodiseringen bokstavligen kosmetisk: seasonForm kunde inte påverka
 * någonting alls. Det, inte mekanikens magnituder, är förklaringen till att
 * §4.1:s schemalagda periodisering förlorade mot att inte göra något.
 *
 * Efter §3.0 ligger elvan på 65,4 och taket börjar bita. §4.1 ska därför köras
 * om ovanpå den nya baslinjen, aldrig mot de gamla konstanterna.
 */
import { describe, it, expect } from 'vitest'
import { evaluateSquad } from '../squadEvaluator'
import { SEASON_FORM_FITNESS_SLACK } from '../periodisationService'
import { PlayerPosition, PlayerArchetype } from '../../enums'
import type { Player } from '../../entities/Player'
import type { Tactic } from '../../entities/Club'

let pid = 0
function makePlayer(position: PlayerPosition, fitness: number, seasonForm: number): Player {
  const id = `p${++pid}`
  const isGK = position === PlayerPosition.Goalkeeper
  const ca = 65
  return {
    id, firstName: 'Test', lastName: id, age: 26, nationality: 'SWE',
    clubId: 'club', academyClubId: undefined, isHomegrown: false,
    position, archetype: isGK ? PlayerArchetype.ReflexGoalkeeper : PlayerArchetype.TwoWaySkater,
    salary: 0, contractUntilSeason: 2, marketValue: 0,
    morale: 70, form: 70, fitness, sharpness: 90, seasonForm, isFullTimePro: false,
    currentAbility: ca, potentialAbility: ca, developmentRate: 50, injuryProneness: 50, discipline: 70,
    attributes: {
      skating: ca, acceleration: ca, stamina: ca, ballControl: ca, passing: ca, shooting: ca,
      dribbling: ca, vision: ca, decisions: ca, workRate: ca, positioning: ca, defending: ca,
      cornerSkill: ca, goalkeeping: isGK ? ca + 20 : 20, cornerRecovery: ca,
    },
    isInjured: false, injuryDaysRemaining: 0, suspensionGamesRemaining: 0,
    isCharacterPlayer: false, trait: undefined,
    seasonStats: { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0 },
    careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 0 },
    careerMilestones: [],
  } as Player
}

const TACTIC = {
  mentality: 'balanced', tempo: 'normal', formation: '532_tvatoppar',
  width: 'normal', attackingFocus: 'mixed', cornerStrategy: 'standard',
  passingRisk: 'safe', penaltyKillStyle: 'active',
} as unknown as Tactic

function squad(fitness: number, seasonForm: number): Player[] {
  pid = 0
  const P = PlayerPosition
  return [P.Goalkeeper, P.Defender, P.Defender, P.Defender, P.Half, P.Half, P.Half,
    P.Forward, P.Forward, P.Forward, P.Forward].map(pos => makePlayer(pos, fitness, seasonForm))
}

/** Procentuell skillnad i anfallsstyrka mellan seasonForm 85 och 60. */
function seasonFormGain(fitness: number): number {
  const low = evaluateSquad(squad(fitness, 60), TACTIC).offenseScore
  const high = evaluateSquad(squad(fitness, 85), TACTIC).offenseScore
  return (high - low) / low * 100
}

describe('§4.2 — seasonForm når matchresultatet, men bara över konditionstaket', () => {
  it('vid den konditionsnivå §3.0 kalibrerade mot är skillnaden långt över 2 % — periodiseringen är inte kosmetisk', () => {
    // §3.0:s mål: en ordinarie ligger i jämvikt 65–70, toppen av truppen högre.
    expect(seasonFormGain(85)).toBeGreaterThan(2)
    expect(seasonFormGain(75)).toBeGreaterThan(2)
  })

  it('under taket gör seasonForm ingenting alls — det var därför §4.1 förlorade mot att inte göra något', () => {
    // Före §3.0 låg bästa elvan på 26,8 i snitt. min(fitness, seasonForm + SLACK)
    // valde då ALLTID fitness, oavsett seasonForm.
    expect(seasonFormGain(45)).toBe(0)
    expect(seasonFormGain(55)).toBe(0)
  })

  it('brytpunkten ligger där råkonditionen passerar seasonForm + SLACK', () => {
    const lowSeasonFormCap = 60 + SEASON_FORM_FITNESS_SLACK
    expect(seasonFormGain(lowSeasonFormCap - 5)).toBe(0)
    expect(seasonFormGain(lowSeasonFormCap + 5)).toBeGreaterThan(0)
  })
})
