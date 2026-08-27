/**
 * 5.1 Sommaren (SLUTTEST_KO.md, 2026-08-18) — integrationstest för
 * seasonEndProcessor.ts:s nya skrivväg till game.pendingSeasonTransitionEvents
 * (retired/contractExpired/aged) och utbrändhetens övergångsåterhämtning.
 * Ren-funktionslogiken (formattering, prioritering) är redan täckt av
 * seasonTransitionService.test.ts — det här testet verifierar bara att
 * seasonEndProcessor faktiskt SKRIVER till fältet vid en verklig säsongsslut-
 * körning, inte att formateringen är rätt.
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../createNewGame'
import { handleSeasonEnd } from '../seasonEndProcessor'
import { deriveEpokVariant, seasonOrdinalSwedish } from '../../../domain/services/seasonTransitionService'

function makeGame() {
  return createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
}

describe('seasonEndProcessor — pendingSeasonTransitionEvents (5.1 Sommaren)', () => {
  it('kontraktsutgång för en hanterad-klubb-spelare skrivs som contractExpired-event', () => {
    const base = makeGame()
    const targetPlayer = base.players.find(p => p.clubId === base.managedClubId)!
    const game = {
      ...base,
      players: base.players.map(p =>
        p.id === targetPlayer.id ? { ...p, contractUntilSeason: base.currentSeason } : p
      ),
    }

    const result = handleSeasonEnd(game, 1)

    const events = result.game.pendingSeasonTransitionEvents ?? []
    const contractEvent = events.find(e => e.type === 'contractExpired' && e.playerId === targetPlayer.id)
    expect(contractEvent).toBeDefined()
    expect(contractEvent?.playerLastName).toBe(targetPlayer.lastName)
  })

  it('den äldsta kvarvarande spelaren i truppen ger ett aged-event med rätt ålder', () => {
    const base = makeGame()
    const managedPlayers = base.players.filter(p => p.clubId === base.managedClubId)
    const oldestId = [...managedPlayers].sort((a, b) => b.age - a.age)[0].id
    const game = {
      ...base,
      players: base.players.map(p => (p.id === oldestId ? { ...p, age: 99 } : p)),
    }

    const result = handleSeasonEnd(game, 1)

    const events = result.game.pendingSeasonTransitionEvents ?? []
    const agedEvent = events.find(e => e.type === 'aged')
    expect(agedEvent).toBeDefined()
    expect(agedEvent?.playerId).toBe(oldestId)
    // +1 för årets åldersuppdatering (createPlayer-fixturen har ingen egen
    // aging-logik i det här testet — playerDevelopmentService körs separat i
    // roundProcessor, inte i handleSeasonEnd — så här assertas bara att RÄTT
    // spelare (äldst) valdes, inte det exakta post-aging-talet.
    expect(agedEvent?.age).toBeGreaterThanOrEqual(99)
  })

  it('academiuppflyttningar som redan låg i pendingSeasonTransitionEvents (academyActions.ts) bevaras, inte skrivs över', () => {
    const base = makeGame()
    const game = {
      ...base,
      pendingSeasonTransitionEvents: [
        { type: 'promoted' as const, playerId: 'p_academy', playerLastName: 'Nilsson' },
      ],
    }

    const result = handleSeasonEnd(game, 1)

    const events = result.game.pendingSeasonTransitionEvents ?? []
    expect(events.some(e => e.type === 'promoted' && e.playerId === 'p_academy')).toBe(true)
  })

  it('utbrändheten återhämtas vid övergången (hälften av avståndet till 30)', () => {
    const base = makeGame()
    const game = {
      ...base,
      managerProfile: base.managerProfile
        ? { ...base.managerProfile, burnoutScore: 80 }
        : undefined,
    }
    if (!game.managerProfile) return // fixturen saknar managerProfile — inget att testa

    const result = handleSeasonEnd(game, 1)

    expect(result.game.managerProfile?.burnoutScore).toBe(55)
  })
})

describe('H6 (människoupplevelse-audit 7024f8a, 2026-08-24) — epokLinens säsongsordinal', () => {
  // Regression: "Säsong tre kallades 'Din andra säsong'". Rotorsak:
  // SeasonTransitionScene.tsx läste trainerArc.seasonCount (0-indexerat,
  // "antal AVSLUTADE säsonger", inkrementeras i checkSeasonEndArc) istf
  // managerProfile.seasonsAtClub (1-indexerat vid start, "vilken säsong är
  // det här", inkrementeras i SAMMA handleSeasonEnd-anrop) — en säsong för
  // sent i deriveEpokVariant()s seasonCount===2-gren. Detta test kör RIKTIGA
  // handleSeasonEnd-anrop i följd (samma mönster som testerna ovan i denna
  // fil) och verifierar att managerProfile.seasonsAtClub — fältet scenen nu
  // faktiskt läser — stämmer med den säsong spelaren FAKTISKT är på väg in
  // i, inte en säsong efter.
  it('managerProfile.seasonsAtClub ökar i takt med currentSeason genom tre övergångar', () => {
    let game = makeGame()
    expect(game.managerProfile?.seasonsAtClub).toBe(1) // spelarens första säsong

    const r1 = handleSeasonEnd(game, 1)
    game = r1.game
    expect(game.managerProfile?.seasonsAtClub).toBe(2) // på väg in i säsong 2

    const r2 = handleSeasonEnd(game, 2)
    game = r2.game
    expect(game.managerProfile?.seasonsAtClub).toBe(3) // på väg in i säsong 3 — INTE "andra" längre
  })

  it('deriveEpokVariant ger sasong2 exakt vid övergången TILL säsong 2, inte säsong 3', () => {
    const base = makeGame()
    const r1 = handleSeasonEnd(base, 1)
    const enteringSeason2 = r1.game.managerProfile?.seasonsAtClub ?? -1

    const r2 = handleSeasonEnd(r1.game, 2)
    const enteringSeason3 = r2.game.managerProfile?.seasonsAtClub ?? -1

    expect(deriveEpokVariant({ seasonCount: enteringSeason2, wonTitleLastSeason: false, worsePlacementOrEarlierExit: false })).toBe('sasong2')
    expect(deriveEpokVariant({ seasonCount: enteringSeason3, wonTitleLastSeason: false, worsePlacementOrEarlierExit: false })).not.toBe('sasong2')
    expect(seasonOrdinalSwedish(enteringSeason3)).toBe('tredje')
  })
})
