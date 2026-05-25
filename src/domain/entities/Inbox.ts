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
  // Sprint 18 — coach tone
  tone?: 'coach'
  fromRole?: string
  coachInitials?: string
  // C-T1 — player refused transfer after club accepted
  bidRejectedByPlayer?: boolean
}
