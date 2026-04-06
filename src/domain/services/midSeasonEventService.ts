import type { SaveGame, InboxItem, StandingRow } from '../entities/SaveGame'
import { InboxItemType } from '../enums'

interface MidSeasonTrigger {
  matchday: number
  check: (game: SaveGame, standing: StandingRow | undefined) => boolean
  generate: (game: SaveGame, standing: StandingRow | undefined) => InboxItem
}

const TRIGGERS: MidSeasonTrigger[] = [
  // Round ~10, top 3 — local paper takes notice
  {
    matchday: 10,
    check: (_g, s) => (s?.position ?? 99) <= 3,
    generate: (g, s) => ({
      id: `mse-top3-${g.currentSeason}`,
      date: g.currentDate,
      type: InboxItemType.Media,
      title: '📰 Positiv uppmärksamhet',
      body: `${g.clubs.find(c => c.id === g.managedClubId)?.name ?? 'Laget'} ligger ${s?.position}:a efter tio omgångar. Lokaltidningen skriver om den starka höstformen.`,
      isRead: false,
    }),
  },
  // Round ~10, bottom 3 — board concern
  {
    matchday: 10,
    check: (_g, s) => (s?.position ?? 1) >= 10,
    generate: (g, _s) => ({
      id: `mse-bottom-${g.currentSeason}`,
      date: g.currentDate,
      type: InboxItemType.BoardFeedback,
      title: '🏛️ Oro i styrelserummet',
      body: 'Styrelseledamöter har börjat viska om riktningen. De vill se resultat snart.',
      isRead: false,
    }),
  },
  // Round ~15, tight race (within 4 pts of leader)
  {
    matchday: 15,
    check: (g, s) => {
      if (!s) return false
      const leader = g.standings.reduce((best, row) => row.points > best.points ? row : best, g.standings[0])
      return leader && (leader.points - s.points) <= 4 && s.position <= 4
    },
    generate: (g, s) => ({
      id: `mse-tightrace-${g.currentSeason}`,
      date: g.currentDate,
      type: InboxItemType.Media,
      title: '🔥 Seriefeber',
      body: `Toppstriden är kok-het! Bara ${g.standings[0].points - (s?.points ?? 0)} poäng till serieledaren. Publiken börjar vakna.`,
      isRead: false,
    }),
  },
  // Round ~15, bottom 3 — fan frustration
  {
    matchday: 15,
    check: (_g, s) => (s?.position ?? 1) >= 10,
    generate: (g, _s) => ({
      id: `mse-fans-${g.currentSeason}`,
      date: g.currentDate,
      type: InboxItemType.Community,
      title: '😤 Frustrerade fans',
      body: 'Supportrarna börjar tappa tålamodet. "Vi hade väntat oss mer" säger en talesperson på sociala medier.',
      isRead: false,
    }),
  },
  // Round ~18, playoff chase
  {
    matchday: 18,
    check: (_g, s) => {
      if (!s) return false
      return s.position >= 6 && s.position <= 10
    },
    generate: (g, s) => ({
      id: `mse-playoffjakt-${g.currentSeason}`,
      date: g.currentDate,
      type: InboxItemType.Media,
      title: '⚡ Slutspelsjakt',
      body: `Med fyra omgångar kvar ligger laget ${s?.position}:a. Varje poäng räknas i jakten på topp 8.`,
      isRead: false,
    }),
  },
  // Round ~20, top 2 — title contention
  {
    matchday: 20,
    check: (_g, s) => (s?.position ?? 99) <= 2,
    generate: (g, _s) => ({
      id: `mse-title-${g.currentSeason}`,
      date: g.currentDate,
      type: InboxItemType.Media,
      title: '👑 Titelkamp',
      body: 'Laget går in i de avgörande omgångarna som seriefavorit. Hela bygden följer med.',
      isRead: false,
    }),
  },
]

/**
 * Check mid-season event triggers. Call once per round from roundProcessor.
 * Returns inbox items to add (0 or 1 typically).
 */
export function checkMidSeasonEvents(game: SaveGame): InboxItem[] {
  const lastMatchday = Math.max(0, ...game.fixtures.filter(f => f.status === 'completed').map(f => f.matchday))
  const standing = game.standings.find(s => s.clubId === game.managedClubId)
  const results: InboxItem[] = []

  for (const trigger of TRIGGERS) {
    // Fire on the matchday or within 1 (in case it was skipped)
    if (Math.abs(lastMatchday - trigger.matchday) > 1) continue

    // Check not already sent
    const candidate = trigger.generate(game, standing)
    if (game.inbox.some(i => i.id === candidate.id)) continue

    if (trigger.check(game, standing)) {
      results.push(candidate)
    }
  }

  return results
}
