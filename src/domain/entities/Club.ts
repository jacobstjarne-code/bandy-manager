import type { ClubExpectation, ClubStyle, TacticMentality, TacticTempo, TacticPress, TacticPassingRisk, TacticWidth, TacticAttackingFocus, CornerStrategy, PenaltyKillStyle } from '../enums'
import type { FormationType } from './Formation'

export interface BoardMember {
  firstName: string
  lastName: string
  age: number          // ålder vid spelstart (säsong 1)
  gender: 'm' | 'f'    // för pronomen i beats
}

export interface ClubBoard {
  chairman: BoardMember   // ordförande
  treasurer: BoardMember  // kassör
  member: BoardMember     // ledamot
}

export interface Tactic {
  mentality: TacticMentality
  tempo: TacticTempo
  press: TacticPress
  passingRisk: TacticPassingRisk
  width: TacticWidth
  attackingFocus: TacticAttackingFocus
  cornerStrategy: CornerStrategy
  penaltyKillStyle: PenaltyKillStyle
  formation?: FormationType
  lineupSlots?: Record<string, string | null>  // slotId → playerId | null
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
  board?: ClubBoard
  clubhouse?: string
}
