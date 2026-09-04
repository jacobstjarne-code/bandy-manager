import type { SaveGame } from '../../entities/SaveGame'
import type { EventLedgerEntry } from '../../entities/Narrative'
import { EFTERKLANG_ECHO, ECONOMIC_SCAR_AFTERMATH, type EfterklangType } from '../../data/efterklangText'
import { mulberry32 } from '../../utils/random'
import { FixtureStatus } from '../../enums'
import { getNextManagedFixture } from './triggers/matchTriggers'
import { matchdayToLeagueRound } from '../scheduleGenerator'
import { buildMemoryEventFromLedger } from '../clubMemoryService'
import { currentChronology } from '../currentChronology'
import { toldMarksFor } from '../ledgerToldService'
import { resolveSubjectName } from '../momentLedgerService'
import { agendaForSurface, redaktoren } from '../redaktorenService'
import { getStorylineTypeFromLedger } from '../storylineLedgerService'

const JOURNALIST_EVENT_LABEL: Record<string, string> = {
  refused_press: 'Refuserade pressen',
  good_answer:   'Bra svar',
  bad_answer:    'Dåligt svar',
  big_win:       'Stor seger',
  crisis:        'Kris',
}

// B4 — premiss-stam per journalist-event (Opus-copy 2026-06-03). Trailing ", omg {N}."
// (eller " efter {opp}, omg {N}." på good/bad/refused med opponentShort) sätts vid komposition.
const JOURNALIST_PREMISS_STEM: Record<string, string> = {
  good_answer:   'Du gav {journalist} ett rakt svar',
  bad_answer:    'Du snäste av {journalist}',
  refused_press: 'Du nekade {journalist} en kommentar',
  big_win:       '{journalist} skrev om storsegern',
  crisis:        '{journalist} ringde mitt i krisen',
}

export interface EfterklangThreadEntry {
  matchday: number
  /** SKALA-BUGGEN steg B (2026-09-02) — journalistminnet kan sträcka sig
   *  över en säsongsgräns ("senaste 10 interaktionerna"); utan säsongen kan
   *  matchday inte konverteras till rätt kalenders serieomgång vid visning. */
  season: number
  text: string
}

export interface EfterklangMemory {
  type: EfterklangType
  primaryText: string
  /** B1 — dämpad anchor-rad före ekot (uppställningen → payoff). Komponeras per typ. */
  premiss: string
  echo: string
  objectName: string
  sinceMatchday?: number
  threadEntries: EfterklangThreadEntry[]
  /** journalist type only */
  journalistName?: string
  hasJournalistSparkline?: boolean
  /** rivalSale type only — B1 */
  soldPlayerName?: string
  buyerClubName?: string
  /** Kanonisk källa när tråden valts ur Berättarens agenda. Ephemeral vydata,
   * aldrig en ny minneslagring. PortalScreen använder den för told-kvittot. */
  sourcePost?: EventLedgerEntry
  sourcePostKey?: string
}

interface EfterklangCandidate {
  type: EfterklangType
  score: number
  memory: EfterklangMemory
}

function pickEcho(type: EfterklangType, seed: number): string {
  const pool = EFTERKLANG_ECHO[type]
  return pool[Math.floor(mulberry32(seed)() * pool.length)]
}

function interpolate(text: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((t, [k, v]) => t.replace(new RegExp(`\\{${k}\\}`, 'g'), v), text)
}

/**
 * @cites game.ledgerTold, game.activeAnniversaries, game.klackEcho.currentWeight, game.journalist.memory, game.bandyLetters, game.boardObjectiveHistory, game.nemesisTracker, game.economicCrisisState, game.lastRivalSaleInfo, game.lastRivalSaleMatchday
 */
export function pickEfterklang(game: SaveGame, max = 2): EfterklangMemory[] {
  // A3: gate på spelade ligamatcher (inte currentMatchday) — visa inte efterklang för tidigt
  const playedLeague = game.fixtures.filter(f =>
    f.status === FixtureStatus.Completed && !f.isCup && !f.isKnockout && f.season === game.currentSeason
  ).length
  if (playedLeague < 5) return []

  const round = game.currentMatchday
  const season = game.currentSeason
  const seed = season * 7919 + round * 31
  const chronology = currentChronology(game)
  const agenda = agendaForSurface(redaktoren(game, chronology), 'efterklang')

  const candidates: EfterklangCandidate[] = []

  // Anniversary — canonical agenda first. activeAnniversaries remains only as
  // a retire-last fallback for legacy/non-ledger memories.
  const anniversaryItem = agenda.find(item =>
    item.freshnessQueue === 'anniversary'
    && buildMemoryEventFromLedger(game, item.post, game.managedClubId) !== null
  )
  if (anniversaryItem) {
    const ledgerMemory = buildMemoryEventFromLedger(game, anniversaryItem.post, game.managedClubId)!
    const yearsAgo = season - anniversaryItem.post.season
    const echo = interpolate(pickEcho('anniversary', seed), {})
    const name = ledgerMemory.text.length > 28 ? ledgerMemory.text.slice(0, 26) + '…' : ledgerMemory.text
    const eventText = ledgerMemory.text.length > 30 ? ledgerMemory.text.slice(0, 29) + '…' : ledgerMemory.text
    const premiss = yearsAgo === 1 ? `Ett år sedan ${eventText}.` : `${yearsAgo} år sedan ${eventText}.`
    candidates.push({
      type: 'anniversary',
      score: anniversaryItem.scoresBySurface.efterklang.total,
      memory: {
        type: 'anniversary', primaryText: ledgerMemory.text, premiss, echo,
        objectName: name,
        threadEntries: [{
          matchday: anniversaryItem.post.matchday,
          season: anniversaryItem.post.season,
          text: ledgerMemory.text,
        }],
        sourcePost: anniversaryItem.post,
        sourcePostKey: anniversaryItem.postKey,
      },
    })
  } else {
    const anniversaries = (game.activeAnniversaries ?? [])
      .filter(a => a.significance >= 70)
      .sort((a, b) => b.significance - a.significance)
    const ann = anniversaries[0]
    if (ann) {
      const echo = interpolate(pickEcho('anniversary', seed), {})
      const name = ann.originalEventText.length > 28 ? ann.originalEventText.slice(0, 26) + '…' : ann.originalEventText
      // B4 — premiss: "{N} år sedan {händelse}." (delta 1 → "Ett år sedan …")
      const annEvent = ann.originalEventText.length > 30 ? ann.originalEventText.slice(0, 29) + '…' : ann.originalEventText
      const premiss = ann.yearsAgo === 1 ? `Ett år sedan ${annEvent}.` : `${ann.yearsAgo} år sedan ${annEvent}.`
      candidates.push({
        type: 'anniversary',
        score: ann.significance * (ann.echoSize === 'big' ? 1.3 : 1.0),
        memory: {
          type: 'anniversary', primaryText: ann.originalEventText, premiss, echo,
          objectName: name,
          threadEntries: [{ matchday: round, season, text: ann.originalEventText }],
        },
      })
    }
  }

  // Klack echo
  if (game.klackEcho && game.klackEcho.currentWeight > 0.20) {
    const echo = pickEcho('klackEcho', seed + 1)
    // B4 — premiss på currentWeight
    const w = game.klackEcho.currentWeight
    const premiss = w > 0.60 ? 'Klacken har inte släppt det än.'
      : w >= 0.40 ? 'Klacken minns hur säsongen kändes.'
      : 'Känslorna sitter kvar i själva läktaren.'
    candidates.push({
      type: 'klackEcho',
      // Klackstate använder 0–1; kandidatfältet använder samma 0–100-skala
      // som övriga Efterklang-minnen.
      score: game.klackEcho.currentWeight * 100,
      memory: {
        type: 'klackEcho', primaryText: '', premiss, echo,
        objectName: 'Klacken',
        threadEntries: [{ matchday: round, season, text: echo }],
      },
    })
  }

  // Journalist memory — only surface when a real logged interaction exists
  const journalistMemories = game.journalist?.memory ?? []
  if (game.journalist?.name && journalistMemories.length > 0) {
    const name = game.journalist.name
    const echo = interpolate(pickEcho('journalist', seed + 2), { journalist: name })
    const hasSparkline = (game.scoreSnapshots?.journalistRelation?.length ?? 0) >= 5
    const notable = journalistMemories.reduce((best, m) =>
      Math.abs(m.sentiment) > Math.abs(best.sentiment) ? m : best
    )
    const sortedMemories = [...journalistMemories].sort((a, b) => a.matchday - b.matchday)
    // B4 — premiss: stam per event + ", omg {N}." (med opponentShort: " efter {opp}, omg {N}."
    // på good/bad/refused). {N} = första (äldsta) entryns matchday.
    const firstMem = sortedMemories[0]
    const ev = firstMem?.event ?? ''
    // A-L1 (SLUTTEST_KO.md) — nollvärdesvakt: matchday 0 är alltid en
    // föregångare-sentinel (preseason/uninitialiserat, currentMatchday startar
    // på 0 i createNewGame.ts), aldrig en riktig omgång att visa. `?? round`
    // fångar bara null/undefined — 0 är varken, så det slank igenom och
    // renderades ordagrant som "omg 0". `||` fångar 0 också.
    const premissN = firstMem?.matchday || round
    const premissSeason = firstMem?.season ?? season
    // SKALA-BUGGEN steg B — premissN är en global matchdag, inte en serie-
    // omgång. Konverterad mot posten EGEN säsong (kan skilja sig från
    // innevarande, "senaste 10 interaktionerna" kan sträcka sig tillbaka).
    // Cup-/slutspelsmatchdagar har ingen omgång — samma ärliga fallback
    // ("matchdag N") som cupbracket-precedenset i TabellScreen.tsx.
    const premissRound = matchdayToLeagueRound(premissN, premissSeason)
    const premissLabel = premissRound !== undefined ? `omg ${premissRound}` : `matchdag ${premissN}`
    const opp = firstMem?.opponentShort
    const stem = interpolate(JOURNALIST_PREMISS_STEM[ev] ?? '{journalist} hörde av sig', { journalist: name })
    const canAppendOpp = !!opp && (ev === 'good_answer' || ev === 'bad_answer' || ev === 'refused_press')
    const premiss = canAppendOpp ? `${stem} efter ${opp}, ${premissLabel}.` : `${stem}, ${premissLabel}.`
    const journalistAgendaItem = agenda.find(item => {
      const type = getStorylineTypeFromLedger(item.post)
      return type === 'journalist_feud' || type === 'journalist_redemption'
    })
    candidates.push({
      type: 'journalist',
      score: journalistAgendaItem?.scoresBySurface.efterklang.total
        ?? 50 + Math.abs(notable.sentiment) * 3 + (game.journalist.relationship ?? 50) * 0.3,
      memory: {
        type: 'journalist',
        primaryText: name,
        premiss,
        echo,
        objectName: name,
        sinceMatchday: sortedMemories[0]?.matchday,
        // Samma nollvärdesvakt i tråden (EfterklangThreadModal renderar "OMG {matchday}")
        // — annars kunde en enskild förkorrigerad post (0, gammalt save) fortfarande
        // synas i tidslinjen även efter att premissen ovan gatats.
        threadEntries: sortedMemories.map(m => ({
          matchday: m.matchday || round,
          season: m.season ?? season,
          text: JOURNALIST_EVENT_LABEL[m.event] ?? m.event,
        })),
        journalistName: name,
        hasJournalistSparkline: hasSparkline,
        sourcePost: journalistAgendaItem?.post,
        sourcePostKey: journalistAgendaItem?.postKey,
      },
    })
  }

  // Follow-up (bandyLetters from this season — fan mail still resonating)
  const thisSeasonLetters = (game.bandyLetters ?? []).filter(l => l.season === season)
  if (thisSeasonLetters.length > 0) {
    const letter = thisSeasonLetters[0]
    const echo = pickEcho('followUp', seed + 3)
    const premiss = `${letter.senderName} skrev till dig tidigare i säsongen.`  // B4
    candidates.push({
      type: 'followUp',
      score: 40,
      memory: {
        type: 'followUp', primaryText: letter.senderName, premiss, echo,
        objectName: letter.senderName,
        threadEntries: [{ matchday: round, season, text: letter.senderName }],
      },
    })
  }

  // Board objective history
  const recentObjective = (game.boardObjectiveHistory ?? []).slice(-1)[0]
  if (recentObjective && recentObjective.result === 'failed') {
    const echo = pickEcho('boardObjective', seed + 4)
    const premiss = 'Du missade styrelsens mål förra säsongen.'  // B4
    candidates.push({
      type: 'boardObjective',
      score: 55,
      memory: {
        type: 'boardObjective', primaryText: recentObjective.ownerReaction, premiss, echo,
        objectName: 'Styrelsemålet',
        threadEntries: [{ matchday: round, season, text: recentObjective.ownerReaction }],
      },
    })
  }

  // Nemesis — visa bara när nästa motståndare ÄR nemesisen, annars hänger ekot i
  // luften ("Slottsbron igen" ska vara sant: du möter dem nu). Playtest-fynd 9.
  const nextFixture = getNextManagedFixture(game)
  const nextOpponentId = nextFixture
    ? (nextFixture.homeClubId === game.managedClubId ? nextFixture.awayClubId : nextFixture.homeClubId)
    : undefined
  const nemeses = Object.values(game.nemesisTracker ?? {})
    .filter(n => !n.signedBy && n.goalsAgainstUs >= 2 && n.clubId === nextOpponentId)
    .sort((a, b) => b.goalsAgainstUs - a.goalsAgainstUs)
  if (nemeses.length > 0) {
    const n = nemeses[0]
    const opponentClub = game.clubs.find(c => c.id === n.clubId)
    const echo = interpolate(pickEcho('nemesis', seed + 5), {
      motståndare: opponentClub?.name ?? n.name,
    })
    // goalsAgainstUs är en karriärackumulator och nollställs inte vid
    // rollover. Säg därför inte att summan gäller innevarande säsong.
    const premiss = `${n.goalsAgainstUs} mål mot er.`
    candidates.push({
      type: 'nemesis',
      score: 45 + n.goalsAgainstUs * 5,
      memory: {
        type: 'nemesis', primaryText: n.name, premiss, echo,
        objectName: n.name,
        threadEntries: [{ matchday: round, season, text: `${n.goalsAgainstUs} mål mot oss` }],
      },
    })
  }

  // Economic scar — resolved player decisions come from the agenda. Active
  // crisis state and natural recovery remain live-state fallbacks because no
  // canonical resolution post exists for them yet.
  const crisis = game.economicCrisisState
  const economicDecisionItem = agenda.find(item =>
    item.post.type === 'decision'
    && /^criticalEconomy:(sell_star|take_loan|ask_mecenat)$/.test(item.post.semanticKey)
  )
  if (economicDecisionItem) {
    const outcome = economicDecisionItem.post.semanticKey.slice('criticalEconomy:'.length) as 'sold_star' | 'take_loan' | 'ask_mecenat'
    const resolutionType = outcome === 'take_loan' ? 'loan' : outcome === 'ask_mecenat' ? 'mecenat' : 'sold_star'
    const aftermath = ECONOMIC_SCAR_AFTERMATH[resolutionType]
    const soldPlayerName = resolveSubjectName(game, economicDecisionItem.post.subject)
      ?? crisis?.soldToSurvivePlayerName
      ?? ''
    const echo = aftermath.echoes[Math.floor(mulberry32(seed + 6)() * aftermath.echoes.length)]
    const premiss = interpolate(aftermath.premiss, { spelare: soldPlayerName })
    candidates.push({
      type: 'economicScar',
      score: economicDecisionItem.scoresBySurface.efterklang.total,
      memory: {
        type: 'economicScar', primaryText: '', premiss, echo,
        objectName: 'Budgetkrisen',
        threadEntries: [{
          matchday: economicDecisionItem.post.matchday,
          season: economicDecisionItem.post.season,
          text: echo,
        }],
        sourcePost: economicDecisionItem.post,
        sourcePostKey: economicDecisionItem.postKey,
      },
    })
  } else if (crisis) {
    if (crisis.phase !== 'resolved') {
      // A. Aktiv kris — oförändrad. 'decision' = sharpest, annars dämpat.
      const echo = pickEcho('economicScar', seed + 6)
      const premiss = crisis.phase === 'decision' ? 'Kassan är tom — igen.' : 'Inte länge sedan kassan var tom.'
      candidates.push({
        type: 'economicScar',
        score: 60,
        memory: {
          type: 'economicScar', primaryText: '', premiss, echo,
          objectName: 'Budgetkrisen',
          threadEntries: [{ matchday: round, season, text: echo }],
        },
      })
    } else if (crisis.resolvedMatchday !== undefined) {
      // B. Efterdyning — vägspecifik, inom 10 omgångar (gamla saves utan resolvedMatchday faller här).
      const recency = round - crisis.resolvedMatchday
      if (recency >= 0 && recency <= 10) {
        const rt = crisis.outcome ?? 'natural_recovery'
        const aftermath = ECONOMIC_SCAR_AFTERMATH[rt]
        const echo = aftermath.echoes[Math.floor(mulberry32(seed + 6)() * aftermath.echoes.length)]
        const premiss = interpolate(aftermath.premiss, { spelare: crisis.soldToSurvivePlayerName ?? '' })
        candidates.push({
          type: 'economicScar',
          score: 60,
          memory: {
            type: 'economicScar', primaryText: '', premiss, echo,
            objectName: 'Budgetkrisen',
            threadEntries: [{ matchday: crisis.resolvedMatchday, season, text: echo }],
          },
        })
      }
    }
  }

  // Rival sale — canonical ledger post first. The old recency pocket is kept
  // only for legacy saves until the agenda path has a post.
  const rivalSaleItem = agenda.find(item => item.post.type === 'rival_sale')
  if (rivalSaleItem) {
    const soldPlayerName = resolveSubjectName(game, rivalSaleItem.post.subject)
      ?? game.lastRivalSaleInfo?.soldPlayerName
    const buyerClubName = resolveSubjectName(game, rivalSaleItem.post.subject2)
      ?? game.lastRivalSaleInfo?.buyerClubName
    const echo = interpolate(pickEcho('rivalSale', seed + 7), {
      spelare: soldPlayerName ?? 'en spelare',
      rival: buyerClubName ?? 'rivalen',
    })
    const premiss = soldPlayerName && buyerClubName
      ? `Ni sålde ${soldPlayerName} till ${buyerClubName}.`
      : 'Ni sålde en nyckelspelare till en rival.'
    candidates.push({
      type: 'rivalSale',
      score: rivalSaleItem.scoresBySurface.efterklang.total,
      memory: {
        type: 'rivalSale', primaryText: '', premiss, echo,
        objectName: soldPlayerName ?? 'Rivalförsäljning',
        threadEntries: [{
          matchday: rivalSaleItem.post.matchday,
          season: rivalSaleItem.post.season,
          text: echo,
        }],
        soldPlayerName,
        buyerClubName,
        sourcePost: rivalSaleItem.post,
        sourcePostKey: rivalSaleItem.postKey,
      },
    })
  } else if (game.lastRivalSaleMatchday !== undefined) {
    const recency = round - game.lastRivalSaleMatchday
    if (recency >= 0 && recency <= 10) {
      const fallbackEchoes = [
        'Ni sålde en spelare dit. Han hälsar inte längre när ni möts.',
        'En spelare bär deras färger nu. Det svider fortfarande.',
      ]
      const echo = fallbackEchoes[Math.floor(mulberry32(seed + 7)() * fallbackEchoes.length)]
      // B4 — premiss: "Ni sålde {spelare} till {klubb}." (fallback om enrich saknas)
      const info = game.lastRivalSaleInfo
      const premiss = info
        ? `Ni sålde ${info.soldPlayerName} till ${info.buyerClubName}.`
        : 'Ni sålde en nyckelspelare till en rival.'
      candidates.push({
        type: 'rivalSale',
        score: 35 + (10 - recency) * 3,
        memory: {
          type: 'rivalSale', primaryText: '', premiss, echo,
          objectName: info ? info.soldPlayerName : 'Rivalförsäljning',
          threadEntries: [{ matchday: game.lastRivalSaleMatchday, season, text: echo }],
          soldPlayerName: info?.soldPlayerName,
          buyerClubName: info?.buyerClubName,
        },
      })
    }
  }

  // A told receipt must not make a visible thread swap underneath the player.
  // Pin canonical threads already shown on this matchday, then fill remaining
  // slots from the newly ranked mix. One thread per presentation type.
  const ranked = candidates.slice().sort((a, b) => b.score - a.score)
  const shownNow = ranked.filter(candidate =>
    candidate.memory.sourcePost
    && toldMarksFor(game.ledgerTold, candidate.memory.sourcePost).some(mark =>
      mark.surface === 'efterklang'
      && mark.season === chronology.season
      && mark.matchday === chronology.matchday
    )
  )
  const ordered = [
    ...shownNow,
    ...ranked.filter(candidate => !shownNow.includes(candidate)),
  ]
  const selected: EfterklangMemory[] = []
  const seenTypes = new Set<EfterklangType>()
  const seenPostKeys = new Set<string>()
  for (const candidate of ordered) {
    if (seenTypes.has(candidate.type)) continue
    if (candidate.memory.sourcePostKey && seenPostKeys.has(candidate.memory.sourcePostKey)) continue
    selected.push(candidate.memory)
    seenTypes.add(candidate.type)
    if (candidate.memory.sourcePostKey) seenPostKeys.add(candidate.memory.sourcePostKey)
    if (selected.length >= max) break
  }
  return selected
}
