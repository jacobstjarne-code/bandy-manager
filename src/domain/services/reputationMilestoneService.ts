import type { SaveGame, InboxItem } from '../entities/SaveGame'
import { InboxItemType } from '../enums'

export type ReputationTrigger =
  | 'academyNoticed'
  | 'mediaAttention'
  | 'neighborClubContact'
  | 'sponsorApproach'
  | 'scoutVisit'
  | 'reputationWarning'

export interface ReputationMilestone {
  id: string
  trigger: ReputationTrigger
  title: string
  body: string
  effect?: { type: string; amount: number }
}

export function checkReputationMilestones(game: SaveGame): ReputationMilestone[] {
  const milestones: ReputationMilestone[] = []
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  const rep = managedClub?.reputation ?? 50
  const cs = game.communityStanding ?? 50
  const pos = game.standings.find(s => s.clubId === game.managedClubId)?.position ?? 6
  const season = game.currentSeason
  const alreadySeen = new Set(game.resolvedEventIds ?? [])

  // P19-landslagstränaren (reputation > 65 + akademi > 60)
  const youthQuality = managedClub?.youthQuality ?? 50
  if (rep > 65 && youthQuality > 60) {
    const eid = `rep_academy_${season}`
    if (!alreadySeen.has(eid)) {
      milestones.push({
        id: eid,
        trigger: 'academyNoticed',
        title: '🔍 P19-landslagstränaren har noterat er',
        body: `"Vi följer er akademi med intresse. Ni har några spännande talanger."\n\nEtt erkännande som sprider sig — spelarnas motivation ökar.`,
        effect: { type: 'morale', amount: 3 },
      })
    }
  }

  // Mediaintresse (topp 3 + CS > 60)
  if (pos <= 3 && cs > 60) {
    const eid = `rep_media_${season}`
    if (!alreadySeen.has(eid)) {
      milestones.push({
        id: eid,
        trigger: 'mediaAttention',
        title: '📺 Bandypuls vill göra ett reportage',
        body: `"Er resa den här säsongen är en historia som förtjänas att berättas. Kan vi komma förbi på en träning?"\n\nBra publicitet — om ni fortsätter leverera.`,
        effect: { type: 'reputation', amount: 3 },
      })
    }
  }

  // Grannklubb vill samarbeta (CS > 70)
  if (cs > 70) {
    const eid = `rep_neighbor_${season}`
    if (!alreadySeen.has(eid)) {
      const neighbors = game.clubs.filter(c => c.id !== game.managedClubId).slice(0, 3)
      const neighbor = neighbors[season % neighbors.length]
      milestones.push({
        id: eid,
        trigger: 'neighborClubContact',
        title: `🤝 ${neighbor?.name ?? 'Grannklubben'} hör av sig`,
        body: `"Vi ser hur ni jobbar med orten. Kan vi träffas och prata om ett ungdomssamarbete?"\n\nEtt tecken på att ert arbete uppmärksammas.`,
        effect: { type: 'communityStanding', amount: 2 },
      })
    }
  }

  // Talangscout besöker match (reputation > 70 + har akademispelare i A-laget)
  const hasAcademyPlayer = game.players.some(p =>
    p.clubId === game.managedClubId && p.promotedFromAcademy && p.age <= 21
  )
  if (rep > 70 && hasAcademyPlayer) {
    const eid = `rep_scout_${season}`
    if (!alreadySeen.has(eid)) {
      const youngStar = game.players
        .filter(p => p.clubId === game.managedClubId && p.promotedFromAcademy && p.age <= 21)
        .sort((a, b) => b.potentialAbility - a.potentialAbility)[0]
      milestones.push({
        id: eid,
        trigger: 'scoutVisit',
        title: '👀 Talangscout på läktaren',
        body: `En scout från Elitserien satt på läktaren under senaste hemmamatchen. ${youngStar ? `Ögonen var riktade mot ${youngStar.firstName} ${youngStar.lastName}.` : 'Intresset växer.'}\n\nBra för ryktet. Kanske mindre bra för plånboken — om de vill köpa.`,
      })
    }
  }

  // Ryktet sjunker (position >= 10, CS < 40)
  if (pos >= 10 && cs < 40) {
    const eid = `rep_warning_${season}`
    if (!alreadySeen.has(eid)) {
      milestones.push({
        id: eid,
        trigger: 'reputationWarning',
        title: '📉 Ryktet bleknar',
        body: `Sponsorer drar sig undan. Talanger väljer andra klubbar. Kommunen frågar sig om pengarna gör nytta.\n\nDet här går åt fel håll.`,
        effect: { type: 'reputation', amount: -2 },
      })
    }
  }

  return milestones.slice(0, 1) // max en per omgång
}

export function milestonesToInbox(milestones: ReputationMilestone[], date: string): InboxItem[] {
  return milestones.map(m => ({
    id: m.id,
    date,
    type: InboxItemType.ReputationMilestone,
    title: m.title,
    body: m.body,
    isRead: false,
  }))
}
