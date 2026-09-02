import type { SaveGame } from '../entities/SaveGame'
import type { Moment, MomentSource } from '../entities/Moment'
import type { EventLedgerEntry } from '../entities/Narrative'

/**
 * MIGRATIONSPLAN_HANDELSELIGGAREN_2026-09-01.md Fas 4, Skärpning 3 (Opus
 * dom, femte verklighetskollen) — recentMoments' skrivväg mot liggaren.
 * "Moment bär subject/significance, mappa rakt" var fel på tre sätt (se
 * dom-texten): unionen saknade Moments källor, significance fanns inte på
 * Moment, och liggarens text-axiom (ingen prosa) höll — Moments body/title
 * lagras aldrig här, bara i konsumentens vy (se momentViewTemplates.ts).
 *
 * `mecenat_left` finns inte i tabellen — släppt som död (Moment.ts).
 */
export const MOMENT_LEDGER_SIGNIFICANCE: Record<MomentSource, number> = {
  era_shift: 85,
  rival_sale: 75,
  star_injury: 70,
  derby_win: 65,
  captain_crisis: 60,
  nemesis_signed: 55,
  season_highlight: 55,
  transfer_story: 50,
  mecenat_costshare: 45,
  sponsor_negative: 45,
  sponsor_positive: 40,
}

/** Alla MomentSource-värden — dubblar Narrative.ts's motsvarande EventLedgerType-medlemmar. */
export const MOMENT_LEDGER_TYPES: MomentSource[] = Object.keys(MOMENT_LEDGER_SIGNIFICANCE) as MomentSource[]

/**
 * En Moment → en liggarpost. `semanticKey` = Moments egna `id` (redan
 * granulärt unikt per instans, samma disciplin som besluts-byggarnas
 * `${event.type}:${choiceId}`). Ingen prosa följer med — `title`/`body`
 * stannar på Moment, liggaren bär bara det strukturerade.
 *
 * `subject2` sätts BARA när Momenten redan bär både subjectPlayerId OCH
 * subjectClubId (transfer_story, rival_sale) — de enda två källorna där två
 * identiteter faktiskt finns. Ingen konstruerad andra-part för källor som
 * bara bär en (derby_win bär t.ex. bara rivalklubben, ingen spelare).
 */
export function buildMomentLedgerEntry(moment: Moment): EventLedgerEntry {
  const hasBoth = !!moment.subjectPlayerId && !!moment.subjectClubId
  const subject: EventLedgerEntry['subject'] = moment.subjectPlayerId
    ? { kind: 'player', id: moment.subjectPlayerId }
    : moment.subjectClubId
    ? { kind: 'club', id: moment.subjectClubId }
    : undefined
  const subject2: EventLedgerEntry['subject2'] = hasBoth
    ? { kind: 'club', id: moment.subjectClubId! }
    : undefined

  return {
    type: moment.source,
    semanticKey: moment.id,
    season: moment.season,
    matchday: moment.matchday,
    subject,
    subject2,
    significance: MOMENT_LEDGER_SIGNIFICANCE[moment.source],
    // Skärpning 4 — kopieras rakt, satta av respektive källa vid dual-write
    // (Moment.ts's fälthuvud). Undefined för alla källor utom sin egen.
    eraLabel: moment.eraLabel,
    transferRole: moment.transferRole,
    matchCategory: moment.matchCategory,
  }
}

/** Fold flera Moments in i en befintlig liggararray i en sväng — samma append-only-disciplin som eventLedgerService.logEvent, bara flera poster åt gången. */
export function appendMomentsToLedger(ledger: EventLedgerEntry[], moments: Moment[]): EventLedgerEntry[] {
  return moments.length === 0 ? ledger : [...ledger, ...moments.map(buildMomentLedgerEntry)]
}

/**
 * Läsvägen (Fas 4): recentMoments-VYN blir en läsning av liggaren i stället
 * för det cappade fältet. `game.recentMoments` skrivs fortfarande (dual-write
 * tills ALLA läsare — collectActiveMemories m.fl. — flyttat, se
 * migreringsplanens retire-last-regel), men ClubMemoryView läser härifrån.
 */
export type MomentLedgerEntry = EventLedgerEntry & { type: MomentSource }

export function getRecentMomentsFromLedger(game: SaveGame, limit = 5): MomentLedgerEntry[] {
  return (game.eventLedger ?? [])
    .filter((e): e is MomentLedgerEntry => MOMENT_LEDGER_TYPES.includes(e.type as MomentSource))
    .sort((a, b) => (b.season - a.season) || (b.matchday - a.matchday))
    .slice(0, limit)
}

/** VEM: slår upp ett namn ur subject/subject2's polymorfa id, för vyns textinterpolation. */
export function resolveSubjectName(game: SaveGame, subject?: EventLedgerEntry['subject']): string | undefined {
  if (!subject) return undefined
  switch (subject.kind) {
    case 'player': {
      const p = game.players.find(p => p.id === subject.id)
      return p ? `${p.firstName} ${p.lastName}` : undefined
    }
    case 'club':
      return game.clubs.find(c => c.id === subject.id)?.name
    case 'mecenat':
      return (game.mecenater ?? []).find(m => m.id === subject.id)?.name
  }
}
