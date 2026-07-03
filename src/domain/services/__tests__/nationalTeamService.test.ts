/**
 * M16 (2026-07-03) — landslagsuttag ersatt med förtjänstmodell (var alltid
 * 3-5 uttagna oavsett spelarkvalitet). Låser: 0 giltigt utfall, cap 2,
 * bara currentAbility >= LANDSLAGS_CA_TROSKEL kvalar.
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { selectNationalTeam, LANDSLAGS_CA_TROSKEL, CALLUP_CAP } from '../nationalTeamService'

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
