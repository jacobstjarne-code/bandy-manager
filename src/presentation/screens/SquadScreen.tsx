import { useState } from 'react'
import { useManagedPlayers, useHasPendingLineup, useManagedClub } from '../store/gameStore'
import { PlayerPosition, PlayerArchetype } from '../../domain/enums'
import type { Player } from '../../domain/entities/Player'
import { StatBar } from '../components/StatBar'
import { PlayerCard } from '../components/PlayerCard'

type SortKey = 'position' | 'ca' | 'form' | 'age'
type FilterKey = 'all' | 'mv' | 'def' | 'half' | 'mid' | 'fwd'

function positionShort(pos: PlayerPosition): string {
  const map: Record<PlayerPosition, string> = {
    [PlayerPosition.Goalkeeper]: 'MV',
    [PlayerPosition.Defender]: 'DEF',
    [PlayerPosition.Half]: 'HALF',
    [PlayerPosition.Midfielder]: 'MID',
    [PlayerPosition.Forward]: 'FWD',
  }
  return map[pos] ?? pos
}

const POSITION_ORDER: Record<PlayerPosition, number> = {
  [PlayerPosition.Goalkeeper]: 0,
  [PlayerPosition.Defender]: 1,
  [PlayerPosition.Half]: 2,
  [PlayerPosition.Midfielder]: 3,
  [PlayerPosition.Forward]: 4,
}

const FILTER_TO_POSITION: Record<string, PlayerPosition> = {
  mv: PlayerPosition.Goalkeeper,
  def: PlayerPosition.Defender,
  half: PlayerPosition.Half,
  mid: PlayerPosition.Midfielder,
  fwd: PlayerPosition.Forward,
}

function caColor(ca: number): string {
  if (ca >= 75) return '#C9A84C'
  if (ca >= 60) return '#F0F4F8'
  if (ca >= 40) return '#f59e0b'
  return '#4A6080'
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
  { key: 'ca', label: 'CA' },
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
      <span style={{
        fontSize: 10,
        fontWeight: 600,
        color: '#ef4444',
        background: 'rgba(239,68,68,0.12)',
        border: '1px solid rgba(239,68,68,0.25)',
        borderRadius: 99,
        padding: '2px 8px',
        flexShrink: 0,
      }}>
        🩹 Skadad
      </span>
    )
  } else if (player.suspensionGamesRemaining > 0) {
    statusPill = (
      <span style={{
        fontSize: 10,
        fontWeight: 600,
        color: '#ef4444',
        background: 'rgba(239,68,68,0.12)',
        border: '1px solid rgba(239,68,68,0.25)',
        borderRadius: 99,
        padding: '2px 8px',
        flexShrink: 0,
      }}>
        🚫 Avstängd
      </span>
    )
  }

  return (
    <div
      onClick={onClick}
      style={{
        background: '#122235',
        border: '1px solid #1e3450',
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
          color: '#F0F4F8',
          flexShrink: 0,
        }}>
          {positionShort(player.position).charAt(0)}
        </div>

        {/* Name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#F0F4F8',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {player.firstName} {player.lastName}
          </p>
          <p style={{ fontSize: 12, color: '#8A9BB0', marginTop: 1 }}>
            {positionShort(player.position)} · {player.age}v
          </p>
        </div>

        {/* CA badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
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
            {player.currentAbility}
          </span>
          <span style={{ fontSize: 9, color: '#4A6080', letterSpacing: '0.5px' }}>CA</span>
        </div>

        {/* Arrow */}
        <span style={{ color: '#4A6080', fontSize: 14, marginLeft: 2 }}>▸</span>
      </div>

      {/* Bottom row: form + fitness bars + status pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 38 }}>
        <div style={{ width: 50, flexShrink: 0 }}>
          <p style={{ fontSize: 10, color: '#4A6080', marginBottom: 3 }}>Form</p>
          <StatBar value={player.form} color={barColor(player.form)} height={5} />
        </div>
        <div style={{ width: 50, flexShrink: 0 }}>
          <p style={{ fontSize: 10, color: '#4A6080', marginBottom: 3 }}>Kond</p>
          <StatBar value={player.fitness} color={barColor(player.fitness)} height={5} />
        </div>
        {statusPill}
      </div>
    </div>
  )
}

export function SquadScreen() {
  const players = useManagedPlayers()
  const hasPendingLineup = useHasPendingLineup()
  const club = useManagedClub()
  const [sort, setSort] = useState<SortKey>('position')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)

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

  const selectedPlayer = selectedPlayerId ? players.find(p => p.id === selectedPlayerId) ?? null : null
  const clubName = club?.name ?? ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0D1B2A' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 0', flexShrink: 0 }}>
        <h2 style={{
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: '#F0F4F8',
          marginBottom: 14,
        }}>
          Trupp
        </h2>

        {/* Lineup hint */}
        {!hasPendingLineup && (
          <div className="card-stagger-1" style={{
            background: 'rgba(37,99,235,0.08)',
            border: '1px solid rgba(37,99,235,0.2)',
            borderRadius: 10,
            padding: '12px 14px',
            fontSize: 13,
            color: '#8A9BB0',
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
                background: filter === tab.key ? 'rgba(201,168,76,0.12)' : '#122235',
                border: '1px solid ' + (filter === tab.key ? '#C9A84C' : '#1e3450'),
                color: filter === tab.key ? '#C9A84C' : '#8A9BB0',
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
          <span style={{ fontSize: 12, color: '#4A6080', marginRight: 4 }}>Sortera:</span>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setSort(opt.key)}
              style={{
                padding: '3px 8px',
                borderRadius: 6,
                background: sort === opt.key ? '#122235' : 'transparent',
                border: '1px solid ' + (sort === opt.key ? '#1e3450' : 'transparent'),
                color: sort === opt.key ? '#F0F4F8' : '#4A6080',
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
        {sorted.map((player, index) => (
          <PlayerRowAnimated
            key={player.id}
            player={player}
            index={index}
            onClick={() => setSelectedPlayerId(player.id)}
          />
        ))}
        {sorted.length === 0 && (
          <p style={{ padding: '40px 16px', color: '#4A6080', textAlign: 'center', fontSize: 14 }}>
            Inga spelare i denna position
          </p>
        )}
      </div>

      {/* Player Card Modal */}
      {selectedPlayer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(6,16,24,0.95)',
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
                background: '#122235',
                border: '1px solid #1e3450',
                borderRadius: 8,
                color: '#8A9BB0',
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
        </div>
      )}
    </div>
  )
}
