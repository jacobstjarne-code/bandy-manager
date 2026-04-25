import type { SaveGame, InboxItem } from '../entities/SaveGame'
import type { Club } from '../entities/Club'
import { InboxItemType } from '../enums'

// ── Types ──────────────────────────────────────────────────────────────────

export type ScandalType =
  | 'sponsor_collapse'
  | 'club_to_club_loan'
  | 'treasurer_resigned'
  | 'phantom_salaries'
  | 'fundraiser_vanished'
  | 'coach_meltdown'

export interface Scandal {
  id: string
  season: number
  triggerRound: number
  type: ScandalType
  affectedClubId: string
  secondaryClubId?: string
  resolutionRound: number
  isResolved: boolean
}

export interface ScandalEffect {
  budgetDelta?: number
  reputationDelta?: number
  pointDeduction?: { season: 'current' | 'next'; points: number }
  formPenalty?: { rounds: number; modifier: number }
  transferFreeze?: { rounds: number }
}

// ── Trigger windows ────────────────────────────────────────────────────────

const TRIGGER_WINDOWS = [
  [6, 8],
  [12, 14],
  [18, 20],
  [24, 26],
] as const

const SCANDAL_CHANCE_PER_WINDOW = 0.25

// ── Scandal type distribution (weights sum to 100) ─────────────────────────

const SCANDAL_WEIGHTS: Array<{ type: ScandalType; weight: number }> = [
  { type: 'sponsor_collapse',   weight: 25 },
  { type: 'club_to_club_loan',  weight: 15 },
  { type: 'treasurer_resigned', weight: 20 },
  { type: 'phantom_salaries',   weight: 15 },
  { type: 'fundraiser_vanished',weight: 15 },
  { type: 'coach_meltdown',     weight: 10 },
]

function pickScandalType(rand: () => number): ScandalType {
  const total = SCANDAL_WEIGHTS.reduce((s, w) => s + w.weight, 0)
  let r = rand() * total
  for (const { type, weight } of SCANDAL_WEIGHTS) {
    r -= weight
    if (r <= 0) return type
  }
  return 'sponsor_collapse'
}

// ── Club selection ─────────────────────────────────────────────────────────

function getClubWeight(rep: number): number {
  if (rep >= 20 && rep <= 60) return 3
  if (rep > 60 && rep <= 80) return 1
  return 0.5
}

function alreadyHitThisSeason(clubId: string, season: number, game: SaveGame): boolean {
  const active = (game.activeScandals ?? []).some(s => s.affectedClubId === clubId && s.season === season)
  const hist   = (game.scandalHistory ?? []).some(s => s.affectedClubId === clubId && s.season === season)
  return active || hist
}

function pickAffectedClub(game: SaveGame, rand: () => number): Club | null {
  const candidates = game.clubs.filter(c =>
    c.id !== game.managedClubId &&
    !alreadyHitThisSeason(c.id, game.currentSeason, game),
  )
  if (candidates.length === 0) return null

  const totalWeight = candidates.reduce((s, c) => s + getClubWeight(c.reputation), 0)
  let r = rand() * totalWeight
  for (const c of candidates) {
    r -= getClubWeight(c.reputation)
    if (r <= 0) return c
  }
  return candidates[candidates.length - 1]
}

// ── Resolution round per type ──────────────────────────────────────────────

function getResolutionRound(type: ScandalType, triggerRound: number): number {
  switch (type) {
    case 'sponsor_collapse':    return triggerRound      // immediate
    case 'club_to_club_loan':   return triggerRound      // immediate
    case 'treasurer_resigned':  return triggerRound + 3  // freeze 3 rounds
    case 'phantom_salaries':    return triggerRound      // immediate
    case 'fundraiser_vanished': return triggerRound + 5  // CS/rep recovery window
    case 'coach_meltdown':      return triggerRound + 4  // form penalty
  }
}

// ── Check trigger ──────────────────────────────────────────────────────────

export function checkScandalTrigger(
  game: SaveGame,
  nextMatchday: number,
  rand: () => number,
): Scandal | null {
  const inWindow = TRIGGER_WINDOWS.some(([lo, hi]) => nextMatchday >= lo && nextMatchday <= hi)
  if (!inWindow) return null

  // Only trigger once per window per season (idempotency: check if we already fired this window)
  const windowStart = TRIGGER_WINDOWS.find(([lo, hi]) => nextMatchday >= lo && nextMatchday <= hi)![0]
  const alreadyFiredThisWindow = [...(game.activeScandals ?? []), ...(game.scandalHistory ?? [])].some(
    s => s.season === game.currentSeason && s.triggerRound >= windowStart && s.triggerRound <= windowStart + 2,
  )
  if (alreadyFiredThisWindow) return null

  if (rand() > SCANDAL_CHANCE_PER_WINDOW) return null

  const club = pickAffectedClub(game, rand)
  if (!club) return null

  const type = pickScandalType(rand)
  const triggerRound = nextMatchday

  let secondaryClubId: string | undefined
  if (type === 'club_to_club_loan') {
    const others = game.clubs.filter(c => c.id !== club.id && c.id !== game.managedClubId)
    if (others.length > 0) {
      secondaryClubId = others[Math.floor(rand() * others.length)].id
    }
  }

  return {
    id: `scandal_${type}_s${game.currentSeason}_r${triggerRound}`,
    season: game.currentSeason,
    triggerRound,
    type,
    affectedClubId: club.id,
    secondaryClubId,
    resolutionRound: getResolutionRound(type, triggerRound),
    isResolved: false,
  }
}

// ── Inbox text ─────────────────────────────────────────────────────────────

const SCANDAL_TEXT: Record<ScandalType, {
  titles: string[]
  bodies: string[]
  headlines: string[]
  coffeeRoom: string[]
}> = {
  sponsor_collapse: {
    titles: [
      'Storsponsor på obestånd',
      'Sponsorkollaps: {club} i kris',
      '{club}: Huvudsponsor drar sig ur',
    ],
    bodies: [
      '{club}s storsponsor har ansökt om konkurs. Budgeten minskar med 400 000 kr. Styrelsen kallar till krismöte.',
      'Budgetunderskottet tvingar {club} att se över truppen. Tränaren säger att det är tufft men möjligt.',
      '{club} bekräftar att årsbudgeten drabbas allvarligt efter att sponsorn dragit sig ur alla åtaganden.',
    ],
    headlines: [
      '{club}: Sponsor i fritt fall',
      'Bandykris i {city}: Sponsorn är borta',
    ],
    coffeeRoom: [
      'Jag hörde att de inte har råd att betala löner nästa månad.',
      'Deras styrelse sitter och svettas nu.',
    ],
  },
  club_to_club_loan: {
    titles: [
      'Kommunlån avslöjat — poängavdrag väntar',
      'Oregelbunden pengaöverföring: {club} granskas',
      'Bokföringsskandal: {club} och {secondaryClub}',
    ],
    bodies: [
      '{club} och {secondaryClub} utreds för oregelbundna lånetransaktioner mellan klubbarna. RF utdömer tre poängs avdrag nästa säsong.',
      'Lokalrivalerna {club} och {secondaryClub} misstänks för att ha delat ekonomi på ett sätt som bryter mot tävlingsreglerna.',
      'RF bekräftar utredning av {club}. Poängavdrag om 3 utdöms inför nästa säsong.',
    ],
    headlines: [
      '{club}: Poängavdrag bekräftat',
      'RF utreder {club} — tre poäng på spel',
    ],
    coffeeRoom: [
      'De lånade pengar av grannklubben. Det är ju regelbrott.',
      'Tre poäng borta nästa säsong. Jag trodde det bara hände i fotboll.',
    ],
  },
  treasurer_resigned: {
    titles: [
      'Kassören avgick med omedelbar verkan',
      '{club}: Ekonomiansvarig lämnar',
      'Intern turbulens — {club}s kassör flyr',
    ],
    bodies: [
      '{club}s kassör har avgått oväntat. Transfermarknaden fryses i tre omgångar medan en revision genomförs.',
      'Styrelsekaos i {club} efter att kassören lämnat utan förvarning. Inga köp eller försäljningar tillåts tills situationen klarnat.',
      'Obehagliga rykten cirkulerar om varför {club}s kassör plötsligt slutat. Transferaktiviteten pausas under utredningens gång.',
    ],
    headlines: [],
    coffeeRoom: [],
  },
  phantom_salaries: {
    titles: [
      'Skatteverket granskar {club}: Fantomlöner misstänks',
      'Lönebluffen avslöjad — {club} får poängavdrag',
      'Skatteskandal: {club} minus 2 poäng',
    ],
    bodies: [
      'Skatteverket har avslöjat att {club} betalat lön till spelare som inte existerade. Poängavdrag om 2 poäng i nuvarande säsong.',
      '{club} nekar till fantomlöner, men RF utdömer ändå 2 poängs avdrag direkt. Klubbens ledning avgår.',
      'Lönebluffen kostar {club} dyrt — 2 poäng och ett skadat anseende i bandysverige.',
    ],
    headlines: [
      'Fantomlöner: {club} tappar 2 poäng',
      '{club} döms för lönebluffen — direktverkande straff',
    ],
    coffeeRoom: [
      'De betalade lön till en spelare som slutat för tre år sedan. Hur kan det hända?',
      'Skatteverket hittade det i revisorsgranskningen. Nu åker de.',
    ],
  },
  fundraiser_vanished: {
    titles: [
      'Insamling spårlöst försvunnen — {club}s anseende raseras',
      'Pengar borta: {club}s välgörenhetsgala slutade i skam',
      '{club}: Sponsorgala och scandal',
    ],
    bodies: [
      '{club}s insamlingsgala slutade med att pengarna försvann. Orten är rasande på styrelsen.',
      '200 000 kr insamlat — och nu är pengarna borta. Polisanmälan har lämnats in mot {club}s tidigare ekonomiansvarige.',
      '{club}s gala-affär skakar orten. Styrelseledamöter kritiseras och klubbens anseende tar ett hårt slag.',
    ],
    headlines: [
      '{club}: Insamlingsskandal skakar orten',
      'Pengarna försvann — {club} i blåsväder',
    ],
    coffeeRoom: [
      'Jag vet folk som var med och bidrog. De är förbannade.',
      'Styrelsen skyllar på varandra. Ingen tar ansvar.',
    ],
  },
  coach_meltdown: {
    titles: [
      'Tränarhaveri: {club} byter ledare',
      '{club}s tränare exploderade — nu är han borta',
      'Internt kaos: {club}s coach sparkad',
    ],
    bodies: [
      '{club}s tränare kastade ut sin assistent och hotade spelare efter en förlustsvit. Styrelsen avslutade samarbetet. Laget kämpar de närmaste omgångarna.',
      'Dåliga resultat och oförutsägbart beteende på träningarna — till sist fick {club}s tränare gå.',
      'Tränaren är borta, men skadan är skedd. {club}s form beräknas lida under fyra omgångar.',
    ],
    headlines: [
      '{club}: Tränaren sparkad — laget i kaos',
      '{club}: Ny tränare sökes efter dramatisk avsättning',
    ],
    coffeeRoom: [
      'Han tappade det totalt på träning. Alla pratade om det.',
      'Nu är de utan coach mitt i säsongen. Tuff situation.',
    ],
  },
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)]
}

function fillTemplate(
  text: string,
  club: Club,
  secondaryClub?: Club,
): string {
  return text
    .replace(/{club}/g, club.name)
    .replace(/{city}/g, club.name.split(' ').slice(-1)[0])
    .replace(/{secondaryClub}/g, secondaryClub?.name ?? 'grannklubben')
}

// ── Apply effect ───────────────────────────────────────────────────────────

export function applyScandalEffect(
  game: SaveGame,
  scandal: Scandal,
  rand: () => number,
): { updatedClubs: Club[]; inboxItems: InboxItem[]; pointDeductions: Record<string, number>; pendingPointDeductions: Record<string, number> } {
  const club = game.clubs.find(c => c.id === scandal.affectedClubId)
  if (!club) return { updatedClubs: game.clubs, inboxItems: [], pointDeductions: {}, pendingPointDeductions: {} }

  const secondaryClub = scandal.secondaryClubId ? game.clubs.find(c => c.id === scandal.secondaryClubId) : undefined
  const text = SCANDAL_TEXT[scandal.type]
  const title = fillTemplate(pick(text.titles, rand), club, secondaryClub)
  const body = fillTemplate(pick(text.bodies, rand), club, secondaryClub)

  let updatedClubs = [...game.clubs]
  const pointDeductions: Record<string, number> = { ...(game.pointDeductions ?? {}) }
  const pendingPointDeductions: Record<string, number> = { ...(game.pendingPointDeductions ?? {}) }
  const inboxItems: InboxItem[] = []

  // Apply immediate effects
  switch (scandal.type) {
    case 'sponsor_collapse': {
      updatedClubs = updatedClubs.map(c =>
        c.id === scandal.affectedClubId ? { ...c, finances: c.finances - 400_000 } : c,
      )
      break
    }
    case 'club_to_club_loan': {
      // Point deduction next season for affected club
      const prev = pendingPointDeductions[scandal.affectedClubId] ?? 0
      pendingPointDeductions[scandal.affectedClubId] = prev + 3
      break
    }
    case 'treasurer_resigned': {
      // Transfer freeze tracked via resolutionRound (checked in createOutgoingBid via activeScandals)
      break
    }
    case 'phantom_salaries': {
      // Point deduction current season
      const prev = pointDeductions[scandal.affectedClubId] ?? 0
      pointDeductions[scandal.affectedClubId] = prev + 2
      break
    }
    case 'fundraiser_vanished': {
      // Reputation hit — recovers gradually (full restore at resolution via resolveExpiredScandals)
      updatedClubs = updatedClubs.map(c =>
        c.id === scandal.affectedClubId ? { ...c, reputation: Math.max(0, c.reputation - 8) } : c,
      )
      break
    }
    case 'coach_meltdown': {
      // Temporary reputation penalty — restored at resolution
      updatedClubs = updatedClubs.map(c =>
        c.id === scandal.affectedClubId ? { ...c, reputation: Math.max(0, c.reputation - 5) } : c,
      )
      break
    }
  }

  // Generate inbox item
  inboxItems.push({
    id: scandal.id,
    date: game.currentDate,
    type: InboxItemType.Scandal,
    title,
    body,
    isRead: false,
    relatedClubId: scandal.affectedClubId,
  } as InboxItem)

  // Coffee room quote (where applicable)
  if (text.coffeeRoom.length > 0) {
    const quote = fillTemplate(pick(text.coffeeRoom, rand), club, secondaryClub)
    inboxItems.push({
      id: `${scandal.id}_cr`,
      date: game.currentDate,
      type: InboxItemType.Scandal,
      title: 'Kafferummet',
      body: `"${quote}"`,
      isRead: false,
      relatedClubId: scandal.affectedClubId,
    } as InboxItem)
  }

  return { updatedClubs, inboxItems, pointDeductions, pendingPointDeductions }
}

// ── Resolve expired scandals ───────────────────────────────────────────────

export function resolveExpiredScandals(
  game: SaveGame,
  currentRound: number,
): { updatedClubs: Club[]; updatedScandals: Scandal[]; updatedScandalHistory: Scandal[] } {
  const toResolve = (game.activeScandals ?? []).filter(s => s.resolutionRound <= currentRound && !s.isResolved)
  const stillActive = (game.activeScandals ?? []).filter(s => !(s.resolutionRound <= currentRound && !s.isResolved))

  let updatedClubs = [...game.clubs]

  for (const scandal of toResolve) {
    // Restore temporary reputation penalties
    if (scandal.type === 'fundraiser_vanished' || scandal.type === 'coach_meltdown') {
      const restore = scandal.type === 'coach_meltdown' ? 5 : 8
      updatedClubs = updatedClubs.map(c =>
        c.id === scandal.affectedClubId ? { ...c, reputation: Math.min(100, c.reputation + restore) } : c,
      )
    }
  }

  const resolved = toResolve.map(s => ({ ...s, isResolved: true }))

  return {
    updatedClubs,
    updatedScandals: stillActive,
    updatedScandalHistory: [...(game.scandalHistory ?? []), ...resolved],
  }
}

// ── Transfer freeze check ──────────────────────────────────────────────────

export function isTransferFrozen(game: SaveGame, clubId: string): boolean {
  return (game.activeScandals ?? []).some(
    s => s.type === 'treasurer_resigned' && s.affectedClubId === clubId && !s.isResolved,
  )
}
