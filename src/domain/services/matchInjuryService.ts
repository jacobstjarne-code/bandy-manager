import type { Player } from '../entities/Player'
import type { InboxItem } from '../entities/Inbox'
import { InboxItemType } from '../enums'
import { WeatherCondition } from '../enums'
import type { Weather } from '../entities/Weather'
import type { Tactic } from '../entities/Club'
import { TacticTempo, TacticPress } from '../enums'

// ── Types ────────────────────────────────────────────────────────────────────
//
// Frekvenser kalibrerade mot Linnéstudien 2014 (Skador inom bandy, retrospektiv
// 2007-2012): ansiktsskador står för ~33% av alla registrerade skador i bandy.
// Lårkaka/blåmärken är den vanligaste lätta skadan, ofta från blockerade skott.

export type MatchInjuryType =
  | 'skenan'                // hälsena/achilles, ~1/500, 30-45 v
  | 'fall_pa_is'            // handled/axel från fall, ~1/40, 2-4 v
  | 'larkaka'               // blåmärke/lårkaka från blockerat skott, ~1/8, 0-1 v
  | 'boll_i_ansiktet'       // bruten näsa/tand, ~1/15, 0-1 v (exkluderas < 18 år)
  | 'muskel_overbelastning' // ljumske/lår/vad, ~1/25, 2-5 v
  | 'hjarnskakning'         // ~1/100, 1-2 v

export interface MatchInjuryEvent {
  playerId: string
  type: MatchInjuryType
  minute: number
  weeksOut: number
  requiresSubstitution: boolean
  description: string
}

// ── Base rates and durations ─────────────────────────────────────────────────

const INJURY_BASE_RATES: Record<MatchInjuryType, number> = {
  skenan:                1 / 500,
  fall_pa_is:            1 / 40,
  larkaka:               1 / 8,
  boll_i_ansiktet:       1 / 15,
  muskel_overbelastning: 1 / 25,
  hjarnskakning:         1 / 100,
}

const INJURY_WEEKS: Record<MatchInjuryType, [number, number]> = {
  skenan:                [30, 45],
  fall_pa_is:            [2, 4],
  larkaka:               [0, 1],
  boll_i_ansiktet:       [0, 1],
  muskel_overbelastning: [2, 5],
  hjarnskakning:         [1, 2],
}

// ── Commentary pools ─────────────────────────────────────────────────────────
// Token SPELAREN ersätts med spelarens fulla namn. Visas i live-feeden.

const INJURY_COMMENTARY: Record<MatchInjuryType, string[]> = {
  skenan: [
    'SPELAREN går ner direkt. Håller om vaden, reser sig inte. Det ser illa ut.',
    'SPELAREN stannar tvärt mitt i en acceleration. Greppar bakom hasen. Bänken reser sig.',
  ],
  fall_pa_is: [
    'SPELAREN snavar vid sargen och landar på axeln. Reser sig långsamt, håller armen nära kroppen.',
    'SPELAREN halkar i en vändning och tar emot sig med handen. Handleden sväller direkt.',
  ],
  larkaka: [
    'SPELAREN tar emot ett skott med låret. Storknar av smärtan men reser sig, spelar vidare.',
    'SPELAREN blockerar med utsidan och haltar till nästa byte. Det kommer bli blått imorgon.',
  ],
  boll_i_ansiktet: [
    'SPELAREN får bollen rakt i ansiktet utan galler. Blod direkt. Handduk på väg.',
    'Hårt skott som studsar upp i ansiktet på SPELAREN. Näsan blir inte densamma idag.',
  ],
  muskel_overbelastning: [
    'SPELAREN bromsar upp, försöker gå vidare men haltar tydligt. Signalerar till bänken.',
    'SPELAREN tar sig för låret mitt i en acceleration. Det räcker för honom idag.',
  ],
  hjarnskakning: [
    'SPELAREN blir stående en stund efter krocken. Blinkar. Sjukvårdaren kommer ut.',
    'Kollision mellan SPELAREN och motspelaren — skalle mot skalle. Protokollet börjar direkt.',
  ],
}

// ── Context for injury check ─────────────────────────────────────────────────

export interface InjuryCheckContext {
  player: Player
  minute: number
  isGoalkeeperInjury: boolean
  weather?: Weather
  isDerby?: boolean
  playerMorale?: number
  tactic?: Tactic
}

// ── Core functions ───────────────────────────────────────────────────────────

export function checkForMatchInjury(
  ctx: InjuryCheckContext,
  rand: () => number,
): MatchInjuryEvent | null {
  const { player, minute, isGoalkeeperInjury, weather, isDerby, playerMorale, tactic } = ctx

  // Weather multiplier
  const weatherMult = weather?.condition === WeatherCondition.HeavySnow
    || weather?.condition === WeatherCondition.Thaw ? 1.5 : 1.0

  // Derby multiplier
  const derbyMult = isDerby ? 1.3 : 1.0

  // Low morale multiplier
  const moraleMult = (playerMorale !== undefined && playerMorale < 40) ? 1.2 : 1.0

  // Aggressive tactic multiplier
  const isAggressive = tactic?.tempo === TacticTempo.High && tactic?.press === TacticPress.High
  const tacticMult = isAggressive ? 1.25 : 1.0

  // Player injury proneness
  const pronenessMult = 0.5 + (player.injuryProneness ?? 50) / 100

  const totalMult = weatherMult * derbyMult * moraleMult * tacticMult * pronenessMult

  // Build eligible injury pool
  const eligible: MatchInjuryType[] = isGoalkeeperInjury
    ? ['boll_i_ansiktet']
    : (Object.keys(INJURY_BASE_RATES) as MatchInjuryType[]).filter(t =>
        !(t === 'boll_i_ansiktet' && player.age < 18)
      )

  for (const type of eligible) {
    const rate = INJURY_BASE_RATES[type] * totalMult
    if (rand() < rate) {
      const [minW, maxW] = INJURY_WEEKS[type]
      const weeksOut = minW + Math.floor(rand() * (maxW - minW + 1))
      const templates = INJURY_COMMENTARY[type]
      const rawDesc = templates[Math.floor(rand() * templates.length)]
      const description = rawDesc.replace(/SPELAREN/g, player.firstName + ' ' + player.lastName)

      return {
        playerId: player.id,
        type,
        minute,
        weeksOut,
        requiresSubstitution: weeksOut > 1,
        description,
      }
    }
  }

  return null
}

export function applyMatchInjury(player: Player, event: MatchInjuryEvent): Player {
  return {
    ...player,
    isInjured: event.weeksOut > 0,
    injuryDaysRemaining: event.weeksOut * 7,
  }
}

// ── Inbox items ──────────────────────────────────────────────────────────────

const INJURY_INBOX_BODY: Record<MatchInjuryType, string> = {
  skenan: 'Ortopeden bekräftar: hälsenan är av. Det är den stora skadan i bandy och lika tung varje gång. Operation på måndag, sedan lång väg tillbaka. Han är ung — kroppen läker, men man ska vara ärlig: det blir inte samma spelare som kommer tillbaka.',
  fall_pa_is: 'Röntgen visar en spricka i handleden. Gips i tre veckor, sedan rehab. Inget dramatiskt — men det tar sin tid, handleden används till allt.',
  larkaka: 'Stor lårkaka efter blockerat skott. Det ser värre ut än det är — is och stretching ikväll, massage imorgon. Han borde vara tillbaka redan nästa match.',
  boll_i_ansiktet: 'Näsan är bruten. Tandläkare på lördag för att kolla de två framtänderna. Om allt ser bra ut är han tillbaka nästa omgång — med galler.',
  muskel_overbelastning: 'Klassisk överbelastning i ljumsken. Vila och is, inga genvägar. De som försöker komma tillbaka för tidigt får det värre andra gången.',
  hjarnskakning: 'Hjärnskakningsprotokollet gäller. Ingen fysisk belastning på tio dagar, sedan stegvis uppbyggnad. Han mår bra nu, men symptomen kan komma senare.',
}

export function generateInjuryInboxItem(
  player: Player,
  event: MatchInjuryEvent,
  season: number,
  round: number,
): InboxItem {
  const title = `${player.firstName} ${player.lastName} — matchskada (${event.weeksOut === 0 ? 'blåmärke' : `${event.weeksOut} v borta`})`
  const body = INJURY_INBOX_BODY[event.type]

  return {
    id: `injury_${player.id}_${season}_${round}`,
    date: new Date().toISOString().slice(0, 10),
    type: InboxItemType.Injury,
    title,
    body,
    relatedPlayerId: player.id,
    isRead: false,
    fromRole: 'Medicinsk stab',
  }
}
