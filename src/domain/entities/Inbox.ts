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
  // AUDIT DEL 3 (2026-08-11): strukturerat fält istf title-prefix-parse.
  // gameFlowActions.ts läste tidigare youthInbox.title.replace(/^📋 /, '')
  // — prefixet fanns aldrig i title (youthProcessor.ts satte det aldrig),
  // så parsen var en no-op som råkade fungera. En tidsinställd bugg: hade
  // någon lagt tillbaka ett chrome-prefix på title senare hade den börjat
  // tysta fel. Satt bara på InboxItemType.YouthP17-poster.
  youthMatchSummary?: string
  // AUDIT DEL 3 (2026-08-11): strukturerat fält istf ⚠️-räkning i body.
  // ClubScreen.tsx räknade tidigare träningsskador via
  // body.split('⚠️').length — samma mönster som Inbox-nemesis hade (A2).
  // Satt bara på InboxItemType.Training-poster.
  injuredPlayerCount?: number
}
