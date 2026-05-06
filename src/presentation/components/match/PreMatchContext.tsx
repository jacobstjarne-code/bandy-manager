import type { Fixture } from '../../../domain/entities/Fixture'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { getRivalry } from '../../../domain/data/rivalries'
import { FixtureStatus } from '../../../domain/enums'
import {
  pickPreMatchContextText,
  type PreMatchTrigger,
  type PreMatchSubs,
} from '../../../domain/data/preMatchContextStrings'

interface PreMatchContextProps {
  fixture: Fixture
  game: SaveGame
  isHome: boolean
}

const SUFFIX_PATTERN = /\s+(AIK|IBK|BK)$/

function shortName(name: string): string {
  if (name.length <= 12) return name
  return name.replace(SUFFIX_PATTERN, '')
}

interface ContextResult {
  trigger: PreMatchTrigger
  subs: Omit<PreMatchSubs, 'fixtureId'>
}

function deriveContext(
  fixture: Fixture,
  game: SaveGame,
  isHome: boolean,
): ContextResult | null {
  const managedClubId = game.managedClubId
  const opponentId =
    fixture.homeClubId === managedClubId ? fixture.awayClubId : fixture.homeClubId
  const opponent = game.clubs.find(c => c.id === opponentId)
  const opp = shortName(opponent?.name ?? 'Motståndaren')

  // 1. Derby
  if (getRivalry(managedClubId, opponentId)) {
    return { trigger: 'derby', subs: { opp } }
  }

  // Spelarens avslutade matcher i kronologisk ordning
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
    const isManagedHome = f.homeClubId === managedClubId
    const myScore = isManagedHome ? f.homeScore : f.awayScore
    const theirScore = isManagedHome ? f.awayScore : f.homeScore
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
    return { trigger: 'win_streak', subs: { n: winStreak } }
  }

  // 3. Förlust-streak ≥3
  if (lossStreak >= 3) {
    return { trigger: 'loss_streak', subs: { n: lossStreak } }
  }

  // 4. Tabellkontext
  const myStanding = game.standings.find(s => s.clubId === managedClubId)
  if (myStanding) {
    const pos = myStanding.position
    const myPoints = myStanding.points

    const above = game.standings.find(s => s.position === pos - 1)
    if (above && above.points - myPoints <= 2) {
      return { trigger: 'table_above', subs: { pos: pos - 1 } }
    }

    if (pos <= 8) {
      const below = game.standings.find(s => s.position === pos + 1)
      if (below && myPoints - below.points <= 1) {
        return { trigger: 'table_below', subs: {} }
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
      return { trigger: 'opp_hot', subs: { opp } }
    }

    // 6. Motståndares hemmaobesegradhet (ny trigger, prio efter opp_hot)
    if (!isHome) {
      const opponentHomeCompleted = game.fixtures
        .filter(
          f =>
            f.status === FixtureStatus.Completed &&
            f.homeClubId === opponentId,
        )
        .sort((a, b) => a.matchday - b.matchday)

      let homeUnbeaten = 0
      for (let i = opponentHomeCompleted.length - 1; i >= 0; i--) {
        const f = opponentHomeCompleted[i]
        const oppScore = f.homeScore
        const othScore = f.awayScore
        if (oppScore >= othScore) {
          homeUnbeaten++
        } else {
          break
        }
      }
      if (homeUnbeaten >= 5) {
        return { trigger: 'opp_home_unbeaten', subs: { opp, n: homeUnbeaten } }
      }
    }

    if (opponentLosses >= 4) {
      return { trigger: 'opp_cold', subs: { opp } }
    }
  }

  // 7. Cup-match (lägst prio)
  if (fixture.isCup) {
    return { trigger: 'cup_fixture', subs: {} }
  }

  return null
}

export function PreMatchContext({ fixture, game, isHome }: PreMatchContextProps) {
  const result = deriveContext(fixture, game, isHome)
  if (!result) return null

  const text = pickPreMatchContextText(result.trigger, {
    ...result.subs,
    fixtureId: fixture.id,
  })

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
