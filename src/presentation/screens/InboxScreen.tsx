import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { InboxItemType } from '../../domain/enums'
import type { InboxItem } from '../../domain/entities/SaveGame'
import { Check } from 'lucide-react'
import { PlayerLink } from '../components/PlayerLink'

function inboxTypeIcon(type: InboxItemType): string {
  switch (type) {
    case InboxItemType.MatchResult: return '🏒'
    case InboxItemType.Injury: return '🩹'
    case InboxItemType.Recovery: return '💪'
    case InboxItemType.Suspension: return '🚫'
    case InboxItemType.TransferOffer: return '💰'
    case InboxItemType.ContractExpiring: return '📋'
    case InboxItemType.YouthIntake: return '🌱'
    case InboxItemType.PlayerDevelopment: return '📈'
    case InboxItemType.BoardFeedback: return '🏛️'
    case InboxItemType.Training: return '🏋️'
    case InboxItemType.Playoff: return '🏆'
    case InboxItemType.Derby: return '🔥'
    case InboxItemType.ScoutReport: return '🔍'
    case InboxItemType.YouthP17: return '📋'
    default: return '📬'
  }
}

function inboxTypeColor(type: InboxItemType): string {
  switch (type) {
    case InboxItemType.Injury: return 'var(--danger)'
    case InboxItemType.Suspension: return 'var(--danger)'
    case InboxItemType.MatchResult: return 'var(--accent)'
    case InboxItemType.Playoff: return 'var(--accent)'
    case InboxItemType.Derby: return 'var(--danger)'
    case InboxItemType.ScoutReport: return 'var(--accent)'
    case InboxItemType.YouthIntake: return 'var(--success)'
    case InboxItemType.Recovery: return 'var(--success)'
    case InboxItemType.PlayerDevelopment: return 'var(--success)'
    case InboxItemType.YouthP17: return 'var(--success)'
    default: return 'var(--text-muted)'
  }
}

type InboxCategory = 'important' | 'news' | 'reports'

function getCategory(item: InboxItem): InboxCategory {
  switch (item.type) {
    case InboxItemType.BoardFeedback:
    case InboxItemType.LicenseReview:
    case InboxItemType.TransferOffer:
    case InboxItemType.TransferBidReceived:
    case InboxItemType.ContractExpiring:
    case InboxItemType.Injury:
    case InboxItemType.Suspension:
      return 'important'
    case InboxItemType.MatchResult:
    case InboxItemType.Playoff:
    case InboxItemType.Derby:
    case InboxItemType.Transfer:
    case InboxItemType.TransferBidResult:
    case InboxItemType.Media:
    case InboxItemType.MediaEvent:
    case InboxItemType.Community:
    case InboxItemType.PatronInfluence:
    case InboxItemType.KommunBidrag:
    case InboxItemType.YouthIntake:
    case InboxItemType.Recovery:
      return 'news'
    default:
      return 'reports'
  }
}

const CATEGORY_META: Record<InboxCategory, { label: string; color: string; dot: string }> = {
  important: { label: 'VIKTIGT', color: 'var(--danger)', dot: '🔴' },
  news: { label: 'NYHETER', color: 'var(--accent)', dot: '🟡' },
  reports: { label: 'RAPPORTER', color: 'var(--text-muted)', dot: '⚪' },
}

function formatDate(iso: string): string {
  const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
  const [, m, d] = iso.split('-')
  return `${parseInt(d)} ${months[parseInt(m) - 1]}`
}

interface InboxItemRowProps {
  item: InboxItem
  onRead: (id: string) => void
  index: number
  playerName?: string
}

function InboxItemRow({ item, onRead, index, playerName }: InboxItemRowProps) {
  const color = inboxTypeColor(item.type)
  const [expanded, setExpanded] = useState(false)
  const hasBody = item.body && item.body.trim().length > 5
  const isCoach = item.tone === 'coach'

  function handleClick() {
    if (hasBody) setExpanded(e => !e)
    if (!item.isRead) setTimeout(() => onRead(item.id), 300)
  }

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '7px 12px',
        borderBottom: '1px solid var(--border)',
        borderLeft: item.isRead ? '3px solid transparent' : '3px solid var(--accent)',
        background: item.isRead ? 'transparent' : 'rgba(196,122,58,0.04)',
        cursor: hasBody ? 'pointer' : (item.isRead ? 'default' : 'pointer'),
        animation: `fadeInUp 200ms ease-out ${Math.min(index, 14) * 30}ms both`,
      }}
    >
      {/* Avatar — initials circle for coach tone, icon circle otherwise */}
      {isCoach ? (
        <div style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'var(--accent-dark)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 1,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>
            {item.coachInitials ?? '?'}
          </span>
        </div>
      ) : (
        <div style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: `${color}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          flexShrink: 0,
          marginTop: 1,
        }}>
          {inboxTypeIcon(item.type)}
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        {isCoach ? (
          /* Coach-tone layout */
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                {item.title} · {item.fromRole ?? 'ASSISTENTTRÄNARE'}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
                {formatDate(item.date)}
              </span>
            </div>
            {expanded && hasBody && (
              <p style={{
                fontSize: 12,
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                color: 'var(--text-secondary)',
                marginTop: 4,
                lineHeight: 1.6,
              }}>
                "{item.body}"
              </p>
            )}
            {!expanded && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontStyle: 'italic', fontFamily: 'var(--font-display)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.body}
              </p>
            )}
          </>
        ) : (
          /* Standard layout */
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
              <p style={{
                fontSize: 13,
                fontWeight: item.isRead ? 400 : 700,
                color: item.isRead ? 'var(--text-secondary)' : 'var(--text-primary)',
                lineHeight: 1.3,
                ...(expanded ? {} : {
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }),
              }}>
                {!item.isRead && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', marginRight: 5, verticalAlign: 'middle' }} />}
                {item.title}
              </p>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
                {formatDate(item.date)}
              </span>
            </div>
            {expanded && hasBody && (
              <p style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                marginTop: 4,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
              }}>
                {item.body}
              </p>
            )}
            {playerName && item.relatedPlayerId && (
              <PlayerLink
                playerId={item.relatedPlayerId}
                name={playerName}
                style={{ fontSize: 11, marginTop: 3, display: 'inline-block' }}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

export function InboxScreen() {
  const game = useGameStore(s => s.game)
  const markInboxRead = useGameStore(s => s.markInboxRead)
  const markAllInboxRead = useGameStore(s => s.markAllInboxRead)
  const [viewMode, setViewMode] = useState<'grouped' | 'chrono'>('grouped')

  if (!game) return null

  function getPlayerName(id?: string): string | undefined {
    if (!id) return undefined
    const p = game!.players.find(pl => pl.id === id)
    return p ? `${p.firstName} ${p.lastName}` : undefined
  }

  const sorted = [...game.inbox].sort((a, b) => b.date.localeCompare(a.date))
  const unreadCount = sorted.filter(i => !i.isRead).length

  // Group by category
  const grouped: Record<InboxCategory, InboxItem[]> = { important: [], news: [], reports: [] }
  for (const item of sorted) {
    grouped[getCategory(item)].push(item)
  }

  const categoryOrder: InboxCategory[] = ['important', 'news', 'reports']

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: unreadCount > 0 ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 600 }}>
            {/* TODO(FAS 1): byt mot piktogram · inkorg · se ICON-BRIEF.md */}
            📬 INKORG{unreadCount > 0 ? ` · ${unreadCount} olästa` : ''}
          </span>
          <button
            onClick={() => setViewMode(v => v === 'grouped' ? 'chrono' : 'grouped')}
            style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}
          >
            {viewMode === 'grouped' ? 'Kronologiskt' : 'Grupperat'}
          </button>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllInboxRead}
            style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Markera alla som lästa
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sorted.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            gap: 12,
            color: 'var(--text-muted)',
          }}>
            <Check size={40} strokeWidth={1.5} />
            <p style={{ fontSize: 15 }}>Lugnt i korridorerna — för tillfället</p>
          </div>
        ) : viewMode === 'chrono' ? (
          <>
            {sorted.map((item, index) => (
              <InboxItemRow key={item.id} item={item} onRead={markInboxRead} index={index} playerName={getPlayerName(item.relatedPlayerId)} />
            ))}
          </>
        ) : (
          <>
            {categoryOrder.map(cat => {
              const items = grouped[cat]
              if (items.length === 0) return null
              const meta = CATEGORY_META[cat]
              const unreadInCat = items.filter(i => !i.isRead).length
              return (
                <div key={cat}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 12px 4px',
                    position: 'sticky', top: 0,
                    background: 'var(--bg)',
                    zIndex: 1,
                  }}>
                    <span style={{ fontSize: 10 }}>{meta.dot}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', color: meta.color, textTransform: 'uppercase' }}>
                      {meta.label}
                    </span>
                    {unreadInCat > 0 && (
                      <span style={{ fontSize: 10, color: meta.color, fontWeight: 600 }}>({unreadInCat})</span>
                    )}
                  </div>
                  {items.map((item, index) => (
                    <InboxItemRow key={item.id} item={item} onRead={markInboxRead} index={index} playerName={getPlayerName(item.relatedPlayerId)} />
                  ))}
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
