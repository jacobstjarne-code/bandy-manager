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
  if (fixture.matchday === 10) {
    return '🎄 Annandagen. Hela stan är på benen. Det luktar korv och kyla.'
  }

  // Derby
  if (rivalry && rivalry.intensity >= 2) {
    return `🔥 Derbydag. ${rivalry.name}. Gräsmattorna vid arenan är fulla en timme före nedsläpp.`
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

  // Snow
  if (weather?.weather.condition === 'heavySnow') {
    return '❄️ Snöfall. Linjerna syns knappt. Det blir en kamp om viljan.'
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

export function getFinalWhistleSummary(
  myScore: number,
  theirScore: number,
  lateGoals: number,
  totalGoals: number,
  _isHome: boolean,
): string {
  const margin = myScore - theirScore
  if (margin >= 4) return 'Dominans från start till slut.'
  if (margin >= 2 && lateGoals === 0) return 'Kontrollerad seger. Laget visste vad som krävdes.'
  if (margin === 1 && lateGoals > 0) return 'Avgörandet kom sent. Nerverna höll.'
  if (margin === 1) return 'Knapp seger. Det kunde gått åt vilket håll som helst.'
  if (margin === 0 && totalGoals === 0) return 'Mållöst. Isen var hård men kreativiteten saknades.'
  if (margin === 0 && totalGoals >= 6) return 'Målfest och rättvis poängdelning.'
  if (margin === 0) return 'Poängdelning. Rättvist? Kanske.'
  if (margin === -1 && lateGoals > 0) return 'Sent avgörande — åt fel håll.'
  if (margin === -1) return 'En boll skilde. Marginaler.'
  if (margin <= -3) return 'Tung kväll. Det finns inte mycket att säga.'
  return 'Motståndarna var starkare idag.'
}
