import type { TrainingFocus, TrainingProjectType } from '../../../domain/entities/Training'
import { createTrainingProject } from '../../../domain/services/trainingProjectService'
import type { SaveGame } from '../../../domain/entities/SaveGame'

interface GetState { game: SaveGame | null }
type Get = () => GetState
type Set = (partial: Partial<{ game: SaveGame | null }>) => void

export function trainingActions(get: Get, set: Set) {
  return {
    setTraining: (focus: TrainingFocus) => {
      const { game } = get()
      if (!game) return
      set({ game: { ...game, managedClubTraining: focus } })
    },

    startTrainingProject: (type: string, intensity: 'normal' | 'hard') => {
      const { game } = get()
      if (!game) return { success: false, error: 'Inget spel laddat' }
      const activeProjects = (game.trainingProjects ?? []).filter(p => p.status === 'active')
      if (activeProjects.length >= 3) {
        return { success: false, error: 'Max 3 aktiva projekt' }
      }
      if (activeProjects.some(p => p.type === type)) {
        return { success: false, error: 'Det projektet pågår redan' }
      }
      const newProject = createTrainingProject(type as TrainingProjectType, intensity)
      set({ game: { ...game, trainingProjects: [...(game.trainingProjects ?? []), newProject] } })
      return { success: true }
    },

    cancelTrainingProject: (projectId: string) => {
      const { game } = get()
      if (!game) return
      set({
        game: {
          ...game,
          trainingProjects: (game.trainingProjects ?? []).filter(p => p.id !== projectId),
        },
      })
    },
  }
}
