import type { SaveGame } from '../entities/SaveGame'
import { PlayoffRound } from '../enums'
import {
  getOpponentStandingFragment,
  getLastMeetingFragment,
  getRivalryFragment,
  getPlayoffContextFragment,
  getCupStakeFragment,
  getInjuryImpactFragment,
  getSeasonPhaseFragment,
  getDeadlineDayFragment,
} from './situationFragments'
import { playoffRoundNameUpper } from '../roundLabel'

export interface Situation {
  label: string
  body: string
}

// Slå ihop 1-3 fragment till en body-text.
function joinFragments(fragments: (string | null)[], max = 3): string {
  const parts = fragments.filter((f): f is string => !!f).slice(0, max)
  return parts.join(' ')
}

export function getSituation(game: SaveGame): Situation {
  const managedId = game.managedClubId

  // ── Hjälpdata ─────────────────────────────────────────────────────
  const completedLeague = game.fixtures.filter(
    f => f.status === 'completed' && !f.isCup && !f.isKnockout &&
      (f.homeClubId === managedId || f.awayClubId === managedId)
  ).sort((a, b) => b.matchday - a.matchday)

  // Påståendesvepet #24 (MASTER.md, 2026-08-24): streaken räknades tidigare
  // ur `form` (ett 5-matchers fönster satt FÖRE räkningen), så en verklig
  // svit på 6+ matcher alltid visades som "5 RAKA SEGRAR/FÖRLUSTER" — taket
  // satt av fönstret, inte av den faktiska sviten. Räknar nu ur HELA
  // completedLeague (obegränsad), samma mönster som csPressEventService.ts:s
  // redan korrekta computeCSStreak. `form` (5-fönstret) fanns bara för att
  // driva streak/lastResult här — inget annat i filen läser det separat.
  const results = completedLeague.map(f => {
    const isHome = f.homeClubId === managedId
    return (isHome ? f.homeScore : f.awayScore) > (isHome ? f.awayScore : f.homeScore)
      ? 'V' : (isHome ? f.homeScore : f.awayScore) < (isHome ? f.awayScore : f.homeScore)
      ? 'F' : 'O'
  })

  const lastResult = results[0]
  const streakIdx = results.findIndex(r => r !== lastResult)
  const streak = streakIdx === -1 ? results.length : streakIdx
  const leagueRoundsPlayed = completedLeague.length

  const standing = game.standings.find(s => s.clubId === managedId)
  const position = standing?.position ?? 12
  const points = standing?.points ?? 0

  const bracket = game.playoffBracket
  const eliminated = bracket
    ? [...(bracket.quarterFinals ?? []), ...(bracket.semiFinals ?? []), ...(bracket.final ? [bracket.final] : [])]
        .some(s => s.loserId === managedId)
    : false

  const nextFixture = game.fixtures
    .filter(f => {
      if (f.status !== 'scheduled') return false
      if (f.homeClubId !== managedId && f.awayClubId !== managedId) return false
      if (eliminated && f.matchday > 26 && !f.isCup) return false
      return true
    })
    .sort((a, b) => a.matchday - b.matchday)[0] ?? null

  // ── SM-Final ──────────────────────────────────────────────────────
  const isFinal = bracket?.final?.fixtures.some(id =>
    game.fixtures.find(f => f.id === id && f.status === 'scheduled' &&
      (f.homeClubId === managedId || f.awayClubId === managedId))
  )
  if (isFinal || nextFixture?.isFinaldag) {
    return {
      label: 'SM-FINAL',
      body: 'Allt ni gjort har lett hit. En match. Det finns inget bortom.',
    }
  }

  // ── Transferfönstrets deadline-dag ────────────────────────────────
  const deadlineFrag = getDeadlineDayFragment(game)
  if (deadlineFrag) {
    const body = joinFragments([
      deadlineFrag,
      getPlayoffContextFragment(game),
    ])
    return { label: 'TRANSFERDEADLINE', body: body || deadlineFrag }
  }

  // ── Slutspel pågår ────────────────────────────────────────────────
  if (bracket && !eliminated) {
    const allSeries = [
      ...(bracket.quarterFinals ?? []),
      ...(bracket.semiFinals ?? []),
      ...(bracket.final ? [bracket.final] : []),
    ]
    const activeSeries = allSeries.find(s =>
      s.fixtures.some(id => {
        const f = game.fixtures.find(fix => fix.id === id)
        return f?.status === 'scheduled' &&
          (f.homeClubId === managedId || f.awayClubId === managedId)
      })
    )
    if (activeSeries) {
      const roundLabel = playoffRoundNameUpper(activeSeries.round)
      const managedIsHome = activeSeries.homeClubId === managedId
      const ourWins = managedIsHome ? activeSeries.homeWins : activeSeries.awayWins
      const theirWins = managedIsHome ? activeSeries.awayWins : activeSeries.homeWins
      const score = `${ourWins}–${theirWins}`

      // PÅSTÅENDEKARTAN, LÄST-FÖRE-INITIERING (2026-08-27, Jacobs dom): "0–0.
      // Allt kan hända härifrån." antydde ett läge som inte fanns — samma
      // familj som HalftimeModals "förra året". Låst text för en serie som
      // inte spelat sin första match än; N härlett ur seriens format
      // (samma tröskel som isSeriesDecided i playoffService.ts), inte
      // hårdkodat. Efter första matchen tar den vanliga texten över — då
      // FINNS något att härifrån.
      const winsNeeded = activeSeries.round === PlayoffRound.Final ? 1 : 3
      const seriesBody = (ourWins === 0 && theirWins === 0)
        ? `Serien börjar. Först till ${winsNeeded} vinster.`
        : ourWins > theirWins
        ? `Ni leder ${score}. Slutspelet är inte gjort förrän det är gjort.`
        : ourWins < theirWins
        ? `${score}. Det är dags att svara.`
        : `${score}. Allt kan hända härifrån.`

      // Lägg rivalry/motstånd som andra mening om möjligt
      const rivalryFrag = getRivalryFragment(game)
      const body = rivalryFrag ? `${seriesBody} ${rivalryFrag}` : seriesBody
      return { label: roundLabel, body }
    }
  }

  // ── Cup kommande — bygg från tre fragment ─────────────────────────
  if (nextFixture?.isCup) {
    const cupMatch = game.cupBracket?.matches.find(m => m.fixtureId === nextFixture.id)
    const round = cupMatch?.round ?? 1
    const roundStr =
      round === 1 ? 'Förstarundamatch i cupen' :
      round === 2 ? 'Kvartsfinal i cupen' :
      round === 3 ? 'Semifinal i cupen' : 'Cupfinalen'

    const body = joinFragments([
      `${roundStr}.`,
      getCupStakeFragment(game),
      getRivalryFragment(game) ?? getLastMeetingFragment(game),
    ])
    return { label: 'CUPEN', body: body || `${roundStr}. Utslagsspel — inget mer.` }
  }

  // ── Vinstsvit 4+ ─────────────────────────────────────────────────
  if (lastResult === 'V' && streak >= 4) {
    const body = joinFragments([
      `${streak} raka segrar.`,
      getPlayoffContextFragment(game),
      getOpponentStandingFragment(game),
    ])
    return { label: `${streak} RAKA SEGRAR`, body }
  }

  // ── Förlustsvit 4+ ───────────────────────────────────────────────
  if (lastResult === 'F' && streak >= 4) {
    const body = joinFragments([
      `${streak} raka förluster.`,
      getPlayoffContextFragment(game),
      'Det börjar med att vinna en match. Det är allt som krävs.',
    ])
    return { label: 'TUNG PERIOD', body }
  }

  // ── Vinstsvit 3 ──────────────────────────────────────────────────
  if (lastResult === 'V' && streak === 3) {
    const body = joinFragments([
      'Tre raka segrar.',
      getPlayoffContextFragment(game) ?? getOpponentStandingFragment(game),
    ])
    return { label: 'TRE RAKA SEGRAR', body: body || 'Tre raka segrar. Ni har momentum.' }
  }

  // ── Förlustsvit 3 ────────────────────────────────────────────────
  if (lastResult === 'F' && streak === 3) {
    const body = joinFragments([
      'Tre matcher utan poäng.',
      getPlayoffContextFragment(game),
      getInjuryImpactFragment(game),
    ])
    return { label: 'TRE RAKA FÖRLUSTER', body: body || 'Tre matcher utan poäng. Det syns på folk.' }
  }

  // ── Seriepremiär ─────────────────────────────────────────────────
  // PÅSTÅENDEKARTAN, LÄST-FÖRE-INITIERING (2026-08-26, Jacobs dom): "Före
  // första matchen är ställningen inte okänd — den är obefintlig, och det
  // är två olika saker." Låst text, ingen position, ingen antydan om läge
  // — inga fragment heller (getOpponentStandingFragment är redan gated,
  // men principen är att INGENTING om tabellen ska antydas här, inte bara
  // att det råkar bli tomt).
  if (leagueRoundsPlayed === 0) {
    return { label: 'SERIEPREMIÄR', body: 'Serien har inte börjat.' }
  }

  // ── Slutspurt (sista 3 omg) ───────────────────────────────────────
  const roundsLeft = 22 - leagueRoundsPlayed
  if (leagueRoundsPlayed >= 19 && roundsLeft >= 1 && roundsLeft <= 3) {
    const phaseFrag = getSeasonPhaseFragment(game)
    const playoffFrag = getPlayoffContextFragment(game)
    const oppFrag = getOpponentStandingFragment(game)
    const body = joinFragments([phaseFrag, playoffFrag, oppFrag])
    return { label: 'AVGÖRANDE SLUTSPURT', body: body || `${roundsLeft} omgångar kvar.` }
  }

  // ── Halvtid ──────────────────────────────────────────────────────
  if (leagueRoundsPlayed >= 11 && leagueRoundsPlayed <= 13) {
    const body = joinFragments([
      getSeasonPhaseFragment(game),
      getPlayoffContextFragment(game),
      getOpponentStandingFragment(game),
    ])
    return { label: 'HALVTID I SERIEN', body: body || `Halvtid. Ni är på ${position}:e plats med ${points} poäng.` }
  }

  // ── Serieledande ─────────────────────────────────────────────────
  if (position === 1 && leagueRoundsPlayed >= 4) {
    const body = joinFragments([
      getPlayoffContextFragment(game),
      getOpponentStandingFragment(game),
      lastResult === 'V' ? 'Ni vinner och leder — håll den känslan.' : null,
    ])
    return { label: 'SERIELEDANDE', body: body || `Serieledande med ${points} poäng.` }
  }

  // ── Playoff-gräns ────────────────────────────────────────────────
  if (leagueRoundsPlayed >= 5 && position >= 6 && position <= 10) {
    const eightPoints = game.standings.find(s => s.position === 8)?.points ?? 0
    if (Math.abs(points - eightPoints) <= 3) {
      const body = joinFragments([
        getPlayoffContextFragment(game),
        getOpponentStandingFragment(game),
        getLastMeetingFragment(game),
      ])
      return {
        label: points >= eightPoints ? 'PÅ STRECKET' : 'STRAX UNDER STRECKET',
        body: body || 'Det är jämnt om playoff-platsen.',
      }
    }
  }

  // ── Bottenlag ────────────────────────────────────────────────────
  if (position >= 10 && leagueRoundsPlayed >= 5) {
    const body = joinFragments([
      `Position ${position} av 12.`,
      getPlayoffContextFragment(game),
      getOpponentStandingFragment(game),
    ])
    return { label: 'TUFFT LÄGE', body: body || `Position ${position} av 12. Det är inte avgjort.` }
  }

  // ── Spectator / säsongen slut ─────────────────────────────────────
  if (!nextFixture && leagueRoundsPlayed >= 22) {
    const body = joinFragments([
      getPlayoffContextFragment(game),
    ])
    return {
      label: 'SÄSONGEN KLAR',
      body: body || `Säsongen spelad. Position ${position} med ${points} poäng.`,
    }
  }

  // ── Standard: byggt från fragment ────────────────────────────────
  const nextRound = nextFixture?.roundNumber ?? leagueRoundsPlayed + 1
  const body = joinFragments([
    getOpponentStandingFragment(game),
    getLastMeetingFragment(game) ?? getRivalryFragment(game),
    getPlayoffContextFragment(game),
  ])

  return {
    label: `OMGÅNG ${nextRound}`,
    body: body || `Omgång ${nextRound} av 22. Position ${position} med ${points} poäng.`,
  }
}
