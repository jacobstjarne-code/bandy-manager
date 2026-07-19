import type { SaveGame } from '../entities/SaveGame'
import { seededPick } from '../utils/random'

/**
 * Fasmarkörer — engångsbanner i Portal, en gång per säsong per fas.
 *
 * 2026-07-19 (ruling): sju faser är bortkastat arbete om alla sju får en
 * markör — höststart/höst/vinter bär ingen egen vikt ("säsongen pågår").
 * Fyra faser bär verklig vikt och får en markör: annandagen (kulturankaret),
 * vinterkris (villkorad på tabellplacering), våroffensiv, slutspurt.
 * Playoff mappas in oförändrad (text fanns redan, bara ny plumbing).
 * Höststart/höst/vinter renderar ingen markör (ingen post i PHASE_MARK_CONTENT).
 *
 * Ersätter det gamla PHASEMARK_LABELS/SEASON_MOOD['endgame']-paret i
 * PortalPhaseMark.tsx — 'endgame' finns inte i sjufasmodellen och retireras
 * (dess text ligger kvar i SEASON_MOOD tills Jacob bekräftat om något ska
 * skördas, men läses inte längre härifrån).
 */
export type PhaseMarkPhase = 'annandagen' | 'vinterkris' | 'våroffensiv' | 'slutspurt' | 'playoff'

interface PhaseMarkContent {
  eyebrow: string
  quotes: string[]
  helper: string
}

const PHASE_MARK_CONTENT: Record<PhaseMarkPhase, PhaseMarkContent> = {
  annandagen: {
    eyebrow: '⬩ ANNANDAGEN ⬩',
    quotes: [
      'Annandagen. Full läktare, kall is, hela bygden.',
      'Det är i dag folk kommer. Även de som aldrig kommer.',
      'Annandan. Året har inte fler dagar som den här.',
    ],
    helper: 'Årets största bandydag',
  },
  vinterkris: {
    eyebrow: '⬩ VINTERKRIS ⬩',
    quotes: [
      'Januari, och tabellen ser ut som den gör.',
      'Mörkt ute, mörkt i tabellen. Nu gäller det.',
      'Det är nu klubbar går sönder. Eller inte.',
    ],
    helper: 'Tabellen tynger',
  },
  våroffensiv: {
    eyebrow: '⬩ VÅROFFENSIV ⬩',
    quotes: [
      'Ljuset kommer tillbaka. Det gör laget också.',
      'Mars. Isen bär fortfarande, men inte länge till.',
      'Nu räknar alla. Poäng, matcher, dagar.',
    ],
    helper: 'Slutet närmar sig',
  },
  slutspurt: {
    eyebrow: '⬩ SLUTSPURT ⬩',
    quotes: [
      'Sista omgångarna. Allt som är kvar är det här.',
      'Nu finns ingen tid att ta igen något.',
      'Det som avgörs nu, avgörs för hela året.',
    ],
    helper: 'Sista omgångarna',
  },
  // 2026-07-19: mappad oförändrad från gamla PHASEMARK_LABELS/SEASON_MOOD.playoff
  // (text redan Opus-godkänd, bara flyttad hit så alla fasmarkörer har en källa).
  playoff: {
    eyebrow: '⬩ Slutspelet börjar ⬩',
    quotes: [
      'Slutspel. Inga andra chanser.',
      'Bäst av fem. Varje match kan vara den sista.',
    ],
    helper: 'Portal har stramat åt — bara det viktiga nu.',
  },
}

export interface PhaseMarkCopy {
  eyebrow: string
  quote: string
  helper: string
}

/** Returnerar copy för en markerbar fas, eller null om fasen inte har en markör. */
export function pickPhaseMarkCopy(phase: string, game: SaveGame): PhaseMarkCopy | null {
  const content = PHASE_MARK_CONTENT[phase as PhaseMarkPhase]
  if (!content) return null
  const seed = game.currentSeason + game.managedClubId.charCodeAt(0) + phase.charCodeAt(0)
  return {
    eyebrow: content.eyebrow,
    quote: seededPick(content.quotes, seed),
    helper: content.helper,
  }
}
