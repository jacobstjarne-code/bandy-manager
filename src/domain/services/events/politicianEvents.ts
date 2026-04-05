import type { SaveGame } from '../../entities/SaveGame'
import type { GameEvent } from '../../entities/GameEvent'
import { AGENDA_QUOTES, NEWSPAPER_HEADLINES } from '../../data/politicianData'

const FEMALE_FIRST_NAMES = new Set([
  'Anna', 'Maria', 'Eva', 'Karin', 'Sara', 'Lena', 'Emma', 'Kristina',
  'Birgitta', 'Margareta', 'Ingrid', 'Elisabeth', 'Linda', 'Annika',
  'Malin', 'Elin', 'Sofia', 'Johanna', 'Katarina', 'Helena', 'Susanne',
  'Monica', 'Gunilla', 'Carina', 'Åsa', 'Marie', 'Ulrika', 'Jenny',
  'Camilla', 'Hanna', 'Cecilia', 'Louise', 'Therese', 'Sandra',
])

function getPronouns(name: string) {
  const first = name.split(' ')[0]
  const isFemale = FEMALE_FIRST_NAMES.has(first)
  return { subj: isFemale ? 'Hon' : 'Han', poss: isFemale ? 'Hennes' : 'Hans' }
}

export function generatePoliticianEvents(
  game: SaveGame,
  currentRound: number,
  alreadyQueued: Set<string>,
  rand: () => number,
): GameEvent[] {
  const events: GameEvent[] = []

  // ── Politician agenda events ─────────────────────────────────────────────
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
        events.push({
          id: eid,
          type: 'politicianEvent',
          title: `🏟️ Förslag från kommunen`,
          sender: { name: politician.name, role: `${politician.title}, kommunen` },
          body: `${politician.name} har fått bidrag från Allmänna arvsfonden och kontaktar dig.\n\n"Vi har pengar för integration genom idrott. Ni har plats, ungdomar och en förening som folk litar på. Kan ni ta emot en grupp på 10–15 ungdomar två kvällar i veckan?"`,
          choices: [
            {
              id: 'start_program',
              label: 'Starta programmet',
              subtitle: '💛 +5 fanMood · ⭐ +3 communityStanding · 💰 +6 000 kr/sä kommunbidrag',
              effect: { type: 'multiEffect', subEffects: JSON.stringify([
                { type: 'kommunBidragChange', amount: 6000 },
                { type: 'fanMood', amount: 5 },
                { type: 'communityStanding', amount: 3 },
              ]) },
            },
            {
              id: 'counter',
              label: 'Föreslå ungdomsgrupp istället — kommunen driver',
              subtitle: '⭐ +1 communityStanding · ingen kostnad',
              effect: { type: 'communityStanding', amount: 1 },
            },
            {
              id: 'already_open',
              label: 'Tacka nej — vi har inte kapacitet',
              subtitle: `🤝 -5 relation med ${politician.name}`,
              effect: { type: 'politicianRelationship', amount: -5 },
            },
          ],
          resolved: false,
          followUpText: `Inkluderingsprogrammet har kommit igång. ${politician.name} tackar för samarbetet.`,
        })
      }
    }

    // Low relationship warning — round >= 10, relationship < 30
    if (currentRound >= 10 && rel < 30) {
      const eid = `politician_warning_r${currentRound}`
      if (!alreadyQueued.has(eid)) {
        const headlineIdx = Math.floor(rand() * NEWSPAPER_HEADLINES.length)
        const papers = ['Lokaltidningen', 'Sportbladet', 'Bandypuls']
        const paper = papers[Math.floor(rand() * papers.length)]
        const managedClub = game.clubs.find(c => c.id === game.managedClubId)
        const clubName = managedClub?.name ?? 'Klubben'
        const bidrag = politician.kommunBidrag?.toLocaleString('sv-SE') ?? '30 000'
        let headline = NEWSPAPER_HEADLINES[headlineIdx]
        headline = headline
          .replace(/\{politician\}/g, politician.name)
          .replace(/\{paper\}/g, paper)
          .replace(/\{club\}/g, clubName)
          .replace(/\{amount\}/g, `${bidrag} kr`)
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

  // ── Kommunmöte — politician demand event (once per politician) ───────────
  const politician2 = game.localPolitician
  if (politician2 && !politician2.demandsMet) {
    const eid = `kommot_demand_${politician2.mandatExpires ?? game.currentSeason}_${game.currentSeason}`
    if (!alreadyQueued.has(eid) && currentRound === 3) {
      const agenda = politician2.agenda
      let demandBody = ''
      let choices: GameEvent['choices'] = []

      const pro2 = getPronouns(politician2.name)
      if (agenda === 'savings') {
        demandBody = `${politician2.name} ringer och vill diskutera kommunens bidrag. ${pro2.subj} oroar sig för föreningens ekonomi.`
        choices = [
          { id: 'confirm', label: 'Lova inga löneökningar nästa år', effect: { type: 'politicianRelationship', amount: 10 } },
          { id: 'pushback', label: 'Vi investerar för framtiden', effect: { type: 'politicianRelationship', amount: -5 } },
        ]
      } else if (agenda === 'youth') {
        const hasSchool = game.communityActivities?.bandySchool
        demandBody = `${politician2.name} vill att föreningen satsar mer på ungdomar. ${hasSchool ? `${pro2.subj} ser positivt på bandyskolan.` : `${pro2.subj} vill se en bandyskola.`}`
        choices = [
          { id: 'confirm', label: hasSchool ? 'Vi är stolta över bandyskolan' : 'Vi planerar en bandyskola', effect: { type: 'politicianRelationship', amount: hasSchool ? 15 : -5 } },
          { id: 'focus', label: 'A-laget är vår prioritet', effect: { type: 'politicianRelationship', amount: -8 } },
        ]
      } else if (agenda === 'prestige') {
        demandBody = `${politician2.name} vill att kommunen syns med laget. ${pro2.subj} ser er som ett varumärke för regionen.`
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
        body: `${pol3.name} hör av sig diskret. ${getPronouns(pol3.name).poss} ${getPronouns(pol3.name).subj === 'Hon' ? 'systerdotter' : 'brorson'} är en ung talang och undrar om ${getPronouns(pol3.name).subj.toLowerCase()} kan komma och träna med truppen. "Inget officiellt, bara kolla läget."`,
        choices: [
          {
            id: 'yes',
            label: 'Klart, välkommen att prova',
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

  return events
}
