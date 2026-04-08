import type { SaveGame, InboxItem, TalentSearchResult } from '../../../domain/entities/SaveGame'
import type { Player } from '../../../domain/entities/Player'
import type { ScoutReport, ScoutAssignment } from '../../../domain/entities/Scouting'
import { InboxItemType } from '../../../domain/enums'
import { processScoutAssignment } from '../../../domain/services/scoutingService'
import { executeTalentSearch } from '../../../domain/services/talentScoutService'

export interface ScoutProcessorResult {
  updatedScoutReports: Record<string, ScoutReport>
  updatedScoutAssignment: ScoutAssignment | null
  updatedTalentSearch: SaveGame['activeTalentSearch']
  updatedTalentResults: TalentSearchResult[]
  inboxItems: InboxItem[]
}

/**
 * Processes active scout assignment and talent search for the current round.
 *
 * @param finalPlayers - Players after all stat/development updates
 * @param nextMatchday - The matchday number being processed
 * @param baseSeed - Base seed for deterministic randomness
 * @param localRand - Seeded random function from the outer round
 */
export function processScouts(
  game: SaveGame,
  finalPlayers: Player[],
  nextMatchday: number,
  baseSeed: number,
  localRand: () => number,
): ScoutProcessorResult {
  const inboxItems: InboxItem[] = []

  // ── Active scout assignment ────────────────────────────────────────────────
  let updatedScoutReports: Record<string, ScoutReport> = game.scoutReports ?? {}
  let updatedScoutAssignment: ScoutAssignment | null = game.activeScoutAssignment ?? null

  if (updatedScoutAssignment) {
    updatedScoutAssignment = {
      ...updatedScoutAssignment,
      roundsRemaining: updatedScoutAssignment.roundsRemaining - 1,
    }
    if (updatedScoutAssignment.roundsRemaining <= 0) {
      const target = finalPlayers.find(p => p.id === updatedScoutAssignment!.targetPlayerId)
      if (target) {
        const scoutAccuracy = 70
        const scoutSeed = baseSeed + nextMatchday * 17 + target.id.charCodeAt(0)
        const report: ScoutReport = processScoutAssignment(
          updatedScoutAssignment,
          target,
          scoutAccuracy,
          scoutSeed,
          game.currentSeason,
        )
        updatedScoutReports = { ...updatedScoutReports, [target.id]: report }
        const targetClub = game.clubs.find(c => c.id === updatedScoutAssignment!.targetClubId)
        inboxItems.push({
          id: `inbox_scout_${target.id}_${game.currentSeason}_r${nextMatchday}`,
          date: game.currentDate,
          type: InboxItemType.ScoutReport,
          title: `Scoutrapport: ${target.firstName} ${target.lastName}`,
          body: `${report.notes} Beräknad styrka: ${report.estimatedCA}. Spelar i ${targetClub?.name ?? 'okänd klubb'}.`,
          relatedPlayerId: target.id,
          relatedClubId: updatedScoutAssignment.targetClubId,
          isRead: false,
        })
      }
      updatedScoutAssignment = null
    }
  }

  // ── Active talent search ───────────────────────────────────────────────────
  let updatedTalentSearch = game.activeTalentSearch ?? null
  let updatedTalentResults: TalentSearchResult[] = [...(game.talentSearchResults ?? [])]

  if (updatedTalentSearch) {
    updatedTalentSearch = { ...updatedTalentSearch, roundsRemaining: updatedTalentSearch.roundsRemaining - 1 }
    if (updatedTalentSearch.roundsRemaining <= 0) {
      const result = executeTalentSearch(
        updatedTalentSearch,
        finalPlayers,
        game.clubs,
        game.managedClubId,
        localRand,
        game.currentSeason,
        nextMatchday,
      )
      updatedTalentResults = [...updatedTalentResults, result].slice(-3)
      updatedTalentSearch = null
      inboxItems.push({
        id: `inbox_talent_${result.id}`,
        date: game.currentDate,
        type: InboxItemType.ScoutReport,
        title: 'Spaningsrapport klar',
        body: `Din scout har hittat ${result.players.length} intressanta spelare. Se Transfermarknaden för detaljer.`,
        isRead: false,
      })
    }
  }

  return {
    updatedScoutReports,
    updatedScoutAssignment,
    updatedTalentSearch,
    updatedTalentResults,
    inboxItems,
  }
}
