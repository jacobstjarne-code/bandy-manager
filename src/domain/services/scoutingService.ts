import type { Player } from '../entities/Player'
import type { PlayerAttributes } from '../entities/Player'
import type { ScoutReport, ScoutAssignment } from '../entities/Scouting'
import { PlayerArchetype } from '../enums'

const ALL_ATTRIBUTE_KEYS: (keyof PlayerAttributes)[] = [
  'skating', 'acceleration', 'stamina', 'ballControl', 'passing',
  'shooting', 'dribbling', 'vision', 'decisions', 'workRate',
  'positioning', 'defending', 'cornerSkill', 'goalkeeping',
]

function clamp(v: number): number {
  return Math.max(1, Math.min(99, Math.round(v)))
}

// Simple seeded random using mulberry32
function makeRand(seed: number): () => number {
  let s = seed >>> 0
  return function () {
    s += 0x6d2b79f5
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Returns ±value in [-margin, +margin]
function noise(rand: () => number, margin: number): number {
  return Math.round((rand() * 2 - 1) * margin)
}

export function startScoutAssignment(
  playerId: string,
  clubId: string,
  currentDate: string,
  sameRegion: boolean,
): ScoutAssignment {
  return {
    targetPlayerId: playerId,
    targetClubId: clubId,
    startedDate: currentDate,
    roundsRemaining: sameRegion ? 1 : 2,
  }
}

export function processScoutAssignment(
  assignment: ScoutAssignment,
  targetPlayer: Player,
  scoutAccuracy: number,
  seed: number,
  currentSeason: number,
): ScoutReport {
  const rand = makeRand(seed)
  const errorMargin = Math.round((100 - scoutAccuracy) / 10)  // accuracy 70 → ±3, accuracy 30 → ±7

  const revealedAttributes: Partial<Record<keyof PlayerAttributes, number>> = {}
  for (const key of ALL_ATTRIBUTE_KEYS) {
    const base = targetPlayer.attributes[key]
    revealedAttributes[key] = clamp(base + noise(rand, errorMargin))
  }

  const estimatedCA = Math.round(clamp(targetPlayer.currentAbility + noise(rand, 5)))
  const estimatedPA = Math.round(clamp(targetPlayer.potentialAbility + noise(rand, 10)))

  const attrs = targetPlayer.attributes
  const offensive = Math.round((attrs.shooting + attrs.passing + attrs.dribbling + attrs.vision) / 4)
  const defensive = Math.round((attrs.defending + attrs.positioning) / 2)
  const physical = Math.round((attrs.skating + attrs.acceleration + attrs.stamina) / 3)
  const mental = Math.round((attrs.decisions + attrs.workRate) / 2)

  return {
    playerId: targetPlayer.id,
    clubId: assignment.targetClubId,
    scoutedDate: assignment.startedDate,
    scoutedSeason: currentSeason,
    accuracy: scoutAccuracy,
    revealedAttributes,
    estimatedCA,
    estimatedPA,
    notes: generateScoutNotes(targetPlayer, rand),
    attributeProfile: { offensive, defensive, physical, mental },
  }
}

export function getScoutReportAge(_report: ScoutReport, currentSeason: number, scoutedSeason: number): 'fresh' | 'aging' | 'stale' {
  const age = currentSeason - scoutedSeason
  if (age <= 0) return 'fresh'
  if (age === 1) return 'aging'
  return 'stale'
}

const ARCHETYPE_STRENGTHS: Record<PlayerArchetype, string> = {
  [PlayerArchetype.Finisher]: 'dödligt avslut',
  [PlayerArchetype.Playmaker]: 'suverän passning',
  [PlayerArchetype.DefensiveWorker]: 'järnhård försvarsspel',
  [PlayerArchetype.TwoWaySkater]: 'imponerande löpkapacitet',
  [PlayerArchetype.ReflexGoalkeeper]: 'reflexer i världsklass',
  [PlayerArchetype.PositionalGoalkeeper]: 'strålande positionsspel i målet',
  [PlayerArchetype.Dribbler]: 'magisk dribbling',
  [PlayerArchetype.CornerSpecialist]: 'farliga hörnor',
  [PlayerArchetype.RawTalent]: 'enorm potential',
}

const ATTRIBUTE_LABELS: Partial<Record<keyof PlayerAttributes, string>> = {
  skating: 'skridskogången',
  acceleration: 'accelerationen',
  stamina: 'uthålligheten',
  ballControl: 'bollkontrollen',
  passing: 'passningsspelet',
  shooting: 'skotteknik',
  dribbling: 'dribblandet',
  vision: 'speluppfattningen',
  decisions: 'spelsinnet',
  workRate: 'arbetsviljan',
  positioning: 'positionsspelet',
  defending: 'försvarsarbetet',
  cornerSkill: 'hörnorna',
  goalkeeping: 'målvaktsspelet',
}

export function generateScoutNotes(player: Player, rand?: () => number): string {
  const localRand = rand ?? makeRand(player.id.charCodeAt(0) * 31 + player.age * 7)

  const strength = ARCHETYPE_STRENGTHS[player.archetype] ?? 'goda egenskaper'

  // Find weakest attribute
  const entries = Object.entries(player.attributes) as [keyof PlayerAttributes, number][]
  const weakest = entries.reduce((min, [k, v]) =>
    (ATTRIBUTE_LABELS[k] && v < min[1]) ? [k, v] : min,
    entries[0]
  )
  const weakLabel = ATTRIBUTE_LABELS[weakest[0]] ?? 'okänd egenskap'

  const templates = [
    `Spelare med ${strength}. Saknar dock ${weakLabel}.`,
    `Tekniskt begåvad. Starka kort inkluderar ${strength}, men ${weakLabel} lämnar en del att önska.`,
    `Solid spelare — ${strength} sticker ut. ${weakLabel.charAt(0).toUpperCase() + weakLabel.slice(1)} är svagaste länken.`,
    `Intressant profil med ${strength}. Tveksam kring ${weakLabel}.`,
    `Erfaren profil. ${strength.charAt(0).toUpperCase() + strength.slice(1)} är tydlig styrka. Försvagas av svag ${weakLabel}.`,
  ]

  return templates[Math.floor(localRand() * templates.length)]
}
