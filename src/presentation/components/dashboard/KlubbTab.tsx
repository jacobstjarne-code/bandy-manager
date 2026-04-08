import type { NavigateFunction } from 'react-router-dom'
import type { SaveGame, StandingRow } from '../../../domain/entities/SaveGame'
import type { Club } from '../../../domain/entities/Club'
import { calcRoundIncome } from '../../../domain/services/economyService'
import { SquadStatusCard } from './SquadStatusCard'
import { CareerStatsCard } from './CareerStatsCard'

interface KlubbTabProps {
  game: SaveGame
  club: Club
  standing: StandingRow | null
  navigate: NavigateFunction
}

function formatTkr(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : n > 0 ? '+' : ''
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)} mkr`
  return `${sign}${Math.round(abs / 1_000)} tkr`
}

const NAV_BUTTON_STYLE: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
  background: 'transparent', border: '1px solid var(--border)',
  color: 'var(--accent)', fontSize: 12, lineHeight: 1,
  cursor: 'pointer',
}

export function KlubbTab({ game, club, standing, navigate }: KlubbTabProps) {
  const squadPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const injuredCount = squadPlayers.filter(p => p.isInjured).length
  const readyCount = Math.max(0, squadPlayers.length - injuredCount)
  const avgForm = squadPlayers.length > 0 ? Math.round(squadPlayers.reduce((s, p) => s + p.form, 0) / squadPlayers.length) : 0
  const avgFitness = squadPlayers.length > 0 ? Math.round(squadPlayers.reduce((s, p) => s + (p.fitness ?? 75), 0) / squadPlayers.length) : 0
  const morale = game.fanMood ?? 50
  const sharpness = Math.round(avgForm * 0.6 + avgFitness * 0.4)

  const { netPerRound } = calcRoundIncome({
    club,
    players: squadPlayers,
    sponsors: game.sponsors ?? [],
    communityActivities: game.communityActivities,
    fanMood: game.fanMood ?? 50,
    isHomeMatch: true,
    matchIsKnockout: false,
    matchIsCup: false,
    matchHasRivalry: false,
    standing: standing ?? null,
    rand: () => 0.5,
  })

  const finances = club.finances ?? 0
  const ca = game.communityActivities
  const activeIcons = [
    ca?.kiosk && ca.kiosk !== 'none' ? '🏪' : null,
    ca?.lottery && ca.lottery !== 'none' ? '🎟️' : null,
    ca?.bandyplay ? '🏒' : null,
    ca?.functionaries ? '🤝' : null,
  ].filter(Boolean)

  const unread = (game.inbox ?? []).filter(i => !i.isRead)
  const latestUnread = unread.sort((a, b) => b.date.localeCompare(a.date))[0]

  const freshReports = Object.values(game.scoutReports ?? {}).filter(r => r.scoutedSeason === game.currentSeason).length
  const activeObjectives = (game.boardObjectives ?? []).filter(o => o.status === 'active' || o.status === 'at_risk')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Squad status */}
      <SquadStatusCard
        readyCount={readyCount}
        injuredCount={injuredCount}
        avgForm={avgForm}
        avgFitness={avgFitness}
        morale={morale}
        sharpness={sharpness}
        onNavigateToSquad={() => navigate('/game/squad')}
      />

      {/* Ekonomi */}
      <div
        className="card-sharp"
        style={{ margin: '0 0 8px', cursor: 'pointer' }}
        onClick={() => navigate('/game/club', { state: { tab: 'ekonomi' } })}
      >
        <div style={{ padding: '10px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
                💰 Ekonomi
              </p>
              <span style={{ fontSize: 18, fontWeight: 400, color: finances < 0 ? 'var(--danger)' : 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                {Math.abs(finances) >= 1_000_000 ? `${(finances / 1_000_000).toFixed(1)} mkr` : `${Math.round(finances / 1_000)} tkr`}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: netPerRound >= 0 ? 'var(--success-light)' : 'var(--danger-text)', fontFamily: 'var(--font-body)' }}>
                {formatTkr(netPerRound)}/omg
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/game/club', { state: { tab: 'ekonomi' } }) }}
                style={NAV_BUTTON_STYLE}
              >›</button>
            </div>
          </div>
          {activeIcons.length > 0 && (
            <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
              <span className="tag tag-outline">{activeIcons.join(' ')} aktiva</span>
              <span
                onClick={e => { e.stopPropagation(); navigate('/game/club', { state: { tab: 'ekonomi' } }) }}
                className="btn btn-ghost"
                style={{ fontSize: 11 }}
              >
                Budget →
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Board objectives */}
      {activeObjectives.length > 0 && (
        <div
          className="card-sharp"
          style={{ margin: '0 0 8px', cursor: 'pointer' }}
          onClick={() => navigate('/game/club', { state: { tab: 'ekonomi' } })}
        >
          <div style={{ padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
                🎯 STYRELSEUPPDRAG
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/game/club', { state: { tab: 'ekonomi' } }) }}
                style={NAV_BUTTON_STYLE}
              >›</button>
            </div>
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {activeObjectives.slice(0, 2).map(obj => (
                <div key={obj.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, color: obj.status === 'at_risk' ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {obj.status === 'at_risk' ? '⚠️' : '○'}
                  </span>
                  <span style={{ fontSize: 11, color: obj.status === 'at_risk' ? 'var(--danger)' : 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                    {obj.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* P19 / Akademi */}
      {game.youthTeam && (
        <div
          className="card-sharp"
          style={{ margin: '0 0 8px', cursor: 'pointer' }}
          onClick={() => navigate('/game/club', { state: { tab: 'akademi' } })}
        >
          <div style={{ padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
                  🎓 Akademi
                </p>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                  P19 · {game.youthTeam.tablePosition}:a · {game.youthTeam.seasonRecord.w}V {game.youthTeam.seasonRecord.d}O {game.youthTeam.seasonRecord.l}F
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/game/club', { state: { tab: 'akademi' } }) }}
                style={NAV_BUTTON_STYLE}
              >›</button>
            </div>
          </div>
        </div>
      )}

      {/* Inkorg */}
      {latestUnread && (
        <div
          className="card-round"
          style={{ margin: '0 0 8px', cursor: 'pointer' }}
          onClick={() => navigate('/game/inbox')}
        >
          <div style={{ padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0, flexShrink: 0 }}>
                  📬 Inkorg
                </p>
                <span className="tag tag-fill" style={{ animation: 'breatheDot 2s ease-in-out infinite', flexShrink: 0 }}>
                  {unread.length}
                </span>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {latestUnread.title}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/game/inbox') }}
                style={{ ...NAV_BUTTON_STYLE, marginLeft: 8 }}
              >›</button>
            </div>
          </div>
        </div>
      )}

      {/* Scouting nudge */}
      {freshReports > 0 && (
        <div
          className="card-sharp"
          style={{ margin: '0 0 8px', padding: '10px 14px', cursor: 'pointer' }}
          onClick={() => navigate('/game/transfers')}
        >
          <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
            🔍 Du har {freshReports} färdig{freshReports > 1 ? 'a' : ''} scoutrapport{freshReports > 1 ? 'er' : ''}. Se transfers →
          </p>
        </div>
      )}

      {/* Karriärstatistik */}
      <CareerStatsCard game={game} />

    </div>
  )
}
