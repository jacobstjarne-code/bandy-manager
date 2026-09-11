import { getSeasonEndPhase, type SeasonEndPhase } from '../data/seasonEndPhase'
import type { SaveGame } from '../entities/SaveGame'
import { buildSeasonCalendar } from './scheduleGenerator'

/**
 * SPEC_BERATTAREN_2026-09-04 §6 — Berättarens enda klocka.
 *
 * `matchday` är den globala händelseaxeln. `leagueRound` är en projektion
 * av faktiskt spelade ligamatcher och kan därför ligga still under cupveckor.
 * Ytor får aldrig använda den ena som om den vore den andra.
 *
 * berattaren-en-kronologi (2026-09-07, Opus dom, körorder till Code): klockan
 * läste tidigare `game.fixtures` — som BYTS UT HELT vid varje säsongsrollover
 * (`seasonEndProcessor.ts`, `fixtures: newFixtures`). En "enda klocka" som
 * bara kan datera INNEVARANDE säsong och tyst faller tillbaka till
 * "matchdag N" för allt äldre höll inte sitt eget löfte — en klocka som bara
 * kan säga vad klockan är idag är ingen klocka. Fixen: samma säsongsagnostiska
 * väg `matchdayToLeagueRound` (scheduleGenerator.ts) redan använde —
 * `buildSeasonCalendar(season)` är ren och deterministisk, fungerar för VILKEN
 * säsong som helst utan levande fixture-data. `game` behövs därför inte
 * längre i någon av de två funktionerna nedan.
 */
export interface CurrentChronology {
  season: number
  matchday: number
  leagueRound: number
  phase: SeasonEndPhase
}

/**
 * Berättarens projektion av en (godtycklig säsongs) global matchdag till
 * ligaomgång. Cup- och slutspelsveckor får aldrig öka omgången, och en
 * matchdag som inte innehåller en ordinarie ligamatch ska heller aldrig
 * kallas "omgång" — samma disciplin som förut, nu säsongsagnostisk.
 */
export function leagueRoundAtMatchday(season: number, matchday: number): number {
  return buildSeasonCalendar(season)
    .filter(slot => slot.matchday <= matchday && slot.type === 'league')
    .reduce((max, slot) => Math.max(max, slot.leagueRound ?? 0), 0)
}

/**
 * Rå primitiv: ligaomgången VID exakt denna matchdag, eller `undefined` om
 * matchdagen inte var en ligaomgång (cup/slutspel/utanför kalendern). Samma
 * fråga `chronologyPointLabel` svarar på, fast oformaterad — för konsumenter
 * som behöver eget format (versaler, förkortningar) men fortfarande ska
 * fråga klockan, inte gissa själva.
 */
export function leagueRoundExactAt(season: number, matchday: number): number | undefined {
  const slot = buildSeasonCalendar(season).find(s => s.matchday === matchday)
  return slot?.type === 'league' ? slot.leagueRound : undefined
}

/** Spelarvänd etikett för en liggarposts faktiska tidsaxel — vilken säsong som helst. */
export function chronologyPointLabel(season: number, matchday: number): string {
  const round = leagueRoundExactAt(season, matchday)
  return round !== undefined ? `omgång ${round}` : `matchdag ${matchday}`
}

/**
 * Competition-aware label for prose and narrative timelines. The global
 * matchday remains the canonical clock, but exposing its internal ordinal in
 * a sentence (for example "efter Heros, matchdag 1") makes cup and playoff
 * memories sound like debug output. Keep the clock; project it to the stage
 * the player actually recognises.
 */
export function narrativeChronologyLabel(season: number, matchday: number): string {
  const slot = buildSeasonCalendar(season).find(candidate => candidate.matchday === matchday)
  if (slot?.type === 'league') return `omg ${slot.leagueRound}`
  if (slot?.type === 'cup') {
    const cupStage: Record<number, string> = {
      1: 'cupens förstarunda',
      2: 'cupens kvartsfinal',
      3: 'cupens semifinal',
      4: 'cupfinalen',
    }
    return cupStage[slot.cupRound ?? 0] ?? 'cupen'
  }
  if (matchday >= 27) return 'slutspelet'
  return 'tidigare under säsongen'
}

export function currentChronology(game: SaveGame): CurrentChronology {
  return {
    season: game.currentSeason,
    matchday: game.currentMatchday,
    leagueRound: leagueRoundAtMatchday(game.currentSeason, game.currentMatchday),
    phase: getSeasonEndPhase(game),
  }
}
