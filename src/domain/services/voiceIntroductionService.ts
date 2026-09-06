import type { GameEvent } from '../entities/GameEvent'
import type { SaveGame } from '../entities/SaveGame'
import type {
  IntroducedVoiceRegistry,
  VoiceId,
  VoiceIntroductionRecord,
} from '../entities/Voice'
import { logEvent } from './eventLedgerService'

export const MAX_VOICE_INTRODUCTIONS_PER_MATCHDAY = 1

function voicePart(value: string): string {
  return encodeURIComponent(value)
}

/** Instance ids include clubId: board ids and patron ids are not globally unique. */
export function boardVoiceId(clubId: string, boardMemberId: string): VoiceId {
  return `board:${voicePart(clubId)}:${voicePart(boardMemberId)}`
}

export function assistantCoachVoiceId(clubId: string): VoiceId {
  return `assistant_coach:${voicePart(clubId)}`
}

export function mecenatVoiceId(clubId: string, mecenatId: string): VoiceId {
  return `patron:${voicePart(clubId)}:mecenat:${voicePart(mecenatId)}`
}

export function patronVoiceId(clubId: string, patronId: string): VoiceId {
  return `patron:${voicePart(clubId)}:patron:${voicePart(patronId)}`
}

export function localPressVoiceId(clubId: string, journalistName: string): VoiceId {
  return `local_press:${voicePart(clubId)}:${voicePart(journalistName)}`
}

export function klackLeaderVoiceId(clubId: string, leaderName: string): VoiceId {
  return `klack_leader:${voicePart(clubId)}:${voicePart(leaderName)}`
}

export function isVoiceIntroduced(
  game: Pick<SaveGame, 'introducedVoices'>,
  voiceId: VoiceId,
): boolean {
  return game.introducedVoices?.[voiceId] !== undefined
}

export function voiceIntroductionBudgetUsed(
  game: Pick<SaveGame, 'voiceIntroductionBudget' | 'currentSeason' | 'currentMatchday'>,
): number {
  const budget = game.voiceIntroductionBudget
  if (!budget) return 0
  if (budget.season !== game.currentSeason || budget.matchday !== game.currentMatchday) return 0
  return Math.max(0, budget.used)
}

export function canIntroduceVoiceThisMatchday(
  game: Pick<SaveGame, 'voiceIntroductionBudget' | 'currentSeason' | 'currentMatchday'>,
): boolean {
  return voiceIntroductionBudgetUsed(game) < MAX_VOICE_INTRODUCTIONS_PER_MATCHDAY
}

export function wasVoiceIntroducedThisMatchday(
  game: Pick<SaveGame, 'voiceIntroductionBudget' | 'currentSeason' | 'currentMatchday'>,
  voiceId: VoiceId,
): boolean {
  const budget = game.voiceIntroductionBudget
  if (!budget) return false
  if (budget.season !== game.currentSeason || budget.matchday !== game.currentMatchday) return false
  return budget.introducedVoiceIds?.includes(voiceId) ?? false
}

/** A known voice may first speak on the matchday after its introduction. */
export function canVoiceSpeak(
  game: Pick<SaveGame, 'introducedVoices' | 'voiceIntroductionBudget' | 'currentSeason' | 'currentMatchday'>,
  voiceId: VoiceId,
): boolean {
  return isVoiceIntroduced(game, voiceId) && !wasVoiceIntroducedThisMatchday(game, voiceId)
}

export function canLocalPressSpeak(
  game: Pick<SaveGame, 'managedClubId' | 'journalist' | 'introducedVoices' | 'voiceIntroductionBudget' | 'currentSeason' | 'currentMatchday'>,
): boolean {
  if (!game.journalist) return false
  return canVoiceSpeak(game, localPressVoiceId(game.managedClubId, game.journalist.name))
}

function rosterIntroductionEvents(game: SaveGame): GameEvent[] {
  if (!game.onboardingComplete) return []

  const club = (game.clubs ?? []).find(candidate => candidate.id === game.managedClubId)
  const queuedVoiceIds = new Set(
    (game.pendingEvents ?? []).flatMap(event => event.introducesVoiceId ? [event.introducesVoiceId] : []),
  )
  const events: GameEvent[] = []

  if (game.journalist) {
    const voiceId = localPressVoiceId(game.managedClubId, game.journalist.name)
    if (!isVoiceIntroduced(game, voiceId) && !queuedVoiceIds.has(voiceId)) {
      const clubName = club?.name ?? 'klubben'
      events.push({
        id: `voice_intro_local_press_${voicePart(game.managedClubId)}_${voicePart(game.journalist.name)}`,
        type: 'journalistExclusive',
        title: `${game.journalist.name}, ${game.journalist.outlet}.`,
        body: `Bevakar ${clubName} — matcher, beslut, det som sägs i kön på Konsum. Var på plats före dig, och blir kvar efter.`,
        sender: { name: game.journalist.name, role: game.journalist.outlet },
        choices: [{ id: 'acknowledge', label: 'Noterat', effect: { type: 'noOp' } }],
        resolved: false,
        voiceId,
        introducesVoiceId: voiceId,
      })
    }
  }

  const leader = game.supporterGroup?.leader
  if (leader) {
    const voiceId = klackLeaderVoiceId(game.managedClubId, leader.name)
    if (!isVoiceIntroduced(game, voiceId) && !queuedVoiceIds.has(voiceId)) {
      const clubName = club?.name ?? 'klubben'
      events.push({
        id: `voice_intro_klack_leader_${voicePart(game.managedClubId)}_${voicePart(leader.name)}`,
        type: 'supporterEvent',
        title: `${leader.name}.`,
        body: `Håller ihop ${clubName}s klack — sångerna, resorna, ståplatsen bakom kortsidan. Talar för dem som står där varje match.`,
        sender: { name: leader.name, role: 'Klackledare' },
        choices: [{ id: 'acknowledge', label: 'Noterat', effect: { type: 'noOp' } }],
        resolved: false,
        voiceId,
        introducesVoiceId: voiceId,
      })
    }
  }

  return events
}

/** Missing roster intros are prepended, preserving all deferred statements. */
export function queueRosterVoiceIntroductions(game: SaveGame): SaveGame {
  const introductions = rosterIntroductionEvents(game)
  if (introductions.length === 0) return game
  return { ...game, pendingEvents: [...introductions, ...(game.pendingEvents ?? [])] }
}

/** Producer hook for round processing and legacy saves. */
export function generateRosterVoiceIntroductions(game: SaveGame): GameEvent[] {
  return rosterIntroductionEvents(game)
}

/**
 * The pendingEvents array is the deferral store: a blocked event is never
 * removed or copied to a lossy secondary queue. It simply remains in place
 * until its voice has been introduced. At most one eligible introduction
 * card is admitted for the active period.
 */
export function getVoiceEligibleEvents(
  game: Pick<SaveGame, 'introducedVoices' | 'voiceIntroductionBudget' | 'currentSeason' | 'currentMatchday'>,
  events: readonly GameEvent[],
): GameEvent[] {
  let introCapacity = Math.max(
    0,
    MAX_VOICE_INTRODUCTIONS_PER_MATCHDAY - voiceIntroductionBudgetUsed(game),
  )

  return events.filter(event => {
    const voiceId = event.voiceId ?? event.introducesVoiceId
    if (!voiceId) return true

    const introducesSelf = event.introducesVoiceId === voiceId
    if (isVoiceIntroduced(game, voiceId)) {
      // A queued intro for a voice already known is obsolete, not a reason to
      // re-introduce them. A newly introduced voice remains silent for the
      // rest of this matchday; its first substantive statement is eligible
      // only after the period latch resets.
      return !introducesSelf && !wasVoiceIntroducedThisMatchday(game, voiceId)
    }

    if (!introducesSelf || introCapacity <= 0) return false
    introCapacity -= 1
    return true
  })
}

export function canEventPassVoiceGate(
  game: Pick<SaveGame, 'introducedVoices' | 'voiceIntroductionBudget' | 'currentSeason' | 'currentMatchday'>,
  event: GameEvent,
  queue: readonly GameEvent[] = [event],
): boolean {
  return getVoiceEligibleEvents(game, queue).some(candidate => candidate.id === event.id)
}

function observedRecord(
  game: Pick<SaveGame, 'currentSeason' | 'currentDate'>,
  source: 'onboarding' | 'event',
  identity?: { name: string; role?: string },
): VoiceIntroductionRecord {
  return {
    provenance: 'observed',
    source,
    introducedSeason: game.currentSeason,
    introducedDate: game.currentDate,
    ...(identity ? { nameSnapshot: identity.name, roleSnapshot: identity.role } : {}),
  }
}

function appendIntroduction(
  game: SaveGame,
  voiceId: VoiceId,
  source: 'onboarding' | 'event',
  consumeBudget: boolean,
  identity?: { name: string; role?: string },
): SaveGame {
  if (isVoiceIntroduced(game, voiceId)) return game
  if (consumeBudget && !canIntroduceVoiceThisMatchday(game)) return game

  const introducedVoices: IntroducedVoiceRegistry = {
    ...(game.introducedVoices ?? {}),
    [voiceId]: observedRecord(game, source, identity),
  }
  const voiceIntroductionBudget = consumeBudget
    ? {
        season: game.currentSeason,
        matchday: game.currentMatchday,
        used: voiceIntroductionBudgetUsed(game) + 1,
        introducedVoiceIds: [
          ...(game.voiceIntroductionBudget?.season === game.currentSeason
            && game.voiceIntroductionBudget.matchday === game.currentMatchday
            ? (game.voiceIntroductionBudget.introducedVoiceIds ?? [])
            : []),
          voiceId,
        ],
      }
    : game.voiceIntroductionBudget

  const next: SaveGame = { ...game, introducedVoices, voiceIntroductionBudget }
  return {
    ...next,
    eventLedger: logEvent(next, {
      type: 'voice_introduced',
      semanticKey: `voice_introduced:${voiceId}`,
      season: game.currentSeason,
      matchday: game.currentMatchday,
      subject: { kind: 'voice', id: voiceId },
      significance: 20,
    }),
  }
}

/** Records a normal in-season introduction and consumes today's one slot. */
export function recordVoiceIntroduction(
  game: SaveGame,
  voiceId: VoiceId,
  identity?: { name: string; role?: string },
): SaveGame {
  return appendIntroduction(game, voiceId, 'event', true, identity)
}

/**
 * Arrival + Tillträdet already show the club board and assistant coach as one
 * onboarding sequence. Seeding them is exempt from the later matchday card
 * budget but each observed introduction still enters canonical history.
 */
export function seedTilltradeVoices(game: SaveGame): SaveGame {
  const voices: Array<{ voiceId: VoiceId; name: string; role?: string }> = [
    ...(game.board ?? []).map(member => ({
      voiceId: boardVoiceId(game.managedClubId, member.id),
      name: `${member.firstName} ${member.lastName}`.trim(),
      role: member.role,
    })),
    ...(game.assistantCoach ? [{
      voiceId: assistantCoachVoiceId(game.managedClubId),
      name: game.assistantCoach.name,
      role: 'Assisterande tränare',
    }] : []),
  ]
  return voices.reduce(
    (current, voice) => appendIntroduction(current, voice.voiceId, 'onboarding', false, voice),
    game,
  )
}

/**
 * Legacy saves cannot prove the historical date of an introduction. Their
 * gate is therefore migrated without inventing a timestamp or ledger event.
 */
export function buildLegacyIntroducedVoices(game: SaveGame): IntroducedVoiceRegistry {
  const registry: IntroducedVoiceRegistry = {}
  const assume = (voiceId: VoiceId, identity?: { name: string; role?: string }) => {
    registry[voiceId] = {
      provenance: 'legacy_assumed', source: 'migration',
      ...(identity ? { nameSnapshot: identity.name, roleSnapshot: identity.role } : {}),
    }
  }

  if (game.onboardingComplete) {
    for (const member of game.board ?? []) assume(
      boardVoiceId(game.managedClubId, member.id),
      { name: `${member.firstName} ${member.lastName}`.trim(), role: member.role },
    )
    if (game.assistantCoach) assume(
      assistantCoachVoiceId(game.managedClubId),
      { name: game.assistantCoach.name, role: 'Assisterande tränare' },
    )
  }

  // Existing mecenat state has no reliable "first met" bit. The standing
  // decision is to prefer known over a false re-introduction on old saves.
  for (const mecenat of game.mecenater ?? []) {
    assume(
      mecenatVoiceId(game.managedClubId, mecenat.id),
      { name: mecenat.name, role: mecenat.business },
    )
  }

  const patronWasIntroduced = game.patron?.introducedSeason !== undefined
    || (game.resolvedEventIds ?? []).some(id => id.startsWith('patron_intro_') || id.startsWith('patron_emerge_'))
    || (game.eventLedger ?? []).some(entry => entry.type === 'patron_emerge' && entry.subject?.id === game.patron?.id)
  if (game.patron?.id && patronWasIntroduced) {
    assume(
      patronVoiceId(game.managedClubId, game.patron.id),
      { name: game.patron.name, role: game.patron.business },
    )
  }

  return registry
}
