/**
 * Styrelsemötet — intro-scen vid säsongsstart från och med säsong 2 (säsong 1 = ArrivalScene).
 * Ordförande, kassör och ledamot presenterar läget.
 * Siffrorna flätas in dynamiskt från game state.
 *
 * All svensk text lever här. Inget hårdkodas i komponenten.
 */

import type { SaveGame } from '../../entities/SaveGame'
import type { BoardMember } from '../../entities/Club'
import { ClubExpectation } from '../../enums'

export interface BoardMeetingBeat {
  id: string
  autoAdvance?: boolean
  durationMs?: number
  speaker?: BoardMember
  body: string
  cta?: string
}

function expiringContractsCount(squadPlayerIds: string[], players: SaveGame['players'], currentSeason: number): number {
  return players.filter(
    p => squadPlayerIds.includes(p.id) && p.contractUntilSeason === currentSeason
  ).length
}

function formatTkr(amount: number): string {
  return Math.round(amount / 1000).toString()
}

// M63 (textaudit 2026-07-04, text klar 2026-07-05): ordförandens
// förväntansreplik var hårdkodad ("Plats fem till åtta. Inget kvalspel.")
// oavsett styrelsens faktiska boardExpectation — en WinLeague- eller
// AvoidBottom-styrelse fick samma mittenambitiösa replik. Nivån gated
// nu mot fyra ceremoniella varianter (Fable, samma register som
// forvantningar-beatet, inte den korta frasen i
// BOARD_EXPECTATION_TEXT/boardService.ts).
const BOARD_MEETING_EXPECTATION_LINE: Record<ClubExpectation, string> = {
  [ClubExpectation.AvoidBottom]: 'Håll oss ovanför strecket. Mer begär vi inte i år. Allt därutöver är bonus.',
  [ClubExpectation.MidTable]: 'Plats fem till åtta. Inget kvalspel.',
  [ClubExpectation.ChallengeTop]: 'Topp fyra. Och när slutspelet börjar ska ingen vilja möta oss.',
  [ClubExpectation.WinLeague]: 'Guld. Det är sagt nu. Vi låtsas inte annat i år.',
}

export function getBoardMeetingBeats(game: SaveGame): BoardMeetingBeat[] {
  const club = game.clubs.find(c => c.id === game.managedClubId)
  if (!club) return []

  // KF4 (2026-06-21): styrelsen läses från game.board (EN modell) via roll, inte club.board.
  // Body-texten läser nu samma källa som resolvern → ordförandenamnet är konsekvent.
  const chairman = game.board?.find(m => m.role === 'ordförande')
  const treasurer = game.board?.find(m => m.role === 'kassör')
  const member = game.board?.find(m => m.role === 'ledamot')
  if (!chairman || !treasurer || !member) return []

  const clubhouse = club.clubhouse ?? 'klubbhuset'
  const squadSize = club.squadPlayerIds.length
  const expiring = expiringContractsCount(club.squadPlayerIds, game.players, game.currentSeason)
  const cash = formatTkr(club.finances)
  const transferBudget = formatTkr(club.transferBudget)

  // Lägesrapport — bygg dynamiskt. Utelämna 0-värden helt.
  const reportSentences: string[] = [`Truppen är ${squadSize}.`]
  if (expiring > 0) {
    reportSentences.push(`${expiring} kontrakt går ut i vår.`)
  }
  reportSentences.push(`Kassa ${cash} tkr, transferbudget ${transferBudget} tkr.`)
  const reportText = reportSentences.join(' ')

  return [
    {
      id: 'inramning',
      autoAdvance: true,
      durationMs: 4000,
      body: `Kaffe i ${clubhouse}. ${chairman.firstName} ${chairman.lastName} hälsar.

*"Då kör vi. Välkommen."*`,
    },
    {
      id: 'lagesrapport',
      speaker: treasurer,
      body: `"${reportText}

Mer har vi inte."`,
      cta: 'Förstått',
    },
    {
      id: 'forvantningar',
      speaker: chairman,
      body: `"${BOARD_MEETING_EXPECTATION_LINE[club.boardExpectation] ?? '[Opus]'}

Och håll bygden med oss. Tomma läktare är dåligt för bandyn och dåligt för budgeten."`,
      cta: 'Det går bra',
    },
    {
      id: 'avslut',
      speaker: member,
      body: `"För många här är det här säsongens enda samling. Glöm inte det."`,
      cta: 'Då börjar vi',
    },
  ]
}

export function shouldTriggerBoardMeeting(game: SaveGame): boolean {
  // Triggar vid säsongsstart från och med andra säsongen. Första säsongen
  // hanteras av ArrivalScene. currentSeason är ett kalenderår (2026, 2027, …),
  // inte ett ordningstal — "första säsongen" = inga avslutade säsonger än.
  if ((game.seasonSummaries?.length ?? 0) === 0) return false
  if ((game.shownScenes ?? []).includes('board_meeting')) return false
  // Guard: scenen är redan aktiv — undviker re-trigger om onComplete aldrig kallades
  if (game.pendingScene?.sceneId === 'board_meeting') return false
  if (game.currentMatchday !== 0) return false
  const anyMatchPlayed = game.fixtures.some(f => f.status === 'completed')
  if (anyMatchPlayed) return false
  return true
}
