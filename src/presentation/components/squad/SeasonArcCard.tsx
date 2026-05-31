import { useGameStore } from '../../store/gameStore'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import {
  getEffectiveMode,
  getReaction,
  projectSeasonForm,
  PROJECTION_HORIZON,
} from '../../../domain/services/periodisationService'
import type { PeriodisationMode } from '../../../domain/services/periodisationService'
import { positionShort } from '../../utils/formatters'
import { PlayerPosition } from '../../../domain/enums'

const MODE_LABELS: Record<PeriodisationMode, string> = {
  bygg: 'Bygg', hall: 'Håll', toppa: 'Toppa', vila: 'Vila',
}

const FLAG_STYLE: Record<string, React.CSSProperties> = {
  warn: { color: 'var(--accent-dark)', background: 'rgba(196,122,58,.08)', border: '1px solid rgba(196,122,58,.35)' },
  good: { color: '#4A6A3A', background: 'rgba(90,154,74,.10)', border: '1px solid rgba(90,154,74,.4)' },
  rust: { color: 'var(--cold)', background: 'rgba(74,102,128,.08)', border: '1px solid rgba(74,102,128,.35)' },
  ovr:  { color: 'var(--text-muted)', background: 'transparent', border: '1px dashed var(--border-dark)' },
}

interface ArcSparklineProps {
  history: SaveGame['teamFitnessHistory']
  mode: PeriodisationMode
  roundsInMode: number
}

function ArcSparkline({ history, mode, roundsInMode }: ArcSparklineProps) {
  const entries = (history ?? []).slice(-12)
  if (entries.length < 2) {
    return (
      <div style={{ padding: '8px 12px', fontSize: 11, fontStyle: 'italic', color: 'var(--text-muted)' }}>
        Kurvan byggs upp. Spela fler omgångar.
      </div>
    )
  }

  const gf = entries.map(e => e.avgSeasonForm ?? 60)
  const df = entries.map(e => e.avgFitness ?? 70)
  const sk = entries.map(e => e.avgSharpness ?? 50)

  const projGf = projectSeasonForm(gf[gf.length - 1], mode, roundsInMode)
  const allProjGf = [gf[gf.length - 1], ...projGf]

  const W = 360, H = 66, pl = 8, pr = 10, pt = 11, pb = 15
  const histN = entries.length
  // total x slots: history indices (0..histN-1) + PROJECTION_HORIZON future steps
  const totalN = histN - 1 + PROJECTION_HORIZON
  const sx = (i: number) => pl + (i / totalN) * (W - pl - pr)
  const sy = (v: number) => pt + (1 - v / 100) * (H - pt - pb)

  const nowI = histN - 1
  const nowX = sx(nowI)

  function histPts(vals: number[]): string {
    return vals.map((v, i) => `${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(' ')
  }

  // Projection line starts at nowI
  const projPts = allProjGf.map((v, i) => `${sx(nowI + i).toFixed(1)},${sy(v).toFixed(1)}`).join(' ')
  const skPath = sk.map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(' ')

  const curGfY = sy(gf[gf.length - 1]).toFixed(1)

  // Peak band: seasonForm 82–90 in the projection region
  const bandY1 = sy(90)
  const bandY2 = sy(82)
  const bandW = W - nowX - pr

  return (
    <div style={{ padding: '4px 10px 0' }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block', width: '100%', height: 'auto' }}>
        {/* Peak goal band — subtle amber zone 82-90 in projection region */}
        <rect x={nowX} y={bandY1} width={bandW} height={bandY2 - bandY1} fill="rgba(196,122,58,0.06)" />
        {/* grundform — history */}
        <polyline
          points={histPts(gf)}
          fill="none"
          stroke="#C47A3A"
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* dagsform — history */}
        <polyline
          points={histPts(df)}
          fill="none"
          stroke="#B88838"
          strokeWidth="1.4"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity="0.85"
        />
        {/* skärpa — dashed history */}
        <path
          d={skPath}
          fill="none"
          stroke="#4a6680"
          strokeWidth="1.4"
          strokeDasharray="4 3"
          strokeLinecap="round"
          opacity="0.75"
        />
        {/* Now-line */}
        <line
          x1={nowX} y1={pt - 4}
          x2={nowX} y2={H - pb + 2}
          stroke="rgba(196,122,58,0.35)"
          strokeWidth="1"
          strokeDasharray="2 2"
        />
        {/* Projection grundform — dashed, faded, keyed to mode for fade-in tween */}
        <g key={mode} style={{ animation: 'fadeInUp 200ms ease-out both' }}>
          <polyline
            points={projPts}
            fill="none"
            stroke="#C47A3A"
            strokeWidth="1.6"
            strokeDasharray="5 4"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity="0.55"
          />
        </g>
        {/* Du är här dot on grundform */}
        <circle cx={nowX} cy={curGfY} r="3.5" fill="#C47A3A" opacity="0.9" />
      </svg>
    </div>
  )
}

interface Props {
  game: SaveGame
}

export function SeasonArcCard({ game }: Props) {
  const setPeriodisation = useGameStore(s => s.setPeriodisation)
  const setPlayerOverride = useGameStore(s => s.setPlayerPeriodisationOverride)

  const mode: PeriodisationMode = (game.managedClubPeriodisation ?? 'hall') as PeriodisationMode
  const roundsInMode = game.currentMatchday - (game.managedClubPeriodisationSince ?? 0)
  const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId && !p.isInjured)

  // Players with a reaction
  const reactingPlayers = managedPlayers.flatMap(p => {
    const eff = getEffectiveMode(p, mode)
    const reaction = getReaction(p, eff, game.currentMatchday)
    if (!reaction) return []
    return [{ player: p, reaction, hasOverride: !!p.periodisationOverride }]
  })

  const warnCount = reactingPlayers.filter(r => r.reaction.type === 'warn' && !r.hasOverride).length

  return (
    <>
      {/* ── Säsongsbåge card ── */}
      <div className="card-sharp" style={{ marginBottom: 12, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'baseline', padding: '12px 13px 0', gap: 8 }}>
          <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            Säsongsbåge
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-secondary)' }}>
            Truppen: <b style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-dark)', fontWeight: 700 }}>{MODE_LABELS[mode]}</b>
            {' · '}
            <span>{warnCount > 0 ? `${warnCount} undantag` : '0 undantag'}</span>
          </span>
        </div>

        {/* Sparkline */}
        <ArcSparkline history={game.teamFitnessHistory} mode={mode} roundsInMode={roundsInMode} />

        {/* Legend */}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', padding: '3px 12px 0', fontSize: 9.5, color: 'var(--text-muted)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <i style={{ width: 12, height: 2.5, borderRadius: 2, display: 'inline-block', background: '#C47A3A' }} />
            Grundform
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <i style={{ width: 12, height: 2.5, borderRadius: 2, display: 'inline-block', background: '#B88838' }} />
            Dagsform
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <i style={{ width: 12, height: 0, display: 'inline-block', borderTop: '2px dashed #4a6680' }} />
            Skärpa
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <i style={{ width: 8, height: 8, borderRadius: 2, display: 'inline-block', background: 'rgba(196,122,58,0.28)' }} />
            <span style={{ color: 'rgba(196,122,58,0.75)' }}>Topp-zon</span>
          </span>
        </div>

        {/* Dial */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, padding: '8px 12px 13px' }}>
          {(['bygg', 'hall', 'toppa', 'vila'] as PeriodisationMode[]).map(m => (
            <button
              key={m}
              onClick={() => setPeriodisation(m)}
              style={{
                background: m === mode ? 'rgba(196,122,58,.12)' : 'var(--bg-elevated)',
                border: m === mode ? '1px solid var(--accent)' : '1px solid var(--border)',
                borderRadius: 'var(--radius-md, 8px)',
                padding: '9px 4px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'border-color .15s, background .15s',
              }}
            >
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                fontWeight: 700,
                color: m === mode ? 'var(--accent-dark)' : 'var(--text-primary)',
              }}>
                {MODE_LABELS[m]}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Reagerar på läget ── */}
      <div className="card-sharp" style={{ marginBottom: 12 }}>
        <div style={{ padding: '11px 13px' }}>
          <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            ⚙ Reagerar på {MODE_LABELS[mode]}
            {warnCount > 0 && (
              <span style={{ marginLeft: 'auto', color: 'var(--accent-dark)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11 }}>
                {warnCount}
              </span>
            )}
          </div>

          {reactingPlayers.length === 0 ? (
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--text-muted)', fontSize: 12.5, padding: '4px 6px' }}>
              Ingen reagerar. Hela truppen följer {MODE_LABELS[mode]}.
            </div>
          ) : (
            reactingPlayers.map(({ player, reaction, hasOverride }) => (
              <ReactionRow
                key={player.id}
                player={player}
                reaction={reaction}
                hasOverride={hasOverride}
                teamMode={mode}
                onSetOverride={(m) => setPlayerOverride(player.id, m)}
              />
            ))
          )}
        </div>
      </div>
    </>
  )
}

interface ReactionRowProps {
  player: { id: string; firstName: string; lastName: string; position: PlayerPosition; sharpness: number; fitness: number; periodisationOverride?: string | null }
  reaction: { type: string; text: string }
  hasOverride: boolean
  teamMode: PeriodisationMode
  onSetOverride: (mode: 'hall' | 'vila' | null) => void
}

function ReactionRow({ player, reaction, hasOverride, onSetOverride }: ReactionRowProps) {
  const flagType = hasOverride ? 'ovr' : reaction.type
  const flagText = hasOverride
    ? `Undantag: ${player.periodisationOverride === 'hall' ? 'Håll' : 'Vila'}`
    : reaction.text

  const fitnessColor = (v: number) =>
    v >= 75 ? 'var(--success)' : v >= 62 ? 'var(--warning)' : 'var(--danger)'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px', borderRadius: 'var(--radius-md, 8px)' }}>
      {/* pos chip */}
      <div style={{ width: 24, flexShrink: 0, textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 0' }}>
        {positionShort(player.position)}
      </div>
      {/* name + meta */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13.5, color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {player.firstName} {player.lastName}
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>
          F {player.fitness} · Sk {player.sharpness}
        </div>
      </div>
      {/* fitness bar */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
        <div style={{ width: 30, height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
          <div style={{ display: 'block', height: '100%', borderRadius: 2, background: fitnessColor(player.fitness), width: `${player.fitness}%` }} />
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--text-secondary)', width: 18, textAlign: 'right' }}>{player.fitness}</span>
      </div>
      {/* flag */}
      <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 600, padding: '3px 7px', borderRadius: 99, whiteSpace: 'nowrap', maxWidth: 122, overflow: 'hidden', textOverflow: 'ellipsis', ...FLAG_STYLE[flagType] }}>
        {flagText}
      </span>
      {/* override controls */}
      {!hasOverride ? (
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button
            onClick={() => onSetOverride('hall')}
            style={{ fontSize: 10, padding: '3px 6px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-secondary)' }}
            title="Håll undantag"
          >H</button>
          <button
            onClick={() => onSetOverride('vila')}
            style={{ fontSize: 10, padding: '3px 6px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-secondary)' }}
            title="Vila undantag"
          >V</button>
        </div>
      ) : (
        <button
          onClick={() => onSetOverride(null)}
          style={{ fontSize: 10, padding: '3px 6px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0 }}
          title="Följ truppen"
        >↩</button>
      )}
    </div>
  )
}
