import type { SaveGame } from '../entities/SaveGame'
import { PlayoffRound } from '../enums'

export interface Situation {
  label: string
  body: string
}

function pick<T>(arr: T[], idx: number): T {
  return arr[Math.abs(idx) % arr.length]
}

export function getSituation(game: SaveGame): Situation {
  const managedId = game.managedClubId

  // ── Form ──────────────────────────────────────────────────────────
  const completedLeague = game.fixtures
    .filter(f => f.status === 'completed' && !f.isCup &&
      (f.homeClubId === managedId || f.awayClubId === managedId))
    .sort((a, b) => b.matchday - a.matchday)

  const form = completedLeague.slice(0, 5).map(f => {
    const isHome = f.homeClubId === managedId
    const scored = isHome ? f.homeScore : f.awayScore
    const conceded = isHome ? f.awayScore : f.homeScore
    return scored > conceded ? 'V' : scored < conceded ? 'F' : 'O'
  })

  const lastResult = form[0]
  const streakIdx = form.findIndex(r => r !== lastResult)
  const streak = streakIdx === -1 ? form.length : streakIdx

  // ── Standing ──────────────────────────────────────────────────────
  const standing = game.standings.find(s => s.clubId === managedId)
  const position = standing?.position ?? 12
  const points = standing?.points ?? 0
  const leagueRoundsPlayed = completedLeague.length

  // ── Next fixture ──────────────────────────────────────────────────
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
        return f?.status === 'scheduled' && (f.homeClubId === managedId || f.awayClubId === managedId)
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

      if (ourWins > theirWins) {
        return { label: roundLabel, body: pick([
          `Ni leder serien ${score}. Håll trycket — slutspelet är inte gjort förrän det är gjort.`,
          `${score} i serien. Ni är i förarsätet. En match till så är ni vidare.`,
        ], ourWins) }
      } else if (ourWins < theirWins) {
        return { label: roundLabel, body: pick([
          `Ni ligger under ${score}. Det är dags att svara.`,
          `${score} i serien. Väggen är nära — ni behöver vinna nu och göra det igen.`,
        ], theirWins) }
      } else {
        return { label: roundLabel, body: pick([
          `Serien är helt öppen, ${score}. Det kan gå hur som helst härifrån.`,
          `Lika i serien, ${score}. Nästa match avgör momentum.`,
        ], ourWins) }
      }
    }
  }

  // ── Cup kommande ──────────────────────────────────────────────────
  if (nextFixture?.isCup) {
    const cupMatch = game.cupBracket?.matches.find(m => m.fixtureId === nextFixture.id)
    const round = cupMatch?.round ?? 1
    const roundStr =
      round === 1 ? 'en förstarundamatch' :
      round === 2 ? 'en kvartsfinal' :
      round === 3 ? 'en semifinal' : 'cupenfinalen'
    return {
      label: 'CUPEN',
      body: pick([
        `Ni spelar ${roundStr} i cupen. Utslagsspel — det finns ingen returmatch och inga poäng att hämta hem. Antingen vinner ni, eller så är det klart.`,
        `${roundStr.charAt(0).toUpperCase() + roundStr.slice(1)} i cupen väntar. Ett misstag och allt avgörs på en gång.`,
      ], round),
    }
  }

  // ── Vinstsvit 4+ ─────────────────────────────────────────────────
  if (lastResult === 'V' && streak >= 4) {
    return {
      label: `${streak} RAKA SEGRAR`,
      body: pick([
        `${streak} raka segrar. Det är sällan man ser den typen av svit. Laget har hittat något — behåll det.`,
        `Fyra eller fler matcher utan förlust. Tabellen märker det. Håll huvudet kallt.`,
      ], streak),
    }
  }

  // ── Förlustsvit 4+ ───────────────────────────────────────────────
  if (lastResult === 'F' && streak >= 4) {
    return {
      label: 'TUNG PERIOD',
      body: pick([
        `${streak} raka förluster. Det är allvarligt men inte hopplöst. Det börjar alltid med att vinna en match.`,
        `Laget har inte tagit poäng på länge. Det lämnar avtryck i omklädningsrummet. Fokus på nästa match, inget annat.`,
      ], streak),
    }
  }

  // ── Vinstsvit 3 ──────────────────────────────────────────────────
  if (lastResult === 'V' && streak === 3) {
    return {
      label: 'TRE RAKA SEGRAR',
      body: pick([
        `Tre raka segrar. Ni har momentum och det är tabellen värt. Håll gnistan.`,
        `Tre matcher utan förlust. Det börjar synas i tabellen och motståndet har noterat det.`,
      ], leagueRoundsPlayed),
    }
  }

  // ── Förlustsvit 3 ────────────────────────────────────────────────
  if (lastResult === 'F' && streak === 3) {
    return {
      label: 'TRE RAKA FÖRLUSTER',
      body: `Tre matcher utan poäng. Det ger avtryck, både i tabellen och i truppen. Nästa match är viktig att vinna, inte för att rädda serien utan för att stoppa trenden.`,
    }
  }

  // ── Seriepremiär ─────────────────────────────────────────────────
  if (leagueRoundsPlayed === 0) {
    return {
      label: 'SERIEPREMIÄR',
      body: pick([
        `Säsongen börjar nu. 22 omgångar i serien, en cup bakom oss och slutspelet framför. Alla lag börjar på noll — det ni gör härifrån avgör.`,
        `Det är seriepremiär. Det som skiljer ett lag i mars från ett lag i oktober är det ni gör de närmaste veckorna. Börja med truppen.`,
      ], game.currentSeason),
    }
  }

  // ── Slutspurt sista 3 omgångarna ──────────────────────────────────
  const roundsLeft = 22 - leagueRoundsPlayed
  if (leagueRoundsPlayed >= 19 && roundsLeft >= 1 && roundsLeft <= 3) {
    const roundsLeftStr = roundsLeft === 1 ? 'en omgång' : `${roundsLeft} omgångar`
    const eightPoints = game.standings.find(s => s.position === 8)?.points ?? 0
    const ptsDiff = points - eightPoints
    if (position <= 8) {
      return {
        label: 'AVGÖRANDE SLUTSPURT',
        body: `${roundsLeftStr} kvar av grundserien. Ni är inne i slutspelet, position ${position}. Håll positionen och gå in i slutspelet med momentum.`,
      }
    }
    if (ptsDiff >= -(roundsLeft * 2)) {
      return {
        label: 'AVGÖRANDE SLUTSPURT',
        body: `${roundsLeftStr} kvar och ${Math.abs(ptsDiff)} poäng upp till slutspelsplatsen. Det är fortfarande möjligt. Men varje poäng räknas.`,
      }
    }
    return {
      label: 'SLUTSPURT',
      body: `${roundsLeftStr} kvar. Slutspelet är inte nåbart det här året. Det handlar nu om att avsluta serien med värdighet och ta med sig lärdomar.`,
    }
  }

  // ── Halvtid i serien ─────────────────────────────────────────────
  if (leagueRoundsPlayed >= 11 && leagueRoundsPlayed <= 13) {
    return {
      label: 'HALVTID I SERIEN',
      body: pick([
        `Halva grundserien spelad. Ni är på ${position}:e plats med ${points} poäng. Den andra halvan avgör om det var en säsong att minnas.`,
        `${leagueRoundsPlayed} av 22 matcher spelade, ${points} poäng och position ${position}. Det är fortfarande öppet — halvtid är halvtid.`,
      ], position),
    }
  }

  // ── Serieledande ─────────────────────────────────────────────────
  if (position === 1 && leagueRoundsPlayed >= 4) {
    return {
      label: 'SERIELEDANDE',
      body: pick([
        `Ni leder serien. Det är ett privilegium och ett ansvar. Alla lag jagar er nu.`,
        `Serieledande med ${points} poäng. Det tar ett helt säsong att hålla täten, men det börjar med att vinna nästa match.`,
      ], leagueRoundsPlayed),
    }
  }

  // ── Playoff-gräns ────────────────────────────────────────────────
  if (leagueRoundsPlayed >= 5 && position >= 6 && position <= 10) {
    const eightPoints = game.standings.find(s => s.position === 8)?.points ?? 0
    const ptsDiff = points - eightPoints
    if (Math.abs(ptsDiff) <= 3) {
      if (ptsDiff >= 0) {
        return {
          label: 'PÅ STRECKET',
          body: `Ni är på ${position}:e plats, ${ptsDiff === 0 ? 'precis på' : `${ptsDiff} poäng över`} strecket till slutspelet. En dålig period och ni är ute. Varje match räknas.`,
        }
      }
      return {
        label: 'STRAX UNDER STRECKET',
        body: `Ni är ${Math.abs(ptsDiff)} poäng under slutspelsplatsen. Det är fullt möjligt att ta sig in, men det kräver att ni levererar nu.`,
      }
    }
  }

  // ── Bottenlag ────────────────────────────────────────────────────
  if (position >= 10 && leagueRoundsPlayed >= 5) {
    return {
      label: 'TUFFT LÄGE',
      body: `Position ${position} av 12. Det är inte bra, men det är inte avgjort. Poäng som ser dyra ut nu är fortfarande värda att kämpa för.`,
    }
  }

  // ── Default ───────────────────────────────────────────────────────
  const nextRound = nextFixture?.roundNumber ?? leagueRoundsPlayed + 1
  return {
    label: 'SERIEN PÅGÅR',
    body: pick([
      `Omgång ${nextRound} av 22. Position ${position} med ${points} poäng. Det är säsong.`,
      `Ni är på ${position}:e plats med ${points} poäng. Serien fortsätter och det finns fortfarande allt att spela för.`,
    ], nextRound),
  }
}
