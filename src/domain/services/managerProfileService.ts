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
import { FixtureStatus } from '../enums'
import { deriveUtfall } from './matchTypeAxes'

const BURNOUT_HISTORY_MAX = 22

const BURNOUT_LOSS_PER_RECENT = 10   // per loss in last 3 rounds
const BURNOUT_FATIGUE_WEIGHT = 0.3
const BURNOUT_INBOX_WEIGHT = 0.3
const BURNOUT_INBOX_MAX_DELTA = 6   // cap so a large unread pile doesn't pin burnout
export const BURNOUT_WIN_RECOVERY = 5
/**
 * HIGH 10-omkalibrering 2026-08-30 (3 → 14). Konstanten var satt när decayen
 * bara fyrade vid `delta === 0`, dvs. i praktiken aldrig — dess magnitud var
 * därför aldrig prövad mot något. När den nu dras varje omgång är den
 * baslinjen som avgör om en manager som svarar kan ta sig ner igen.
 * Mätningen (scripts/high10-burnout-arc-matning-2026-08-30.ts) prövade
 * 3/4/5/6/8/10/12/14/16 — se D026 och doktrinens mättillägg.
 */
export const BURNOUT_NATURAL_DECAY = 14
const BURNOUT_TRIGGER_THRESHOLD = 70
const BURNOUT_TRIGGER_ROUNDS = 2     // consecutive rounds above threshold before BurnoutMark
const BURNOUT_CEILING = 100

/**
 * DOM_BURNOUT_TAK_2026-09-02 — D-fact-platshållare, Jacobs känslo-kalibrering
 * väntar en mätning (domens eget "Godkänt när", en dominant-men-pressad
 * karriär). Rör inte utan att mäta, samma disciplin som BURNOUT_NATURAL_DECAY.
 *
 * TRIGGER_ROUNDS: antal RAKA omgångar på exakt taket innan valet fyrar.
 * RECOVERY_WINDOW_ROUNDS: hur länge "Kliv tillbaka"s garanterade nedtrend pågår.
 * RECOVERY_MAX_DELTA: Jacobs vägval (a), inte ett hårdsatt score. Under
 *   fönstret klampas NETTODELTAT (press minus återhämtning, samma delta som
 *   alltid beräknas) till som mest detta värde — `Math.min(delta, denna)`.
 *   Ett lågt press-läge ger fortfarande sitt naturligt STÖRRE (mer negativt)
 *   delta oförändrat; klampen aktiverar bara som ett GOLV när pressen annars
 *   hade ätit upp återhämtningen (GPT:s 100→97-fynd, nettoresultat ~-0,3/
 *   omgång). Mätaren förblir en ärlig läsning av press minus återhämtning —
 *   den ljuger aldrig om ett bättre tillstånd än det faktiska (domens egen
 *   princip: "mätaren måste fortsätta kommunicera"). Negativt värde =
 *   garanterad nedgång, aldrig ett positivt nettodelta under fönstret.
 * BOARD_PATIENCE_COST: "tålamodskostnaden" (kliv tillbaka-priset, domens C).
 */
export const BURNOUT_CEILING_TRIGGER_ROUNDS = 4
export const BURNOUT_CEILING_RECOVERY_WINDOW_ROUNDS = 6
export const BURNOUT_CEILING_RECOVERY_MAX_DELTA = -3
export const BURNOUT_CEILING_BOARD_PATIENCE_COST = -10

/** Burnout-zonen, namngiven. Läses av ManagerProfile.lastShownBurnoutZone. */
export type BurnoutZone = 'frisk' | 'markbar' | 'hog'

/** Den dominerande press-källan bakom nuvarande burnout-nivå. */
export type BurnoutCause = 'losses' | 'inbox' | 'fatigue'

/**
 * HIGH 10 — semanticKey:s för narrativeBeatLog (wasLoggedThisRound,
 * narrativeLogService.ts). Fasta, opoolade nycklar (till skillnad från
 * BURNOUT_QUOTE_PREFIX/BURNOUT_HELPER_PREFIX, som poolroterar per zon) —
 * render-lagret frågar bara "fyrade DEN HÄR beat-typen just denna omgång",
 * inte vilken rad som visades. roundProcessor loggar en av dem när
 * shouldShowBurnoutMark/Relief/Close fyrar (ömsesidigt uteslutande, så högst
 * en per omgång); portalkorten läser loggen istället för att återköra
 * predikaten mot det redan stämplade profil-tillståndet (se
 * wasLoggedThisRound:s docstring för varför en återkörning alltid ger nej).
 */
export const BURNOUT_MARK_FIRED_KEY = 'burnout_beat_mark'
export const BURNOUT_RELIEF_FIRED_KEY = 'burnout_beat_relief'
export const BURNOUT_CLOSE_FIRED_KEY = 'burnout_beat_close'

// AUDIT (2026-08-17): enda källan för hur tränarens namn visas för spelaren.
// Enordsnamn (t.ex. "Säsongstest") fick tidigare ett SLUMPAT efternamn hängt
// på sig i vissa vyer (BurnoutMark, TranareTab, resolveContractExtension) via
// managerProfile.lastName — som är en fallback-genererad text från
// generateManagerProfile, inte något spelaren skrivit in. game.managerName är
// alltid EXAKT vad spelaren skrev in vid NameInputScreen. Alla ytor som visar
// tränarens namn ska läsa den här funktionen — aldrig profile.firstName/
// .lastName direkt för visning.
//
// 2026-08-17: fallback till 'Tränaren' om managerName saknas (samma mönster
// som eventResolver.ts's båda anrop) — riktiga sparfiler har alltid fältet
// (NameInputScreen kräver ett namn, saveGameStorage validerar det vid import),
// men funktionen är dokumenterad som EN källa alla ytor ska anropa utan egen
// guard, så den ska själv degradera i stället för att krascha hela rendret om
// ett ofullständigt game-objekt (dev-scen-mock, framtida fixture) saknar det.
// Rotorsak till tranare-scenens timeout i tap-target-gaten: DevScenesScreen.tsx's
// makeGame() saknade managerName, TranareTab kraschade i renderingen (naken
// .trim() på undefined), ErrorBoundary ersatte hela skärmen inklusive DEV
// GALLERY-headern — Playwright väntade på text som aldrig kom tillbaka.
export function getManagerDisplayName(game: SaveGame): string {
  return (game.managerName ?? '').trim() || 'Tränaren'
}

// Initialer för ManagerPortrait m.fl. Tar en redan trimmad displayName (från
// getManagerDisplayName) så att enordsnamn INTE behöver en fabricerad andra
// bokstav från ett slumpat efternamn — istället används de två första
// bokstäverna i det enda ordet.
export function getManagerInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

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
    diary: [],
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

/**
 * CoachRivalry är historiskt klubbnycklad (clubId), trots namnet. Samma
 * härledning används därför av både Tränare-fliken och Portal-callbacken;
 * ingen av ytorna får utse en annan nemesis genom en parallell score-formel.
 */
export function coachNemesisScore(rivalry: CoachRivalry): number {
  const meetings = rivalry.h2hWins + rivalry.h2hDraws + rivalry.h2hLosses
  return meetings * Math.max(0, rivalry.h2hLosses - rivalry.h2hWins)
}

export function deriveCoachNemesis(rivalries: CoachRivalry[]): CoachRivalry | null {
  return rivalries
    .filter(rivalry => coachNemesisScore(rivalry) > 0)
    .sort((a, b) => coachNemesisScore(b) - coachNemesisScore(a))[0] ?? null
}

export function updateH2HRecord(
  profile: ManagerProfile,
  opponentClubId: string,
  managedScore: number,
  opponentScore: number,
): ManagerProfile {
  const existing = profile.coachRivalries.some(r => r.clubId === opponentClubId)
  const rivalries = profile.coachRivalries.map(r => {
    if (r.clubId !== opponentClubId) return r
    if (managedScore > opponentScore) return { ...r, h2hWins: r.h2hWins + 1 }
    if (managedScore < opponentScore) return { ...r, h2hLosses: r.h2hLosses + 1 }
    return { ...r, h2hDraws: r.h2hDraws + 1 }
  })
  if (existing) return { ...profile, coachRivalries: rivalries }

  return {
    ...profile,
    coachRivalries: [...rivalries, {
      clubId: opponentClubId,
      h2hWins: managedScore > opponentScore ? 1 : 0,
      h2hDraws: managedScore === opponentScore ? 1 : 0,
      h2hLosses: managedScore < opponentScore ? 1 : 0,
    }],
  }
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
  managerName: string,
): { profile: ManagerProfile; inboxText: string | null } {
  const seasonsLeft = profile.contractUntilSeason - currentSeason
  if (seasonsLeft > 1) return { profile, inboxText: null }

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

/**
 * HIGH 10 (DOM_HIGH10_BURNOUT_BAGE_2026-08-29.md, punkt 1): de tre
 * press-komponenterna, härledda EN gång och lästa av både
 * updateManagerBurnout (som räknar) och deriveBurnoutCause (som pekar ut
 * den dominerande källan för spelaren). Två separata uträkningar av samma
 * tre tal hade drivit isär vid första konstantändringen.
 */
export interface BurnoutPress {
  lossDelta: number
  inboxDelta: number
  fatigueDelta: number
  pressDelta: number
  lastWon: boolean
}

export function computeBurnoutPress(game: SaveGame): BurnoutPress {
  // HIGH 10-mätningen 2026-08-30, tredje fyndet: filtret var
  // `homeScore !== undefined`, men scheduleGenerator sätter homeScore/
  // awayScore till 0 redan när en fixture SKAPAS (status 'scheduled') — de
  // är alltså aldrig undefined. Sorteringen på fallande matchday plockade
  // därför de tre HÖGSTA matchdagarna i hela säsongsprogrammet, som nästan
  // alltid är ospelade 0–0-platshållare. Följden: lossDelta var permanent 0
  // och lastWon permanent false hela säsongen utom de sista omgångarna —
  // burnout drevs i praktiken ALDRIG av matchresultat, bara av fatigue och
  // inkorg, tvärtemot D026:s egen beskrivning ("ska drivas av matchresultat
  // + beslutsfatigue"). status === Completed är kodbasens kanoniska
  // spelat-predikat (anslagService, mediaService, gameInvariants m.fl.).
  const recentFixtures = game.fixtures
    .filter(f => f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
    .filter(f => f.status === FixtureStatus.Completed)
    .filter(f => !f.isCup && !f.isKnockout)
    .filter(f => f.homeScore !== undefined && f.awayScore !== undefined)
    .sort((a, b) => b.matchday - a.matchday)
    .slice(0, 3)

  // Losses in last 3 rounds
  let lossDelta = 0
  let lastWon = false
  for (const [index, f] of recentFixtures.entries()) {
    const outcome = deriveUtfall(f, game.managedClubId)
    if (outcome === 'forlorat') lossDelta += BURNOUT_LOSS_PER_RECENT
    if (outcome === 'vunnet' && index === 0) lastWon = true
  }

  // Decision fatigue
  const fatigue = (game.fatigueHistory ?? []).slice(-1)[0] ?? 0
  const fatigueDelta = fatigue * BURNOUT_FATIGUE_WEIGHT

  // Inbox pending items
  const unread = game.inbox.filter(i => !i.isRead).length
  const inboxDelta = Math.min(unread * BURNOUT_INBOX_WEIGHT, BURNOUT_INBOX_MAX_DELTA)

  return {
    lossDelta,
    inboxDelta,
    fatigueDelta,
    pressDelta: lossDelta + inboxDelta + fatigueDelta,
    lastWon,
  }
}

/**
 * HIGH 10 punkt 1 — synlig orsak. Returnerar den DOMINERANDE av de tre
 * press-källorna denna omgång, eller undefined när ingen press finns alls.
 *
 * Tie-break: förluster > inkorg > fatigue. Godtyckligt men deterministiskt
 * valt — ordningen speglar hur avläsbar källan är för spelaren (en förlust
 * är en händelse hen minns; fatigue-mätaren är den mest abstrakta).
 */
export function deriveBurnoutCause(game: SaveGame): BurnoutCause | undefined {
  const { lossDelta, inboxDelta, fatigueDelta } = computeBurnoutPress(game)
  if (lossDelta <= 0 && inboxDelta <= 0 && fatigueDelta <= 0) return undefined
  if (lossDelta >= inboxDelta && lossDelta >= fatigueDelta) return 'losses'
  if (inboxDelta >= fatigueDelta) return 'inbox'
  return 'fatigue'
}

export function updateManagerBurnout(game: SaveGame): ManagerProfile | undefined {
  const profile = game.managerProfile
  if (!profile) return undefined

  const press = computeBurnoutPress(game)

  // HIGH 10 punkt "Fixa återhämtningen" (DOM_HIGH10_BURNOUT_BAGE_2026-08-29.md).
  // Den gamla gaten var `if (delta === 0) delta -= BURNOUT_NATURAL_DECAY` —
  // strukturellt död, eftersom en enda oläst inkorgspost (+0.3) eller vilken
  // fatigue som helst gjorde summan nollskild. Decayen fyrade alltså nästan
  // aldrig och burnout ratchetade upp utan väg tillbaka inom en säsong.
  // Nu: press (förlust + fatigue + inkorg) och återhämtning (seger + decay)
  // räknas var för sig, och decayen är ALLTID en baslinjedragning nedåt.
  // Hårt pressad manager (3 förluster = +30) nettar fortfarande kraftigt
  // positivt och eskalerar; lätt pressad (en oläst post = +0.3) nettar
  // negativt och återhämtar sig.
  let recoveryDelta = 0
  if (press.lastWon) recoveryDelta -= BURNOUT_WIN_RECOVERY
  recoveryDelta -= BURNOUT_NATURAL_DECAY

  let delta = press.pressDelta + recoveryDelta

  // DOM_BURNOUT_TAK_2026-09-02 (C), Jacobs vägval (a) — INTE ett hårdsatt
  // score. Mätaren förblir en ärlig läsning av press minus återhämtning;
  // klampen är ett GOLV på nettodeltat som bara griper in när pressen annars
  // hade ätit upp återhämtningen helt (GPT:s 100→97-fynd). Ett lågt press-läge
  // ger fortfarande sitt naturligt större (mer negativt) delta oförändrat —
  // Math.min tar det MEST negativa av de två, aldrig ett positivt netto under
  // fönstret.
  const ceilingRecoveryActive = (game.burnoutCeilingRecoveryUntilRound ?? 0) >= game.currentMatchday
  if (ceilingRecoveryActive) {
    delta = Math.min(delta, BURNOUT_CEILING_RECOVERY_MAX_DELTA)
  }

  const newScore = Math.max(0, Math.min(100, profile.burnoutScore + delta))
  const newHistory = [...profile.burnoutHistory, newScore].slice(-BURNOUT_HISTORY_MAX)

  // Orsaken uppdateras bara när det FINNS en press denna omgång. En lugn
  // omgång i en fortsatt förhöjd zon ska inte nolla "varför" — då hade
  // orsaksraden flimrat bort på en enda tyst omgång.
  const lastBurnoutCause = press.pressDelta > 0
    ? deriveBurnoutCause(game)
    : profile.lastBurnoutCause

  // DOM_BURNOUT_TAK_2026-09-02 (A) — episod-räknaren. Nollställs så fort
  // scoret sjunker under taket (en avbruten svit räknas inte vidare); en NY
  // episod (om taket nås igen senare i karriären) får då erbjuda valet på
  // nytt (burnoutCeilingChoiceOffered nollställs i samma steg).
  const atCeiling = newScore >= BURNOUT_CEILING
  const roundsAtBurnoutCeiling = atCeiling ? (profile.roundsAtBurnoutCeiling ?? 0) + 1 : 0
  const burnoutCeilingChoiceOffered = atCeiling ? profile.burnoutCeilingChoiceOffered : false

  return {
    ...profile,
    burnoutScore: newScore,
    burnoutHistory: newHistory,
    lastBurnoutCause,
    roundsAtBurnoutCeiling,
    burnoutCeilingChoiceOffered,
  }
}

/**
 * DOM_BURNOUT_TAK_2026-09-02 (A) — tak-triggern. Fyrar EN gång per
 * sammanhängande episod vid taket (ihållande MAX, inte en första mild
 * burnout — SKYDDAT-punkten). Läses av eventProcessor.ts.
 */
export function shouldTriggerBurnoutCeilingChoice(profile: ManagerProfile): boolean {
  if (profile.burnoutCeilingChoiceOffered) return false
  return (profile.roundsAtBurnoutCeiling ?? 0) >= BURNOUT_CEILING_TRIGGER_ROUNDS
}

/**
 * Ihållande hög burnout (2+ omgångar ≥70), utan hänsyn till om det redan
 * narrerats. Bruten ut ur shouldShowBurnoutMark 2026-08-30 (HIGH 10-
 * följdfix) eftersom TranareTab.tsx behöver DEN HÄR versionen — en
 * persistent statusflik som alltid ska visa ett representativt citat medan
 * zonen ligger kvar hög, till skillnad från Portal-kortet, som bara ska
 * flaga NÄR det händer (se shouldShowBurnoutMark).
 */
export function isSustainedHighBurnout(profile: ManagerProfile): boolean {
  const recent = profile.burnoutHistory.slice(-BURNOUT_TRIGGER_ROUNDS)
  return recent.length >= BURNOUT_TRIGGER_ROUNDS && recent.every(v => v >= BURNOUT_TRIGGER_THRESHOLD)
}

/**
 * Eskaleringsbeaten: ihållande hög burnout SOM INTE redan narrerats. HIGH 10
 * punkt 2 — den gamla versionen var tillståndslös och re-kvalificerade varje
 * omgång zonen råkade ligga kvar över tröskeln, så samma "trött"-beat
 * presenterades om och om igen som en ny händelse. Scopet är oförändrat:
 * den här funktionen har alltid bara täckt 'hog'.
 *
 * ANVÄNDS AV roundProcessor.ts FÖR ATT BESLUTA — inte av render-lagret.
 * lastShownBurnoutZone stämplas till nuvarande zon i SAMMA steg som detta
 * beslut fattas, så en portalkomponent som återkör detta predikat mot det
 * redan lagrade tillståndet får alltid nej (before===after). Render-lagret
 * ska läsa narrativeBeatLog (wasLoggedThisRound + BURNOUT_MARK_FIRED_KEY)
 * istället — se BurnoutMark.tsx.
 */
export function shouldShowBurnoutMark(profile: ManagerProfile): boolean {
  if (!isSustainedHighBurnout(profile)) return false
  return getBurnoutZone(profile.burnoutScore) !== profile.lastShownBurnoutZone
}

const BURNOUT_ZONE_SEVERITY: Record<BurnoutZone, number> = { frisk: 0, markbar: 1, hog: 2 }

/**
 * HIGH 10 punkt 3 — återhämtningsprogression. Zonen har SJUNKIT sedan den
 * senast narrerades, men har inte nått hela vägen till 'frisk' (då är det
 * slutbeaten som gäller). Utan en tidigare visad zon finns ingenting att
 * ha lättnad FRÅN.
 *
 * ANVÄNDS AV roundProcessor.ts FÖR ATT BESLUTA — se shouldShowBurnoutMarks
 * motsvarande varning. Render-lagret läser BURNOUT_RELIEF_FIRED_KEY via
 * wasLoggedThisRound, inte detta predikat direkt.
 */
export function shouldShowBurnoutRelief(profile: ManagerProfile): boolean {
  const shown = profile.lastShownBurnoutZone
  if (!shown) return false
  const current = getBurnoutZone(profile.burnoutScore)
  if (current === 'frisk') return false
  return BURNOUT_ZONE_SEVERITY[current] < BURNOUT_ZONE_SEVERITY[shown]
}

/**
 * HIGH 10 punkt 4 — slutbeat. Bågen har slutit: tillbaka i 'frisk' efter att
 * en förhöjd zon faktiskt visats för spelaren. En manager som aldrig varit
 * förhöjd får ingen "du hittade tillbaka"-beat.
 *
 * ANVÄNDS AV roundProcessor.ts FÖR ATT BESLUTA — se shouldShowBurnoutMarks
 * motsvarande varning. Render-lagret läser BURNOUT_CLOSE_FIRED_KEY via
 * wasLoggedThisRound, inte detta predikat direkt.
 */
export function shouldShowBurnoutClose(profile: ManagerProfile): boolean {
  const shown = profile.lastShownBurnoutZone
  if (!shown || shown === 'frisk') return false
  return getBurnoutZone(profile.burnoutScore) === 'frisk'
}

export function getBurnoutZone(score: number): BurnoutZone {
  if (score >= BURNOUT_TRIGGER_THRESHOLD) return 'hog'
  if (score >= 40) return 'markbar'
  return 'frisk'
}

/**
 * Återfalls-läsningen (2026-09-02, Opus dom) — SÄSONGSÖVERSKRIDANDE. Skiljer
 * sig från shouldShowBurnoutMark ovan (som bara vet "steg zonen NU") genom
 * att fråga historiken: har en burnout-topp fyrat i en TIDIGARE säsong?
 * Om ja är detta ett återfall, inte ett förstagångstillfälle — BurnoutMark.tsx
 * ska då välja den eskalerade mallen (BURNOUT_MARK_RELAPSE) i stället för
 * intro-mallen (BURNOUT_MARK).
 *
 * `diary`s burnout_peak-poster (roundProcessor.ts, skrivs vid zoneRose) bär
 * redan season+matchday — de ENDA data som behövs, ingen ny lagring. Kortare
 * `burnoutHistory` (rullande fönster, BURNOUT_HISTORY_MAX=22 omgångar) räcker
 * INTE för detta — den trimmas långt innan en säsongsgräns, dagboken är den
 * enda platsen minnet faktiskt sträcker sig över säsonger.
 */
export function isBurnoutRelapse(profile: ManagerProfile, currentSeason: number): boolean {
  return (profile.diary ?? []).some(e => e.type === 'burnout_peak' && e.season < currentSeason)
}

const HOMETOWN_POOL: string[] = [
  'Edsbyn', 'Bollnäs', 'Sandviken', 'Falun', 'Ljusdal', 'Söderhamn',
  'Hudiksvall', 'Gävle', 'Borlänge', 'Mora', 'Rättvik', 'Alfta',
  'Vänersborg', 'Trollhättan', 'Skellefteå', 'Umeå', 'Sundsvall',
]
