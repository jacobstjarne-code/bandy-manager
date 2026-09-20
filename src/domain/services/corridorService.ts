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
 * TVÅ STOPP, INTE NIO OMGÅNGAR (Jacobs beslut 2026-09-19).
 *
 * Mätningen visade att en utslagen klubb inte FÅR omgångarna 28–36:
 * `advanceToNextEvent` svansrekurserar förbi slutspelsrundor klubben inte är
 * med i, så roundPlayed hoppar från ~26 till 37 (seed 11, Heros:
 * 18 → … → 26 → 37). Över 7 seeds × 3 säsonger fanns NOLL omgångar i spannet
 * där klubben var ute. Det som är tyst är hoppet, inte nio glesa omgångar.
 *
 * Advance ska fortsätta hoppa. Innehållet bärs i stället av två STOPP av
 * pendingScreen-typ mellan sista spelade omgång och omgång 37:
 *
 *   Veckan efter — direkt efter den omgång klubben är slutgiltigt ute.
 *                  D1 (en rad), D3/D4 i rotation, volontärnivån när aktiv,
 *                  plus tabellens slutplacering som faktum. Ingen briefing
 *                  om nästa säsong här.
 *   Finaldagen   — vid fixturen med isFinaldag. finaldagBriefingSpectator
 *                  överst, finalens resultat, D2 (en rad) och den andra av
 *                  D3/D4.
 *
 * Ett stopp är inte en omgång: räknaren, matchens rand och alla
 * omgångsbaserade mätningar lämnas orörda.
 */
import type { SaveGame } from '../entities/SaveGame'
import type { Player } from '../entities/Player'
import { PlayoffRound } from '../enums'
import { getCharacterName } from './supporterService'
import {
  CORRIDOR_CONTRACT_LINES,
  CORRIDOR_OTHERS_NEUTRAL,
  CORRIDOR_OTHERS_RIVAL_ALIVE,
  CORRIDOR_OTHERS_RIVAL_OUT,
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
  return template.replace(/\{([^}]+)\}/g, (whole, key: string) => vars[key] ?? whole)
}

const COUNT_WORDS = ['noll', 'ett', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio']
const countWord = (n: number): string => COUNT_WORDS[n] ?? String(n)

/** Är klubben ute ur både slutspel och cup? */
export function isOutOfEverything(game: SaveGame): boolean {
  const managedId = game.managedClubId
  const bracket = game.playoffBracket
  // Säsongen måste ha NÅTT slutspelet. Utan den här grinden var funktionen sann
  // redan omgång 1 — inget bracket finns ju då, och ingen cupmatch är ospelad —
  // vilket gjorde att "blir ute"-övergången aldrig kunde inträffa. Mätt: noll
  // stopp över sex seeds innan grinden fanns.
  if (!bracket || bracket.season !== game.currentSeason) return false
  const series = bracket
    ? [...(bracket.quarterFinals ?? []), ...(bracket.semiFinals ?? []), ...(bracket.final ? [bracket.final] : [])]
    : []
  // TEXTLEVERANS §D5 (2026-09-20) fynd, mätt: en klubb som VANN sin
  // kvartsfinal och sedan åkte ut i semifinalen lästes som "fortfarande i
  // slutspel" hela vägen till Finaldagen. `s.loserId !== managedId` är sant
  // både för en PÅGÅENDE serie (loserId null) OCH för en klubbens EGEN VUNNA
  // serie (loserId = motståndaren, aldrig oss) — den vunna kvartsfinalen
  // ligger kvar i bracketen för alltid, så "inte förlorare i NÅGON serie
  // klubben nånsin var med i" är fel fråga. Rätt fråga: har klubben en
  // PÅGÅENDE (oavgjord) serie just nu? `winnerId === null` fångar det —
  // en vunnen serie räknas inte, en pågående gör, och en förlorad gör inte.
  const inPlayoff = series.some(s =>
    (s.homeClubId === managedId || s.awayClubId === managedId) && s.winnerId === null)
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
 * TEXTLEVERANS §D5 (2026-09-20) — Veckan efters faktarad, sex villkor. Ersätter
 * den generiska "Serien slutade på plats N av 12 …"-raden, som inte skiljde på
 * klubben som MISSADE slutspelet och klubben som ÅKTE UT i det, och som bar
 * GF–GA trots att den siffran redan står i tabellen (en mening med tre tal är
 * en tabellrad, inte en replik).
 *
 * Ordningen (första träff vinner):
 *   1–3. Bracket-serien har vår klubb som `loserId` — förlorad final, ute i
 *        semifinalen, ute i kvartsfinalen. Runda och motståndare kommer ur
 *        serien.
 *   4–6. Ingen sådan serie hittas → vi missade slutspelet helt. Då är det
 *        tabellen: plats 9 (en plats ifrån), plats 10–11 (stängd), plats 12
 *        (sist).
 *
 * `{Diff}` (plats 9) är poängskillnaden till åttan. Är den 0 (samma poäng,
 * lägre placering på inbördes möte/målskillnad) skrivs "på sämre målskillnad"
 * i stället för "0 poäng ifrån" — 0 poäng ifrån läser fel.
 */
export function weekAfterFactLine(game: SaveGame): string | null {
  const standings = game.standings ?? []
  const row = standings.find(st => st.clubId === game.managedClubId)
  if (!row) return null

  const managedId = game.managedClubId
  const bracket = game.playoffBracket
  const series = bracket
    ? [...(bracket.quarterFinals ?? []), ...(bracket.semiFinals ?? []), ...(bracket.final ? [bracket.final] : [])]
        .find(s => s.loserId === managedId)
    : undefined

  if (series) {
    const opponentId = series.homeClubId === managedId ? series.awayClubId : series.homeClubId
    const opponent = game.clubs.find(c => c.id === opponentId)?.name ?? '?'
    if (series.round === PlayoffRound.Final) {
      const champName = game.clubs.find(c => c.id === series.winnerId)?.name ?? opponent
      return `Silver. ${champName} vann finalen. Det får stå ett tag innan det känns som något.`
    }
    if (series.round === PlayoffRound.SemiFinal) {
      return `Semifinal. ${opponent} var bättre de dagar det gällde. Plats ${row.position} i serien, och en vår som tog slut en vecka för tidigt.`
    }
    return `Ute i kvartsfinalen mot ${opponent}. I serien blev det plats ${row.position}. Det ena förklarar inte det andra.`
  }

  if (row.position === 9) {
    const eighth = standings.find(st => st.position === 8)
    const diff = eighth ? eighth.points - row.points : 0
    const diffText = diff <= 0 ? 'på sämre målskillnad' : `${diff} poäng ifrån`
    return `Plats nio. En plats från slutspel, ${diffText}. Det kommer att nämnas i kafferummet till mars.`
  }
  if (row.position === 10 || row.position === 11) {
    return `Tabellen är stängd. Plats ${row.position} av ${standings.length}, ${row.points} poäng. Slutspelet går utan oss.`
  }
  if (row.position === 12) {
    return `Sist. ${row.points} poäng. Ingen säger något om det, vilket är värre än om de gjorde det.`
  }
  return null
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



// ── De två stoppen ───────────────────────────────────────────────────────────

/** En rad i ett stopp. `usedKey` bokförs i corridorLinesUsed när stoppet visas. */
export interface CorridorLine {
  text: string
  usedKey: string | null
}

export interface CorridorStop {
  kind: 'week_after' | 'final_day'
  heading: string
  /** Fables låsta ingressrad. */
  intro: string
  lines: CorridorLine[]
}

/** Fables låsta rubriker och ingresser (Jacob 2026-09-19). */
const STOP_HEADINGS = {
  week_after: { heading: 'Veckan efter', intro: 'Ingen match på lördag. Första gången sedan oktober.' },
  final_day: { heading: 'Finaldagen', intro: 'Vi är åskådare i år. Det går att vara det med värdighet.' },
} as const

/**
 * Stopp 1. D3 och D4 alternerar mellan stoppen: det här tar D3 (sommaren) när
 * säsongen är jämn och D4 (bygden) annars, och Finaldagen tar den andra. Över
 * två stopp per säsong räcker trettio rader i sju säsonger utan repetition.
 */
export function buildWeekAfterStop(game: SaveGame): CorridorStop | null {
  if (!isOutOfEverything(game)) return null
  const used = new Set(game.corridorLinesUsed ?? [])
  const managed = game.players.filter(p => p.clubId === game.managedClubId)
  const lines: CorridorLine[] = []

  // D1 — kontraktsprat.
  const expiring = managed.filter(p => p.contractUntilSeason === game.currentSeason)
  if (expiring.length > 0) {
    const picked = pickUnused(CORRIDOR_CONTRACT_LINES, 'contract', used)
    if (picked) {
      const top = [...expiring].sort((a, b) => b.currentAbility - a.currentAbility)[0]
      lines.push({
        text: fill(picked.line, {
          'Namn': `${top.firstName} ${top.lastName}`,
          'Antal': countWord(expiring.length),
        }),
        usedKey: picked.key,
      })
      used.add(picked.key)
    }
  }

  // D3 eller D4 i rotation — den andra hamnar på Finaldagen.
  const takeSummerHere = game.currentSeason % 2 === 0
  const rotated = takeSummerHere ? summerLine(game, managed, used) : bygdenLine(game, used)
  if (rotated) { lines.push(rotated); if (rotated.usedKey) used.add(rotated.usedKey) }

  // Volontärnivån när den är aktiv (TILLÄGG 4, pool 8 ur arkivet).
  const volunteer = volunteerLine(game, used)
  if (volunteer) { lines.push(volunteer); if (volunteer.usedKey) used.add(volunteer.usedKey) }

  // Klubbens faktiska utfall — sex villkor, se weekAfterFactLine (§D5).
  const fact = weekAfterFactLine(game)
  if (fact) lines.push({ text: fact, usedKey: null })

  if (lines.length === 0) return null
  return { kind: 'week_after', ...STOP_HEADINGS.week_after, lines }
}

/** Stopp 2. Visas vid fixturen med isFinaldag. */
export function buildFinalDayStop(game: SaveGame): CorridorStop | null {
  if (!isOutOfEverything(game)) return null
  const used = new Set(game.corridorLinesUsed ?? [])
  const managed = game.players.filter(p => p.clubId === game.managedClubId)
  const lines: CorridorLine[] = []

  // Finalen läses ur BRACKET:en, inte ur en fixtur. Mätt: för en klubb som
  // åkte ut skapas aldrig någon `isFinaldag`-fixtur i deras save (0 träffar
  // över en hel säsong) — finalen spelas i bracket-serien. Bracketen finns
  // alltid, och `champion` är den enda signal som säkert når en åskådare.
  const series = game.playoffBracket?.final
  const champId = game.playoffBracket?.champion
  if (!series || !champId) return null
  const loserId = series.winnerId === series.homeClubId ? series.awayClubId : series.homeClubId

  // TEXTLEVERANS §D5 — defensivt: den som spelade finalen (vann eller
  // förlorade den) kan strukturellt inte nå Finaldagen (isOutOfEverything
  // läser FÖRRA rundans bracket, som ännu inte hade loserId satt när finalen
  // avgörs), men skärmen ska aldrig kunna säga "vi är åskådare" till laget som
  // just spelade finalen om den vägen någonsin öppnas.
  if (champId === game.managedClubId || loserId === game.managedClubId) return null

  const champName = game.clubs.find(c => c.id === champId)?.name ?? '?'
  const runnerUp = game.clubs.find(c => c.id === loserId)?.name ?? '?'
  // TEXTLEVERANS §D5 — guldraden ersätter "SM-guld: X. Tvåa: Y.": ingen säger
  // tvåa om en förlorad final, det heter silver, och raden är prosa, inte
  // en etikett.
  lines.push({ text: `${champName} är svenska mästare. ${runnerUp} tog silver.`, usedKey: null })

  const rivalClubIds = rivalAndNemesisClubs(game)
  const rivalIsChampion = rivalClubIds.has(champId)
  const rivalInvolved = rivalIsChampion || rivalClubIds.has(loserId)
  const pool: [Pool, string] = rivalInvolved
    ? (rivalIsChampion ? [CORRIDOR_OTHERS_RIVAL_ALIVE, 'others_rival_alive'] : [CORRIDOR_OTHERS_RIVAL_OUT, 'others_rival_out'])
    : [CORRIDOR_OTHERS_NEUTRAL, 'others_neutral']
  const picked = pickUnused(pool[0], pool[1], used)
    ?? pickUnused(CORRIDOR_OTHERS_NEUTRAL, 'others_neutral', used)
  if (picked) {
    lines.push({
      text: fill(picked.line, { 'Vinnare': champName, 'Förlorare': runnerUp }),
      usedKey: picked.key,
    })
    used.add(picked.key)
  }

  // Den ANDRA av D3/D4 — motsatsen till vad Veckan efter tog.
  const takeSummerHere = game.currentSeason % 2 !== 0
  const rotated = takeSummerHere ? summerLine(game, managed, used) : bygdenLine(game, used)
  if (rotated) lines.push(rotated)

  return { kind: 'final_day', ...STOP_HEADINGS.final_day, lines }
}

/** Klubbar som är rivaler (§5.1-dominans) eller bär en nemesis. */
function rivalAndNemesisClubs(game: SaveGame): Set<string> {
  const out = new Set<string>()
  for (const [clubId, hist] of Object.entries(game.rivalryHistory ?? {})) {
    if (hist.dominanceEstablished) out.add(clubId)
  }
  for (const entry of Object.values(game.nemesisTracker ?? {})) {
    if (entry.nemesisSeason !== undefined) out.add(entry.clubId)
  }
  return out
}

function volunteerLine(game: SaveGame, used: ReadonlySet<string>): CorridorLine | null {
  const since = game.communityActivitiesSince ?? {}
  if (since.kiosk === undefined && since.lottery === undefined) return null
  const picked = pickUnused(CORRIDOR_VOLUNTEER_KIOSK, 'volunteer', used)
  if (!picked) return null
  const names = volunteerNames(game)
  return { text: fill(picked.line, { name: names[0], name2: names[1] }), usedKey: picked.key }
}

function bygdenLine(game: SaveGame, used: ReadonlySet<string>): CorridorLine | null {
  const sg = game.supporterGroup
  if (sg) {
    const mood = sg.mood ?? 50
    const pool: [Pool, string] = mood >= 55 ? [CORRIDOR_KLACK_HIGH, 'klack_high']
      : mood >= 35 ? [CORRIDOR_KLACK_MID, 'klack_mid']
      : [CORRIDOR_KLACK_LOW, 'klack_low']
    const picked = pickUnused(pool[0], pool[1], used)
    if (picked) {
      return {
        text: fill(picked.line, { 'Klackledare': getCharacterName(game, 'leader'), 'Månad': 'november' }),
        usedKey: picked.key,
      }
    }
  }
  if (!game.localPaperName) return null
  const cs = game.communityStanding ?? 50
  const pool: [Pool, string] = cs >= 60 ? [CORRIDOR_PAPER_HIGH, 'paper_high']
    : cs >= 40 ? [CORRIDOR_PAPER_MID, 'paper_mid']
    : [CORRIDOR_PAPER_LOW, 'paper_low']
  const picked = pickUnused(pool[0], pool[1], used)
  if (!picked) return null
  return { text: fill(picked.line, { 'Tidning': game.localPaperName }), usedKey: picked.key }
}

function summerLine(game: SaveGame, managed: Player[], used: ReadonlySet<string>): CorridorLine | null {
  const topic = summerTopic(game, managed, used)
  if (!topic) return null
  return { text: fill(topic.picked.line, topic.vars), usedKey: topic.picked.key }
}

/** Nycklarna ett stopp förbrukar — bokförs när stoppet faktiskt visas. */
export function stopUsedKeys(stop: CorridorStop): string[] {
  return stop.lines.map(l => l.usedKey).filter((k): k is string => k !== null)
}
