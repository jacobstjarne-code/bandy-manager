import type { ClubExpectation, ClubStyle, TacticMentality, TacticTempo, TacticPress, TacticPassingRisk, TacticWidth, TacticAttackingFocus, CornerStrategy, PenaltyKillStyle } from '../enums'
import type { FormationType, FormationSlot } from './Formation'

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
  positionAssignments?: Record<string, FormationSlot>   // key = playerId
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

  activeTactic: Tactic
  squadPlayerIds: string[]
}
