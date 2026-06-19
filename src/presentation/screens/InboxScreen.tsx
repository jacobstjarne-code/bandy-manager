// Inkorg — severity-groups + notisdiet.
// Mock: docs/incoming/2026-06-11_design_inkorg_recut.html
// Groups: KRÄVER SVAR (danger) / NYHETER (copper) / RAPPORTER (neutral)
// Unread = 2px copper left border only. No inline dots. No chrono toggle.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { InboxItemType } from '../../domain/enums'
import type { InboxItem, SaveGame } from '../../domain/entities/SaveGame'
import { Check } from 'lucide-react'
import { PlayerLink } from '../components/PlayerLink'
import { Dot, dotColor, type DotColor } from '../components/shared/Dot'

// ── Fynd 12: agerbara poster routar till sin handlingsyta ─────────
// Transfer-notiser hör hemma på Övergångar. Returnerar undefined för
// poster utan egen yta (de expanderar i inkorgen i stället).
function inboxActionRoute(type: InboxItemType): string | undefined {
  switch (type) {
    case InboxItemType.TransferBidReceived:
    case InboxItemType.TransferOffer:
    case InboxItemType.TransferBidResult:
    case InboxItemType.Transfer:
      return '/game/transfers'
    default:
      return undefined
  }
}

// ── Icon per type ────────────────────────────────────────────────

function inboxTypeIcon(type: InboxItemType): string {
  switch (type) {
    case InboxItemType.TransferBidReceived:
    case InboxItemType.TransferOffer:       return '⇄'
    case InboxItemType.ContractExpiring:
    case InboxItemType.LicenseReview:
    case InboxItemType.BoardFeedback:       return '⧖'
    case InboxItemType.Injury:              return '🩹'
    case InboxItemType.Recovery:            return '💪'
    case InboxItemType.Suspension:          return '🚫'
    case InboxItemType.Media:
    case InboxItemType.MediaEvent:          return '📰'
    case InboxItemType.YouthIntake:
    case InboxItemType.YouthP17:            return '🎓'
    case InboxItemType.Training:            return '🏋'
    case InboxItemType.KommunBidrag:
    case InboxItemType.Community:           return '🏛'
    case InboxItemType.ScoutReport:         return '🔍'
    case InboxItemType.Transfer:
    case InboxItemType.TransferBidResult:   return '⇄'
    case InboxItemType.PlayerDevelopment:
    case InboxItemType.ReputationMilestone: return '📈'
    case InboxItemType.Scandal:             return '⚠'
    case InboxItemType.EconomicCrisis:      return '💸'
    default:                                return '📬'
  }
}

// ── Severity grouping ────────────────────────────────────────────

type InboxGroup = 'kräver-svar' | 'nyheter' | 'rapporter'

function getGroup(item: InboxItem, game: SaveGame): InboxGroup {
  switch (item.type) {
    case InboxItemType.BoardFeedback:
    case InboxItemType.LicenseReview:
    case InboxItemType.ContractExpiring:
    case InboxItemType.Injury:
    case InboxItemType.Suspension:
    case InboxItemType.EconomicCrisis:
    case InboxItemType.Scandal:
      return 'kräver-svar'
    case InboxItemType.TransferBidReceived:
    case InboxItemType.TransferOffer: {
      const hasOpenBid = game.transferBids.some(
        b => b.playerId === item.relatedPlayerId &&
             b.direction === 'incoming' &&
             b.status === 'pending',
      )
      return hasOpenBid ? 'kräver-svar' : 'nyheter'
    }
    case InboxItemType.Media:
    case InboxItemType.MediaEvent:
    case InboxItemType.Transfer:
    case InboxItemType.TransferBidResult:
    case InboxItemType.Community:
    case InboxItemType.KommunBidrag:
    case InboxItemType.PatronInfluence:
    case InboxItemType.YouthIntake:
    case InboxItemType.Recovery:
    case InboxItemType.Derby:
    case InboxItemType.Playoff:
    case InboxItemType.ReputationMilestone:
    case InboxItemType.SponsorNetwork:
    case InboxItemType.BandyLetter:
      return 'nyheter'
    default:
      return 'rapporter'
  }
}

const GROUP_META: Record<InboxGroup, { label: string; dot: DotColor }> = {
  'kräver-svar': { label: 'KRÄVER SVAR',  dot: 'danger' },
  'nyheter':     { label: 'NYHETER',       dot: 'accent' },
  'rapporter':   { label: 'RAPPORTER',     dot: 'neutral' },
}

const GROUP_ORDER: InboxGroup[] = ['kräver-svar', 'nyheter', 'rapporter']

// ── Helpers ──────────────────────────────────────────────────────

function formatRound(matchday?: number): string {
  if (!matchday) return ''
  return `Omg ${matchday}`
}

// ── Row ──────────────────────────────────────────────────────────

interface RowProps {
  item: InboxItem
  onRead: (id: string) => void
  index: number
  playerName?: string
  expiresRound?: number
}

function InboxRow({ item, onRead, index, playerName, expiresRound }: RowProps) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const hasBody = Boolean(item.body?.trim())
  const isCoach = item.tone === 'coach'
  const actionRoute = inboxActionRoute(item.type)
  const isActionable = actionRoute != null
  // En post ser klickbar ut bara om den faktiskt gör något: routar, expanderar,
  // eller är oläst (klick = kvittera). Rena lästa rubriker blir inert (fynd 12).
  const isInteractive = isActionable || hasBody || !item.isRead

  function handleClick() {
    if (!item.isRead) setTimeout(() => onRead(item.id), 300)
    if (actionRoute) { navigate(actionRoute); return }
    if (hasBody) setExpanded(e => !e)
  }

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '8px 11px',
        borderBottom: '1px solid var(--border)',
        // Unread: 2px copper left border only — no background tint
        borderLeft: item.isRead ? '2px solid transparent' : '2px solid var(--accent)',
        cursor: isInteractive ? 'pointer' : 'default',
        animation: `fadeInUp 200ms ease-out ${Math.min(index, 14) * 30}ms both`,
        position: 'relative',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 26, height: 26, borderRadius: 'var(--radius-md)',
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: 11, color: 'var(--text-secondary)',
      }}>
        {isCoach
          ? <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--accent)' }}>{item.coachInitials ?? '?'}</span>
          : inboxTypeIcon(item.type)
        }
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 11.5, fontWeight: item.isRead ? 400 : 600,
          color: item.isRead ? 'var(--text-secondary)' : 'var(--text-primary)',
          lineHeight: 1.3,
          ...(expanded ? {} : { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }),
          fontFamily: isCoach ? 'var(--font-display)' : undefined,
          fontStyle: isCoach ? 'italic' : undefined,
        }}>
          {item.title}
        </p>
        {item.body && !expanded && (
          <p style={{
            fontSize: 9.5, color: 'var(--text-muted)', marginTop: 1,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {item.body}
          </p>
        )}
        {expanded && hasBody && (
          <p style={{
            fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5,
            fontFamily: isCoach ? 'var(--font-display)' : undefined,
            fontStyle: isCoach ? 'italic' : undefined,
            whiteSpace: 'pre-wrap',
          }}>
            {item.body}
          </p>
        )}
        {playerName && item.relatedPlayerId && (
          <PlayerLink playerId={item.relatedPlayerId} name={playerName} style={{ fontSize: 11, marginTop: 3, display: 'inline-block' }} />
        )}
      </div>

      {/* Deadline pill (KRÄVER SVAR items with expiry) */}
      {expiresRound != null && (
        <span style={{
          fontSize: 8.5, padding: '2px 7px', borderRadius: 99,
          background: 'color-mix(in srgb, var(--danger) 12%, transparent)',
          color: 'var(--danger)',
          fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          svar senast omg {expiresRound}
        </span>
      )}

      {/* Round label (nyheter/rapporter) */}
      {expiresRound == null && item.createdMatchday != null && (
        <span style={{ fontSize: 9, color: 'var(--text-muted)', flexShrink: 0, alignSelf: 'flex-start', marginTop: 2 }}>
          {formatRound(item.createdMatchday)}
        </span>
      )}

      {/* Chevron — expanderbar eller routar till en handlingsyta (fynd 12) */}
      {(hasBody || isActionable) && (
        <span style={{ color: 'var(--accent)', fontSize: 13, flexShrink: 0 }}>›</span>
      )}
    </div>
  )
}

// ── Aggregated training row ───────────────────────────────────────

function TrainingAggRow({ items }: { items: InboxItem[] }) {
  const rounds = items.map(i => i.createdMatchday ?? 0).filter(Boolean)
  const minR = Math.min(...rounds)
  const maxR = Math.max(...rounds)
  const rangeStr = minR === maxR ? `omg ${minR}` : `omg ${minR}–${maxR}`
  // Detect if any item has an incident (body mentions something non-trivial)
  const hasIncident = items.some(i => i.body && !/inga incidenter/i.test(i.body) && i.body.trim().length > 2)
  const text = hasIncident
    ? `Träning ${rangeStr}: se detaljer nedan.`
    : `Träning ${rangeStr}: inga incidenter.`

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 9,
      padding: '8px 11px',
      borderBottom: '1px solid var(--border)',
      borderLeft: '2px solid transparent',
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: 'var(--radius-md)',
        background: 'var(--bg)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: 11,
      }}>
        🏋
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: 'var(--font-display)', fontStyle: 'italic',
          fontSize: 10.5, color: 'var(--text-secondary)', lineHeight: 1.4,
        }}>
          {text}
        </p>
        <p style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>
          {items.length} veckorapporter, sammanslagna
        </p>
      </div>
    </div>
  )
}

// ── Screen ───────────────────────────────────────────────────────

export function InboxScreen() {
  const game = useGameStore(s => s.game)
  const markInboxRead = useGameStore(s => s.markInboxRead)
  const markAllInboxRead = useGameStore(s => s.markAllInboxRead)

  if (!game) return null

  function getPlayerName(id?: string): string | undefined {
    if (!id) return undefined
    const p = game!.players.find(pl => pl.id === id)
    return p ? `${p.firstName} ${p.lastName}` : undefined
  }

  function getExpiresRound(item: InboxItem): number | undefined {
    if (item.type !== InboxItemType.TransferBidReceived && item.type !== InboxItemType.TransferOffer) return undefined
    const bid = game!.transferBids.find(
      b => b.playerId === item.relatedPlayerId && b.direction === 'incoming' && b.status === 'pending',
    )
    return bid?.expiresRound ?? undefined
  }

  // MatchResult items stay in game.inbox (inboxToPortal uses them) but aren't shown here —
  // Granska is the authoritative match result surface.
  const visible = [...game.inbox]
    .filter(i => i.type !== InboxItemType.MatchResult)
    .sort((a, b) => b.date.localeCompare(a.date))

  const sorted = visible  // alias for downstream refs
  const unreadCount = sorted.filter(i => !i.isRead).length

  // Separate training items for aggregation
  const trainingItems = sorted.filter(i => i.type === InboxItemType.Training)
  const nonTraining = sorted.filter(i => i.type !== InboxItemType.Training)

  // Group non-training by severity
  const grouped: Record<InboxGroup, InboxItem[]> = { 'kräver-svar': [], nyheter: [], rapporter: [] }
  for (const item of nonTraining) {
    grouped[getGroup(item, game)].push(item)
  }
  // Training goes into rapporter (as aggregated)
  // (handled separately in render)

  const hasTraining = trainingItems.length > 0

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>
          Inkorg{unreadCount > 0 ? <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginLeft: 8 }}>{unreadCount} olästa</span> : null}
        </h2>
        {unreadCount > 0 && (
          <button
            onClick={markAllInboxRead}
            style={{ fontSize: 10, color: 'var(--accent-dark)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Markera alla som lästa
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px 24px' }}>
        {sorted.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '60px 20px', gap: 12, color: 'var(--text-muted)',
          }}>
            <Check size={40} strokeWidth={1.5} />
            {/* Playtest-fynd 7: scen-röst (font-display italic), konsekvent med "Resultat bor i Granska". */}
            <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, lineHeight: 1.5, textAlign: 'center', color: 'var(--text-secondary)' }}>
              Lugnt i korridorerna — för tillfället.
            </p>
          </div>
        ) : (
          <>
            {GROUP_ORDER.map(group => {
              const items = grouped[group]
              const isRapporter = group === 'rapporter'
              if (items.length === 0 && !(isRapporter && hasTraining)) return null
              const meta = GROUP_META[group]
              const unreadInGroup = items.filter(i => !i.isRead).length

              return (
                <div key={group}>
                  {/* Section header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    margin: '10px 0 4px',
                    position: 'sticky', top: 0,
                    background: 'var(--bg)', zIndex: 1,
                  }}>
                    <Dot color={meta.dot} />
                    <span style={{
                      fontSize: 8, fontWeight: 600, letterSpacing: '2px',
                      textTransform: 'uppercase', color: 'var(--text-muted)',
                    }}>
                      {meta.label}
                    </span>
                    <span style={{
                      marginLeft: 'auto',
                      fontFamily: 'var(--font-display)', fontSize: 10,
                      color: 'var(--text-secondary)', letterSpacing: 0,
                    }}>
                      {items.length + (isRapporter && hasTraining ? 1 : 0)}
                      {unreadInGroup > 0 && <span style={{ color: dotColor(meta.dot), marginLeft: 4 }}>({unreadInGroup})</span>}
                    </span>
                  </div>

                  {/* Card container */}
                  <div style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 8, overflow: 'hidden', marginBottom: 6,
                  }}>
                    {/* Training aggregation row — at top of RAPPORTER */}
                    {isRapporter && hasTraining && (
                      trainingItems.length >= 2
                        ? <TrainingAggRow items={trainingItems} />
                        : <InboxRow
                            key={trainingItems[0].id}
                            item={trainingItems[0]}
                            onRead={markInboxRead}
                            index={0}
                            playerName={getPlayerName(trainingItems[0].relatedPlayerId)}
                          />
                    )}
                    {items.map((item, index) => (
                      <InboxRow
                        key={item.id}
                        item={item}
                        onRead={markInboxRead}
                        index={index}
                        playerName={getPlayerName(item.relatedPlayerId)}
                        expiresRound={getExpiresRound(item)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}

            <p style={{
              fontFamily: 'var(--font-display)', fontStyle: 'italic',
              fontSize: 10.5, color: 'var(--text-muted)',
              textAlign: 'center', marginTop: 14,
            }}>
              Resultat och matchhändelser bor i Granska — inte här.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
