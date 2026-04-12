import type { SaveGame } from '../entities/SaveGame'
import { PlayerPosition } from '../enums'
import { getCharacterName } from './supporterService'

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
}

export type WeeklyDecisionEffect =
  | { type: 'cornerSkill'; playerId: string; delta: number }
  | { type: 'morale'; playerId: string; delta: number }
  | { type: 'finances'; delta: number }
  | { type: 'supporterMood'; delta: number }
  | { type: 'communityStanding'; delta: number }
  | { type: 'boardPatience'; delta: number }
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
      optionA: { label: 'Tillåt', effect: '+3 hörnskill', effectColor: 'success' },
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
    },
    {
      id: 'tifo_contribution',
      category: 'supporter',
      question: `${youth} vill arrangera tifo till nästa hemmamatch. Bidra med 2 000 kr?`,
      optionA: { label: 'Bidra', effect: '−2 tkr · +hemmabonus', effectColor: 'success' },
      optionB: { label: 'Neka', effect: '−5 klack-stämning', effectColor: 'danger' },
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
      optionB: { label: 'Neka', effect: '−journalist-rel', effectColor: 'danger' },
    },
    // — Training decisions —
    {
      id: 'training_corners_vs_matchprep',
      category: 'training',
      question: 'Bara tid för ett: extra hörnträning eller matchförberedelse?',
      optionA: { label: '🏒 Hörnor', effect: '+cornerSkill', effectColor: 'success' },
      optionB: { label: '📋 Matchprep', effect: '+positionering', effectColor: 'success' },
    },
    {
      id: 'scout_opponent_corners',
      category: 'training',
      question: 'Scouten vill studera motståndarens hörnförsvar inför helgen.',
      optionA: { label: 'Ja', effect: '−1 scout · +taktikinsikt', effectColor: 'success' },
      optionB: { label: 'Spara scouten', effect: 'Ingen effekt', effectColor: 'muted' },
    },
    // — Community decisions —
    {
      id: 'ismaskin_offer',
      category: 'community',
      question: 'Kommunen erbjuder en begagnad ismaskin till rabatterat pris (15 000 kr).',
      optionA: { label: 'Köp den', effect: '−15 tkr · +iskvalitet', effectColor: 'success' },
      optionB: { label: 'Tacka nej', effect: 'Ingen effekt', effectColor: 'muted' },
    },
    {
      id: 'family_section_request',
      category: 'community',
      question: `${family}: "Kan vi få en tydligare familjeplats på läktaren? Barnen behöver en lugn sida."`,
      optionA: { label: 'Ordna det', effect: '+kommunstatus · +stämning', effectColor: 'success' },
      optionB: { label: 'Inte nu', effect: `${family} besviken`, effectColor: 'danger' },
    },
  ]

  return decisions
}

// ── Public API ───────────────────────────────────────────────────────────────

export function generateWeeklyDecision(game: SaveGame, round: number): WeeklyDecision | null {
  if (round < 1) return null

  const pool = makeDecisions(game)
  const resolved = game.resolvedWeeklyDecisions ?? []

  // Filter out already-resolved decisions this season
  const available = pool.filter(d => !resolved.includes(`${d.id}_${game.currentSeason}`))
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

  switch (decision.id) {
    case 'corner_extra_training':
      if (choice === 'A' && cornerCandidate)
        return [{ type: 'cornerSkill', playerId: cornerCandidate.id, delta: 3 }]
      return [{ type: 'noop' }]

    case 'player_weekend_off':
      if (choice === 'A' && wearyPlayer)
        return [{ type: 'morale', playerId: wearyPlayer.id, delta: 5 }]
      if (choice === 'B' && wearyPlayer)
        return [{ type: 'morale', playerId: wearyPlayer.id, delta: -3 }]
      return [{ type: 'noop' }]

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
      return [{ type: 'supporterMood', delta: Math.random() < 0.5 ? 3 : -4 }]

    case 'reporter_klacken':
      if (choice === 'A')
        return [{ type: 'communityStanding', delta: 3 }]
      return [{ type: 'communityStanding', delta: -2 }]

    case 'training_corners_vs_matchprep':
      if (choice === 'A' && cornerCandidate)
        return [{ type: 'cornerSkill', playerId: cornerCandidate.id, delta: 2 }]
      // choice B: small positioning boost — no direct field, use noop
      return [{ type: 'noop' }]

    case 'scout_opponent_corners':
      // No direct field for "tactic insight", use communityStanding as proxy
      if (choice === 'A')
        return [{ type: 'boardPatience', delta: 2 }]
      return [{ type: 'noop' }]

    case 'ismaskin_offer':
      if (choice === 'A')
        return [{ type: 'finances', delta: -15000 }, { type: 'communityStanding', delta: 4 }]
      return [{ type: 'noop' }]

    case 'family_section_request':
      if (choice === 'A')
        return [{ type: 'communityStanding', delta: 3 }, { type: 'supporterMood', delta: 4 }]
      return [{ type: 'supporterMood', delta: -3 }]

    default:
      return [{ type: 'noop' }]
  }
}
