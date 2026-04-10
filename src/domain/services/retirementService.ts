import type { Player } from '../entities/Player'

export interface RetirementData {
  playerId: string
  name: string
  age: number
  position: string
  seasons: number
  totalGoals: number
  totalAssists: number
  totalGames: number
  farewell: string
  bestMoment?: string
  isLegend: boolean
}

const FAREWELL_TEMPLATES_SHORT = [
  (name: string) => `"Jag är stolt över varje match jag fick spela. Det är dags att lämna plats åt nästa generation." — ${name}`,
  (name: string) => `"Bandy har gett mig vänner för livet. Nu tar familjen vid." — ${name}`,
  (name: string) => `"Kroppen säger ifrån, men minnen tar ingen ifrån mig." — ${name}`,
  (name: string) => `"Det var ett privilegium att bära klubbfärgerna." — ${name}`,
  (name: string) => `"Tack till alla som hejade på oss i vinter efter vinter." — ${name}`,
]

const FAREWELL_TEMPLATES_VETERAN = [
  (name: string, seasons: number) => `"${seasons} säsonger. Inget jag byter mot något annat." — ${name}`,
  (name: string) => `"Bandyn tog mig från pojke till man. Nu är det dags att ge tillbaka som ledare." — ${name}`,
  (name: string) => `"Vi hade en enastående tid tillsammans. Jag bär den med mig." — ${name}`,
]

const FAREWELL_TEMPLATES_SCORER = [
  (name: string, goals: number) => `"${goals} mål. Varje ett minne för sig." — ${name}`,
  (name: string) => `"Det viktigaste målet var alltid det nästa. Nu är det slut." — ${name}`,
]

const FAREWELL_TEMPLATES_LEGEND = [
  (name: string) => `"Den här klubben är mitt hjärta. Det förändras inte för att jag slutar spela." — ${name}`,
  (name: string) => `"Jag hoppas att det jag lämnar efter mig räcker längre än mina år på plan." — ${name}`,
  (name: string) => `"Om vi gav publiken lika mycket glädje som de gav oss — då lyckades vi." — ${name}`,
]

const FAREWELL_TEMPLATES_DAYJOB = [
  (name: string, job: string) => `"${job} och bandyn. Det gick att kombinera — precis." — ${name}`,
  (name: string, job: string) => `"Måndag: ${job.toLowerCase()}. Lördag: plan. Det var mitt liv." — ${name}`,
  (name: string, job: string) => `"Chefen på ${job.toLowerCase()} var tålmodig. Utan honom hade det inte gått." — ${name}`,
  (name: string) => `"Halvtid på jobbet, heltid på hjärtat." — ${name}`,
]

const BEST_MOMENT_TEMPLATES = [
  (_name: string) => `Hattricket mot rivalerna stannade länge i minnet.`,
  (_name: string) => `En säsong med laget som tog sig hela vägen till semifinal.`,
  (name: string) => `Den avgörande straffen i cupfinalen — ${name} satte den säkert.`,
  (name: string) => `En bortamatch i snöyran där ${name} avgjorde med fem minuter kvar.`,
  (_name: string) => `Kampanjen när laget kämpade sig kvar i serien mot alla odds.`,
  (_name: string) => `Debuten i A-laget — nervig, men minnet sitter kvar.`,
]

export function generateFarewellQuote(player: Player): string {
  const name = `${player.firstName} ${player.lastName}`
  const goals = player.careerStats?.totalGoals ?? 0
  const seasons = player.careerStats?.seasonsPlayed ?? 1
  const games = player.careerStats?.totalGames ?? 0
  const hasLegendStats = games >= 100 || goals >= 50

  // Day job players get a specific quote type (roughly 40% of the time when eligible)
  const dayJobTitle = player.dayJob?.title
  if (dayJobTitle && !hasLegendStats && ((player.age + goals) % 3 !== 0)) {
    const pool = FAREWELL_TEMPLATES_DAYJOB
    const fn = pool[Math.floor((player.age * 3 + seasons) % pool.length)]
    return fn(name, dayJobTitle)
  }

  if (hasLegendStats || seasons >= 6) {
    const pool = FAREWELL_TEMPLATES_LEGEND
    return pool[Math.floor((player.age + goals) % pool.length)](name)
  }
  if (seasons >= 4) {
    const pool = FAREWELL_TEMPLATES_VETERAN
    const fn = pool[Math.floor((player.age * 7 + goals) % pool.length)]
    return fn(name, seasons)
  }
  if (goals >= 30) {
    const pool = FAREWELL_TEMPLATES_SCORER
    const fn = pool[Math.floor(goals % pool.length)]
    return fn(name, goals)
  }
  const pool = FAREWELL_TEMPLATES_SHORT
  return pool[Math.floor((player.age + seasons * 3) % pool.length)](name)
}

function generateBestMoment(player: Player): string | undefined {
  const goals = player.careerStats?.totalGoals ?? 0
  const games = player.careerStats?.totalGames ?? 0
  if (games < 10) return undefined  // Too few games to have a standout moment
  const pool = BEST_MOMENT_TEMPLATES
  const name = `${player.firstName} ${player.lastName}`
  return pool[Math.floor((player.age + goals * 3) % pool.length)](name)
}

export function generateRetirementData(player: Player, managedClubId: string): RetirementData {
  const seasons = player.careerStats?.seasonsPlayed ?? 1
  const goals = player.careerStats?.totalGoals ?? 0
  const assists = player.careerStats?.totalAssists ?? 0
  const games = player.careerStats?.totalGames ?? 0

  return {
    playerId: player.id,
    name: `${player.firstName} ${player.lastName}`,
    age: player.age,
    position: player.position,
    seasons,
    totalGoals: goals,
    totalAssists: assists,
    totalGames: games,
    farewell: generateFarewellQuote(player),
    bestMoment: player.clubId === managedClubId ? generateBestMoment(player) : undefined,
    isLegend: player.clubId === managedClubId && (games >= 100 || goals >= 50),
  }
}
