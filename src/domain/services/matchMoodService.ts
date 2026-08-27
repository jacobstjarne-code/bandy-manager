import type { SaveGame } from '../entities/SaveGame'
import type { Fixture } from '../entities/Fixture'
import type { MatchWeather } from '../entities/Weather'
import { getRivalry } from '../data/rivalries'

export function getMatchMood(
  game: SaveGame,
  fixture: Fixture,
  weather?: MatchWeather,
): string | null {
  const isHome = fixture.homeClubId === game.managedClubId
  const rivalry = getRivalry(fixture.homeClubId, fixture.awayClubId)
  const temp = weather?.weather.temperature ?? 0
  const standing = game.standings.find(s => s.clubId === game.managedClubId)
  const pos = standing?.position ?? 6
  const round = fixture.roundNumber
  const isCup = fixture.isCup

  // Annandagen
  if (fixture.matchday === 12) {
    return '🎄 Annandagen. Hela stan är på benen. Det luktar korv och kyla.'
  }

  // Derby
  if (rivalry && rivalry.intensity >= 2) {
    return `Derbydag. ${rivalry.name}. Parkeringarna är fulla en timme före avslag.`
  }
  if (rivalry) {
    return `⚔️ ${rivalry.name}. Det är tystare än vanligt i omklädningsrummet.`
  }

  // Cup
  if (isCup) {
    return '🏆 Cupspel. En match avgör. Inga andra chanser.'
  }

  // Extreme cold
  if (temp <= -15) {
    return `🥶 ${temp}°. Vaktmästaren har varit ute sedan fem. Isen är hård som betong.`
  }

  // Significant weather conditions — checked before temperature fallback
  if (weather?.weather.condition === 'heavySnow') {
    return '❄️ Snöfall. Linjerna syns knappt. Det blir en viljornas kamp.'
  }
  if (weather?.weather.condition === 'fog') {
    return '🌫 Dimman ligger tät. Svårt att se bortre målet.'
  }
  if (weather?.weather.condition === 'thaw') {
    return '💧 Töväder. Isen är blöt — det kräver ett annat spel.'
  }

  // Top of table clash
  const opponentId = isHome ? fixture.awayClubId : fixture.homeClubId
  const oppStanding = game.standings.find(s => s.clubId === opponentId)
  if (pos <= 3 && oppStanding && oppStanding.position <= 3) {
    return '📊 Toppdrabbning. Två lag som vill samma sak.'
  }

  // Must-win (bottom, late season)
  if (pos >= 10 && round >= 16) {
    return '⚠️ Varje poäng räknas nu. Laget vet vad som krävs.'
  }

  // Relegation battle
  if (pos >= 11 && round >= 19) {
    return '🔻 Desperation. Men desperata lag är farliga lag.'
  }

  // Playoff chase
  if (pos >= 7 && pos <= 9 && round >= 18) {
    return '📊 Slutspelsjakten. Ett par poäng skiljer.'
  }

  // Generic cold
  if (temp <= -5) {
    return `${temp}°. Frost på fönstren. En vanlig bandykväll.`
  }

  // Generic away
  if (!isHome) {
    const oppClub = game.clubs.find(c => c.id === opponentId)
    return `Borta hos ${oppClub?.name ?? 'motståndaren'}. Lång bussresa. Kort uppvärmning.`
  }

  // Generic home
  return null // Inget kort — sparar utrymme
}

// Påståendesvepet #18 (MASTER.md, 2026-08-24): getFinalWhistleSummary +
// getMatchHeadline (och FinalWhistleContext) raderade — superseterad kod,
// inte text-utan-yta (CLAUDE.md §7). Noll produktionsanrop bekräftat.
// Samma jobb (post-match sammanfattning + rubrik) görs redan live, byggt ur
// riktig fixture-data: generateQuickSummary (granska/helpers.ts, anropad
// från GranskaOversikt.tsx) och generatePostMatchHeadline
// (journalistService.ts, persona-medveten, ersätter den platta
// sträng-mappningen här). Inget innehåll gick förlorat.
