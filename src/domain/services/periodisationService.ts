import type { Player } from '../entities/Player'

export type PeriodisationMode = 'bygg' | 'hall' | 'toppa' | 'vila'
export type ReactionType = 'warn' | 'good' | 'rust'

// D-SAB-001: Säsongsbage — periodisering magnituder (shared with playerStateProcessor)
export const BYGG_SEASON_FORM_RATE   = 1.5
export const BYGG_SEASON_FORM_CAP    = 88
export const BYGG_EXTRA_FITNESS_COST = 4
export const BYGG_INJURY_MULT        = 1.15
export const TOPPA_SPIKE_RATE        = 1.0
export const TOPPA_DECAY_RATE        = 1.7
export const TOPPA_SPIKE_ROUNDS      = 3
export const TOPPA_EXTRA_SHARPNESS   = 2.4
export const TOPPA_EXTRA_FITNESS_REC = 3
export const VILA_SEASON_FORM_DECAY  = 1.0
export const VILA_EXTRA_FITNESS_REC  = 5
export const VILA_SHARPNESS_PENALTY  = 3
// D-SAB-001: unified cap — squadEvaluator och bench-recovery använder samma värde
export const SEASON_FORM_FITNESS_SLACK = 3
export const RAMP_ROUNDS               = 3   // D-SAB-002: rundor av ramp-skydd efter skada
export const PROJECTION_HORIZON        = 10

export interface PeriodisationReaction {
  type: ReactionType
  text: string
}

export function getEffectiveMode(
  player: Player,
  teamMode: PeriodisationMode,
): PeriodisationMode {
  return (player.periodisationOverride as PeriodisationMode | null | undefined) ?? teamMode
}

export function getReaction(
  player: Player,
  effectiveMode: PeriodisationMode,
  currentMatchday: number = 0,
): PeriodisationReaction | null {
  const age = player.age
  const stamina = player.attributes.stamina
  const sharpness = player.sharpness
  const ca = player.currentAbility

  // Ramp-skydd vinner alltid — nyss skadad spelare ska inte drivas i Bygg/Toppa
  if (
    (effectiveMode === 'bygg' || effectiveMode === 'toppa') &&
    currentMatchday < ((player as { recentlyInjuredUntil?: number }).recentlyInjuredUntil ?? 0)
  ) {
    return { type: 'warn', text: 'Ramp först' }
  }

  if (effectiveMode === 'bygg') {
    if (age >= 33) return { type: 'warn', text: 'Tål inte Bygg' }
    if (stamina < 40) return { type: 'warn', text: 'Tål inte Bygg' }
    if (age <= 20) return { type: 'good', text: 'Bygger snabbt' }
  }

  if (effectiveMode === 'toppa') {
    if (age >= 33) return { type: 'warn', text: 'Orkar ej spiken' }
  }

  if (effectiveMode === 'vila') {
    if (age <= 20) return { type: 'rust', text: 'Behöver minuter' }
    if (sharpness >= 75 && ca >= 70) return { type: 'rust', text: 'Rostar av vila' }
  }

  return null
}

/**
 * Projects seasonForm avg forward from currentAvg for `horizon` rounds
 * under the given mode. First returned value = after round 1.
 */
export function projectSeasonForm(
  currentAvg: number,
  mode: PeriodisationMode,
  roundsInMode: number,
  horizon: number = PROJECTION_HORIZON,
): number[] {
  const result: number[] = []
  let sf = currentAvg
  for (let i = 0; i < horizon; i++) {
    const roundN = roundsInMode + i
    let delta = 0
    if (mode === 'bygg') {
      delta = sf < BYGG_SEASON_FORM_CAP ? BYGG_SEASON_FORM_RATE : 0
    } else if (mode === 'toppa') {
      delta = roundN < TOPPA_SPIKE_ROUNDS ? TOPPA_SPIKE_RATE : -TOPPA_DECAY_RATE
    } else if (mode === 'vila') {
      delta = -VILA_SEASON_FORM_DECAY
    }
    sf = Math.max(0, Math.min(100, sf + delta))
    result.push(Math.round(sf))
  }
  return result
}

// ── §4.3 Säsongsklockan ──────────────────────────────────────────────────────

/**
 * KÖRORDER 2026-09-18 §4.3. Periodiseringen hade fyra knappar men sa aldrig
 * VAR i säsongen laget står eller vad fasen är byggd för. Ingen automatik —
 * spelaren väljer fortfarande — men spelet slutar hålla avsikten hemlig.
 *
 * Byggd först efter att §4.1 blev grön: före §3.0 var periodiseringen
 * verkningslös (seasonForm-taket kunde inte bita under råkonditionen), och en
 * yta som pekar ut ett avsett läge hade då pekat på ingenting.
 *
 * Fasgränserna räknas ur fixturelistan, aldrig hårdkodat 20–22 — samma regel
 * som schema a i lever-sweep.
 */
export type SeasonClockPhase = 'hosten' | 'mitten' | 'sista_biten' | 'slutspel' | 'ute'

export interface SeasonClock {
  phase: SeasonClockPhase
  /** Fasnamnet som visas ovanför lägesknapparna. Fables text (A7). */
  label: string
  /** Läget fasen är byggd för. Spelaren är fri att välja annat. */
  intendedMode: PeriodisationMode
}

/** Fables fasnamn (TEXTLEVERANS §A7), kopierade ordagrant. */
const PHASE_LABEL: Record<SeasonClockPhase, string> = {
  hosten:      'Bandyhösten. Formen byggs nu eller inte alls.',
  mitten:      'Mitt i serien. Håll det som håller.',
  sista_biten: 'Sista biten. Tre matcher att toppa på.',
  slutspel:    'Slutspel. Ingen sparar något nu.',
  ute:         'Säsongen är slut för er. Benen får vila, huvudet får vänta på nästa.',
}

const PHASE_MODE: Record<SeasonClockPhase, PeriodisationMode> = {
  hosten: 'bygg', mitten: 'hall', sista_biten: 'toppa', slutspel: 'hall', ute: 'vila',
}

/** Omgångar i inledningen som är byggda för Bygg. */
export const CLOCK_BUILD_ROUNDS = 8
/** Antal ligaomgångar före slutspelet som är byggda för Toppa. */
export const CLOCK_PEAK_ROUNDS = 3

interface ClockInput {
  fixtures: ReadonlyArray<{
    homeClubId: string; awayClubId: string; season: number; status: string
    roundNumber?: number; isCup?: boolean
  }>
  managedClubId: string
  currentSeason: number
  /** Sant när klubben är utslagen ur slutspelet (eller säsongen är slut för den). */
  eliminated: boolean
  /** Sant under pågående slutspel där klubben fortfarande är kvar. */
  inPlayoff: boolean
}

export function getSeasonClock(input: ClockInput): SeasonClock {
  const phase = ((): SeasonClockPhase => {
    if (input.eliminated) return 'ute'
    if (input.inPlayoff) return 'slutspel'
    const mine = input.fixtures.filter(f =>
      !f.isCup && f.season === input.currentSeason
      && (f.homeClubId === input.managedClubId || f.awayClubId === input.managedClubId))
    const leagueTotal = mine.filter(f => (f.roundNumber ?? 0) <= 22).length || 22
    const played = mine.filter(f => f.status === 'completed' && (f.roundNumber ?? 0) <= 22).length
    const next = played + 1
    if (next <= CLOCK_BUILD_ROUNDS) return 'hosten'
    if (next > leagueTotal - CLOCK_PEAK_ROUNDS) return 'sista_biten'
    return 'mitten'
  })()

  return { phase, label: PHASE_LABEL[phase], intendedMode: PHASE_MODE[phase] }
}

/**
 * Förklaringsrad per läge (A7). Kompletterar de dynamiska raderna i
 * SeasonArcCard — de behålls, det här är den fasta förklaringen av VAD läget
 * gör, inte vad det gör just nu.
 */
export const MODE_EXPLANATION: Record<PeriodisationMode, string> = {
  bygg:  'Bygg. Formen växer sakta, benen kostar. Hösten är byggd för det.',
  hall:  'Håll. Ingen vinst, ingen kostnad. Rätt mellan tunga matcher.',
  toppa: 'Toppa. Tre matcher upp, sen faller det. Använd den när det finns något att toppa mot.',
  vila:  'Vila. Ben tillbaka, form nedåt. För en trupp som är slut, inte en som är lat.',
}

/**
 * De två varningarna i A7. Returnerar null när läget passar fasen — raden ska
 * synas när valet kostar, inte som ambient text.
 */
export function getSeasonClockWarning(
  mode: PeriodisationMode,
  roundsInMode: number,
  clock: SeasonClock,
): string | null {
  if (mode === 'toppa' && roundsInMode >= TOPPA_SPIKE_ROUNDS) {
    return 'Spiken är förbi. Toppa kostar nu form varje omgång. Tillbaka till Håll om det inte är final på söndag.'
  }
  if (mode === 'bygg' && (clock.phase === 'sista_biten' || clock.phase === 'slutspel')) {
    return 'Bygg nu hinner inte bära frukt förrän serien är slut. Formen ni bygger används av ingen.'
  }
  return null
}
