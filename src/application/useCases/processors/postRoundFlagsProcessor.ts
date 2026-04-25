import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { Fixture } from '../../../domain/entities/Fixture'
import { PendingScreen, InboxItemType } from '../../../domain/enums'
import { evaluateFinanceStatus } from '../../../domain/services/economyService'
import { getRecommendedFormation } from '../../../domain/entities/Formation'

export interface PostRoundFlagsInput {
  game: SaveGame
  justCompletedManagedFixture: Fixture | undefined
  nextMatchday: number
}

export interface PostRoundFlagsResult {
  updatedGame: SaveGame
}

export function applyPostRoundFlags(
  input: PostRoundFlagsInput,
): PostRoundFlagsResult {
  const { justCompletedManagedFixture, nextMatchday } = input
  let updatedGame = input.game

  // Halvtidssummering — trigger efter liga-omgång 11
  if (
    justCompletedManagedFixture &&
    !justCompletedManagedFixture.isCup &&
    justCompletedManagedFixture.roundNumber === 11 &&
    updatedGame.pendingScreen !== PendingScreen.HalfTimeSummary
  ) {
    updatedGame = { ...updatedGame, pendingScreen: PendingScreen.HalfTimeSummary }
  }

  // Onboarding step progression (advances after first 3 managed matches)
  const currentOnboarding = updatedGame.onboardingStep ?? 0
  if (currentOnboarding < 4 && justCompletedManagedFixture) {
    updatedGame = { ...updatedGame, onboardingStep: currentOnboarding + 1 }
  }

  // Per-round bankruptcy check (BUG-STRESS-05)
  {
    const managedClubCurrent = updatedGame.clubs.find(c => c.id === updatedGame.managedClubId)
    if (managedClubCurrent) {
      const finStatus = evaluateFinanceStatus(managedClubCurrent.finances)
      const warnedThisSeason = updatedGame.financeWarningGivenThisSeason ?? false
      if (finStatus.status === 'game-over') {
        updatedGame = { ...updatedGame, managerFired: true }
      } else if ((finStatus.status === 'license-denial' || finStatus.status === 'warning') && !warnedThisSeason) {
        const isCritical = finStatus.status === 'license-denial'
        updatedGame = {
          ...updatedGame,
          financeWarningGivenThisSeason: true,
          inbox: [...updatedGame.inbox, {
            id: `inbox_finance_${finStatus.status}_${updatedGame.currentSeason}_${nextMatchday}`,
            date: updatedGame.currentDate,
            type: InboxItemType.EconomicCrisis,
            title: isCritical ? '🚨 KRITISK: Licensen i fara' : '⚠️ Ekonomisk varning',
            body: isCritical
              ? `Kassan är ${managedClubCurrent.finances.toLocaleString('sv-SE')} kr. Klubben riskerar att förlora licensen. Nödåtgärder krävs omedelbart.`
              : `Kassan är ${managedClubCurrent.finances.toLocaleString('sv-SE')} kr. Klubben närmar sig farlig nivå. Kontrollera utgifterna.`,
            isRead: false,
          }],
        }
      }
    }
  }

  // Recommendation change inbox (Sprint 23)
  {
    const managedSquad = updatedGame.players.filter(p => p.clubId === updatedGame.managedClubId)
    const newRec = getRecommendedFormation(managedSquad)
    const prevRec = updatedGame.previousRecommendedFormation
    if (prevRec && prevRec !== newRec) {
      updatedGame = {
        ...updatedGame,
        previousRecommendedFormation: newRec,
        inbox: [...updatedGame.inbox, {
          id: `inbox_rec_formation_${updatedGame.currentSeason}_${nextMatchday}`,
          date: updatedGame.currentDate,
          type: InboxItemType.Training,
          title: '📋 Coachen byter rekommendation',
          body: `Truppen har förändrats. Coachen rekommenderar nu ${newRec} istället för ${prevRec}.`,
          isRead: false,
        }],
      }
    } else if (!prevRec) {
      updatedGame = { ...updatedGame, previousRecommendedFormation: newRec }
    }
  }

  return { updatedGame }
}
