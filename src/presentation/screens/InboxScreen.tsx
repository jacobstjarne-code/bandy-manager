import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { InboxItemType } from '../../domain/enums'
import type { InboxItem } from '../../domain/entities/SaveGame'
import { Check } from 'lucide-react'
import { PlayerLink } from '../components/PlayerLink'
import { SectionLabel } from '../components/SectionLabel'

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

function formatDate(iso: string): string {
  // iso: 'YYYY-MM-DD'
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
  const hasBody = item.body && item.body.trim().length > 0

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
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        borderLeft: item.isRead ? '3px solid transparent' : '3px solid rgba(196,122,58,0.2)',
        background: item.isRead ? 'transparent' : 'rgba(196,122,58,0.04)',
        cursor: hasBody ? 'pointer' : (item.isRead ? 'default' : 'pointer'),
        animation: `fadeInUp 200ms ease-out ${Math.min(index, 14) * 30}ms both`,
      }}
    >
      <div style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: `${color}18`,
        border: `1px solid ${color}40`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        flexShrink: 0,
        marginTop: 1,
      }}>
        {inboxTypeIcon(item.type)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
          <p style={{
            fontSize: 14,
            fontWeight: item.isRead ? 500 : 700,
            color: item.isRead ? 'var(--text-secondary)' : 'var(--text-primary)',
            ...(expanded ? {} : {
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }),
          }}>
            {item.title}
          </p>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
            {formatDate(item.date)}
          </span>
        </div>
        {expanded && hasBody && (
          <p style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            marginTop: 6,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
          }}>
            {item.body}
          </p>
        )}
        {!expanded && hasBody && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Tryck för att läsa mer
          </p>
        )}
        {playerName && item.relatedPlayerId && (
          <div style={{ marginTop: 6 }}>
            <PlayerLink
              playerId={item.relatedPlayerId}
              name={playerName}
              style={{ fontSize: 12 }}
            />
          </div>
        )}
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

  function getPlayerName(id?: string): string | undefined {
    if (!id) return undefined
    const p = game!.players.find(pl => pl.id === id)
    return p ? `${p.firstName} ${p.lastName}` : undefined
  }

  // Sort by date descending, split by read status
  const sorted = [...game.inbox].sort((a, b) => b.date.localeCompare(a.date))
  const unread = sorted.filter(i => !i.isRead)
  const read = sorted.filter(i => i.isRead)
  const unreadCount = unread.length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Compact toolbar */}
      {unreadCount > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
            {unreadCount} olästa
          </span>
          <button
            onClick={markAllInboxRead}
            style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Markera alla som lästa
          </button>
        </div>
      )}

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
            <p style={{ fontSize: 15 }}>Inkorgen är tom</p>
          </div>
        ) : (
          <>
            {unread.length > 0 && (
              <>
                <div style={{ padding: '10px 16px 0' }}>
                  <SectionLabel>Olästa</SectionLabel>
                </div>
                {unread.map((item, index) => (
                  <InboxItemRow key={item.id} item={item} onRead={markInboxRead} index={index} playerName={getPlayerName(item.relatedPlayerId)} />
                ))}
              </>
            )}
            {read.length > 0 && (
              <>
                <div style={{ padding: '10px 16px 0' }}>
                  <SectionLabel>Lästa</SectionLabel>
                </div>
                {read.map((item, index) => (
                  <InboxItemRow key={item.id} item={item} onRead={markInboxRead} index={index} playerName={getPlayerName(item.relatedPlayerId)} />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
