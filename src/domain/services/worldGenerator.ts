import type { Club, Tactic } from '../entities/Club'
import type { Player, PlayerAttributes, PlayerSeasonStats, PlayerCareerStats, PlayerDayJob } from '../entities/Player'
import {
  PlayerPosition,
  PlayerArchetype,
  ClubExpectation,
  ClubStyle,
  TacticMentality,
  TacticTempo,
  TacticPress,
  TacticPassingRisk,
  TacticWidth,
  TacticAttackingFocus,
  CornerStrategy,
  PenaltyKillStyle,
} from '../enums'
import { mulberry32 } from '../utils/random'
import { calculateMarketValue } from './marketValueService'
import { clamp } from '../utils/clamp'
import { PLAYER_FIRST_NAMES, PLAYER_LAST_NAMES } from '../data/playerNames'

interface GeneratedWorld {
  clubs: Club[]
  players: Player[]
}

function makeRng(seed: number) {
  const rand = mulberry32(seed)
  return {
    next: rand,
    int: (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min,
    float: (min: number, max: number) => rand() * (max - min) + min,
    pick: <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)],
    shuffle: <T>(arr: T[]): T[] => {
      const a = [...arr]
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]]
      }
      return a
    },
  }
}


function buildTactic(style: ClubStyle): Tactic {
  switch (style) {
    case ClubStyle.Defensive:
      return {
        mentality: TacticMentality.Defensive,
        tempo: TacticTempo.Low,
        press: TacticPress.Low,
        passingRisk: TacticPassingRisk.Safe,
        width: TacticWidth.Narrow,
        attackingFocus: TacticAttackingFocus.Central,
        cornerStrategy: CornerStrategy.Safe,
        penaltyKillStyle: PenaltyKillStyle.Passive,
      }
    case ClubStyle.Balanced:
      return {
        mentality: TacticMentality.Balanced,
        tempo: TacticTempo.Normal,
        press: TacticPress.Medium,
        passingRisk: TacticPassingRisk.Mixed,
        width: TacticWidth.Normal,
        attackingFocus: TacticAttackingFocus.Mixed,
        cornerStrategy: CornerStrategy.Standard,
        penaltyKillStyle: PenaltyKillStyle.Active,
        formation: '5-3-2',
      }
    case ClubStyle.Attacking:
      return {
        mentality: TacticMentality.Offensive,
        tempo: TacticTempo.High,
        press: TacticPress.Medium,
        passingRisk: TacticPassingRisk.Mixed,
        width: TacticWidth.Wide,
        attackingFocus: TacticAttackingFocus.Wings,
        cornerStrategy: CornerStrategy.Aggressive,
        penaltyKillStyle: PenaltyKillStyle.Active,
      }
    case ClubStyle.Physical:
      return {
        mentality: TacticMentality.Balanced,
        tempo: TacticTempo.Normal,
        press: TacticPress.High,
        passingRisk: TacticPassingRisk.Direct,
        width: TacticWidth.Narrow,
        attackingFocus: TacticAttackingFocus.Central,
        cornerStrategy: CornerStrategy.Standard,
        penaltyKillStyle: PenaltyKillStyle.Aggressive,
      }
    case ClubStyle.Technical:
      return {
        mentality: TacticMentality.Balanced,
        tempo: TacticTempo.Normal,
        press: TacticPress.Medium,
        passingRisk: TacticPassingRisk.Safe,
        width: TacticWidth.Normal,
        attackingFocus: TacticAttackingFocus.Mixed,
        cornerStrategy: CornerStrategy.Aggressive,
        penaltyKillStyle: PenaltyKillStyle.Active,
      }
  }
}

interface ClubTemplate {
  id: string
  name: string
  shortName: string
  region: string
  reputation: number
  finances: number
  wageBudget: number
  transferBudget: number
  youthQuality: number
  youthRecruitment: number
  youthDevelopment: number
  facilities: number
  hasArtificialIce: boolean
  boardExpectation: ClubExpectation
  preferredStyle: ClubStyle
}

export const CLUB_TEMPLATES: ClubTemplate[] = [
  {
    id: 'club_sandviken',
    name: 'Forsbacka BK',
    shortName: 'Forsbacka',
    region: 'Gävleborg',
    reputation: 85,
    finances: 800000,
    wageBudget: 120000,
    transferBudget: 80000,
    youthQuality: 75,
    youthRecruitment: 70,
    youthDevelopment: 72,
    facilities: 80,
    hasArtificialIce: true,
    boardExpectation: ClubExpectation.WinLeague,
    preferredStyle: ClubStyle.Technical,
  },
  {
    id: 'club_sirius',
    name: 'Söderfors BK',
    shortName: 'Söderfors',
    region: 'Uppland',
    reputation: 55,
    finances: 350000,
    wageBudget: 60000,
    transferBudget: 30000,
    youthQuality: 52,
    youthRecruitment: 48,
    youthDevelopment: 50,
    facilities: 52,
    hasArtificialIce: false,
    boardExpectation: ClubExpectation.MidTable,
    preferredStyle: ClubStyle.Balanced,
  },
  {
    id: 'club_vasteras',
    name: 'Västanfors IF',
    shortName: 'Västanfors',
    region: 'Västmanland',
    reputation: 78,
    finances: 650000,
    wageBudget: 100000,
    transferBudget: 60000,
    youthQuality: 70,
    youthRecruitment: 65,
    youthDevelopment: 68,
    facilities: 75,
    hasArtificialIce: true,
    boardExpectation: ClubExpectation.ChallengeTop,
    preferredStyle: ClubStyle.Attacking,
  },
  {
    id: 'club_broberg',
    name: 'Karlsborgs BK',
    shortName: 'Karlsborg',
    region: 'Dalarna',
    reputation: 68,
    finances: 400000,
    wageBudget: 75000,
    transferBudget: 35000,
    youthQuality: 65,
    youthRecruitment: 60,
    youthDevelopment: 63,
    facilities: 65,
    hasArtificialIce: false,
    boardExpectation: ClubExpectation.ChallengeTop,
    preferredStyle: ClubStyle.Balanced,
  },
  {
    id: 'club_villa',
    name: 'Målilla GoIF',
    shortName: 'Målilla',
    region: 'Småland',
    reputation: 65,
    finances: 380000,
    wageBudget: 70000,
    transferBudget: 30000,
    youthQuality: 62,
    youthRecruitment: 58,
    youthDevelopment: 60,
    facilities: 62,
    hasArtificialIce: true,
    boardExpectation: ClubExpectation.MidTable,
    preferredStyle: ClubStyle.Technical,
  },
  {
    id: 'club_falun',
    name: 'Gagnefs IF',
    shortName: 'Gagnef',
    region: 'Dalarna',
    reputation: 63,
    finances: 350000,
    wageBudget: 68000,
    transferBudget: 28000,
    youthQuality: 60,
    youthRecruitment: 55,
    youthDevelopment: 58,
    facilities: 60,
    hasArtificialIce: false,
    boardExpectation: ClubExpectation.MidTable,
    preferredStyle: ClubStyle.Physical,
  },
  {
    id: 'club_ljusdal',
    name: 'Hälleforsnäs IF',
    shortName: 'Hälleforsnäs',
    region: 'Södermanland',
    reputation: 60,
    finances: 300000,
    wageBudget: 62000,
    transferBudget: 22000,
    youthQuality: 58,
    youthRecruitment: 52,
    youthDevelopment: 55,
    facilities: 58,
    hasArtificialIce: false,
    boardExpectation: ClubExpectation.MidTable,
    preferredStyle: ClubStyle.Balanced,
  },
  {
    id: 'club_edsbyn',
    name: 'Lesjöfors IF',
    shortName: 'Lesjöfors',
    region: 'Värmland',
    reputation: 62,
    finances: 320000,
    wageBudget: 65000,
    transferBudget: 25000,
    youthQuality: 60,
    youthRecruitment: 54,
    youthDevelopment: 57,
    facilities: 60,
    hasArtificialIce: false,
    boardExpectation: ClubExpectation.MidTable,
    preferredStyle: ClubStyle.Defensive,
  },
  {
    id: 'club_tillberga',
    name: 'Rögle BK',
    shortName: 'Rögle',
    region: 'Skåne',
    reputation: 50,
    finances: 200000,
    wageBudget: 48000,
    transferBudget: 12000,
    youthQuality: 50,
    youthRecruitment: 45,
    youthDevelopment: 48,
    facilities: 50,
    hasArtificialIce: false,
    boardExpectation: ClubExpectation.AvoidBottom,
    preferredStyle: ClubStyle.Defensive,
  },
  {
    id: 'club_kungalv',
    name: 'Slottsbrons IF',
    shortName: 'Slottsbron',
    region: 'Värmland',
    reputation: 48,
    finances: 180000,
    wageBudget: 45000,
    transferBudget: 10000,
    youthQuality: 48,
    youthRecruitment: 42,
    youthDevelopment: 45,
    facilities: 48,
    hasArtificialIce: false,
    boardExpectation: ClubExpectation.AvoidBottom,
    preferredStyle: ClubStyle.Balanced,
  },
  {
    id: 'club_skutskar',
    name: 'Skutskärs IF',
    shortName: 'Skutskär',
    region: 'Uppland',
    reputation: 52,
    finances: 210000,
    wageBudget: 50000,
    transferBudget: 14000,
    youthQuality: 52,
    youthRecruitment: 47,
    youthDevelopment: 50,
    facilities: 52,
    hasArtificialIce: false,
    boardExpectation: ClubExpectation.AvoidBottom,
    preferredStyle: ClubStyle.Physical,
  },
  {
    id: 'club_soderhamns',
    name: 'Heros BK',
    shortName: 'Heros',
    region: 'Hälsingland',
    reputation: 45,
    finances: 160000,
    wageBudget: 42000,
    transferBudget: 8000,
    youthQuality: 45,
    youthRecruitment: 40,
    youthDevelopment: 42,
    facilities: 45,
    hasArtificialIce: false,
    boardExpectation: ClubExpectation.AvoidBottom,
    preferredStyle: ClubStyle.Defensive,
  },
]

// Position distribution: 2 GK, 5 DEF, 5 HALF, 5 MID, 5 FWD = 22
const POSITION_POOL: PlayerPosition[] = [
  PlayerPosition.Goalkeeper, PlayerPosition.Goalkeeper,
  PlayerPosition.Defender, PlayerPosition.Defender, PlayerPosition.Defender, PlayerPosition.Defender, PlayerPosition.Defender,
  PlayerPosition.Half, PlayerPosition.Half, PlayerPosition.Half, PlayerPosition.Half, PlayerPosition.Half,
  PlayerPosition.Midfielder, PlayerPosition.Midfielder, PlayerPosition.Midfielder, PlayerPosition.Midfielder, PlayerPosition.Midfielder,
  PlayerPosition.Forward, PlayerPosition.Forward, PlayerPosition.Forward, PlayerPosition.Forward, PlayerPosition.Forward,
]

// Age distribution — 22 entries matching the position pool size
const AGE_DISTRIBUTION = [17, 18, 19, 19, 20, 21, 22, 22, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 30, 31]

function pickArchetype(
  rng: ReturnType<typeof makeRng>,
  position: PlayerPosition,
): PlayerArchetype {
  const r = rng.next()
  switch (position) {
    case PlayerPosition.Goalkeeper:
      return r < 0.5 ? PlayerArchetype.ReflexGoalkeeper : PlayerArchetype.PositionalGoalkeeper
    case PlayerPosition.Defender:
      if (r < 0.5) return PlayerArchetype.DefensiveWorker
      if (r < 0.8) return PlayerArchetype.TwoWaySkater
      return PlayerArchetype.CornerSpecialist
    case PlayerPosition.Half:
      if (r < 0.4) return PlayerArchetype.TwoWaySkater
      if (r < 0.7) return PlayerArchetype.Playmaker
      return PlayerArchetype.DefensiveWorker
    case PlayerPosition.Midfielder:
      if (r < 0.35) return PlayerArchetype.Playmaker
      if (r < 0.65) return PlayerArchetype.TwoWaySkater
      if (r < 0.85) return PlayerArchetype.Dribbler
      return PlayerArchetype.CornerSpecialist
    case PlayerPosition.Forward:
      if (r < 0.4) return PlayerArchetype.Finisher
      if (r < 0.7) return PlayerArchetype.Dribbler
      if (r < 0.9) return PlayerArchetype.Playmaker
      return PlayerArchetype.RawTalent
  }
}

function generateAttributes(
  rng: ReturnType<typeof makeRng>,
  archetype: PlayerArchetype,
  reputation: number,
): PlayerAttributes {
  const base = clamp(reputation * 0.7 + rng.float(-10, 10), 20, 95)

  const attrs: PlayerAttributes = {
    skating: Math.round(base),
    acceleration: Math.round(base),
    stamina: Math.round(base),
    ballControl: Math.round(base),
    passing: Math.round(base),
    shooting: Math.round(base),
    dribbling: Math.round(base),
    vision: Math.round(base),
    decisions: Math.round(base),
    workRate: Math.round(base),
    positioning: Math.round(base),
    defending: Math.round(base),
    cornerSkill: Math.round(base),
    goalkeeping: Math.round(base),
  }

  // Apply archetype bonuses and GK penalty
  const isGK =
    archetype === PlayerArchetype.ReflexGoalkeeper ||
    archetype === PlayerArchetype.PositionalGoalkeeper

  // For GK, first reduce all outfield-relevant stats
  if (isGK) {
    const fieldAttrs: (keyof PlayerAttributes)[] = [
      'skating', 'acceleration', 'stamina', 'ballControl', 'passing', 'shooting',
      'dribbling', 'vision', 'decisions', 'workRate', 'positioning', 'defending', 'cornerSkill',
    ]
    for (const attr of fieldAttrs) {
      attrs[attr] = clamp(attrs[attr] - 15, 1, 99)
    }
  } else {
    // Non-GK: reduce goalkeeping
    attrs.goalkeeping = clamp(attrs.goalkeeping - 15, 1, 99)
  }

  switch (archetype) {
    case PlayerArchetype.ReflexGoalkeeper:
      attrs.goalkeeping = clamp(attrs.goalkeeping + 20, 1, 99)
      attrs.skating = clamp(attrs.skating + 5, 1, 99)
      attrs.acceleration = clamp(attrs.acceleration + 10, 1, 99)
      break
    case PlayerArchetype.PositionalGoalkeeper:
      attrs.goalkeeping = clamp(attrs.goalkeeping + 20, 1, 99)
      attrs.positioning = clamp(attrs.positioning + 15, 1, 99)
      attrs.decisions = clamp(attrs.decisions + 10, 1, 99)
      break
    case PlayerArchetype.DefensiveWorker:
      attrs.defending = clamp(attrs.defending + 20, 1, 99)
      attrs.workRate = clamp(attrs.workRate + 15, 1, 99)
      attrs.stamina = clamp(attrs.stamina + 10, 1, 99)
      attrs.positioning = clamp(attrs.positioning + 10, 1, 99)
      break
    case PlayerArchetype.TwoWaySkater:
      attrs.skating = clamp(attrs.skating + 15, 1, 99)
      attrs.stamina = clamp(attrs.stamina + 15, 1, 99)
      attrs.defending = clamp(attrs.defending + 10, 1, 99)
      attrs.workRate = clamp(attrs.workRate + 10, 1, 99)
      break
    case PlayerArchetype.Playmaker:
      attrs.passing = clamp(attrs.passing + 20, 1, 99)
      attrs.vision = clamp(attrs.vision + 20, 1, 99)
      attrs.decisions = clamp(attrs.decisions + 15, 1, 99)
      attrs.ballControl = clamp(attrs.ballControl + 10, 1, 99)
      break
    case PlayerArchetype.Finisher:
      attrs.shooting = clamp(attrs.shooting + 20, 1, 99)
      attrs.acceleration = clamp(attrs.acceleration + 15, 1, 99)
      attrs.decisions = clamp(attrs.decisions + 10, 1, 99)
      attrs.positioning = clamp(attrs.positioning + 10, 1, 99)
      break
    case PlayerArchetype.Dribbler:
      attrs.dribbling = clamp(attrs.dribbling + 20, 1, 99)
      attrs.ballControl = clamp(attrs.ballControl + 15, 1, 99)
      attrs.acceleration = clamp(attrs.acceleration + 15, 1, 99)
      attrs.skating = clamp(attrs.skating + 5, 1, 99)
      break
    case PlayerArchetype.CornerSpecialist:
      attrs.cornerSkill = clamp(attrs.cornerSkill + 25, 1, 99)
      attrs.passing = clamp(attrs.passing + 15, 1, 99)
      attrs.vision = clamp(attrs.vision + 10, 1, 99)
      break
    case PlayerArchetype.RawTalent: {
      const allKeys = Object.keys(attrs) as (keyof PlayerAttributes)[]
      // Reduce all first
      for (const k of allKeys) {
        attrs[k] = clamp(attrs[k] - 10, 1, 99)
      }
      // Boost 2-3 random attributes
      const shuffled = [...allKeys].sort(() => rng.next() - 0.5)
      const boostCount = rng.int(2, 3)
      for (let i = 0; i < boostCount; i++) {
        attrs[shuffled[i]] = clamp(attrs[shuffled[i]] + rng.int(15, 25), 1, 99)
      }
      break
    }
  }

  return attrs
}

const DAY_JOB_TITLES = [
  'Lärare', 'Snickare', 'IT-konsult', 'Polis', 'Sjuksköterska', 'Elektriker',
  'Ingenjör', 'Säljare', 'Lastbilsförare', 'Brandman', 'Byggnadsarbetare',
  'Systemutvecklare', 'Ekonom', 'Mekaniker', 'Personlig tränare',
]

function generateDayJobForPlayer(
  rng: ReturnType<typeof makeRng>,
  reputation: number,
): { isFullTimePro: boolean; dayJob?: PlayerDayJob } {
  const roll = rng.next()

  let isFullTimePro: boolean
  let flexMin: number
  let flexMax: number

  if (reputation > 70) {
    isFullTimePro = roll < 0.5
    flexMin = 80; flexMax = 100
  } else if (reputation >= 50) {
    isFullTimePro = roll < 0.2
    flexMin = 65; flexMax = 90
  } else {
    isFullTimePro = roll < 0.05
    flexMin = 50; flexMax = 80
  }

  if (isFullTimePro) {
    return { isFullTimePro: true }
  }

  const title = rng.pick(DAY_JOB_TITLES)
  const flexibility = rng.int(flexMin, flexMax)
  let weeklyIncome = Math.round(1000 + rng.next() * 2000)
  if (flexibility < 65) weeklyIncome += 500

  return {
    isFullTimePro: false,
    dayJob: { title, flexibility, weeklyIncome },
  }
}

function tierFromReputation(reputation: number): 'top' | 'mid' | 'under' {
  if (reputation >= 75) return 'top'
  if (reputation >= 55) return 'mid'
  return 'under'
}

function generatePlayer(
  rng: ReturnType<typeof makeRng>,
  clubId: string,
  index: number,
  position: PlayerPosition,
  age: number,
  reputation: number,
  season: number,
): Player {
  const archetype = pickArchetype(rng, position)
  const attributes = generateAttributes(rng, archetype, reputation)

  const tier = tierFromReputation(reputation)
  let caMin: number, caMax: number
  if (tier === 'top') { caMin = 55; caMax = 75 }
  else if (tier === 'mid') { caMin = 42; caMax = 62 }
  else { caMin = 30; caMax = 52 }

  let ca = rng.int(caMin, caMax) + rng.int(-8, 8)
  ca = clamp(ca, 20, 80)

  const paBonus = age <= 20 ? 5 : 0
  if (age <= 20) {
    ca = Math.round(ca * 0.6)
    ca = clamp(ca, 20, 80)
  }

  let pa = ca + rng.int(5, 30) + paBonus
  pa = clamp(pa, ca, 98)

  let devRate: number
  if (age <= 20) devRate = rng.int(65, 90)
  else if (age <= 25) devRate = rng.int(50, 75)
  else if (age <= 30) devRate = rng.int(30, 55)
  else devRate = rng.int(10, 30)

  const nationality = rng.next() < 0.8 ? 'svenska' : rng.pick(['norska', 'finska', 'ryska'])
  const isHomegrown = age <= 23 && nationality === 'svenska' ? true : rng.next() < 0.3

  const contractUntilSeason = season + rng.int(1, 3)
  const marketValue = calculateMarketValue(
    { age, currentAbility: ca, form: 60, contractUntilSeason } as Player,
    season,
  )

  const emptyStats: PlayerSeasonStats = {
    gamesPlayed: 0,
    goals: 0,
    assists: 0,
    cornerGoals: 0,
    penaltyGoals: 0,
    yellowCards: 0,
    redCards: 0,
    suspensions: 0,
    averageRating: 0,
    minutesPlayed: 0,
  }

  const emptyCareer: PlayerCareerStats = {
    totalGames: 0,
    totalGoals: 0,
    totalAssists: 0,
    seasonsPlayed: 0,
  }

  const isPhysical = archetype === PlayerArchetype.DefensiveWorker || archetype === PlayerArchetype.TwoWaySkater
  const isAggressive = archetype === PlayerArchetype.Finisher || archetype === PlayerArchetype.Dribbler

  const { isFullTimePro, dayJob } = generateDayJobForPlayer(rng, reputation)
  const salary = isFullTimePro
    ? clamp(ca * 200 + rng.int(-1000, 3000), 8000, 50000)
    : clamp(ca * 80 + rng.int(500, 2000), 2000, 12000)

  return {
    id: `player_${clubId}_${index}`,
    firstName: rng.pick(PLAYER_FIRST_NAMES),
    lastName: rng.pick(PLAYER_LAST_NAMES),
    age,
    nationality,
    clubId,
    academyClubId: isHomegrown ? clubId : undefined,
    isHomegrown,
    position,
    archetype,
    salary,
    contractUntilSeason,
    marketValue,
    morale: rng.int(50, 80),
    form: rng.int(50, 70),
    fitness: rng.int(60, 90),
    sharpness: rng.int(40, 80),
    currentAbility: ca,
    potentialAbility: pa,
    developmentRate: devRate,
    injuryProneness: isPhysical ? rng.int(20, 50) : rng.int(10, 40),
    discipline: isAggressive ? rng.int(40, 80) : rng.int(50, 90),
    attributes,
    isInjured: false,
    injuryDaysRemaining: 0,
    suspensionGamesRemaining: 0,
    seasonStats: emptyStats,
    careerStats: emptyCareer,
    isFullTimePro,
    dayJob,
    shirtNumber: index + 1,
  }
}

export function generateWorld(season: number, seed: number = 42): GeneratedWorld {
  const rng = makeRng(seed)

  const clubs: Club[] = CLUB_TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    shortName: t.shortName,
    region: t.region,
    reputation: t.reputation,
    finances: Math.round((t.reputation * 4000 + 50000 + rng.next() * 80000) / 10000) * 10000,
    wageBudget: t.wageBudget,
    transferBudget: Math.round((t.reputation * 1000 + rng.next() * 20000) / 5000) * 5000,
    youthQuality: t.youthQuality,
    youthRecruitment: t.youthRecruitment,
    youthDevelopment: t.youthDevelopment,
    facilities: t.facilities,
    hasArtificialIce: t.hasArtificialIce,
    boardExpectation: t.boardExpectation,
    fanExpectation: t.boardExpectation,
    preferredStyle: t.preferredStyle,
    activeTactic: buildTactic(t.preferredStyle),
    squadPlayerIds: [],
    arenaCapacity: Math.round((t.reputation * 25 + 600) / 500) * 500,
  }))

  const allPlayers: Player[] = []

  for (const club of clubs) {
    const positions = rng.shuffle([...POSITION_POOL])
    const ages = rng.shuffle([...AGE_DISTRIBUTION])

    const clubPlayers: Player[] = []
    for (let i = 0; i < 22; i++) {
      const player = generatePlayer(
        rng,
        club.id,
        i,
        positions[i],
        ages[i],
        club.reputation,
        season,
      )
      clubPlayers.push(player)
    }

    club.squadPlayerIds = clubPlayers.map((p) => p.id)
    allPlayers.push(...clubPlayers)
  }

  // Easter egg: Erik Ström always exists
  const erikRand = mulberry32((seed ?? 42) + 777)
  const erikClubIdx = Math.floor(erikRand() * clubs.length)
  const erikClub = clubs[erikClubIdx]
  const erikPlayer: Player = {
    id: `player_erik_strom_${season}`,
    firstName: 'Erik',
    lastName: 'Ström',
    age: 28,
    nationality: 'SE',
    clubId: erikClub.id,
    academyClubId: erikClub.id,
    isHomegrown: true,
    position: PlayerPosition.Forward,
    archetype: PlayerArchetype.Finisher,
    salary: 15000,
    contractUntilSeason: season + 3,
    marketValue: 350000,
    morale: 85,
    form: 75,
    fitness: 80,
    sharpness: 70,
    currentAbility: 72,
    potentialAbility: 78,
    developmentRate: 40,
    injuryProneness: 25,
    discipline: 80,
    attributes: {
      skating: 70, acceleration: 75, stamina: 68,
      ballControl: 74, passing: 65, shooting: 80,
      dribbling: 72, vision: 68, decisions: 70,
      workRate: 78, positioning: 75, defending: 40,
      cornerSkill: 60, goalkeeping: 5,
    },
    isInjured: false,
    injuryDaysRemaining: 0,
    suspensionGamesRemaining: 0,
    seasonStats: { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0 },
    careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 1 },
    isFullTimePro: true,
  }
  const clubFwds = allPlayers
    .filter(p => p.clubId === erikClub.id && p.position === PlayerPosition.Forward)
    .sort((a, b) => a.currentAbility - b.currentAbility)
  if (clubFwds.length > 0) {
    const replaced = clubFwds[0]
    const idx = allPlayers.findIndex(p => p.id === replaced.id)
    if (idx !== -1) {
      allPlayers[idx] = erikPlayer
      erikClub.squadPlayerIds = erikClub.squadPlayerIds.map(
        id => id === replaced.id ? erikPlayer.id : id
      )
    }
  }

  // Set hasIndoorArena on up to 3 high-reputation clubs
  const highRepClubs = clubs
    .filter(c => c.reputation >= 55)
    .sort(() => rng.next() - 0.5)
    .slice(0, 3)
  const indoorArenaIds = new Set(highRepClubs.map(c => c.id))
  const clubsWithArena = clubs.map(c =>
    indoorArenaIds.has(c.id) ? { ...c, hasIndoorArena: true } : c
  )

  return { clubs: clubsWithArena, players: allPlayers }
}
