import type { Fixture } from '../entities/Fixture'
import type { SaveGame, StandingRow } from '../entities/SaveGame'
import { FixtureStatus } from '../enums'

/**
 * Returns the current league position for a club, or null if no league
 * matches have been played yet (e.g. during the pre-season cup phase).
 * All callers should render "-" when null rather than showing arbitrary 0-poäng positions.
 */
export function getCurrentLeaguePosition(clubId: string, game: SaveGame): number | null {
  const hasLeague = game.fixtures.some(
    f => f.status === FixtureStatus.Completed && !f.isCup && !f.isKnockout
  )
  if (!hasLeague) return null
  return game.standings.find(s => s.clubId === clubId)?.position ?? null
}

/**
 * PÅSTÅENDEKARTAN, LÄST-FÖRE-INITIERING (2026-08-26, sjätte arten,
 * `PASTAENDEKARTAN_2026-08-24.md`). Sex bekräftade instanser av samma bugg
 * (GRIND1-skriptet, `cupProcessor.ts`, `bestFinish`, och fem till hittade i
 * ett fullt svep) delade en rotorsak: `standings.find(s => s.clubId ===
 * X)?.position` läses som om det alltid vore en verklig placering — men
 * vid noll spelade matcher (säsongsstart, eller precis efter
 * `seasonEndProcessor.ts`s nästa-säsongs-överskrivning) är ALLA klubbar på
 * 0 poäng och tie-breaken (`calculateStandings` ovan, `localeCompare`) ger
 * en alfabetisk skuggposition, inte en verklig.
 *
 * Denna funktion är den kanoniska, säkra vägen att läsa en enskild klubbs
 * position: `null` om raden saknas ELLER om `played === 0`, annars den
 * verkliga positionen. Skiljer sig från `getCurrentLeaguePosition` ovan
 * genom att kolla den SPECIFIKA radens `played` istf "finns någon
 * ligamatch spelad NÅGONSTANS i spelet" — mer precist vid udda schema-
 * kombinationer (cupmatcher interfolierade med liga).
 *
 * Nya konsumenter av `standing.position`: använd DENNA, inte
 * `standings.find(...)?.position` direkt — se förbudslistan/grinden
 * (`tests/grind/standingPositionReadGate.ts`) som fångar den råa formen.
 */
export function safeStandingPosition(standings: StandingRow[], clubId: string): number | null {
  const row = standings.find(s => s.clubId === clubId)
  if (!row || row.played === 0) return null
  return row.position
}

export function calculateStandings(teamIds: string[], fixtures: Fixture[], pointDeductions?: Record<string, number>): StandingRow[] {
  const rowMap = new Map<string, StandingRow>()

  for (const id of teamIds) {
    rowMap.set(id, {
      clubId: id,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      position: 0,
    })
  }

  for (const fixture of fixtures) {
    if (fixture.status !== FixtureStatus.Completed) continue
    if (fixture.isKnockout || fixture.isCup) continue

    const home = rowMap.get(fixture.homeClubId)
    const away = rowMap.get(fixture.awayClubId)

    if (!home || !away) continue

    home.played += 1
    away.played += 1

    home.goalsFor += fixture.homeScore
    home.goalsAgainst += fixture.awayScore
    away.goalsFor += fixture.awayScore
    away.goalsAgainst += fixture.homeScore

    if (fixture.homeScore > fixture.awayScore) {
      home.wins += 1
      home.points += 2
      away.losses += 1
    } else if (fixture.homeScore < fixture.awayScore) {
      away.wins += 1
      away.points += 2
      home.losses += 1
    } else {
      home.draws += 1
      home.points += 1
      away.draws += 1
      away.points += 1
    }

    home.goalDifference = home.goalsFor - home.goalsAgainst
    away.goalDifference = away.goalsFor - away.goalsAgainst
  }

  const rows = Array.from(rowMap.values())

  if (pointDeductions) {
    for (const row of rows) {
      const deduction = pointDeductions[row.clubId] ?? 0
      if (deduction > 0) row.points = Math.max(0, row.points - deduction)
    }
  }

  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
    return a.clubId.localeCompare(b.clubId)
  })

  rows.forEach((row, index) => {
    row.position = index + 1
  })

  return rows
}
