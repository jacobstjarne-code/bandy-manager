import type { SaveGame } from '../../entities/SaveGame'
import type { GameEvent, EventChoice, EventEffect } from '../../entities/GameEvent'
import { PATRON_UNHAPPY_QUOTES, PATRON_HAPPY_QUOTES, PATRON_STYLE_COMPLAINTS } from '../../data/patronData'
import { AGENDA_QUOTES, NEWSPAPER_HEADLINES } from '../../data/politicianData'
import { HALL_DEBATE_EVENTS } from '../../data/hallDebateData'

// ── generateEvents ─────────────────────────────────────────────────────────
export function generateEvents(
  game: SaveGame,
  currentRound: number,
  rand: () => number,
): GameEvent[] {
  const events: GameEvent[] = []
  const alreadyQueued = new Set([
    ...(game.pendingEvents ?? []).map(e => e.id),
    ...(game.resolvedEventIds ?? []),
  ])
  const ca = game.communityActivities

  // ── Community events ────────────────────────────────────────────────────

  // Kiosk start — round 1, kiosk === 'none'
  if (currentRound === 1 && (ca?.kiosk ?? 'none') === 'none') {
    const eid = 'community_kiosk_start'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Kioskfrågan',
        body: 'Föreningen saknar ordentlig kioskverksamhet. Vill ni starta en enkel kiosk? Det kostar 3 000 kr men ger löpande intäkter.',
        choices: [
          {
            id: 'start',
            label: 'Starta enkel kiosk (−3 000 kr)',
            effect: { type: 'setCommunity', amount: -3000, communityKey: 'kiosk', communityValue: 'basic' },
          },
          {
            id: 'skip',
            label: 'Skippa det',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // Kiosk upgrade — round 8, kiosk === 'basic'
  if (currentRound === 8 && ca?.kiosk === 'basic') {
    const eid = 'community_kiosk_upgrade'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Uppgradera kiosken',
        body: 'Kiosken går bra. Ni kan investera i bättre utrustning för 8 000 kr och fördubbla intäkterna.',
        choices: [
          {
            id: 'invest',
            label: 'Investera (−8 000 kr)',
            effect: { type: 'setCommunity', amount: -8000, communityKey: 'kiosk', communityValue: 'upgraded' },
          },
          {
            id: 'keep',
            label: 'Behåll som det är',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // Lottery start — round 3, lottery === 'none'
  if (currentRound === 3 && (ca?.lottery ?? 'none') === 'none') {
    const eid = 'community_lottery_start'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Föreningslotten',
        body: 'Kassören föreslår att sälja föreningslotter. Billig att komma igång, ger lite extra varje omgång.',
        choices: [
          {
            id: 'start',
            label: 'Sätt igång (−1 000 kr)',
            effect: { type: 'setCommunity', amount: -1000, communityKey: 'lottery', communityValue: 'basic' },
          },
          {
            id: 'skip',
            label: 'Inte nu',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // Lottery intensive — round 12, lottery === 'basic'
  if (currentRound === 12 && ca?.lottery === 'basic') {
    const eid = 'community_lottery_intensive'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Intensifiera lottförsäljningen',
        body: 'Med en kampanj kan ni sälja mer lotter och öka intäkterna markant — men det kräver mer volontärtid.',
        choices: [
          {
            id: 'push',
            label: 'Kör hårdare (−2 000 kr)',
            effect: { type: 'setCommunity', amount: -2000, communityKey: 'lottery', communityValue: 'intensive' },
          },
          {
            id: 'keep',
            label: 'Behåll lagom nivå',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // Julmarknad — round 7, one-time
  if (currentRound === 7 && !ca?.julmarknad) {
    const eid = 'community_julmarknad'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Julmarknad på planen',
        body: `${game.localPaperName ?? 'Lokaltidningen'} föreslår en julmarknad på planen. Kostar 4 000 men ger 12 000 i intäkter och gott rykte.`,
        choices: [
          {
            id: 'arrange',
            label: 'Arrangera julmarknad',
            effect: { type: 'setCommunity', amount: 8000, communityKey: 'julmarknad', communityValue: 'true' },
          },
          {
            id: 'skip',
            label: 'Inte i år',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // Loppis — round 4, 40% chance, one-time
  if (currentRound === 4 && rand() < 0.4) {
    const eid = 'community_loppis'
    if (!alreadyQueued.has(eid)) {
      const loppisAmount = Math.floor(5000 + rand() * 3000)
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Loppis till förmån för laget',
        body: 'Föräldrarna till juniorspelarna vill arrangera en loppis. Kräver en dag men ger 5 000–8 000 kr.',
        choices: [
          {
            id: 'support',
            label: 'Stötta initiativet',
            effect: { type: 'income', amount: loppisAmount },
          },
          {
            id: 'decline',
            label: 'Tack men nej',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // Bandyskola — round 2, one-time
  if (currentRound === 2 && !ca?.bandyplay) {
    const eid = 'community_bandyplay'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Bandyskola för barn',
        body: 'Kommunen erbjuder bidrag om ni startar en bandyskola för barn 8–12 år. Ger 6 000/säsong och rekryterar framtida spelare.',
        choices: [
          {
            id: 'start',
            label: 'Starta bandyskolan',
            effect: { type: 'setCommunity', amount: 6000, communityKey: 'bandyplay', communityValue: 'true' },
          },
          {
            id: 'pass',
            label: 'Inte kapacitet just nu',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // Ismaskin — round 10, 40% chance, one-time
  if (currentRound === 10 && rand() < 0.4) {
    const eid = 'community_ismaskin'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Isberedningsmaskin på gång',
        body: 'Isberedningsmaskinens motor börjar krångla. Reparation kostar 15 000 kr. Skjuter ni upp det riskerar ni sämre is.',
        choices: [
          {
            id: 'repair',
            label: 'Reparera nu (−15 000 kr)',
            effect: { type: 'tempFacilities', amount: 1 },
          },
          {
            id: 'postpone',
            label: 'Skjut upp det',
            effect: { type: 'tempFacilities', amount: -1 },
          },
        ],
        resolved: false,
      })
    }
  }

  // Funktionärsdag — round 5, one-time
  if (currentRound === 5 && !ca?.functionaries) {
    const eid = 'community_funktionarsdag'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Rekrytera funktionärer',
        body: 'Föreningen behöver fler funktionärer. En rekryteringsdag kostar 2 000 men ger 15 nya frivilliga och sänker personalkostnader.',
        choices: [
          {
            id: 'arrange',
            label: 'Arrangera rekryteringsdag (−2 000 kr)',
            effect: { type: 'setCommunity', amount: -2000, communityKey: 'functionaries', communityValue: 'true' },
          },
          {
            id: 'skip',
            label: 'Vi klarar oss',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // Fikakväll — round 9, 50% chance, one-time
  if (currentRound === 9 && rand() < 0.5) {
    const eid = 'community_fikakväll'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Fikakväll för supportrarna',
        body: 'Arrangera en fikakväll med spelarna. Billigt (500 kr) men höjer fanMood med 8 poäng.',
        choices: [
          {
            id: 'fika',
            label: 'Klart vi fixar fika',
            effect: { type: 'fanMood', amount: 8 },
          },
          {
            id: 'skip',
            label: 'Inte just nu',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // Bilbingo — round 14, 35% chance, one-time
  if (currentRound === 14 && rand() < 0.35) {
    const eid = 'community_bilbingo'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Bilbingo!',
        body: 'Idén om en bilbingo dök upp på styrelsemötet. Kräver lite jobb men kan ge 20 000 kr om det går bra.',
        choices: [
          {
            id: 'go',
            label: 'Vi kör bilbingo',
            effect: { type: 'income', amount: 20000 },
          },
          {
            id: 'pass',
            label: 'För krångligt',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // Anläggningsrenovering — round 16, 30% chance, one-time
  if (currentRound === 16 && rand() < 0.3) {
    const eid = 'community_anlaggning'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Anläggningsrenovering',
        body: 'Omklädningsrummen behöver renoveras. Kostar 25 000 men ger +5 reputation och håller spelarna nöjdare.',
        choices: [
          {
            id: 'renovate',
            label: 'Renovera (−25 000 kr)',
            effect: { type: 'reputation', amount: 5 },
          },
          {
            id: 'wait',
            label: 'Får vänta',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // ── Patron events ───────────────────────────────────────────────────────
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
              label: `Lova att spela mer ${patron.wantsStyle}`,
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

  // ── Politician events ───────────────────────────────────────────────────
  const politician = game.localPolitician
  if (politician) {
    const agenda = politician.agenda
    const rel = politician.relationship ?? 50

    // Youth push — round 4, agenda === 'youth', relationship > 30
    if (currentRound === 4 && agenda === 'youth' && rel > 30) {
      const eid = 'politician_youth'
      if (!alreadyQueued.has(eid)) {
        const quotes = AGENDA_QUOTES.youth
        const quote = quotes[Math.floor(rand() * quotes.length)]
        events.push({
          id: eid,
          type: 'politicianEvent',
          title: `${politician.name}: Satsa på ungdomen`,
          body: quote,
          choices: [
            {
              id: 'promise',
              label: 'Lova prioritera juniorverksamhet',
              effect: { type: 'politicianRelationship', amount: 15 },
            },
            {
              id: 'decline',
              label: 'Vi fokuserar på a-laget',
              effect: { type: 'politicianRelationship', amount: -5 },
            },
          ],
          resolved: false,
        })
      }
    }

    // Savings — round 6, agenda === 'savings'
    if (currentRound === 6 && agenda === 'savings') {
      const eid = 'politician_savings'
      if (!alreadyQueued.has(eid)) {
        const quotes = AGENDA_QUOTES.savings
        const quote = quotes[Math.floor(rand() * quotes.length)]
        events.push({
          id: eid,
          type: 'politicianEvent',
          title: `${politician.name}: Kommunen ser över bidragen`,
          body: quote,
          choices: [
            {
              id: 'comply',
              label: 'Presentera budget och sparlöften',
              effect: { type: 'politicianRelationship', amount: 10 },
            },
            {
              id: 'pushback',
              label: 'Ifrågasätt nedskärningarna',
              effect: { type: 'kommunBidragChange', amount: -3000 },
            },
          ],
          resolved: false,
        })
      }
    }

    // Prestige — round 8, agenda === 'prestige'
    if (currentRound === 8 && agenda === 'prestige') {
      const eid = 'politician_prestige'
      if (!alreadyQueued.has(eid)) {
        const quotes = AGENDA_QUOTES.prestige
        const quote = quotes[Math.floor(rand() * quotes.length)]
        events.push({
          id: eid,
          type: 'politicianEvent',
          title: 'Kommunen vill synas med laget',
          body: quote,
          choices: [
            {
              id: 'welcome',
              label: 'Välkomna kommunens engagemang',
              effect: { type: 'kommunBidragChange', amount: 8000 },
            },
            {
              id: 'independent',
              label: 'Behåll föreningens självständighet',
              effect: { type: 'politicianRelationship', amount: -8 },
            },
          ],
          resolved: false,
        })
      }
    }

    // Inclusion — round 5, agenda === 'inclusion'
    if (currentRound === 5 && agenda === 'inclusion') {
      const eid = 'politician_inclusion'
      if (!alreadyQueued.has(eid)) {
        const quotes = AGENDA_QUOTES.inclusion
        const quote = quotes[Math.floor(rand() * quotes.length)]
        events.push({
          id: eid,
          type: 'politicianEvent',
          title: `${politician.name}: Bandy för alla`,
          body: quote,
          choices: [
            {
              id: 'start_program',
              label: 'Starta inkluderingsprogram',
              effect: { type: 'kommunBidragChange', amount: 6000 },
            },
            {
              id: 'already_open',
              label: 'Vi är redan öppna för alla',
              effect: { type: 'politicianRelationship', amount: -5 },
            },
          ],
          resolved: false,
        })
      }
    }

    // Low relationship warning — round >= 10, relationship < 30
    if (currentRound >= 10 && rel < 30) {
      const eid = `politician_warning_r${currentRound}`
      if (!alreadyQueued.has(eid)) {
        const headlineIdx = Math.floor(rand() * NEWSPAPER_HEADLINES.length)
        const headline = NEWSPAPER_HEADLINES[headlineIdx]
        events.push({
          id: eid,
          type: 'politicianEvent',
          title: 'Kommunbidragen ifrågasätts',
          body: headline,
          choices: [
            {
              id: 'invite',
              label: 'Bjud in politikern till en match',
              effect: { type: 'politicianRelationship', amount: 20 },
            },
            {
              id: 'low_profile',
              label: 'Håll låg profil',
              effect: { type: 'noOp' },
            },
          ],
          resolved: false,
        })
      }
    }
  }

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
            effect: { type: 'multiEffect', subEffects: JSON.stringify([
              { type: 'income', amount: 5000 },
              { type: 'communityStanding', amount: 2 },
            ]) },
          },
          {
            id: 'decline',
            label: 'Avböj — laget behöver all träning',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
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

  // ── Kommunmöte — politician demand event (once per politician) ───────────
  const politician2 = game.localPolitician
  if (politician2 && !politician2.demandsMet) {
    const eid = `kommot_demand_${politician2.mandatExpires ?? game.currentSeason}_${game.currentSeason}`
    if (!alreadyQueued.has(eid) && currentRound === 3) {
      const agenda = politician2.agenda
      let demandBody = ''
      let choices: typeof events[0]['choices'] = []

      if (agenda === 'savings') {
        demandBody = `${politician2.name} ringer och vill diskutera kommunens bidrag. Han oroar sig för föreningens ekonomi.`
        choices = [
          { id: 'confirm', label: 'Lova inga löneökningar nästa år', effect: { type: 'politicianRelationship', amount: 10 } },
          { id: 'pushback', label: 'Vi investerar för framtiden', effect: { type: 'politicianRelationship', amount: -5 } },
        ]
      } else if (agenda === 'youth') {
        const hasSchool = game.communityActivities?.bandySchool
        demandBody = `${politician2.name} vill att föreningen satsar mer på ungdomar. ${hasSchool ? 'Han ser positivt på bandyskolan.' : 'Han vill se en bandyskola.'}`
        choices = [
          { id: 'confirm', label: hasSchool ? 'Vi är stolta över bandyskolan' : 'Vi planerar en bandyskola', effect: { type: 'politicianRelationship', amount: hasSchool ? 15 : -5 } },
          { id: 'focus', label: 'A-laget är vår prioritet', effect: { type: 'politicianRelationship', amount: -8 } },
        ]
      } else if (agenda === 'prestige') {
        demandBody = `${politician2.name} vill att kommunen syns med laget. Han ser er som ett varumärke för regionen.`
        choices = [
          { id: 'welcome', label: 'Välkomna samarbetet', effect: { type: 'politicianRelationship', amount: 12 } },
          { id: 'independent', label: 'Föreningen är fristående', effect: { type: 'politicianRelationship', amount: -5 } },
        ]
      } else if (agenda === 'inclusion') {
        demandBody = `${politician2.name} vill att föreningen öppnar upp för fler grupper i samhället.`
        choices = [
          { id: 'program', label: 'Starta ett inkluderingsprogram', effect: { type: 'communityStanding', amount: 5 } },
          { id: 'already', label: 'Vi är redan öppna för alla', effect: { type: 'politicianRelationship', amount: -3 } },
        ]
      } else if (agenda === 'infrastructure') {
        demandBody = `${politician2.name} vill säkerställa att era anläggningar håller hög standard.`
        choices = [
          { id: 'confirm', label: 'Vi investerar i anläggningarna', effect: { type: 'politicianRelationship', amount: 10 } },
          { id: 'later', label: 'Det får vänta', effect: { type: 'politicianRelationship', amount: -5 } },
        ]
      }

      if (demandBody && choices.length > 0) {
        events.push({
          id: eid,
          type: 'kommunMote',
          title: `Kommunmöte — ${politician2.name}`,
          body: demandBody,
          choices,
          resolved: false,
        })
      }
    }
  }

  // ── Gentjänst event (new politician, corruption >= 50, 40% chance) ───────
  const pol3 = game.localPolitician
  if (pol3 && (pol3.corruption ?? 0) >= 50 && currentRound === 2) {
    const eid = `gentjanst_${pol3.mandatExpires ?? game.currentSeason}_${game.currentSeason}`
    if (!alreadyQueued.has(eid) && rand() < 0.4) {
      events.push({
        id: eid,
        type: 'gentjanst',
        title: 'En gentjänst',
        body: `${pol3.name} hör av sig diskret. Hans brorson är ett ungt talang och undrar om han kan komma och träna med truppen. "Inget officiellt, bara kolla läget."`,
        choices: [
          {
            id: 'yes',
            label: 'Klart han är välkommen',
            effect: { type: 'politicianRelationship', amount: 20 },
          },
          {
            id: 'community',
            label: 'Bara i ungdomsverksamheten',
            effect: { type: 'politicianRelationship', amount: 5 },
          },
          {
            id: 'no',
            label: 'Vi rekryterar efter merit — inga undantag',
            effect: { type: 'multiEffect', subEffects: JSON.stringify([
              { type: 'politicianRelationship', amount: -10 },
              { type: 'boardPatience', amount: 3 },
            ]) },
          },
        ],
        resolved: false,
      })
    }
  }

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
        break // only one hall debate event per call to generateEvents
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
