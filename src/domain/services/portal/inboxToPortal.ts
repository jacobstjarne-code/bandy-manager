import React from 'react'
import type { InboxItem } from '../../entities/Inbox'
import type { SaveGame } from '../../entities/SaveGame'
import { InboxItemType } from '../../enums'
import type { DashboardCard } from './dashboardCardBag'
import type { CardRenderProps } from '../../../presentation/components/portal/portalTypes'
import { isRivalryMatch } from '../../data/rivalries'

export type InboxKind =
  | 'bigResult'
  | 'scandal'
  | 'playerMilestone'
  | 'derbyRamning'
  | 'nemesis'
  | 'journalistHot'
  | 'mecenat'

export const FREKVENTA = new Set<InboxKind>(['bigResult', 'scandal', 'journalistHot'])
export const SALLSYNTA = new Set<InboxKind>(['playerMilestone', 'nemesis', 'mecenat'])

const KIND_LABEL: Record<InboxKind, string> = {
  bigResult: '🏆 RESULT',
  scandal: '⚠️ SKANDAL',
  playerMilestone: '⭐ MILSTOLPE',
  derbyRamning: '⚔️ DERBY',
  nemesis: '👤 NEMESIS',
  journalistHot: '📰 MEDIA',
  mecenat: '💼 MECENAT',
}

const STRIPE_CSS: Record<string, string> = {
  gold: 'var(--gold)',
  danger: 'var(--danger)',
  warm: 'var(--warm)',
  cold: 'var(--cold)',
  accent: 'var(--accent)',
}

function makeInboxStoryComponent(item: InboxItem, kind: InboxKind, stripe: string) {
  const label = KIND_LABEL[kind]
  const stripeColor = STRIPE_CSS[stripe] ?? 'var(--accent)'
  return function InboxStoryCard(_props: CardRenderProps) {
    return React.createElement(
      'div',
      {
        style: {
          position: 'relative' as const,
          padding: '14px 16px 14px 18px',
          marginBottom: 14,
          background: 'var(--bg-portal-surface)',
          border: '1px solid rgba(196,122,58,0.15)',
          borderRadius: 'var(--radius-md)',
        },
      },
      React.createElement('div', {
        style: {
          position: 'absolute' as const,
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          borderRadius: '8px 0 0 8px',
          background: stripeColor,
        },
      }),
      React.createElement('div', {
        style: {
          fontSize: 9,
          letterSpacing: '2px',
          textTransform: 'uppercase' as const,
          fontWeight: 700,
          marginBottom: 8,
          color: stripeColor,
        },
      }, label),
      React.createElement('div', {
        style: {
          fontFamily: 'var(--font-display)',
          fontSize: 16,
          fontWeight: 700,
          lineHeight: 1.2,
          color: 'var(--text-light)',
          marginBottom: 6,
        },
      }, item.title),
      React.createElement('div', {
        style: {
          fontFamily: 'Georgia, serif',
          fontSize: 13,
          fontStyle: 'italic' as const,
          color: 'var(--text-light)',
          lineHeight: 1.5,
        },
      }, item.body),
    )
  }
}

export function inboxItemToCardCandidate(
  item: InboxItem,
  game: SaveGame,
): (DashboardCard & { kind: InboxKind }) | null {
  let kind: InboxKind
  let tier: 'primary' | 'secondary'
  let weight: number
  let stripe: string

  // BoardFeedback: check title prefix FIRST — all other BoardFeedback returns null
  if (item.type === InboxItemType.BoardFeedback) {
    if (item.title.startsWith('Karriärsmilstolpe:')) {
      kind = 'playerMilestone'
      const isHighSig = !item.body.toLowerCase().includes('hattrick')
      tier = isHighSig ? 'primary' : 'secondary'
      weight = isHighSig ? 85 : 60
      stripe = 'gold'
    } else if (item.title.startsWith('⚠️ Nemesis:') || item.title === 'Nemesis lägger av') {
      kind = 'nemesis'
      tier = 'secondary'
      weight = 75
      stripe = 'warm'
    } else {
      return null  // vanlig styrelse-feedback lyfts ej
    }
  } else if (item.type === InboxItemType.Scandal) {
    kind = 'scandal'
    tier = 'primary'
    weight = 88
    stripe = 'danger'
  } else if (item.type === InboxItemType.Derby) {
    kind = 'derbyRamning'
    tier = 'primary'
    weight = 80
    stripe = 'warm'
  } else if (item.type === InboxItemType.Media || item.type === InboxItemType.MediaEvent) {
    kind = 'journalistHot'
    tier = 'secondary'
    weight = 70
    stripe = 'cold'
  } else if (item.type === InboxItemType.PatronInfluence) {
    kind = 'mecenat'
    tier = 'secondary'
    weight = 65
    stripe = 'warm'
  } else if (item.type === InboxItemType.MatchResult) {
    const fixtureId = item.relatedFixtureId
    if (!fixtureId) return null
    const fixture = game.fixtures.find(f => f.id === fixtureId)
    if (!fixture) return null
    const home = fixture.homeScore ?? 0
    const away = fixture.awayScore ?? 0
    const margin = Math.abs(home - away)
    const opponentId =
      fixture.homeClubId === game.managedClubId ? fixture.awayClubId : fixture.homeClubId
    const isRival = isRivalryMatch(game.managedClubId, opponentId)
    const isFinal =
      !!fixture.isFinaldag || !!(fixture.isCupFinalhelgen && fixture.isCup)

    if (!isFinal && margin < 4 && !isRival) return null  // not story-worthy

    kind = 'bigResult'
    if (isFinal) {
      tier = 'primary'
      weight = 90
      stripe = 'gold'
    } else {
      tier = 'secondary'
      weight = 55
      stripe = 'accent'
    }
  } else {
    return null
  }

  return {
    id: `inbox_story_${item.id}`,
    tier,
    weight,
    triggers: [() => true],
    kind,
    stripe,
    Component: makeInboxStoryComponent(item, kind, stripe),
  }
}
