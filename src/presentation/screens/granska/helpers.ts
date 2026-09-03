import { MatchEventType, FixtureStatus, PlayoffStatus } from '../../../domain/enums'
import type { Fixture, ManagerChoiceEntry } from '../../../domain/entities/Fixture'
import type { Player } from '../../../domain/entities/Player'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { GameEvent } from '../../../domain/entities/GameEvent'
import type { Tavlingstyp, Skede } from '../../../domain/services/matchTypeAxes'
import type { KvittoOutcomeDir } from '../../../domain/data/managerKvittoText'
import { getCriticalEventsForGranska } from '../../../domain/services/granskaEventClassifier'
import { SPELKLARHET_FITNESS_FLOOR } from '../../utils/lineupNudge'

/** Finalens ceremoni går via Granska innan säsongsavslutningen. Bara den
 * avgjorda SM-finalen får den routingen; cupfinal och tidigare slutspelsmatcher
 * fortsätter som vanliga matchdagar. */
export function shouldReviewContinueToChampion(
  game: Pick<SaveGame, 'playoffBracket'>,
  fixture: Fixture | undefined,
): boolean {
  return !!fixture && !fixture.isCup &&
    game.playoffBracket?.status === PlayoffStatus.Completed &&
    !!game.playoffBracket.final?.fixtures.includes(fixture.id)
}

/**
 * High 2 (Skutskär-auditen, 2026-08-22, Jacobs dom): hårt villkor, ingen
 * fjärde riktning. En spelare under fitness-golvet (samma
 * SPELKLARHET_FITNESS_FLOOR som "Fyll bästa" nu exkluderar mot) kan ALDRIG
 * få en good/neutral-rad — oavsett matchbetyg. "Han höll trots tunga ben"
 * ljög tidigare om en spelare som var för trött för att räknas som
 * spelklar överhuvudtaget. Extraherad till helpers.ts för direkt testbarhet
 * (GranskaOversikt.tsx är för stor/komplex för komponent-rendering-test).
 */
export function getStartedTiredDirection(
  startedConditionRaw: string,
  rating: number | undefined,
  fallbackDir: KvittoOutcomeDir,
): KvittoOutcomeDir {
  const startedFitness = Number(startedConditionRaw)
  const belowFloor = !Number.isNaN(startedFitness) && startedFitness < SPELKLARHET_FITNESS_FLOOR
  if (belowFloor) return 'bad'
  if (rating !== undefined) return rating >= 7 ? 'good' : rating <= 5 ? 'bad' : 'neutral'
  return fallbackDir
}

/**
 * High-prioritering (GPT-fynd 2026-09-03, verifierat mot 5–0→7–7-matchen där
 * pausbeslutet aldrig nådde ytan): "Dina val" tog tidigare de FÖRSTA fyra
 * loggposterna i befintlig ordning — lågprioriterade automatiska
 * started_tired-rader kunde då fylla hela kvoten innan ett pausbeslut
 * (managerhandling) ens hann in i log-arrayen. Rangordnar loggen FÖRE
 * fyra-begränsningen, inte istället för den: en managerhandling ska aldrig
 * trängas undan av en automatiskt härledd konditionsrad. Stabil sortering
 * (Array.prototype.sort är garanterat stabil sedan ES2019) bevarar
 * kronologisk ordning INOM varje prioritetsnivå — bara nivåerna själva
 * omordnas.
 *
 * Fyra nivåer, Jacobs dom: (1) pausbeslut + aktiva matchbeslut
 * (halftime_tactic/pep_talk), (2) kapten/ledarskap (captain), (3) aktivt
 * vald spelarrotation (bench_fit — vilad-ersättaren), (4) automatiska
 * started_tired-rader, lägst prioritet.
 */
const MANAGER_CHOICE_PRIORITY: Record<ManagerChoiceEntry['type'], number> = {
  halftime_tactic: 0,
  pep_talk: 0,
  captain: 1,
  bench_fit: 2,
  started_tired: 3,
}

export function rankManagerChoiceLog(log: ManagerChoiceEntry[]): ManagerChoiceEntry[] {
  return [...log].sort((a, b) => MANAGER_CHOICE_PRIORITY[a.type] - MANAGER_CHOICE_PRIORITY[b.type])
}

/**
 * Alla beslut som blockerar Granskas fortsättknapp. De tre fristående
 * pending-fälten måste räknas tillsammans med pendingEvents; annars kan ett
 * synligt press-/domarkort lämnas obesvarat när spelaren går vidare.
 */
export function countUnresolvedGranskaDecisions(
  pendingEvents: GameEvent[],
  resolvedEventIds: ReadonlySet<string>,
  pendingPressConference?: GameEvent,
  pendingCSPress?: GameEvent,
  pendingRefereeMeeting?: GameEvent,
): number {
  const unresolvedCritical = getCriticalEventsForGranska(pendingEvents)
    .filter(event => !resolvedEventIds.has(event.id)).length
  const standalone = [pendingPressConference, pendingCSPress, pendingRefereeMeeting]
    .filter((event): event is GameEvent => !!event && !resolvedEventIds.has(event.id)).length
  return unresolvedCritical + standalone
}

/**
 * GRANSKA DEL 4 (2026-08-11/12), steg 4 — fast-lägets prosa. Detta är den
 * ENDA texten en snabbsimmare möter om matchen alls (mode:'fast' genererar
 * ingen kommentar under matchen, till skillnad från live/'full') — se
 * docs/incoming/DESIGN_UPPDRAG_GRANSKA_DEL4-2026-08-11.md.
 *
 * Tre lägen har egna pooler: skede==='final' (delad mellan cup- och
 * SM-final — steg 1: "final är inget eget tävlingstyp-värde"), tävlingstyp
 * 'slutspel' (icke-final), och 'avsked'. Liga och cup (icke-final) rör den
 * befintliga default-logiken nedan orört. Text från Opus (2026-08-12),
 * formulerad så den fungerar oavsett målsiffror — seger/förlust, inga
 * marginal-grenar.
 */
const QUICK_SUMMARY_FINAL_WIN = 'Det var finalen. Ni tog den.'
const QUICK_SUMMARY_FINAL_LOSS = 'Det var finalen. Ni fick åka hem utan.'
const QUICK_SUMMARY_SLUTSPEL_WIN = 'Slutspel. Det märks på tempot.'
const QUICK_SUMMARY_SLUTSPEL_LOSS = 'Slutspel. En match till hade suttit fint.'
const QUICK_SUMMARY_AVSKED_WIN = 'Sista matchen på hemmaisen. Publiken stannade kvar efteråt.'
const QUICK_SUMMARY_AVSKED_LOSS = 'Sista matchen på hemmaisen. Resultatet spelade mindre roll än vanligt.'
const QUICK_SUMMARY_AVSKED_DRAW = 'Sista matchen på hemmaisen. Oavgjort, och ingen brydde sig särskilt.'

/**
 * @cites fixture.homeScore, fixture.awayScore, fixture.penaltyResult, fixture.overtimeResult, fixture.events
 */
export function generateQuickSummary(
  fixture: Fixture,
  managedIsHome: boolean,
  players: Player[],
  tavlingstyp?: Tavlingstyp,
  skede?: Skede,
): string {
  const homeScore = fixture.homeScore
  const awayScore = fixture.awayScore
  const myScore = managedIsHome ? homeScore : awayScore
  const theirScore = managedIsHome ? awayScore : homeScore

  // Rotorsak (upptäckt 2026-08-12, i samma steg som pratade in de här
  // poolerna): fixture.homeScore/awayScore är alltid LIKA på en straff-
  // avgjord match — en ren poängjämförelse hade klassat en vunnen
  // cupsemifinal på straffar som "oavgjort". won/lost härleds därför
  // OT-/straffmedvetet, samma logik GranskaScreen.tsx redan använder för
  // samma syfte (återanvänd, inte omskriven). Gäller ALLA isKnockout-
  // matcher (cup + slutspel, alla ronder) — inte bara final/avsked-grenarna.
  const penResult = fixture.penaltyResult
  const otResult = fixture.overtimeResult
  const wonByPenalties = penResult ? (managedIsHome ? penResult.home > penResult.away : penResult.away > penResult.home) : false
  const lostByPenalties = penResult ? (managedIsHome ? penResult.home < penResult.away : penResult.away < penResult.home) : false
  const wonByOT = otResult ? (managedIsHome ? otResult === 'home' : otResult === 'away') : false
  const lostByOT = otResult ? (managedIsHome ? otResult === 'away' : otResult === 'home') : false
  const won = myScore > theirScore || wonByOT || wonByPenalties
  const lost = myScore < theirScore || lostByOT || lostByPenalties

  // Final är alltid avgjord (isKnockout → övertid/straffar vid lika) —
  // ingen tredje "oavgjort"-variant given eller behövd.
  if (skede === 'final') return won ? QUICK_SUMMARY_FINAL_WIN : QUICK_SUMMARY_FINAL_LOSS
  if (tavlingstyp === 'slutspel') return won ? QUICK_SUMMARY_SLUTSPEL_WIN : QUICK_SUMMARY_SLUTSPEL_LOSS
  if (tavlingstyp === 'avsked') {
    // Avsked är, till skillnad från final/slutspel, inte nödvändigtvis en
    // isKnockout-match — en avskedsmatch KAN sluta oavgjort (vanlig ligamatch
    // med farewellMatchForPlayerId satt). Tredje raden levererad 2026-08-12.
    if (won) return QUICK_SUMMARY_AVSKED_WIN
    if (lost) return QUICK_SUMMARY_AVSKED_LOSS
    return QUICK_SUMMARY_AVSKED_DRAW
  }

  const margin = myScore - theirScore
  const totalGoals = homeScore + awayScore

  const goals = fixture.events.filter(e => e.type === MatchEventType.Goal)
  // Bandy spelas i 90 minuter. Den gamla 55-minutersgränsen kom från den
  // tidiga 60-minutersprototypen och kallade en stor del av andra halvlek
  // för "slutminuterna".
  const lateGoals = goals.filter(e => (e.minute ?? 0) >= 80)
  const lateDecider = lateGoals.length > 0 && Math.abs(margin) <= 1

  const scorerCounts: Record<string, number> = {}
  const scorerNames: Record<string, string> = {}
  const managedClubId = managedIsHome ? fixture.homeClubId : fixture.awayClubId
  goals.filter(e => e.clubId === managedClubId).forEach(e => {
    if (e.playerId) {
      scorerCounts[e.playerId] = (scorerCounts[e.playerId] ?? 0) + 1
      const p = players.find(pl => pl.id === e.playerId)
      scorerNames[e.playerId] = p ? p.lastName : 'Okänd'
    }
  })
  const allScorers = Object.entries(scorerCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([pid, n]) => ({ name: scorerNames[pid] ?? 'Okänd', n }))

  function scorerLine(): string | null {
    if (allScorers.length === 0) return null
    if (allScorers.length === 1 && allScorers[0].n === 1) return `${allScorers[0].name} satte det enda målet.`
    if (allScorers.length === 1) return `${allScorers[0].name} svarade för samtliga ${allScorers[0].n} mål.`
    const top = allScorers[0]
    if (top.n >= 3) return `${top.name} dominerade målprotokollen med ${top.n} mål.`
    if (top.n === 2) return `${top.name} sköt två. Övriga: ${allScorers.slice(1).map(s => s.name).join(', ')}.`
    return allScorers.slice(0, 4).map(s => `${s.name} (${s.n})`).join(', ') + '.'
  }

  const lines: string[] = []

  if (won) {
    if (margin >= 4) lines.push('En övertygande seger.')
    else if (margin === 3) lines.push('En klar seger.')
    else if (margin === 2) lines.push('En välförtjänt seger.')
    else if (lateDecider) lines.push('En dramatisk seger i slutminuterna.')
    else lines.push('En knapp men viktig seger.')
  } else if (lost) {
    if (margin <= -4) lines.push('En tung matchdag att glömma.')
    else if (margin === -3) lines.push('En klar förlust.')
    else if (lateDecider) lines.push('En bitter förlust i matchens slutskede.')
    else lines.push('En förlust att analysera.')
  } else {
    lines.push('En poäng som känns som en förlust — eller en vinst, beroende på perspektiv.')
  }

  const sl = scorerLine()
  if (sl) lines.push(sl)

  if (totalGoals >= 10) lines.push('Många mål i en öppen match.')
  else if (totalGoals <= 2) lines.push('En tät och defensiv drabbning.')

  return lines.join(' ')
}

/**
 * PÅSTÅENDEKARTAN (2026-08-24): halftime_tactic (quicksim: lugna/pressa) och
 * pep_talk (live: push/calm) är beslut FATTADE VID PAUS — utfallet läste
 * tidigare hela matchens kvittoDir (won/lost), en proxy. Ett lag kan vinna
 * matchen på första halvleks försprång och ändå tappa andra halvlek helt,
 * eller tvärtom — helmatchsresultatet påstår ingenting om PAUSVALETS effekt.
 * Räknar mål efter minut 46 (matchCore.ts: steg 31 = minut 46+ = andra
 * halvlek, se simulateSecondHalf-kommentaren rad 79). Ingen half-flagga
 * behövs här (till skillnad från den skrapade bandygrytan-datan i
 * docs/kunskapsbas/DATA.md) — matchCore.ts:s minute = Math.round(step*1.5)
 * är en deterministisk, egenproducerad tidsaxel utan den externa datans
 * tilläggstids-tvetydighet vid gränsen.
 *
 * Faller tillbaka på hela matchens kvittoDir bara om inga målhändelser finns
 * att räkna på (t.ex. silent-läge utan detaljerade matchhändelser) — hellre
 * den gamla, kända proxyn än att gissa en riktning ur tomma data.
 */
export function getSecondHalfKvittoDir(
  fixture: Fixture | undefined,
  managedClubId: string | undefined,
  fallbackDir: KvittoOutcomeDir,
): KvittoOutcomeDir {
  if (!fixture?.events?.length || !managedClubId) return fallbackDir
  let managed = 0
  let opp = 0
  for (const e of fixture.events) {
    if (e.type !== MatchEventType.Goal || (e.minute ?? 0) < 46) continue
    if (e.clubId === managedClubId) managed++
    else opp++
  }
  if (managed === 0 && opp === 0) return fallbackDir
  return managed > opp ? 'good' : managed < opp ? 'bad' : 'neutral'
}

/**
 * PÅSTÅENDEKARTAN (2026-08-24): bench_fit ("Vilad") läste tidigare hela
 * lagets matchresultat — redan dokumenterat som proxy i managerKvittoText.ts:
 * "kvittoDir sätts av lagets matchresultat, inte den spelarens faktiska
 * bidrag." Denna funktion hittar den spelare som faktiskt tog den vilade
 * spelarens plats i startelvan (samma position, startade DENNA match) och
 * returnerar DENNES matchbetyg — den vilade spelaren själv spelade ju inte,
 * så det är ersättarens insats kvittot ska spegla, inte lagets.
 *
 * Disambiguering när fler spelare delar position: föredrar den kandidat som
 * INTE startade föregående match för samma klubb (ett genuint "kom in"-byte).
 * Om det fortfarande är oklart vilken spelare som är "ersättaren" (0 eller
 * ≥2 kandidater kvar efter den filtreringen) returneras undefined — hellre
 * tyst än en gissning på fel spelare (samma princip som H2/H3).
 */
export function findRotationSubstituteRating(
  fixture: Fixture,
  game: SaveGame,
  benchedPlayerId: string,
): number | undefined {
  const managedClubId = game.managedClubId
  const isHome = fixture.homeClubId === managedClubId
  const myLineup = isHome ? fixture.homeLineup : fixture.awayLineup
  const benchedPlayer = game.players.find(p => p.id === benchedPlayerId)
  if (!myLineup || !benchedPlayer) return undefined

  let candidates = myLineup.startingPlayerIds
    .map(id => game.players.find(p => p.id === id))
    .filter((p): p is Player => !!p && p.position === benchedPlayer.position)
  if (candidates.length === 0) return undefined

  if (candidates.length > 1) {
    const priorFixture = game.fixtures
      .filter(f =>
        f.status === FixtureStatus.Completed &&
        f.matchday < fixture.matchday &&
        (f.homeClubId === managedClubId || f.awayClubId === managedClubId)
      )
      .sort((a, b) => b.matchday - a.matchday)[0]
    const priorLineup = priorFixture
      ? (priorFixture.homeClubId === managedClubId ? priorFixture.homeLineup : priorFixture.awayLineup)
      : undefined
    if (priorLineup) {
      const newIn = candidates.filter(c => !priorLineup.startingPlayerIds.includes(c.id))
      if (newIn.length === 1) candidates = newIn
    }
  }

  if (candidates.length !== 1) return undefined
  return fixture.report?.playerRatings[candidates[0].id]
}

/**
 * PÅSTÅENDEKARTAN (2026-08-24): GranskaScreen.tsx:s resolvedEventIds/
 * chosenLabels-useState är en OPTIMISTISK overlay för den omedelbara
 * klick-animationen (600ms innan resolveEvent() faktiskt kör) — inte längre
 * den enda sanningen. game.resolvedChoices (skriven i eventResolver.ts) är
 * den nedskrivna sanningen och överlever en remount/omladdning. Slår ihop
 * båda: overlayen vinner under de första 600ms:en (den kan innehålla ett
 * event resolveEvent inte hunnit skriva till game ännu), den persisterade
 * sanningen täcker allt som redan är skrivet. Extraherad hit för direkt
 * testbarhet — samma motivering som getStartedTiredDirection ovan.
 *
 * @cites SaveGame.resolvedChoices
 */
export function mergeResolvedChoices(
  persisted: NonNullable<SaveGame['resolvedChoices']>,
  optimisticIds: Set<string>,
  optimisticLabels: Record<string, string>,
): { resolvedEventIds: Set<string>; chosenLabels: Record<string, string> } {
  return {
    resolvedEventIds: new Set([...persisted.map(c => c.eventId), ...optimisticIds]),
    chosenLabels: {
      ...Object.fromEntries(persisted.map(c => [c.eventId, c.label])),
      ...optimisticLabels,
    },
  }
}

/**
 * PÅSTÅENDEGRINDEN nivå 3 — citatkravet, den enda hårda runtime-versionen
 * (docs/PASTAENDEGRINDEN_2026-08-24.md, "byggs sist, efter mätning").
 * "En yta som saknar sitt citat ska kasta i dev och falla tillbaka på
 * tystnad i produktion — aldrig rendera ett obelagt påstående för en
 * spelare."
 *
 * DecisionCard.tsx renderar redan `resolved` med bara en tom etikett om
 * `chosenLabel` saknas (ingen fabricerad text — produktions-tystnaden
 * fanns redan strukturellt, per hur React renderar `{undefined}`) — men
 * det UX-hålet (bock utan förklaring) kunde tidigare segla genom en hel
 * release oupptäckt, eftersom inget kastade när det uppstod. Denna
 * funktion är den enda platsen "resolved" beräknas i GranskaOversikt.tsx
 * (fyra call-sites: events/pressConference/csPress/refereeMeeting) — ett
 * event markerat resolved MÅSTE ha ett citat i `chosenLabels` (som i sin
 * tur bara kan komma från `mergeResolvedChoices`, ovan, som i sin tur
 * bara läser `game.resolvedChoices`/den optimistiska overlayen). Om det
 * INTE gör det betyder det att `resolveEvent()` (eventResolver.ts) löste
 * eventet UTAN att skriva en resolvedChoices-post — en riktig bugg i
 * skrivkedjan, inte ett OK-att-ignorera-läge.
 *
 * @cites resolvedEventIds, chosenLabels
 */
export function resolvedWithAssertedLabel(
  eventId: string,
  resolvedEventIds: Set<string>,
  chosenLabels: Record<string, string>,
): boolean {
  const resolved = resolvedEventIds.has(eventId)
  if (resolved && chosenLabels[eventId] === undefined && import.meta.env.DEV) {
    throw new Error(
      `PÅSTÅENDEGRINDEN nivå 3: event ${eventId} är markerat resolved men game.resolvedChoices (eller den optimistiska overlayen) bär inget citat för det — "vilket val spelaren gjorde" kan inte beläggas. Kontrollera att resolveEvent() (eventResolver.ts) faktiskt skrev en resolvedChoices-post för denna choiceId.`,
    )
  }
  return resolved
}

// Seeded random for shot map positions
export function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

export function ratingColor(r: number): string {
  if (r >= 8) return 'var(--success)'
  if (r >= 6.5) return 'var(--text-primary)'
  if (r >= 5) return 'var(--text-secondary)'
  return 'var(--danger)'
}
