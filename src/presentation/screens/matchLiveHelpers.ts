import type { Fixture } from '../../domain/entities/Fixture'
import type { MatchStep } from '../../domain/services/matchSimulator'
import { FixtureStatus, MatchEventType } from '../../domain/enums'
import type { FeedRow } from '../components/match/commentary/CommentaryFeedStalvallen'

/**
 * Determines whether a match event should be aligned to the home side (left)
 * or away side (right) based on the event's clubId.
 *
 * Bug 0.6 fix: Suspensions (and other team-specific events) must be sided,
 * not centered. This helper is extracted so it can be unit-tested.
 */
export function getEventAlignment(eventClubId: string, homeClubId: string): 'home' | 'away' {
  return eventClubId === homeClubId ? 'home' : 'away'
}

/**
 * BRÅDSKANDE FIX (GPT live-revision, 2026-09-03): matchens slutvillkor,
 * extraherad så den kan delas mellan den vanliga stegtimern och varje
 * interaktionshandlare (corner/penalty/counter/lastMinutePress) som
 * avancerar currentStep manuellt efter sin egen delay. En handlare som
 * saknade detta villkor kunde flytta currentStep utanför steps på matchens
 * sista steg — matchDone sattes aldrig, ingen Granska-knapp, karriären låst.
 * Extraherad hit av samma skäl som shouldRouteQuicksimToCeremony nedan:
 * enhetstestbar utan @testing-library/react.
 */
export function shouldEndMatchAfterStep(currentStep: number, totalSteps: number): boolean {
  return currentStep + 1 >= totalSteps
}

/**
 * A1.5++ (2026-09-01): ett halvtidsbyte bär medvetet sin text på
 * MatchEvent.description medan MatchStep.commentary kan vara tom. Den gamla
 * feeden hade en särskild bytesrad, men Stålvallen-migreringen filtrerade bort
 * hela steget eftersom bara mål/utvisning/räddning räknades som synliga event.
 * Håll synlighetsregeln testbar och gemensam med mappern nedan.
 */
export function shouldIncludeMatchStepInFeed(step: MatchStep): boolean {
  return Boolean(
    step.commentary?.trim() ||
    step.events.some(event =>
      event.type === MatchEventType.Goal ||
      event.type === MatchEventType.Suspension ||
      event.type === MatchEventType.Save ||
      event.type === MatchEventType.Substitution
    )
  )
}

/** Bygger Stålvallens dedikerade bytesrad utan att kräva commentary-text. */
export function getSubstitutionFeedRow(step: MatchStep, homeClubId: string): FeedRow | null {
  const event = step.events.find(candidate => candidate.type === MatchEventType.Substitution)
  if (!event) return null
  return {
    kind: 'event',
    tag: 'sub',
    minute: event.minute,
    team: getEventAlignment(event.clubId, homeClubId),
    text: event.description || 'Byte',
  }
}

/**
 * A-H6 (ceremonivägen, 2026-08-28): bygger EN syntetisk MatchStep som bär
 * det REDAN AVGJORDA, persisterade matchresultatet (fixture.events/
 * homeScore/awayScore/penaltyResult/overtimeResult) — används ENDAST av
 * MatchLiveScreens ceremony-only-läge (isCeremonyOnly, en snabbsimmad
 * SM-final som ska visa samma CeremonySmFinal som en live-match) för att
 * mata komponenten exakt den form av data den redan konsumerar
 * (steps: MatchStep[]), UTAN att re-simulera matchen.
 *
 * Rotorsak till varför re-simulering här är farligt: matchSimProcessor.ts
 * (quicksim, via matchEngine.ts:s simulateMatch) och MatchLiveScreens
 * live-väg (simulateMatchStepByStep) skickar in OLIKA extra kontextfält
 * till samma seedade motor (fanMood/refStyle/chemistry å ena sidan,
 * arenaName/captainPlayerId/supporterContext å andra) — en efterhands-
 * re-simulering kan alltså INTE garanteras reproducera exakt samma
 * resultat som redan skrivits till game.fixtures. Den här funktionen
 * läser bara facit; den räknar aldrig om det.
 */
export function buildCeremonyOnlyStep(fixture: Fixture): MatchStep {
  return {
    step: 60,
    minute: 90,
    events: fixture.events ?? [],
    homeScore: fixture.homeScore,
    awayScore: fixture.awayScore,
    commentary: '',
    intensity: 'low',
    activeSuspensions: { homeCount: 0, awayCount: 0 },
    shotsHome: fixture.report?.shotsHome ?? 0,
    shotsAway: fixture.report?.shotsAway ?? 0,
    onTargetHome: fixture.report?.onTargetHome ?? 0,
    onTargetAway: fixture.report?.onTargetAway ?? 0,
    cornersHome: fixture.report?.cornersHome ?? 0,
    cornersAway: fixture.report?.cornersAway ?? 0,
    phase: fixture.penaltyResult ? 'penalties' : (fixture.overtimeResult ? 'overtime' : 'regular'),
    penaltyDone: fixture.penaltyResult ? true : undefined,
    penaltyFinalResult: fixture.penaltyResult,
    overtimeResult: fixture.overtimeResult,
  }
}

/**
 * A-H6: avgör om en JUST AVSLUTAD quicksim-fixture ska routas till
 * ceremony-only-läget i MatchLiveScreen istället för rakt till /game/review.
 * Extraherad ur MatchScreen.tsx:s handlePlayMatch så villkoret går att
 * enhetstesta utan att rendera skärmen (ingen @testing-library/react i
 * projektet, se matchLive_integration.test.tsx:s arkitekturnotering).
 *
 * homeLineup/awayLineup är optional på Fixture-typen men sätts alltid av
 * både matchEngine.ts (quicksim) och matchActions.ts (live) när en match
 * completas — kravet här är en defensiv spärr, inte en förväntad avslag.
 *
 * Audit 2026-08-29 CRITICAL 1 (falska SM-guld): tog tidigare bara
 * fixture.isNeutralVenue === true som SM-final-tecken — cupfinalen sätter
 * samma flagga (Studenternas IP-mönstret, se economyService.ts). En
 * quicksimmad cupfinal routades då felaktigt till SM-ceremonin. Kräver nu
 * samma bracket-medlemskapskontroll som MatchLiveScreen.tsx:s isSmFinal.
 */
export function shouldRouteQuicksimToCeremony(
  fixture: Fixture | undefined,
  smFinalFixtureIds: ReadonlySet<string> | undefined,
): fixture is Fixture & { homeLineup: NonNullable<Fixture['homeLineup']>; awayLineup: NonNullable<Fixture['awayLineup']> } {
  return (
    fixture?.status === FixtureStatus.Completed &&
    !fixture.isCup &&
    !!smFinalFixtureIds?.has(fixture.id) &&
    !!fixture.homeLineup &&
    !!fixture.awayLineup
  )
}
