import type { SaveGame } from '../entities/SaveGame'
import type { ManagerProfile, CoachRivalry } from '../entities/ManagerProfile'
import {
  COACH_FIRST_NAMES,
  COACH_LAST_NAMES,
  COACH_RIVALRY_QUOTES,
  BIO_OPENERS,
  BIO_FAMILY_LINES,
  CONTRACT_STATUS,
  CONTRACT_OUTCOME,
  type CoachPersonality,
} from '../data/managerKaraktarText'
import { mulberry32 } from '../utils/random'

const BURNOUT_HISTORY_MAX = 22

const BURNOUT_LOSS_PER_RECENT = 10   // per loss in last 3 rounds
const BURNOUT_FATIGUE_WEIGHT = 0.3
const BURNOUT_INBOX_WEIGHT = 2
const BURNOUT_WIN_RECOVERY = 5
const BURNOUT_NATURAL_DECAY = 3      // drift toward 0 when neither winning nor losing
const BURNOUT_TRIGGER_THRESHOLD = 70
const BURNOUT_TRIGGER_ROUNDS = 2     // consecutive rounds above threshold before BurnoutMark

export function generateManagerProfile(seed: number, startSeason: number = 1): ManagerProfile {
  const r = mulberry32(seed)
  const pick = <T>(arr: T[]) => arr[Math.floor(r() * arr.length)]

  return {
    firstName: pick(COACH_FIRST_NAMES),
    lastName: pick(COACH_LAST_NAMES),
    age: 40 + Math.floor(r() * 20),
    hometown: pick(HOMETOWN_POOL),
    burnoutScore: 0,
    burnoutHistory: [],
    careerWins: 0,
    careerDraws: 0,
    careerLosses: 0,
    seasonsAtClub: 1,
    contractUntilSeason: startSeason + 3,
    monthlySalary: 15 + Math.floor(r() * 26),  // 15–40 tkr/month
    coachRivalries: [],
  }
}

const PERSONALITIES = Object.keys(COACH_RIVALRY_QUOTES) as CoachPersonality[]

export function generateCoachRivalries(opponentClubIds: string[], seed: number): CoachRivalry[] {
  const r = mulberry32(seed)
  return opponentClubIds.map(clubId => ({
    clubId,
    personality: PERSONALITIES[Math.floor(r() * PERSONALITIES.length)],
    h2hWins: 0,
    h2hDraws: 0,
    h2hLosses: 0,
  }))
}

export function updateH2HRecord(
  profile: ManagerProfile,
  opponentClubId: string,
  managedScore: number,
  opponentScore: number,
): ManagerProfile {
  const rivalries = profile.coachRivalries.map(r => {
    if (r.clubId !== opponentClubId) return r
    if (managedScore > opponentScore) return { ...r, h2hWins: r.h2hWins + 1 }
    if (managedScore < opponentScore) return { ...r, h2hLosses: r.h2hLosses + 1 }
    return { ...r, h2hDraws: r.h2hDraws + 1 }
  })
  return { ...profile, coachRivalries: rivalries }
}

export function getContractStatusText(profile: ManagerProfile, currentSeason: number): string {
  const seasonsLeft = profile.contractUntilSeason - currentSeason
  if (seasonsLeft <= 1) {
    return CONTRACT_STATUS.expiring
      .replace('{n}', String(Math.max(0, seasonsLeft)))
      .replace('{lon}', String(profile.monthlySalary))
  }
  return CONTRACT_STATUS.secure
    .replace('{n}', String(seasonsLeft))
    .replace('{lon}', String(profile.monthlySalary))
}

export function resolveContractExtension(
  profile: ManagerProfile,
  currentSeason: number,
  seed: number,
): { profile: ManagerProfile; inboxText: string | null } {
  const seasonsLeft = profile.contractUntilSeason - currentSeason
  if (seasonsLeft > 1) return { profile, inboxText: null }

  const managerName = `${profile.firstName} ${profile.lastName}`
  const extended = Math.floor(mulberry32(seed)() * 10) < 7  // 70% extend

  if (extended) {
    return {
      profile: { ...profile, contractUntilSeason: profile.contractUntilSeason + 2 },
      inboxText: CONTRACT_OUTCOME.extended.replace('{manager}', managerName),
    }
  }
  return {
    profile,
    inboxText: CONTRACT_OUTCOME.not_extended.replace('{manager}', managerName),
  }
}

export function getManagerBio(profile: ManagerProfile, seed: number): { opener: string; family: string } {
  const r = (n: number) => BIO_OPENERS[n % BIO_OPENERS.length]
  const f = (n: number) => BIO_FAMILY_LINES[n % BIO_FAMILY_LINES.length]
  const idx = seed % BIO_OPENERS.length
  const fidx = seed % BIO_FAMILY_LINES.length
  const opener = r(idx)
    .replace('{hemort}', profile.hometown)
    .replace('{n}', String(8 + (seed % 8)))
  const family = f(fidx).replace('{hemort}', profile.hometown)
  return { opener, family }
}

export function updateManagerBurnout(game: SaveGame): ManagerProfile | undefined {
  const profile = game.managerProfile
  if (!profile) return undefined

  const recentFixtures = game.fixtures
    .filter(f => f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
    .filter(f => f.homeScore !== undefined && f.awayScore !== undefined)
    .sort((a, b) => b.matchday - a.matchday)
    .slice(0, 3)

  let delta = 0

  // Losses in last 3 rounds
  let lastWon = false
  for (const f of recentFixtures) {
    const isHome = f.homeClubId === game.managedClubId
    const scored = isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0)
    const conceded = isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0)
    if (scored < conceded) delta += BURNOUT_LOSS_PER_RECENT
    if (scored > conceded && recentFixtures.indexOf(f) === 0) lastWon = true
  }

  // Decision fatigue
  const fatigue = (game.fatigueHistory ?? []).slice(-1)[0] ?? 0
  delta += fatigue * BURNOUT_FATIGUE_WEIGHT

  // Inbox pending items
  const unread = game.inbox.filter(i => !i.isRead).length
  delta += unread * BURNOUT_INBOX_WEIGHT

  // Win recovery
  if (lastWon) delta -= BURNOUT_WIN_RECOVERY

  // Natural decay toward 0
  if (delta === 0) delta -= BURNOUT_NATURAL_DECAY

  const newScore = Math.max(0, Math.min(100, profile.burnoutScore + delta))
  const newHistory = [...profile.burnoutHistory, newScore].slice(-BURNOUT_HISTORY_MAX)

  return { ...profile, burnoutScore: newScore, burnoutHistory: newHistory }
}

export function shouldShowBurnoutMark(profile: ManagerProfile): boolean {
  const recent = profile.burnoutHistory.slice(-BURNOUT_TRIGGER_ROUNDS)
  return recent.length >= BURNOUT_TRIGGER_ROUNDS && recent.every(v => v >= BURNOUT_TRIGGER_THRESHOLD)
}

export function getBurnoutZone(score: number): 'frisk' | 'markbar' | 'hog' {
  if (score >= BURNOUT_TRIGGER_THRESHOLD) return 'hog'
  if (score >= 40) return 'markbar'
  return 'frisk'
}

const HOMETOWN_POOL: string[] = [
  'Edsbyn', 'Bollnäs', 'Sandviken', 'Falun', 'Ljusdal', 'Söderhamn',
  'Hudiksvall', 'Gävle', 'Borlänge', 'Mora', 'Rättvik', 'Alfta',
  'Vänersborg', 'Trollhättan', 'Skellefteå', 'Umeå', 'Sundsvall',
]
