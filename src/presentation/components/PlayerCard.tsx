import type { Player } from '../../domain/entities/Player'
import { PlayerArchetype, PlayerPosition } from '../../domain/enums'
import { ClubBadge } from './ClubBadge'

export interface PlayerCardProps {
  player: Player
  clubName: string
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
  decisions: 'Beslut',
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

export function PlayerCard({ player, clubName, onClick }: PlayerCardProps) {
  const topStats = getTopStats(player)
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
        <p style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: '#C9A84C',
          marginBottom: 8,
        }}>
          EGENSKAPER
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px 8px',
        }}>
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
              <span style={{ fontSize: 10, color: '#8A9BB0', letterSpacing: '0.3px' }}>
                {stat.label}
              </span>
              <span className="tabular" style={{
                fontSize: 12,
                fontWeight: 800,
                color: statValueColor(stat.value),
                marginLeft: 4,
              }}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Gold gradient divider */}
      <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.6), transparent)', margin: '0 0' }} />

      {/* Season summary */}
      <div style={{ padding: '8px 14px 12px' }}>
        <p style={{ fontSize: 11, color: '#4A6080', letterSpacing: '0.3px' }}>
          Säsong {player.seasonStats.gamesPlayed > 0
            ? `${player.seasonStats.goals} Mål, ${player.seasonStats.assists} Assist · ${player.seasonStats.gamesPlayed} matcher`
            : 'Inga matcher spelat'}
        </p>
      </div>
    </div>
  )
}
