import type { SeasonSummary } from '../entities/SeasonSummary'
import type { SeasonTransitionEvent } from '../entities/SaveGame'
import type { Skede, Tavlingstyp } from './matchTypeAxes'
import { getBurnoutZone } from './managerProfileService'

/**
 * 5.1 Sommaren (SLUTTEST_KO.md, 2026-08-18, DOM given samma dag).
 * Underlag: CODE_INSTRUKTION_SOMMAREN_2026-08-17.md + Sommaren-sasongsovergangen
 * -2026-08-17.dc.html (variant 1e, låst). All text i denna fil är kopierad
 * bokstavligt ur ordern — inga nya rader, inga nya varianter.
 */

// ── Epok-raden ──────────────────────────────────────────────────────────

const ORDINAL_WORDS: Record<number, string> = {
  2: 'andra', 3: 'tredje', 4: 'fjärde', 5: 'femte', 6: 'sjätte',
  7: 'sjunde', 8: 'åttonde', 9: 'nionde', 10: 'tionde',
}

/** "andra".."tionde" utskrivet i bokstäver, "11:e" och uppåt som siffra+suffix. */
export function seasonOrdinalSwedish(seasonCount: number): string {
  const word = ORDINAL_WORDS[seasonCount]
  return word ?? `${seasonCount}:e`
}

export type EpokVariant = 'titelforsvarare' | 'efterTapp' | 'etablerad' | 'sasong2'

export interface EpokLineArgs {
  seasonCount: number
  clubName: string
  /** "vann SM eller serien föregående säsong" — playoffResult==='champion' ELLER finalPosition===1. */
  wonTitleLastSeason: boolean
  /**
   * "placering sämre än föregående säsong, eller utslagen tidigare än förra
   * året" — jämför de två SENASTE avslutade säsongerna. false om färre än
   * två säsonger finns att jämföra (kan strukturellt inte vara sant vid
   * säsong 2:s övergång, då finns bara en avslutad säsong).
   */
  worsePlacementOrEarlierExit: boolean
}

/**
 * Prioritetsordning (Jacobs order): titelförsvarare > efter tapp > etablerad
 * > säsong 2. "Etablerad" har inget eget explicit villkor i ordern — givet
 * att titelförsvarare/efter-tapp kräver en föregående säsong att jämföra
 * mot (samma krav säsong-2 saknar per definition), faller etablerad aldrig
 * in FÖRE säsong-2 i praktiken: seasonCount===2 kollar vi explicit FÖRE
 * etablerad-defaulten, så en säsong-2-klubb som varken försvarar en titel
 * eller kommer från ett tapp får rätt hälsning, inte en "inte nykomlingar
 * längre"-rad som inte stämmer efter bara en säsong.
 */
export function deriveEpokVariant(args: Pick<EpokLineArgs, 'seasonCount' | 'wonTitleLastSeason' | 'worsePlacementOrEarlierExit'>): EpokVariant {
  if (args.wonTitleLastSeason) return 'titelforsvarare'
  if (args.worsePlacementOrEarlierExit) return 'efterTapp'
  if (args.seasonCount === 2) return 'sasong2'
  return 'etablerad'
}

export function deriveEpokLine(args: EpokLineArgs): string {
  const variant = deriveEpokVariant(args)
  const ord = seasonOrdinalSwedish(args.seasonCount)
  switch (variant) {
    case 'sasong2': return `Din andra säsong. Nu vet de vad du heter.`
    case 'etablerad': return `Din ${ord} säsong. ${args.clubName} är inte nykomlingar längre.`
    case 'titelforsvarare': return `Din ${ord} säsong. Ni är laget alla vill slå.`
    case 'efterTapp': return `Din ${ord} säsong. Förra våren sitter kvar i väggarna.`
  }
}

const PLAYOFF_RANK: Record<NonNullable<SeasonSummary['playoffResult']> | 'none', number> = {
  champion: 4, finalist: 3, semifinal: 2, quarterfinal: 1, didNotQualify: 0, none: 0,
}

/**
 * "placering sämre än föregående säsong, eller utslagen tidigare än förra
 * året" — jämför de två senaste avslutade säsongerna (summaries[-1] mot
 * summaries[-2]). false om färre än två summaries finns.
 */
export function deriveWorsePlacementOrEarlierExit(recentSummaries: SeasonSummary[]): boolean {
  if (recentSummaries.length < 2) return false
  const [prev, last] = recentSummaries.slice(-2)
  const worsePlacement = last.finalPosition > prev.finalPosition
  const earlierExit = PLAYOFF_RANK[last.playoffResult ?? 'none'] < PLAYOFF_RANK[prev.playoffResult ?? 'none']
  return worsePlacement || earlierExit
}

/** "vann SM eller serien föregående säsong". */
export function deriveWonTitleLastSeason(lastSeason: SeasonSummary | undefined): boolean {
  if (!lastSeason) return false
  return lastSeason.playoffResult === 'champion' || lastSeason.finalPosition === 1
}

// ── Sommarraden ─────────────────────────────────────────────────────────

export type BurnoutZone = ReturnType<typeof getBurnoutZone>

export function deriveSommarLine(zone: BurnoutZone): string {
  switch (zone) {
    case 'frisk': return 'Du var på Gotland i tre veckor. Ingen ringde.'
    case 'markbar': return 'Halva sommaren gick åt till att inte tänka på bandy. Det gick sådär.'
    case 'hog': return 'Du sov mycket. Det hjälpte lite.'
  }
}

// ── Medan du var borta ──────────────────────────────────────────────────

/**
 * Jacobs DOM (2026-08-18): kontraktsutgång väljs FÖRE de tre andra när den
 * finns — den enda där något gick förlorat genom passivitet, de andra tre
 * bara händer. Prioritet: kontraktsutgång → la av → fyllde år → kom upp.
 */
const AWAY_EVENT_PRIORITY: Record<SeasonTransitionEvent['type'], number> = {
  contractExpired: 0, retired: 1, aged: 2, promoted: 3,
}

/**
 * Formaterar alla "Medan du var borta"-rader, i låst prioritetsordning.
 * Den tidigare tre-raderskapningen dolde faktiska kontraktsavgångar när
 * flera spelare lämnade samma sommar.
 * Tomt läge: en enda rad, inte tre tomma punkter (ordern explicit).
 */
export function selectAwayEventLines(events: SeasonTransitionEvent[]): string[] {
  if (events.length === 0) return ['Ingenting hände. Isen låg och väntade.']
  const sorted = [...events].sort((a, b) => AWAY_EVENT_PRIORITY[a.type] - AWAY_EVENT_PRIORITY[b.type])
  return sorted.map(formatAwayEventLine)
}

function formatAwayEventLine(event: SeasonTransitionEvent): string {
  switch (event.type) {
    case 'contractExpired': return `${event.playerLastName}s kontrakt gick ut. Ingen ringde honom i tid.`
    case 'retired': return `${event.playerLastName} la av.`
    case 'aged': return `${event.playerLastName} fyllde ${event.age}.`
    case 'promoted': return `${event.playerLastName} kom upp från P19.`
  }
}

// ── Tändraden ───────────────────────────────────────────────────────────

/**
 * Villkoret för "slutspel inte rimligt" (Jacobs DOM): styrelsens mål är att
 * undvika nedflyttning ELLER föregående säsong slutade utanför slutspelsplats
 * (playoffResult==='didNotQualify' — inte omräknat ur finalPosition, en
 * magisk gräns på två ställen glider isär).
 */
export function deriveIsPlayoffUnlikely(boardWantsAvoidBottom: boolean, lastSeasonDidNotQualify: boolean): boolean {
  return boardWantsAvoidBottom || lastSeasonDidNotQualify
}

export function deriveTandLine(opponentName: string, isPlayoffUnlikely: boolean): string {
  return isPlayoffUnlikely
    ? `Det börjar med ${opponentName}. Sen får vi se hur långt det räcker.`
    : `Det börjar med ${opponentName}. Det slutar i mars.`
}

// ── Säsongsvägen ────────────────────────────────────────────────────────

/** (N-1)*2 — härlett, inte hårdkodat. scheduleGenerator.ts: "For 12 teams: 22 rounds". */
export function deriveSeasonRoundCount(totalClubs: number): number {
  return (totalClubs - 1) * 2
}

// ── CTA / matchtyp-etikett ──────────────────────────────────────────────

const SKEDE_LABEL: Record<Skede, string> = {
  forstarunda: 'första rundan', kvartsfinal: 'kvartsfinal', semifinal: 'semifinal', final: 'final',
}

const TAVLINGSTYP_ICON: Partial<Record<Tavlingstyp, string>> = {
  cup: '🏆', slutspel: '⚔️', liga: '🏒',
}

export interface CtaLabelArgs {
  tavlingstyp: Tavlingstyp
  skede?: Skede
  roundNumber: number
  opponentName: string
}

/**
 * "🏆 Cup · kvartsfinal", "⚔️ Slutspel · semifinal", "🏒 Omgång 1" (ligastart).
 * Skedet härleds ur matchTypeAxes uppströms — den här funktionen formaterar
 * bara, härleder inget nytt (ordern: "bygg ingen ny härledning").
 */
export function deriveEyebrowLabel(args: CtaLabelArgs): string {
  const icon = TAVLINGSTYP_ICON[args.tavlingstyp] ?? '🏒'
  if (args.tavlingstyp === 'liga') return `${icon} Omgång ${args.roundNumber}`
  const skedeLabel = args.skede ? SKEDE_LABEL[args.skede] : ''
  const rubrik = args.tavlingstyp === 'cup' ? 'Cup' : 'Slutspel'
  return skedeLabel ? `${icon} ${rubrik} · ${skedeLabel}` : `${icon} ${rubrik}`
}

/** "CUPEN BÖRJAR. KVARTSFINAL MOT SKUTSKÄR →" — CTA-knappens text. */
export function deriveCtaButtonText(args: CtaLabelArgs): string {
  const opener = args.tavlingstyp === 'cup' ? 'Cupen börjar.'
    : args.tavlingstyp === 'slutspel' ? 'Slutspelet börjar.'
    : 'Säsongen börjar.'
  const skedeLabel = args.skede ? SKEDE_LABEL[args.skede].toUpperCase() : `OMGÅNG ${args.roundNumber}`.toUpperCase()
  return `${opener.toUpperCase()} ${skedeLabel} MOT ${args.opponentName.toUpperCase()} →`
}

// ── Utbrändhetens återhämtning vid övergången ────────────────────────────

const BURNOUT_RECOVERY_FLOOR = 30

/**
 * "återhämta hälften av avståndet ner till 30, men aldrig under 30 om
 * värdet låg över 60." 80→55, 62→46, 40→35, 20→20 (redan under, ingen
 * ändring) — exakta exempel ur ordern, alla fyra täckta av testerna.
 *
 * Ingen separat 60-gren: score - (score-30)/2 = (score+30)/2, medelvärdet
 * av score och golvet. Ett medelvärde med 30 som ena termen kan aldrig
 * hamna under 30 så länge score ≥ 30 — golv-villkoret är alltså redan
 * garanterat av "hälften av avståndet"-formeln, oavsett 60-tröskeln.
 * 60-tröskeln i ordern är motiveringen (varför golvet finns), inte ett
 * eget beräkningsvillkor — en explicit gren här hade varit dödkodsgren.
 */
export function applyBurnoutRecoveryAtTransition(score: number): number {
  if (score <= BURNOUT_RECOVERY_FLOOR) return score
  return score - (score - BURNOUT_RECOVERY_FLOOR) / 2
}
