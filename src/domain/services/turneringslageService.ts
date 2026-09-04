import type { SaveGame } from '../entities/SaveGame'
import { getManagedClubCupStatus } from './cupService'
import { getManagedClubPlayoffStatus } from './playoffService'
import { PlayoffRound } from '../enums'
import type { Tavlingstyp } from './matchTypeAxes'

/**
 * GRANSKA DEL 4 (2026-08-11), steg 5 — Turneringsläge. Live-lucka ordern
 * beskrev: "jag förlorade en cupsemifinal 4–8 och därmed hela cupen, och
 * ordet 'cup' förekom inte en enda gång på skärmen... Elva sektioner om
 * matchen, noll om vad matchen betydde." Sex lägen, ur data som redan
 * räknas (cupService.getManagedClubCupStatus / playoffService.
 * getManagedClubPlayoffStatus) — ingen ny mekanik.
 */
export type TurneringslageMode =
  | 'ut_forstarunda' | 'ut_kvart' | 'ut_semi' | 'vidare_final' | 'vunnen_final' | 'forlorad_final'

/** Bara cup och slutspel har ett turneringsläge att rapportera. */
export function deriveTurneringslageMode(game: SaveGame, tavlingstyp: Tavlingstyp): TurneringslageMode | null {
  if (tavlingstyp === 'cup') {
    if (!game.cupBracket) return null
    const status = getManagedClubCupStatus(game.cupBracket, game.managedClubId)
    if (status.won) return 'vunnen_final'
    if (status.eliminated) {
      if (status.eliminatedInRound === 4) return 'forlorad_final'
      if (status.eliminatedInRound === 1) return 'ut_forstarunda'
      if (status.eliminatedInRound === 2) return 'ut_kvart'
      if (status.eliminatedInRound === 3) return 'ut_semi'
      return null
    }
    return status.isInFinal ? 'vidare_final' : null
  }

  if (tavlingstyp === 'slutspel') {
    if (!game.playoffBracket) return null
    const status = getManagedClubPlayoffStatus(game.playoffBracket, game.managedClubId)
    if (status.won) return 'vunnen_final'
    if (status.eliminated) {
      if (status.eliminatedInRound === PlayoffRound.Final) return 'forlorad_final'
      if (status.eliminatedInRound === PlayoffRound.QuarterFinal) return 'ut_kvart'
      if (status.eliminatedInRound === PlayoffRound.SemiFinal) return 'ut_semi'
      return null
    }
    return status.isInFinal ? 'vidare_final' : null
  }

  return null
}

/**
 * Text från Opus (2026-08-12), levererad mot den rapporterade listan i
 * SPRINT_GRANSKADEL4_STEG345_AUDIT.md. Cup och slutspel har olika text för
 * samma läge (t.ex. "Cupen är över för den här gången" mot "Säsongen är
 * slut") — därför två separata kartor, inte en delad.
 */
const CUP_TEXT: Record<TurneringslageMode, string> = {
  ut_forstarunda: 'Ut i förstarundan. Cupen blev kort i år.',
  ut_kvart: 'Kvartsfinal, och inte längre. Cupen är över för den här gången.',
  ut_semi: 'En match från final. Cupen slutar här.',
  vidare_final: 'Final. Ni är en match från att ta hem den.',
  vunnen_final: 'Cupen är er.',
  forlorad_final: 'Final och silver. Det tar ett tag innan man ser det som något annat än en förlust.',
}

/** Slutspel har ingen förstarunda (PlayoffRound: kvartsfinal/semifinal/final). */
const SLUTSPEL_TEXT: Record<Exclude<TurneringslageMode, 'ut_forstarunda'>, string> = {
  ut_kvart: 'Kvartsfinal, och inte längre. Säsongen är slut.',
  ut_semi: 'En match från SM-final. Så nära kom ni.',
  vidare_final: 'SM-final. Studenternas väntar.',
  vunnen_final: 'Svenska mästare.',
  forlorad_final: 'SM-final och silver. Ingen tröst i dag. Kanske i mars.',
}

export function getTurneringslageText(mode: TurneringslageMode, tavlingstyp: Tavlingstyp): string {
  if (tavlingstyp === 'cup') return CUP_TEXT[mode]
  if (tavlingstyp === 'slutspel' && mode !== 'ut_forstarunda') return SLUTSPEL_TEXT[mode]
  // Strukturellt onåbart — deriveTurneringslageMode returnerar aldrig
  // 'ut_forstarunda' för slutspel eller något läge alls för liga/avsked.
  return '[Opus]'
}

export interface AwaitingNextRoundInfo {
  title: string
  body: string
}

/**
 * sluttest-53-cup-lucka: Turneringslägets terminala sex lägen (ovan) täcker
 * vinst/förlust/final — men mellan två cupronder, när managerad klubb vunnit
 * sin runda men nästa runda inte är lottad/spelad än, returnerade
 * `deriveTurneringslageMode` null (ingen rad alls, samma "live-lucka"-klass
 * som steg 5 ursprungligen fixade för slutspel/cup-terminal). Egen text
 * (TEXT LÅST 2026-09-04, Opus), inte seriens delade turneringsläge-mall —
 * därför en egen returtyp (titel+body) i stället för en till post i
 * CUP_TEXT/SLUTSPEL_TEXT. Slutspelets motsvarande lucka har redan täckning
 * annanstans; bara cup saknade den.
 */
export function getAwaitingNextRoundInfo(game: SaveGame, tavlingstyp: Tavlingstyp): AwaitingNextRoundInfo | null {
  if (tavlingstyp !== 'cup' || !game.cupBracket || !game.managedClubId) return null
  const bracket = game.cupBracket
  const managedClubId = game.managedClubId
  const status = getManagedClubCupStatus(bracket, managedClubId)
  if (status.won || status.eliminated || status.isInFinal) return null

  const wonRounds = bracket.matches
    .filter(m => m.winnerId === managedClubId)
    .map(m => m.round)
  if (wonRounds.length === 0) return null
  const nextRound = Math.max(...wonRounds) + 1

  const nextMatch = bracket.matches.find(
    m => m.round === nextRound && (m.homeClubId === managedClubId || m.awayClubId === managedClubId),
  )
  if (!nextMatch) {
    return {
      title: 'Cupen väntar',
      body: 'Nästa rond lottas efter omgången. Ni är kvar — det är allt som går att säga just nu.',
    }
  }

  const opponentId = nextMatch.homeClubId === managedClubId ? nextMatch.awayClubId : nextMatch.homeClubId
  const opponent = game.clubs.find(c => c.id === opponentId)
  const fixture = game.fixtures.find(f => f.id === nextMatch.fixtureId)
  const whenClause = fixture?.date
    ? new Date(fixture.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })
    : fixture
      ? `om ${Math.max(1, fixture.matchday - game.currentMatchday)} omgångar`
      : 'snart'

  return {
    title: `Nästa rond: ${opponent?.name ?? 'Okänd motståndare'}`,
    body: `${whenClause}. Tills dess är det serien som räknas.`,
  }
}
