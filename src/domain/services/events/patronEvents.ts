import type { SaveGame } from '../../entities/SaveGame'
import type { GameEvent } from '../../entities/GameEvent'
import { TacticMentality } from '../../enums'
import { PATRON_UNHAPPY_QUOTES, PATRON_HAPPY_QUOTES, PATRON_STYLE_COMPLAINTS, PATRON_PROFILES } from '../../data/patronData'
import { isVoiceIntroduced, patronVoiceId } from '../voiceIntroductionService'

/**
 * @cites patronGame.totalContributed, patronGame.contribution
 */
export function generatePatronEvents(
  game: SaveGame,
  currentRound: number,
  alreadyQueued: Set<string>,
  rand: () => number,
): GameEvent[] {
  const events: GameEvent[] = []
  const patron = game.patron

  if (patron?.isActive) {
    const voiceId = patronVoiceId(game.managedClubId, patron.id)
    const patronAlreadyIntroduced = patron.introducedSeason !== undefined
      || isVoiceIntroduced(game, voiceId)

    // Patron intro — normally round 3. If an established runtime path reaches
    // a later round without the intro, recreate the missing card instead of
    // leaving every subsequent patron event permanently deferred.
    if (!patronAlreadyIntroduced && currentRound >= 3) {
      const eid = `patron_intro_${game.currentSeason}`
      // En patron som nyss accepterats via patron_emerge har redan fått sin
      // introduktion. Utan den här grinden kom samma person tillbaka två
      // omgångar senare och presenterade samma samarbete en gång till.
      const emergedThisSeason = alreadyQueued.has(`patron_emerge_${game.currentSeason}`)
      if (!alreadyQueued.has(eid) && !emergedThisSeason) {
        events.push({
          id: eid,
          type: 'patronEvent',
          title: `💼 ${patron.name} visar intresse`,
          sender: { name: patron.name, role: `ägare, ${patron.business}` },
          body: `${patron.name} från ${patron.business} har hört om er förening och vill diskutera ett samarbete.\n\n"Jag har alltid brunnit för bandy. Ni gör ett fantastiskt jobb — jag vill hjälpa till."`,
          choices: [
            {
              id: 'welcome',
              label: 'Välkomna samarbetet',
              subtitle: '🤝 +20 relation · 💰 årligt bidrag fortsätter',
              effect: { type: 'patronHappiness', amount: 20 },
            },
            {
              id: 'cautious',
              label: 'Tack, men vi tar det lugnt',
              subtitle: '🤝 +5 relation · 💰 årligt bidrag fortsätter',
              effect: { type: 'patronHappiness', amount: 5 },
            },
          ],
          resolved: false,
          voiceId,
          introducesVoiceId: voiceId,
        })
      }
    }

    // Patron unhappy — round 5–10, happiness < 60
    if (currentRound >= 5 && currentRound <= 10 && (patron.happiness ?? 50) < 60) {
      const eid = `patron_unhappy_s${game.currentSeason}_r${currentRound}`
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
              label: 'Visa förståelse',
              subtitle: '🤝 +15 relation',
              effect: { type: 'patronHappiness', amount: 15 },
            },
            {
              id: 'refuse',
              label: 'Jag tar egna beslut',
              subtitle: '🤝 -10 relation',
              effect: { type: 'patronHappiness', amount: -10 },
            },
          ],
          resolved: false,
        })
      }
    }

    // Patron about to withdraw — round >= 8, happiness < 30
    if (currentRound >= 8 && (patron.happiness ?? 50) < 30) {
      const eid = `patron_withdraw_s${game.currentSeason}_r${currentRound}`
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
              subtitle: '🤝 +30 relation · bidraget behålls',
              effect: { type: 'patronHappiness', amount: 30 },
            },
            {
              id: 'accept',
              label: 'Acceptera att han lämnar',
              subtitle: '💰 förlorar bidrag',
              effect: { type: 'patronHappiness', amount: -50 },
            },
          ],
          resolved: false,
        })
      }
    }

    // Patron style complaint — round 11–13, wantsStyle set, happiness 30–70
    // M28 (textaudit 2026-07-03): PATRON_STYLE_COMPLAINTS klagar uteslutande
    // på för defensivt spel ("Vi spelar för defensivt", "Jag saknar
    // anfallsbandyn") — orimligt om laget redan spelar offensivt. Gatead på
    // att den faktiska taktiken inte redan är offensiv.
    const managedClubTactic = game.clubs.find(c => c.id === game.managedClubId)?.activeTactic
    if (
      patron.wantsStyle &&
      managedClubTactic?.mentality !== TacticMentality.Offensive &&
      currentRound >= 11 && currentRound <= 13 &&
      (patron.happiness ?? 50) >= 30 && (patron.happiness ?? 50) <= 70
    ) {
      const eid = `patron_style_s${game.currentSeason}_r${currentRound}`
      if (!alreadyQueued.has(eid)) {
        const quoteIdx = Math.floor(rand() * PATRON_STYLE_COMPLAINTS.length)
        events.push({
          id: eid,
          type: 'patronEvent',
          title: `${patron.name} om spelstilen`,
          body: PATRON_STYLE_COMPLAINTS[quoteIdx],
          choices: [
            {
              id: 'agree',
              label: `Håll med om mer ${
                patron.wantsStyle === 'attacking' ? 'anfallsspel'
                : patron.wantsStyle === 'defensive' ? 'defensivt'
                : patron.wantsStyle === 'physical' ? 'fysiskt'
                : patron.wantsStyle === 'technical' ? 'tekniskt'
                : patron.wantsStyle
              }`,
              subtitle: '🤝 +12 relation',
              effect: { type: 'patronHappiness', amount: 12 },
            },
            {
              id: 'diplomatic',
              label: 'Förklara taktiska skälen',
              subtitle: '🤝 +5 relation',
              effect: { type: 'patronHappiness', amount: 5 },
            },
            {
              id: 'refuse',
              label: 'Taktiken är min sak',
              subtitle: '🤝 -15 relation',
              effect: { type: 'patronHappiness', amount: -15 },
            },
          ],
          resolved: false,
        })
      }
    }

    // Patron bonus — once per season, round 10–14, happiness > 80
    if (currentRound >= 10 && currentRound <= 14 && (patron.happiness ?? 50) > 80) {
      const eid = `patron_bonus_${game.currentSeason}`
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
              subtitle: '🤝 +10 relation · 💰 bidrag mottaget',
              effect: {
                type: 'multiEffect',
                subEffects: JSON.stringify([
                  { type: 'income', amount: 20000 },
                  { type: 'patronHappiness', amount: 10 },
                ]),
              },
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
    const goodwill = patronGame.goodwill ?? 80

    // Influence crosses 60 — wants to affect decisions
    if (influence >= 60 && influence < 80 && goodwill >= 20) {
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
              subtitle: '🤝 +20 relation · ⚠️ +10 inflytande',
              effect: { type: 'multiEffect', subEffects: JSON.stringify([
                { type: 'patronHappiness', amount: 20 },
                { type: 'patronInfluence', amount: 10 },
              ]) },
            },
            {
              id: 'decline',
              label: 'Tacka men håll gränsen',
              subtitle: '🤝 -5 relation',
              effect: { type: 'patronHappiness', amount: -5 },
            },
          ],
          resolved: false,
        })
      }
    }

    // Patron ignored — goodwill < 20 and influence > 30
    if (goodwill < 20 && influence > 30) {
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
              subtitle: '🕰️ +20 tålamod',
              effect: { type: 'patronInfluence', amount: 0, value: 20 },
            },
            {
              id: 'ignore',
              label: 'Det är min klubb, inte hans',
              subtitle: '🤝 -50 relation · ⚠️ patronen kan lämna',
              effect: { type: 'patronHappiness', amount: -50 },
            },
          ],
          resolved: false,
        })
      }
    }
  }

  if (!patron) return events
  const voiceId = patronVoiceId(game.managedClubId, patron.id)
  return events.map(event => ({
    ...event,
    voiceId,
    ...(event.id.startsWith('patron_intro_') ? { introducesVoiceId: voiceId } : {}),
  }))
}

export function generatePatronEmergenceEvent(
  game: SaveGame,
  rand: () => number,
): GameEvent | null {
  // Only one emergence per season
  const emergeId = `patron_emerge_${game.currentSeason}`
  if (
    (game.pendingEvents ?? []).some(e => e.id === emergeId) ||
    (game.resolvedEventIds ?? []).includes(emergeId) ||
    game.inbox.some(item => item.id === emergeId)
  ) return null

  const profile = PATRON_PROFILES[Math.floor(rand() * PATRON_PROFILES.length)]
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  const reputation = managedClub?.reputation ?? 50
  const influence = 40 + Math.floor(rand() * 50)
  const contribution = Math.round(
    (influence * 500 + reputation * 300 + rand() * 30000) / 1000
  ) * 1000
  const wantsStyle: string | undefined = rand() < 0.5
    ? (rand() < 0.5 ? 'attacking' : 'physical')
    : undefined

  const patronData = {
    name: `${profile.first} ${profile.last}`,
    business: profile.biz,
    influence,
    contribution,
    wantsStyle: wantsStyle ?? null,
    backstory: profile.backstory ?? null,
  }

  const tkr = Math.round(contribution / 1000)
  const patronId = `patron_${String(patronData.name).split(' ')[0].toLowerCase()}_${game.currentSeason}`
  const voiceId = patronVoiceId(game.managedClubId, patronId)

  return {
    id: emergeId,
    type: 'patronEvent' as const,
    title: `${patronData.name} kliver fram`,
    sender: { name: patronData.name, role: patronData.business },
    voiceId,
    introducesVoiceId: voiceId,
    body: `${patronData.backstory ?? 'En stillsam figur i bygden har följt klubbens resa.'}\n\n"Jag har sett vad ni byggt. Jag vill stötta er vidare — ${tkr} tkr/säsong."`,
    choices: [
      {
        id: 'welcome',
        label: 'Välkommen',
        subtitle: `💰 +${tkr} tkr/säsong · Relation startar`,
        effect: { type: 'spawnPatron' as const, patronData: JSON.stringify(patronData), amount: 20 },
      },
      {
        id: 'cautious',
        label: 'Vi tar det försiktigt',
        subtitle: 'Relation startar försiktigt',
        effect: { type: 'spawnPatron' as const, patronData: JSON.stringify(patronData), amount: 5 },
      },
      {
        id: 'decline',
        label: 'Inte nu',
        subtitle: 'Patronen väntar',
        effect: { type: 'noOp' as const },
      },
    ],
    resolved: false,
  }
}
