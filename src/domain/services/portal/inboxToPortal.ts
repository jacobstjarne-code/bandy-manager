import React from 'react'
import type { InboxItem } from '../../entities/Inbox'
import type { SaveGame } from '../../entities/SaveGame'
import { InboxItemType } from '../../enums'
import type { DashboardCard } from './dashboardCardBag'
import type { CardRenderProps } from './dashboardCardBag'
import { isRivalryMatch } from '../../data/rivalries'
import { nextMatchIsDerby } from './triggers/matchTriggers'

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

// Stripe → border-left color (matches mockup CSS variables)
const STRIPE_BORDER: Record<string, string> = {
  gold:   'var(--gold)',
  danger: 'var(--danger)',
  warm:   'var(--warm)',
  cold:   'var(--cold)',
  accent: 'var(--accent)',
}

// Stripe → tinted gradient background (from mockup .story-slot variants)
const STRIPE_GRADIENT: Record<string, string> = {
  gold:   'linear-gradient(180deg, rgba(232,185,92,0.06) 0%, var(--bg-portal-surface) 80%)',
  danger: 'linear-gradient(180deg, rgba(176,80,64,0.08) 0%, var(--bg-portal-surface) 80%)',
  warm:   'linear-gradient(180deg, rgba(140,110,58,0.08) 0%, var(--bg-portal-surface) 80%)',
  cold:   'linear-gradient(180deg, rgba(74,102,128,0.08) 0%, var(--bg-portal-surface) 80%)',
  accent: 'linear-gradient(180deg, rgba(196,122,58,0.06) 0%, var(--bg-portal-surface) 80%)',
}

// Stripe → label text color (lighter variant for readability on dark card)
const STRIPE_LABEL_COLOR: Record<string, string> = {
  gold:   'var(--gold)',
  danger: '#E8A090',
  warm:   'var(--warm-light)',
  cold:   'var(--cold-light)',
  accent: 'var(--accent)',
}

function makeInboxStoryComponent(item: InboxItem, kind: InboxKind, stripe: string) {
  const label = KIND_LABEL[kind]
  const borderColor = STRIPE_BORDER[stripe] ?? 'var(--accent)'
  const gradient = STRIPE_GRADIENT[stripe] ?? STRIPE_GRADIENT.accent
  const labelColor = STRIPE_LABEL_COLOR[stripe] ?? 'var(--accent)'
  return function InboxStoryCard(_props: CardRenderProps) {
    return React.createElement(
      'div',
      {
        style: {
          margin: '0 0 12px 0',
          padding: '12px 14px',
          background: gradient,
          borderRadius: 8,
          borderLeft: `3px solid ${borderColor}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          position: 'relative' as const,
        },
      },
      React.createElement('div', {
        style: {
          fontSize: 8,
          letterSpacing: '2px',
          textTransform: 'uppercase' as const,
          fontWeight: 700,
          marginBottom: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: labelColor,
        },
      }, label),
      React.createElement('div', {
        style: {
          fontFamily: 'var(--font-display)',
          fontSize: 14.5,
          fontWeight: 700,
          lineHeight: 1.3,
          color: 'var(--text-light)',
          marginBottom: 4,
        },
      }, item.title),
      React.createElement('div', {
        style: {
          fontFamily: 'var(--font-display)',
          fontSize: 11.5,
          fontStyle: 'italic' as const,
          color: 'var(--text-light)',
          lineHeight: 1.5,
          opacity: 0.92,
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
    // Fixtur-bundet: surfa bara derby-storykortet om nästa match faktiskt är ett derby.
    // Annars ligger ett gammalt derby-ramnings-item kvar och säger "nästa motståndare" om ett
    // derby som redan spelats — vilket motsade NÄSTA MATCH-kortet (Slottsbron vs Heros).
    if (!nextMatchIsDerby(game)) return null
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

    if (!isFinal && margin < 4 && !isRival) return null

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
