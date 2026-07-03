// Inkorg — severity-groups + notisdiet.
// Mock: docs/incoming/2026-06-11_design_inkorg_recut.html
// Groups: KRÄVER SVAR (danger) / NYHETER (copper) / RAPPORTER (neutral)
// Unread = 2px copper left border only. No inline dots. No chrono toggle.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { InboxItemType } from '../../domain/enums'
import type { InboxItem, SaveGame } from '../../domain/entities/SaveGame'
import { Check, ArrowLeftRight, Clock, Zap, Activity, Ban, Newspaper, GraduationCap, Dumbbell, Building2, Search, LineChart, AlertTriangle, Banknote, Mail, type LucideIcon } from 'lucide-react'
import { PlayerLink } from '../components/PlayerLink'
import { Dot, dotColor, type DotColor } from '../components/shared/Dot'

// ── Fynd 12 + PC-5: agerbara poster routar till sin handlingsyta ──
// Förfrågningar MED egen yta länkas dit (Övergångar, Trupp, Klubb) i stället för
// att bara kunna kvitteras. Poster utan egen yta får undefined (expanderar/kvitteras
// i inkorgen). KRÄVER SVAR-gruppen lovar handling — den ska gå att nå härifrån.
function inboxActionRoute(type: InboxItemType): string | undefined {
  switch (type) {
    case InboxItemType.TransferBidReceived:
    case InboxItemType.TransferOffer:
    case InboxItemType.TransferBidResult:
    case InboxItemType.Transfer:
    case InboxItemType.TransferRumor:
      return '/game/transfers'
    case InboxItemType.ContractExpiring:
    case InboxItemType.Injury:
    case InboxItemType.Suspension:
      return '/game/squad'
    case InboxItemType.BoardFeedback:
    case InboxItemType.LicenseReview:
    case InboxItemType.EconomicCrisis:
      return '/game/club'
    default:
      return undefined
  }
}

// Etikett för CTA:n ("Gå till Trupp →"), härledd ur destinationen.
function inboxActionLabel(route: string): string {
  if (route === '/game/transfers') return 'Övergångar'
  if (route === '/game/squad') return 'Trupp'
  if (route === '/game/club') return 'Klubb'
  return 'Öppna'
}

// ── Icon per type ────────────────────────────────────────────────

const INBOX_ICON: Partial<Record<InboxItemType, LucideIcon>> = {
  [InboxItemType.TransferBidReceived]:   ArrowLeftRight,
  [InboxItemType.TransferOffer]:         ArrowLeftRight,
  [InboxItemType.Transfer]:              ArrowLeftRight,
  [InboxItemType.TransferRumor]:         Newspaper,
  [InboxItemType.TransferBidResult]:     ArrowLeftRight,
  [InboxItemType.ContractExpiring]:      Clock,
  [InboxItemType.LicenseReview]:         Clock,
  [InboxItemType.BoardFeedback]:         Clock,
  [InboxItemType.Injury]:                Zap,
  [InboxItemType.Recovery]:              Activity,
  [InboxItemType.Suspension]:            Ban,
  [InboxItemType.Media]:                 Newspaper,
  [InboxItemType.MediaEvent]:            Newspaper,
  [InboxItemType.YouthIntake]:           GraduationCap,
  [InboxItemType.YouthP17]:              GraduationCap,
  [InboxItemType.Training]:              Dumbbell,
  [InboxItemType.KommunBidrag]:          Building2,
  [InboxItemType.Community]:             Building2,
  [InboxItemType.ScoutReport]:           Search,
  [InboxItemType.PlayerDevelopment]:     LineChart,
  [InboxItemType.ReputationMilestone]:   LineChart,
  [InboxItemType.Scandal]:               AlertTriangle,
  [InboxItemType.EconomicCrisis]:        Banknote,
}

function InboxTypeIcon({ type }: { type: InboxItemType }) {
  const Icon = INBOX_ICON[type] ?? Mail
  return <Icon size={13} />
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
    case InboxItemType.TransferRumor:
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

function getRoundLabel(item: InboxItem): string | null {
  if (item.createdRound === null) return 'Cupen'
  if (item.createdRound !== undefined) return `Omg ${item.createdRound}`
  if (item.createdMatchday != null) return `Omg ${item.createdMatchday}`
  return null
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
          : <InboxTypeIcon type={item.type} />
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
          <p className="h-micro" style={{
            color: 'var(--text-muted)', marginTop: 1,
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
          color: 'var(--danger-text)',
          fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          svar senast omg {expiresRound}
        </span>
      )}

      {/* Round label (nyheter/rapporter) */}
      {expiresRound == null && getRoundLabel(item) != null && (
        <span className="h-micro" style={{ color: 'var(--text-muted)', flexShrink: 0, alignSelf: 'flex-start', marginTop: 2 }}>
          {getRoundLabel(item)}
        </span>
      )}

      {/* Routar till en handlingsyta → explicit CTA ("Gå till Trupp →"). PC-5/fynd 12.
          Med deadline-pill: bar chevron i stället (pill + ord-CTA trängs på 394px-telefon). */}
      {actionRoute && expiresRound == null ? (
        <span className="h-micro" style={{ color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.3px', flexShrink: 0, whiteSpace: 'nowrap' }}>
          {inboxActionLabel(actionRoute)} ›
        </span>
      ) : actionRoute && expiresRound != null ? (
        <span style={{ color: 'var(--accent)', fontSize: 13, flexShrink: 0 }}>›</span>
      ) : hasBody ? (
        <span style={{ color: 'var(--accent)', fontSize: 13, flexShrink: 0 }}>›</span>
      ) : null}
    </div>
  )
}

// ── M12: Thin news row (Nyheter) ─────────────────────────────────

function InboxThinRow({ item, onRead, index }: { item: InboxItem; onRead: (id: string) => void; index: number }) {
  const navigate = useNavigate()
  const actionRoute = inboxActionRoute(item.type)

  function handleClick() {
    if (!item.isRead) setTimeout(() => onRead(item.id), 200)
    if (actionRoute) navigate(actionRoute)
  }

  const isRead = item.isRead
  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 4px',
        borderBottom: '1px solid var(--border)',
        cursor: actionRoute ? 'pointer' : 'default',
        animation: `fadeInUp 180ms ease-out ${Math.min(index, 14) * 25}ms both`,
      }}
    >
      {/* Icon */}
      <div style={{
        width: 16, textAlign: 'center', fontSize: 10,
        color: 'var(--text-muted)', flexShrink: 0,
      }}>
        <InboxTypeIcon type={item.type} />
      </div>
      {/* Title */}
      <span style={{
        flex: 1, minWidth: 0,
        fontSize: 10.5,
        color: isRead ? 'var(--text-muted)' : 'var(--text-secondary)',
        fontWeight: isRead ? 400 : 600,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {item.title}
      </span>
      {/* Round */}
      {getRoundLabel(item) != null && (
        <span style={{ fontSize: 8, color: 'var(--text-muted)', flexShrink: 0 }}>
          {getRoundLabel(item)}
        </span>
      )}
    </div>
  )
}

// ── M12: Grouped roll-up row ──────────────────────────────────────

function InboxGroupRow({
  count, label, onExpand,
}: { count: number; label: string; onExpand: () => void }) {
  return (
    <div
      onClick={onExpand}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 9px',
        background: 'color-mix(in srgb, var(--accent) 5%, var(--bg-surface))',
        border: '1px dashed var(--border-dark)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 6,
        cursor: 'pointer',
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: 'var(--radius-md)',
        background: 'color-mix(in srgb, var(--accent) 16%, transparent)',
        color: 'var(--accent-dark)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 800, flexShrink: 0,
      }}>
        {count}
      </div>
      <span style={{ flex: 1, fontSize: 10.5, color: 'var(--text-primary)', fontWeight: 600 }}>
        {label}
      </span>
      <span className="h-micro" style={{ color: 'var(--accent-dark)', fontWeight: 700 }}>
        Visa ›
      </span>
    </div>
  )
}

// ── M12: Grouping logic for Nyheter ──────────────────────────────

type NewsRenderItem =
  | { kind: 'single'; item: InboxItem }
  | { kind: 'group'; count: number; label: string; items: InboxItem[] }

function groupNyheter(items: InboxItem[]): NewsRenderItem[] {
  // 1. Nemesis items (title starts with '⚠️ Nemesis:')
  const nemesisItems = items.filter(i => i.title.startsWith('⚠️ Nemesis:'))
  const nonNemesis = items.filter(i => !i.title.startsWith('⚠️ Nemesis:'))

  // 2. Media items grouped by outlet name (extracted from body)
  const mediaTypes = new Set([InboxItemType.Media, InboxItemType.MediaEvent])
  const mediaItems = nonNemesis.filter(i => mediaTypes.has(i.type))
  const nonMedia = nonNemesis.filter(i => !mediaTypes.has(i.type))

  // Group media by outlet (body often contains "Journalist · Outlet")
  const mediaByOutlet = new Map<string, InboxItem[]>()
  for (const item of mediaItems) {
    // Try to extract outlet from body or title
    const outlet = item.body?.match(/·\s*(.+)$/m)?.[1]?.trim() ?? 'Media'
    const list = mediaByOutlet.get(outlet) ?? []
    list.push(item)
    mediaByOutlet.set(outlet, list)
  }

  // 3. Same-title duplicates in remaining items
  const titleGroups = new Map<string, InboxItem[]>()
  for (const item of nonMedia) {
    const list = titleGroups.get(item.title) ?? []
    list.push(item)
    titleGroups.set(item.title, list)
  }

  const result: NewsRenderItem[] = []

  // Nemesis group
  if (nemesisItems.length >= 2) {
    result.push({ kind: 'group', count: nemesisItems.length, label: 'Nemesis-uppdateringar', items: nemesisItems })
  } else {
    for (const item of nemesisItems) result.push({ kind: 'single', item })
  }

  // Media groups
  for (const [outlet, outletItems] of mediaByOutlet) {
    if (outletItems.length >= 2) {
      result.push({ kind: 'group', count: outletItems.length, label: `Mediaröster · ${outlet}`, items: outletItems })
    } else {
      for (const item of outletItems) result.push({ kind: 'single', item })
    }
  }

  // Same-title groups
  for (const [title, titleItems] of titleGroups) {
    if (titleItems.length >= 2) {
      result.push({ kind: 'group', count: titleItems.length, label: `${titleItems.length}× ${title}`, items: titleItems })
    } else {
      for (const item of titleItems) result.push({ kind: 'single', item })
    }
  }

  return result
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
        flexShrink: 0, fontSize: 11, color: 'var(--text-secondary)',
      }}>
        <Dumbbell size={13} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="h-quote-sm">
          {text}
        </p>
        <p className="h-micro" style={{ color: 'var(--text-muted)', marginTop: 1 }}>
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
  // M12: track which grouped roll-ups are expanded (by label key)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

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
        <h2 className="h-name">
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
            <p className="h-quote" style={{ lineHeight: 1.5, textAlign: 'center' }}>
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
                    <span className="h-label" style={{ margin: 0 }}>
                      {meta.label}
                    </span>
                    <span className="h-num-sm" style={{
                      marginLeft: 'auto',
                      color: 'var(--text-secondary)',
                    }}>
                      {items.length + (isRapporter && hasTraining ? 1 : 0)}
                      {unreadInGroup > 0 && <span style={{ color: dotColor(meta.dot), marginLeft: 4 }}>({unreadInGroup})</span>}
                    </span>
                  </div>

                  {/* Card container — Kräver svar + Rapporter: full InboxRow cards */}
                  {/* Nyheter: thin rows + grouped roll-ups */}
                  {group !== 'nyheter' ? (
                    <div style={{
                      background: 'var(--bg-surface)',
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
                  ) : (
                    /* M12: Nyheter — thin rows + grouped roll-ups */
                    <div style={{ marginBottom: 6 }}>
                      {groupNyheter(items).map((renderItem, idx) => {
                        if (renderItem.kind === 'single') {
                          return (
                            <InboxThinRow
                              key={renderItem.item.id}
                              item={renderItem.item}
                              onRead={markInboxRead}
                              index={idx}
                            />
                          )
                        }
                        // Group roll-up
                        const groupKey = renderItem.label
                        const isExpanded = expandedGroups.has(groupKey)
                        return (
                          <div key={groupKey}>
                            <InboxGroupRow
                              count={renderItem.count}
                              label={renderItem.label}
                              onExpand={() => setExpandedGroups(prev => {
                                const next = new Set(prev)
                                if (isExpanded) next.delete(groupKey)
                                else next.add(groupKey)
                                return next
                              })}
                            />
                            {isExpanded && renderItem.items.map((item, i) => (
                              <InboxThinRow
                                key={item.id}
                                item={item}
                                onRead={markInboxRead}
                                index={i}
                              />
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}

            <p className="h-quote-sm" style={{
              color: 'var(--text-muted)',
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
