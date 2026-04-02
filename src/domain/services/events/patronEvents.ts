import type { SaveGame } from '../../entities/SaveGame'
import type { GameEvent } from '../../entities/GameEvent'
import { PATRON_UNHAPPY_QUOTES, PATRON_HAPPY_QUOTES, PATRON_STYLE_COMPLAINTS } from '../../data/patronData'

export function generatePatronEvents(
  game: SaveGame,
  currentRound: number,
  alreadyQueued: Set<string>,
  rand: () => number,
): GameEvent[] {
  const events: GameEvent[] = []
  const patron = game.patron

  if (patron?.isActive) {
    // Patron unhappy — round 5–10, happiness < 60
    if (currentRound >= 5 && currentRound <= 10 && (patron.happiness ?? 50) < 60) {
      const eid = `patron_unhappy_r${currentRound}`
      if (!alreadyQueued.has(eid)) {
        const quoteIdx = Math.floor(rand() * PATRON_UNHAPPY_QUOTES.length)
        const quote = PATRON_UNHAPPY_QUOTES[quoteIdx]
        events.push({
          id: eid,
          type: 'patronEvent',
          title: `${patron.name} är missnöjd`,
          body: quote,
          choices: [
            {
              id: 'promise',
              label: 'Lova att ta hänsyn',
              effect: { type: 'patronHappiness', amount: 15 },
            },
            {
              id: 'refuse',
              label: 'Jag tar egna beslut',
              effect: { type: 'patronHappiness', amount: -10 },
            },
          ],
          resolved: false,
        })
      }
    }

    // Patron about to withdraw — round >= 8, happiness < 30
    if (currentRound >= 8 && (patron.happiness ?? 50) < 30) {
      const eid = `patron_withdraw_r${currentRound}`
      if (!alreadyQueued.has(eid)) {
        events.push({
          id: eid,
          type: 'patronEvent',
          title: `${patron.name} hotar dra sig ur`,
          body: 'Patronen överväger att avsluta sin sponsring. Ni kan försöka rädda relationen med ett möte — eller acceptera förlusten.',
          choices: [
            {
              id: 'meet',
              label: 'Boka ett möte',
              effect: { type: 'patronHappiness', amount: 30 },
            },
            {
              id: 'accept',
              label: 'Acceptera att han/hon lämnar',
              effect: { type: 'patronHappiness', amount: -50 },
            },
          ],
          resolved: false,
        })
      }
    }

    // Patron style complaint — round 11–13, wantsStyle set, happiness 30–70
    if (
      patron.wantsStyle &&
      currentRound >= 11 && currentRound <= 13 &&
      (patron.happiness ?? 50) >= 30 && (patron.happiness ?? 50) <= 70
    ) {
      const eid = `patron_style_r${currentRound}`
      if (!alreadyQueued.has(eid)) {
        const quoteIdx = Math.floor(rand() * PATRON_STYLE_COMPLAINTS.length)
        events.push({
          id: eid,
          type: 'patronEvent',
          title: `${patron.name} om spelets`,
          body: PATRON_STYLE_COMPLAINTS[quoteIdx],
          choices: [
            {
              id: 'agree',
              label: `Lova att spela mer ${
                patron.wantsStyle === 'attacking' ? 'anfallsspel'
                : patron.wantsStyle === 'defensive' ? 'defensivt'
                : patron.wantsStyle === 'physical' ? 'fysiskt'
                : patron.wantsStyle === 'technical' ? 'tekniskt'
                : patron.wantsStyle
              }`,
              effect: { type: 'patronHappiness', amount: 12 },
            },
            {
              id: 'diplomatic',
              label: 'Förklara taktiska skälen',
              effect: { type: 'patronHappiness', amount: 3 },
            },
            {
              id: 'refuse',
              label: 'Taktiken är min sak',
              effect: { type: 'patronHappiness', amount: -8 },
            },
          ],
          resolved: false,
        })
      }
    }

    // Patron bonus — round 10–14, happiness > 80
    if (currentRound >= 10 && currentRound <= 14 && (patron.happiness ?? 50) > 80) {
      const eid = `patron_bonus_r${currentRound}`
      if (!alreadyQueued.has(eid)) {
        const quoteIdx = Math.floor(rand() * PATRON_HAPPY_QUOTES.length)
        const quote = PATRON_HAPPY_QUOTES[quoteIdx]
        events.push({
          id: eid,
          type: 'patronEvent',
          title: `${patron.name} bjuder på bonus`,
          body: `${quote} Patronen skänker 20 000 kr i extra bidrag.`,
          choices: [
            {
              id: 'thank',
              label: 'Tacka varmt',
              effect: { type: 'income', amount: 20000 },
            },
          ],
          resolved: false,
        })
      }
    }
  }

  // ── Patron influence escalation ──────────────────────────────────────────
  const patronGame = game.patron
  if (patronGame?.isActive) {
    const influence = patronGame.influence ?? 30
    const patience = patronGame.patience ?? 80

    // Influence crosses 60 — wants to affect decisions
    if (influence >= 60 && influence < 80) {
      const eid = `patron_influence_60_${game.currentSeason}`
      if (!alreadyQueued.has(eid)) {
        events.push({
          id: eid,
          type: 'patronInfluence',
          title: `${patronGame.name} vill påverka beslut`,
          body: `${patronGame.name} har bidragit med ${(patronGame.totalContributed ?? patronGame.contribution).toLocaleString('sv-SE')} kr totalt och börjar känna att han borde ha mer att säga till om.`,
          choices: [
            {
              id: 'listen',
              label: 'Bjud in till styrelsemöte',
              effect: { type: 'patronHappiness', amount: 15 },
            },
            {
              id: 'decline',
              label: 'Tacka men håll gränsen',
              effect: { type: 'patronHappiness', amount: -5 },
            },
          ],
          resolved: false,
        })
      }
    }

    // Patron ignored — patience < 20 and influence > 30
    if (patience < 20 && influence > 30) {
      const eid = `patron_ignored_${game.currentSeason}`
      if (!alreadyQueued.has(eid)) {
        events.push({
          id: eid,
          type: 'patronInfluence',
          title: `${patronGame.name} känner sig ignorerad`,
          body: `${patronGame.name} har investerat i klubben men märker att hans synpunkter aldrig tas på allvar. Han funderar på att dra sig tillbaka.`,
          choices: [
            {
              id: 'apologize',
              label: 'Be om ursäkt och bjud på lunch',
              effect: { type: 'patronInfluence', amount: 0, value: 20 },
            },
            {
              id: 'ignore',
              label: 'Det är min klubb, inte hans',
              effect: { type: 'patronHappiness', amount: -50 },
            },
          ],
          resolved: false,
        })
      }
    }
  }

  return events
}
