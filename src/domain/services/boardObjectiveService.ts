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
  'Vi kan inte fortsätta blöda pengar. Jag vill se en klubbkassa som inte är röd vid säsongsslut. Det är mitt krav.',
  'Siffrorna är röda. Det enda jag ber om är att vi inte ligger minus vid årets slut.',
  'Jag har gått igenom räkenskaperna. Vi måste vända det här. Plusminusnoll — minst.',
  'Varje krona räknas. Håll budgeten. Det är inte förhandlingsbart.',
]

function balanceBudget(owner: BoardMember, season: number): BoardObjective {
  const desc = `${owner.name}: "${BALANCE_DESCRIPTIONS[season % BALANCE_DESCRIPTIONS.length]}"`
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
  'Vi har pojkar från orten i truppen. Minst tre av dem ska starta regelbundet. Det är så vi bygger en klubb.',
  'Jag vill se lokala grabbar på isen. Tre egenfostrade i startelvan — det borde vara självklart.',
  'Vi fostrar spelare för att de ska spela. Tre stycken i elvan — minst.',
  'Det finns talang i byn. Visa att ni ser den. Tre lokala förmågor i startelvan.',
]

function playHomegrown(owner: BoardMember, season: number): BoardObjective {
  const desc = `${owner.name}: "${HOMEGROWN_DESCRIPTIONS[season % HOMEGROWN_DESCRIPTIONS.length]}"`
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

function improveYouth(owner: BoardMember, season: number): BoardObjective {
  const descs = [
    'Vi lägger pengar på akademin. Jag vill se resultat — minst en spelare som tar klivet upp.',
    'Akademin måste leverera. En spelare till A-laget den här säsongen. Det är rimligt.',
    'Det finns pojkar i P19 som är redo. Ge dem chansen.',
  ]
  return makeObjective(
    'improveYouth', 'academy',
    'Lyft en spelare från akademin',
    `${owner.name}: "${descs[season % descs.length]}"`,
    owner, 'improveYouth', 1,
    `${owner.name}: "Bra — akademin levererar."`,
    `${owner.name}: "Ingen ny spelare från akademin. Vad gör vi egentligen där nere?"`,
    false, season,
  )
}

function reduceInjuries(owner: BoardMember, season: number): BoardObjective {
  const descs = [
    'Skadeläget var en katastrof. Håll truppen frisk den här säsongen.',
    'Vi hade för många skador förra året. Max fem — det borde vara möjligt.',
    'Träningen måste anpassas. Jag vill inte se halva truppen på skadelistan igen.',
  ]
  return makeObjective(
    'reduceInjuries', 'sporting',
    'Max 5 skador under säsongen',
    `${owner.name}: "${descs[season % descs.length]}"`,
    owner, 'reduceInjuries', 5,
    `${owner.name}: "Friska spelare, bra säsong. Så enkelt är det."`,
    `${owner.name}: "Skadeläget blev för dåligt. Vi måste se över träningen."`,
    false, season,
  )
}

function topHalfFinish(owner: BoardMember, season: number): BoardObjective {
  const descs = [
    'Jag begär inte SM-guld. Men topp 6 — det ska vi klara.',
    'Vi hör hemma i övre halvan. Bevisa det.',
    'Stabilt i toppen. Plats 1–6 vid säsongsslut.',
  ]
  return makeObjective(
    'topHalf', 'sporting',
    'Sluta topp 6',
    `${owner.name}: "${descs[season % descs.length]}"`,
    owner, 'topHalf', 6,
    `${owner.name}: "Topp 6! Vi är på rätt väg."`,
    `${owner.name}: "Under nedre halvan. Inte godkänt."`,
    false, season,
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
  const season = game.currentSeason
  const kassör = boardMembers.find(m => m.role === 'kassör')
  const traditionalist = boardMembers.find(m => m.personality === 'traditionalist')
  const modernist = boardMembers.find(m => m.personality === 'modernist')
  const supporter = boardMembers.find(m => m.personality === 'supporter')

  // All possible objectives — build candidates first, then pick 1-2
  const allCandidates: BoardObjective[] = []

  // Economy objectives (from kassör)
  if (kassör) {
    if (club.finances < 0) {
      allCandidates.push(balanceBudget(kassör, season))
    } else if (club.finances < 500000) {
      allCandidates.push(growFinances(kassör, season))
    }
  }

  // Objective IDs used last season (for variety)
  const lastSeasonObjectiveIds = new Set(
    (game.boardObjectiveHistory ?? [])
      .filter(o => o.season === season - 1)
      .map(o => o.objectiveId)
  )

  // Academy / homegrown (from traditionalist) — 50/50 between playHomegrown and improveYouth
  if (traditionalist) {
    const homegrown = game.players.filter(p => p.clubId === club.id && p.isHomegrown).length
    if (homegrown >= 2) {
      const useImprove = rand() < 0.5 || lastSeasonObjectiveIds.has('playHomegrown')
      allCandidates.push(useImprove ? improveYouth(traditionalist, season) : playHomegrown(traditionalist, season))
    } else {
      allCandidates.push(improveYouth(traditionalist, season))
    }
  }

  // Community / fans (from modernist)
  if (modernist) {
    if ((game.fanMood ?? 50) < 60) allCandidates.push(growFanbase(modernist, season))
    if (club.facilities < 50) allCandidates.push(improveFacilities(modernist, season))
  }

  // Sporting (from supporter) — more variety
  if (supporter) {
    const sportingCandidates: BoardObjective[] = []
    if (!lastSeasonObjectiveIds.has('cupRun')) sportingCandidates.push(cupRun(supporter, season))
    if (!lastSeasonObjectiveIds.has('topHalf')) sportingCandidates.push(topHalfFinish(supporter, season))
    if (!lastSeasonObjectiveIds.has('reduceInjuries')) sportingCandidates.push(reduceInjuries(supporter, season))
    // Always allow beatRival if on a losing streak
    const rivalHistory = Object.entries(game.rivalryHistory ?? {})
      .find(([, h]) => h.currentStreak < -1)
    if (rivalHistory) {
      const rivalClub = game.clubs.find(c => c.id === rivalHistory[0])
      if (rivalClub) sportingCandidates.push(beatRival(supporter, rivalClub.name, season))
    }
    // If all filtered out by history, fall back to the full pool
    const pool = sportingCandidates.length > 0 ? sportingCandidates : [cupRun(supporter, season), topHalfFinish(supporter, season)]
    allCandidates.push(pool[Math.floor(rand() * pool.length)])
  }

  // Shuffle candidates for variety
  for (let i = allCandidates.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[allCandidates[i], allCandidates[j]] = [allCandidates[j], allCandidates[i]]
  }

  // Pick 2-3 objectives with different types
  const targetCount = 2 + (rand() < 0.3 ? 1 : 0)
  const objectives: BoardObjective[] = []
  for (const candidate of allCandidates) {
    if (objectives.length >= targetCount) break
    if (objectives.some(o => o.type === candidate.type)) continue
    objectives.push(candidate)
  }

  // Guarantee at least 1 objective: fallback to cupRun or growFinances
  if (objectives.length === 0) {
    const fallbackOwner = supporter ?? kassör ?? boardMembers[0]
    if (fallbackOwner) {
      objectives.push(rand() < 0.5
        ? cupRun(fallbackOwner, season)
        : growFinances(fallbackOwner, season)
      )
    }
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
      const eliminated = managedMatches.some(m => m.winnerId && m.winnerId !== game.managedClubId)
      if (maxRound >= 3) return { value: maxRound, status: 'met' }
      if (eliminated) return { value: maxRound, status: 'failed' }
      return { value: maxRound, status: maxRound >= 2 ? 'active' : 'at_risk' }
    }
    case 'beatRival': {
      const history = game.rivalryHistory ?? {}
      const won = Object.values(history).some(h => h.lastResult === 'win')
      if (won) return { value: 1, status: 'met' }
      const rivalIds = Object.keys(history)
      const allDerbiesPlayed = rivalIds.length > 0 && rivalIds.every(rivalId => {
        const played = game.fixtures.filter(f =>
          f.status === 'completed' &&
          ((f.homeClubId === game.managedClubId && f.awayClubId === rivalId) ||
           (f.awayClubId === game.managedClubId && f.homeClubId === rivalId))
        )
        return played.length >= 2
      })
      return { value: 0, status: allDerbiesPlayed ? 'failed' : 'active' }
    }
    case 'improveFacilities': {
      const projects = game.facilityProjects ?? []
      const started = projects.filter(p => p.status === 'in_progress' || p.status === 'completed').length
      return { value: started, status: started >= 1 ? 'met' : 'active' }
    }
    case 'improveYouth': {
      const promoted = game.players.filter(p =>
        p.clubId === game.managedClubId && p.isHomegrown && p.age <= 20 &&
        (p.seasonStats?.gamesPlayed ?? 0) >= 3
      ).length
      return { value: promoted, status: promoted >= 1 ? 'met' : 'active' }
    }
    case 'reduceInjuries': {
      const injuryCount = game.players.filter(p =>
        p.clubId === game.managedClubId && p.isInjured
      ).length
      return { value: injuryCount, status: injuryCount <= 5 ? 'met' : injuryCount <= 8 ? 'active' : 'at_risk' }
    }
    case 'topHalf': {
      const pos = game.standings?.find(s => s.clubId === game.managedClubId)?.position ?? 12
      return { value: pos, status: pos <= 6 ? 'met' : pos <= 8 ? 'active' : 'at_risk' }
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
