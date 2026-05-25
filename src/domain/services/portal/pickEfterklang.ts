import type { SaveGame } from '../../entities/SaveGame'
import { EFTERKLANG_ECHO, type EfterklangType } from '../../data/efterklangText'
import { mulberry32 } from '../../utils/random'

export interface EfterklangMemory {
  type: EfterklangType
  primaryText: string
  echo: string
  /** journalist type only */
  journalistName?: string
  hasJournalistSparkline?: boolean
}

function pickEcho(type: EfterklangType, seed: number): string {
  const pool = EFTERKLANG_ECHO[type]
  return pool[Math.floor(mulberry32(seed)() * pool.length)]
}

function interpolate(text: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((t, [k, v]) => t.replace(new RegExp(`\\{${k}\\}`, 'g'), v), text)
}

export function pickEfterklang(game: SaveGame, max = 2): EfterklangMemory[] {
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
    candidates.push({
      type: 'anniversary',
      score: ann.significance * (ann.echoSize === 'big' ? 1.3 : 1.0),
      memory: { type: 'anniversary', primaryText: ann.originalEventText, echo },
    })
  }

  // Klack echo
  if (game.klackEcho && game.klackEcho.currentWeight > 20) {
    const echo = pickEcho('klackEcho', seed + 1)
    candidates.push({
      type: 'klackEcho',
      score: game.klackEcho.currentWeight,
      memory: { type: 'klackEcho', primaryText: '', echo },
    })
  }

  // Journalist memory — only surface when a real logged interaction exists
  const journalistMemories = game.journalist?.memory ?? []
  if (game.journalist?.name && journalistMemories.length > 0) {
    const name = game.journalist.name
    const echo = interpolate(pickEcho('journalist', seed + 2), { journalist: name })
    const hasSparkline = (game.scoreSnapshots?.journalistRelation?.length ?? 0) >= 5
    // Score on recency + sentiment magnitude of most notable memory
    const notable = journalistMemories.reduce((best, m) =>
      Math.abs(m.sentiment) > Math.abs(best.sentiment) ? m : best
    )
    candidates.push({
      type: 'journalist',
      score: 50 + Math.abs(notable.sentiment) * 3 + (game.journalist.relationship ?? 50) * 0.3,
      memory: {
        type: 'journalist',
        primaryText: name,
        echo,
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
    candidates.push({
      type: 'followUp',
      score: 40,
      memory: { type: 'followUp', primaryText: letter.senderName, echo },
    })
  }

  // Board objective history
  const recentObjective = (game.boardObjectiveHistory ?? []).slice(-1)[0]
  if (recentObjective && recentObjective.result === 'failed') {
    const echo = pickEcho('boardObjective', seed + 4)
    candidates.push({
      type: 'boardObjective',
      score: 55,
      memory: { type: 'boardObjective', primaryText: recentObjective.ownerReaction, echo },
    })
  }

  // Nemesis
  const nemeses = Object.values(game.nemesisTracker ?? {})
    .filter(n => !n.signedBy && n.goalsAgainstUs >= 2)
    .sort((a, b) => b.goalsAgainstUs - a.goalsAgainstUs)
  if (nemeses.length > 0) {
    const n = nemeses[0]
    const opponentClub = game.clubs.find(c => c.id === n.clubId)
    const echo = interpolate(pickEcho('nemesis', seed + 5), {
      motståndare: opponentClub?.name ?? n.name,
    })
    candidates.push({
      type: 'nemesis',
      score: 45 + n.goalsAgainstUs * 5,
      memory: { type: 'nemesis', primaryText: n.name, echo },
    })
  }

  // Economic scar
  if (game.economicCrisisState && game.economicCrisisState.phase !== 'resolved') {
    const echo = pickEcho('economicScar', seed + 6)
    candidates.push({
      type: 'economicScar',
      score: 60,
      memory: { type: 'economicScar', primaryText: '', echo },
    })
  }

  // Rival sale — only surface if recent enough (within 10 rounds)
  if (game.lastRivalSaleMatchday !== undefined) {
    const recency = round - game.lastRivalSaleMatchday
    if (recency >= 0 && recency <= 10) {
      // Text pools without {spelare}/{rival} interpolation (data not stored)
      const fallbackEchoes = [
        'Ni sålde en spelare dit. Han hälsar inte längre när ni möts.',
        'En spelare bär deras färger nu. Det svider fortfarande.',
      ]
      const echo = fallbackEchoes[Math.floor(mulberry32(seed + 7)() * fallbackEchoes.length)]
      candidates.push({
        type: 'rivalSale',
        score: 35 + (10 - recency) * 3,
        memory: { type: 'rivalSale', primaryText: '', echo },
      })
    }
  }

  // Top-max by score, unique types (guaranteed since candidates are built one per type)
  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(c => c.memory)
}
