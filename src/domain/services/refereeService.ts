import type { Referee, RefereeRelation, RefereeStyle } from '../entities/Referee'
import type { Fixture } from '../entities/Fixture'
import { REFEREE_PROFILES } from '../data/refereeData'

// ── Opening commentary per style ─────────────────────────────────────────────
// Visas som kommentar i match-feeden vid matchstart.

export const REFEREE_OPENING_COMMENTARY: Record<RefereeStyle, string[]> = {
  strict: [
    'Dömer stramt från första avslaget. Backarna får tänka om.',
    'Blåser på det mesta idag. Lagen vet om det.',
    'Ingen marginal för sena brytningar. Det märks redan.',
  ],
  lenient: [
    'Låter det rulla. Lite extra kontakt går igenom.',
    'Bandyvänlig pipa idag. Spelet får gå.',
    'Backarna kan ta i — så länge det är rent.',
  ],
  inconsistent: [
    'Svår att läsa. Andra halvlek kan bli en annan match.',
    'Olika mått i olika ändar hittills. Lagen försöker lista ut vad som gäller.',
    'Första utvisningen sätter tonen — och den har inte kommit än.',
  ],
}

// ── Referee meeting quotes per style ─────────────────────────────────────────
// Vad domaren säger när mötet öppnas i GranskaScreen.

export const REFEREE_MEETING_QUOTES: Record<RefereeStyle, string[]> = {
  strict: [
    'Tre utvisningar på er sida. Pressen gick för högt — backarna hann inte med.',
    'Jag räknar för att det ska räknas. Säg till tränaren att titta på minut 34.',
    'Vi såg samma match, ni och jag. Skillnaden är att jag blåser.',
  ],
  lenient: [
    'Bra match. Ni spelade hårt men rent — det märktes.',
    'Inga större anmärkningar. Tack för idag.',
    'Kaptenen pratade med mig i pausen. Sånt uppskattar jag.',
  ],
  inconsistent: [
    'Några beslut var svåra. Jag vet. Jag var där.',
    'Bandy är marginaler. Idag föll de åt er. Ibland inte.',
    'Jag hörde bänken. Jag hör allt. Det ändrar ingenting.',
  ],
}

// ── Generate referees from profiles ─────────────────────────────────────────

export function generateReferees(): Referee[] {
  return REFEREE_PROFILES.map((p, i) => ({
    id: `referee_${i}`,
    firstName: p.firstName,
    lastName: p.lastName,
    homeTown: p.homeTown,
    yearsOfExperience: p.yearsOfExperience,
    style: p.style,
    personality: p.personality,
    quirk: p.quirk,
    backstory: p.backstory,
    managedMatches: 0,
  }))
}

// ── Pick referee for a match (weighted, avoids recent repeats) ───────────────

export function pickRefereeForMatch(
  refs: Referee[],
  relations: RefereeRelation[],
  currentRound: number,
  rand: () => number,
): Referee {
  if (refs.length === 0) return generateReferees()[0]

  const weights = refs.map(ref => {
    const rel = relations.find(r => r.refereeId === ref.id)
    // Downweight referees seen recently (within last 3 rounds)
    const recentPenalty = rel && rel.lastMatchRound >= currentRound - 3 ? 0.2 : 1.0
    return recentPenalty
  })

  const total = weights.reduce((s, w) => s + w, 0)
  let r = rand() * total
  for (let i = 0; i < refs.length; i++) {
    r -= weights[i]
    if (r <= 0) return refs[i]
  }
  return refs[refs.length - 1]
}

// ── Update referee relation after meeting choice ─────────────────────────────

export function updateRefereeRelation(
  existing: RefereeRelation | undefined,
  refereeId: string,
  _fixture: Fixture,
  choice: 'respect' | 'neutral' | 'protest',
  season: number,
  round: number,
  suspensionCount: number,
  penaltyCount: number,
): RefereeRelation {
  const base: RefereeRelation = existing ?? {
    refereeId,
    lastMatchSeason: season,
    lastMatchRound: round,
    totalMatches: 0,
    totalCardsGiven: 0,
    totalPenaltiesGiven: 0,
    clubReaction: 0,
  }

  const reactionDelta = choice === 'respect' ? 1 : choice === 'protest' ? -1 : 0
  const newReaction = Math.max(-2, Math.min(2, base.clubReaction + reactionDelta)) as -2 | -1 | 0 | 1 | 2

  return {
    ...base,
    lastMatchSeason: season,
    lastMatchRound: round,
    totalMatches: base.totalMatches + 1,
    totalCardsGiven: base.totalCardsGiven + suspensionCount,
    totalPenaltiesGiven: base.totalPenaltiesGiven + penaltyCount,
    clubReaction: newReaction,
  }
}

// ── Check if referee meeting should trigger ──────────────────────────────────

export function shouldTriggerRefereeMeeting(
  suspensionCount: number,
  penaltyCount: number,
  refereeStyle: RefereeStyle,
  rand: () => number,
): boolean {
  const criteriaOk = (suspensionCount >= 3 || penaltyCount >= 1)
    && (refereeStyle === 'strict' || refereeStyle === 'inconsistent')
  if (!criteriaOk) return false
  return rand() < 0.40
}

// ── Get formatted referee display name ──────────────────────────────────────

export function getRefereeDisplayName(ref: Referee): string {
  return `${ref.firstName} ${ref.lastName} (${ref.homeTown}, ${ref.yearsOfExperience} år)`
}
