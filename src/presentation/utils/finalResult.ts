import type { MatchStep } from '../../domain/services/matchUtils'

/**
 * PÅSTÅENDEKARTAN (2026-08-24), Jacobs prioritet 1 (högsta i listan):
 * CeremonySmFinal.tsx läste tidigare bara reglertidens homeScore/awayScore
 * för "vann vi SM-guldet" — vid ett straffavgörande förblir de lika, så en
 * klubb som vann på straffar visades som silvermedaljör. Samma korrekta
 * uträkning fanns redan i MatchLiveScreen.tsx (penStep-mönstret, för
 * champagne-ljudet) men kopplades aldrig in i ceremonin. Extraherad hit för
 * direkt testbarhet, samma motivering som helpers.ts i granska/.
 *
 * @cites MatchStep.penaltyFinalResult
 */
export function didManagedWinFinal(
  managedIsHome: boolean,
  homeScore: number,
  awayScore: number,
  steps: MatchStep[],
): boolean {
  const penStep = steps.find(s => s.penaltyDone && s.penaltyFinalResult)
  const penaltyFinalResult = penStep?.penaltyFinalResult
  const managedScore = penaltyFinalResult
    ? (managedIsHome ? penaltyFinalResult.home : penaltyFinalResult.away)
    : (managedIsHome ? homeScore : awayScore)
  const opponentScore = penaltyFinalResult
    ? (managedIsHome ? penaltyFinalResult.away : penaltyFinalResult.home)
    : (managedIsHome ? awayScore : homeScore)
  return managedScore > opponentScore
}
