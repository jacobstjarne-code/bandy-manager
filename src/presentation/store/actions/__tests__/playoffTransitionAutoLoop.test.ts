/**
 * Rot-diagnos (Jacobs körorder 2026-09-11, matchdag-26-fyndet): advance()s
 * interna auto-loop (gameFlowActions.ts, "auto-advance through matchdays
 * where managed club has no fixture") saknade `!result.playoffStarted` i
 * sitt stoppvillkor. En hanterad klubb som INTE kvalar till slutspel har
 * per definition aldrig `hasManagedCupMatch` på matchdagarna direkt efter
 * övergången — loopen fortsatte då köra advanceToNextEvent() på andra
 * klubbars slutspelsmatcher och skrev över `result` (och därmed
 * playoffTransition.ts:106s dokumenterade playoffStarted-signal) flera
 * matchdagar framåt, tills nästa HALT_SCREEN (QFSummary) råkade träffas.
 * Spelaren såg aldrig playoff_intro-skärmen — pendingScreen stod kvar
 * null hela vägen, en tyst "fastnad kö" vid säsongsslutet.
 *
 * advanceToNextEvent.test.ts:s "playoffStarted is true and bracket is
 * created"-test täcker INTE detta — det anropar den nakna use-case-
 * funktionen direkt, aldrig store:ts advance()-wrapper där buggen bodde.
 */
import { describe, it, expect, vi } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { autoAssignFormation, FORMATIONS } from '../../../../domain/entities/Formation'
import type { FormationType } from '../../../../domain/entities/Formation'
import {
  FixtureStatus,
  PendingScreen,
  TacticMentality,
  TacticTempo,
  TacticPress,
  TacticPassingRisk,
  TacticWidth,
  TacticAttackingFocus,
  CornerStrategy,
  PenaltyKillStyle,
} from '../../../../domain/enums'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import type { TeamSelection } from '../../../../domain/entities/Fixture'

vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue(undefined),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}))

function createLocalStorageMock() {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (index: number) => Object.keys(store)[index] ?? null,
  }
}
vi.stubGlobal('localStorage', createLocalStorageMock())

const { useGameStore } = await import('../../gameStore')

function withAutoLineup(game: SaveGame): SaveGame {
  const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId && !p.isInjured && p.suspensionGamesRemaining === 0)
  const formation = (game.clubs.find(c => c.id === game.managedClubId)?.activeTactic.formation ?? '3-3-4') as FormationType
  const lineupSlots = autoAssignFormation(FORMATIONS[formation], managedPlayers)
  const startingIds = Object.values(lineupSlots).filter(Boolean) as string[]
  const benchIds = managedPlayers.filter(p => !startingIds.includes(p.id)).map(p => p.id).slice(0, 6)
  const lineup: TeamSelection = {
    startingPlayerIds: startingIds,
    benchPlayerIds: benchIds,
    captainPlayerId: startingIds[0] ?? undefined,
    tactic: {
      mentality: TacticMentality.Balanced,
      tempo: TacticTempo.Normal,
      press: TacticPress.Medium,
      passingRisk: TacticPassingRisk.Safe,
      width: TacticWidth.Normal,
      attackingFocus: TacticAttackingFocus.Central,
      cornerStrategy: CornerStrategy.Safe,
      penaltyKillStyle: PenaltyKillStyle.Passive,
      formation,
      lineupSlots,
    },
  }
  return { ...game, managedClubPendingLineup: lineup }
}

describe('advance() — playoffStarted-signalen ska aldrig svalts av auto-skip-loopen', () => {
  it('efter grundseriens sista omgång: pendingScreen är playoff_intro direkt, oavsett om hanterad klubb kvalar till slutspel', async () => {
    // club_slottsbron/seed=7 slutar konsekvent sist (plats 12) i denna
    // simuleringsbana — måste INTE kvala till slutspel för att buggen
    // (auto-loopen svalde playoffStarted-signalen) ska reproduceras. En
    // klubb som kvalar (t.ex. club_forsbacka, plats 2) har alltid en egen
    // match nästa matchdag, så auto-loopens `managedAtNextMd`-brytning
    // fångar övergången av en annan anledning och maskerar buggen.
    const game = createNewGame({ managerName: 'Test', clubId: 'club_slottsbron', season: 2025, seed: 7 })
    useGameStore.setState({ game })

    let iterations = 0
    while (iterations++ < 80) {
      const current = useGameStore.getState().game!
      const leagueDone = current.fixtures.filter(
        f => !f.isCup && (f.status === FixtureStatus.Completed || f.status === FixtureStatus.Postponed)
      ).length
      if (leagueDone >= 132) break
      if (!current.managedClubPendingLineup) {
        useGameStore.setState({ game: withAutoLineup(current) })
      }
      await useGameStore.getState().advance(true)
    }

    // Grundserien färdigspelad, slutspelet ännu inte startat.
    const beforeTransition = useGameStore.getState().game!
    expect(beforeTransition.playoffBracket).toBeFalsy()
    const managedPosition = beforeTransition.standings.find(s => s.clubId === beforeTransition.managedClubId)?.position
    expect(managedPosition).toBeGreaterThan(8) // kvalar INTE till slutspel — det är precis den gren buggen satt i

    // EN sista advance() ska trigga playoffTransition.ts:s handlePlayoffStart
    // OCH lämna dess pendingScreen intakt hela vägen ut ur store:t — inte
    // svalt av auto-loopen bara för att hanterad klubb saknar egen match på
    // den absolut NÄSTA matchdagen (spectator-läge om den inte kvalade).
    if (!beforeTransition.managedClubPendingLineup) {
      useGameStore.setState({ game: withAutoLineup(beforeTransition) })
    }
    const result = await useGameStore.getState().advance(true)

    expect(result?.playoffStarted).toBe(true)
    expect(result?.game.playoffBracket).toBeDefined()
    expect(result?.game.pendingScreen).toBe(PendingScreen.PlayoffIntro)
    expect(useGameStore.getState().game!.pendingScreen).toBe(PendingScreen.PlayoffIntro)
  }, 60000)
})
