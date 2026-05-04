/**
 * Styrelsemötet — intro-scen vid säsongsstart säsong 1.
 * Ordförande, kassör och ledamot presenterar läget.
 * Siffrorna flätas in dynamiskt från game state.
 *
 * All svensk text lever här. Inget hårdkodas i komponenten.
 */

import type { SaveGame } from '../../entities/SaveGame'
import type { BoardMember } from '../../entities/Club'

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

export function getBoardMeetingBeats(game: SaveGame): BoardMeetingBeat[] {
  const club = game.clubs.find(c => c.id === game.managedClubId)
  if (!club || !club.board) return []

  const { chairman, treasurer, member } = club.board
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
  reportSentences.push(`Kassa ${cash} tkr, transferbudget ${transferBudget}.`)
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
      body: `"Plats fem till åtta. Inget kvalspel.

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
  // Triggar vid spelets allra första render — inga matcher spelade än, ingen scen visad.
  // currentSeason är ett kalenderår (2026, 2027...), inte ett säsongsnummer.
  // Använd shownScenes som primär gate — det räcker för att garantera one-shot.
  if ((game.shownScenes ?? []).includes('board_meeting')) return false
  const anyMatchPlayed = game.fixtures.some(f => f.status === 'completed')
  if (anyMatchPlayed) return false
  return true
}
