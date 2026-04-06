import type { SaveGame, InboxItem } from '../entities/SaveGame'
import type { Player } from '../entities/Player'
import { InboxItemType } from '../enums'

const RUMOR_TEMPLATES = [
  (p: Player, club: string) => `Uppgifter om att ${club} försöker värva ${p.firstName} ${p.lastName}.`,
  (p: Player, club: string) => `${p.firstName} ${p.lastName} uppges vara missnöjd i ${club} — kan vara tillgänglig.`,
  (p: Player, club: string) => `Rykten om att ${club} letar efter en ny ${posLabel(p.position)} — ${p.firstName} ${p.lastName} nämns.`,
  (p: Player, _club: string) => `${p.firstName} ${p.lastName} ska ha fått anbud från en division 1-klubb.`,
  (_p: Player, club: string) => `${club} ska vara på jakt efter förstärkning inför slutspelet.`,
]

const ATMOSPHERE_RUMORS = [
  'Rykten om att en ny sponsor från Norrland vill in i bandyn.',
  'En gammal legendar sägs vara intresserad av en tränarroll.',
  'Uppgifter om att SBF diskuterar regeländringar inför nästa säsong.',
  'Lokaltidningen rapporterar om ökat intresse för bandy bland ungdomar i regionen.',
  'En tidigare landslagsspelare ska vara på väg tillbaka till allsvenskan.',
]

function posLabel(pos: string): string {
  switch (pos) {
    case 'GK': return 'målvakt'
    case 'DEF': return 'back'
    case 'HALF': return 'halvback'
    case 'FWD': return 'forward'
    default: return 'spelare'
  }
}

export function generateTransferRumor(game: SaveGame, rand: () => number): InboxItem | null {
  const matchday = Math.max(0, ...game.fixtures.filter(f => f.status === 'completed').map(f => f.matchday))

  // Only generate between matchday 5-18
  if (matchday < 5 || matchday > 18) return null

  // ~30% chance per round
  if (rand() > 0.30) return null

  // 50/50: real player rumor vs atmosphere
  if (rand() < 0.5) {
    // Find a player from another club that could be interesting
    const otherPlayers = game.players.filter(p =>
      p.clubId !== game.managedClubId &&
      p.clubId !== null &&
      (p.currentAbility ?? 50) > 45 &&
      !p.isInjured
    )
    if (otherPlayers.length === 0) return null

    const player = otherPlayers[Math.floor(rand() * otherPlayers.length)]
    const club = game.clubs.find(c => c.id === player.clubId)
    if (!club) return null

    const template = RUMOR_TEMPLATES[Math.floor(rand() * RUMOR_TEMPLATES.length)]
    const text = template(player, club.name)

    return {
      id: `rumor-${matchday}-${player.id}`,
      date: game.currentDate,
      type: InboxItemType.Transfer,
      title: '📰 Transferrykte',
      body: text,
      relatedPlayerId: player.id,
      relatedClubId: club.id,
      isRead: false,
    }
  }

  // Atmosphere rumor
  const text = ATMOSPHERE_RUMORS[Math.floor(rand() * ATMOSPHERE_RUMORS.length)]
  return {
    id: `rumor-atm-${matchday}`,
    date: game.currentDate,
    type: InboxItemType.Media,
    title: '📰 Från pressplätten',
    body: text,
    isRead: false,
  }
}
