// DREAM-002: Ekonomisk kris som narrativ bana
// Triggas när finances < -200 000 kr.
// Tre events sprids ut över 8 omgångar.

import type { SaveGame } from '../entities/SaveGame'
import type { GameEvent } from '../entities/GameEvent'

export function checkEconomicCrisis(game: SaveGame, nextMatchday: number): GameEvent | null {
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  if (!managedClub || managedClub.finances >= -200_000) return null

  const crisis = game.economicCrisisState
  const alreadyResolved = crisis?.phase === 'resolved'
  if (alreadyResolved) return null

  // Phase 1 — awareness (fires once, immediately when finances drop below -200k)
  if (!crisis) {
    const eventId = `event_crisis_awareness_${game.currentSeason}`
    if ((game.resolvedEventIds ?? []).includes(eventId)) return null
    if ((game.pendingEvents ?? []).some(e => e.id === eventId)) return null

    return {
      id: eventId,
      type: 'criticalEconomy',
      title: '🔴 Styrelsen ringer — krismöte',
      body: `Anders Lindgren (styrelsen) ringer klockan 22:17.\n\n"Jag har sett siffrorna. Vi är på ${managedClub.finances.toLocaleString('sv-SE')} kr. Det här är inte ett sponsorproblem — det är ett strukturellt problem. Jag vill träffa dig. I morgon. Inte på klubbkontoret. På Stadshotellet. Jag bjuder."`,
      sender: { name: 'Anders Lindgren', role: 'Styrelsens ordförande' },
      choices: [
        { id: 'accept_meeting', label: 'Tacka ja till mötet', effect: { type: 'startEconomicCrisis', crisisPhase: 'awareness' } },
        { id: 'propose_club', label: 'Föreslå klubbkontoret istället', effect: { type: 'startEconomicCrisis', crisisPhase: 'awareness' } },
      ],
      resolved: false,
      priority: 'critical',
    }
  }

  // Phase 2 — pressure (3 matchdays after phase 1 started)
  if (crisis.phase === 'awareness' && !crisis.eventsFired.includes('pressure')) {
    if (nextMatchday < crisis.startedMatchday + 3) return null
    const eventId = `event_crisis_pressure_${game.currentSeason}`
    if ((game.resolvedEventIds ?? []).includes(eventId)) return null
    if ((game.pendingEvents ?? []).some(e => e.id === eventId)) return null

    return {
      id: eventId,
      type: 'criticalEconomy',
      title: '⚠️ Huvudsponsorn hotar lämna',
      body: `Huvudsponsorns VD har ringt ordföranden.\n\n"Vi har varit med i elva år. Men vi kan inte vara klubbens lösning på allt. Antingen visar ni en plan inom två veckor, eller så står vår logga inte på tröjan nästa säsong."`,
      sender: { name: 'Holmström Bygg', role: 'Huvudsponsor' },
      choices: [
        {
          id: 'present_plan',
          label: 'Presentera en ekonomisk plan (−20 000 kr)',
          effect: { type: 'startEconomicCrisis', crisisPhase: 'pressure', value: -20_000 },
        },
        {
          id: 'accept_loss',
          label: 'Acceptera — vi klarar oss utan dem',
          effect: { type: 'resolveEconomicCrisis', crisisPhase: 'natural_recovery' },
        },
      ],
      resolved: false,
      priority: 'critical',
    }
  }

  // Phase 3 — decision (5 matchdays after phase 1)
  if ((crisis.phase === 'awareness' || crisis.phase === 'pressure') && !crisis.eventsFired.includes('decision')) {
    if (nextMatchday < crisis.startedMatchday + 5) return null
    const eventId = `event_crisis_decision_${game.currentSeason}`
    if ((game.resolvedEventIds ?? []).includes(eventId)) return null
    if ((game.pendingEvents ?? []).some(e => e.id === eventId)) return null

    // Find best managed player to offer as sale option
    const managedPlayers = game.players
      .filter(p => p.clubId === game.managedClubId && !p.isClubLegend)
      .sort((a, b) => b.currentAbility - a.currentAbility)
    const bestPlayer = managedPlayers[0]
    const bestName = bestPlayer ? `${bestPlayer.firstName} ${bestPlayer.lastName}` : 'bäste spelaren'

    return {
      id: eventId,
      type: 'criticalEconomy',
      title: '🔴 Två vägar ur krisen',
      body: `Ekonomichefen har räknat. Det finns tre vägar:\n\n**A. Sälj ${bestName}.** Budet ligger på 350 000 kr. Det löser skulden men laget försvagas.\n\n**B. Kommunlån.** 300 000 kr över tre år. Räntan äter hälften av intäkterna. Politiskt känsligt.\n\n**C. Be mecenaten om hjälp.** Om ni har en aktiv mecenat kan han täcka 200 000 kr. Men det kostar i lojalitet.`,
      sender: { name: 'Johan Bergstedt', role: 'Ekonomichef' },
      relatedPlayerId: bestPlayer?.id,
      choices: [
        {
          id: 'sell_star',
          label: `Sälj ${bestName} (+350 000 kr)`,
          effect: { type: 'resolveEconomicCrisis', value: 350_000, crisisPhase: 'sold_star', removePlayerId: bestPlayer?.id },
        },
        {
          id: 'take_loan',
          label: 'Kommunlån (+300 000 kr, löpande kostnad)',
          effect: { type: 'resolveEconomicCrisis', value: 300_000, crisisPhase: 'loan' },
        },
        {
          id: 'ask_mecenat',
          label: 'Be mecenaten (+200 000 kr, lojalitet −30)',
          effect: { type: 'resolveEconomicCrisis', value: 200_000, crisisPhase: 'mecenat' },
        },
      ],
      resolved: false,
      priority: 'critical',
    }
  }

  return null
}
