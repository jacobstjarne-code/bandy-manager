import type { Club } from '../entities/Club'
import type { Player, PlayerAttributes, PlayerSeasonStats, PlayerCareerStats } from '../entities/Player'
import type { YouthIntakeRecord } from '../entities/SaveGame'
import { PlayerPosition, PlayerArchetype } from '../enums'

// Mulberry32 seeded PRNG
function mulberry32(seed: number) {
  let s = seed >>> 0
  return function (): number {
    s += 0x6d2b79f5
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeRng(seed: number) {
  const rand = mulberry32(seed)
  return {
    next: rand,
    int: (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min,
    float: (min: number, max: number) => rand() * (max - min) + min,
    pick: <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)],
  }
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

const FIRST_NAMES = [
  'Erik', 'Lars', 'Anders', 'Johan', 'Karl', 'Per', 'Mikael', 'Olof', 'Stefan', 'Thomas',
  'Daniel', 'Magnus', 'Marcus', 'Patrik', 'Jonas', 'Oscar', 'Viktor', 'Emil', 'Anton', 'Simon',
  'Axel', 'Gustav', 'Filip', 'Ludvig', 'Hampus', 'Linus', 'Mattias', 'Niklas', 'Robert', 'Tobias',
]

const LAST_NAMES = [
  'Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson', 'Olsson', 'Persson',
  'Svensson', 'Gustafsson', 'Pettersson', 'Jonsson', 'Jansson', 'Hansson', 'Bengtsson',
  'Lindqvist', 'Lindgren', 'Lindström', 'Magnusson', 'Berglund', 'Lundqvist', 'Holm', 'Berg',
  'Nyström', 'Hedlund', 'Lund', 'Nordström', 'Björk', 'Söderberg', 'Wikström',
]

export interface YouthIntakeInput {
  club: Club
  existingPlayers: Player[]
  season: number
  date: string
  seed?: number
}

export interface YouthIntakeResult {
  record: YouthIntakeRecord
  newPlayers: Player[]
  scoutTexts: Record<string, string>
}

const IDEAL_DISTRIBUTION: Record<PlayerPosition, number> = {
  [PlayerPosition.Goalkeeper]: 2,
  [PlayerPosition.Defender]: 5,
  [PlayerPosition.Half]: 5,
  [PlayerPosition.Midfielder]: 5,
  [PlayerPosition.Forward]: 5,
}

function pickPosition(rng: ReturnType<typeof makeRng>, existingPlayers: Player[]): PlayerPosition {
  const positions = Object.values(PlayerPosition)

  if (existingPlayers.length === 0) {
    return rng.pick(positions)
  }

  const counts: Record<PlayerPosition, number> = {
    [PlayerPosition.Goalkeeper]: 0,
    [PlayerPosition.Defender]: 0,
    [PlayerPosition.Half]: 0,
    [PlayerPosition.Midfielder]: 0,
    [PlayerPosition.Forward]: 0,
  }

  for (const p of existingPlayers) {
    counts[p.position]++
  }

  const shortfalls: Record<PlayerPosition, number> = {} as Record<PlayerPosition, number>
  for (const pos of positions) {
    shortfalls[pos] = Math.max(0, IDEAL_DISTRIBUTION[pos] - counts[pos])
  }

  const totalShortfall = Object.values(shortfalls).reduce((a, b) => a + b, 0)

  if (totalShortfall === 0) {
    return rng.pick(positions)
  }

  // Position with most shortfall gets double weight
  const maxShortfall = Math.max(...Object.values(shortfalls))
  const weights: number[] = []
  for (const pos of positions) {
    weights.push(shortfalls[pos] === maxShortfall ? 2 : 1)
  }

  const totalWeight = weights.reduce((a, b) => a + b, 0)
  let r = rng.next() * totalWeight
  for (let i = 0; i < positions.length; i++) {
    r -= weights[i]
    if (r <= 0) return positions[i]
  }
  return positions[positions.length - 1]
}

function pickArchetype(rng: ReturnType<typeof makeRng>, position: PlayerPosition): PlayerArchetype {
  const r = rng.next()
  switch (position) {
    case PlayerPosition.Goalkeeper:
      return r < 0.5 ? PlayerArchetype.ReflexGoalkeeper : PlayerArchetype.PositionalGoalkeeper
    case PlayerPosition.Defender:
      if (r < 0.40) return PlayerArchetype.DefensiveWorker
      if (r < 0.75) return PlayerArchetype.TwoWaySkater
      return PlayerArchetype.CornerSpecialist
    case PlayerPosition.Half:
      if (r < 0.45) return PlayerArchetype.TwoWaySkater
      if (r < 0.75) return PlayerArchetype.Playmaker
      return PlayerArchetype.DefensiveWorker
    case PlayerPosition.Midfielder:
      if (r < 0.40) return PlayerArchetype.Playmaker
      if (r < 0.65) return PlayerArchetype.TwoWaySkater
      if (r < 0.85) return PlayerArchetype.Dribbler
      return PlayerArchetype.CornerSpecialist
    case PlayerPosition.Forward:
      if (r < 0.35) return PlayerArchetype.Finisher
      if (r < 0.65) return PlayerArchetype.Dribbler
      if (r < 0.85) return PlayerArchetype.RawTalent
      return PlayerArchetype.Playmaker
  }
}

function generateYouthAttributes(
  rng: ReturnType<typeof makeRng>,
  archetype: PlayerArchetype,
  ca: number,
): PlayerAttributes {
  const base = ca * 0.9

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

  const isGK =
    archetype === PlayerArchetype.ReflexGoalkeeper ||
    archetype === PlayerArchetype.PositionalGoalkeeper

  if (isGK) {
    const fieldAttrs: (keyof PlayerAttributes)[] = [
      'skating', 'acceleration', 'stamina', 'ballControl', 'passing', 'shooting',
      'dribbling', 'vision', 'decisions', 'workRate', 'positioning', 'defending', 'cornerSkill',
    ]
    for (const attr of fieldAttrs) {
      attrs[attr] = clamp(attrs[attr] - 10, 1, 60)
    }
  } else {
    attrs.goalkeeping = clamp(attrs.goalkeeping - 10, 1, 60)
  }

  switch (archetype) {
    case PlayerArchetype.ReflexGoalkeeper:
      attrs.goalkeeping = clamp(attrs.goalkeeping + 15, 1, 60)
      attrs.acceleration = clamp(attrs.acceleration + 8, 1, 60)
      attrs.skating = clamp(attrs.skating + 4, 1, 60)
      break
    case PlayerArchetype.PositionalGoalkeeper:
      attrs.goalkeeping = clamp(attrs.goalkeeping + 15, 1, 60)
      attrs.positioning = clamp(attrs.positioning + 10, 1, 60)
      attrs.decisions = clamp(attrs.decisions + 8, 1, 60)
      break
    case PlayerArchetype.DefensiveWorker:
      attrs.defending = clamp(attrs.defending + 15, 1, 60)
      attrs.workRate = clamp(attrs.workRate + 12, 1, 60)
      attrs.stamina = clamp(attrs.stamina + 8, 1, 60)
      attrs.positioning = clamp(attrs.positioning + 8, 1, 60)
      break
    case PlayerArchetype.TwoWaySkater:
      attrs.skating = clamp(attrs.skating + 12, 1, 60)
      attrs.stamina = clamp(attrs.stamina + 12, 1, 60)
      attrs.defending = clamp(attrs.defending + 8, 1, 60)
      attrs.workRate = clamp(attrs.workRate + 8, 1, 60)
      break
    case PlayerArchetype.Playmaker:
      attrs.passing = clamp(attrs.passing + 15, 1, 60)
      attrs.vision = clamp(attrs.vision + 15, 1, 60)
      attrs.decisions = clamp(attrs.decisions + 12, 1, 60)
      attrs.ballControl = clamp(attrs.ballControl + 8, 1, 60)
      break
    case PlayerArchetype.Finisher:
      attrs.shooting = clamp(attrs.shooting + 15, 1, 60)
      attrs.acceleration = clamp(attrs.acceleration + 12, 1, 60)
      attrs.decisions = clamp(attrs.decisions + 8, 1, 60)
      attrs.positioning = clamp(attrs.positioning + 8, 1, 60)
      break
    case PlayerArchetype.Dribbler:
      attrs.dribbling = clamp(attrs.dribbling + 15, 1, 60)
      attrs.ballControl = clamp(attrs.ballControl + 12, 1, 60)
      attrs.acceleration = clamp(attrs.acceleration + 12, 1, 60)
      attrs.skating = clamp(attrs.skating + 4, 1, 60)
      break
    case PlayerArchetype.CornerSpecialist:
      attrs.cornerSkill = clamp(attrs.cornerSkill + 18, 1, 60)
      attrs.passing = clamp(attrs.passing + 12, 1, 60)
      attrs.vision = clamp(attrs.vision + 8, 1, 60)
      break
    case PlayerArchetype.RawTalent: {
      const allKeys = Object.keys(attrs) as (keyof PlayerAttributes)[]
      for (const k of allKeys) {
        attrs[k] = clamp(attrs[k] - 8, 1, 60)
      }
      const shuffled = [...allKeys].sort(() => rng.next() - 0.5)
      const boostCount = rng.int(2, 3)
      for (let i = 0; i < boostCount; i++) {
        attrs[shuffled[i]] = clamp(attrs[shuffled[i]] + rng.int(12, 20), 1, 60)
      }
      break
    }
  }

  // Clamp all to 1-60
  for (const k of Object.keys(attrs) as (keyof PlayerAttributes)[]) {
    attrs[k] = clamp(Math.round(attrs[k]), 1, 60)
  }

  return attrs
}

type PotentialTier = 'elite' | 'promising' | 'normal'

function generateScoutText(tier: PotentialTier, archetype: PlayerArchetype): string {
  switch (tier) {
    case 'elite':
      switch (archetype) {
        case PlayerArchetype.Finisher:
          return 'Exceptionellt talang. Naturlig målskytt med explosivitet som sällan syns i den här åldern. Väldigt hög potential.'
        case PlayerArchetype.Playmaker:
          return 'Sällsynt spelsyn för sin ålder. Ser passningar ingen annan ser. Kan bli en nyckelspelare på elitnivå.'
        case PlayerArchetype.Dribbler:
          return 'Otrolig bollkontroll och fart. Den här spelaren har allt för att bli en stjärna om han sköter sig.'
        case PlayerArchetype.TwoWaySkater:
          return 'Komplett spelare med enastående kapacitet. Stark i alla faser — en sällsynt typ på den här nivån.'
        case PlayerArchetype.DefensiveWorker:
          return 'Taktiskt mogen för sin ålder och med intensitet som imponerar. Stor potential som defensiv ledare.'
        case PlayerArchetype.CornerSpecialist:
          return 'Exceptionell teknik vid hörnor och frisparkar. En spelares som kan avgöra matcher på elitnivå.'
        case PlayerArchetype.ReflexGoalkeeper:
          return 'Reflexer som man inte hittar i den här åldersgruppen. Kan bli en riktigt stor målvakt.'
        case PlayerArchetype.PositionalGoalkeeper:
          return 'Läser spelet fantastiskt bra och är alltid rätt placerad. Stor potential bakom buren.'
        case PlayerArchetype.RawTalent:
          return 'Outnyttjad potential på en nivå vi sällan ser. Orutin men med karaktär och talang som kan ta honom långt.'
      }
      break
    case 'promising':
      switch (archetype) {
        case PlayerArchetype.Finisher:
          return 'Bra känsla för mål och bra rörlighet i anfallet. Lovande potential med rätt träning.'
        case PlayerArchetype.Playmaker:
          return 'God spelsyn och bra passningsspel. Kan bli en viktig spelare om han fortsätter att växa.'
        case PlayerArchetype.Dribbler:
          return 'Snabb och teknisk. Gillar att ta på sig bollen och skapa situationer. Lovande framtid.'
        case PlayerArchetype.TwoWaySkater:
          return 'Bra skridskoåkare med hög arbetskapacitet. Solid tvåvägsspelare med tydlig potential.'
        case PlayerArchetype.DefensiveWorker:
          return 'Solid och pålitlig back. Jobbar hårt och lär sig snabbt. Lovande potential om han fortsätter utvecklas.'
        case PlayerArchetype.CornerSpecialist:
          return 'Tekniskt driven med bra set-piece-känsla. Kan bli ett vapen vid standardsituationer.'
        case PlayerArchetype.ReflexGoalkeeper:
          return 'Bra reflexer och aggressivitet i målet. Lovande målvakt med tydlig utvecklingspotential.'
        case PlayerArchetype.PositionalGoalkeeper:
          return 'Tänker bra och väljer rätt position. Kan bli en trygg målvakt med lite mer erfarenhet.'
        case PlayerArchetype.RawTalent:
          return 'Ojämn men med glimt i ögat. Rätt miljö och tränare kan göra stor skillnad för den här spelaren.'
      }
      break
    case 'normal':
      switch (archetype) {
        case PlayerArchetype.Finisher:
          return 'Spetsig forward med instinkt för mål. Ordinär potential, men kan bli ett bra alternativ i truppen.'
        case PlayerArchetype.Playmaker:
          return 'Passningssäker och läser spelet okej. Genomsnittlig potential, men kan fylla en roll som reserv.'
        case PlayerArchetype.Dribbler:
          return 'Rörlig och teknisk, men utan det extra steget. Kan bidra som djupkader med rätt stöd.'
        case PlayerArchetype.TwoWaySkater:
          return 'Ärlig och arbetsam. Ordinär potential men kan bli en bra reserv om han håller sig fokuserad.'
        case PlayerArchetype.DefensiveWorker:
          return 'Defensivt medveten och disciplinerad. Genomsnittlig potential, men en stabil karaktär i truppen.'
        case PlayerArchetype.CornerSpecialist:
          return 'Okej teknik vid hörnor men begränsad i det övriga spelet. Normalspelare med specifik funktion.'
        case PlayerArchetype.ReflexGoalkeeper:
          return 'Kompetent målvakt för sin ålder. Genomsnittlig potential, men kan bidra som reserv på sikt.'
        case PlayerArchetype.PositionalGoalkeeper:
          return 'Lugn och samlad i målet. Ingen stor potential, men pålitlig som tredjemålvakt.'
        case PlayerArchetype.RawTalent:
          return 'Sporadiska glimt av kvalitet men utan den konsistens som krävs. Ordinär potential totalt sett.'
      }
      break
  }
  return 'Spelare med oklar potential. Behöver följas upp.'
}

export function generateYouthIntake(input: YouthIntakeInput): YouthIntakeResult {
  const { club, existingPlayers, season, date, seed } = input
  const rng = makeRng(seed ?? (season * 1000 + club.id.length * 7))

  // Determine count
  let base: number
  let max: number
  if (club.youthRecruitment >= 70) {
    base = 4
    max = 5
  } else if (club.youthRecruitment >= 50) {
    base = 3
    max = 4
  } else {
    base = 2
    max = 3
  }

  const extra = rng.next() < (club.youthRecruitment % 10) / 10 ? 1 : 0
  const count = Math.min(base + extra, max)

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

  const newPlayers: Player[] = []
  const scoutTexts: Record<string, string> = {}

  for (let i = 0; i < count; i++) {
    const age = rng.int(15, 17)
    const position = pickPosition(rng, [...existingPlayers, ...newPlayers])
    const archetype = pickArchetype(rng, position)

    // Potential tier
    const tierRoll = rng.next()
    let potentialTier: PotentialTier
    let pa: number
    if (tierRoll < 0.05) {
      potentialTier = 'elite'
      pa = clamp(70 + Math.round(rng.float(0, 20)), 70, 90)
    } else if (tierRoll < 0.30) {
      potentialTier = 'promising'
      pa = clamp(50 + Math.round(rng.float(0, 20)), 50, 70)
    } else {
      potentialTier = 'normal'
      pa = clamp(30 + Math.round(rng.float(0, 20)), 30, 50)
    }

    // Current ability
    const caBase = 15 + (club.youthQuality / 100) * 20
    const caRaw = caBase + rng.float(-3, 3)
    const ca = clamp(Math.round(caRaw), 10, 35)

    const attributes = generateYouthAttributes(rng, archetype, ca)

    const id = `player_${club.id}_youth_${season}_${i}`
    const scoutText = generateScoutText(potentialTier, archetype)
    scoutTexts[id] = scoutText

    const player: Player = {
      id,
      firstName: rng.pick(FIRST_NAMES),
      lastName: rng.pick(LAST_NAMES),
      age,
      nationality: 'svenska',
      clubId: club.id,
      academyClubId: club.id,
      isHomegrown: true,
      position,
      archetype,
      salary: 500 + Math.round(rng.float(0, 500)),
      contractUntilSeason: season + 2,
      marketValue: ca * 500,
      morale: clamp(65 + Math.round(rng.float(0, 20)), 0, 100),
      form: clamp(50 + Math.round(rng.float(0, 20)), 0, 100),
      fitness: clamp(70 + Math.round(rng.float(0, 20)), 0, 100),
      sharpness: clamp(30 + Math.round(rng.float(0, 20)), 0, 100),
      currentAbility: ca,
      potentialAbility: pa,
      developmentRate: clamp(70 + Math.round(rng.float(0, 20)), 0, 100),
      injuryProneness: clamp(20 + Math.round(rng.float(0, 30)), 0, 100),
      discipline: clamp(55 + Math.round(rng.float(0, 30)), 0, 100),
      attributes,
      isInjured: false,
      injuryDaysRemaining: 0,
      suspensionGamesRemaining: 0,
      seasonStats: emptyStats,
      careerStats: emptyCareer,
      isFullTimePro: false,
    }

    newPlayers.push(player)
  }

  // Find top prospect (highest PA among elite/promising, else any)
  let topProspectId: string | undefined
  const eliteOrPromising = newPlayers.filter((p) => p.potentialAbility >= 50)
  if (eliteOrPromising.length > 0) {
    topProspectId = eliteOrPromising.reduce((best, p) =>
      p.potentialAbility > best.potentialAbility ? p : best,
    ).id
  } else if (newPlayers.length > 0) {
    topProspectId = newPlayers.reduce((best, p) =>
      p.potentialAbility > best.potentialAbility ? p : best,
    ).id
  }

  const record: YouthIntakeRecord = {
    season,
    clubId: club.id,
    date,
    playerIds: newPlayers.map((p) => p.id),
    topProspectId,
  }

  return { record, newPlayers, scoutTexts }
}
