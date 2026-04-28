import type { FacilityProject } from '../entities/SaveGame'

// ── Available projects based on current facilities level ────────────────

export function getAvailableProjects(facilities: number, existingProjects: FacilityProject[]): FacilityProject[] {
  const completedIds = new Set(existingProjects.filter(p => p.status === 'completed').map(p => p.id))
  const inProgressIds = new Set(existingProjects.filter(p => p.status === 'in_progress').map(p => p.id))

  const all: FacilityProject[] = []

  // Nivå 0-30
  if (facilities < 40) {
    all.push({
      id: 'omkladningsrum',
      name: 'Förbättra omklädningsrum',
      description: 'Duscharna läcker och bänkarna är från 80-talet.',
      cost: 50000, duration: 4, facilitiesBonus: 10,
      otherEffects: ['+5 morale vid hemmamatcher'],
      requiresKommun: false, kommunCostShare: 0,
      status: 'available',
    })
    all.push({
      id: 'stralkastare',
      name: 'Uppgradera strålkastare',
      description: 'Bättre ljus = bättre TV-bilder = bättre sponsoravtal.',
      cost: 80000, duration: 6, facilitiesBonus: 8,
      otherEffects: ['+10% sponsorintäkter'],
      requiresKommun: false, kommunCostShare: 0,
      status: 'available',
    })
  }

  // Nivå 30-60
  if (facilities >= 30 && facilities < 70) {
    all.push({
      id: 'konstis',
      name: 'Installera konstfrusen is',
      description: 'Konstis förlänger säsongen och höjer kvaliteten.',
      cost: 200000, duration: 10, facilitiesBonus: 15,
      otherEffects: ['Inga avlysta matcher p.g.a. väder'],
      requiresKommun: true, kommunCostShare: 0.5,
      status: 'available',
    })
    all.push({
      id: 'varmestuga',
      name: 'Bygg värmestuga',
      description: 'Kaffe, korv och värme. Folk stannar längre.',
      cost: 120000, duration: 8, facilitiesBonus: 5,
      otherEffects: ['+1000 publikkapacitet'],
      requiresKommun: false, kommunCostShare: 0,
      status: 'available',
    })
  }

  // Nivå 60-80
  if (facilities >= 60 && facilities < 90) {
    all.push({
      id: 'laktare',
      name: 'Renovera läktare',
      description: 'Sittplatser med tak. Som en riktig arena.',
      cost: 300000, duration: 12, facilitiesBonus: 10,
      otherEffects: ['+2000 publikkapacitet'],
      requiresKommun: true, kommunCostShare: 0.3,
      status: 'available',
    })
    all.push({
      id: 'gym',
      name: 'Bygga gym',
      description: 'Spelarna behöver inte längre träna hemma.',
      cost: 150000, duration: 8, facilitiesBonus: 8,
      otherEffects: ['+15% träningseffekt'],
      requiresKommun: false, kommunCostShare: 0,
      status: 'available',
    })
  }

  // Nivå 80+
  if (facilities >= 80) {
    all.push({
      id: 'ny_arena',
      name: 'Ny arena',
      description: 'En ny modern bandyarena med uppvärmd läktare och förbättrad isbana.',
      cost: 2000000, duration: 20, facilitiesBonus: 30,
      otherEffects: ['+5000 publikkapacitet', 'Hemmaplansfördel +10%', 'Sponsorer +20%'],
      requiresKommun: true, kommunCostShare: 0.6,
      status: 'available',
    })
  }

  // Filter out already completed or in progress
  return all.filter(p => !completedIds.has(p.id) && !inProgressIds.has(p.id))
}

// ── Start a project ─────────────────────────────────────────────────────

export function startFacilityProject(
  project: FacilityProject,
  currentMatchday: number,
): FacilityProject {
  return {
    ...project,
    status: 'in_progress',
    startedMatchday: currentMatchday,
  }
}

// ── Check if a project is done ──────────────────────────────────────────

export function checkProjectCompletion(
  project: FacilityProject,
  currentMatchday: number,
  currentSeason?: number,
): FacilityProject {
  if (project.status !== 'in_progress') return project
  const elapsed = currentMatchday - (project.startedMatchday ?? 0)
  if (elapsed >= project.duration) {
    return {
      ...project,
      status: 'completed',
      completedMatchday: currentMatchday,
      completedSeason: currentSeason,
    }
  }
  return project
}
