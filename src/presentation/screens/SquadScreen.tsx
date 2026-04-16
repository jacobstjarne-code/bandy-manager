import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useManagedPlayers, useHasPendingLineup, useManagedClub, useGameStore } from '../store/gameStore'
import { PlayerPosition, PlayerArchetype } from '../../domain/enums'
import type { Player } from '../../domain/entities/Player'
import type { LoanDeal } from '../../domain/entities/Academy'
import { StatBar } from '../components/StatBar'
import { PlayerCard } from '../components/PlayerCard'
import { getRecentMatchRatings } from '../components/playerCardUtils'
import { positionShort, POSITION_ORDER } from '../utils/formatters'
import { TRAIT_META } from '../../domain/data/playerTraits'
import { SectionCard } from '../components/SectionCard'
import { getPortraitPath } from '../../domain/services/portraitService'
import { FirstVisitHint } from '../components/FirstVisitHint'

type SortKey = 'position' | 'ca' | 'form' | 'age'
type FilterKey = 'all' | 'mv' | 'def' | 'half' | 'mid' | 'fwd'

const FILTER_TO_POSITION: Record<string, PlayerPosition> = {
  mv: PlayerPosition.Goalkeeper,
  def: PlayerPosition.Defender,
  half: PlayerPosition.Half,
  mid: PlayerPosition.Midfielder,
  fwd: PlayerPosition.Forward,
}

function caColor(ca: number): string {
  if (ca >= 75) return 'var(--accent)'
  if (ca >= 60) return 'var(--text-primary)'
  if (ca >= 40) return 'var(--accent)'
  return 'var(--text-secondary)'
}

function ratingColor(r: number): string {
  if (r >= 7.5) return 'var(--accent)'
  if (r >= 6.0) return 'var(--text-secondary)'
  return 'var(--danger)'
}

function barColor(value: number): string {
  if (value > 65) return 'var(--success)'
  if (value >= 40) return 'var(--warning)'
  return 'var(--danger)'
}


const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Alla' },
  { key: 'mv', label: 'MV' },
  { key: 'def', label: 'B' },
  { key: 'half', label: 'YH' },
  { key: 'mid', label: 'MF' },
  { key: 'fwd', label: 'A' },
]

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'position', label: 'Position' },
  { key: 'ca', label: 'Styrka' },
  { key: 'form', label: 'Form' },
  { key: 'age', label: 'Ålder' },
]

interface PlayerRowProps {
  player: Player
  onClick: () => void
}

interface PlayerRowAnimatedProps {
  player: Player
  index: number
  onClick: () => void
}

function PlayerRowAnimated({ player, index, onClick }: PlayerRowAnimatedProps) {
  return (
    <div style={{
      animation: index < 8 ? `fadeInUp 250ms ease-out ${index * 40}ms both` : 'none',
    }}>
      <PlayerRow player={player} onClick={onClick} />
    </div>
  )
}

function PlayerRow({ player, onClick }: PlayerRowProps) {
  const captainPlayerId = useGameStore(s => s.game?.captainPlayerId)
  const isCaptain = player.id === captainPlayerId
  let statusPill: React.ReactNode = null
  if (player.isInjured) {
    statusPill = (
      <span className="tag tag-red" style={{ flexShrink: 0 }}>
        🩹 Skadad
      </span>
    )
  } else if (player.suspensionGamesRemaining > 0) {
    statusPill = (
      <span className="tag tag-red" style={{ flexShrink: 0 }}>
        🚫 Avstängd
      </span>
    )
  }

  return (
    <div
      onClick={onClick}
      className="card-sharp"
      style={{
        padding: '10px 12px',
        marginBottom: 6,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        overflow: 'hidden',
      }}
    >
      {/* Top row: badge + name + CA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Player portrait */}
        <img
          src={getPortraitPath(player.id, player.age)}
          alt=""
          style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center 20%', border: '2px solid var(--border)', flexShrink: 0 }}
          onError={(e) => {
            const el = e.target as HTMLImageElement
            el.style.display = 'none'
          }}
        />

        {/* Name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-display)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {player.shirtNumber != null && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 4 }}>#{player.shirtNumber}</span>
            )}
            {isCaptain && (
              <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, marginRight: 4 }}>©</span>
            )}
            {player.firstName} {player.lastName}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>
            {positionShort(player.position)} · {player.age} år
          </p>
        </div>

        {/* CA badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              fontSize: 15,
              fontWeight: 800,
              color: caColor(player.currentAbility),
              textShadow: player.currentAbility >= 75
                ? '0 0 8px rgba(34,197,94,0.4)'
                : player.currentAbility < 40
                  ? '0 0 8px rgba(239,68,68,0.3)'
                  : undefined,
            }}>
              {Math.round(player.currentAbility)}
            </span>
            {player.startSeasonCA != null && player.currentAbility > player.startSeasonCA && (
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)' }}>
                ↑+{Math.round(player.currentAbility - player.startSeasonCA)}
              </span>
            )}
            {player.startSeasonCA != null && player.currentAbility < player.startSeasonCA && (
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)' }}>
                ↓{Math.round(player.currentAbility - player.startSeasonCA)}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Styrka</span>
            {player.age < 24 && (
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--ice)', background: 'rgba(126,179,212,0.1)', border: '1px solid rgba(126,179,212,0.25)', borderRadius: 4, padding: '1px 4px' }}>Utvecklas</span>
            )}
            {player.age >= 24 && player.age <= 30 && (
              <span className="tag tag-copper" style={{ fontSize: 9, fontWeight: 700, padding: '1px 4px' }}>Peak</span>
            )}
            {player.age > 30 && (
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', background: 'rgba(138,133,122,0.1)', border: '1px solid rgba(138,133,122,0.3)', borderRadius: 4, padding: '1px 4px' }}>Avtar</span>
            )}
          </div>
        </div>

        {/* Nav button */}
        <button style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 16, height: 16, borderRadius: 4, flexShrink: 0,
          background: 'transparent', border: '1px solid var(--border)',
          color: 'var(--accent)', fontSize: 11, lineHeight: 1,
          cursor: 'pointer',
        }}>›</button>
      </div>

      {/* Bottom row: form + fitness bars + status pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 46 }}>
        <div style={{ width: 50, flexShrink: 0 }}>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Form</p>
          <StatBar value={player.form} color={barColor(player.form)} height={5} />
        </div>
        <div style={{ width: 50, flexShrink: 0 }}>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Kond</p>
          <StatBar value={player.fitness} color={barColor(player.fitness)} height={5} />
        </div>
        {statusPill}
        {player.archetype === PlayerArchetype.CornerSpecialist && (
          <span className="tag tag-copper" style={{ flexShrink: 0 }}>
            📐 Hörnspec.
          </span>
        )}
        {(player.isFullTimePro ?? false) && (
          <span className="tag tag-fill" style={{ flexShrink: 0 }}>
            ⭐ Proffs
          </span>
        )}
        {!(player.isFullTimePro ?? false) && player.dayJob && (
          <span
            className="tag tag-outline"
            style={{ flexShrink: 0, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            👷 {player.dayJob.title}
          </span>
        )}
      </div>

      {/* Stat row */}
      {player.seasonStats.gamesPlayed > 0 && (
        <div style={{ display: 'flex', gap: 12, paddingLeft: 46, fontSize: 11, color: 'var(--text-muted)' }}>
          <span>{player.seasonStats.gamesPlayed}M</span>
          <span style={{ color: player.seasonStats.goals > 0 ? 'var(--text-primary)' : undefined }}>
            {player.seasonStats.goals}G
          </span>
          <span>{player.seasonStats.assists}A</span>
          <span style={{ color: ratingColor(player.seasonStats.averageRating) }}>
            {player.seasonStats.averageRating.toFixed(1)}★
          </span>
          {player.seasonStats.redCards > 0 && (
            <span style={{ color: 'var(--danger)' }}>{player.seasonStats.redCards}utv</span>
          )}
        </div>
      )}
    </div>
  )
}

export function SquadScreen() {
  const players = useManagedPlayers()
  const hasPendingLineup = useHasPendingLineup()
  const club = useManagedClub()
  const location = useLocation()
  const game = useGameStore(s => s.game)
  const talkToPlayer = useGameStore(s => s.talkToPlayer)
  const useLeadershipAction = useGameStore(s => s.useLeadershipAction)
  const markScreenVisited = useGameStore(s => s.markScreenVisited)
  const dismissHint = useGameStore(s => s.dismissHint)
  useEffect(() => { markScreenVisited('squad') }, [])
  const [sort, setSort] = useState<SortKey>('position')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [talkFeedback, setTalkFeedback] = useState<{ text: string; moraleChange: number; formChange: number } | null>(null)
  const [leadershipFeedback, setLeadershipFeedback] = useState<string | null>(null)

  const currentRound = game
    ? (game.fixtures.filter(f => f.status === 'completed').sort((a, b) => b.matchday - a.matchday)[0]?.matchday ?? 0)
    : 0

  function handleTalk(playerId: string, choice: 'encourage' | 'demand' | 'future') {
    const result = talkToPlayer(playerId, choice, currentRound)
    setTalkFeedback({ text: result.feedback, moraleChange: result.moraleChange, formChange: result.formChange })
    setTimeout(() => setTalkFeedback(null), 4000)
  }

  function handleLeadership(playerId: string, action: import('../../domain/services/leadershipService').LeadershipAction) {
    const result = useLeadershipAction(playerId, action, currentRound)
    if (result) {
      setLeadershipFeedback(result.feedback)
      setTimeout(() => setLeadershipFeedback(null), 4000)
    }
  }

  useEffect(() => {
    const highlightId = (location.state as { highlightPlayer?: string } | null)?.highlightPlayer
    if (highlightId) {
      setSelectedPlayerId(highlightId)
      // Clear state so back/forward nav doesn't re-open
      window.history.replaceState({ ...window.history.state, usr: {} }, '')
    }
  }, [location.state])

  const filtered = filter === 'all'
    ? players
    : players.filter(p => p.position === FILTER_TO_POSITION[filter])

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'position') return POSITION_ORDER[a.position] - POSITION_ORDER[b.position]
    if (sort === 'ca') return b.currentAbility - a.currentAbility
    if (sort === 'form') return b.form - a.form
    if (sort === 'age') return a.age - b.age
    return 0
  })

  const navigate = useNavigate()
  const selectedPlayer = selectedPlayerId ? players.find(p => p.id === selectedPlayerId) ?? null : null
  const clubName = club?.name ?? ''
  const topScorer = players.filter(p => p.seasonStats.goals > 0).sort((a, b) => b.seasonStats.goals - a.seasonStats.goals)[0]
  const topAssist = players.filter(p => p.seasonStats.assists > 0).sort((a, b) => b.seasonStats.assists - a.seasonStats.assists)[0]
  const topRating = players.filter(p => p.seasonStats.gamesPlayed >= 3).sort((a, b) => b.seasonStats.averageRating - a.seasonStats.averageRating)[0]
  const topSuspensions = players.filter(p => p.seasonStats.redCards > 0).sort((a, b) => b.seasonStats.redCards - a.seasonStats.redCards)[0]
  const hasSeasonData = topScorer || topAssist || topRating || topSuspensions

  const dismissed = game?.dismissedHints ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      {!dismissed.includes('squad') && (
        <FirstVisitHint
          screenId="squad"
          text="Dra spelare till positioner. Grön ring = rätt plats. Gul = kan funka. Utan lineup kan du inte spela."
          onDismiss={() => dismissHint('squad')}
        />
      )}
      {/* Header */}
      <div style={{ padding: '10px 16px 8px', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
        {/* Lineup hint */}
        {!hasPendingLineup && (
          <div className="card-stagger-1" style={{
            background: 'rgba(196,122,58,0.08)',
            border: '1px solid rgba(196,122,58,0.2)',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 13,
            color: 'var(--text-secondary)',
            marginBottom: 12,
            animation: 'fadeInUp 300ms ease-out both',
          }}>
            💡 Välj 11 startspelare och 5 avbytare. Tryck på en spelare för att lägga till dem i laget.
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, marginBottom: 12 }}>
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`btn ${filter === tab.key ? 'btn-copper' : 'btn-ghost'}`}
              style={{ flexShrink: 0, padding: '6px 12px', fontSize: 11 }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort row */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 4 }}>Sortera:</span>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setSort(opt.key)}
              className={`btn ${sort === opt.key ? 'btn-ghost' : 'btn-ghost'}`}
              style={{
                padding: '3px 8px',
                fontSize: 12,
                fontWeight: sort === opt.key ? 700 : 400,
                color: sort === opt.key ? 'var(--text-primary)' : 'var(--text-muted)',
                background: sort === opt.key ? 'var(--bg-elevated)' : 'transparent',
                border: sort === opt.key ? '1px solid var(--border)' : '1px solid transparent',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Player list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
        {/* Fitness warning */}
        {players.filter(p => p.fitness < 35 && !p.isInjured).length >= 2 && (
          <div
            onClick={() => navigate('/game/club', { state: { tab: 'training' } })}
            style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 12,
              cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--danger)' }}>
              ⚡ {players.filter(p => p.fitness < 35 && !p.isInjured).length} spelare med kritisk fitness
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Se träning →</span>
          </div>
        )}

        {/* Squad summary card */}
        {hasSeasonData && (
          <div className="card-sharp" style={{
            padding: '12px',
            marginBottom: 12,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
          }}>
            {[
              { emoji: '🏒', label: 'Toppskytt', player: topScorer, value: topScorer?.seasonStats.goals },
              { emoji: '🅰️', label: 'Flest assist', player: topAssist, value: topAssist?.seasonStats.assists },
              { emoji: '⭐', label: 'Bäst betyg', player: topRating, value: topRating ? topRating.seasonStats.averageRating.toFixed(1) : undefined },
              { emoji: '🏒', label: 'Utvisningar', player: topSuspensions, value: topSuspensions?.seasonStats.redCards },
            ].map(({ emoji, label, player: p, value }) => (
              <div
                key={label}
                onClick={p ? () => setSelectedPlayerId(p.id) : undefined}
                style={{
                  padding: '8px 10px',
                  background: 'var(--bg-surface)',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  cursor: p ? 'pointer' : 'default',
                }}
              >
                <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>{emoji} {label}</p>
                {p ? (
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {p.lastName} <span style={{ color: 'var(--accent)', fontWeight: 800 }}>{value}</span>
                  </p>
                ) : (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* WEAK-021: Omklädningsrummet */}
        {(() => {
          if (players.length < 3) return null
          const captainId = game?.captainPlayerId
          const sorted = [...players].sort((a, b) => (b.loyaltyScore ?? 0) - (a.loyaltyScore ?? 0))
          const innerCircle = [
            captainId ? players.find(p => p.id === captainId) : null,
            ...sorted.filter(p => p.id !== captainId).slice(0, 3),
          ].filter(Boolean) as typeof players
          const peripheral = sorted.filter(p => (p.loyaltyScore ?? 5) < 4).slice(0, 3)
          return (
            <div className="card-sharp" style={{ padding: 12, marginBottom: 12 }}>
              <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
                🚪 OMKLÄDNINGSRUMMET
              </p>
              <div style={{ marginBottom: peripheral.length > 0 ? 10 : 0 }}>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>INRE CIRKEL</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {innerCircle.map(p => (
                    <div key={p.id} onClick={() => setSelectedPlayerId(p.id)} style={{ padding: '4px 8px', background: 'rgba(196,122,58,0.12)', border: '1px solid rgba(196,122,58,0.3)', borderRadius: 4, fontSize: 10, cursor: 'pointer' }}>
                      {p.lastName}{p.id === captainId && ' (C)'}
                    </div>
                  ))}
                </div>
              </div>
              {peripheral.length > 0 && (
                <div>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>UTANFÖR</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {peripheral.map(p => (
                      <div key={p.id} onClick={() => setSelectedPlayerId(p.id)} style={{ padding: '4px 8px', background: 'var(--border-subtle)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 10, opacity: 0.65, cursor: 'pointer' }}>
                        {p.lastName}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p style={{ fontSize: 10, fontStyle: 'italic', marginTop: 8, color: 'var(--text-muted)' }}>
                Inre cirkel: kapten + spelare med högst lojalitet. Utanför: låg lojalitet.
              </p>
            </div>
          )
        })()}

        <SectionCard title="TRUPPEN" variant="sharp" style={{ margin: '0 0 16px' }}>
          {sorted.map((player, index) => (
            <PlayerRowAnimated
              key={player.id}
              player={player}
              index={index}
              onClick={() => setSelectedPlayerId(player.id)}
            />
          ))}
          {sorted.length === 0 && (
            <p style={{ padding: '24px 0', color: 'var(--text-muted)', textAlign: 'center', fontSize: 14 }}>
              Inga spelare i denna position
            </p>
          )}
        </SectionCard>

        {/* Låneavtal */}
        {(game?.loanDeals ?? []).length > 0 && (
          <SectionCard title="UTLÅNADE SPELARE" variant="sharp" style={{ margin: '0 0 16px' }}>
            {(game?.loanDeals ?? []).map((deal: LoanDeal) => {
              const player = game?.players.find(p => p.id === deal.playerId)
              if (!player) return null
              const completedLeague = game?.fixtures.filter(f => f.status === 'completed' && !f.isCup).length ?? 0
              const roundsLeft = (deal.endRound ?? 22) - completedLeague
              return (
                <div key={deal.playerId} style={{
                  background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6,
                  padding: '10px 14px', marginBottom: 8,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{player.firstName} {player.lastName}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{deal.destinationClubName} · {deal.matchesPlayed ?? 0}/{deal.totalMatches ?? '?'} matcher</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>Betyg: {deal.averageRating > 0 ? deal.averageRating.toFixed(1) : '—'}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{Math.max(0, roundsLeft)} omg. kvar</p>
                  </div>
                </div>
              )
            })}
          </SectionCard>
        )}

        <div style={{ height: 90 }} />
      </div>

      {/* Player Card Modal */}
      {selectedPlayer && (
        <div
          onClick={() => setSelectedPlayerId(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(0,0,0,0.6)',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: 430,
            margin: '0 auto',
            padding: '40px 20px calc(var(--bottom-nav-height) + 80px)',
          }}
        >
          {/* Unified card surface — everything scrollable inside the overlay */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
            background: 'var(--bg)',
            borderRadius: 12,
            boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
            border: '1px solid var(--border)',
            width: '100%',
            maxWidth: 390,
            position: 'relative',
            overflow: 'hidden',
          }}>
          <PlayerCard
            player={selectedPlayer}
            clubName={clubName}
            onClick={undefined}
            currentSeason={game?.currentSeason}
            storylines={(game?.storylines ?? []).filter(s => s.playerId === selectedPlayer.id && s.resolved)}
            onExtendContract={() => navigate('/game/transfers', { state: { tab: 'contracts', renewPlayerId: selectedPlayer.id } })}
            onClose={() => setSelectedPlayerId(null)}
            game={game ?? undefined}
            recentRatings={game ? getRecentMatchRatings(game.fixtures, game.clubs, selectedPlayer.id, game.managedClubId, 5) : undefined}
            onTalkToPlayer={(choice) => handleTalk(selectedPlayer.id, choice)}
            talkFeedback={talkFeedback}
            onLeadershipAction={(action) => { handleLeadership(selectedPlayer.id, action); return null }}
            leadershipFeedback={leadershipFeedback}
          />

          {/* Karaktärsspelare badge */}
          {selectedPlayer.isCharacterPlayer && selectedPlayer.trait && (() => {
            const meta = TRAIT_META[selectedPlayer.trait]
            const ls = selectedPlayer.loyaltyScore ?? 5
            return (
              <div style={{
                margin: '0 14px 12px', padding: '10px 14px',
                background: 'var(--bg-elevated)', border: `1px solid ${meta.color}44`,
                borderRadius: 8,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 22 }}>{meta.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: meta.color, letterSpacing: '0.5px' }}>
                      {meta.label}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      Lojalitet {ls}/10
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{meta.description}</p>
                </div>
              </div>
            )
          })()}
          </div>{/* end card surface */}
        </div>
      )}
    </div>
  )
}
