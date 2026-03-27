import type { Player } from '../../domain/entities/Player'
import type { ScoutReport } from '../../domain/entities/Scouting'
import { PlayerArchetype, PlayerPosition } from '../../domain/enums'
import { getScoutReportAge } from '../../domain/services/scoutingService'
import { ClubBadge } from './ClubBadge'

export interface PlayerCardProps {
  player: Player
  clubName: string
  scoutReport?: ScoutReport   // if provided, show scouted attributes; if absent for non-managed, show '?'
  isOwned?: boolean           // true = managed club player (show real attributes)
  currentSeason?: number      // needed to calculate report age
  onClick?: () => void
}

// Archetype color for badge circle
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

function positionFullLabel(pos: PlayerPosition): string {
  const map: Record<PlayerPosition, string> = {
    [PlayerPosition.Goalkeeper]: 'Målvakt',
    [PlayerPosition.Defender]: 'Försvarare',
    [PlayerPosition.Half]: 'Halvback',
    [PlayerPosition.Midfielder]: 'Mittfältare',
    [PlayerPosition.Forward]: 'Forward',
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
    // Sort by value descending, take top 4
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
  if (value >= 75) return '#22c55e'
  if (value >= 60) return '#F0F4F8'
  if (value >= 40) return '#f59e0b'
  return '#ef4444'
}

interface PlayerSilhouetteProps {
  jerseyNumber: number
}

function PlayerSilhouette({ jerseyNumber }: PlayerSilhouetteProps) {
  return (
    <svg viewBox="0 0 120 160" width="120" height="160" aria-hidden="true">
      <defs>
        <pattern id="stripes" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="white" strokeWidth="1" opacity="0.02"/>
        </pattern>
        <radialGradient id="player-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="#C9A84C" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="120" height="160" fill="#0a1928" />
      {/* Diagonal stripe texture */}
      <rect width="120" height="160" fill="url(#stripes)"/>
      {/* Radial glow behind player */}
      <ellipse cx="60" cy="100" rx="40" ry="50" fill="url(#player-glow)"/>
      {/* Snow particles */}
      <circle cx="20" cy="30" r="1" fill="white" opacity="0.4" style={{ animation: 'snowfall 6s 0.5s infinite linear' }}/>
      <circle cx="95" cy="50" r="0.8" fill="white" opacity="0.35" style={{ animation: 'snowfall 5s 2s infinite linear' }}/>
      <circle cx="45" cy="15" r="1.2" fill="white" opacity="0.3" style={{ animation: 'snowfall 7s 1s infinite linear' }}/>
      {/* Body / torso */}
      <ellipse cx="60" cy="75" rx="18" ry="22" fill="#C9A84C" opacity="0.85" />
      {/* Head with helmet */}
      <circle cx="60" cy="46" r="14" fill="#C9A84C" opacity="0.9" />
      <rect x="48" y="38" width="24" height="10" rx="3" fill="#8B6914" />
      {/* Visor */}
      <line x1="50" y1="48" x2="70" y2="48" stroke="#0a1928" strokeWidth="2" />
      {/* Helmet visor detail */}
      <path d="M50,48 Q60,52 70,48" stroke="#0a1928" strokeWidth="1.5" fill="none"/>
      {/* Left arm / stick */}
      <line x1="58" y1="80" x2="35" y2="110" stroke="#C9A84C" strokeWidth="5" strokeLinecap="round" />
      {/* Right arm */}
      <line x1="62" y1="80" x2="80" y2="95" stroke="#C9A84C" strokeWidth="4" strokeLinecap="round" />
      {/* Stick shaft */}
      <line x1="35" y1="110" x2="25" y2="140" stroke="#8B6914" strokeWidth="3" strokeLinecap="round" />
      {/* Blade */}
      <line x1="18" y1="140" x2="38" y2="142" stroke="#8B6914" strokeWidth="4" strokeLinecap="round" />
      {/* Skate blade details */}
      <line x1="35" y1="133" x2="50" y2="134" stroke="#C9A84C" strokeWidth="1" opacity="0.5"/>
      <line x1="75" y1="128" x2="90" y2="129" stroke="#C9A84C" strokeWidth="1" opacity="0.5"/>
      {/* Left leg */}
      <line x1="55" y1="97" x2="45" y2="130" stroke="#C9A84C" strokeWidth="7" strokeLinecap="round" />
      {/* Right leg */}
      <line x1="65" y1="97" x2="80" y2="125" stroke="#C9A84C" strokeWidth="7" strokeLinecap="round" />
      {/* Skates */}
      <ellipse cx="42" cy="133" rx="10" ry="4" fill="#8B6914" />
      <ellipse cx="82" cy="128" rx="10" ry="4" fill="#8B6914" />
      {/* Ice reflection */}
      <ellipse cx="60" cy="152" rx="35" ry="6" fill="#1a3a5c" opacity="0.3"/>
      {/* Jersey number */}
      <text x="60" y="82" textAnchor="middle" fill="#0a1928" fontSize="14" fontWeight="bold">
        {jerseyNumber}
      </text>
    </svg>
  )
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
      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#4A6080', marginBottom: 4 }}>
        CA-UTVECKLING
      </p>
      <svg width={W} height={H + 4} viewBox={`0 0 ${W} ${H + 4}`} style={{ display: 'block' }}>
        <polyline
          points={coords.map(c => `${c.x},${c.y}`).join(' ')}
          fill="none"
          stroke={trending ? '#22c55e' : '#ef4444'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={last.x} cy={last.y} r="3" fill={trending ? '#22c55e' : '#ef4444'} />
        <text x={last.x + 5} y={last.y + 4} fontSize="9" fill="#F0F4F8" fontWeight="700">{currentCa}</text>
      </svg>
    </div>
  )
}

function formatMarketValue(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} mkr`
  if (v >= 1_000) return `${Math.round(v / 1_000)} tkr`
  return `${v} kr`
}

export function PlayerCard({ player, clubName, scoutReport, isOwned = true, currentSeason, onClick }: PlayerCardProps) {
  const reportAge = scoutReport && currentSeason
    ? getScoutReportAge(scoutReport, currentSeason, scoutReport.scoutedSeason)
    : scoutReport ? 'fresh' : null
  const isStale = reportAge === 'stale'

  // Stale reports are treated as if no report exists for attribute display
  const effectiveReport = isStale ? undefined : scoutReport

  const topStats = isOwned
    ? getTopStats(player)
    : effectiveReport
      ? getTopStats({ ...player, attributes: { ...player.attributes, ...effectiveReport.revealedAttributes } })
      : null

  const archColor = archetypeColor(player.archetype)
  const fullName = `${player.firstName} ${player.lastName}`.toUpperCase()
  const posLabel = positionFullLabel(player.position).toUpperCase()

  // Jersey number: use last 2 chars of player id as a number 1-99
  const idNum = parseInt(player.id.replace(/\D/g, '').slice(-2) || '10', 10)
  const jerseyNum = (idNum % 98) + 1

  return (
    <div
      onClick={onClick}
      style={{
        width: 280,
        borderRadius: 16,
        background: 'linear-gradient(#122235, #0D1B2A) padding-box, linear-gradient(160deg, #C9A84C 0%, #8B6914 50%, transparent 100%) border-box',
        border: '2px solid transparent',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.1)',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        animation: 'fadeInUp 300ms ease-out both',
      }}
    >
      {/* Top bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 14px 8px',
        background: 'rgba(0,0,0,0.2)',
      }}>
        {/* Club badge */}
        <ClubBadge clubId={player.clubId} name={clubName} size={32} />

        {/* Position + number */}
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 11, color: '#C9A84C', fontWeight: 700, letterSpacing: '1px' }}>
            #{jerseyNum}
          </p>
          <p style={{ fontSize: 10, color: '#8A9BB0', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {posLabel}
          </p>
        </div>
      </div>

      {/* Gold divider */}
      <div style={{ height: 1, background: 'rgba(201,168,76,0.3)', margin: '0 14px' }} />

      {/* Player illustration area */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '8px 0 4px',
        background: 'linear-gradient(180deg, #0a1928 0%, #0d1e33 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Faint glow behind player */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 100,
          height: 40,
          background: 'radial-gradient(ellipse, rgba(201,168,76,0.15) 0%, transparent 70%)',
        }} />
        <PlayerSilhouette jerseyNumber={jerseyNum} />
      </div>

      {/* Gold divider */}
      <div style={{ height: 1, background: 'rgba(201,168,76,0.5)', margin: '0 14px' }} />

      {/* Name + club + position */}
      <div style={{ padding: '10px 14px 8px' }}>
        <p style={{
          fontSize: 17,
          fontWeight: 900,
          color: '#F0F4F8',
          letterSpacing: '-0.3px',
          lineHeight: 1.1,
          textTransform: 'uppercase',
        }}>
          {fullName}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#C9A84C',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}>
            {clubName.toUpperCase()}
          </span>
          <span style={{ color: '#1e3450', fontSize: 12 }}>·</span>
          <div style={{
            padding: '2px 6px',
            borderRadius: 4,
            background: archColor,
            fontSize: 10,
            fontWeight: 700,
            color: '#F0F4F8',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}>
            {posLabel}
          </div>
        </div>
      </div>

      {/* Gold divider */}
      <div style={{ height: 1, background: 'rgba(201,168,76,0.25)', margin: '0 14px' }} />

      {/* EGENSKAPER section */}
      <div style={{ padding: '10px 14px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#C9A84C' }}>
            EGENSKAPER
          </p>
          {reportAge === 'aging' && (
            <span style={{ fontSize: 9, color: '#f59e0b', letterSpacing: '0.3px' }}>1 säsong sedan</span>
          )}
          {isStale && (
            <span style={{ fontSize: 9, color: '#ef4444', letterSpacing: '0.3px' }}>Föråldrad</span>
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
                  border: '1px solid rgba(201,168,76,0.1)',
                }}>
                  <span style={{ fontSize: 10, color: '#8A9BB0', letterSpacing: '0.3px' }}>{stat.label}</span>
                  <span className="tabular" style={{ fontSize: 12, fontWeight: 800, color: statValueColor(stat.value), marginLeft: 4 }}>
                    {Math.round(stat.value)}{effectiveReport && !isOwned && <span style={{ fontSize: 9, opacity: 0.6 }}> ~</span>}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 8px' }}>
              {['A', 'B', 'C', 'D'].map(k => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(138,155,176,0.1)' }}>
                  <span style={{ fontSize: 10, color: '#4A6080', letterSpacing: '0.3px' }}>—</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#4A6080' }}>?</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {isStale && (
          <p style={{ fontSize: 10, color: '#ef4444', marginTop: 6, textAlign: 'center', opacity: 0.8 }}>
            Föråldrad rapport — scouta igen?
          </p>
        )}
      </div>

      {/* Gold gradient divider */}
      <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.6), transparent)', margin: '0 0' }} />

      {/* Season summary — only for owned players */}
      <div style={{ padding: '8px 14px 12px' }}>
        {!isOwned && effectiveReport && (
          <p style={{ fontSize: 11, color: '#4A6080', fontStyle: 'italic' }}>
            🔍 Scouted {effectiveReport.scoutedDate} · uppskattad styrka {effectiveReport.estimatedCA}
          </p>
        )}
        {!isOwned && !effectiveReport && (
          <p style={{ fontSize: 11, color: '#4A6080' }}>Ej scoutad — attribut okända</p>
        )}
        {isOwned && <>
        <p style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: '#4A6080',
          marginBottom: 6,
        }}>
          SÄSONG
        </p>
        <p style={{ fontSize: 11, color: '#4A6080', marginBottom: 6 }}>
          Marknadsvärde: <span style={{ color: '#8A9BB0', fontWeight: 700 }}>{formatMarketValue(player.marketValue)}</span>
        </p>
        {player.seasonStats.gamesPlayed > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px 6px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 5, padding: '4px 2px' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#F0F4F8' }}>{player.seasonStats.goals}</span>
              <span style={{ fontSize: 9, color: '#4A6080', letterSpacing: '0.5px' }}>MÅL</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 5, padding: '4px 2px' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#F0F4F8' }}>{player.seasonStats.assists}</span>
              <span style={{ fontSize: 9, color: '#4A6080', letterSpacing: '0.5px' }}>ASSIST</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 5, padding: '4px 2px' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#F0F4F8' }}>{player.seasonStats.gamesPlayed}</span>
              <span style={{ fontSize: 9, color: '#4A6080', letterSpacing: '0.5px' }}>MATCHER</span>
            </div>
            {player.seasonStats.averageRating > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 5, padding: '4px 2px' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: player.seasonStats.averageRating >= 7 ? '#22c55e' : player.seasonStats.averageRating >= 6 ? '#f59e0b' : '#ef4444' }}>
                  {player.seasonStats.averageRating.toFixed(1)}
                </span>
                <span style={{ fontSize: 9, color: '#4A6080', letterSpacing: '0.5px' }}>BETYG</span>
              </div>
            )}
            {player.seasonStats.yellowCards > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 5, padding: '4px 2px' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#f59e0b' }}>{player.seasonStats.yellowCards}</span>
                <span style={{ fontSize: 9, color: '#4A6080', letterSpacing: '0.5px' }}>GULA</span>
              </div>
            )}
            {player.seasonStats.suspensions > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 5, padding: '4px 2px' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#ef4444' }}>{player.seasonStats.suspensions}</span>
                <span style={{ fontSize: 9, color: '#4A6080', letterSpacing: '0.5px' }}>UTVISN</span>
              </div>
            )}
          </div>
        ) : (
          <p style={{ fontSize: 12, color: '#4A6080' }}>Inga matcher spelat</p>
        )}
        {isOwned && (player.caHistory ?? []).length >= 1 && (
          <CaSparkline history={player.caHistory ?? []} currentCa={player.currentAbility} />
        )}
        </>}
      </div>
    </div>
  )
}
