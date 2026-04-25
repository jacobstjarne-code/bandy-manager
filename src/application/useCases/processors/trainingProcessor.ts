import type { SaveGame, InboxItem } from '../../../domain/entities/SaveGame'
import type { Player } from '../../../domain/entities/Player'
import type { TrainingSession, TrainingProject } from '../../../domain/entities/Training'
import { TrainingType, TrainingIntensity, InboxItemType } from '../../../domain/enums'
import { applyTrainingToSquad, selectAiTrainingFocus, getTrainingEffects } from '../../../domain/services/trainingService'
import { createTrainingItem } from '../../../domain/services/inboxService'
import { processTrainingProjectsPerRound, PROJECT_DEFINITIONS } from '../../../domain/services/trainingProjectService'
import { mulberry32 } from '../../../domain/utils/random'

export interface TrainingProcessorResult {
  players: Player[]
  trainingHistory: TrainingSession[]
  trainingProjects: TrainingProject[]
  inboxItems: InboxItem[]
  trainingEffects: ReturnType<typeof getTrainingEffects>
}

export function applyRoundTraining(
  game: SaveGame,
  baseSeed: number,
  nextRound: number,
  options?: { skipSideEffects?: boolean },
): TrainingProcessorResult {
  if (options?.skipSideEffects) {
    return {
      players: game.players,
      trainingHistory: game.trainingHistory ?? [],
      inboxItems: [],
      trainingProjects: game.trainingProjects ?? [],
      trainingEffects: { attributeBoosts: {}, fitnessChange: 0, injuryRiskModifier: 0, moraleEffect: 0, sharpnessEffect: 0 },
    }
  }
  const newInboxItems: InboxItem[] = []
  const managedClubTraining = game.managedClubTraining ?? { type: TrainingType.Physical, intensity: TrainingIntensity.Normal }

  let trainingPlayers = [...game.players]

  for (const club of game.clubs) {
    const isManaged = club.id === game.managedClubId
    const focus = isManaged
      ? managedClubTraining
      : selectAiTrainingFocus(game.players, club.id)

    const trainingResult = applyTrainingToSquad(
      trainingPlayers,
      club.id,
      focus,
      club.facilities,
      baseSeed + club.id.split('').reduce((h, c) => h * 31 + c.charCodeAt(0), 0) + nextRound,
    )
    trainingPlayers = trainingResult.updatedPlayers

    // Inbox for managed club injuries from training
    if (isManaged) {
      const injuredInTraining = trainingResult.injuredPlayerIds
        .map(id => trainingPlayers.find(p => p.id === id))
        .filter((p): p is Player => p !== undefined)

      newInboxItems.push(
        createTrainingItem(focus, nextRound, injuredInTraining, game.currentDate),
      )

      // Record training session in history
    }
  }

  // Build updated training history
  const trainingEffects = getTrainingEffects(managedClubTraining)
  const newTrainingSession = {
    season: game.currentSeason,
    roundNumber: nextRound,
    focus: managedClubTraining,
    effects: trainingEffects,
  }
  const updatedTrainingHistory = [...(game.trainingHistory ?? []), newTrainingSession]

  // ── Process training projects ─────────────────────────────────────────
  const projectRand = mulberry32(baseSeed + 88771)
  const activeProjects = (game.trainingProjects ?? []).filter(p => p.status === 'active')
  const projectResult = processTrainingProjectsPerRound(
    game.trainingProjects ?? [],
    trainingPlayers,
    game.managedClubId,
    projectRand,
    nextRound,
  )
  // Use project-updated players going forward
  trainingPlayers = projectResult.updatedPlayers

  // Inbox: notify for each completed project
  for (const p of projectResult.updatedProjects) {
    const wasActive = activeProjects.some(ap => ap.id === p.id)
    if (wasActive && p.status === 'completed') {
      const def = PROJECT_DEFINITIONS.find(d => d.type === p.type)
      if (def) {
        newInboxItems.push({
          id: `inbox_project_done_${p.id}`,
          date: game.currentDate,
          type: InboxItemType.BoardFeedback,
          title: `Träningsprojekt klart: ${def.label}`,
          body: `${def.emoji} ${def.label} är avslutat. Effekt: ${def.effectDescription}${p.injuredPlayerIds?.length ? ` · ⚠️ ${p.injuredPlayerIds.length} spelare skadades under projektet.` : ''}`,
          isRead: false,
        } as InboxItem)
      }
    }
  }

  return {
    players: trainingPlayers,
    trainingHistory: updatedTrainingHistory,
    trainingProjects: projectResult.updatedProjects,
    inboxItems: newInboxItems,
    trainingEffects,
  }
}
