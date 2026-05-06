import type { Fixture } from '../../../domain/entities/Fixture'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { getRivalry } from '../../../domain/data/rivalries'
import { FixtureStatus } from '../../../domain/enums'

interface PreMatchContextProps {
  fixture: Fixture
  game: SaveGame
  isHome: boolean
}

const NUMBER_WORDS: Record<number, string> = {
  3: 'Tre',
  4: 'Fyra',
  5: 'Fem',
  6: 'Sex',
  7: 'Sju',
  8: 'Åtta',
  9: 'Nio',
  10: 'Tio',
}

function streakWord(n: number): string {
  return NUMBER_WORDS[n] ?? `${n}`
}

function deriveContextText(
  fixture: Fixture,
  game: SaveGame,
): string | null {
  const managedClubId = game.managedClubId
  const opponentId =
    fixture.homeClubId === managedClubId ? fixture.awayClubId : fixture.homeClubId
  const opponent = game.clubs.find(c => c.id === opponentId)
  const opponentShortName = opponent?.name ?? 'Motståndaren'

  // 1. Derby
  const rivalry = getRivalry(managedClubId, opponentId)
  if (rivalry) {
    return `Derbyt. ${opponentShortName}.`
  }

  // Hämta spelarens avslutade matcher i kronologisk ordning (nyast sist)
  const completedOwn = game.fixtures
    .filter(
      f =>
        f.status === FixtureStatus.Completed &&
        (f.homeClubId === managedClubId || f.awayClubId === managedClubId),
    )
    .sort((a, b) => a.matchday - b.matchday)

  // Räkna streak
  let winStreak = 0
  let lossStreak = 0
  for (let i = completedOwn.length - 1; i >= 0; i--) {
    const f = completedOwn[i]
    const isHome = f.homeClubId === managedClubId
    const myScore = isHome ? f.homeScore : f.awayScore
    const theirScore = isHome ? f.awayScore : f.homeScore
    if (myScore > theirScore) {
      if (lossStreak > 0) break
      winStreak++
    } else if (myScore < theirScore) {
      if (winStreak > 0) break
      lossStreak++
    } else {
      break
    }
  }

  // 2. Vinst-streak ≥3
  if (winStreak >= 3) {
    return `${streakWord(winStreak)} raka vinster. Håll det.`
  }

  // 3. Förlust-streak ≥3
  if (lossStreak >= 3) {
    return `${streakWord(lossStreak)} raka förluster. Något måste brytas.`
  }

  // 4. Tabellkontext
  const myStanding = game.standings.find(s => s.clubId === managedClubId)
  if (myStanding) {
    const pos = myStanding.position
    const myPoints = myStanding.points

    // Kolla uppåt — position ovanför
    const above = game.standings.find(s => s.position === pos - 1)
    if (above && above.points - myPoints <= 2) {
      return `En poäng upp till ${pos - 1}:an.`
    }

    // Kolla nedåt — nedflyttningsstreck är position > 8 (slutspelsgräns)
    if (pos <= 8) {
      const below = game.standings.find(s => s.position === pos + 1)
      if (below && myPoints - below.points <= 1) {
        return `En poäng ner till nedflyttningsstrecket.`
      }
    }
  }

  // 5. Motståndares form (senaste 5 matcher)
  const opponentCompleted = game.fixtures
    .filter(
      f =>
        f.status === FixtureStatus.Completed &&
        (f.homeClubId === opponentId || f.awayClubId === opponentId),
    )
    .sort((a, b) => a.matchday - b.matchday)
    .slice(-5)

  if (opponentCompleted.length >= 4) {
    let opponentWins = 0
    let opponentLosses = 0
    for (const f of opponentCompleted) {
      const oppIsHome = f.homeClubId === opponentId
      const oppScore = oppIsHome ? f.homeScore : f.awayScore
      const othScore = oppIsHome ? f.awayScore : f.homeScore
      if (oppScore > othScore) opponentWins++
      else if (oppScore < othScore) opponentLosses++
    }
    if (opponentWins >= 4) {
      return `${opponentShortName} i strålande form.`
    }
    if (opponentLosses >= 4) {
      return `${opponentShortName} på en svacka.`
    }
  }

  // 6. Fallback — ingen trigger
  return null
}

export function PreMatchContext({ fixture, game }: PreMatchContextProps) {
  const text = deriveContextText(fixture, game)
  if (!text) return null

  return (
    <div
      style={{
        padding: '8px 12px',
        marginBottom: 6,
        borderBottom: '1px solid var(--border)',
      }}
    >
      <p
        style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          fontStyle: 'italic',
          margin: 0,
          textAlign: 'center',
        }}
      >
        {text}
      </p>
    </div>
  )
}
