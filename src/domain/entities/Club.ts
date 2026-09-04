import type { ClubExpectation, ClubStyle, TacticMentality, TacticTempo, TacticPassingRisk, TacticWidth, TacticAttackingFocus, CornerStrategy, PenaltyKillStyle } from '../enums'
import type { FormationType } from './Formation'

// KF4 (2026-06-21): EN styrelsemodell. Tidigare fanns club.board (ClubBoard-trippel,
// namn/kön/ålder) OCH game.boardPersonalities (BoardMember med name/role/personality) —
// två okopplade källor som gav ordföranden två namn. Nu bär varje medlem allt:
// namn/kön/ålder (från CLUB_TEMPLATES, handskrivna namn vinner) + roll + personlighet.
// Bor på game.board: BoardMember[]. ClubBoard utgår; Community.BoardMember raderad.
export type BoardRole = 'ordförande' | 'kassör' | 'ledamot'
export type BoardPersonality = 'supporter' | 'ekonom' | 'traditionalist' | 'modernist'

export interface BoardMember {
  id: string           // stabil: `${role}-${index}`, t.ex. 'ordforande-0'
  firstName: string
  lastName: string
  age: number          // ålder vid spelstart (säsong 1)
  gender: 'm' | 'f'    // för pronomen i beats
  role: BoardRole
  personality: BoardPersonality
}

/**
 * DOM_FORMATIONER_V2_2026-09-04.md: `press` borttaget som eget fält — sju
 * axlar kvar. Höjdläget (tidigare press-effekten) bärs nu av formationen
 * (se getHeightMode i Formation.ts), härlett vid behov, aldrig lagrat här.
 */
export interface Tactic {
  mentality: TacticMentality
  tempo: TacticTempo
  passingRisk: TacticPassingRisk
  width: TacticWidth
  attackingFocus: TacticAttackingFocus
  cornerStrategy: CornerStrategy
  penaltyKillStyle: PenaltyKillStyle
  formation?: FormationType
  lineupSlots?: Record<string, string | null>  // slotId → playerId | null
}

/**
 * O15 (2026-08-18/19): "Vad du ändrat i år" — avancerat lägets ändringshistorik.
 * Ett entry per matchday som haft minst en diff mot senast spelade matchens
 * tactic-snapshot (Fixture.homeLineup/awayLineup.tactic). Skrivs i gameStore.ts
 * updateTactic() genom att diffa mot den baslinjen (samma källa som delta-raden
 * i standardläget använder) — inte mot föregående updateTactic-anrop, så
 * ångrade ändringar inom samma omgång inte lämnar spökrader. `value` är
 * Tactic[key] rådatan; presentation (tacticData.ts) slår upp visningsnamnet
 * via tacticRows vid render.
 */
export interface TacticChangeLogEntry {
  matchday: number
  changes: { key: keyof Tactic; value: string }[]
}

export interface Club {
  id: string
  name: string
  shortName: string
  region: string
  reputation: number     // 0-100
  finances: number
  wageBudget: number
  transferBudget: number

  youthQuality: number        // 0-100
  youthRecruitment: number    // 0-100
  youthDevelopment: number    // 0-100
  facilities: number          // 0-100

  boardExpectation: ClubExpectation
  /**
   * DOM_BOARDEXPEKTAN_TROGHET_2026-08-31.md: räknar SÄSONGER I RAD där
   * expectationVerdictFromRating gav 'failed' mot boardExpectation — skild
   * från consecutiveFailures (som räknar botten-2, den separata avskeds-
   * vägen). "Under förväntan" är inte samma sak som "i nedflyttningszon".
   * Nollställs av 'met'/'exceeded'. Vid TROGHET_THRESHOLD (boardService.ts)
   * demoteras klubben ETT steg i EXPECTATION_LADDER och räknaren nollställs
   * — löser en klubb som fastnar för bra för nedgradering (botten-3) men
   * inte bra nog för sin nuvarande höga förväntan (t.ex. WinLeague, som
   * binärt kräver 1:a plats). Default 0 för nya/gamla saves (migration).
   */
  consecutiveExpectationMisses?: number
  fanExpectation: ClubExpectation
  preferredStyle: ClubStyle
  hasArtificialIce: boolean   // förberedd för V0.2 vädersystem
  hasIndoorArena?: boolean
  arenaCapacity?: number
  arenaName?: string

  activeTactic: Tactic
  squadPlayerIds: string[]
  academyReputation?: number  // 0-100
  opponentManager?: {
    name: string
    persona: 'confident' | 'defensive' | 'cryptic' | 'professorial'
    yearsAtClub: number
  }
  clubhouse?: string
}
