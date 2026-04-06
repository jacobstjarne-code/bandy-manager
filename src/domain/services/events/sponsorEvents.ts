import type { SaveGame } from '../../entities/SaveGame'
import type { GameEvent } from '../../entities/GameEvent'

export function generateSponsorEvents(
  game: SaveGame,
  currentRound: number,
  alreadyQueued: Set<string>,
  _rand: () => number,
): GameEvent[] {
  const events: GameEvent[] = []

  // ── ICA Maxi event (every 4 rounds if icaMaxi sponsor exists) ──────────
  const icaMaxiSponsor = (game.sponsors ?? []).find(s => s.icaMaxi === true && s.contractRounds > 0)
  if (icaMaxiSponsor && currentRound % 4 === 0) {
    const eid = `icamaxi_visit_r${currentRound}_${game.currentSeason}`
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'icaMaxiEvent',
        title: 'Spelarsponsorträff',
        body: `ICA Maxi erbjuder 5 000 kr extra/omg om en spelare besöker butiken och träffar kunder.`,
        choices: [
          {
            id: 'send_player',
            label: 'Skicka en spelare till butiken',
            subtitle: '💰 +5 tkr · ⭐ +2 communityStanding',
            effect: { type: 'multiEffect', subEffects: JSON.stringify([
              { type: 'income', amount: 5000 },
              { type: 'communityStanding', amount: 2 },
            ]) },
          },
          {
            id: 'decline',
            label: 'Avböj — laget behöver all träning',
            subtitle: 'Inga effekter',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  return events
}
