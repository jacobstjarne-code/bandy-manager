import type { SaveGame } from '../entities/SaveGame'

export interface SeasonDecision {
  icon: string
  text: string
  round?: number
}

export function collectSeasonDecisions(game: SaveGame): SeasonDecision[] {
  const decisions: SeasonDecision[] = []
  const season = game.currentSeason

  // Academy promotions
  const promoted = game.players.filter(p =>
    p.clubId === game.managedClubId &&
    p.promotedFromAcademy &&
    p.promotionRound !== undefined
  )
  for (const p of promoted) {
    decisions.push({
      icon: '🎓',
      text: `Kallade upp ${p.firstName} ${p.lastName} (${p.age} år) från akademin`,
      round: p.promotionRound,
    })
  }

  // Resolved storylines
  for (const sl of game.storylines ?? []) {
    if (sl.season === season && sl.displayText) {
      decisions.push({ icon: '📖', text: sl.displayText, round: sl.matchday })
    }
  }

  // Board objectives met/failed
  for (const obj of game.boardObjectiveHistory ?? []) {
    if (obj.season === season) {
      decisions.push({
        icon: obj.result === 'met' ? '✅' : '❌',
        text: `Styrelseuppdrag: ${obj.objectiveId} — ${obj.result === 'met' ? 'uppfyllt' : 'misslyckat'}`,
      })
    }
  }

  // License
  if (game.licenseReview?.season === season && game.licenseReview.status !== 'approved') {
    decisions.push({
      icon: '📋',
      text: `Licensnämnden: ${game.licenseReview.status === 'warning' ? 'Varning' : 'Fortsatt granskning'}`,
    })
  }

  // Facility projects
  for (const proj of game.facilityProjects ?? []) {
    if (proj.status === 'completed' || proj.status === 'in_progress') {
      decisions.push({ icon: '🏗️', text: `Startade projekt: ${proj.name}` })
    }
  }

  return decisions.sort((a, b) => (a.round ?? 99) - (b.round ?? 99)).slice(0, 8)
}
