/**
 * corridorService.ts — TEXTLEVERANS §D / TILLÄGG 4, korridoren omgång 28–36.
 *
 * NY FIL — motivering (CLAUDE.md "KOD-GRANSKNING FÖR NYA FILER"): grep på
 * `28–36`, `korridor` och `playoffEliminated` i src/domain/services gav inga
 * träffar; det finns ingen befintlig generator för omgångarna efter att
 * klubben åkt ut. Närmast är `klackPresenter` (en yta, inte en generator) och
 * `postAdvanceEvents` (beslutskort, inte atmosfärposter). Ingen av dem kan bära
 * det här utan att byta uppgift.
 *
 * Fyra generatorer, en post per omgång, roterande:
 *   kontraktsprat → andras slutspel → sommaren skymtar → bygden → andras …
 *
 * Gäller BARA en klubb som är ute ur både slutspel och cup — den som fortfarande
 * spelar får matchtexter och behöver ingen fyllnad.
 *
 * Varje rad används högst en gång per KARRIÄR (`corridorLinesUsed`). Tar en pool
 * slut hoppar generatorn över omgången i stället för att återanvända.
 *
 * ⚠️ VILANDE TILLS EN SPÄRR ÄR LÖST — MÄTT 2026-09-19, INTE ANTAGET.
 *
 * En utslagen klubb FÅR inte omgångarna 28–36. `advanceToNextEvent` svansrekurserar
 * förbi slutspelsrundor klubben inte är med i, så roundPlayed hoppar rakt från
 * 26 till 37 (seed 11, Heros: 18 → … → 26 → 37). Korridoren som §D beskriver
 * finns alltså inte som omgångar för den klubb texten är skriven för — det som
 * är tyst är själva hoppet.
 *
 * Generatorn är färdig och testad, och fyrar för en klubb som åker ut MITT i
 * slutspelet (den ser några av omgångarna). För den som missar slutspelet helt
 * krävs att advance slutar hoppa, vilket är en mekanikändring och inte ett
 * textpass — den påverkar varje mätning i projektet och är Jacobs beslut.
 *
 * Mät med `scripts/verify-corridor.ts` när spärren är löst.
 */
import type { SaveGame, InboxItem } from '../entities/SaveGame'
import type { Player } from '../entities/Player'
import { InboxItemType } from '../enums'
import { getCharacterName } from './supporterService'
import {
  CORRIDOR_CONTRACT_LINES,
  CORRIDOR_OTHERS_NEUTRAL,
  CORRIDOR_OTHERS_RIVAL_ALIVE,
  CORRIDOR_OTHERS_RIVAL_OUT,
  CORRIDOR_OTHERS_FINAL,
  CORRIDOR_SUMMER_ACADEMY,
  CORRIDOR_SUMMER_RETIREMENT,
  CORRIDOR_SUMMER_SPONSOR,
  CORRIDOR_SUMMER_ECONOMY,
  CORRIDOR_KLACK_HIGH,
  CORRIDOR_KLACK_MID,
  CORRIDOR_KLACK_LOW,
  CORRIDOR_PAPER_HIGH,
  CORRIDOR_PAPER_MID,
  CORRIDOR_PAPER_LOW,
  CORRIDOR_VOLUNTEER_KIOSK,
} from '../data/corridorText'

export const CORRIDOR_FIRST_ROUND = 28
export const CORRIDOR_LAST_ROUND = 36

type Pool = readonly string[]

/** Första oanvända raden i poolen, eller null när poolen är slut. */
function pickUnused(pool: Pool, poolName: string, used: ReadonlySet<string>): { line: string; key: string } | null {
  for (let i = 0; i < pool.length; i++) {
    const key = `${poolName}:${i}`
    if (!used.has(key)) return { line: pool[i], key }
  }
  return null
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\wÅÄÖåäö*[^}]*)\}/g, (whole, key: string) => vars[key] ?? whole)
}

const COUNT_WORDS = ['noll', 'ett', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio']
const countWord = (n: number): string => COUNT_WORDS[n] ?? String(n)

export interface CorridorPost {
  item: InboxItem
  /** Nyckeln som ska in i corridorLinesUsed när posten faktiskt levereras. */
  usedKey: string
}

/** Är klubben ute ur både slutspel och cup? */
export function isOutOfEverything(game: SaveGame): boolean {
  const managedId = game.managedClubId
  const bracket = game.playoffBracket
  const series = bracket
    ? [...(bracket.quarterFinals ?? []), ...(bracket.semiFinals ?? []), ...(bracket.final ? [bracket.final] : [])]
    : []
  const inPlayoff = series.some(s =>
    (s.homeClubId === managedId || s.awayClubId === managedId) && s.loserId !== managedId)
  if (inPlayoff) return false
  // Bugg fångad vid mätningen: efter säsongsrullningen finns NÄSTA säsongs
  // cupbracket med ospelade matcher, och utan säsongsgrinden läste funktionen
  // den som "vi är kvar i cupen" — mitt i den korridor den ska styra.
  const cup = game.cupBracket
  const cupAlive = !!cup && cup.season === game.currentSeason && cup.matches.some(m =>
    !m.winnerId && (m.homeClubId === managedId || m.awayClubId === managedId))
  return !cupAlive
}

/**
 * Rotationen. Omgång 28 börjar på kontraktsprat, och ordningen upprepas —
 * men D1 och D3 har egna fönster (28–30 respektive 31–34) enligt §D, så
 * rotationen faller tillbaka på D2 utanför dem.
 */
function generatorForRound(round: number): 'contract' | 'others' | 'summer' | 'bygden' {
  if (round >= 35) return 'bygden'
  if (round >= 31 && round <= 34) return round % 2 === 1 ? 'summer' : 'others'
  if (round <= 30) return round % 2 === 0 ? 'contract' : 'others'
  return 'others'
}

export function generateCorridorPost(game: SaveGame, round: number): CorridorPost | null {
  if (round < CORRIDOR_FIRST_ROUND || round > CORRIDOR_LAST_ROUND) return null
  if (!isOutOfEverything(game)) return null

  const used = new Set(game.corridorLinesUsed ?? [])
  const managed = game.players.filter(p => p.clubId === game.managedClubId)
  const kind = generatorForRound(round)
  const mk = (
    picked: { line: string; key: string },
    title: string,
    vars: Record<string, string>,
    fromRole?: string,
  ): CorridorPost => ({
    usedKey: picked.key,
    item: {
      id: `inbox_corridor_${game.currentSeason}_r${round}`,
      date: game.currentDate,
      type: InboxItemType.Community,
      ...(fromRole ? { fromRole } : {}),
      title,
      body: fill(picked.line, vars),
      isRead: false,
    } as InboxItem,
  })

  if (kind === 'contract') {
    const expiring = managed.filter(p => p.contractUntilSeason === game.currentSeason)
    if (expiring.length === 0) return null
    const top = [...expiring].sort((a, b) => b.currentAbility - a.currentAbility)[0]
    const picked = pickUnused(CORRIDOR_CONTRACT_LINES, 'contract', used)
    if (!picked) return null
    const assistantFirst = (game.assistantCoach?.name ?? '').split(' ')[0]
    return mk(picked,
      assistantFirst ? `${assistantFirst} om sommaren` : 'Om sommaren',
      { 'Namn': `${top.firstName} ${top.lastName}`, 'Antal': countWord(expiring.length) },
      'assistenttränare')
  }

  if (kind === 'others') {
    const decided = decidedMatchWithoutUs(game)
    if (!decided) return null
    const { winner, loser, result, isFinal, rivalInvolved, rivalWon } = decided
    const pool: [Pool, string] = isFinal ? [CORRIDOR_OTHERS_FINAL, 'others_final']
      : rivalInvolved ? (rivalWon ? [CORRIDOR_OTHERS_RIVAL_ALIVE, 'others_rival_alive'] : [CORRIDOR_OTHERS_RIVAL_OUT, 'others_rival_out'])
      : [CORRIDOR_OTHERS_NEUTRAL, 'others_neutral']
    const picked = pickUnused(pool[0], pool[1], used)
    if (!picked) return null
    return mk(picked,
      rivalInvolved ? `${rivalInvolved} i slutspelet` : 'Slutspelet utan oss',
      { 'Vinnare': winner, 'Förlorare': loser, 'Resultat': result })
  }

  if (kind === 'summer') {
    const topic = summerTopic(game, managed, used)
    if (!topic) return null
    return mk(topic.picked, 'Sommaren skymtar', topic.vars)
  }

  // bygden — omgång 35 klacken, 36 kommunen och tidningen
  if (round === 35) {
    const sg = game.supporterGroup
    if (!sg) return null
    const mood = sg.mood ?? 50
    const pool: [Pool, string] = mood >= 55 ? [CORRIDOR_KLACK_HIGH, 'klack_high']
      : mood >= 35 ? [CORRIDOR_KLACK_MID, 'klack_mid']
      : [CORRIDOR_KLACK_LOW, 'klack_low']
    const picked = pickUnused(pool[0], pool[1], used)
    if (!picked) return null
    return mk(picked, 'Bygden om säsongen', {
      'Klackledare': getCharacterName(game, 'leader'),
      'Månad': 'november',
    })
  }

  // TILLÄGG 4 — volontärvardagen som femte nivå, när en kiosk eller ett loppis
  // faktiskt är aktivt. Raderna kommer ur DOM_DÖDA_TEXTPOOLER pool 8.
  const since = game.communityActivitiesSince ?? {}
  const kioskActive = since.kiosk !== undefined || since.lottery !== undefined
  if (kioskActive) {
    const picked = pickUnused(CORRIDOR_VOLUNTEER_KIOSK, 'volunteer', used)
    if (picked) {
      const names = volunteerNames(game)
      return mk(picked, 'Bygden om säsongen', { name: names[0], name2: names[1] })
    }
  }

  if (!game.localPaperName) return null
  const cs = game.communityStanding ?? 50
  const pool: [Pool, string] = cs >= 60 ? [CORRIDOR_PAPER_HIGH, 'paper_high']
    : cs >= 40 ? [CORRIDOR_PAPER_MID, 'paper_mid']
    : [CORRIDOR_PAPER_LOW, 'paper_low']
  const picked = pickUnused(pool[0], pool[1], used)
  if (!picked) return null
  return mk(picked, 'Bygden om säsongen', { 'Tidning': game.localPaperName })
}

function volunteerNames(game: SaveGame): [string, string] {
  const chars = game.supporterGroup
    ? [getCharacterName(game, 'veteran'), getCharacterName(game, 'youth')]
    : ['Rolf', 'Gunnar']
  return [chars[0] ?? 'Rolf', chars[1] ?? 'Gunnar']
}

function summerTopic(
  game: SaveGame,
  managed: Player[],
  used: ReadonlySet<string>,
): { picked: { line: string; key: string }; vars: Record<string, string> } | null {
  // Ordningen är §D:s: akademi → pension → sponsor → ekonomi. Ett ämne hoppas
  // över när villkoret saknas, inte när poolen är slut — då går hela omgången
  // vidare till nästa ämne.
  const youth = game.youthTeam
  if (youth) {
    const picked = pickUnused(CORRIDOR_SUMMER_ACADEMY, 'summer_academy', used)
    if (picked) {
      const best = [...(youth.players ?? [])].sort((a, b) => b.potentialAbility - a.potentialAbility)[0]
      if (best) {
        return { picked, vars: {
          'V': String(youth.seasonRecord?.w ?? 0),
          'F': String(youth.seasonRecord?.l ?? 0),
          'Namn': `${best.firstName} ${best.lastName}`,
        } }
      }
    }
  }
  const veterans = managed.filter(p => p.age >= 33)
  if (veterans.length > 0) {
    const picked = pickUnused(CORRIDOR_SUMMER_RETIREMENT, 'summer_retirement', used)
    if (picked) {
      const v = [...veterans].sort((a, b) => b.age - a.age)[0]
      return { picked, vars: { 'Namn': `${v.firstName} ${v.lastName}`, 'Ålder': String(v.age) } }
    }
  }
  const expiringSponsor = (game.sponsors ?? []).find(s => s.contractRounds > 0 && s.contractRounds <= 6)
  if (expiringSponsor) {
    const picked = pickUnused(CORRIDOR_SUMMER_SPONSOR, 'summer_sponsor', used)
    if (picked) return { picked, vars: { 'Sponsor': expiringSponsor.name } }
  }
  const club = game.clubs.find(c => c.id === game.managedClubId)
  const strained = (club?.finances ?? 0) < 0 || (game.boardPatience ?? 100) < 40
  if (strained) {
    const picked = pickUnused(CORRIDOR_SUMMER_ECONOMY, 'summer_economy', used)
    if (picked) return { picked, vars: {} }
  }
  return null
}

interface DecidedMatch {
  winner: string; loser: string; result: string
  isFinal: boolean
  /** Rivalens namn när en av klubbarna är en rival, annars undefined. */
  rivalInvolved?: string
  rivalWon: boolean
}

/** En nyss avgjord slutspels- eller cupmatch UTAN vår klubb. */
function decidedMatchWithoutUs(game: SaveGame): DecidedMatch | null {
  const managedId = game.managedClubId
  const name = (id: string) => game.clubs.find(c => c.id === id)?.name ?? 'Motståndaren'
  const fixture = [...game.fixtures]
    .filter(f => f.status === 'completed'
      && (f.isKnockout || f.isCup)
      && f.season === game.currentSeason
      && f.homeClubId !== managedId && f.awayClubId !== managedId)
    .sort((a, b) => b.matchday - a.matchday)[0]
  if (!fixture) return null
  const homeWon = (fixture.homeScore ?? 0) > (fixture.awayScore ?? 0)
  const winnerId = homeWon ? fixture.homeClubId : fixture.awayClubId
  const loserId = homeWon ? fixture.awayClubId : fixture.homeClubId
  // Rivalitet enligt §5.1:s data — en klubb vi dominerat eller som dominerat oss.
  const hist = game.rivalryHistory ?? {}
  const isRival = (id: string) => hist[id]?.dominanceEstablished === true
  const rivalId = isRival(winnerId) ? winnerId : isRival(loserId) ? loserId : undefined
  return {
    winner: name(winnerId),
    loser: name(loserId),
    result: `${Math.max(fixture.homeScore ?? 0, fixture.awayScore ?? 0)}–${Math.min(fixture.homeScore ?? 0, fixture.awayScore ?? 0)}`,
    isFinal: !!fixture.isFinaldag,
    rivalInvolved: rivalId ? name(rivalId) : undefined,
    rivalWon: rivalId === winnerId,
  }
}
