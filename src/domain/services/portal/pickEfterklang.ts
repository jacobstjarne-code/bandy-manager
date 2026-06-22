import type { SaveGame } from '../../entities/SaveGame'
import { EFTERKLANG_ECHO, ECONOMIC_SCAR_AFTERMATH, type EfterklangType } from '../../data/efterklangText'
import { mulberry32 } from '../../utils/random'
import { FixtureStatus } from '../../enums'
import { getNextManagedFixture } from './triggers/matchTriggers'

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
}

function pickEcho(type: EfterklangType, seed: number): string {
  const pool = EFTERKLANG_ECHO[type]
  return pool[Math.floor(mulberry32(seed)() * pool.length)]
}

function interpolate(text: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((t, [k, v]) => t.replace(new RegExp(`\\{${k}\\}`, 'g'), v), text)
}

export function pickEfterklang(game: SaveGame, max = 2): EfterklangMemory[] {
  // A3: gate på spelade ligamatcher (inte currentMatchday) — visa inte efterklang för tidigt
  const playedLeague = game.fixtures.filter(f =>
    f.status === FixtureStatus.Completed && !f.isCup && f.season === game.currentSeason
  ).length
  if (playedLeague < 5) return []

  const round = game.currentMatchday
  const season = game.currentSeason
  const seed = season * 7919 + round * 31

  const candidates: Array<{ type: EfterklangType; score: number; memory: EfterklangMemory }> = []

  // Anniversary
  const anniversaries = (game.activeAnniversaries ?? [])
    .filter(a => a.significance >= 70)
    .sort((a, b) => b.significance - a.significance)
  if (anniversaries.length > 0) {
    const ann = anniversaries[0]
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
        threadEntries: [{ matchday: round, text: ann.originalEventText }],
      },
    })
  }

  // Klack echo
  if (game.klackEcho && game.klackEcho.currentWeight > 0.20) {
    const echo = pickEcho('klackEcho', seed + 1)
    // B4 — premiss på currentWeight
    const w = game.klackEcho.currentWeight
    const premiss = w > 60 ? 'Klacken har inte släppt det än.'
      : w >= 40 ? 'Klacken minns hur säsongen kändes.'
      : 'Känslorna sitter kvar i själva läktaren.'
    candidates.push({
      type: 'klackEcho',
      score: game.klackEcho.currentWeight,
      memory: {
        type: 'klackEcho', primaryText: '', premiss, echo,
        objectName: 'Klacken',
        threadEntries: [{ matchday: round, text: echo }],
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
    const premissN = firstMem?.matchday ?? round
    const opp = firstMem?.opponentShort
    const stem = interpolate(JOURNALIST_PREMISS_STEM[ev] ?? '{journalist} hörde av sig', { journalist: name })
    const canAppendOpp = !!opp && (ev === 'good_answer' || ev === 'bad_answer' || ev === 'refused_press')
    const premiss = canAppendOpp ? `${stem} efter ${opp}, omg ${premissN}.` : `${stem}, omg ${premissN}.`
    candidates.push({
      type: 'journalist',
      score: 50 + Math.abs(notable.sentiment) * 3 + (game.journalist.relationship ?? 50) * 0.3,
      memory: {
        type: 'journalist',
        primaryText: name,
        premiss,
        echo,
        objectName: name,
        sinceMatchday: sortedMemories[0]?.matchday,
        threadEntries: sortedMemories.map(m => ({
          matchday: m.matchday,
          text: JOURNALIST_EVENT_LABEL[m.event] ?? m.event,
        })),
        journalistName: name,
        hasJournalistSparkline: hasSparkline,
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
        threadEntries: [{ matchday: round, text: letter.senderName }],
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
        threadEntries: [{ matchday: round, text: recentObjective.ownerReaction }],
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
    const premiss = `${n.goalsAgainstUs} mål mot er den här säsongen.`  // B4 (goalsAgainstUs alltid ≥ 2)
    candidates.push({
      type: 'nemesis',
      score: 45 + n.goalsAgainstUs * 5,
      memory: {
        type: 'nemesis', primaryText: n.name, premiss, echo,
        objectName: n.name,
        threadEntries: [{ matchday: round, text: `${n.goalsAgainstUs} mål mot oss` }],
      },
    })
  }

  // Economic scar
  const crisis = game.economicCrisisState
  if (crisis) {
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
          threadEntries: [{ matchday: round, text: echo }],
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
            threadEntries: [{ matchday: crisis.resolvedMatchday, text: echo }],
          },
        })
      }
    }
  }

  // Rival sale — only surface if recent enough (within 10 rounds)
  if (game.lastRivalSaleMatchday !== undefined) {
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
          threadEntries: [{ matchday: game.lastRivalSaleMatchday, text: echo }],
          soldPlayerName: info?.soldPlayerName,
          buyerClubName: info?.buyerClubName,
        },
      })
    }
  }

  // Top-max by score, unique types (guaranteed since candidates are built one per type)
  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(c => c.memory)
}
