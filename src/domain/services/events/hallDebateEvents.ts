import type { SaveGame } from '../../entities/SaveGame'
import type { GameEvent, EventChoice, EventEffect } from '../../entities/GameEvent'
import { HALL_DEBATE_EVENTS } from '../../data/hallDebateData'

export function generateHallDebateEvents(
  game: SaveGame,
  currentRound: number,
  alreadyQueued: Set<string>,
  rand: () => number,
): GameEvent[] {
  const events: GameEvent[] = []

  // ── Hall debate events ──────────────────────────────────────────────────
  const hasIndoorRival = game.clubs.some(
    c => c.id !== game.managedClubId && c.hasIndoorArena === true
  )
  const hallDebateCount = game.hallDebateCount ?? 0
  const lastHallDebateRound = game.lastHallDebateRound ?? 0

  if (hasIndoorRival && hallDebateCount < 3) {
    const debatesByRound: Array<{ round: number; key: keyof typeof HALL_DEBATE_EVENTS; id: string }> = [
      { round: 3, key: 'kommunenFrågar', id: 'hall_kommunen_fragar' },
      { round: 9, key: 'styrelseSplittrad', id: 'hall_styrelse_splittrad' },
      { round: 15, key: 'spelarePerspektiv', id: 'hall_spelare_perspektiv' },
    ]

    for (const entry of debatesByRound) {
      if (
        currentRound === entry.round &&
        !alreadyQueued.has(entry.id) &&
        (currentRound - lastHallDebateRound) >= 3
      ) {
        const debateData = HALL_DEBATE_EVENTS[entry.key]
        const bodyIdx = Math.floor(rand() * debateData.bodyVariants.length)
        const body = debateData.bodyVariants[bodyIdx]

        // Map string effects from data to proper EventEffect objects
        const choices: EventChoice[] = debateData.choices.map(c => {
          const effectsStr = c.effects ?? ''
          let effect: EventEffect = { type: 'noOp' }

          if (effectsStr.includes('politicianRelationship')) {
            const match = effectsStr.match(/politicianRelationship ([+-]\d+)/)
            if (match) {
              effect = { type: 'politicianRelationship', amount: parseInt(match[1], 10) }
            }
          } else if (effectsStr.includes('facilitiesUpgrade')) {
            effect = { type: 'facilitiesUpgrade', amount: 1 }
          } else if (effectsStr.includes('fanMood')) {
            const match = effectsStr.match(/fanMood ([+-]\d+)/)
            if (match) {
              effect = { type: 'fanMood', amount: parseInt(match[1], 10) }
            }
          } else if (effectsStr.includes('finances')) {
            const match = effectsStr.match(/finances ([+-]\d+)/)
            if (match) {
              effect = { type: 'income', amount: parseInt(match[1], 10) }
            }
          }

          return {
            id: c.id,
            label: c.label,
            effect,
          }
        })

        events.push({
          id: entry.id,
          type: 'hallDebate',
          title: debateData.title,
          body,
          choices,
          resolved: false,
        })
        break // only one hall debate event per call to generateHallDebateEvents
      }
    }
  }

  // Annandagsbandyn — utlöses omgång 7 eller 8, en gång per säsong
  const annandagsId = `annandagen_${game.currentSeason}`
  if ((currentRound === 7 || currentRound === 8) && !alreadyQueued.has(annandagsId)) {
    const nextFixture = game.fixtures
      .filter(f => !f.isCup && f.status === 'scheduled' &&
        (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
      .sort((a, b) => a.roundNumber - b.roundNumber)[0]
    const opponentId = nextFixture
      ? (nextFixture.homeClubId === game.managedClubId ? nextFixture.awayClubId : nextFixture.homeClubId)
      : null
    const opponent = opponentId ? game.clubs.find(c => c.id === opponentId) : null

    events.push({
      id: annandagsId,
      type: 'communityEvent',
      title: '🏒 Annandagsbandyn',
      body: `Annandagsbandyn är årets mest välbesökta match. Traditionsenlig kamp med hela orten på läktaren${opponent ? ` mot ${opponent.name}` : ''}. Hur vill du ta emot publiken?`,
      choices: [
        {
          id: 'open_gates',
          label: 'Öppna grindarna — fri entré för barn under 15',
          effect: { type: 'multiEffect', subEffects: JSON.stringify([
            { type: 'communityStanding', amount: 8 },
            { type: 'fanMood', amount: 6 },
          ]) },
        },
        {
          id: 'standard',
          label: 'Vanlig biljettförsäljning — maximera intäkterna',
          effect: { type: 'income', amount: 12000 },
        },
        {
          id: 'sponsor_event',
          label: 'Gör det till ett sponsorevent — bjud in lokala företag',
          effect: { type: 'multiEffect', subEffects: JSON.stringify([
            { type: 'income', amount: 8000 },
            { type: 'communityStanding', amount: 4 },
          ]) },
        },
      ],
      resolved: false,
    })
  }

  return events
}
