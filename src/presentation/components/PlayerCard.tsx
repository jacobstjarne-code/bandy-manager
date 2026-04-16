import type { Player } from '../../domain/entities/Player'
import type { ScoutReport } from '../../domain/entities/Scouting'
import type { SaveGame } from '../../domain/entities/SaveGame'
import { PlayerArchetype, PlayerPosition } from '../../domain/enums'
import { getScoutReportAge } from '../../domain/services/scoutingService'
import { canUseLeadershipAction, type LeadershipAction } from '../../domain/services/leadershipService'
import { ClubBadge } from './ClubBadge'
import { getPortraitPath } from '../../domain/services/portraitService'
import { getPlayerVoice } from '../../domain/services/playerVoiceService'
import type { RecentMatchRating } from './playerCardUtils'

export interface PlayerCardProps {
  player: Player
  clubName: string
  scoutReport?: ScoutReport
  isOwned?: boolean
  currentSeason?: number
  onClick?: () => void
  storylines?: Array<{ displayText: string; matchday?: number }>
  onExtendContract?: () => void
  onClose?: () => void
  // Spelarkort 2.0
  game?: SaveGame
  previousMarketValue?: number
  recentRatings?: RecentMatchRating[]
  onTalkToPlayer?: (choice: 'encourage' | 'demand' | 'future') => void
  talkFeedback?: { text: string; moraleChange: number; formChange: number } | null
  onLeadershipAction?: (action: LeadershipAction) => { feedback: string } | null
  leadershipFeedback?: string | null
}

function archetypeColor(arch: PlayerArchetype): string {
  const map: Partial<Record<PlayerArchetype, string>> = {
    [PlayerArchetype.Finisher]: 'var(--arch-finisher)',
    [PlayerArchetype.Playmaker]: 'var(--arch-playmaker)',
    [PlayerArchetype.DefensiveWorker]: 'var(--arch-defensive)',
    [PlayerArchetype.TwoWaySkater]: 'var(--arch-twoway)',
    [PlayerArchetype.ReflexGoalkeeper]: 'var(--arch-reflexgk)',
    [PlayerArchetype.PositionalGoalkeeper]: 'var(--arch-posgk)',
    [PlayerArchetype.Dribbler]: 'var(--arch-dribbler)',
    [PlayerArchetype.CornerSpecialist]: 'var(--arch-corner)',
    [PlayerArchetype.RawTalent]: 'var(--arch-raw)',
  }
  return map[arch] ?? 'var(--arch-default)'
}

function positionFullLabel(pos: PlayerPosition): string {
  const map: Record<PlayerPosition, string> = {
    [PlayerPosition.Goalkeeper]: 'Målvakt',
    [PlayerPosition.Defender]: 'Back',
    [PlayerPosition.Half]: 'Ytterhalv',
    [PlayerPosition.Midfielder]: 'Mittfältare',
    [PlayerPosition.Forward]: 'Anfallare',
  }
  return map[pos] ?? pos
}

const STAT_LABELS: Partial<Record<keyof Player['attributes'], string>> = {
  skating: 'Skridskoåkning',
  passing: 'Passning',
  shooting: 'Skott',
  defending: 'Försvar',
  goalkeeping: 'Målvakt',
  vision: 'Speluppfattning',
  decisions: 'Spelsinne',
  positioning: 'Positionering',
  stamina: 'Uthållighet',
  workRate: 'Arbetsvilja',
  ballControl: 'Bollkontroll',
  acceleration: 'Acceleration',
  dribbling: 'Dribbling',
  cornerSkill: 'Hörnor',
}

type AttrKey = keyof Player['attributes']

function getTopStats(player: Player): { label: string; value: number }[] {
  const { attributes, archetype } = player

  let keys: AttrKey[]
  if (archetype === PlayerArchetype.Finisher) {
    keys = ['shooting', 'acceleration', 'decisions', 'positioning']
  } else if (archetype === PlayerArchetype.Playmaker) {
    keys = ['passing', 'vision', 'decisions', 'ballControl']
  } else if (archetype === PlayerArchetype.DefensiveWorker) {
    keys = ['defending', 'positioning', 'workRate', 'stamina']
  } else if (archetype === PlayerArchetype.TwoWaySkater) {
    keys = ['skating', 'stamina', 'defending', 'workRate']
  } else if (
    archetype === PlayerArchetype.ReflexGoalkeeper ||
    archetype === PlayerArchetype.PositionalGoalkeeper
  ) {
    keys = ['goalkeeping', 'positioning', 'decisions', 'acceleration']
  } else {
    const entries = Object.entries(attributes) as [AttrKey, number][]
    entries.sort((a, b) => b[1] - a[1])
    keys = entries.slice(0, 4).map(([k]) => k)
  }

  return keys.map(k => ({
    label: STAT_LABELS[k] ?? k,
    value: attributes[k],
  }))
}

function statValueColor(value: number): string {
  if (value >= 75) return 'var(--success)'
  if (value >= 60) return 'var(--text-primary)'
  if (value >= 40) return 'var(--warning)'
  return 'var(--danger)'
}

function barColor(value: number): string {
  if (value >= 65) return 'var(--success)'
  if (value >= 40) return 'var(--warning)'
  return 'var(--danger)'
}

function formatMarketValue(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} mkr`
  if (v >= 1_000) return `${Math.round(v / 1_000)} tkr`
  return `${v} kr`
}

function generateBio(player: Player, clubName: string): string {
  const parts: string[] = []
  if (player.academyClubId) {
    parts.push(`Fostrad i ${clubName}.`)
  }
  if (player.isFullTimePro) {
    parts.push('Heltidsproffs.')
  } else if (player.dayJob) {
    parts.push(`${player.dayJob.title} vid sidan om.`)
  }
  if (player.trait === 'hungrig') parts.push('Hungrig — vill bevisa sig.')
  else if (player.trait === 'veteran') parts.push('Rutinerad — vet vad det kostar.')
  else if (player.trait === 'joker') parts.push('Oförutsägbar, alltid levande.')
  else if (player.trait === 'lokal') parts.push('Från orten — publiken älskar honom.')
  else if (player.trait === 'ledare') parts.push('Naturlig ledare i omklädningsrummet.')
  return parts.join(' ')
}

function CaSparkline({ history, currentCa }: { history: Array<{ season: number; ca: number }>; currentCa: number }) {
  const points = [...history, { season: 9999, ca: currentCa }]
  if (points.length < 2) return null

  const minCa = Math.max(0, Math.min(...points.map(p => p.ca)) - 5)
  const maxCa = Math.min(100, Math.max(...points.map(p => p.ca)) + 5)
  const range = maxCa - minCa || 1
  const W = 180
  const H = 32
  const step = W / (points.length - 1)

  const coords = points.map((p, i) => ({
    x: i * step,
    y: H - ((p.ca - minCa) / range) * H,
  }))

  const last = coords[coords.length - 1]
  const prev = coords[coords.length - 2]
  const trending = last.y <= prev.y

  return (
    <div style={{ marginTop: 8 }}>
      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
        CA-UTVECKLING
      </p>
      <svg width={W} height={H + 4} viewBox={`0 0 ${W} ${H + 4}`} style={{ display: 'block' }}>
        <polyline
          points={coords.map(c => `${c.x},${c.y}`).join(' ')}
          fill="none"
          stroke={trending ? 'var(--success)' : 'var(--danger)'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={last.x} cy={last.y} r="3" fill={trending ? 'var(--success)' : 'var(--danger)'} />
        <text x={last.x + 5} y={last.y + 4} fontSize="9" fill="var(--text-primary)" fontWeight="700">{currentCa}</text>
      </svg>
    </div>
  )
}

function MatchSparkline({ ratings }: { ratings: RecentMatchRating[] }) {
  if (ratings.length === 0) return null

  const W = 220
  const H = 45
  const padding = { left: 20, right: 20 }
  const usableW = W - padding.left - padding.right
  const step = ratings.length > 1 ? usableW / (ratings.length - 1) : 0

  // Map rating (5-10) to Y coordinate: 10 = top (y=4), 5 = bottom (y=H)
  const minR = 5
  const maxR = 10
  const range = maxR - minR

  const coords = ratings.map((r, i) => ({
    x: padding.left + i * step,
    y: H - ((r.rating - minR) / range) * H,
  }))

  const resultColor = (r: 'V' | 'O' | 'F') =>
    r === 'V' ? 'var(--success)' : r === 'F' ? 'var(--danger)' : 'var(--warning)'

  const lastRating = ratings[ratings.length - 1]?.rating ?? 0
  const firstRating = ratings[0]?.rating ?? 0
  const trending = lastRating >= firstRating

  return (
    <div>
      <svg width={W} height={H + 22} viewBox={`0 0 ${W} ${H + 22}`} style={{ display: 'block', margin: '0 auto' }}>
        {/* Guide lines */}
        <line x1={padding.left} y1={8} x2={W - padding.right} y2={8} stroke="rgba(0,0,0,0.05)" strokeWidth="0.5" />
        <line x1={padding.left} y1={H / 2} x2={W - padding.right} y2={H / 2} stroke="rgba(0,0,0,0.05)" strokeWidth="0.5" />

        {/* Connecting line */}
        {ratings.length > 1 && (
          <polyline
            points={coords.map(c => `${c.x},${c.y}`).join(' ')}
            fill="none"
            stroke={trending ? 'var(--success)' : 'var(--danger)'}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Match dots */}
        {ratings.map((r, i) => {
          const c = coords[i]
          const isLast = i === ratings.length - 1
          return (
            <g key={i}>
              <circle
                cx={c.x}
                cy={c.y}
                r={isLast ? 4.5 : 4}
                fill={resultColor(r.result)}
                stroke={isLast ? 'var(--accent)' : 'var(--bg-surface)'}
                strokeWidth="1.5"
              />
              {/* Rating label above dot */}
              <text x={c.x} y={c.y - 6} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--text-primary)">
                {r.rating.toFixed(1)}
              </text>
              {/* Opponent short name */}
              <text x={c.x} y={H + 12} textAnchor="middle" fontSize="8" fill="var(--text-muted)">
                {r.opponentShortName.slice(0, 3)}
              </text>
              {/* Result letter */}
              <text x={c.x} y={H + 22} textAnchor="middle" fontSize="7" fill={resultColor(r.result)}>
                {r.result}
              </text>
            </g>
          )
        })}
      </svg>
      <p style={{ fontSize: 9, color: trending ? 'var(--success)' : 'var(--danger)', textAlign: 'center', marginTop: 2 }}>
        {trending ? '📈 Stigande form' : '📉 Vikande form'}
      </p>
    </div>
  )
}

const SECTION_STYLE = { padding: '10px 14px', borderBottom: '1px solid var(--border)' } as const
const LABEL_STYLE = { fontSize: 8, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' as const, color: 'var(--text-muted)' }

export function PlayerCard({
  player,
  clubName,
  scoutReport,
  isOwned = true,
  currentSeason,
  onClick,
  storylines,
  onExtendContract,
  onClose,
  game,
  previousMarketValue,
  recentRatings,
  onTalkToPlayer,
  talkFeedback,
  onLeadershipAction,
  leadershipFeedback,
}: PlayerCardProps) {
  const reportAge = scoutReport && currentSeason
    ? getScoutReportAge(scoutReport, currentSeason, scoutReport.scoutedSeason)
    : scoutReport ? 'fresh' : null
  const isStale = reportAge === 'stale'
  const effectiveReport = isStale ? undefined : scoutReport
  const portraitPath = getPortraitPath(player.id, player.age)

  const topStats = isOwned
    ? getTopStats(player)
    : effectiveReport
      ? getTopStats({ ...player, attributes: { ...player.attributes, ...effectiveReport.revealedAttributes } })
      : null

  const archColor = archetypeColor(player.archetype)
  const fullName = `${player.firstName} ${player.lastName}`.toUpperCase()
  const posLabel = positionFullLabel(player.position).toUpperCase()

  const idNum = parseInt(player.id.replace(/\D/g, '').slice(-2) || '10', 10)
  const jerseyNum = (idNum % 98) + 1

  const isCaptain = game?.captainPlayerId === player.id

  // Spelarsamtal availability
  const lastTalked = game ? ((game.playerConversations ?? {})[player.id] ?? -Infinity) : -Infinity
  const currentRound = game
    ? (game.fixtures.filter(f => f.status === 'completed').sort((a, b) => b.matchday - a.matchday)[0]?.matchday ?? 0)
    : 0
  const canTalk = onTalkToPlayer != null && currentRound - Number(lastTalked) >= 3

  const leadershipAvailable = onLeadershipAction != null && game != null
  const canLeadership = (action: LeadershipAction) =>
    leadershipAvailable && canUseLeadershipAction(game!, player.id, action, currentRound)

  return (
    <div
      onClick={onClick}
      style={{
        width: '100%',
        borderRadius: 0,
        background: 'var(--bg-surface)',
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* ═══ TOP BAR ═══ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 14px 8px',
        background: 'rgba(0,0,0,0.2)',
        gap: 8,
      }}>
        <ClubBadge clubId={player.clubId} name={clubName} size={32} />
        <div style={{ flex: 1, textAlign: onClose ? 'center' : 'right' }}>
          <p style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, letterSpacing: '1px' }}>
            #{jerseyNum}
          </p>
          <p style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {posLabel}
          </p>
        </div>
        {onClose && (
          <button
            onClick={e => { e.stopPropagation(); onClose() }}
            style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)',
              color: 'var(--text-muted)', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Gold divider */}
      <div style={{ height: 1, background: 'rgba(196,122,58,0.3)', margin: '0 14px' }} />

      {/* ═══ PORTRAIT ═══ */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '8px 0 4px',
        background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
      }}>
        <img
          src={portraitPath}
          alt={`${player.firstName} ${player.lastName}`}
          style={{ width: 72, height: 72, borderRadius: '50%', border: '2px solid var(--accent)', objectFit: 'cover', objectPosition: 'center 20%', background: 'var(--bg)' }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      </div>

      {/* Gold divider */}
      <div style={{ height: 1, background: 'rgba(196,122,58,0.5)', margin: '0 14px' }} />

      {/* ═══ NAME + CLUB + BADGES ═══ */}
      <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid var(--border)' }}>
        <p style={{
          fontSize: 17,
          fontWeight: 900,
          color: 'var(--text-primary)',
          letterSpacing: '-0.3px',
          lineHeight: 1.1,
          textTransform: 'uppercase',
        }}>
          {fullName}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {clubName.toUpperCase()}
          </span>
          <span style={{ color: 'var(--border)', fontSize: 12 }}>·</span>
          <div style={{ padding: '2px 6px', borderRadius: 4, background: archColor, fontSize: 10, fontWeight: 700, color: 'var(--text-light)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {posLabel}
          </div>
        </div>
        {/* Trait + captain badges */}
        {isOwned && (
          <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
            {isCaptain && <span className="tag tag-fill">© KAPTEN</span>}
            {player.trait === 'hungrig' && <span className="tag" style={{ borderColor: 'var(--success)', color: 'var(--success)' }}>🔥 Hungrig</span>}
            {player.trait === 'veteran' && <span className="tag" style={{ borderColor: 'var(--text-muted)', color: 'var(--text-muted)' }}>🏅 Veteran</span>}
            {player.trait === 'joker' && <span className="tag" style={{ borderColor: 'var(--warning)', color: 'var(--warning)' }}>🎭 Joker</span>}
            {player.trait === 'lokal' && <span className="tag" style={{ borderColor: 'var(--ice)', color: 'var(--ice)' }}>🏘️ Lokal</span>}
            {player.trait === 'ledare' && <span className="tag" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>🦁 Ledare</span>}
          </div>
        )}
      </div>

      {/* ═══ ① STATUS — owned only ═══ */}
      {isOwned && (
        <div style={SECTION_STYLE}>
          <p style={{ ...LABEL_STYLE, marginBottom: 8 }}>💪 STATUS</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 14px' }}>
            {[
              { label: 'Form', value: player.form },
              { label: 'Kondition', value: player.fitness },
              { label: 'Moral', value: player.morale },
              { label: 'Skärpa', value: player.sharpness },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ color: barColor(value), fontWeight: 700, fontFamily: 'var(--font-display)' }}>{Math.round(value)}</span>
                </div>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${value}%`, height: '100%', background: barColor(value), borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 10, marginTop: 6, color: player.isInjured ? 'var(--danger)' : player.suspensionGamesRemaining > 0 ? 'var(--warning)' : 'var(--success)' }}>
            {player.isInjured ? `🩹 Skadad` : player.suspensionGamesRemaining > 0 ? `🚫 Avstängd ${player.suspensionGamesRemaining} match${player.suspensionGamesRemaining > 1 ? 'er' : ''}` : '🩹 Frisk · Tillgänglig'}
          </p>
          {/* DREAM-012: injury narrative */}
          {player.isInjured && player.injuryNarrative && (
            <div style={{ padding: '8px 10px', background: 'rgba(176,80,64,0.08)', borderLeft: '3px solid var(--danger)', marginTop: 8, borderRadius: '0 4px 4px 0' }}>
              <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--danger)', marginBottom: 4 }}>
                🏥 SKADAD — {Math.ceil(player.injuryDaysRemaining / 7)} veckor kvar
              </p>
              <p style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                {player.injuryNarrative}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══ ② DUBBELLIV — owned only ═══ */}
      {isOwned && (
        <div style={SECTION_STYLE}>
          <p style={{ ...LABEL_STYLE, marginBottom: 6 }}>💼 DUBBELLIV</p>
          {player.isFullTimePro ? (
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>⭐ Heltidsproffs</p>
          ) : player.dayJob ? (
            <>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{player.dayJob.title}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 60 }}>Flexibilitet</span>
                <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${player.dayJob.flexibility}%`, height: '100%', background: barColor(player.dayJob.flexibility), borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 10, color: barColor(player.dayJob.flexibility), fontWeight: 700 }}>{player.dayJob.flexibility}%</span>
              </div>
              {player.dayJob.flexibility < 50 && (
                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 6, lineHeight: 1.5 }}>
                  Låg flexibilitet — riskerar att missa träningar och matcher.
                </p>
              )}
            </>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</p>
          )}
        </div>
      )}

      {/* ═══ ③ SENASTE 5 MATCHER — owned only ═══ */}
      {isOwned && recentRatings && recentRatings.length > 0 && (
        <div style={SECTION_STYLE}>
          <p style={{ ...LABEL_STYLE, marginBottom: 6 }}>📈 SENASTE 5 MATCHER</p>
          <MatchSparkline ratings={recentRatings} />
        </div>
      )}

      {/* ═══ ④ EGENSKAPER ═══ */}
      <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)' }}>
            EGENSKAPER
          </p>
          {reportAge === 'aging' && (
            <span style={{ fontSize: 9, color: 'var(--warning)', letterSpacing: '0.3px' }}>1 säsong sedan</span>
          )}
          {isStale && (
            <span style={{ fontSize: 9, color: 'var(--danger)', letterSpacing: '0.3px' }}>Föråldrad</span>
          )}
        </div>
        <div style={{ opacity: isStale ? 0.45 : 1, transition: 'opacity 0.2s' }}>
          {topStats ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 8px' }}>
              {topStats.map(stat => (
                <div key={stat.label} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 8px',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 6,
                  border: '1px solid rgba(196,122,58,0.1)',
                }}>
                  <span style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.3px' }}>{stat.label}</span>
                  <span className="tabular" style={{ fontSize: 12, fontWeight: 800, color: statValueColor(stat.value), marginLeft: 4, fontFamily: 'var(--font-display)' }}>
                    {Math.round(stat.value)}{effectiveReport && !isOwned && <span style={{ fontSize: 9, opacity: 0.6 }}> ~</span>}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 8px' }}>
              {['A', 'B', 'C', 'D'].map(k => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(138,155,176,0.1)' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.3px' }}>—</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' }}>?</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {isStale && (
          <p style={{ fontSize: 10, color: 'var(--danger)', marginTop: 6, textAlign: 'center', opacity: 0.8 }}>
            Föråldrad rapport — scouta igen?
          </p>
        )}

        {/* Potential bar — owned only, show if PA > CA + 3 */}
        {isOwned && player.potentialAbility > player.currentAbility + 3 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
              <span style={{ color: 'var(--text-muted)' }}>Utvecklingspotential</span>
            </div>
            <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
              <div style={{ width: `${player.currentAbility}%`, height: '100%', background: 'var(--accent)', borderRadius: 3 }} />
              <div style={{
                position: 'absolute', left: `${player.currentAbility}%`, top: 0,
                width: `${Math.min(player.potentialAbility - player.currentAbility, 100 - player.currentAbility)}%`,
                height: '100%', background: 'rgba(139,115,50,0.25)', borderRadius: '0 3px 3px 0',
              }} />
            </div>
            <p style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
              {player.age < 24 ? `${player.age} år — utvecklas fortfarande` : `${player.age} år — potential ${Math.round(player.potentialAbility)}`}
            </p>
          </div>
        )}

        {/* CA sparkline */}
        {isOwned && (player.caHistory ?? []).length >= 1 && (
          <CaSparkline history={player.caHistory ?? []} currentCa={player.currentAbility} />
        )}
      </div>

      {/* ═══ ⑤ SÄSONG ═══ */}
      <div style={SECTION_STYLE}>
        {!isOwned && effectiveReport && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            🔍 Scouted {effectiveReport.scoutedDate} · uppskattad styrka {effectiveReport.estimatedCA}
          </p>
        )}
        {!isOwned && !effectiveReport && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ej scoutad — attribut okända</p>
        )}
        {isOwned && (
          <>
            <p style={{ ...LABEL_STYLE, marginBottom: 6 }}>🏒 SÄSONG</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
              Marknadsvärde:{' '}
              <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{formatMarketValue(player.marketValue)}</span>
              {previousMarketValue != null && previousMarketValue !== player.marketValue && (
                <span style={{ marginLeft: 4, fontSize: 10, color: player.marketValue > previousMarketValue ? 'var(--success)' : 'var(--danger)' }}>
                  {player.marketValue > previousMarketValue ? '+' : ''}{formatMarketValue(player.marketValue - previousMarketValue)}{' '}
                  {player.marketValue > previousMarketValue ? '↑' : '↓'}
                </span>
              )}
            </p>
            {player.seasonStats.gamesPlayed > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px 6px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.04)', borderRadius: 5, padding: '4px 2px' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{player.seasonStats.goals}</span>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>MÅL</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.04)', borderRadius: 5, padding: '4px 2px' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{player.seasonStats.assists}</span>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>ASSIST</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.04)', borderRadius: 5, padding: '4px 2px' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{player.seasonStats.gamesPlayed}</span>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>MATCHER</span>
                </div>
                {player.seasonStats.averageRating > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.04)', borderRadius: 5, padding: '4px 2px' }}>
                    <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-display)', color: player.seasonStats.averageRating >= 7 ? 'var(--success)' : player.seasonStats.averageRating >= 6 ? 'var(--warning)' : 'var(--danger)' }}>
                      {player.seasonStats.averageRating.toFixed(1)}
                    </span>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>BETYG</span>
                  </div>
                )}
                {player.seasonStats.suspensions > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.04)', borderRadius: 5, padding: '4px 2px' }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--danger)', fontFamily: 'var(--font-display)' }}>{player.seasonStats.suspensions}</span>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>UTVISN</span>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Har inte spelat några matcher än</p>
            )}
          </>
        )}
      </div>

      {/* ═══ ⑥ RELATIONER — owned only ═══ */}
      {isOwned && (
        <div style={SECTION_STYLE}>
          <p style={{ ...LABEL_STYLE, marginBottom: 6 }}>🤝 RELATIONER</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
            {lastTalked !== -Infinity && (() => {
              const roundsSince = currentRound - Number(lastTalked)
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>🗣</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Senaste samtalet: <strong>Omg {Number(lastTalked)}</strong> — för {roundsSince} omgång{roundsSince !== 1 ? 'ar' : ''} sedan
                    </span>
                  </div>
                  {roundsSince >= 5 && (
                    <p style={{ fontSize: 10, color: 'var(--warning)', fontStyle: 'italic' }}>
                      💬 Det var ett tag sen ni pratades vid.
                    </p>
                  )}
                </>
              )
            })()}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>📋</span>
              <span style={{ color: 'var(--text-secondary)' }}>
                Kontrakt t.o.m. <strong>{player.contractUntilSeason + 1}</strong>
                {onExtendContract && currentSeason !== undefined && player.contractUntilSeason <= currentSeason + 1 && (
                  <button
                    onClick={e => { e.stopPropagation(); onExtendContract() }}
                    style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 6, background: 'rgba(196,122,58,0.15)', border: '1px solid rgba(196,122,58,0.4)', color: 'var(--accent)', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Förläng →
                  </button>
                )}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>💰</span>
              <span style={{ color: 'var(--text-secondary)' }}>Lön: <strong>{formatMarketValue(player.salary)}/säsong</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ⑥b NARR-006: Spelarens röst ═══ */}
      {isOwned && game && (() => {
        const voice = getPlayerVoice(player, game)
        if (!voice) return null
        return (
          <div style={{ margin: '0 0 8px', padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', color: 'var(--text-muted)', marginBottom: 4 }}>
              🗣 {player.firstName.toUpperCase()}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', fontFamily: 'var(--font-display)', lineHeight: 1.5 }}>
              {voice}
            </p>
          </div>
        )
      })()}

      {/* ═══ ⑦ KARRIÄRRESA (dagbok) — owned only ═══ */}
      {isOwned && (() => {
        type DiaryEntry = { matchday: number; text: string; type: string; season?: number }
        const entries: DiaryEntry[] = []

        for (const n of player.narrativeLog ?? []) {
          if (currentSeason !== undefined && n.season !== currentSeason) continue
          entries.push({ matchday: n.matchday, text: n.text, type: n.type, season: n.season })
        }

        for (const m of player.careerMilestones ?? []) {
          if (currentSeason !== undefined && m.season !== currentSeason) continue
          if (m.type === 'debutGoal') entries.push({ matchday: m.round, text: 'Första A-lagsmålet', type: 'milestone', season: m.season })
          if (m.type === 'hatTrick') entries.push({ matchday: m.round, text: 'Hattrick', type: 'milestone', season: m.season })
          if (m.type === 'games100') entries.push({ matchday: m.round, text: '100 A-lagsmatcher', type: 'milestone', season: m.season })
        }

        for (const s of storylines ?? []) {
          entries.push({ matchday: s.matchday ?? 99, text: s.displayText, type: 'storyline' })
        }

        const bio = generateBio(player, clubName)
        if (entries.length === 0 && !bio) return null
        entries.sort((a, b) => a.matchday - b.matchday)

        function typeIcon(t: string) {
          if (t === 'milestone') return '🏅'
          if (t === 'injury') return '🩹'
          if (t === 'form') return '📈'
          if (t === 'storyline') return '📖'
          return '•'
        }

        return (
          <div style={SECTION_STYLE}>
            <p style={{ ...LABEL_STYLE, marginBottom: 6 }}>📖 KARRIÄRRESA</p>
            {bio && (
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5, marginBottom: 8, fontFamily: 'var(--font-display)' }}>
                {bio}
              </p>
            )}
            {entries.slice(0, 5).map((e, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '5px 0', borderBottom: i < Math.min(entries.length, 5) - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 36, flexShrink: 0 }}>O{e.matchday}</span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {typeIcon(e.type)} {e.text}
                </span>
              </div>
            ))}
          </div>
        )
      })()}

      {/* ═══ ⑧ KARRIÄR-TABELL ═══ */}
      {isOwned && (player.seasonHistory ?? []).length > 0 && (
        <div style={SECTION_STYLE}>
          <p style={{ ...LABEL_STYLE, marginBottom: 6 }}>📊 KARRIÄR</p>
          {[...(player.seasonHistory ?? [])].reverse().map(s => (
            <div key={s.season} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)', minWidth: 40 }}>{s.season}</span>
              <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{s.games} m · {s.goals} mål · {s.assists} ast</span>
              <span style={{ fontWeight: 600, color: s.rating >= 7 ? 'var(--success)' : s.rating >= 6 ? 'var(--text-primary)' : 'var(--danger)' }}>
                {s.rating > 0 ? s.rating.toFixed(1) : '–'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ═══ ⑨ LEDARSKAP — owned + onLeadershipAction only ═══ */}
      {isOwned && leadershipAvailable && (
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
          <p style={{ ...LABEL_STYLE, marginBottom: 8 }}>👑 LEDARSKAP</p>
          {leadershipFeedback ? (
            <div style={{
              padding: '8px 12px', background: 'var(--bg-elevated)',
              border: '1px solid var(--border)', borderRadius: 8,
              fontSize: 12, color: 'var(--text-primary)',
              animation: 'fadeInUp 200ms ease-out both',
            }}>
              {leadershipFeedback}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {([
                { id: 'lower_tempo' as LeadershipAction, label: '😮‍💨 Sänk ett varv' },
                { id: 'mentor' as LeadershipAction, label: '🎓 Sätt som mentor' },
                { id: 'private_talk' as LeadershipAction, label: '🤫 Privat samtal' },
                { id: 'public_praise' as LeadershipAction, label: '📣 Offentlig beröm' },
              ]).map(opt => {
                const avail = canLeadership(opt.id)
                return (
                  <button
                    key={opt.id}
                    onClick={e => { e.stopPropagation(); onLeadershipAction!(opt.id) }}
                    disabled={!avail}
                    style={{
                      padding: '9px 8px', borderRadius: 8,
                      background: avail ? 'var(--bg-elevated)' : 'rgba(0,0,0,0.04)',
                      border: '1px solid var(--border)',
                      fontSize: 11, color: avail ? 'var(--text-primary)' : 'var(--text-muted)',
                      cursor: avail ? 'pointer' : 'not-allowed',
                      fontFamily: 'var(--font-body)',
                      opacity: avail ? 1 : 0.5,
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ ⑩ STICKY PRATA-FOOTER — owned + onTalkToPlayer only ═══ */}
      {isOwned && onTalkToPlayer && (
        <div style={{
          position: 'sticky',
          bottom: 'calc(var(--bottom-nav-height) + 8px)',
          padding: '10px 14px',
          background: 'var(--bg-surface)',
          borderTop: '2px solid rgba(196,122,58,0.3)',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
        }}>
          <p style={{ ...LABEL_STYLE, marginBottom: 6 }}>🗣 PRATA MED SPELAREN</p>
          {talkFeedback ? (
            <div style={{
              padding: '10px 14px', background: 'var(--bg-elevated)',
              border: '1px solid var(--border)', borderRadius: 10,
              animation: 'fadeInUp 200ms ease-out both',
            }}>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 6 }}>{talkFeedback.text}</p>
              <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                {talkFeedback.moraleChange !== 0 && (
                  <span className={talkFeedback.moraleChange > 0 ? 'tag tag-green' : 'tag tag-red'}>
                    Moral {talkFeedback.moraleChange > 0 ? '+' : ''}{talkFeedback.moraleChange}
                  </span>
                )}
                {talkFeedback.formChange !== 0 && (
                  <span className={talkFeedback.formChange > 0 ? 'tag tag-green' : 'tag tag-red'}>
                    Form {talkFeedback.formChange > 0 ? '+' : ''}{talkFeedback.formChange}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              {([
                { id: 'encourage' as const, label: '😊 Uppmuntra' },
                { id: 'demand' as const, label: '💪 Ställ krav' },
                { id: 'future' as const, label: '🔮 Framtid' },
              ]).map(opt => (
                <button
                  key={opt.id}
                  onClick={e => { e.stopPropagation(); onTalkToPlayer(opt.id) }}
                  disabled={!canTalk}
                  style={{
                    flex: 1, padding: '10px 8px', borderRadius: 8,
                    background: canTalk ? 'var(--bg-elevated)' : 'rgba(0,0,0,0.04)',
                    border: '1px solid var(--border)',
                    fontSize: 11, color: canTalk ? 'var(--text-primary)' : 'var(--text-muted)',
                    cursor: canTalk ? 'pointer' : 'not-allowed',
                    fontFamily: 'var(--font-body)',
                    opacity: canTalk ? 1 : 0.5,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          {!canTalk && !talkFeedback && lastTalked !== -Infinity && (
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, textAlign: 'center' }}>
              Nästa samtal möjligt omg {Number(lastTalked) + 3}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
