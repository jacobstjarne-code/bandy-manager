/**
 * M16 (2026-07-03) — landslagsuttag ersatt med förtjänstmodell (var alltid
 * 3-5 uttagna oavsett spelarkvalitet). Låser: 0 giltigt utfall, cap 2,
 * bara currentAbility >= LANDSLAGS_CA_TROSKEL kvalar.
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { selectNationalTeam, applyCallupEffects, applyReturnEffects, LANDSLAGS_CA_TROSKEL, CALLUP_CAP } from '../nationalTeamService'

const base = createNewGame({ managerName: 'T', clubId: 'club_forsbacka', season: 2025, seed: 3 })

function withSquadCAs(cas: number[]) {
  const managedIds = base.players.filter(p => p.clubId === base.managedClubId).map(p => p.id)
  return {
    ...base,
    // Alla ospecificerade lagkamrater sätts lågt (20) så bara de listade CA:erna
    // kan nå tröskeln — annars läcker Forsbackas (toppklubb) genererade squad in.
    players: base.players.map(p => {
      const idx = managedIds.indexOf(p.id)
      if (idx === -1) return p
      const ca = idx < cas.length ? cas[idx] : 20
      return { ...p, currentAbility: ca, isInjured: false, suspensionGamesRemaining: 0, form: 50 }
    }),
  }
}

describe('selectNationalTeam — förtjänstmodell (M16)', () => {
  it('returnerar tomt när ingen spelare når tröskeln', () => {
    const game = withSquadCAs([40, 45, 50, 55, 60])
    expect(selectNationalTeam(game)).toEqual([])
  })

  it('returnerar en spelare när exakt en når tröskeln', () => {
    const game = withSquadCAs([LANDSLAGS_CA_TROSKEL, LANDSLAGS_CA_TROSKEL - 1, 40])
    expect(selectNationalTeam(game)).toHaveLength(1)
  })

  it('cap:ar vid 2 även om fler kvalar', () => {
    const game = withSquadCAs([80, 79, 78, 77, 76])
    expect(selectNationalTeam(game)).toHaveLength(CALLUP_CAP)
  })

  it('väljer de högst rankade (CA + formbonus) bland kvalificerade', () => {
    const managedIds = base.players.filter(p => p.clubId === base.managedClubId).map(p => p.id)
    let game = withSquadCAs([80, 79, 78])
    // Ge spelare 3 (index 2, CA 78) formbonus så den rankas över spelare 2 (CA 79, låg form)
    game = {
      ...game,
      players: game.players.map(p => {
        if (p.id === managedIds[1]) return { ...p, form: 50 }
        if (p.id === managedIds[2]) return { ...p, form: 70 }
        return p
      }),
    }
    const picked = selectNationalTeam(game)
    expect(picked).toContain(managedIds[0])
    expect(picked).toContain(managedIds[2])
    expect(picked).not.toContain(managedIds[1])
  })

  it('exkluderar skadade och avstängda spelare oavsett CA', () => {
    const managedIds = base.players.filter(p => p.clubId === base.managedClubId).map(p => p.id)
    let game = withSquadCAs([80, 79])
    game = {
      ...game,
      players: game.players.map(p =>
        p.id === managedIds[0] ? { ...p, isInjured: true } : p
      ),
    }
    expect(selectNationalTeam(game)).not.toContain(managedIds[0])
  })
})

/**
 * Konsolidering 2026-07-18: applyCallupEffects/applyReturnEffects var döda
 * (roundProcessor.ts återimplementerade samma logik inline, med extra
 * inbox-sidoeffekter funktionerna saknade). Låser att den konsoliderade
 * funktionen ger EXAKT den effekt roundProcessor.ts:s inline-version gav
 * (spelarfält + camp-round + inbox-notis), inklusive den drift som fanns
 * mellan dem: camp.startRound ska vara omgången uttagningen SKER i (den
 * caller angivna `round`-parametern), inte ett stale `game.currentMatchday`.
 */
describe('applyCallupEffects/applyReturnEffects — konsoliderad (2026-07-18)', () => {
  it('applyCallupEffects sätter callup-räknare, camp-round (nextMatchday) och en engångs-inboxnotis', () => {
    const managedIds = base.players.filter(p => p.clubId === base.managedClubId).map(p => p.id)
    const playerIds = [managedIds[0]]
    const game = { ...base, currentMatchday: 3, currentSeason: 2025, inbox: [] }

    const result = applyCallupEffects(game, game.players, playerIds, 14)

    const player = result.players.find(p => p.id === playerIds[0])!
    expect(player.nationalTeamCallups).toBe(1)
    expect(player.lastNationalTeamCallup).toBe(2025)
    // Camp-rundan ska vara `round`-parametern (14, omgången callupen sker i),
    // INTE game.currentMatchday (3, föregående/stale omgång) — det var draften.
    expect(result.activeNationalTeamCamp).toEqual({ startRound: 14, endRound: 15, playerIds })
    expect(result.inboxItems).toHaveLength(1)
    expect(result.inboxItems[0].title).toBe('VM-uttagning')
  })

  it('applyCallupEffects dedupar inboxnotisen om samma säsongs-id redan finns', () => {
    const managedIds = base.players.filter(p => p.clubId === base.managedClubId).map(p => p.id)
    const playerIds = [managedIds[0]]
    const game = {
      ...base,
      currentSeason: 2025,
      inbox: [{ id: 'inbox_vm_callup_2025', date: '2025-01-01', type: 0, title: '', body: '', isRead: false }] as any,
    }

    const result = applyCallupEffects(game, game.players, playerIds, 14)
    expect(result.inboxItems).toHaveLength(0)
  })

  it('applyReturnEffects höjer form/morale (capat 100), rensar inget camp-state själv och ger en engångs-inboxnotis', () => {
    const managedIds = base.players.filter(p => p.clubId === base.managedClubId).map(p => p.id)
    const camp = { startRound: 14, endRound: 15, playerIds: [managedIds[0]] }
    const game = {
      ...base,
      currentSeason: 2025,
      inbox: [],
      players: base.players.map(p => p.id === managedIds[0] ? { ...p, form: 98, morale: 97 } : p),
    }

    const result = applyReturnEffects(game, game.players, camp)

    const player = result.players.find(p => p.id === managedIds[0])!
    expect(player.form).toBe(100) // 98+4 → capat
    expect(player.morale).toBe(100) // 97+6 → capat
    expect(result.inboxItems).toHaveLength(1)
    expect(result.inboxItems[0].title).toBe('Landslagsspelarena är tillbaka')
  })

  it('applyReturnEffects returnerar returLine byggd på RETURN_SCENE_LINES.standard med spelarnamn insatt', () => {
    const managedIds = base.players.filter(p => p.clubId === base.managedClubId).map(p => p.id)
    const camp = { startRound: 14, endRound: 15, playerIds: [managedIds[0]] }
    const game = { ...base, currentSeason: 2025, inbox: [] }

    const result = applyReturnEffects(game, game.players, camp)
    const player = game.players.find(p => p.id === managedIds[0])!

    expect(result.returnLine).toContain(player.lastName)
    expect(result.returnLine).not.toContain('{spelare}')
    expect(result.inboxItems[0].body).toBe(result.returnLine)
  })
})
