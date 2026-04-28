import type { SaveGame, InboxItem } from '../entities/SaveGame'
import type { Club } from '../entities/Club'
import { InboxItemType } from '../enums'
import { POLITICIAN_PROFILES } from '../data/politicianData'

// ── Types ──────────────────────────────────────────────────────────────────

export type ScandalType =
  | 'sponsor_collapse'
  | 'club_to_club_loan'
  | 'treasurer_resigned'
  | 'phantom_salaries'
  | 'fundraiser_vanished'
  | 'coach_meltdown'
  | 'municipal_scandal'
  | 'small_absurdity'

export interface Scandal {
  id: string
  season: number
  triggerRound: number
  type: ScandalType
  affectedClubId: string
  secondaryClubId?: string
  resolutionRound: number
  isResolved: boolean
  variant?: 'positive' | 'negative'  // used by municipal_scandal
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
// Rev 2 + small_absurdity addendum combined

const SCANDAL_WEIGHTS: Array<{ type: ScandalType; weight: number }> = [
  { type: 'municipal_scandal',   weight: 21 },
  { type: 'small_absurdity',     weight: 15 },
  { type: 'treasurer_resigned',  weight: 15 },
  { type: 'sponsor_collapse',    weight: 13 },
  { type: 'phantom_salaries',    weight: 11 },
  { type: 'club_to_club_loan',   weight: 10 },
  { type: 'fundraiser_vanished', weight: 9  },
  { type: 'coach_meltdown',      weight: 6  },
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

function pickAffectedClub(
  game: SaveGame,
  rand: () => number,
  includeManaged: boolean,
): Club | null {
  const candidates = game.clubs.filter(c => {
    if (!includeManaged && c.id === game.managedClubId) return false
    return !alreadyHitThisSeason(c.id, game.currentSeason, game)
  })
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
    case 'sponsor_collapse':    return triggerRound      // immediate (flavor: ongoing -3k/wk)
    case 'club_to_club_loan':   return triggerRound      // immediate
    case 'treasurer_resigned':  return triggerRound + 3  // freeze 3 rounds
    case 'phantom_salaries':    return triggerRound      // immediate
    case 'fundraiser_vanished': return triggerRound + 5  // rep recovery window
    case 'coach_meltdown':      return triggerRound + 4  // form penalty
    case 'municipal_scandal':   return triggerRound      // immediate
    case 'small_absurdity':     return triggerRound      // immediate, no effect
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

  const windowStart = TRIGGER_WINDOWS.find(([lo, hi]) => nextMatchday >= lo && nextMatchday <= hi)![0]
  const alreadyFiredThisWindow = [...(game.activeScandals ?? []), ...(game.scandalHistory ?? [])].some(
    s => s.season === game.currentSeason && s.triggerRound >= windowStart && s.triggerRound <= windowStart + 2,
  )
  if (alreadyFiredThisWindow) return null

  const scandalMultiplier = game.currentSeasonSignature?.modifiers.scandalFrequencyMultiplier ?? 1.0
  if (rand() > SCANDAL_CHANCE_PER_WINDOW * scandalMultiplier) return null

  // Pick type first so club selection can depend on it
  const type = pickScandalType(rand)

  // municipal_scandal and small_absurdity can affect managed club
  const includeManaged = type === 'municipal_scandal' || type === 'small_absurdity'
  const club = pickAffectedClub(game, rand, includeManaged)
  if (!club) return null

  const triggerRound = nextMatchday

  let secondaryClubId: string | undefined
  if (type === 'club_to_club_loan') {
    const others = game.clubs.filter(c => c.id !== club.id && c.id !== game.managedClubId)
    if (others.length > 0) {
      secondaryClubId = others[Math.floor(rand() * others.length)].id
    }
  }

  const variant: Scandal['variant'] = type === 'municipal_scandal'
    ? (rand() < 0.5 ? 'negative' : 'positive')
    : undefined

  return {
    id: `scandal_${type}_s${game.currentSeason}_r${triggerRound}`,
    season: game.currentSeason,
    triggerRound,
    type,
    affectedClubId: club.id,
    secondaryClubId,
    resolutionRound: getResolutionRound(type, triggerRound),
    isResolved: false,
    variant,
  }
}

// ── Text ───────────────────────────────────────────────────────────────────

const SCANDAL_TEXT: Record<Exclude<ScandalType, 'small_absurdity'>, {
  titles: string[]
  bodies: string[]
  headlines: string[]
  coffeeRoom: string[]
  titlesPositive?: string[]
  bodiesPositive?: string[]
}> = {
  municipal_scandal: {
    titles: [
      '{POLITIKER} {PARTI}: "Bidraget till {KLUBB} omprövas"',
      'Granskning av {KLUBB}-bidraget — Uppdrag Granskning intresserade',
      'Kommunal markaffär ifrågasätts — {KLUBB} mitt i',
    ],
    bodies: [
      '{POLITIKER} {PARTI} har lämnat in motion om att se över kommunbidraget till {KLUBB}. "Vi har skola och omsorg som väntar." Beslut tas i nästa fullmäktige. Bidraget kan halveras.',
      'En lokal tidning har börjat nysta i hur {KLUBB} fick köpa kommunens fastighet förra året. Trottoarkanten som skiftade ägare i samma affär väcker frågor. Skatteverket har efterfrågat papper.',
      'Kommunen sålde en bit mark till {KLUBB} för en symbolisk summa. Oppositionen kräver utredning. "Det är inte första gången pengar rinner åt fel håll här", säger {POLITIKER} till lokalpressen.',
    ],
    titlesPositive: [
      '{POLITIKER} {PARTI}: "Vi satsar på {KLUBB}"',
      'Kommunen utökar bidraget till {KLUBB}',
      '{POLITIKER}: "Bandyn är stadens stolthet"',
    ],
    bodiesPositive: [
      '{POLITIKER} {PARTI} har fått igenom ett tilläggsbidrag till {KLUBB}. "Bandyn gör mer nytta än folk tror." Klubben bekräftar att pengarna är välkomna.',
      'Fullmäktige röstade ja till förstärkt kommunbidrag för {KLUBB}. {POLITIKER} drev frågan. "Det handlar om att hålla ihop orten."',
      'Kommunstyrelsen beslutade igår att öka det kommunala stödet till {KLUBB}. {POLITIKER} kallar det en naturlig investering i ortens framtid.',
    ],
    headlines: [
      '{KLUBB}-bidraget ifrågasätts: "Vart går pengarna?"',
      'Kommunens markaffär med {KLUBB} granskas',
      '{POLITIKER}: "Skola före bandy"',
    ],
    coffeeRoom: [
      'Vaktmästaren: "Hörde att {POLITIKER} vill dra bidraget."\nKioskvakten: "Det är {PARTI}, det."\nVaktmästaren: "Som om dom någonsin gillat oss."',
      'Ordföranden: "Tidningen har börjat ringa om markaffären."\nKassören: "Vad sa du?"\nOrdföranden: "Ingen kommentar."',
      'Materialaren: "Dom säger att vi fick fastigheten för billigt."\nVaktmästaren: "Trettio miljoner värd, en krona kostnad?"\nMaterialaren: "Och en trottoarkant."',
    ],
  },
  sponsor_collapse: {
    titles: [
      'Borgvik Bygg drar sig ur — söker ny sponsor',
      '{KLUBB}s sponsoravtal sägs upp i förtid',
      '30 000 borta — sponsorn lämnar',
    ],
    bodies: [
      'Borgvik Bygg AB har sagt upp sitt sponsoravtal med {KLUBB} med omedelbar verkan. Företagets VD har frivilligt lämnat efter en intern utredning. {KLUBB} mister 3 000 i veckan resten av säsongen — och letar redan ersättare.',
      '{KLUBB}s mindre sponsor avslutar samarbetet. Klubben kommenterar inte anledningen, men 30 000 är borta från säsongsbudgeten. "Vi söker", säger ordföranden.',
      'Telefonen ringde en gång på sportchefens kontor. Avtalet är uppsagt. Inte en stor sponsor — men ändå 30 000 borta från en redan tunn budget.',
    ],
    headlines: [
      '{KLUBB} utan en av sina sponsorer — "vi söker"',
      'Borgvik Bygg ut ur {KLUBB}-tröjan',
    ],
    coffeeRoom: [
      'Kassören: "Borgvik Bygg är ute."\nVaktmästaren: "Vad hände?"\nKassören: "VD:n slutade. Hela företaget skakar."',
      'Kioskvakten: "Sponsorlistan blev kortare."\nMaterialaren: "Mycket?"\nKioskvakten: "Räcker att märkas."',
    ],
  },
  treasurer_resigned: {
    titles: [
      '{KLUBB}s kassör avgick — transferaktivitet pausad',
      '"Personliga skäl" — {KLUBB} utan kassör',
      'Kassören borta, kontoret stängt',
    ],
    bodies: [
      '{KLUBB}s kassör har avgått efter 14 år. Klubben skriver "personliga skäl" i pressmeddelandet. Transferaktiviteten är pausad i tre omgångar medan en ny tar över räkenskaperna.',
      'Det stod ett kuvert på köksbordet, säger ordföranden. Kassören har slutat. {KLUBB} kan inte göra affärer förrän bokföringen är genomgången — det kommer ta tre omgångar.',
      '{KLUBB} bekräftar att kassören slutat. Klubben kommenterar inte vidare. Inga transfers genomförs förrän en ersättare är på plats — räkna med tre omgångar.',
    ],
    headlines: [],
    coffeeRoom: [
      'Kioskvakten: "{KLUBB}s kassör slutade på en dag."\nVaktmästaren: "Hur då?"\nKioskvakten: "Brev på köksbordet."',
    ],
  },
  phantom_salaries: {
    titles: [
      'Skatteverket granskar {KLUBB} — fantomlöner uppdagade',
      '{KLUBB} drar tillbaka två spelare från lönelista',
      'Spelare på pappret — Skatteverket nyfiken',
    ],
    bodies: [
      'Skatteverket har granskat {KLUBB}s lönelista. Två spelare har stått som anställda utan att ha spelat på två säsonger. Klubben förlorar 2 poäng den här säsongen och betalar tillbaka skatten.',
      '"Det var ett administrativt misstag", säger ordföranden i {KLUBB}. Skatteverket håller inte med. Två spelare har lyfts ur lönelistan i efterhand. 2 poäng dras från innevarande säsong.',
      '{KLUBB}s gamla kassör hade ett system där två spelare lönsattes utan att spela. Klubben säger att det var glömt. Skatteverket säger att det är skattebrott. 2 poäng går från säsongstabellen.',
    ],
    headlines: [
      '{KLUBB} fast i fantomlöner — 2 poäng bort',
      'Spelare på papper, lön på riktigt — {KLUBB} granskat',
    ],
    coffeeRoom: [
      'Kassören: "{KLUBB} hade två spelare som inte fanns."\nVaktmästaren: "Hur då?"\nKassören: "På lönelista. Inte på plan."',
      'Ordföranden: "Skatteverket är klart med {KLUBB}."\nMaterialaren: "Och?"\nOrdföranden: "Två poäng och tillbakabetalning."',
    ],
  },
  club_to_club_loan: {
    titles: [
      '{KLUBB} och {ANDRA_KLUBB} delade pengar — Förbundet utreder',
      'Pengaflyttar mellan grannklubbar — poängavdrag väntar',
      'Två klubbar, samma kommun, samma kassa',
    ],
    bodies: [
      '{KLUBB} och {ANDRA_KLUBB} har skiftat 600 000 mellan sig under hösten. Förbundet kallar det "kreativ bokföring". {ANDRA_KLUBB} får 3 poängs avdrag nästa säsong.',
      'Att stötta grannklubben är vacker tanke, säger Förbundet, men inte tillåten. Pengarna gick fram och tillbaka mellan {KLUBB} och {ANDRA_KLUBB} tre gånger. Det räckte för poängavdrag.',
      'Två klubbar i samma kommun. Samma styrelseledamot på båda kanslierna. Samma 800 000 som dök upp i båda kassorna. {ANDRA_KLUBB} betalar med 3 poäng nästa säsong.',
    ],
    headlines: [
      '{KLUBB}: Poängavdrag bekräftat',
      'RF utreder {KLUBB} — tre poäng på spel',
    ],
    coffeeRoom: [
      'Ordföranden: "Hörde att {KLUBB} och {ANDRA_KLUBB} har samma kassör."\nKassören: "Inte konstigt det rörde sig pengar."',
      'Vaktmästaren: "Förbundet kollade bokföringen i {ANDRA_KLUBB}."\nMaterialaren: "Och?"\nVaktmästaren: "Tre poäng nästa år."',
    ],
  },
  fundraiser_vanished: {
    titles: [
      'Insamlingen försvann — {KLUBB}-supportrar rasande',
      '300 000 borta, ingen vet vart',
      'Korv-pengarna förintades — {KLUBB} i kris',
    ],
    bodies: [
      'Supportrarna sålde korv hela hösten. Sammanlagt drogs det in 300 000 till nytt omklädningsrum hos {KLUBB}. Pengarna är borta. Ingen vet hur. Klacken vill ha svar — och styrelsen har inga.',
      '{KLUBB}s insamlingskonto är tomt. 300 000 från höstens korv- och lottinsamling har försvunnit. Klubben gör polisanmälan men supportrarna har redan börjat ifrågasätta hela styrelsen.',
      'Det skulle bli ett nytt golv i omklädningsrummet. Det blir det inte. Insamlingen i {KLUBB} är tom — 300 000 är borta sedan i förra månaden, och styrelsen kan inte förklara vart.',
    ],
    headlines: [
      '{KLUBB}: Insamlingsskandal skakar orten',
      'Pengarna försvann — {KLUBB} i blåsväder',
    ],
    coffeeRoom: [
      'Kioskvakten: "Korven på Stålvallen var bortkastad."\nVaktmästaren: "Vad menar du?"\nKioskvakten: "Pengarna försvann från kontot."',
      'Materialaren: "Klacken i {KLUBB} kräver svar."\nVaktmästaren: "Och styrelsen?"\nMaterialaren: "Polisanmälan. Inget mer."',
    ],
  },
  coach_meltdown: {
    titles: [
      '{KLUBB}s tränare avgick — "personliga skäl"',
      'Tränarbyte i {KLUBB} efter en längre period',
      '{KLUBB}s tränare tar paus — assisterande tränare tar över',
    ],
    bodies: [
      '{KLUBB}s tränare har lämnat klubben. Klubben skriver "personliga skäl" i pressmeddelandet och vill inte säga mer. En kollega som ringt redaktionen säger att "han söker hjälp nu, det är det viktiga". Assisterande tränare tar över i fyra omgångar. Form -15% under perioden.',
      'Det har varit oroligt en längre tid kring {KLUBB}s tränare. Sena ankomster, en match utan honom på bänken, tystnad om varför. Nu meddelar klubben att han tar paus. Ingen säger vad. Det behövs inte. Form -15% i fyra omgångar medan assisterande tränare leder.',
      'Det blev en sak att inte prata om i {KLUBB}. Spelarna märkte det först. Sen styrelsen. Nu är tränaren borta. "Han behöver tid", säger ordföranden, och alla förstår vad det betyder. Assisterande tränare leder laget i fyra omgångar.',
    ],
    headlines: [
      '{KLUBB} byter tränare — "personliga skäl"',
      'Tränaren i {KLUBB} tar paus',
    ],
    coffeeRoom: [
      'Vaktmästaren: "{KLUBB}s tränare är borta."\nKioskvakten: "Hörde det. Visste väl alla."\nVaktmästaren: "Hoppas han fixar det."',
      'Materialaren: "Han var inte på bänken förra matchen heller."\nKassören: "Andra gången på en månad."\nMaterialaren: "Tredje."',
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
  politician?: { name: string; party: string },
): string {
  let result = text
    .replace(/{KLUBB}/g, club.name)
    .replace(/{club}/g, club.name)
    .replace(/{city}/g, club.name.split(' ').slice(-1)[0])
    .replace(/{ANDRA_KLUBB}/g, secondaryClub?.name ?? 'grannklubben')
    .replace(/{secondaryClub}/g, secondaryClub?.name ?? 'grannklubben')
  if (politician) {
    result = result
      .replace(/{POLITIKER}/g, politician.name)
      .replace(/{PARTI}/g, `(${politician.party})`)
  }
  return result
}

function resolvePolitician(
  game: SaveGame,
  clubId: string,
  rand: () => number,
): { name: string; party: string } {
  if (clubId === game.managedClubId && game.localPolitician) {
    return { name: game.localPolitician.name, party: game.localPolitician.party }
  }
  const profile = POLITICIAN_PROFILES[Math.floor(rand() * POLITICIAN_PROFILES.length)]
  return {
    name: `${profile.first} ${profile.last}`,
    party: profile.party.replace(/[()]/g, ''),
  }
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
  let updatedClubs = [...game.clubs]
  const pointDeductions: Record<string, number> = { ...(game.pointDeductions ?? {}) }
  const pendingPointDeductions: Record<string, number> = { ...(game.pendingPointDeductions ?? {}) }
  const inboxItems: InboxItem[] = []

  // small_absurdity: no inbox, no mechanic (data-driven by smallAbsurditiesData)
  if (scandal.type === 'small_absurdity') {
    return { updatedClubs, inboxItems, pointDeductions, pendingPointDeductions }
  }

  const politician = scandal.type === 'municipal_scandal'
    ? resolvePolitician(game, scandal.affectedClubId, rand)
    : undefined

  const text = SCANDAL_TEXT[scandal.type]
  const isPositiveMunicipal = scandal.type === 'municipal_scandal' && scandal.variant === 'positive'

  const titlePool = isPositiveMunicipal && text.titlesPositive ? text.titlesPositive : text.titles
  const bodyPool  = isPositiveMunicipal && text.bodiesPositive  ? text.bodiesPositive  : text.bodies

  const title = fillTemplate(pick(titlePool, rand), club, secondaryClub, politician)
  const body  = fillTemplate(pick(bodyPool, rand),  club, secondaryClub, politician)

  // Apply mechanical effects
  switch (scandal.type) {
    case 'sponsor_collapse': {
      updatedClubs = updatedClubs.map(c =>
        c.id === scandal.affectedClubId ? { ...c, finances: c.finances - 30_000 } : c,
      )
      break
    }
    case 'club_to_club_loan': {
      const prev = pendingPointDeductions[scandal.affectedClubId] ?? 0
      pendingPointDeductions[scandal.affectedClubId] = prev + 3
      break
    }
    case 'treasurer_resigned': {
      // Transfer freeze tracked via resolutionRound in isTransferFrozen()
      break
    }
    case 'phantom_salaries': {
      const prev = pointDeductions[scandal.affectedClubId] ?? 0
      pointDeductions[scandal.affectedClubId] = prev + 2
      break
    }
    case 'fundraiser_vanished': {
      updatedClubs = updatedClubs.map(c =>
        c.id === scandal.affectedClubId ? { ...c, reputation: Math.max(0, c.reputation - 8) } : c,
      )
      break
    }
    case 'coach_meltdown': {
      updatedClubs = updatedClubs.map(c =>
        c.id === scandal.affectedClubId ? { ...c, reputation: Math.max(0, c.reputation - 5) } : c,
      )
      break
    }
    case 'municipal_scandal': {
      const kommunBidrag = scandal.affectedClubId === game.managedClubId
        ? (game.localPolitician?.kommunBidrag ?? 30_000)
        : 30_000
      const delta = isPositiveMunicipal
        ? Math.round(kommunBidrag * 0.2)
        : -Math.round(kommunBidrag * 0.3)
      updatedClubs = updatedClubs.map(c =>
        c.id === scandal.affectedClubId ? { ...c, finances: c.finances + delta } : c,
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

  // Coffee room quote
  if (text.coffeeRoom.length > 0) {
    const quote = fillTemplate(pick(text.coffeeRoom, rand), club, secondaryClub, politician)
    inboxItems.push({
      id: `${scandal.id}_cr`,
      date: game.currentDate,
      type: InboxItemType.Scandal,
      title: 'Kafferummet',
      body: quote,
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
