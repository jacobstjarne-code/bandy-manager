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
  const arena = club.arenaName ?? 'arenan'
  const clubhouse = club.clubhouse ?? 'klubbhuset'
  const squadSize = club.squadPlayerIds.length
  const expiring = expiringContractsCount(club.squadPlayerIds, game.players, game.currentSeason)
  const cash = formatTkr(club.finances)
  const transferBudget = formatTkr(club.transferBudget)

  return [
    {
      id: 'inramning',
      autoAdvance: true,
      durationMs: 4000,
      body: `Det luktar kaffe i ${clubhouse}.

Ordföranden ${chairman.firstName} ${chairman.lastName} slår sig ner. Vid bordsänden har kassören ${treasurer.firstName} ${treasurer.lastName} redan radat upp pärmar. ${member.firstName} ${member.lastName}, mångårig styrelseledamot, står vid fönstret och kollar ut mot ${arena}.

*"Då sätter vi igång. Välkommen."*`,
    },
    {
      id: 'lagesrapport',
      speaker: treasurer,
      body: `${treasurer.firstName} bläddrar i pärmen.

"Truppen är ${squadSize} spelare. ${expiring} har utgående kontrakt vid säsongsslut. Klubbkassan står på ${cash} tkr, transferbudgeten på ${transferBudget}. Mer än så har vi inte att jobba med.

Det är läget."`,
      cta: 'Förstått',
    },
    {
      id: 'forvantningar',
      speaker: chairman,
      body: `${chairman.firstName} läser av papperet. Ser upp.

"Två saker. Plats fem till åtta i tabellen — vi vill inte ner i kvalspel.

Och håll bygden med oss. Tomma läktare är dåligt för bandyn och dåligt för budgeten. Skadelistan får inte sluka oss heller. Mer än fem långtidsskadade och vi börjar låna från fel ställen."`,
      cta: 'Det går bra',
    },
    {
      id: 'avslut',
      speaker: member,
      body: `${member.firstName} vänder sig från fönstret.

"En sak till. För många här är detta säsongens enda samling. Du tränar inte ett lag, du håller en plats öppen. Glöm inte det."

${chairman.firstName} nickar. Mötet är slut.`,
      cta: 'Då börjar vi',
    },
  ]
}

export function shouldTriggerBoardMeeting(game: SaveGame): boolean {
  if (game.currentSeason !== 1) return false
  const matchday = game.currentMatchday ?? 0
  if (matchday > 0) return false
  if ((game.shownScenes ?? []).includes('board_meeting')) return false
  return true
}
