import type { SaveGame, ClubEra } from '../entities/SaveGame'
import { PlayerPosition } from '../enums'
import { getCharacterName } from './supporterService'
import { calculateClubEra } from './clubEraService'
import { mulberry32 } from '../utils/random'

export type WeeklyDecisionCategory = 'player' | 'supporter' | 'training' | 'community'

export interface WeeklyDecisionOption {
  label: string
  effect: string
  effectColor?: 'success' | 'danger' | 'muted'
}

export interface WeeklyDecision {
  id: string
  question: string
  optionA: WeeklyDecisionOption
  optionB: WeeklyDecisionOption
  category: WeeklyDecisionCategory
  requiredEra?: ClubEra[]
  systemhandelse?: boolean  // O19 (SLUTTEST_KO.md): uppfyller varsel-mallens fem kriterier
                              // (DOM_VARSLET_SOM_SYSTEMMALL_2026-08-17.md). Ren datamärkning —
                              // ingen räknare/cooldown/säsongsbudget läser fältet ännu.
}

export type WeeklyDecisionEffect =
  | { type: 'cornerSkill'; playerId: string; delta: number }
  | { type: 'cornerRecovery'; playerId: string; delta: number }
  | { type: 'morale'; playerId: string; delta: number }
  | { type: 'fitness'; playerId: string; delta: number }
  | { type: 'finances'; delta: number }
  | { type: 'supporterMood'; delta: number }
  | { type: 'communityStanding'; delta: number }
  | { type: 'boardPatience'; delta: number }
  | { type: 'scoutNextOpponent' }
  | { type: 'noop' }

export interface WeeklyDecisionResolution {
  decision: WeeklyDecision
  chosenOption: 'A' | 'B'
  effects: WeeklyDecisionEffect[]
}

// ── Decision pool generators ────────────────────────────────────────────────

function makeDecisions(game: SaveGame): WeeklyDecision[] {
  const leader  = getCharacterName(game, 'leader')
  const veteran = getCharacterName(game, 'veteran')
  const youth   = getCharacterName(game, 'youth')
  const family  = getCharacterName(game, 'family')
  const sg      = game.supporterGroup
  const groupName = sg?.name ?? 'Klacken'

  // Pick a forward with high cornerSkill if available
  const forwards = game.players.filter(p =>
    p.clubId === game.managedClubId &&
    p.position !== PlayerPosition.Goalkeeper && p.attributes.cornerSkill > 60
  )
  const cornerCandidate = forwards.sort((a, b) => b.attributes.cornerSkill - a.attributes.cornerSkill)[0]
  const candidateName = cornerCandidate
    ? `${cornerCandidate.firstName[0]}. ${cornerCandidate.lastName}`
    : 'en spelare'

  // Pick a player with low morale for the weekend-off decision
  const lowMoralePlayers = game.players.filter(p =>
    p.clubId === game.managedClubId && p.form < 40
  )
  const wearyPlayer = lowMoralePlayers[0]
  const wearyName = wearyPlayer
    ? `${wearyPlayer.firstName[0]}. ${wearyPlayer.lastName}`
    : 'en spelare'

  // Opponent name for away trip
  const nextAway = game.fixtures.find(f =>
    f.status === 'scheduled' && f.awayClubId === game.managedClubId
  )
  const awayOpponent = nextAway
    ? (game.clubs.find(c => c.id === nextAway.homeClubId)?.name ?? 'motståndarens hemmaarena')
    : 'nästa bortematch'

  const decisions: WeeklyDecision[] = [
    // — Player decisions —
    {
      id: 'corner_extra_training',
      category: 'player',
      question: `${candidateName} vill öva hörnskott efter träningen. Extra pass?`,
      optionA: { label: 'Tillåt', effect: '+3 hörnskicklighet', effectColor: 'success' },
      optionB: { label: 'Neka', effect: 'Ingen effekt', effectColor: 'muted' },
    },
    {
      id: 'player_weekend_off',
      category: 'player',
      question: `${wearyName} vill åka hem till familjen över helgen.`,
      optionA: { label: 'Ja, åk', effect: '−1 kondition · +5 moral', effectColor: 'success' },
      optionB: { label: 'Neka', effect: '−3 moral', effectColor: 'danger' },
    },
    // — Supporter decisions —
    {
      id: 'away_trip_bus',
      category: 'supporter',
      question: `${leader} har hyrt en buss till ${awayOpponent}. ${veteran} har redan bokat sin plats. Bidra med 3 000 kr?`,
      optionA: { label: 'Bidra', effect: '−3 tkr · +bortasupport', effectColor: 'success' },
      optionB: { label: 'Låt dem ordna', effect: `−5 ${groupName}-stämning`, effectColor: 'danger' },
      systemhandelse: true,  // O19: 5/5 i DOM_VARSLET_KLASSIFICERING_2026-08-17.md
    },
    {
      id: 'tifo_contribution',
      category: 'supporter',
      question: `${youth} vill arrangera tifo till nästa hemmamatch. Bidra med 2 000 kr?`,
      optionA: { label: 'Bidra', effect: '−2 tkr · +supporterstämning', effectColor: 'success' },
      optionB: { label: 'Neka', effect: '−5 supporterstämning', effectColor: 'danger' },
      systemhandelse: true,  // O19: 5/5 i DOM_VARSLET_KLASSIFICERING_2026-08-17.md
    },
    {
      id: 'supporter_conflict_mediate',
      category: 'supporter',
      question: `${leader}: "${veteran} och ${youth} bråkar om musiken igen. Kan du säga något?"`,
      optionA: { label: 'Medla', effect: '+stämning · alla nöjda', effectColor: 'success' },
      optionB: { label: 'Låt dem lösa det', effect: '50/50 chans', effectColor: 'muted' },
    },
    {
      id: 'reporter_klacken',
      category: 'supporter',
      question: `Tidningen vill göra ett reportage om ${groupName}. ${leader} säger ja — men frågar om du godkänner.`,
      optionA: { label: 'Tillåt', effect: '+3 kommunstatus', effectColor: 'success' },
      optionB: { label: 'Neka', effect: '−3 kommunstatus', effectColor: 'danger' },
    },
    // — Training decisions —
    {
      id: 'training_corners_vs_matchprep',
      category: 'training',
      question: 'Bara tid för ett: extra hörnträning eller matchförberedelse?',
      optionA: { label: 'Hörnor', effect: '+hörnskicklighet', effectColor: 'success' },
      optionB: { label: '📋 Matchprep', effect: '+hörnförsvar (sårbar back)', effectColor: 'success' },
    },
    {
      id: 'scout_opponent_corners',
      category: 'training',
      question: 'Scouten vill studera motståndarens hörnförsvar inför helgen.',
      optionA: { label: 'Ja', effect: '−1 scout · analys av nästa motståndare', effectColor: 'success' },
      optionB: { label: 'Spara scouten', effect: 'Ingen effekt', effectColor: 'muted' },
    },
    // — Community decisions —
    {
      id: 'ismaskin_offer',
      category: 'community',
      // O20 (2026-08-21, Opus): K2-textbeslutet ur DOM_VARSLET_KLASSIFICERING —
      // kravet får ett namngivet mål (veteranen) i texten. Effekterna orörda.
      // Påståendesvepet #25 (2026-08-24), Jacobs dom 2026-08-26: "tre vintrar"
      // struket — ingen tjänstetidsräknare finns för funktionärer (game.
      // supporterGroup.founded mäter klackens ålder, inte HANS, och hade gett
      // falsk precision — farligare än en hårdkodad trea). "Många vintrar"
      // säger det som betyder något (han har gjort det länge, han är veteran)
      // utan att påstå ett tal ingen data backar. Se BACKLOG.md för den
      // saknade tjänstetidsräknaren (samma lucka som "år i klubben"/O18 fält 3).
      question: `Kommunen erbjuder en begagnad ismaskin för 15 000 kr. ${veteran} har spolat isen för hand i många vintrar och frågar varje vecka när maskinen kommer.`,
      optionA: { label: 'Köp den', effect: '−15 tkr · +kommunstatus', effectColor: 'success' },
      optionB: { label: 'Tacka nej', effect: 'Ingen effekt', effectColor: 'muted' },
    },
    {
      id: 'family_section_request',
      category: 'community',
      question: `${family}: "Kan vi få en tydligare familjeplats på läktaren? Barnen behöver en lugn sida."`,
      optionA: { label: 'Ordna det', effect: '+kommunstatus · +stämning', effectColor: 'success' },
      optionB: { label: 'Inte nu', effect: `${family} besviken`, effectColor: 'danger' },
    },

    // ── Era-gated: legacy only ───────────────────────────────────────────────
    {
      id: 'legacy_naming_arena',
      category: 'community',
      requiredEra: ['legacy'],
      question: `Kommunen vill döpa om arenan efter en lokal sponsor. ${veteran} är emot. Acceptera?`,
      optionA: { label: 'Acceptera', effect: '+20 tkr engång · −stolthet', effectColor: 'success' },
      optionB: { label: 'Behåll namnet', effect: `+${groupName}-stämning · −boardpatience`, effectColor: 'muted' },
      systemhandelse: true,  // O19: 5/5 i DOM_VARSLET_KLASSIFICERING_2026-08-17.md
    },
    {
      id: 'legacy_youth_showcase',
      category: 'player',
      requiredEra: ['legacy'],
      question: `En regional TV-kanal vill sända er akademimatchen. ${leader} vill att ni ställer upp.`,
      optionA: { label: 'Ställ upp', effect: '+kommunstatus', effectColor: 'success' },
      optionB: { label: 'Inte nu', effect: 'Ingen effekt', effectColor: 'muted' },
    },

    // ── Era-gated: survival only ─────────────────────────────────────────────
    {
      id: 'survival_wage_freeze',
      category: 'player',
      requiredEra: ['survival'],
      question: 'Kassören föreslår lönestopp — inga nya kontrakt under månaden för att täcka underskott.',
      optionA: { label: 'Godkänn', effect: '+styrelsens tålamod · −supporterstämning', effectColor: 'danger' },
      optionB: { label: 'Neka', effect: '−boardpatience · spelarna trygga', effectColor: 'muted' },
    },
    {
      id: 'survival_emergency_lotto',
      category: 'community',
      requiredEra: ['survival'],
      question: `${leader} vill starta ett 50-50-lotteri vid hemmamatcherna. Halva potten till vinnaren, resten till att starta en ungdomsklack.`,
      optionA: { label: 'Kör igång', effect: '+5 tkr · +klackstämning', effectColor: 'success' },
      optionB: { label: 'Inte nu', effect: `${leader} besviken`, effectColor: 'muted' },
    },
  ]

  return decisions
}

// ── Public API ───────────────────────────────────────────────────────────────

const WEEKLY_DECISION_COOLDOWN = 3  // minimum rounds between decisions

export function generateWeeklyDecision(game: SaveGame, round: number): WeeklyDecision | null {
  if (round < 1) return null

  // Don't generate a new decision while one is still pending (user hasn't answered yet)
  if (game.pendingWeeklyDecision) return null

  // Don't generate a new decision if one was just generated within the cooldown window
  const lastRound = game.weeklyDecisionLastRound ?? 0
  if (lastRound > 0 && round - lastRound < WEEKLY_DECISION_COOLDOWN) return null

  const pool = makeDecisions(game)
  const resolved = game.resolvedWeeklyDecisions ?? []
  const currentEra = game.currentEra ?? calculateClubEra(game)

  // PC-2: corner-besluten kräver en cornerCandidate (cornerSkill > 60) för att ge effekt —
  // annars blir A-valet en silent noop trots att labeln lovar effekt. Dölj dem då.
  const hasCornerCandidate = game.players.some(p =>
    p.clubId === game.managedClubId && p.position !== PlayerPosition.Goalkeeper && p.attributes.cornerSkill > 60,
  )

  // Throw-guard (SLUTTEST_KO.md, 2026-08-17, samma mönster som eventResolver.ts:s
  // vakt): player_weekend_off kräver en wearyPlayer (form < 40) för att ge effekt
  // i BÅDA valen — denna filtreringen SAKNADES (till skillnad från corner-besluten
  // ovan, som redan var skyddade av PC-2). Utan den kunde beslutet visas och
  // resolveWeeklyDecision:s tidigare tysta noop-fallback dölja att löftet
  // ("−1 kondition · +5 moral" / "−3 moral") aldrig levererades.
  const hasWearyPlayer = game.players.some(p =>
    p.clubId === game.managedClubId && p.form < 40 && p.position !== PlayerPosition.Goalkeeper,
  )

  // Filter out already-resolved decisions, era-incompatible ones, och beslut vars
  // utlovade effekt inte kan realiseras (PC-2 corner, PC-3 scout utan budget).
  const available = pool.filter(d => {
    if (resolved.includes(`${d.id}_${game.currentSeason}`)) return false
    if (d.requiredEra && !d.requiredEra.includes(currentEra)) return false
    if ((d.id === 'corner_extra_training' || d.id === 'training_corners_vs_matchprep') && !hasCornerCandidate) return false
    if (d.id === 'player_weekend_off' && !hasWearyPlayer) return false
    if (d.id === 'scout_opponent_corners' && (game.scoutBudget ?? 0) === 0) return false
    return true
  })
  if (available.length === 0) return null

  // Pick deterministically by round + season
  const idx = (round * 13 + game.currentSeason * 7) % available.length
  return available[idx]
}

export function resolveWeeklyDecision(
  game: SaveGame,
  decision: WeeklyDecision,
  choice: 'A' | 'B',
): WeeklyDecisionEffect[] {
  const option = choice === 'A' ? decision.optionA : decision.optionB
  void option

  // Find the corner candidate player
  const cornerCandidate = game.players
    .filter(p => p.clubId === game.managedClubId && p.position !== PlayerPosition.Goalkeeper && p.attributes.cornerSkill > 60)
    .sort((a, b) => b.attributes.cornerSkill - a.attributes.cornerSkill)[0]

  const wearyPlayer = game.players
    .filter(p => p.clubId === game.managedClubId && p.form < 40 && p.position !== PlayerPosition.Goalkeeper)[0]

  // Mest motanfalls-sårbara backen (lägst cornerRecovery) — matchprep-beslutets mål.
  const weakRecoveryDefender = game.players
    .filter(p => p.clubId === game.managedClubId && p.position !== PlayerPosition.Goalkeeper)
    .sort((a, b) => (a.attributes.cornerRecovery ?? 50) - (b.attributes.cornerRecovery ?? 50))[0]

  switch (decision.id) {
    case 'corner_extra_training':
      // Throw-guard (SLUTTEST_KO.md, 2026-08-17): generateWeeklyDecision döljer
      // detta beslutet när ingen cornerCandidate finns (PC-2) — når koden hit
      // ändå är det ett brutet kontrakt, inte ett normalt no-op-läge. Samma
      // disciplin som eventResolver.ts:s vakt: gör det högt, inte tyst.
      if (choice === 'A' && !cornerCandidate)
        throw new Error("weeklyDecision 'corner_extra_training' val A saknar cornerCandidate — generateWeeklyDecision:s PC-2-filter borde ha dolt beslutet")
      if (choice === 'A' && cornerCandidate)
        return [{ type: 'cornerSkill', playerId: cornerCandidate.id, delta: 3 }]
      return [{ type: 'noop' }]

    case 'player_weekend_off':
      // Throw-guard (SLUTTEST_KO.md, 2026-08-17): samma disciplin — filtret
      // (hasWearyPlayer ovan i generateWeeklyDecision) ska ha dolt beslutet.
      if (!wearyPlayer)
        throw new Error("weeklyDecision 'player_weekend_off' saknar wearyPlayer — generateWeeklyDecision:s hasWearyPlayer-filter borde ha dolt beslutet")
      // PC-1: A lovar "−1 kondition · +5 moral" — returnera båda (kondition saknades).
      if (choice === 'A')
        return [{ type: 'morale', playerId: wearyPlayer.id, delta: 5 }, { type: 'fitness', playerId: wearyPlayer.id, delta: -1 }]
      return [{ type: 'morale', playerId: wearyPlayer.id, delta: -3 }]

    case 'away_trip_bus':
      if (choice === 'A')
        return [{ type: 'finances', delta: -3000 }, { type: 'supporterMood', delta: 8 }]
      return [{ type: 'supporterMood', delta: -5 }]

    case 'tifo_contribution':
      if (choice === 'A')
        return [{ type: 'finances', delta: -2000 }, { type: 'supporterMood', delta: 6 }]
      return [{ type: 'supporterMood', delta: -5 }]

    case 'supporter_conflict_mediate':
      if (choice === 'A')
        return [{ type: 'supporterMood', delta: 5 }]
      // 50/50
      return [{ type: 'supporterMood', delta: mulberry32(game.currentMatchday * 9301 + decision.id.length * 37)() < 0.5 ? 3 : -4 }]

    case 'reporter_klacken':
      if (choice === 'A')
        return [{ type: 'communityStanding', delta: 3 }]
      return [{ type: 'communityStanding', delta: -2 }]

    case 'training_corners_vs_matchprep':
      // Throw-guard (SLUTTEST_KO.md, 2026-08-17): choice A delar samma
      // PC-2-filter (hasCornerCandidate) som corner_extra_training.
      if (choice === 'A' && !cornerCandidate)
        throw new Error("weeklyDecision 'training_corners_vs_matchprep' val A saknar cornerCandidate — generateWeeklyDecision:s PC-2-filter borde ha dolt beslutet")
      if (choice === 'A')
        return [{ type: 'cornerSkill', playerId: cornerCandidate!.id, delta: 2 }]
      // Fynd 11: B = matchprep → hörnförsvar. Höj cornerRecovery på den mest
      // motanfalls-sårbara backen (matchCore läser cornerRecovery direkt på
      // post-corner-kontringen). Permanent +2, symmetriskt med A:s +cornerSkill —
      // INTE en leadershipActions-effekt, för motorn läser inte leadershipActions
      // under match (skulle bli en no-op).
      // weakRecoveryDefender kräver bara "något fältspelare finns" (inget
      // tröskelvillkor som cornerCandidate/wearyPlayer) — praktiskt taget alltid
      // sant i en riktig trupp, men vakten skyddar ändå det degenererade fallet.
      if (!weakRecoveryDefender)
        throw new Error("weeklyDecision 'training_corners_vs_matchprep' val B saknar en fältspelare att rikta cornerRecovery mot")
      return [{ type: 'cornerRecovery', playerId: weakRecoveryDefender.id, delta: 2 }]

    case 'scout_opponent_corners':
      // Fynd 11: A = scouta nästa motståndare. Detaljerad analys är gated bakom
      // scoutbudget (requestDetailedAnalysis) — beslutet drar en scout och genererar
      // analysen, som dyker upp på matchförberedelsen. Appliceras i gameFlowActions.
      if (choice === 'A')
        return [{ type: 'scoutNextOpponent' }]
      return [{ type: 'noop' }]

    case 'ismaskin_offer':
      if (choice === 'A')
        return [{ type: 'finances', delta: -15000 }, { type: 'communityStanding', delta: 4 }]
      return [{ type: 'noop' }]

    case 'family_section_request':
      if (choice === 'A')
        return [{ type: 'communityStanding', delta: 3 }, { type: 'supporterMood', delta: 4 }]
      return [{ type: 'supporterMood', delta: -3 }]

    case 'legacy_naming_arena':
      if (choice === 'A')
        return [{ type: 'finances', delta: 20_000 }, { type: 'supporterMood', delta: -6 }]
      return [{ type: 'supporterMood', delta: 5 }, { type: 'boardPatience', delta: -3 }]

    case 'legacy_youth_showcase':
      if (choice === 'A')
        return [{ type: 'communityStanding', delta: 4 }]
      return [{ type: 'noop' }]

    case 'survival_wage_freeze':
      if (choice === 'A')
        return [{ type: 'boardPatience', delta: 6 }, { type: 'supporterMood', delta: -4 }]
      return [{ type: 'boardPatience', delta: -4 }]

    case 'survival_emergency_lotto':
      if (choice === 'A')
        return [{ type: 'finances', delta: 5_000 }, { type: 'supporterMood', delta: 3 }]
      return [{ type: 'supporterMood', delta: -2 }]

    default:
      return [{ type: 'noop' }]
  }
}
