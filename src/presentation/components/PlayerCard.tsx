import { useState } from 'react'
import type { Player } from '../../domain/entities/Player'
import type { ScoutReport } from '../../domain/entities/Scouting'
import type { SaveGame } from '../../domain/entities/SaveGame'
import { PlayerArchetype } from '../../domain/enums'
import { getScoutReportAge } from '../../domain/services/scoutingService'
import { canUseLeadershipAction, type LeadershipAction } from '../../domain/services/leadershipService'
import { ClubBadge } from './ClubBadge'
import { getPortraitImagePath } from '../../domain/services/portraitService'
import { getPlayerVoice, getPlayerMoodLine, getSeasonArc } from '../../domain/services/playerVoiceService'
import type { RecentMatchRating } from './playerCardUtils'
import { CareerJourney } from './player/CareerJourney'
import { ScoreBlock, type ScoreBlockVariant } from './primitives/ScoreBlock'
import { Icon } from './primitives/Icon'
import { formatSalary, positionShort, formatContractUntil, formatWeeks } from '../utils/formatters'
import { MENTOR_FORM_THRESHOLD } from '../../domain/services/mentorshipConstants'
import { mentorshipBondAdeptInForm, mentorshipBondAdeptResting } from '../../domain/data/mentorshipStrings'
import { pickRehabStageLine } from '../../domain/data/injuryDoctorText'
import { matchdayToLeagueRound } from '../../domain/services/scheduleGenerator'
import { MessageCircle, Crown, Wind, MessageSquare, Megaphone, Smile, Flame, Medal, Drama, Home } from 'lucide-react'

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
      <p className="h-label">
        {/* "CA-UTVECKLING" → "STYRKA": ordet resten av UI:t använder (audit 2026-08-29) */}
        STYRKA
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
      <p className="h-micro" style={{ color: trending ? 'var(--success)' : 'var(--danger)', textAlign: 'center', marginTop: 2 }}>
        {trending ? '↑ Stigande form' : '↓ Vikande form'}
      </p>
    </div>
  )
}

const SECTION_STYLE = { padding: '10px 14px', borderBottom: '1px solid var(--border)' } as const

export function PlayerCard({
  player,
  clubName,
  scoutReport,
  isOwned = true,
  currentSeason,
  onClick,
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
  // Genomgång II A: illustrerat hjälteporträtt (PNG-arketyp), ålder → tier → seedat val.
  const portraitImg = getPortraitImagePath(player.id, player.age)

  // Genomgång II A: tre etiketterade lägen — inget gömt, allt ett klick bort.
  const [mode, setMode] = useState<'oversikt' | 'attribut' | 'karriar'>('oversikt')
  // Översikt: Prata/Ledarskap är knappar som öppnar sin panel (mock genomgång II).
  const [openAction, setOpenAction] = useState<'prata' | 'ledarskap' | null>(null)

  // Hjälteblock: rösten + känsloläget + säsongsbågen lyfts till toppen (led med människan).
  const heroVoice = isOwned && game ? getPlayerVoice(player, game) : null
  const heroMood = isOwned && game ? getPlayerMoodLine(player, game) : null
  const seasonArc = isOwned ? getSeasonArc(player, recentRatings) : null

  const topStats = isOwned
    ? getTopStats(player)
    : effectiveReport
      ? getTopStats({ ...player, attributes: { ...player.attributes, ...effectiveReport.revealedAttributes } })
      : null

  // Läges-flaggor: en scoutad (ej ägd) spelare har ingen nav — visar sina sektioner rakt av.
  const showOversikt = !isOwned || mode === 'oversikt'
  const showAttribut = !isOwned || mode === 'attribut'
  const showKarriar = !isOwned || mode === 'karriar'
  const fullName = `${player.firstName} ${player.lastName}`.toUpperCase()
  const posLabel = positionShort(player.position)

  const idNum = parseInt(player.id.replace(/\D/g, '').slice(-2) || '10', 10)
  const jerseyNum = (idNum % 98) + 1

  const isCaptain = game?.captainPlayerId === player.id

  // Spelarsamtal availability
  const lastTalked = game ? ((game.playerConversations ?? {})[player.id] ?? -Infinity) : -Infinity
  // SKALA-BUGGEN steg B (2026-09-02) — felnamngiven sedan tidigare: filtret
  // exkluderar inte cup/slutspel, så värdet är global matchdag, inte en
  // serieomgång. Namnet bytt för att inte ärvas som mönster nästa gång.
  const latestCompletedMatchday = game
    ? (game.fixtures.filter(f => f.status === 'completed').sort((a, b) => b.matchday - a.matchday)[0]?.matchday ?? 0)
    : 0
  const canTalk = onTalkToPlayer != null && latestCompletedMatchday - Number(lastTalked) >= 3

  const leadershipAvailable = onLeadershipAction != null && game != null
  const canLeadership = (action: LeadershipAction) =>
    leadershipAvailable && canUseLeadershipAction(game!, player.id, action, latestCompletedMatchday)

  const asAdept = game
    ? (game.mentorships ?? []).find(m => m.youthPlayerId === player.id && m.isActive)
    : undefined
  const asMentor = game
    ? (game.mentorships ?? []).filter(m => m.seniorPlayerId === player.id && m.isActive)
    : []

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
        <div style={{ flex: 1 }}>
          <p className="h-label" style={{ color: 'var(--accent)' }}>
            {clubName.toUpperCase()}
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

      {/* ═══ HJÄLTE: porträtt + namn + röst + känsloläge (led med människan) ═══ */}
      <div style={{
        padding: '14px 13px 12px',
        background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--accent)', background: 'var(--bg-surface)', flexShrink: 0 }}>
            <img src={portraitImg} alt="" width={64} height={64} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* ds-exempt: hero player name — 16px 900, negative tracking, uppercase hero treatment, distinct from h-name(15px 700) */}
            <p style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.3px', lineHeight: 1.05, textTransform: 'uppercase' }}>
              {fullName}
            </p>
            <p className="h-label" style={{ color: 'var(--accent-dark)', marginTop: 3 }}>
              {posLabel} · {player.age} ÅR · #{jerseyNum}{isCaptain ? ' · © KAPTEN' : ''}
            </p>
            {isOwned && (
              <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                {/* D1 (Överlämning 2 steg 0, Jacobs dom 2026-08-22): trait-taggar
                    följer samma regel som allt annat i appen — strukturerat fält,
                    Lucide-ikon, ingen emoji som bär betydelse. tag-*-familjen
                    (global.css) istf hand-rullad className="tag" + inline-färg. */}
                {player.trait === 'hungrig' && <span className="tag tag-green"><Icon icon={Flame} size={11} color="var(--success-light)" /> Hungrig</span>}
                {player.trait === 'veteran' && <span className="tag tag-ghost"><Icon icon={Medal} size={11} color="var(--text-muted)" /> Veteran</span>}
                {player.trait === 'joker' && <span className="tag tag-copper"><Icon icon={Drama} size={11} color="var(--accent-text)" /> Joker</span>}
                {player.trait === 'lokal' && <span className="tag tag-ice"><Icon icon={Home} size={11} color="var(--ice-dark)" /> Lokal</span>}
                {player.trait === 'ledare' && <span className="tag tag-copper"><Icon icon={Crown} size={11} color="var(--accent-text)" /> Ledare</span>}
                {asMentor.length > 0 && <span className="tag" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>🎓 Mentor</span>}
              </div>
            )}
          </div>
        </div>
        {heroVoice && (
          <div style={{ marginTop: 11, paddingLeft: 11, borderLeft: '2px solid var(--accent)' }}>
            <p className="h-quote" style={{ fontSize: 12.5, lineHeight: 1.45 }}>
              {heroVoice}
            </p>
            {/* ds-exempt: 9px italic mood sub-line, no canon class for 9px italic display */}
            {heroMood && (
              <p style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 5, fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
                {heroMood}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ═══ MOOD-STRIP: kompakt status, alltid synlig ═══ */}
      {isOwned && (
        <div style={{ padding: '9px 13px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, textAlign: 'center' }}>
            {[
              { label: 'Form', value: player.form },
              { label: 'Moral', value: player.morale },
              { label: 'Skärpa', value: player.sharpness },
              { label: 'Kondition', value: player.fitness },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="h-num" style={{ color: barColor(value) }}>{Math.round(value)}</div>
                {/* ds-exempt: 8px mood-strip label, no uppercase — not h-label */}
                <div style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ SÄSONGENS BÅGE: form + resultat ur loggen ═══ */}
      {seasonArc && (
        <div style={{ padding: '10px 13px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <p className="h-label">SÄSONGENS BÅGE</p>
          {/* ds-exempt: 11.5px display narrative, not italic, no canon match */}
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            {seasonArc}
          </p>
        </div>
      )}

      {/* ═══ SEGMENTERAD NAV: tre lägen (.seg-mönstret) — inget gömt, allt ett klick bort ═══ */}
      {isOwned && (
        <div style={{ padding: '11px 13px 6px' }}>
          <div style={{ display: 'flex', gap: 0, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            {([
              { id: 'oversikt' as const, label: 'Översikt' },
              { id: 'attribut' as const, label: 'Attribut & status' },
              { id: 'karriar' as const, label: 'Karriär' },
            ]).map((seg, i, arr) => (
              <button
                key={seg.id}
                onClick={e => { e.stopPropagation(); setMode(seg.id) }}
                className="h-label"
                style={{
                  flex: 1, textAlign: 'center', padding: '7px 4px',
                  margin: 0,
                  cursor: 'pointer',
                  border: 'none', borderRight: i === arr.length - 1 ? 'none' : '1px solid var(--border)',
                  background: mode === seg.id ? 'var(--accent)' : 'transparent',
                  color: mode === seg.id ? 'var(--text-light)' : 'var(--text-muted)',
                }}
              >
                {seg.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══ ÖVERSIKT — lugn sammanfattning: nyckeltal + kontrakt + handlingsknappar ═══ */}
      {isOwned && showOversikt && (
        <div style={{ padding: '4px 13px 12px' }}>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            {[
              { label: 'MÅL', value: String(player.seasonStats.goals) },
              { label: 'AST', value: String(player.seasonStats.assists) },
              { label: 'BGT', value: player.seasonStats.averageRating > 0 ? player.seasonStats.averageRating.toFixed(1) : '–' },
            ].map(c => (
              <span key={c.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 11, background: 'transparent' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.value}</span>
                <span className="h-micro" style={{ color: 'var(--text-muted)', letterSpacing: '0.5px' }}>{c.label}</span>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 9, borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--text-secondary)' }}>
            <span>📋 Kontrakt {formatContractUntil(player.contractUntilSeason)}</span>
            {onExtendContract && currentSeason !== undefined && player.contractUntilSeason <= currentSeason + 1 && (
              <button onClick={e => { e.stopPropagation(); onExtendContract() }}
                style={{ background: 'none', border: 'none', color: 'var(--accent-dark)', fontWeight: 700, fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                Förläng →
              </button>
            )}
          </div>
          {(onTalkToPlayer || leadershipAvailable) && (
            <div style={{ display: 'flex', gap: 6, marginTop: 9 }}>
              {onTalkToPlayer && (
                <button onClick={e => { e.stopPropagation(); setOpenAction(a => a === 'prata' ? null : 'prata') }}
                  style={{ flex: 1, padding: '9px 8px', borderRadius: 'var(--radius-md)', background: openAction === 'prata' ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--bg-surface)', border: '1px solid var(--border)', fontSize: 11, color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Icon icon={MessageCircle} size={13} />Prata</span>
                </button>
              )}
              {leadershipAvailable && (
                <button onClick={e => { e.stopPropagation(); setOpenAction(a => a === 'ledarskap' ? null : 'ledarskap') }}
                  style={{ flex: 1, padding: '9px 8px', borderRadius: 'var(--radius-md)', background: openAction === 'ledarskap' ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--bg-surface)', border: '1px solid var(--border)', fontSize: 11, color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Icon icon={Crown} size={13} />Ledarskap</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ ① STATUS → Attribut & status ═══ */}
      {isOwned && showAttribut && (
        <div style={SECTION_STYLE}>
          <p className="h-label" style={{ marginBottom: 8 }}>💪 STATUS</p>
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
          <p style={{ fontSize: 10, marginTop: 6, color: player.isInjured ? 'var(--danger)' : player.suspensionGamesRemaining > 0 ? 'var(--warning)' : player.fitness < 15 ? 'var(--accent)' : 'var(--success)' }}>
            {player.isInjured
              ? `🩹 Skadad`
              : player.suspensionGamesRemaining > 0
                ? `🚫 Avstängd ${player.suspensionGamesRemaining} match${player.suspensionGamesRemaining > 1 ? 'er' : ''}`
                : player.fitness < 15
                  ? 'SLUT — behöver vila'
                  : '🩹 Frisk · Tillgänglig'}
          </p>
          {/* DREAM-012: injury narrative */}
          {player.isInjured && player.injuryNarrative && (
            <div style={{ padding: '8px 10px', background: 'color-mix(in srgb, var(--danger) 8%, transparent)', borderLeft: '3px solid var(--danger)', marginTop: 8, borderRadius: '0 4px 4px 0' }}>
              <p className="h-label" style={{ color: 'var(--danger)' }}>
                {/* formatWeeks: 1–7 dagar kvar renderade tidigare "1 veckor kvar" */}
                🏥 SKADAD — {formatWeeks(Math.ceil(player.injuryDaysRemaining / 7))} kvar
              </p>
              <p className="h-quote-sm" style={{ lineHeight: 1.5 }}>
                {player.injuryNarrative}
              </p>
              {/* Pool 1b (2026-07-18): doktorns rehab-status — skild röst från
                  injuryNarrative (skadans ursprungshistoria, statisk sedan
                  skadetillfället). Denna raden uppdateras med dagar kvar,
                  eftersom den beskriver VAR i rehabben spelaren är NU. */}
              <p className="h-quote-sm" style={{ lineHeight: 1.5, marginTop: 6, color: 'var(--text-muted)' }}>
                {pickRehabStageLine(player.id, player.injuryDaysRemaining)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══ ② DUBBELLIV → Attribut & status ═══ */}
      {isOwned && showAttribut && (
        <div style={SECTION_STYLE}>
          <p className="h-label" style={{ marginBottom: 6 }}>💼 DUBBELLIV</p>
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

      {/* ═══ ③ SENASTE 5 MATCHER → Attribut & status ═══ */}
      {isOwned && showAttribut && recentRatings && recentRatings.length > 0 && (
        <div style={SECTION_STYLE}>
          <p className="h-label" style={{ marginBottom: 6 }}>📈 SENASTE 5 MATCHER</p>
          {/* C-SY2 Våg 4: senaste matchrating som ScoreBlock (win ≥6.5 / loss ≤5.5 / subtle neutral) */}
          {(() => {
            const latest = recentRatings[recentRatings.length - 1]
            const variant: ScoreBlockVariant = latest.rating >= 6.5 ? 'win' : latest.rating <= 5.5 ? 'loss' : 'subtle'
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <ScoreBlock score={latest.rating.toFixed(1)} variant={variant} label={`vs ${latest.opponentShortName}`} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Senaste matchbetyg
                </span>
              </div>
            )
          })()}
          <MatchSparkline ratings={recentRatings} />
        </div>
      )}

      {/* ═══ ④ EGENSKAPER → Attribut & status ═══ */}
      {showAttribut && (
      <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
          <p className="h-label" style={{ color: 'var(--accent)' }}>
            EGENSKAPER
          </p>
          {reportAge === 'aging' && (
            <span className="h-micro" style={{ color: 'var(--warning)', letterSpacing: '0.3px' }}>1 säsong sedan</span>
          )}
          {isStale && (
            <span className="h-micro" style={{ color: 'var(--danger)', letterSpacing: '0.3px' }}>Föråldrad</span>
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
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid color-mix(in srgb, var(--accent) 10%, transparent)',
                }}>
                  <span style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.3px' }}>{stat.label}</span>
                  <span className="h-num-sm" style={{ color: statValueColor(stat.value), marginLeft: 4 }}>
                    {Math.round(stat.value)}{effectiveReport && !isOwned && <span style={{ fontSize: 9, opacity: 0.6 }}> ~</span>}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 8px' }}>
              {['A', 'B', 'C', 'D'].map(k => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(138,155,176,0.1)' }}>
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
            <p className="h-micro" style={{ color: 'var(--text-muted)', marginTop: 2 }}>
              {player.age < 24 ? `${player.age} år — utvecklas fortfarande` : `${player.age} år — potential ${Math.round(player.potentialAbility)}`}
            </p>
          </div>
        )}

        {/* CA sparkline */}
        {isOwned && (player.caHistory ?? []).length >= 1 && (
          <CaSparkline history={player.caHistory ?? []} currentCa={player.currentAbility} />
        )}
      </div>
      )}

      {/* ═══ ⑤ SÄSONG (marknadsvärde + dynamiska celler) → Karriär ═══ */}
      {showKarriar && (
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
            <p className="h-label" style={{ marginBottom: 6 }}>🏒 SÄSONG</p>
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
            {/* ds-exempt: 14px season stat cells — intentional between h-num-sm(12) and h-num(15) for compact grid */}
            {player.seasonStats.gamesPlayed > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px 6px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.04)', borderRadius: 5, padding: '4px 2px' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{player.seasonStats.goals}</span>
                  <span className="h-micro" style={{ color: 'var(--text-muted)', letterSpacing: '0.5px' }}>MÅL</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.04)', borderRadius: 5, padding: '4px 2px' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{player.seasonStats.assists}</span>
                  <span className="h-micro" style={{ color: 'var(--text-muted)', letterSpacing: '0.5px' }}>ASSIST</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.04)', borderRadius: 5, padding: '4px 2px' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{player.seasonStats.gamesPlayed}</span>
                  <span className="h-micro" style={{ color: 'var(--text-muted)', letterSpacing: '0.5px' }}>MATCHER</span>
                </div>
                {player.seasonStats.averageRating > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.04)', borderRadius: 5, padding: '4px 2px' }}>
                    <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-display)', color: player.seasonStats.averageRating >= 7 ? 'var(--success)' : player.seasonStats.averageRating >= 6 ? 'var(--warning)' : 'var(--danger)' }}>
                      {player.seasonStats.averageRating.toFixed(1)}
                    </span>
                    <span className="h-micro" style={{ color: 'var(--text-muted)', letterSpacing: '0.5px' }}>BETYG</span>
                  </div>
                )}
                {player.seasonStats.suspensions > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.04)', borderRadius: 5, padding: '4px 2px' }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--danger)', fontFamily: 'var(--font-display)' }}>{player.seasonStats.suspensions}</span>
                    <span className="h-micro" style={{ color: 'var(--text-muted)', letterSpacing: '0.5px' }}>UTVISN</span>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Har inte spelat några matcher än</p>
            )}
          </>
        )}
      </div>
      )}

      {/* ═══ ⑥ RELATIONER → Karriär ═══ */}
      {isOwned && showKarriar && (
        <div style={SECTION_STYLE}>
          <p className="h-label" style={{ marginBottom: 6 }}>🤝 RELATIONER</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
            {/* Mentor-band — adept-raden */}
            {asAdept && game && (() => {
              const mentor = game.players.find(p => p.id === asAdept.seniorPlayerId)
              if (!mentor) return null
              const mentorName = `${mentor.firstName} ${mentor.lastName}`
              const isActive = mentor.form >= MENTOR_FORM_THRESHOLD
              return (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>🎓</span>
                    <span style={{ color: 'var(--text-secondary)', flex: 1 }}>
                      Mentoreras av <strong>{mentorName}</strong> · sedan omg {asAdept.startRound}
                    </span>
                    <span className={`tag ${isActive ? 'tag-green' : 'tag-ice'}`}>
                      {isActive ? 'Aktiv' : 'Vilar'}
                    </span>
                  </div>
                  <p style={{ fontSize: 10, fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--text-secondary)', marginTop: 2, marginLeft: 16, lineHeight: 1.4 }}>
                    {isActive ? mentorshipBondAdeptInForm() : mentorshipBondAdeptResting(mentorName)}
                  </p>
                </div>
              )
            })()}
            {/* Mentor-band — mentor-raden */}
            {asMentor.length > 0 && game && (
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 1 }}>🎓</span>
                  <div style={{ flex: 1 }}>
                    {asMentor.map(m => {
                      const adept = (game.youthTeam?.players ?? []).find(p => p.id === m.youthPlayerId)
                        ?? game.players.find(p => p.id === m.youthPlayerId)
                      const adeptName = adept && 'firstName' in adept
                        ? `${(adept as { firstName: string; lastName: string }).firstName} ${(adept as { firstName: string; lastName: string }).lastName}`
                        : '?'
                      const isActive = player.form >= MENTOR_FORM_THRESHOLD
                      return (
                        <div key={m.youthPlayerId} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ color: 'var(--text-secondary)', flex: 1 }}>
                            Mentor åt <strong>{adeptName}</strong>
                          </span>
                          <span className={`tag ${isActive ? 'tag-green' : 'tag-ice'}`}>
                            {isActive ? 'Aktiv' : 'Vilar'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
            {lastTalked !== -Infinity && (() => {
              const roundsSince = latestCompletedMatchday - Number(lastTalked)
              // SKALA-BUGGEN steg B — lastTalked är global matchdag, rebasas
              // nu vid säsongsskifte (seasonEndProcessor.ts) så talet håller
              // sig giltigt mot innevarande säsongs kalender. Kan ändå landa
              // före matchdag 1 (samtalet skedde en tidigare säsong) — då
              // finns ingen meningsfull etikett att visa, bara "sedan"-talet.
              const lastTalkedRound = matchdayToLeagueRound(Number(lastTalked), game!.currentSeason)
              const lastTalkedLabel = lastTalkedRound !== undefined
                ? `Omg ${lastTalkedRound}`
                : Number(lastTalked) >= 1 ? `Matchdag ${Number(lastTalked)}` : null
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>🗣</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Senaste samtalet: {lastTalkedLabel && <><strong>{lastTalkedLabel}</strong> — </>}för {roundsSince} omgång{roundsSince !== 1 ? 'ar' : ''} sedan
                    </span>
                  </div>
                  {roundsSince >= 5 && (
                    <p style={{ fontSize: 10, color: 'var(--warning)', fontStyle: 'italic' }}>
                      Det var ett tag sen ni pratades vid.
                    </p>
                  )}
                </>
              )
            })()}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>📋</span>
              <span style={{ color: 'var(--text-secondary)' }}>
                Kontrakt <strong>{formatContractUntil(player.contractUntilSeason)}</strong>
                {onExtendContract && currentSeason !== undefined && player.contractUntilSeason <= currentSeason + 1 && (
                  <button
                    onClick={e => { e.stopPropagation(); onExtendContract() }}
                    style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 'var(--radius-md)', background: 'color-mix(in srgb, var(--accent) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)', color: 'var(--accent)', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Förläng →
                  </button>
                )}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>💰</span>
              <span style={{ color: 'var(--text-secondary)' }}>Lön: <strong>{formatSalary(player.salary)}</strong></span>
            </div>
            {/* tenure-falt-joinedclubseason (DOM 2026-09-03) — år i klubben. */}
            {player.joinedClubSeason !== undefined && currentSeason !== undefined && currentSeason >= player.joinedClubSeason && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>📅</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  År i klubben: <strong>{currentSeason - player.joinedClubSeason}</strong>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Spelarens röst lyft till hjälteblocket (genomgång II A) — ingen egen sektion längre. */}

      {/* ═══ ⑦ KARRIÄRRESA → Karriär ═══ */}
      {isOwned && showKarriar && (() => {
        const bio = generateBio(player, clubName)
        const hasJourney = (player.diary?.length ?? 0) > 0 || (player.careerStats?.seasonsPlayed ?? 0) >= 2
        if (!bio && !hasJourney) return null
        return (
          <div style={SECTION_STYLE}>
            {bio && (
              <p className="h-quote-sm" style={{ lineHeight: 1.5, marginBottom: 8 }}>
                {bio}
              </p>
            )}
            {hasJourney && <CareerJourney player={player} currentSeason={currentSeason} />}
          </div>
        )
      })()}

      {/* ═══ ⑧ KARRIÄR-TABELL → Karriär ═══ */}
      {isOwned && showKarriar && (player.seasonHistory ?? []).length > 0 && (
        <div style={SECTION_STYLE}>
          <p className="h-label" style={{ marginBottom: 6 }}>📊 KARRIÄR</p>
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

      {/* ═══ ⑨ LEDARSKAP → öppnas av Översikt-knappen ═══ */}
      {isOwned && showOversikt && openAction === 'ledarskap' && leadershipAvailable && (
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
          <p className="h-label" style={{ marginBottom: 8 }}>👑 LEDARSKAP</p>
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
                { id: 'lower_tempo' as LeadershipAction, icon: <Icon icon={Wind} size={13} />, text: 'Minska belastningen' },
                { id: 'private_talk' as LeadershipAction, icon: <Icon icon={MessageSquare} size={13} />, text: 'Privat samtal' },
                { id: 'public_praise' as LeadershipAction, icon: <Icon icon={Megaphone} size={13} />, text: 'Offentlig beröm' },
              ]).map(opt => {
                const avail = canLeadership(opt.id)
                return (
                  <button
                    key={opt.id}
                    onClick={e => { e.stopPropagation(); onLeadershipAction!(opt.id) }}
                    disabled={!avail}
                    style={{
                      padding: '9px 8px', borderRadius: 8,
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      fontSize: 11, color: 'var(--text-primary)',
                      cursor: avail ? 'pointer' : 'not-allowed',
                      fontFamily: 'var(--font-body)',
                      opacity: avail ? 1 : 0.4,
                      pointerEvents: avail ? undefined : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    }}
                  >
                    {opt.icon}{opt.text}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ ⑩ PRATA → öppnas av Översikt-knappen ═══ */}
      {isOwned && showOversikt && openAction === 'prata' && onTalkToPlayer && (
        <div style={{
          padding: '10px 14px',
          borderTop: '1px solid var(--border)',
        }}>
          <p className="h-label" style={{ marginBottom: 6 }}>🗣 PRATA MED SPELAREN</p>
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
                { id: 'encourage' as const, icon: <Icon icon={Smile} size={13} />, text: 'Uppmuntra' },
                { id: 'demand' as const, icon: <Icon icon={Flame} size={13} />, text: 'Ställ krav' },
                { id: 'future' as const, icon: null, text: 'Framtid' },
              ]).map(opt => (
                <button
                  key={opt.id}
                  onClick={e => { e.stopPropagation(); onTalkToPlayer(opt.id) }}
                  disabled={!canTalk}
                  style={{
                    flex: 1, padding: '10px 8px', borderRadius: 8,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    fontSize: 11, color: 'var(--text-primary)',
                    cursor: canTalk ? 'pointer' : 'not-allowed',
                    fontFamily: 'var(--font-body)',
                    opacity: canTalk ? 1 : 0.4,
                    pointerEvents: canTalk ? undefined : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  }}
                >
                  {opt.icon}{opt.text}
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
