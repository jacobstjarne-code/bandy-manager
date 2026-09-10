import type { SaveGame } from '../../entities/SaveGame'
import type { GameEvent } from '../../entities/GameEvent'
import { TacticMentality } from '../../enums'
import { PATRON_UNHAPPY_QUOTES, PATRON_HAPPY_QUOTES, PATRON_STYLE_COMPLAINTS, PATRON_PROFILES } from '../../data/patronData'
import { isVoiceIntroduced, patronVoiceId } from '../voiceIntroductionService'
import { calculateClubEra } from '../clubEraService'

/**
 * @cites patronGame.totalContributed, patronGame.contribution
 *
 * DOM_PASTAENDE_GENERERINGSKONTRAKT_2026-09-08 (pilot, patronEvents.ts):
 * varje event nedan bär nu `proofSource` (ProofSource.ts). Alla sju kort i
 * denna funktion är redan strukturellt gejtade av sin omslutande `if` —
 * annoteringen hoisar samma boolean till en named const som återanvänds i
 * BÅDE villkoret och `proofSource.evaluatedTrue`, så de inte kan glida isär.
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
    const patronIntroDue = !patronAlreadyIntroduced && currentRound >= 3
    if (patronIntroDue) {
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
          proofSource: {
            form: 'state-predicate',
            description: 'patron är aktiv och detta är dennes ännu ointroducerade första kort vid omgång ≥3',
            evaluatedTrue: patronIntroDue,
          },
          choices: [
            {
              id: 'welcome',
              label: 'Välkomna samarbetet',
              subtitle: 'gläder patronen · årligt bidrag fortsätter',
              effect: { type: 'patronHappiness', amount: 20 },
            },
            {
              id: 'cautious',
              label: 'Tack, men vi tar det lugnt',
              subtitle: 'gläder patronen · årligt bidrag fortsätter',
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
    const patronUnhappyDue = currentRound >= 5 && currentRound <= 10 && (patron.happiness ?? 50) < 60
    if (patronUnhappyDue) {
      const eid = `patron_unhappy_s${game.currentSeason}_r${currentRound}`
      if (!alreadyQueued.has(eid)) {
        const quoteIdx = Math.floor(rand() * PATRON_UNHAPPY_QUOTES.length)
        const quote = PATRON_UNHAPPY_QUOTES[quoteIdx]
        events.push({
          id: eid,
          type: 'patronEvent',
          title: `${patron.name} är missnöjd`,
          body: quote,
          proofSource: {
            form: 'state-predicate',
            description: 'happiness < 60 i omgångsfönstret 5–10',
            evaluatedTrue: patronUnhappyDue,
          },
          choices: [
            {
              id: 'promise',
              label: 'Visa förståelse',
              subtitle: 'gläder patronen',
              effect: { type: 'patronHappiness', amount: 15 },
            },
            {
              id: 'refuse',
              label: 'Jag tar egna beslut',
              subtitle: 'prövar patronens tålamod',
              effect: { type: 'patronHappiness', amount: -10 },
            },
          ],
          resolved: false,
        })
      }
    }

    // Patron about to withdraw — round >= 8, happiness < 30
    const patronWithdrawDue = currentRound >= 8 && (patron.happiness ?? 50) < 30
    if (patronWithdrawDue) {
      const eid = `patron_withdraw_s${game.currentSeason}_r${currentRound}`
      if (!alreadyQueued.has(eid)) {
        events.push({
          id: eid,
          type: 'patronEvent',
          title: `${patron.name} hotar dra sig ur`,
          body: 'Patronen överväger att avsluta sin sponsring. Ni kan försöka rädda relationen med ett möte — eller acceptera förlusten.',
          proofSource: {
            form: 'state-predicate',
            description: 'happiness < 30 vid omgång ≥8',
            evaluatedTrue: patronWithdrawDue,
          },
          choices: [
            {
              id: 'meet',
              label: 'Boka ett möte',
              subtitle: 'gläder patronen · bidraget behålls',
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
    const patronStyleDue =
      !!patron.wantsStyle &&
      managedClubTactic?.mentality !== TacticMentality.Offensive &&
      currentRound >= 11 && currentRound <= 13 &&
      (patron.happiness ?? 50) >= 30 && (patron.happiness ?? 50) <= 70
    if (patronStyleDue) {
      const eid = `patron_style_s${game.currentSeason}_r${currentRound}`
      if (!alreadyQueued.has(eid)) {
        const quoteIdx = Math.floor(rand() * PATRON_STYLE_COMPLAINTS.length)
        events.push({
          id: eid,
          type: 'patronEvent',
          title: `${patron.name} om spelstilen`,
          body: PATRON_STYLE_COMPLAINTS[quoteIdx],
          proofSource: {
            form: 'state-predicate',
            description: 'patron vill ha annan stil än lagets faktiska (icke-offensiva) taktik, omgång 11–13, happiness 30–70',
            evaluatedTrue: patronStyleDue,
          },
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
              subtitle: 'gläder patronen',
              effect: { type: 'patronHappiness', amount: 12 },
            },
            {
              id: 'diplomatic',
              label: 'Förklara taktiska skälen',
              subtitle: 'gläder patronen',
              effect: { type: 'patronHappiness', amount: 5 },
            },
            {
              id: 'refuse',
              label: 'Taktiken är min sak',
              subtitle: 'prövar patronens tålamod',
              effect: { type: 'patronHappiness', amount: -15 },
            },
          ],
          resolved: false,
        })
      }
    }

    // Patron bonus — once per season, round 10–14, happiness > 80
    const patronBonusDue = currentRound >= 10 && currentRound <= 14 && (patron.happiness ?? 50) > 80
    if (patronBonusDue) {
      const eid = `patron_bonus_${game.currentSeason}`
      if (!alreadyQueued.has(eid)) {
        const quoteIdx = Math.floor(rand() * PATRON_HAPPY_QUOTES.length)
        const quote = PATRON_HAPPY_QUOTES[quoteIdx]
        events.push({
          id: eid,
          type: 'patronEvent',
          title: `${patron.name} bjuder på bonus`,
          body: `${quote} Patronen skänker 20 000 kr i extra bidrag.`,
          proofSource: {
            form: 'state-predicate',
            description: 'happiness > 80 i omgångsfönstret 10–14',
            evaluatedTrue: patronBonusDue,
          },
          choices: [
            {
              id: 'thank',
              label: 'Tacka varmt',
              subtitle: 'gläder patronen · bidrag mottaget',
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
    const patronInfluenceRisingDue = influence >= 60 && influence < 80 && goodwill >= 20
    if (patronInfluenceRisingDue) {
      const eid = `patron_influence_60_${game.currentSeason}`
      if (!alreadyQueued.has(eid)) {
        events.push({
          id: eid,
          type: 'patronInfluence',
          title: `${patronGame.name} vill påverka beslut`,
          body: `${patronGame.name} har bidragit med ${(patronGame.totalContributed ?? patronGame.contribution).toLocaleString('sv-SE')} kr totalt och börjar känna att han borde ha mer att säga till om.`,
          proofSource: {
            form: 'state-predicate',
            description: 'influence 60–79 och goodwill ≥20; kr-beloppet läses direkt ur totalContributed (fallback contribution)',
            evaluatedTrue: patronInfluenceRisingDue,
          },
          choices: [
            {
              id: 'listen',
              label: 'Bjud in till styrelsemöte',
              subtitle: 'gläder patronen · patronens inflytande växer',
              effect: { type: 'multiEffect', subEffects: JSON.stringify([
                { type: 'patronHappiness', amount: 20 },
                { type: 'patronInfluence', amount: 10 },
              ]) },
            },
            {
              id: 'decline',
              label: 'Tacka men håll gränsen',
              subtitle: 'prövar patronens tålamod',
              effect: { type: 'patronHappiness', amount: -5 },
            },
          ],
          resolved: false,
        })
      }
    }

    // Patron ignored — goodwill < 20 and influence > 30
    const patronIgnoredDue = goodwill < 20 && influence > 30
    if (patronIgnoredDue) {
      const eid = `patron_ignored_${game.currentSeason}`
      if (!alreadyQueued.has(eid)) {
        events.push({
          id: eid,
          type: 'patronInfluence',
          title: `${patronGame.name} känner sig ignorerad`,
          body: `${patronGame.name} har investerat i klubben men märker att hans synpunkter aldrig tas på allvar. Han funderar på att dra sig tillbaka.`,
          proofSource: {
            form: 'state-predicate',
            description: 'goodwill < 20 och influence > 30',
            evaluatedTrue: patronIgnoredDue,
          },
          choices: [
            {
              id: 'apologize',
              label: 'Be om ursäkt och bjud på lunch',
              subtitle: 'gläder patronen',
              effect: { type: 'patronInfluence', amount: 0, value: 20 },
            },
            {
              id: 'ignore',
              label: 'Det är min klubb, inte hans',
              subtitle: 'prövar patronens tålamod rejält · patronen kan lämna',
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
  forbiddenNames: readonly string[] = [],
): GameEvent | null {
  // Only one emergence per season
  const emergeId = `patron_emerge_${game.currentSeason}`
  if (
    (game.pendingEvents ?? []).some(e => e.id === emergeId) ||
    (game.resolvedEventIds ?? []).includes(emergeId) ||
    game.inbox.some(item => item.id === emergeId)
  ) return null

  const blockedNames = new Set([
    ...(game.mecenater ?? []).map(mecenat => mecenat.name),
    ...forbiddenNames,
  ].map(name => name.trim().toLocaleLowerCase('sv-SE')))
  const availableProfiles = PATRON_PROFILES.filter(profile =>
    !blockedNames.has(`${profile.first} ${profile.last}`.toLocaleLowerCase('sv-SE')))
  const profilePool = availableProfiles.length > 0 ? availableProfiles : PATRON_PROFILES
  const profile = profilePool[Math.floor(rand() * profilePool.length)]
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

  // DOM_PASTAENDE_GENERERINGSKONTRAKT_2026-09-08: den faktiska "varför nu"-
  // grinden (era + godkänd säsongsrullning) ägs av eventProcessor.ts, den
  // enda anroparen i produktionsflödet — den avgör NÄR den här funktionen
  // ens kallas (cooldown + ingen redan-aktiv-patron ligger också där, ren
  // dedup, inte en sanningsclaim). patronEventTruth.test.ts kallar funktionen
  // direkt utan att sätta upp den gaten (avsiktligt — testar generatorn
  // isolerat), så detta LÄSER samma exporterade källor (ingen omdömd
  // tröskel, ingen duplicerad anropslogik) utan att kasta om de inte håller.
  // Offertbeloppet ({tkr}) är alltid grundat i faktisk reputation; "varför
  // nu"-predikatet redovisas ärligt, gejtar inte pushen här.
  const patronEmergeWhyNow = calculateClubEra(game) !== 'survival'

  return {
    id: emergeId,
    type: 'patronEvent' as const,
    title: `${patronData.name} kliver fram`,
    sender: { name: patronData.name, role: patronData.business },
    voiceId,
    introducesVoiceId: voiceId,
    body: `${patronData.backstory ?? 'En stillsam figur i bygden har följt klubbens resa.'}\n\n"Jag har sett vad ni byggt. Jag vill stötta er vidare — ${tkr} tkr/säsong."`,
    proofSource: {
      form: 'state-predicate',
      description: 'klubbens era har lämnat survival; eventProcessor.ts gejtar dessutom på den enda seedade CS-rullningen för säsongen',
      evaluatedTrue: patronEmergeWhyNow,
    },
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
