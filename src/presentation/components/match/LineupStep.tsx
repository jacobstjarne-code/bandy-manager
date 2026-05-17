import { useState, useEffect } from 'react'
import type { Club, Tactic } from '../../../domain/entities/Club'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { Player } from '../../../domain/entities/Player'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { PlayerPosition } from '../../../domain/enums'
import { positionShort } from '../../utils/formatters'
import { generateBasicAnalysis } from '../../../domain/services/opponentAnalysisService'
import { getConditionLabel, getWeatherEmoji } from '../../../domain/services/weatherService'
import { FORMATIONS, type FormationType } from '../../../domain/entities/Formation'
import { LineupFormationView } from './LineupFormationView'
import { PitchLineupView } from './PitchLineupView'
import { OpponentAnalysisCard } from './OpponentAnalysisCard'

interface GroupedPlayers {
  position: string
  players: Player[]
}

interface LineupStepProps {
  opponent: Club | null
  nextFixture: Fixture | null
  game: SaveGame
  squadPlayers: Player[]
  groupedPlayers: GroupedPlayers[]
  startingIds: string[]
  benchIds: string[]
  captainId: string | null
  selectedSlotId: string | null
  tacticState: Tactic
  canPlay: boolean
  injuredInStarting: Player[]
  onTogglePlayer: (pid: string) => void
  onSetCaptain: (pid: string) => void
  onAutoFill: () => void
  onSlotClick: (slotId: string) => void
  onFormationChange: (newTactic: Tactic) => void
  onAssignPlayer: (playerId: string, slotId: string) => void
  onRemovePlayer: (playerId: string) => void
  onSwapPlayers: (fromSlotId: string, toSlotId: string) => void
  onError: (err: string) => void
  onNext: () => void
}

const GROUP_LABELS: Partial<Record<string, string>> = {
  [PlayerPosition.Goalkeeper]: 'Målvakter',
  [PlayerPosition.Defender]: 'Backar',
  [PlayerPosition.Half]: 'Ytterhalvar',
  [PlayerPosition.Midfielder]: 'Mittfältare',
  [PlayerPosition.Forward]: 'Anfallare',
}

const SPARKLE_SVG = (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
    <path d="M6 1.5 L7 4 L9.5 5 L7 6 L6 8.5 L5 6 L2.5 5 L5 4 Z"/>
    <path d="M9.5 8.5 L10 9.5 L11 10 L10 10.5 L9.5 11.5 L9 10.5 L8 10 L9 9.5 Z"/>
  </svg>
)

export function LineupStep({
  opponent,
  nextFixture,
  game,
  squadPlayers,
  groupedPlayers,
  startingIds,
  benchIds: _benchIds,
  captainId: _captainId,
  selectedSlotId,
  tacticState,
  canPlay,
  injuredInStarting,
  onTogglePlayer,
  onSetCaptain: _onSetCaptain,
  onAutoFill,
  onSlotClick,
  onFormationChange,
  onAssignPlayer,
  onRemovePlayer,
  onSwapPlayers,
  onError,
  onNext,
}: LineupStepProps) {
  const [viewMode, setViewMode] = useState<'list' | 'pitch'>('list')
  const [justFilled, setJustFilled] = useState(false)

  // Auto-fill when switching to pitch view with no lineupSlots at all (defensive fallback).
  // IMPORTANT: Only triggers when lineupSlots is undefined or has zero keys.
  // If keys exist but values are null (FIX-50: injured players cleared), do NOT auto-fill —
  // those nulls are intentional empty slots waiting for the user to fill.
  useEffect(() => {
    if (viewMode !== 'pitch') return
    const slotsEmpty =
      !tacticState.lineupSlots ||
      Object.keys(tacticState.lineupSlots).length === 0
    if (slotsEmpty && startingIds.length === 11) {
      onAutoFill()
    }
  }, [viewMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Context-combined data
  const weather = nextFixture ? game.matchWeathers?.find(mw => mw.fixtureId === nextFixture.id)?.weather : null
  const weatherText = weather
    ? `${getWeatherEmoji(weather.condition)} ${getConditionLabel(weather.condition)} · ${weather.temperature}°C`
    : 'Okänt väder'

  const oppAnalysis = (opponent && nextFixture)
    ? generateBasicAnalysis(
        opponent,
        game.players.filter(p => opponent.squadPlayerIds.includes(p.id)),
        game.standings,
        game.fixtures,
        nextFixture.id,
      )
    : null

  const oppFormation = opponent?.activeTactic?.formation
  const oppFormText = oppAnalysis
    ? (oppFormation ? `${oppAnalysis.recentForm} · ${oppFormation}` : oppAnalysis.recentForm)
    : (oppFormation ?? '—')

  function handlePlayerClick(player: Player) {
    if (player.isInjured || player.suspensionGamesRemaining > 0) return
    if (selectedSlotId) {
      onAssignPlayer(player.id, selectedSlotId)
    } else {
      onTogglePlayer(player.id)
    }
  }

  return (
    <>
      {/* 1. Context — two-column strip */}
      {nextFixture && (
        <div style={{
          margin: '8px 14px',
          padding: '8px 12px',
          background: 'var(--bg-surface)',
          borderLeft: '2px solid var(--accent)',
          borderRadius: '0 8px 8px 0',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px 12px',
          fontSize: 11,
        }}>
          <div>
            <div style={{ fontSize: 8, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Matchdag</div>
            <div style={{ color: 'var(--text-primary)', fontSize: 11.5, marginTop: 2 }}>{weatherText}</div>
          </div>
          {opponent && (
            <div>
              <div style={{ fontSize: 8, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>{opponent.shortName ?? opponent.name}</div>
              <div style={{ color: 'var(--text-primary)', fontSize: 11.5, marginTop: 2 }}>{oppFormText}</div>
            </div>
          )}
        </div>
      )}

      {/* 2. Opponent analysis card */}
      {opponent && nextFixture && (
        <OpponentAnalysisCard
          fixture={nextFixture}
          opponent={opponent}
          game={game}
          onError={onError}
        />
      )}

      {/* 3. Tabs — always at top, same position in both modes */}
      <div style={{ padding: '0 14px', marginBottom: 10 }}>
        <div className="btn-segmented" style={{ display: 'flex', width: '100%' }}>
          {(['list', 'pitch'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`btn${viewMode === mode ? ' active' : ''}`}
              style={{ flex: 1, padding: '8px 4px', fontSize: 11, fontWeight: 600, letterSpacing: '0.5px' }}
            >
              {mode === 'list' ? 'Lista' : 'Plan'}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Status + Auto-fyll — always same position */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 14px', marginBottom: 10, gap: 8 }}>
        <span style={{ fontSize: 9, color: startingIds.length === 11 ? 'var(--success)' : 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>
          {startingIds.length} av 11 placerade
        </span>
        <button
          onClick={() => {
            onAutoFill()
            setJustFilled(true)
            setTimeout(() => setJustFilled(false), 1500)
          }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '5px 10px',
            background: justFilled ? 'var(--success)' : 'transparent',
            border: `1.5px solid ${justFilled ? 'var(--success)' : 'var(--accent)'}`,
            color: justFilled ? 'var(--text-light)' : 'var(--accent-dark)',
            fontSize: 11, fontWeight: 600,
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'background 0.15s, border-color 0.15s, color 0.15s',
          }}
        >
          {justFilled ? '✓' : SPARKLE_SVG}
          {justFilled ? 'Uppdaterad' : 'Fyll bästa elvan'}
        </button>
      </div>

      {/* 5. Formation dropdown — lifted from sub-components */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', marginBottom: 10 }}>
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          ⚙ Formation
        </span>
        <select
          value={tacticState.formation ?? '3-3-4'}
          onChange={e => onFormationChange({ ...tacticState, formation: e.target.value as FormationType })}
          style={{
            flex: 1,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 6,
            padding: '5px 8px',
            cursor: 'pointer',
          }}
        >
          {Object.entries(FORMATIONS).map(([type, tpl]) => (
            <option key={type} value={type}>{tpl.label}</option>
          ))}
        </select>
      </div>

      {/* 6. Pitch — viewMode determines component, same location */}
      {viewMode === 'list' ? (
        <LineupFormationView
          tacticState={tacticState}
          startingIds={startingIds}
          squadPlayers={squadPlayers}
          selectedSlotId={selectedSlotId}
          onSlotClick={onSlotClick}
        />
      ) : (
        <PitchLineupView
          tacticState={tacticState}
          startingIds={startingIds}
          squadPlayers={squadPlayers}
          onAssignPlayer={onAssignPlayer}
          onRemovePlayer={onRemovePlayer}
          onSwapPlayers={onSwapPlayers}
        />
      )}

      {/* 7. List-mode additions — player list */}
      {viewMode === 'list' && (
        <div style={{ padding: '0 14px 8px' }}>
          {groupedPlayers.map(group => (
            <div key={group.position} style={{ marginBottom: 6 }}>
              <p style={{
                fontSize: 8, fontWeight: 600, letterSpacing: '2px',
                textTransform: 'uppercase', color: 'var(--text-muted)',
                marginBottom: 2, paddingLeft: 4,
              }}>
                {GROUP_LABELS[group.position] ?? group.position}
              </p>
              {group.players.map(player => {
                const isStarting = startingIds.includes(player.id)
                const isInjured = player.isInjured
                const isSuspended = player.suspensionGamesRemaining > 0
                const isUnavailable = isInjured || isSuspended

                const rowBorderLeft = isInjured
                  ? '3px solid var(--danger)'
                  : isSuspended
                  ? '2px solid var(--warm-light)'
                  : '2px solid transparent'

                return (
                  <div
                    key={player.id}
                    onClick={() => handlePlayerClick(player)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '6px 10px',
                      background: 'var(--bg-surface)',
                      borderLeft: rowBorderLeft,
                      borderRadius: '0 8px 8px 0',
                      marginBottom: 2,
                      fontSize: 12.5,
                      cursor: isUnavailable ? 'default' : 'pointer',
                      opacity: isUnavailable ? 0.75 : 1,
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, width: 22, color: 'var(--text-secondary)', fontSize: 12 }}>
                      {player.shirtNumber ?? '?'}
                    </span>
                    <span style={{ fontSize: 9, letterSpacing: '1px', color: 'var(--text-muted)', width: 22 }}>
                      {positionShort(player.position)}
                    </span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {player.lastName}
                    </span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', width: 26, textAlign: 'right', fontSize: 12 }}>
                      {Math.round(player.currentAbility)}
                    </span>
                    {isInjured && (
                      <span className="tag tag-red" style={{ fontSize: 9, padding: '2px 5px' }}>
                        {player.injuryDaysRemaining > 0 ? `${player.injuryDaysRemaining} dgr` : 'Skadad'}
                      </span>
                    )}
                    {isSuspended && (
                      <span className="tag tag-copper" style={{ fontSize: 9, padding: '2px 5px' }}>
                        Avstängd
                      </span>
                    )}
                    {isStarting && !isUnavailable && (
                      <span className="tag tag-green" style={{ fontSize: 9, padding: '2px 5px' }}>
                        Start
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* Validation warnings */}
      {!canPlay && (
        <div style={{ margin: '0 14px 8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--danger)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {startingIds.length !== 11 && <span>Välj exakt 11 startspelare (du har {startingIds.length})</span>}
          {injuredInStarting.map(p => (
            <span key={p.id}>⚠️ {p.firstName} {p.lastName} {p.isInjured ? 'är skadad' : `är avstängd (${p.suspensionGamesRemaining} matcher kvar)`}</span>
          ))}
        </div>
      )}
      {canPlay && !startingIds.some(id => squadPlayers.find(p => p.id === id)?.position === PlayerPosition.Goalkeeper) && (
        <div style={{ margin: '0 14px 8px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--warning)' }}>
          ⚠️ Ingen målvakt i startelvan — en utespelare får gå i mål.
        </div>
      )}

      {/* Footer CTA */}
      <div style={{ padding: '4px 14px 24px', borderTop: '0.5px solid var(--border)', marginTop: 4 }}>
        <button
          onClick={onNext}
          disabled={!canPlay}
          className="btn btn-cta btn-primary"
          style={{ width: '100%', cursor: canPlay ? 'pointer' : 'not-allowed', opacity: canPlay ? 1 : 0.5 }}
        >
          Nästa: Taktik →
        </button>
      </div>
    </>
  )
}
