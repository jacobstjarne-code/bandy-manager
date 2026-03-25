import { useGameStore } from '../store/gameStore'
import { InboxItemType } from '../../domain/enums'
import type { InboxItem } from '../../domain/entities/SaveGame'
import { Bell, Check, CheckCheck } from 'lucide-react'

function inboxTypeIcon(type: InboxItemType): string {
  switch (type) {
    case InboxItemType.MatchResult: return '⚽'
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
    default: return '📬'
  }
}

function inboxTypeColor(type: InboxItemType): string {
  switch (type) {
    case InboxItemType.Injury: return 'var(--danger)'
    case InboxItemType.Suspension: return 'var(--danger)'
    case InboxItemType.MatchResult: return 'var(--accent)'
    case InboxItemType.Playoff: return '#C9A84C'
    case InboxItemType.Derby: return '#ff7040'
    case InboxItemType.ScoutReport: return 'var(--accent)'
    case InboxItemType.YouthIntake: return 'var(--success)'
    case InboxItemType.Recovery: return 'var(--success)'
    case InboxItemType.PlayerDevelopment: return 'var(--success)'
    default: return 'var(--text-muted)'
  }
}

function formatDate(iso: string): string {
  // iso: 'YYYY-MM-DD'
  const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
  const [, m, d] = iso.split('-')
  return `${parseInt(d)} ${months[parseInt(m) - 1]}`
}

interface InboxItemRowProps {
  item: InboxItem
  onRead: (id: string) => void
}

function InboxItemRow({ item, onRead }: InboxItemRowProps) {
  const color = inboxTypeColor(item.type)
  return (
    <div
      onClick={() => !item.isRead && onRead(item.id)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)',
        background: item.isRead ? 'transparent' : 'rgba(59,130,246,0.04)',
        cursor: item.isRead ? 'default' : 'pointer',
      }}
    >
      <div style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: `${color}18`,
        border: `1px solid ${color}40`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 17,
        flexShrink: 0,
        marginTop: 2,
      }}>
        {inboxTypeIcon(item.type)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
          <p style={{
            fontSize: 14,
            fontWeight: item.isRead ? 500 : 700,
            color: item.isRead ? 'var(--text-secondary)' : 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {item.title}
          </p>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
            {formatDate(item.date)}
          </span>
        </div>
        <p style={{
          fontSize: 13,
          color: item.isRead ? 'var(--text-muted)' : 'var(--text-secondary)',
          marginTop: 3,
          lineHeight: 1.4,
        }}>
          {item.body}
        </p>
        {!item.isRead && (
          <div style={{
            display: 'inline-block',
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'var(--accent)',
            marginTop: 5,
          }} />
        )}
      </div>
    </div>
  )
}

export function InboxScreen() {
  const game = useGameStore(s => s.game)
  const markInboxRead = useGameStore(s => s.markInboxRead)
  const markAllInboxRead = useGameStore(s => s.markAllInboxRead)

  if (!game) return null

  // Sort by date descending
  const items = [...game.inbox].sort((a, b) => b.date.localeCompare(a.date))
  const unreadCount = items.filter(i => !i.isRead).length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '16px 16px 12px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bell size={20} color="var(--text-primary)" />
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Inkorg</h2>
          {unreadCount > 0 && (
            <div style={{
              background: 'var(--accent)',
              color: '#fff',
              borderRadius: 99,
              fontSize: 11,
              fontWeight: 700,
              padding: '1px 7px',
            }}>
              {unreadCount}
            </div>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllInboxRead}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: 'none',
              color: 'var(--accent)',
              fontSize: 13,
              fontWeight: 600,
              padding: '4px 8px',
            }}
          >
            <CheckCheck size={15} />
            Markera alla
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {items.length === 0 ? (
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
            <p style={{ fontSize: 15 }}>Inkorgen är tom</p>
          </div>
        ) : (
          items.map(item => (
            <InboxItemRow key={item.id} item={item} onRead={markInboxRead} />
          ))
        )}
      </div>
    </div>
  )
}
