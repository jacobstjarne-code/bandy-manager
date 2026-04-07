import type { SaveGame, BoardObjective, BoardMember } from '../entities/SaveGame'
import type { Club } from '../entities/Club'

// ── Objective factories ─────────────────────────────────────────────────────

function makeObjective(
  id: string, type: BoardObjective['type'], label: string, description: string,
  owner: BoardMember, measureFn: string, targetValue: number,
  successReward: string, failureConsequence: string, carryOver: boolean,
  season: number,
): BoardObjective {
  return {
    id, type, label, description,
    ownerId: owner.name,
    ownerPersonality: owner.personality,
    targetValue, currentValue: 0, measureFn,
    status: 'active',
    assignedSeason: season,
    successReward, failureConsequence, carryOver,
  }
}

const BALANCE_DESCRIPTIONS = [
  (n: string) => `${n}: "Vi kan inte fortsätta blöda pengar. Jag vill se en klubbkassa som inte är röd vid säsongsslut. Det är mitt krav."`,
  (n: string) => `${n}: "Siffrorna är röda. Det enda jag ber om är att vi inte ligger minus vid årets slut."`,
  (n: string) => `${n}: "Jag har gått igenom räkenskaperna. Vi måste vända det här. Plusminusnoll — minst."`,
  (n: string) => `${n}: "Varje krona räknas. Håll budgeten. Det är inte förhandlingsbart."`,
]

function balanceBudget(owner: BoardMember, season: number): BoardObjective {
  const desc = BALANCE_DESCRIPTIONS[season % BALANCE_DESCRIPTIONS.length](owner.name)
  return makeObjective(
    'balanceBudget', 'economic',
    'Håll ekonomin i balans',
    desc,
    owner, 'balanceBudget', 0,
    `${owner.name}: "Tack. Klokt hanterat."`,
    `${owner.name}: "Minus igen. Jag noterar mitt missnöje."`,
    true, season,
  )
}

function growFinances(owner: BoardMember, season: number): BoardObjective {
  return makeObjective(
    'growFinances', 'economic',
    'Öka klubbkassan med 100 tkr',
    `${owner.name}: "Ekonomin är stabil men vi kan bättre. Jag vill se 100 000 mer vid säsongsslut."`,
    owner, 'growFinances', 100000,
    `${owner.name}: "Imponerande. Kassan växer."`,
    `${owner.name}: "Vi nådde inte målet. Men vi överlevde."`,
    false, season,
  )
}

const HOMEGROWN_DESCRIPTIONS = [
  (n: string) => `${n}: "Vi har pojkar från orten i truppen. Minst tre av dem ska starta regelbundet. Det är så vi bygger en klubb."`,
  (n: string) => `${n}: "Jag vill se lokala grabbar på isen. Tre egenfostrade i startelvan — det borde vara självklart."`,
  (n: string) => `${n}: "Vi fostrar spelare för att de ska spela. Tre stycken i elvan — minst."`,
  (n: string) => `${n}: "Det finns talang i byn. Visa att ni ser den. Tre lokala förmågor i startelvan."`,
]

function playHomegrown(owner: BoardMember, season: number): BoardObjective {
  const desc = HOMEGROWN_DESCRIPTIONS[season % HOMEGROWN_DESCRIPTIONS.length](owner.name)
  return makeObjective(
    'playHomegrown', 'academy',
    'Minst 3 egenfostrade i startelvan',
    desc,
    owner, 'playHomegrown', 3,
    `${owner.name}: "Så ska det se ut. Pojkarna från orten i startelvan."`,
    `${owner.name}: "Inte en enda egenforstrad i startelvan. Det tar jag personligt."`,
    true, season,
  )
}

function growFanbase(owner: BoardMember, season: number): BoardObjective {
  return makeObjective(
    'growFanbase', 'community',
    'Fan mood ska nå 70',
    `${owner.name}: "Publiken måste tillbaka. Vi behöver stämning på läktarna. Fan mood 70 — det är målet."`,
    owner, 'growFanbase', 70,
    `${owner.name}: "Stämningen är tillbaka! Bra jobbat."`,
    `${owner.name}: "Läktarna är fortfarande halvtomma. Vi måste hitta vägen tillbaka."`,
    false, season,
  )
}

function cupRun(owner: BoardMember, season: number): BoardObjective {
  return makeObjective(
    'cupRun', 'sporting',
    'Gå långt i cupen',
    `${owner.name}: "Semifinal — det är allt jag ber om. Ge oss en cupresa att minnas."`,
    owner, 'cupRun', 3,
    `${owner.name}: "SEMIFINAL! Jag har väntat 15 år på det här!"`,
    `${owner.name}: "Cupen blev en besvikelse. Men ligan är viktigast."`,
    false, season,
  )
}

function improveFacilities(owner: BoardMember, season: number): BoardObjective {
  return makeObjective(
    'improveFacilities', 'community',
    'Förbättra anläggningen',
    `${owner.name}: "Anläggningen är under all kritik. Starta minst ett projekt den här säsongen."`,
    owner, 'improveFacilities', 1,
    `${owner.name}: "Bra! Äntligen händer det något."`,
    `${owner.name}: "Ingenting gjort med anläggningen. Igen."`,
    true, season,
  )
}

function beatRival(owner: BoardMember, rivalName: string, season: number): BoardObjective {
  return makeObjective(
    'beatRival', 'sporting',
    `Slå ${rivalName}`,
    `${owner.name}: "Vi MÅSTE slå ${rivalName} den här säsongen. Jag vet inte vad jag ska säga till grabbarna på jobbet annars."`,
    owner, 'beatRival', 1,
    `${owner.name}: "Vi slog ${rivalName}! Det räcker för hela säsongen."`,
    `${owner.name}: "Vi förlorade derbyt. Igen. Tungt."`,
    false, season,
  )
}

// ── Generate objectives for a new season ────────────────────────────────────

export function generateBoardObjectives(
  club: Club,
  game: SaveGame,
  boardMembers: BoardMember[],
  rand: () => number,
): BoardObjective[] {
  const objectives: BoardObjective[] = []
  const season = game.currentSeason
  const kassör = boardMembers.find(m => m.role === 'kassör')
  const traditionalist = boardMembers.find(m => m.personality === 'traditionalist')
  const modernist = boardMembers.find(m => m.personality === 'modernist')
  const supporter = boardMembers.find(m => m.personality === 'supporter')

  // Kassören ALLTID om ekonomin var dålig
  if (club.finances < 0 && kassör) {
    objectives.push(balanceBudget(kassör, season))
  } else if (club.finances > 0 && club.finances < 200000 && kassör && rand() < 0.4) {
    objectives.push(growFinances(kassör, season))
  }

  // Candidates for second objective
  const candidates: BoardObjective[] = []

  if (traditionalist) {
    const homegrown = game.players.filter(p =>
      p.clubId === club.id && p.isHomegrown
    ).length
    if (homegrown >= 3) candidates.push(playHomegrown(traditionalist, season))
  }

  if (modernist && (game.fanMood ?? 50) < 45) {
    candidates.push(growFanbase(modernist, season))
  }

  if (modernist && club.facilities < 40 && rand() < 0.5) {
    candidates.push(improveFacilities(modernist, season))
  }

  if (supporter) {
    const rivalHistory = Object.entries(game.rivalryHistory ?? {})
      .find(([, h]) => h.currentStreak < -1)
    if (rivalHistory) {
      const rivalClub = game.clubs.find(c => c.id === rivalHistory[0])
      if (rivalClub) candidates.push(beatRival(supporter, rivalClub.name, season))
    }
    if (rand() < 0.3) candidates.push(cupRun(supporter, season))
  }

  // Pick max 1 more (total 1-2)
  if (objectives.length === 0 && candidates.length > 0) {
    objectives.push(candidates[Math.floor(rand() * candidates.length)])
  } else if (objectives.length === 1 && candidates.length > 0 && rand() < 0.5) {
    const pick = candidates[Math.floor(rand() * candidates.length)]
    if (pick.type !== objectives[0].type) objectives.push(pick)
  }

  return objectives
}

// ── Evaluate objectives ─────────────────────────────────────────────────────

export function evaluateObjective(
  objective: BoardObjective,
  game: SaveGame,
): { value: number; status: 'met' | 'failed' | 'at_risk' | 'active' } {
  switch (objective.measureFn) {
    case 'balanceBudget': {
      const club = game.clubs.find(c => c.id === game.managedClubId)!
      const value = club.finances
      return { value, status: value >= 0 ? 'met' : value > -100000 ? 'at_risk' : 'failed' }
    }
    case 'growFinances': {
      const club = game.clubs.find(c => c.id === game.managedClubId)!
      const start = game.seasonStartFinances ?? 0
      const delta = club.finances - start
      return { value: delta, status: delta >= objective.targetValue ? 'met' : delta >= 0 ? 'active' : 'at_risk' }
    }
    case 'playHomegrown': {
      const recent = game.fixtures
        .filter(f => f.status === 'completed' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
        .sort((a, b) => (b.matchday ?? b.roundNumber) - (a.matchday ?? a.roundNumber))
        .slice(0, 5)
      const homegrownIds = new Set(game.players.filter(p => p.isHomegrown && p.clubId === game.managedClubId).map(p => p.id))
      const avg = recent.reduce((sum, f) => {
        const isHome = f.homeClubId === game.managedClubId
        const starters = isHome ? (f.homeLineup?.startingPlayerIds ?? []) : (f.awayLineup?.startingPlayerIds ?? [])
        return sum + starters.filter(id => homegrownIds.has(id)).length
      }, 0) / Math.max(1, recent.length)
      return { value: Math.round(avg * 10) / 10, status: avg >= 3 ? 'met' : avg >= 2 ? 'at_risk' : 'active' }
    }
    case 'growFanbase': {
      const fm = game.fanMood ?? 50
      return { value: fm, status: fm >= 70 ? 'met' : fm >= 55 ? 'active' : 'at_risk' }
    }
    case 'cupRun': {
      const bracket = game.cupBracket
      if (!bracket) return { value: 0, status: 'active' }
      const managedMatches = bracket.matches.filter(m =>
        m.homeClubId === game.managedClubId || m.awayClubId === game.managedClubId
      )
      const maxRound = Math.max(0, ...managedMatches.filter(m => m.winnerId === game.managedClubId).map(m => m.round))
      return { value: maxRound, status: maxRound >= 3 ? 'met' : maxRound >= 2 ? 'active' : 'at_risk' }
    }
    case 'beatRival': {
      const history = game.rivalryHistory ?? {}
      const won = Object.values(history).some(h => h.lastResult === 'win')
      return { value: won ? 1 : 0, status: won ? 'met' : 'active' }
    }
    case 'improveFacilities': {
      const projects = game.facilityProjects ?? []
      const started = projects.filter(p => p.status === 'in_progress' || p.status === 'completed').length
      return { value: started, status: started >= 1 ? 'met' : 'active' }
    }
    default:
      return { value: 0, status: 'active' }
  }
}

// ── Check-in: update objective status (called at round 7, 14, 22) ───────────

export function checkInObjectives(
  objectives: BoardObjective[],
  game: SaveGame,
): { updated: BoardObjective[]; inboxMessages: Array<{ title: string; body: string }> } {
  const inboxMessages: Array<{ title: string; body: string }> = []
  const updated = objectives.map(obj => {
    const result = evaluateObjective(obj, game)
    const newStatus = result.status === 'met' ? 'met' as const
      : result.status === 'failed' ? 'failed' as const
      : result.status === 'at_risk' ? 'at_risk' as const
      : 'active' as const

    if (newStatus === 'met' && obj.status !== 'met') {
      inboxMessages.push({
        title: `📋 ${obj.ownerId}: Uppfyllt!`,
        body: obj.successReward,
      })
    } else if (newStatus === 'at_risk' && obj.status === 'active') {
      inboxMessages.push({
        title: `⚠️ ${obj.ownerId}: Varning`,
        body: `${obj.label} — vi är inte i fas. Nuvarande: ${result.value}.`,
      })
    } else if (newStatus === 'failed' && obj.status !== 'failed') {
      inboxMessages.push({
        title: `🔴 ${obj.ownerId}: Misslyckat`,
        body: obj.failureConsequence,
      })
    }

    return { ...obj, currentValue: result.value, status: newStatus }
  })
  return { updated, inboxMessages }
}
