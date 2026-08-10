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
  createdRound?: number | null  // Liga-omgångsnummer för UI-etiketten; null = cup/slutspelsomgång → "Cupen"
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
  // AUDIT DEL 2 A2 (2026-08-09): strukturerad kategori istf title-string-
  // matchning. InboxScreen.tsx grupperade tidigare nemesis-poster via
  // `title.startsWith('⚠️ Nemesis:')` — ingen av de faktiska skapandeplatserna
  // satte den emojin i titeln, så grupperingen har troligen aldrig matchat.
  kind?: 'nemesis'
  // Strukturerad källa istf regex-extraktion ur body ("· Utgivare"-mönster
  // som ingen av de riktiga body-generatorerna faktiskt producerar — de
  // använder komma eller tankstreck, se journalistService.ts).
  outlet?: string
}
