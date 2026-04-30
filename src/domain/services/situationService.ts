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
} from './situationFragments'

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
    f => f.status === 'completed' && !f.isCup &&
      (f.homeClubId === managedId || f.awayClubId === managedId)
  ).sort((a, b) => b.matchday - a.matchday)

  const form = completedLeague.slice(0, 5).map(f => {
    const isHome = f.homeClubId === managedId
    return (isHome ? f.homeScore : f.awayScore) > (isHome ? f.awayScore : f.homeScore)
      ? 'V' : (isHome ? f.homeScore : f.awayScore) < (isHome ? f.awayScore : f.homeScore)
      ? 'F' : 'O'
  })

  const lastResult = form[0]
  const streakIdx = form.findIndex(r => r !== lastResult)
  const streak = streakIdx === -1 ? form.length : streakIdx
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
      body: 'Det finns inget bortom det här. Allt ni gjort under säsongen har lett hit. En match avgör allt.',
    }
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
      const roundLabel =
        activeSeries.round === PlayoffRound.QuarterFinal ? 'KVARTSFINAL' :
        activeSeries.round === PlayoffRound.SemiFinal ? 'SEMIFINAL' : 'SM-FINAL'
      const managedIsHome = activeSeries.homeClubId === managedId
      const ourWins = managedIsHome ? activeSeries.homeWins : activeSeries.awayWins
      const theirWins = managedIsHome ? activeSeries.awayWins : activeSeries.homeWins
      const score = `${ourWins}–${theirWins}`

      const seriesBody = ourWins > theirWins
        ? `Ni leder serien ${score}. Håll trycket — slutspelet är inte gjort förrän det är gjort.`
        : ourWins < theirWins
        ? `Ni ligger under ${score}. Det är dags att svara.`
        : `Serien är öppen, ${score}. Det kan gå hur som helst härifrån.`

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
      'Det börjar alltid med att vinna en match.',
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
    return { label: 'TRE RAKA FÖRLUSTER', body: body || 'Tre matcher utan poäng. Det lämnar avtryck.' }
  }

  // ── Seriepremiär ─────────────────────────────────────────────────
  if (leagueRoundsPlayed === 0) {
    const body = joinFragments([
      getSeasonPhaseFragment(game),
      getOpponentStandingFragment(game),
    ])
    return { label: 'SERIEPREMIÄR', body: body || '22 omgångar, en cup och ett slutspel framför er.' }
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
