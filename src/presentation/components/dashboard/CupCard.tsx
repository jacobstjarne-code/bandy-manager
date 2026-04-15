import { useNavigate } from 'react-router-dom'
import type { CupBracket } from '../../../domain/entities/Cup'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { getCupRoundLabel, getManagedClubCupStatus } from '../../../domain/services/cupService'

interface CupCardProps {
  bracket: CupBracket
  game: SaveGame
}

const CUP_STAGES = [
  { round: 1, label: 'Förstarunda' },
  { round: 2, label: 'QF' },
  { round: 3, label: 'SF' },
  { round: 4, label: 'Final' },
]

function CupProgressRow({ wonRounds, currentRound, eliminated }: { wonRounds: number[], currentRound: number, eliminated: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 8 }}>
      {CUP_STAGES.map((stage, i) => {
        const done = wonRounds.includes(stage.round)
        const active = !eliminated && stage.round === currentRound && !done
        return (
          <div key={stage.round} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {i > 0 && <span style={{ fontSize: 9, color: 'var(--border)' }}>›</span>}
            <span style={{
              fontSize: 9, fontWeight: done || active ? 700 : 400,
              color: done ? 'var(--success)' : active ? 'var(--accent)' : 'var(--text-muted)',
            }}>
              {done ? `✓ ${stage.label}` : active ? `● ${stage.label}` : `○ ${stage.label}`}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function CupCard({ bracket, game }: CupCardProps) {
  const navigate = useNavigate()
  const managedClubId = game.managedClubId
  const cupStatus = getManagedClubCupStatus(bracket, managedClubId)
  const nextCupFixture = game.fixtures
    .filter(f => f.isCup && f.status === 'scheduled' &&
      (f.homeClubId === managedClubId || f.awayClubId === managedClubId))
    .sort((a, b) => a.matchday - b.matchday)[0]
  const roundsWithMatches = [...new Set(bracket.matches.map(m => m.round))]
  const currentRound = Math.max(...roundsWithMatches)
  const stageLabel = getCupRoundLabel(currentRound)

  const completedCupFixIds = new Set(game.fixtures.filter(f => f.isCup && f.status === 'completed').map(f => f.id))
  const managedBracketMatches = bracket.matches.filter(m =>
    (m.homeClubId === managedClubId || m.awayClubId === managedClubId) && !m.isBye
  )
  const wonRounds = managedBracketMatches
    .filter(m => m.winnerId === managedClubId && m.fixtureId && completedCupFixIds.has(m.fixtureId))
    .map(m => m.round)

  let statusContent: React.ReactNode

  if (bracket.completed && bracket.winnerId === managedClubId) {
    statusContent = (
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <span style={{ fontSize: 24 }}>🏆</span>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-dark)', marginTop: 4, fontFamily: 'var(--font-display)' }}>CUPVINNARE!</p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Svenska Cupen {bracket.season}</p>
      </div>
    )
  } else if (bracket.completed) {
    const winner = game.clubs.find(c => c.id === bracket.winnerId)
    statusContent = (
      <div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'var(--font-body)' }}>Cupen är avgjord</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>🏆 {winner?.name ?? 'Okänd klubb'} vann Svenska Cupen</p>
      </div>
    )
  } else if (cupStatus.eliminated) {
    const roundName = cupStatus.eliminatedInRound === 1 ? 'förstarundan' : cupStatus.eliminatedInRound === 2 ? 'kvartsfinalen' : cupStatus.eliminatedInRound === 3 ? 'semifinalen' : 'finalen'
    const winner = bracket.winnerId ? game.clubs.find(c => c.id === bracket.winnerId) : null
    statusContent = (
      <div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: winner ? 4 : 0, fontFamily: 'var(--font-body)' }}>Utslagna i {roundName}</p>
        {winner && <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Vinnare: {winner.name}</p>}
      </div>
    )
  } else if (nextCupFixture) {
    const opponent = game.clubs.find(c => c.id === (nextCupFixture.homeClubId === managedClubId ? nextCupFixture.awayClubId : nextCupFixture.homeClubId))
    const isHome = nextCupFixture.homeClubId === managedClubId
    const cupMatch = bracket.matches.find(m => m.fixtureId === nextCupFixture.id)
    const cupRound = cupMatch?.round ?? nextCupFixture.roundNumber
    const roundLabel = cupRound === 1 ? 'Förstarunda' : cupRound === 2 ? 'Kvartsfinal' : cupRound === 3 ? 'Semifinal' : 'Final'
    const allScheduled = game.fixtures.filter(f => f.status === 'scheduled')
    const globalNextMatchday = allScheduled.length > 0 ? Math.min(...allScheduled.map(f => f.matchday)) : 0
    const isNextToPlay = nextCupFixture.matchday === globalNextMatchday
    const lastMatchday = Math.max(0, ...game.fixtures.filter(f => f.status === 'completed').map(f => f.matchday))
    const isThisMatchday = nextCupFixture.matchday === lastMatchday + 1
    statusContent = (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
            {roundLabel} vs {opponent?.shortName ?? opponent?.name ?? '?'}
          </span>
          <span className={isHome ? 'tag tag-green' : 'tag tag-ice'}>{isHome ? 'Hemma' : 'Borta'}</span>
        </div>
        <p style={{ fontSize: 11, color: isNextToPlay ? 'var(--warning)' : 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-body)' }}>
          {isNextToPlay ? '⚡ Spelas denna omgång' : isThisMatchday ? '⚡ Spelas snart' : `Matchdag ${nextCupFixture.matchday}`}
        </p>
      </div>
    )
  } else {
    const hasBye = bracket.matches.some(m => m.isBye && m.homeClubId === managedClubId)
    const highestWonRound = wonRounds.length > 0 ? Math.max(...wonRounds) : (hasBye ? 1 : 0)
    const CUP_ROUND_MATCHDAYS: Record<number, number> = { 1: 3, 2: 8, 3: 13, 4: 19 }
    const nextCupRound = highestWonRound + 1
    const nextRoundName = nextCupRound === 2 ? 'kvartsfinal'
      : nextCupRound === 3 ? 'semifinal'
      : nextCupRound === 4 ? 'final' : ''
    const nextRoundMatchday = CUP_ROUND_MATCHDAYS[nextCupRound]
    statusContent = nextRoundName
      ? (
        <div>
          {highestWonRound >= 1 && (
            <p style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600, marginBottom: 4 }}>
              Grattis — ni är i {nextRoundName}! Motståndare lottas snart.
            </p>
          )}
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            Spelas matchdag {nextRoundMatchday ?? '?'}
          </p>
        </div>
      )
      : <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Drar igång under säsongen</p>
  }

  return (
    <div
      className="card-sharp card-stagger-3"
      style={{ margin: '0 0 8px', overflow: 'hidden', cursor: 'pointer' }}
      onClick={() => navigate('/game/tabell', { state: { tab: 'cupen' } })}
    >
      <div style={{ padding: '10px 14px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
            🏆 SVENSKA CUPEN
          </p>
          {!bracket.completed && !cupStatus.eliminated && <span className="tag tag-copper">{stageLabel}</span>}
        </div>
        {!bracket.completed && (
          <CupProgressRow
            wonRounds={wonRounds}
            currentRound={currentRound}
            eliminated={cupStatus.eliminated}
          />
        )}
      </div>
      <div style={{ padding: '0 14px 10px' }}>{statusContent}</div>
    </div>
  )
}
