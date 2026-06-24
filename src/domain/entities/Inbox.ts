import type { InboxItemType } from '../enums'

export interface InboxItem {
  id: string
  date: string        // ISO date
  type: InboxItemType
  title: string
  body: string
  relatedClubId?: string
  relatedPlayerId?: string
  relatedFixtureId?: string
  isRead: boolean
  createdMatchday?: number  // For inbox cleanup: gallra read informative items after 2 rounds
  createdRound?: number     // Liga-omgångsnummer för UI-etiketten (≠ matchday vid cup-offset)
  // Sprint 18 — coach tone
  tone?: 'coach'
  fromRole?: string
  coachInitials?: string
  // C-T1 — player refused transfer after club accepted
  bidRejectedByPlayer?: boolean
  // Decision items: expiry round (required on decision-bearing items per B1 spec)
  expiresRound?: number
  // Fynd 3: pressrubrik-varianter per yta (samma händelse, olika formulering).
  // title = inkorgs-varianten; portal/granska läser sina egna.
  mediaVariants?: { portal: string; granska: string }
}
