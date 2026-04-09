import type { Club } from '../entities/Club'
import type { YouthTeam, YouthPlayer, YouthMatchResult, AcademyLevel } from '../entities/Academy'
import { PlayerPosition, PlayerArchetype } from '../enums'
import { clamp } from '../utils/clamp'
import { mulberry32 } from '../utils/random'
import { PLAYER_FIRST_NAMES, PLAYER_LAST_NAMES } from '../data/playerNames'

// Fictional opposing youth teams from Swedish bandy regions
const YOUTH_OPPONENTS = [
  'Norrala P19', 'Gagnefs P19', 'Bollnäs P19', 'Alfta P19', 'Delsbo P19',
  'Smedjebackens P19', 'Rättvik P19', 'Malung P19', 'Haninge P19', 'Hammarby P19',
  'Enebybergs P19', 'Borlänge P19', 'Hedemora P19', 'Norberg P19', 'Fagersta P19',
]

const YOUTH_POSITION_POOL: PlayerPosition[] = [
  PlayerPosition.Goalkeeper,
  PlayerPosition.Defender, PlayerPosition.Defender,
  PlayerPosition.Half, PlayerPosition.Half,
  PlayerPosition.Midfielder, PlayerPosition.Midfielder,
  PlayerPosition.Forward, PlayerPosition.Forward, PlayerPosition.Forward,
]

function pickRand<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)]
}


function archetypeForPosition(pos: PlayerPosition, rand: () => number): PlayerArchetype {
  const r = rand()
  switch (pos) {
    case PlayerPosition.Goalkeeper:
      return r < 0.5 ? PlayerArchetype.ReflexGoalkeeper : PlayerArchetype.PositionalGoalkeeper
    case PlayerPosition.Defender:
      return r < 0.5 ? PlayerArchetype.DefensiveWorker : r < 0.8 ? PlayerArchetype.TwoWaySkater : PlayerArchetype.CornerSpecialist
    case PlayerPosition.Half:
      return r < 0.4 ? PlayerArchetype.TwoWaySkater : r < 0.7 ? PlayerArchetype.Playmaker : PlayerArchetype.DefensiveWorker
    case PlayerPosition.Midfielder:
      return r < 0.35 ? PlayerArchetype.Playmaker : r < 0.65 ? PlayerArchetype.TwoWaySkater : r < 0.85 ? PlayerArchetype.Dribbler : PlayerArchetype.CornerSpecialist
    case PlayerPosition.Forward:
      return r < 0.4 ? PlayerArchetype.Finisher : r < 0.7 ? PlayerArchetype.Dribbler : r < 0.9 ? PlayerArchetype.Playmaker : PlayerArchetype.RawTalent
    default:
      return PlayerArchetype.TwoWaySkater
  }
}

function getPADistribution(academyLevel: AcademyLevel, youthQuality: number, rand: () => number): number {
  const qualityBonus = (youthQuality - 50) / 10  // -5 to +5
  const r = rand()
  const eliteChance = academyLevel === 'elite' ? 0.15 : academyLevel === 'developing' ? 0.10 : 0.05
  const promisingChance = academyLevel === 'elite' ? 0.35 : academyLevel === 'developing' ? 0.30 : 0.25

  if (r < eliteChance) {
    return clamp(Math.round(70 + rand() * 20 + qualityBonus * 2), 70, 90)
  } else if (r < eliteChance + promisingChance) {
    return clamp(Math.round(50 + rand() * 20 + qualityBonus), 50, 70)
  } else {
    return clamp(Math.round(30 + rand() * 20 + qualityBonus), 30, 50)
  }
}


export function generateYouthTeam(
  club: Club,
  academyLevel: AcademyLevel,
  season: number,
  seed: number,
): YouthTeam {
  const rand = mulberry32(seed)
  const count = academyLevel === 'elite' ? 12 : academyLevel === 'developing' ? 10 : 8

  const caFloor = academyLevel === 'elite' ? 20 : academyLevel === 'developing' ? 15 : 10
  const caCeiling = academyLevel === 'elite' ? 30 : academyLevel === 'developing' ? 25 : 20

  const players: YouthPlayer[] = []
  for (let i = 0; i < count; i++) {
    const position = YOUTH_POSITION_POOL[i % YOUTH_POSITION_POOL.length]
    const age = 15 + Math.floor(rand() * 5)  // 15–19
    const pa = getPADistribution(academyLevel, club.youthQuality, rand)
    const ca = clamp(Math.round(caFloor + rand() * (caCeiling - caFloor)), caFloor, Math.min(pa - 5, caCeiling + 5))
    const devRate = clamp(Math.round(30 + rand() * 50 + (club.youthDevelopment - 50) / 5), 20, 80)

    players.push({
      id: `youth_${season}_${club.id}_${i}`,
      firstName: pickRand(PLAYER_FIRST_NAMES, rand),
      lastName: pickRand(PLAYER_LAST_NAMES, rand),
      age,
      position,
      archetype: archetypeForPosition(position, rand),
      currentAbility: ca,
      potentialAbility: pa,
      developmentRate: devRate,
      confidence: clamp(Math.round(40 + rand() * 40), 30, 80),
      schoolConflict: rand() < 0.40,
      seasonGoals: 0,
      seasonAssists: 0,
      readyForPromotion: false,
    })
  }

  return {
    players,
    results: [],
    seasonRecord: { w: 0, d: 0, l: 0, gf: 0, ga: 0 },
    tablePosition: Math.ceil(rand() * 8),  // initial random position
  }
}

export interface YouthSimResult {
  matchResult: YouthMatchResult
  updatedPlayers: YouthPlayer[]
  updatedRecord: YouthTeam['seasonRecord']
  updatedPosition: number
}

export function simulateYouthMatch(
  team: YouthTeam,
  academyLevel: AcademyLevel,
  rand: () => number,
  round: number,
): YouthSimResult {
  // Team strength affects win probability
  const avgCA = team.players.length > 0
    ? team.players.reduce((s, p) => s + p.currentAbility, 0) / team.players.length
    : 15
  const avgConf = team.players.length > 0
    ? team.players.reduce((s, p) => s + p.confidence, 0) / team.players.length
    : 50

  const levelBonus = academyLevel === 'elite' ? 8 : academyLevel === 'developing' ? 4 : 0
  const strength = (avgCA + levelBonus + avgConf * 0.2) / 40  // rough 0-1 scale

  const r = rand()
  const winChance = clamp(0.25 + strength * 0.4, 0.2, 0.65)
  const drawChance = 0.20

  let goalsFor: number
  let goalsAgainst: number

  if (r < winChance) {
    goalsFor = 2 + Math.floor(rand() * 4)
    goalsAgainst = Math.floor(rand() * (goalsFor - 1))
  } else if (r < winChance + drawChance) {
    goalsFor = 1 + Math.floor(rand() * 3)
    goalsAgainst = goalsFor
  } else {
    goalsAgainst = 2 + Math.floor(rand() * 4)
    goalsFor = Math.floor(rand() * (goalsAgainst - 1))
  }

  const won = goalsFor > goalsAgainst
  const drew = goalsFor === goalsAgainst

  // Pick scorers from forwards + midfielders
  const attackers = team.players.filter(p =>
    p.position === PlayerPosition.Forward || p.position === PlayerPosition.Midfielder
  )
  const scorers: string[] = []
  for (let i = 0; i < goalsFor && attackers.length > 0; i++) {
    const scorer = attackers[Math.floor(rand() * attackers.length)]
    scorers.push(scorer.firstName)
  }

  const bestPlayerIdx = Math.floor(rand() * team.players.length)
  const bestPlayer = team.players[bestPlayerIdx]?.firstName

  const opponent = YOUTH_OPPONENTS[Math.floor(rand() * YOUTH_OPPONENTS.length)]

  const result: YouthMatchResult = {
    round,
    opponentName: opponent,
    goalsFor,
    goalsAgainst,
    scorers: [...new Set(scorers)],
    bestPlayer,
  }

  // Update player confidence based on result
  const confidenceDelta = won ? 2 : drew ? 0 : -1
  const updatedPlayers = team.players.map((p) => {
    const goalCount = scorers.filter(n => n === p.firstName).length
    const newGoals = p.seasonGoals + goalCount
    const newConf = clamp(p.confidence + confidenceDelta + (goalCount > 0 ? 2 : 0), 10, 100)

    // Small CA growth each match
    const devGain = (p.developmentRate / 100) * 0.3 * (won ? 1.1 : drew ? 1.0 : 0.9)
    const newCA = clamp(p.currentAbility + devGain, p.currentAbility, p.potentialAbility * 0.95)

    const readyForPromotion = newCA >= 25 && newConf >= 50

    return {
      ...p,
      confidence: newConf,
      currentAbility: Math.round(newCA * 10) / 10,
      seasonGoals: newGoals,
      readyForPromotion,
    }
  })

  const oldRecord = team.seasonRecord
  const updatedRecord = {
    w: oldRecord.w + (won ? 1 : 0),
    d: oldRecord.d + (drew ? 1 : 0),
    l: oldRecord.l + (!won && !drew ? 1 : 0),
    gf: oldRecord.gf + goalsFor,
    ga: oldRecord.ga + goalsAgainst,
  }

  // Update table position (rough estimate)
  const points = updatedRecord.w * 3 + updatedRecord.d
  const totalGames = updatedRecord.w + updatedRecord.d + updatedRecord.l
  const pointsPerGame = totalGames > 0 ? points / totalGames : 0
  const updatedPosition = clamp(Math.round(12 - pointsPerGame * 4), 1, 12)

  return { matchResult: result, updatedPlayers, updatedRecord, updatedPosition }
}
