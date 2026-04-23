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
    return `Derbydag. ${rivalry.name}. Gräsmattorna vid arenan är fulla en timme före nedsläpp.`
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
    return '❄️ Snöfall. Linjerna syns knappt. Det blir en viljornas kamp.'
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

export interface FinalWhistleContext {
  myScore: number
  theirScore: number
  lateGoals: number
  totalGoals: number
  isHome: boolean
  cornerGoals?: number
  totalCorners?: number
  suspensionsUs?: number
  suspensionsThem?: number
  weatherCondition?: string
  temperature?: number
  isRivalry?: boolean
  rivalryName?: string
  isCup?: boolean
  isPlayoff?: boolean
  tabellPosition?: number
  round?: number
  totalRounds?: number
  comeback?: boolean
  captainScored?: boolean
  hatTrickPlayer?: string
  potmName?: string
}

export function getFinalWhistleSummary(
  myScoreOrCtx: number | FinalWhistleContext,
  theirScore?: number,
  lateGoals?: number,
  totalGoals?: number,
  _isHome?: boolean,
): string {
  // Support both old signature (5 args) and new rich context
  let ctx: FinalWhistleContext
  if (typeof myScoreOrCtx === 'object') {
    ctx = myScoreOrCtx
  } else {
    ctx = {
      myScore: myScoreOrCtx,
      theirScore: theirScore ?? 0,
      lateGoals: lateGoals ?? 0,
      totalGoals: totalGoals ?? 0,
      isHome: _isHome ?? true,
    }
  }

  const { myScore, theirScore: them, lateGoals: late, totalGoals: total } = ctx
  const margin = myScore - them
  const lines: string[] = []

  // Layer 1: Result base
  if (margin >= 4) lines.push('Dominans från start till slut.')
  else if (margin >= 2 && late === 0) lines.push('Kontrollerad seger. Laget visste vad som krävdes.')
  else if (margin >= 2 && late > 0) lines.push('Kontrollerad seger, även om avslutningen blev stormig.')
  else if (margin === 1 && late > 0) lines.push('Avgörandet kom sent. Nerverna höll.')
  else if (margin === 1) lines.push('Knapp seger. Det kunde gått åt vilket håll som helst.')
  else if (margin === 0 && total === 0) lines.push('Mållöst. Isen var hård men kreativiteten saknades.')
  else if (margin === 0 && total >= 7) lines.push('Målfest och rättvis poängdelning.')
  else if (margin === 0) lines.push('Poängdelning. Rättvist? Kanske.')
  else if (margin === -1 && late > 0) lines.push('Sent avgörande — åt fel håll.')
  else if (margin === -1) lines.push('En boll skilde. Marginaler.')
  else if (margin === -2) lines.push('Motståndarna var starkare idag.')
  else if (margin <= -3) lines.push('Tung kväll. Det finns inte mycket att säga.')
  else lines.push('Matchen är över.')

  // Layer 2: Match character (max 1)
  if (ctx.comeback && margin > 0) {
    lines.push('Vändningen var komplett — från underläge till seger.')
  } else if ((ctx.cornerGoals ?? 0) >= 3) {
    lines.push('Hörnorna avgjorde. Tre mål från fasta situationer.')
  } else if ((ctx.suspensionsUs ?? 0) >= 3) {
    lines.push('Disciplinen svek. Tre utvisningar är för mycket.')
  } else if (total >= 12) {
    lines.push(`${total} mål. En match man minns.`)
  } else if (total <= 3 && total > 0 && Math.abs(margin) <= 1) {
    lines.push('Tight och taktiskt. Varje mål vägde tungt.')
  }

  // Layer 3: Context (max 1)
  if (ctx.isRivalry && margin > 0) {
    lines.push(`${ctx.rivalryName ?? 'Derbyt'} avgjort. Det här pratar orten om i veckor.`)
  } else if (ctx.isCup && margin > 0) {
    lines.push('Vidare i cupen. Nästa omgång väntar.')
  } else if (ctx.isPlayoff) {
    lines.push('Slutspel. Varje match kan vara den sista.')
  } else if (ctx.round && ctx.totalRounds && ctx.tabellPosition
    && ctx.round >= ctx.totalRounds - 2 && ctx.tabellPosition >= 10) {
    lines.push('Avgörande omgångar. Varje poäng räknas.')
  }

  // Layer 4: Weather (low probability)
  if (ctx.weatherCondition === 'heavySnow' && total >= 8) {
    lines.push('Åtta mål i snöstorm. Bandy som det är tänkt.')
  } else if (ctx.temperature && ctx.temperature <= -15) {
    lines.push(`Minus ${Math.abs(ctx.temperature)}. Spelarna förtjänar varm choklad.`)
  }

  // Layer 5: Hero (max 1)
  if (ctx.hatTrickPlayer) {
    lines.push(`${ctx.hatTrickPlayer} med hattrick. Matchens stora namn.`)
  } else if (ctx.captainScored) {
    lines.push('Kaptenen klev fram och tog ansvar. Som det ska vara.')
  } else if (ctx.potmName) {
    lines.push(`${ctx.potmName} — matchens lirare.`)
  }

  return lines.join(' ')
}

export function getMatchHeadline(
  managedWon: boolean,
  managedLost: boolean,
  margin: number,
  totalGoals: number,
  isRivalry: boolean,
  isCup: boolean,
  comeback: boolean,
  lateDecider: boolean,
): string {
  if (comeback && managedWon) return 'VÄNDNINGEN'
  if (isCup && managedWon && margin === 1) return 'CUPSKRÄLL'
  if (isCup && managedWon) return 'VIDARE'
  if (isRivalry && managedWon) return 'DERBYVINST'
  if (isRivalry && managedLost) return 'DERBYFÖRLUST'
  if (lateDecider && managedWon) return 'SENT AVGÖRANDE'
  if (lateDecider && managedLost) return 'BITTERT'
  if (managedWon && margin >= 4) return 'KROSS'
  if (managedWon && margin >= 2) return 'KONTROLL'
  if (managedWon) return 'SEGER'
  if (totalGoals >= 11 && !managedLost) return 'MÅLFEST'
  if (totalGoals === 0) return 'NOLLNOLLA'
  if (!managedWon && !managedLost) return 'OAVGJORT'
  if (managedLost && margin <= -4) return 'TUNGT'
  if (managedLost) return 'FÖRLUST'
  return 'SLUTSIGNAL'
}
