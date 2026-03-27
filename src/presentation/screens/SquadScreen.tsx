import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useManagedPlayers, useHasPendingLineup, useManagedClub, useGameStore } from '../store/gameStore'
import { PlayerPosition, PlayerArchetype } from '../../domain/enums'
import type { Player } from '../../domain/entities/Player'
import { StatBar } from '../components/StatBar'
import { PlayerCard } from '../components/PlayerCard'
import { positionShort, POSITION_ORDER } from '../utils/formatters'
import { TRAIT_META } from '../../domain/data/playerTraits'

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
  if (ca >= 75) return '#C47A3A'
  if (ca >= 60) return '#1A1A18'
  if (ca >= 40) return '#C47A3A'
  return '#9A9590'
}

function barColor(value: number): string {
  if (value > 65) return '#22c55e'
  if (value >= 40) return '#f59e0b'
  return '#ef4444'
}

function archetypeColor(arch: PlayerArchetype): string {
  const map: Partial<Record<PlayerArchetype, string>> = {
    [PlayerArchetype.Finisher]: '#c0392b',
    [PlayerArchetype.Playmaker]: '#2563EB',
    [PlayerArchetype.DefensiveWorker]: '#1a5e3a',
    [PlayerArchetype.TwoWaySkater]: '#5a2d7a',
    [PlayerArchetype.ReflexGoalkeeper]: '#8B6914',
    [PlayerArchetype.PositionalGoalkeeper]: '#7b5a14',
    [PlayerArchetype.Dribbler]: '#1a5e8a',
    [PlayerArchetype.CornerSpecialist]: '#4a3a8a',
    [PlayerArchetype.RawTalent]: '#2d6e2d',
  }
  return map[arch] ?? '#1e4d8c'
}

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Alla' },
  { key: 'mv', label: 'MV' },
  { key: 'def', label: 'DEF' },
  { key: 'half', label: 'HALF' },
  { key: 'mid', label: 'MID' },
  { key: 'fwd', label: 'FWD' },
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
  const archColor = archetypeColor(player.archetype)

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
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '12px',
        marginBottom: 8,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {/* Top row: badge + name + CA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Archetype badge */}
        <div style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: archColor,
          border: '1px solid rgba(201,168,76,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 800,
          color: 'var(--text-light)',
          flexShrink: 0,
        }}>
          {positionShort(player.position).charAt(0)}
        </div>

        {/* Name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {player.firstName} {player.lastName}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>
            {positionShort(player.position)} · {player.age}v
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
              <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e' }}>
                ↑+{Math.round(player.currentAbility - player.startSeasonCA)}
              </span>
            )}
            {player.startSeasonCA != null && player.currentAbility < player.startSeasonCA && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444' }}>
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
              <span style={{ fontSize: 9, fontWeight: 700, color: '#C9A84C', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 4, padding: '1px 4px' }}>Peak</span>
            )}
            {player.age > 30 && (
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', background: 'rgba(138,133,122,0.1)', border: '1px solid rgba(138,133,122,0.3)', borderRadius: 4, padding: '1px 4px' }}>Avtar</span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <span style={{ color: 'var(--text-muted)', fontSize: 14, marginLeft: 2 }}>▸</span>
      </div>

      {/* Bottom row: form + fitness bars + status pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 38 }}>
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
            className={(player.dayJob.flexibility ?? 75) < 65 ? 'tag tag-red' : 'tag tag-outline'}
            style={{ flexShrink: 0 }}
          >
            👷 {player.dayJob.title}
          </span>
        )}
      </div>
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
  const [sort, setSort] = useState<SortKey>('position')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [talkFeedback, setTalkFeedback] = useState<{ text: string; moraleChange: number; formChange: number } | null>(null)

  const currentRound = game
    ? (game.fixtures.filter(f => f.status === 'completed').sort((a, b) => b.roundNumber - a.roundNumber)[0]?.roundNumber ?? 0)
    : 0

  function handleTalk(playerId: string, choice: 'encourage' | 'demand' | 'future') {
    const result = talkToPlayer(playerId, choice, currentRound)
    setTalkFeedback({ text: result.feedback, moraleChange: result.moraleChange, formChange: result.formChange })
    setTimeout(() => setTalkFeedback(null), 4000)
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
  const doctorQuestionsLeft = Math.max(0, 5 - (game?.doctorQuestionsUsed ?? 0))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 0', flexShrink: 0 }}>
        <h2 style={{
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          marginBottom: 14,
        }}>
          Trupp
        </h2>

        {/* Lineup hint */}
        {!hasPendingLineup && (
          <div className="card-stagger-1" style={{
            background: 'rgba(196,122,58,0.08)',
            border: '1px solid rgba(196,122,58,0.2)',
            borderRadius: 10,
            padding: '12px 14px',
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
              style={{
                flexShrink: 0,
                padding: '5px 12px',
                borderRadius: 99,
                background: filter === tab.key ? 'rgba(201,168,76,0.12)' : 'var(--bg-elevated)',
                border: '1px solid ' + (filter === tab.key ? '#C9A84C' : 'var(--border)'),
                color: filter === tab.key ? '#C9A84C' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: filter === tab.key ? 'inset 0 -2px 0 #C9A84C' : undefined,
              }}
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
              style={{
                padding: '3px 8px',
                borderRadius: 6,
                background: sort === opt.key ? 'var(--bg-elevated)' : 'transparent',
                border: '1px solid ' + (sort === opt.key ? 'var(--border)' : 'transparent'),
                color: sort === opt.key ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: sort === opt.key ? 700 : 400,
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Player list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
        {/* Doktorn-banner vid kritisk fitness */}
        {players.filter(p => p.fitness < 35 && !p.isInjured).length >= 2 && (
          <div
            onClick={() => navigate('/game/doctor')}
            style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 12,
              cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 13, color: '#ef4444' }}>
              🩺 {players.filter(p => p.fitness < 35 && !p.isInjured).length} spelare med kritisk fitness
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Fråga doktorn →</span>
          </div>
        )}
        {sorted.map((player, index) => (
          <PlayerRowAnimated
            key={player.id}
            player={player}
            index={index}
            onClick={() => setSelectedPlayerId(player.id)}
          />
        ))}
        {sorted.length === 0 && (
          <p style={{ padding: '40px 16px', color: 'var(--text-muted)', textAlign: 'center', fontSize: 14 }}>
            Inga spelare i denna position
          </p>
        )}
        {/* Låneavtal */}
        {(game?.loanDeals ?? []).length > 0 && (
          <div style={{ marginTop: 20, marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
              UTLÅNADE SPELARE
            </p>
            {(game?.loanDeals ?? []).map((deal: any) => {
              const player = game?.players.find(p => p.id === deal.playerId)
              if (!player) return null
              const completedLeague = game?.fixtures.filter(f => f.status === 'completed' && !f.isCup).length ?? 0
              const roundsLeft = (deal.endRound ?? 22) - completedLeague
              return (
                <div key={deal.playerId} style={{
                  background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10,
                  padding: '10px 14px', marginBottom: 8,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{player.firstName} {player.lastName}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{deal.destinationClubName} · {deal.matchesPlayed ?? 0}/{deal.totalMatches ?? '?'} matcher</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 12, color: '#C9A84C', fontWeight: 700 }}>Betyg: {deal.averageRating > 0 ? deal.averageRating.toFixed(1) : '—'}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{Math.max(0, roundsLeft)} omg. kvar</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <button
          onClick={() => navigate('/game/doctor')}
          style={{
            width: '100%', margin: '8px 0 90px',
            padding: '12px',
            background: 'rgba(126,179,212,0.08)',
            border: '1px solid rgba(126,179,212,0.25)',
            borderRadius: 10,
            color: 'var(--ice)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          🩺 Fråga Bandydoktorn · {doctorQuestionsLeft} frågor kvar
        </button>
      </div>

      {/* Player Card Modal */}
      {selectedPlayer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(14,13,11,0.95)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            maxWidth: 430,
            margin: '0 auto',
            padding: '20px',
          }}
        >
          {/* Close button */}
          <div style={{
            position: 'absolute',
            top: 16,
            right: 16,
          }}>
            <button
              onClick={() => setSelectedPlayerId(null)}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text-secondary)',
                width: 36,
                height: 36,
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>

          {/* The premium PlayerCard */}
          <PlayerCard
            player={selectedPlayer}
            clubName={clubName}
            onClick={undefined}
          />

          {/* Karaktärsspelare badge */}
          {selectedPlayer.isCharacterPlayer && selectedPlayer.trait && (() => {
            const meta = TRAIT_META[selectedPlayer.trait]
            const ls = selectedPlayer.loyaltyScore ?? 5
            return (
              <div style={{
                width: '100%', maxWidth: 390, marginTop: 12,
                background: 'var(--bg-surface)', border: `1px solid ${meta.color}44`,
                borderRadius: 10, padding: '10px 14px',
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

          {/* Spelarsamtal */}
          {(() => {
            const lastTalked = (game?.playerConversations ?? {})[selectedPlayer.id] ?? -Infinity
            const canTalk = currentRound - lastTalked >= 3
            return (
              <div style={{ width: '100%', maxWidth: 390, padding: '0 4px', marginTop: 16 }}>
                <p style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '1.5px',
                  textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10,
                }}>
                  Spelarsamtal
                </p>
                {talkFeedback ? (
                  <div style={{
                    padding: '12px 14px', background: 'var(--bg-surface)',
                    border: '1px solid var(--border)', borderRadius: 10,
                    animation: 'fadeInUp 200ms ease-out both',
                  }}>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 6 }}>{talkFeedback.text}</p>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                      {talkFeedback.moraleChange !== 0 && (
                        <span style={{ color: talkFeedback.moraleChange > 0 ? '#22c55e' : '#ef4444' }}>
                          Moral {talkFeedback.moraleChange > 0 ? '+' : ''}{talkFeedback.moraleChange}
                        </span>
                      )}
                      {talkFeedback.formChange !== 0 && (
                        <span style={{ color: talkFeedback.formChange > 0 ? '#22c55e' : '#ef4444' }}>
                          Form {talkFeedback.formChange > 0 ? '+' : ''}{talkFeedback.formChange}
                        </span>
                      )}
                    </div>
                  </div>
                ) : canTalk ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {([
                      { id: 'encourage' as const, label: '👍 Uppmuntra' },
                      { id: 'demand' as const, label: '💪 Kräv mer' },
                      { id: 'future' as const, label: '🤝 Framtid' },
                    ]).map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => handleTalk(selectedPlayer.id, opt.id)}
                        style={{
                          flex: 1, padding: '10px 6px', fontSize: 12, fontWeight: 600,
                          background: 'var(--bg-surface)', border: '1px solid var(--border)',
                          borderRadius: 8, cursor: 'pointer', color: 'var(--text-primary)',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {lastTalked === -Infinity
                      ? 'Tryck en knapp för att prata med spelaren.'
                      : `Nästa samtal möjligt omgång ${Number(lastTalked) + 3}.`}
                  </p>
                )}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
