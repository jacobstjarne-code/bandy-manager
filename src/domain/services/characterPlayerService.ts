import type { Player } from '../entities/Player'
import type { GameEvent } from '../entities/GameEvent'
import type { PlayerTrait } from '../data/playerTraits'
import { mulberry32 } from '../utils/random'

const TRAIT_LIST: PlayerTrait[] = ['veteran', 'hungrig', 'ledare', 'lokal', 'joker']

// Assign 4–6 character players at game creation
export function initCharacterPlayers(players: Player[], seed: number): Player[] {
  const rand = mulberry32(seed + 99991)
  const pool = [...players]
  const count = 4 + Math.floor(rand() * 3) // 4, 5 or 6
  const picked = new Set<string>()

  // Ensure variety: pick one per trait if possible
  const traitAssignments: Map<string, PlayerTrait> = new Map()
  for (const trait of TRAIT_LIST) {
    if (traitAssignments.size >= count) break
    // Filter candidates by trait affinity
    const candidates = pool.filter(p => {
      if (picked.has(p.id)) return false
      if (trait === 'veteran') return p.age >= 30
      if (trait === 'hungrig') return p.age <= 24
      if (trait === 'ledare') return p.currentAbility >= 60
      if (trait === 'lokal') return p.isHomegrown
      return true // joker: anyone
    })
    if (candidates.length === 0) continue
    const chosen = candidates[Math.floor(rand() * candidates.length)]
    picked.add(chosen.id)
    traitAssignments.set(chosen.id, trait)
  }

  // Fill remaining slots with joker if we haven't hit count
  while (traitAssignments.size < count) {
    const remaining = pool.filter(p => !picked.has(p.id))
    if (remaining.length === 0) break
    const chosen = remaining[Math.floor(rand() * remaining.length)]
    picked.add(chosen.id)
    traitAssignments.set(chosen.id, 'joker')
  }

  return players.map(p => {
    const trait = traitAssignments.get(p.id)
    if (!trait) return p
    return {
      ...p,
      isCharacterPlayer: true,
      trait,
      loyaltyScore: 5, // start neutral (0–10)
    }
  })
}

// Called at season end: adjust loyaltyScore based on performance, age, playtime
export function updateLoyaltyScores(players: Player[]): Player[] {
  return players.map(p => {
    if (!p.isCharacterPlayer) return p
    const ls = p.loyaltyScore ?? 5
    let delta = 0

    // More games played → more loyal
    const games = p.seasonStats.gamesPlayed
    if (games >= 12) delta += 1
    else if (games <= 4) delta -= 1

    // Good form → positive
    if (p.form >= 70) delta += 1
    else if (p.form <= 30) delta -= 1

    // Veterans approaching retirement get sentimental
    if (p.trait === 'veteran' && p.age >= 35) delta += 1

    // Hungry players who didn't get minutes get frustrated
    if (p.trait === 'hungrig' && games <= 5) delta -= 1

    return {
      ...p,
      loyaltyScore: Math.max(0, Math.min(10, ls + delta)),
    }
  })
}

// Called inside generateEvents — returns additional events for character players
export function generateCharacterPlayerEvents(
  players: Player[],
  currentRound: number,
  alreadyQueued: Set<string>,
  rand: () => number,
  captainPlayerId?: string,
): GameEvent[] {
  const events: GameEvent[] = []
  const characterPlayers = players.filter(p => p.isCharacterPlayer)

  for (const player of characterPlayers) {
    const name = `${player.firstName} ${player.lastName}`
    const ls = player.loyaltyScore ?? 5

    // Veteran retirement warning — round 1, age >= 33
    if (player.trait === 'veteran' && player.age >= 33 && currentRound === 1) {
      const eid = `veteran_retirement_${player.id}`
      if (!alreadyQueued.has(eid)) {
        events.push({
          id: eid,
          type: 'communityEvent',
          title: `${name} funderar på att sluta`,
          body: `${name} har spelat i ${player.age} år och börjar fundera på pensionen. Hur hanterar du det?`,
          relatedPlayerId: player.id,
          choices: [
            {
              id: 'honor',
              label: 'Ge honom en hedersbetygelse och be honom stanna ett år till',
              subtitle: '⭐ +3 samhällsstöd',
              effect: { type: 'communityStanding', amount: 3 },
            },
            {
              id: 'plan',
              label: 'Planera för övergång — hitta en ersättare',
              subtitle: 'Inga effekter',
              effect: { type: 'noOp' },
            },
          ],
          resolved: false,
        })
      }
    }

    // Jubilee — loyaltyScore hits 10 at round 1
    if (ls >= 10 && currentRound === 1) {
      const eid = `jubilee_${player.id}`
      if (!alreadyQueued.has(eid)) {
        events.push({
          id: eid,
          type: 'communityEvent',
          title: `${name} — en sann klubblegend`,
          body: `${name} är en av de mest lojala spelarna föreningen har haft. Orten märker det. Vill du uppmärksamma det offentligt?`,
          relatedPlayerId: player.id,
          choices: [
            {
              id: 'ceremony',
              label: 'Ordna en ceremoni inför hemmamatchen',
              subtitle: '⭐ +5 samhällsstöd · 💰 -3 tkr',
              effect: { type: 'multiEffect', subEffects: JSON.stringify([
                { type: 'communityStanding', amount: 5 },
                { type: 'income', amount: -3000 },
              ]) },
            },
            {
              id: 'quiet',
              label: 'Uppmärksamma det internt — han förtjänar det stilla',
              subtitle: '⭐ +2 samhällsstöd',
              effect: { type: 'communityStanding', amount: 2 },
            },
          ],
          resolved: false,
        })
      }
    }

    // Leader gets captain role — round 2, only if no captain has been chosen yet
    if (player.trait === 'ledare' && currentRound === 2 && !captainPlayerId) {
      const eid = `captain_${player.id}`
      if (!alreadyQueued.has(eid)) {
        events.push({
          id: eid,
          type: 'communityEvent',
          title: `Utse kapten — ${name}?`,
          body: `${name} är en naturlig ledare. Laget respekterar honom. Vill du göra honom till officiell kapten inför säsongen?`,
          relatedPlayerId: player.id,
          choices: [
            {
              id: 'yes',
              label: `Utse ${player.firstName} till kapten`,
              subtitle: '⭐ +2 samhällsstöd',
              effect: { type: 'communityStanding', amount: 2 },
            },
            {
              id: 'no',
              label: 'Ingen officiell kapten — laget avgör det själva',
              subtitle: 'Inga effekter',
              effect: { type: 'noOp' },
            },
          ],
          resolved: false,
        })
      }
    }

    // Hungry young player wants more — round >= 16, good stats
    if (
      player.trait === 'hungrig' &&
      player.age <= 26 &&
      currentRound >= 16 &&
      (player.seasonStats.goals >= 5 || player.seasonStats.averageRating >= 6.5)
    ) {
      const eid = `hungrig_wants_more_${player.id}`
      if (!alreadyQueued.has(eid) && rand() < 0.6) {
        events.push({
          id: eid,
          type: 'communityEvent',
          title: `${name} vill kliva upp`,
          body: `${name} har levererat hela säsongen och börjar höra sig för om det finns intresse från högre divisioner. Hur svarar du?`,
          relatedPlayerId: player.id,
          choices: [
            {
              id: 'support',
              label: 'Stötta hans ambitioner — öppen dörr om rätt erbjudande kommer',
              subtitle: '🤝 +2 journalistrelation',
              effect: { type: 'journalistRelationship', amount: 2 },
            },
            {
              id: 'keep',
              label: 'Be honom stanna ytterligare en säsong',
              subtitle: '⭐ +1 samhällsstöd',
              effect: { type: 'communityStanding', amount: 1 },
            },
          ],
          resolved: false,
        })
      }
    }
  }

  return events
}
