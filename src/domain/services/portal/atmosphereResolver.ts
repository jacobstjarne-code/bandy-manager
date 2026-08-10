/**
 * atmosphereResolver.ts — PORTAL-TAKREGEL (2026-08-09).
 *
 * "Marks blir data före de blir JSX." Varje atmosfärsmark (Situation, Beat,
 * Anniversary, Upptakt, Spectator) grindade sig tidigare själv inuti sin egen
 * render — skärmen kunde inte veta vad de skulle säga innan den renderat dem,
 * så ingenting kunde prioritera mellan dem. Detta är enda källan för "har den
 * här marken något att säga just nu" — komponenterna anropar SAMMA funktioner,
 * ingen dubblerad urvalslogik.
 *
 * Flyttar bara URVALET — inte texten, inte formen. Poolerna/valen inuti varje
 * komponent (PortalBeat, PortalAnniversaryMark, etc) är oförändrade.
 *
 * Prioritetsordning (mest förankrat → mest generiskt), från takregel-ordern:
 *   1. Anniversary — daterad, sällsynt, klubbens egen historia
 *   2. Upptakt     — bara i eskaleringsfönstret, redan sällsynt
 *   3. Spectator    — bara i åskådarläget
 *   4. Beat        — generisk pool, fyller tomrummet
 *   5. Situation   — orientering, faller alltid tillbaka (aldrig null)
 *
 * Taket är EN mätfråga, inte en smakfråga (Jacobs revidering 2026-08-09):
 * två rader tills 390px-baselinen visar att Primary inte klarar vikningen
 * med två — se ATMOSPHERE_CAP.
 */
import type { SaveGame } from '../../entities/SaveGame'
import type { EscalationSubState } from '../../../application/services/portalEscalationResolver'
import { getActiveBeat } from '../portalBeatService'
import { getCurrentLeagueRound, getFunctionaryPhase, isManagedClubInPlayoff, isManagedClubSpectator } from '../../data/seasonPhases'
import { pickAnniversaryMarkCopy } from '../../data/anniversaryMarkText'
import { pickPhaseMarkCopy } from '../../data/phaseMarkText'
import type { ActiveAnniversary } from '../clubMemoryService'

// AUDIT DEL 2 (2026-08-09), Jacobs ruling: PhaseMark bär redaktionell text
// (eyebrow/citat/helper) och är därmed atmosfär, inte kronologi — hör hemma
// i takregelns prioritetskedja, lägst prioriterad (under Beat), INTE i
// headern. RoundMark är ren kronologi och flyttades ur Portal till
// GameHeader istället (se GameHeader.tsx).
export type AtmosphereMarkKind = 'anniversary' | 'upptakt' | 'spectator' | 'beat' | 'phasemark' | 'situation'

export const ATMOSPHERE_PRIORITY: readonly AtmosphereMarkKind[] = ['anniversary', 'upptakt', 'spectator', 'beat', 'phasemark', 'situation']

// REVIDERAD 2026-08-09 efter Codes mätning (snitt 1,91 marks/omgång, aldrig
// fler än 3 av 5 samtidigt i 290 simulerade omgångar — se PORTAL_TAKREGEL-
// ordern §2). Sänkning till 1 är ett separat beslut som tas mot 390px-
// baselinen (tests/visual/baseline.visual.ts: portal-full), inte gissat här.
export const ATMOSPHERE_CAP = 2

/**
 * Replikerar PortalAnniversaryMark.tsx:s inbäddade gate-kedja: elim-anslag-
 * väntan (spelaren utslagen ur slutspel men elim-anslaget inte visat än),
 * echoSize==='big'-filter, högst significance, tom-copy-koll. Returnerar
 * själva ekot (inte bara ett booleskt "ja") så komponenten INTE behöver
 * härleda bigEcho en gång till — detta ÄR den enda källan nu, ingen
 * duplicerad urvalslogik i komponenten.
 */
export function resolveAnniversaryEcho(game: SaveGame): ActiveAnniversary | null {
  if (!game.activeAnniversaries || game.activeAnniversaries.length === 0) return null

  if (game.playoffBracket) {
    const managedClubId = game.managedClubId
    const seenAnslag = game.seenAnslag
    const bracket = game.playoffBracket
    const allSeries = [
      ...bracket.quarterFinals,
      ...bracket.semiFinals,
      ...(bracket.final ? [bracket.final] : []),
    ]
    const activeSeries = allSeries.filter(s =>
      s.winnerId === null && (s.homeClubId === managedClubId || s.awayClubId === managedClubId)
    )
    const isEliminated = activeSeries.length === 0
    if (isEliminated) {
      const elimSeen = (seenAnslag ?? []).some(k => k.includes('playoff_eliminated'))
      if (!elimSeen) return null
    }
  }

  const bigEchos = game.activeAnniversaries.filter(a => a.echoSize === 'big')
  if (bigEchos.length === 0) return null
  const bigEcho = bigEchos.reduce((best, a) => (a.significance > best.significance ? a : best))
  const rawCopy = pickAnniversaryMarkCopy(bigEcho, game)
  return rawCopy.quote ? bigEcho : null
}

export function hasAnniversaryContent(game: SaveGame): boolean {
  return resolveAnniversaryEcho(game) !== null
}

/** Speglar PortalBeat.tsx:s gate exakt: getActiveBeat, samma pool/rotation. */
export function hasBeatContent(game: SaveGame): boolean {
  return getActiveBeat(game) !== null
}

/** Speglar PortalUpptakt.tsx:s gate: subState från getEscalationSubState, aldrig 'mittfalt'. */
export function hasUpptaktContent(subState: EscalationSubState): boolean {
  return subState !== null && subState !== 'mittfalt'
}

/**
 * Speglar PortalSpectatorMark.tsx:s gate. OBS: komponentens useEffect
 * markerar 'spectator' som sedd så fort marken SKULLE visas — inte när den
 * faktiskt vinner atmosfärsraden. Om Spectator förlorar mot Anniversary/
 * Upptakt en omgång markeras den ändå som sedd och kan aldrig visas igen.
 * Det är en befintlig beteendeskillnad denna refaktor inte åtgärdar (skulle
 * kräva att flytta "sedd"-markeringen till faktisk visning, en separat
 * ändring) — inte något att fixa tyst i en prioritetsomläggning.
 */
export function hasSpectatorContent(game: SaveGame): boolean {
  const seen = game.phaseMarksSeen ?? []
  return isManagedClubSpectator(game) && !seen.includes('spectator')
}

/**
 * Speglar PortalPhaseMark.tsx:s inbäddade gate exakt: fas via
 * getFunctionaryPhase (eller 'playoff' om klubben är i slutspel),
 * phaseMarksSeen-spärr (en gång per fas), tom-copy-koll.
 */
export function resolvePhaseMark(game: SaveGame): ReturnType<typeof pickPhaseMarkCopy> {
  const currentLigaRound = getCurrentLeagueRound(game)
  const isPlayoff = isManagedClubInPlayoff(game)
  const tablePosition = game.standings.find(s => s.clubId === game.managedClubId)?.position
    ?? Math.ceil(game.clubs.length / 2)
  const phase = isPlayoff ? 'playoff' : getFunctionaryPhase(currentLigaRound, tablePosition, game.clubs.length)

  const seen = game.phaseMarksSeen ?? []
  if (seen.includes(phase)) return null

  return pickPhaseMarkCopy(phase, game)
}

export function hasPhaseMarkContent(game: SaveGame): boolean {
  return resolvePhaseMark(game) !== null
}

export interface AtmosphereSelection {
  shown: AtmosphereMarkKind[]
  demoted: AtmosphereMarkKind[]
}

/**
 * Väljer vilka atmosfärsmarks som får synas (max ATMOSPHERE_CAP), i
 * prioritetsordning. Situation är alltid kandidat (aldrig null — se
 * getSituation) och fungerar som sista utfyllnad om utrymme finns kvar.
 */
export function selectAtmosphereMarks(
  game: SaveGame,
  upptaktSubState: EscalationSubState,
): AtmosphereSelection {
  const eligible: Record<AtmosphereMarkKind, boolean> = {
    anniversary: hasAnniversaryContent(game),
    upptakt: hasUpptaktContent(upptaktSubState),
    spectator: hasSpectatorContent(game),
    beat: hasBeatContent(game),
    phasemark: hasPhaseMarkContent(game),
    situation: true,
  }

  const candidates = ATMOSPHERE_PRIORITY.filter(kind => eligible[kind])
  const shown = candidates.slice(0, ATMOSPHERE_CAP)
  const demoted = candidates.slice(ATMOSPHERE_CAP)

  return { shown, demoted }
}
