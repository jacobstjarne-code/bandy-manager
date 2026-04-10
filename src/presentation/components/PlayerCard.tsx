import type { Player } from '../../domain/entities/Player'
import type { ScoutReport } from '../../domain/entities/Scouting'
import { PlayerArchetype, PlayerPosition } from '../../domain/enums'
import { getScoutReportAge } from '../../domain/services/scoutingService'
import { ClubBadge } from './ClubBadge'
import { getPortraitPath } from '../../domain/services/portraitService'

export interface PlayerCardProps {
  player: Player
  clubName: string
  scoutReport?: ScoutReport   // if provided, show scouted attributes; if absent for non-managed, show '?'
  isOwned?: boolean           // true = managed club player (show real attributes)
  currentSeason?: number      // needed to calculate report age
  onClick?: () => void
  storylines?: Array<{ displayText: string; matchday?: number }>  // resolved storylines for this player
  onExtendContract?: () => void
  onClose?: () => void
}

// Archetype color for badge circle
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
  if (value >= 75) return 'var(--success)'
  if (value >= 60) return 'var(--text-primary)'
  if (value >= 40) return 'var(--warning)'
  return 'var(--danger)'
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

function formatMarketValue(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} mkr`
  if (v >= 1_000) return `${Math.round(v / 1_000)} tkr`
  return `${v} kr`
}

export function PlayerCard({ player, clubName, scoutReport, isOwned = true, currentSeason, onClick, storylines, onExtendContract, onClose }: PlayerCardProps) {
  const reportAge = scoutReport && currentSeason
    ? getScoutReportAge(scoutReport, currentSeason, scoutReport.scoutedSeason)
    : scoutReport ? 'fresh' : null
  const isStale = reportAge === 'stale'

  // Stale reports are treated as if no report exists for attribute display
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

  // Jersey number: use last 2 chars of player id as a number 1-99
  const idNum = parseInt(player.id.replace(/\D/g, '').slice(-2) || '10', 10)
  const jerseyNum = (idNum % 98) + 1

  return (
    <div
      onClick={onClick}
      style={{
        width: '100%',
        borderRadius: 0,
        background: 'var(--bg-surface)',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 14px 8px',
        background: 'rgba(0,0,0,0.2)',
        gap: 8,
      }}>
        {/* Club badge */}
        <ClubBadge clubId={player.clubId} name={clubName} size={32} />

        {/* Position + number — centred when close button present */}
        <div style={{ flex: 1, textAlign: onClose ? 'center' : 'right' }}>
          <p style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, letterSpacing: '1px' }}>
            #{jerseyNum}
          </p>
          <p style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {posLabel}
          </p>
        </div>

        {/* Close button — integrated, same visual weight as badge */}
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

      {/* Player portrait */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '8px 0 4px',
        background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
        position: 'relative',
        overflow: 'hidden',
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

      {/* Name + club + position */}
      <div style={{ padding: '10px 14px 8px' }}>
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
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--accent)',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}>
            {clubName.toUpperCase()}
          </span>
          <span style={{ color: 'var(--border)', fontSize: 12 }}>·</span>
          <div style={{
            padding: '2px 6px',
            borderRadius: 4,
            background: archColor,
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--text-light)',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}>
            {posLabel}
          </div>
        </div>
      </div>

      {/* BAKGRUND section */}
      {isOwned && (
        <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
            BAKGRUND
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, color: 'var(--text-secondary)' }}>
            <span>🏟️ Fostrad i {player.academyClubId ? clubName : 'okänd klubb'}</span>
            {player.dayJob ? (
              <span>📋 {player.dayJob.title} (flex {player.dayJob.flexibility}%)</span>
            ) : player.isFullTimePro ? (
              <span>⭐ Heltidsproffs</span>
            ) : null}
            <span>📅 Kontrakt t.o.m. {player.contractUntilSeason + 1}</span>
            {onExtendContract && currentSeason !== undefined && player.contractUntilSeason <= currentSeason + 1 && (
              <button
                onClick={e => { e.stopPropagation(); onExtendContract() }}
                style={{
                  marginTop: 4, padding: '8px 16px', borderRadius: 8,
                  background: 'rgba(196,122,58,0.15)', border: '1px solid rgba(196,122,58,0.4)',
                  color: 'var(--accent)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  alignSelf: 'flex-start',
                }}
              >
                Förläng kontrakt →
              </button>
            )}
            {player.trait && (
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: 2 }}>
                {player.trait === 'hungrig' && `🔥 ${player.seasonStats.goals} mål på ${player.seasonStats.gamesPlayed} matcher${player.startSeasonCA && player.currentAbility > player.startSeasonCA ? `, CA +${Math.round(player.currentAbility - player.startSeasonCA)} denna säsong` : ''}`}
                {player.trait === 'veteran' && `🏅 ${(player.careerStats?.seasonsPlayed ?? 1)} säsonger i karriären.${player.contractUntilSeason <= (currentSeason ?? 0) ? ' Kontraktet löper ut.' : ''}`}
                {player.trait === 'joker' && `🎭 Oförutsägbar. ${player.seasonStats.goals} mål och ${player.seasonStats.suspensions} utvisningar.`}
                {player.trait === 'lokal' && `🏘️ Född och uppvuxen här. Publiken älskar honom.`}
                {player.trait === 'ledare' && `🦁 Lagets ansikte utåt. ${player.seasonStats.gamesPlayed} matcher som ledare.`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Gold divider */}
      <div style={{ height: 1, background: 'rgba(196,122,58,0.25)', margin: '0 14px' }} />

      {/* EGENSKAPER section */}
      <div style={{ padding: '10px 14px 8px' }}>
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
      </div>

      {/* Gold gradient divider */}
      <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(196,122,58,0.6), transparent)', margin: '0 0' }} />

      {/* Season summary — only for owned players */}
      <div style={{ padding: '8px 14px 12px' }}>
        {!isOwned && effectiveReport && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            🔍 Scouted {effectiveReport.scoutedDate} · uppskattad styrka {effectiveReport.estimatedCA}
          </p>
        )}
        {!isOwned && !effectiveReport && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ej scoutad — attribut okända</p>
        )}
        {isOwned && <>
        <p style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: 6,
        }}>
          SÄSONG
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
          Marknadsvärde: <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{formatMarketValue(player.marketValue)}</span>
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
            {player.seasonStats.yellowCards > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.04)', borderRadius: 5, padding: '4px 2px' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--warning)', fontFamily: 'var(--font-display)' }}>{player.seasonStats.yellowCards}</span>
                <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>VARNING</span>
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
        {isOwned && (player.caHistory ?? []).length >= 1 && (
          <CaSparkline history={player.caHistory ?? []} currentCa={player.currentAbility} />
        )}
        {/* Season history */}
        {isOwned && (player.seasonHistory ?? []).length > 0 && (
          <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
              KARRIÄR
            </p>
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
        {/* 📖 DAGBOK */}
        {isOwned && (() => {
          type DiaryEntry = { matchday: number; text: string; type: string }
          const entries: DiaryEntry[] = []

          // From narrativeLog (current season)
          for (const n of player.narrativeLog ?? []) {
            if (currentSeason !== undefined && n.season !== currentSeason) continue
            entries.push({ matchday: n.matchday, text: n.text, type: n.type })
          }

          // From careerMilestones (current season) — if no narrativeLog entry covers it
          for (const m of player.careerMilestones ?? []) {
            if (currentSeason !== undefined && m.season !== currentSeason) continue
            if (m.type === 'debutGoal') entries.push({ matchday: m.round, text: 'Första A-lagsmålet', type: 'milestone' })
            if (m.type === 'hatTrick') entries.push({ matchday: m.round, text: 'Hattrick', type: 'milestone' })
            if (m.type === 'games100') entries.push({ matchday: m.round, text: '100 A-lagsmatcher', type: 'milestone' })
          }

          // From storylines
          for (const s of storylines ?? []) {
            entries.push({ matchday: s.matchday ?? 99, text: s.displayText, type: 'storyline' })
          }

          if (entries.length === 0) return null
          entries.sort((a, b) => a.matchday - b.matchday)

          function typeIcon(t: string) {
            if (t === 'milestone') return '🏅'
            if (t === 'injury') return '🩹'
            if (t === 'form' ) return '📈'
            if (t === 'storyline') return '📖'
            return '•'
          }

          return (
            <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
              <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
                📖 DAGBOK
              </p>
              {entries.slice(0, 5).map((e, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '5px 0', borderBottom: i < Math.min(entries.length, 5) - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 28, flexShrink: 0 }}>O{e.matchday}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {typeIcon(e.type)} {e.text}
                  </span>
                </div>
              ))}
            </div>
          )
        })()}
        </>}
      </div>
    </div>
  )
}
