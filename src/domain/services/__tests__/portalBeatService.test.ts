import { describe, it, expect } from 'vitest'
import { getActiveBeat, getBeatKey } from '../portalBeatService'
import { PORTAL_BEATS, PIVOTAL_BEAT_IDS, PIVOTAL_BEAT_COOLDOWN_SEASONS } from '../../data/portalBeats'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../worldGenerator'
import { getRivalry } from '../../data/rivalries'
import type { SaveGame } from '../../entities/SaveGame'

/**
 * U5 forts (SLUTTEST_KO.md, 2026-08-19/20) — isOnCooldown mot pivotal beats.
 * "Pivotal" saknar formell klassificering i kodbasen (väntar på O11/
 * contentContract.ts) — interimslistan (PIVOTAL_BEAT_IDS, portalBeats.ts)
 * är sju namngivna beats som läser som stora/sällsynta ögonblick. Detta
 * testet låser BETEENDET (multi-säsongsspärr utöver shownBeats-dedupen),
 * inte listans exakta medlemskap — den kan ändras utan att testet failar
 * strukturellt (facility_completed används som representant).
 */
function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  const template = CLUB_TEMPLATES[0]
  const game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
  return { ...game, ...overrides }
}

describe('getActiveBeat — pivotal cooldown (U5 forts)', () => {
  it('en pivotal beat på cooldown (loggad förra säsongen) hoppas över även om trigger() är sant', () => {
    // board_failure triggar på boardObjectives.some(status==='failed') — lätt
    // att framkalla deterministiskt.
    const base = makeGame({ currentSeason: 5 })
    const failedObjective = { ...base.boardObjectives![0], status: 'failed' as const }
    const gameWithFailure = {
      ...base,
      boardObjectives: [failedObjective, ...base.boardObjectives!.slice(1)],
      boardPatience: 70,
    }
    // Utan logg: board_failure ska triggas (om inget annat beat med lägre index gör det först).
    const activeWithoutLog = getActiveBeat(gameWithFailure)
    expect(activeWithoutLog?.id).toBe('board_failure')

    // Med en loggad post på board_failure FÖRRA säsongen (inom cooldown-fönstret): hoppas över.
    const onCooldown = {
      ...gameWithFailure,
      narrativeBeatLog: [{ semanticKey: 'board_failure', season: 4, round: 20 }],
    }
    const activeOnCooldown = getActiveBeat(onCooldown)
    expect(activeOnCooldown?.id).not.toBe('board_failure')
  })

  it('en pivotal beat vars cooldown har runnit ut (minSeasonsApart passerad) triggas igen', () => {
    const base = makeGame({ currentSeason: 5 })
    const failedObjective = { ...base.boardObjectives![0], status: 'failed' as const }
    const gameWithFailure = {
      ...base,
      boardObjectives: [failedObjective, ...base.boardObjectives!.slice(1)],
      boardPatience: 70,
      narrativeBeatLog: [{ semanticKey: 'board_failure', season: 5 - PIVOTAL_BEAT_COOLDOWN_SEASONS, round: 20 }],
    }
    const active = getActiveBeat(gameWithFailure)
    expect(active?.id).toBe('board_failure')
  })

  it('icke-pivotal beats påverkas inte av isOnCooldown (bara shownBeats-dedupen gäller)', () => {
    // callback_streak är INTE pivotal (inte i listan) — en logg-post ska inte hindra den.
    expect(PIVOTAL_BEAT_IDS).not.toContain('callback_streak')
  })
})

describe('callback_streak — canonical H2H-svit inför exakt nästa match', () => {
  const beat = PORTAL_BEATS.find(candidate => candidate.id === 'callback_streak')!

  it('visar signerad tvåmatcherssvit mot nästa motståndare och deduplicerar per motståndare+säsong', () => {
    const base = makeGame({ currentSeason: 5 })
    const opponent = base.clubs.find(club => club.id !== base.managedClubId)!
    const fixture = {
      ...base.fixtures[0],
      id: 'next_streak_fixture',
      status: 'scheduled' as const,
      homeClubId: base.managedClubId,
      awayClubId: opponent.id,
      season: 5,
      matchday: 12,
    }
    const winning = {
      ...base,
      fixtures: [fixture],
      rivalryHistory: { [opponent.id]: { wins: 2, losses: 0, draws: 0, currentStreak: 2 } },
    }
    const losing = {
      ...winning,
      rivalryHistory: { [opponent.id]: { wins: 0, losses: 2, draws: 0, currentStreak: -2 } },
    }

    expect(beat.trigger(winning)).toBe(true)
    expect(typeof beat.text === 'function' ? beat.text(winning) : beat.text)
      .toBe(`${opponent.name} har inte tagit dig på 2 möten.`)
    expect(beat.severity?.(winning)).toBe(0)
    expect(typeof beat.text === 'function' ? beat.text(losing) : beat.text)
      .toBe(`2 raka mot ${opponent.name} nu. Någon gång ska det vändas.`)
    expect(beat.severity?.(losing)).toBe(1)
    expect(getBeatKey(beat, winning.currentSeason, winning))
      .toBe(`callback_streak_${opponent.id}_s5`)
    expect(beat.trigger({ ...winning, shownBeats: [`callback_streak_${opponent.id}_s5`] })).toBe(true)
    expect(getActiveBeat({ ...winning, shownBeats: [`callback_streak_${opponent.id}_s5`] })?.id)
      .not.toBe('callback_streak')
  })
})

describe('callback_derby_memory — senaste verkliga ligaderbyt', () => {
  const beat = PORTAL_BEATS.find(candidate => candidate.id === 'callback_derby_memory')!

  it('väljer senaste derby på säsong+global matchday och kräver numeriskt slutresultat', () => {
    const base = makeGame({ currentSeason: 5 })
    const opponent = base.clubs.find(club => club.id === 'club_gagnef')!
    const next = {
      ...base.fixtures[0], id: 'next_derby', status: 'scheduled' as const,
      homeClubId: base.managedClubId, awayClubId: opponent.id, season: 5, matchday: 14,
    }
    const old = {
      ...next, id: 'old_derby', status: 'completed' as const,
      season: 4, matchday: 30, homeScore: 5, awayScore: 1,
    }
    const latest = {
      ...next, id: 'latest_derby', status: 'completed' as const,
      season: 5, matchday: 3, homeScore: 2, awayScore: 3,
    }
    const game = { ...base, fixtures: [old, latest, next] }

    expect(beat.trigger(game)).toBe(true)
    expect(typeof beat.text === 'function' ? beat.text(game) : beat.text)
      .toBe(`Förra derbyt mot ${opponent.name}: 2–3.`)
    expect(getBeatKey(beat, game.currentSeason, game))
      .toBe(`callback_derby_${opponent.id}_s5`)
    expect(beat.trigger({
      ...game,
      fixtures: [{ ...latest, homeScore: null, awayScore: null }, next],
    })).toBe(false)
  })
})

describe('callback_snub — exakt spelare och aktuell säsong', () => {
  const beat = PORTAL_BEATS.find(candidate => candidate.id === 'callback_snub')!

  it('kräver att den snubbade spelaren fortfarande är frisk i managed club och påstår ingen kvällsprestation', () => {
    const base = makeGame({ currentSeason: 5 })
    const player = base.players.find(candidate => candidate.clubId === base.managedClubId)!
    const game = {
      ...base,
      lastNationalSnub: { playerId: player.id, season: 5, round: 14 },
    }

    expect(beat.trigger(game)).toBe(true)
    expect(typeof beat.text === 'function' ? beat.text(game) : beat.text)
      .toBe(`${player.firstName} ${player.lastName} förbigicks i landslaget.`)
    expect(getBeatKey(beat, game.currentSeason, game))
      .toBe(`callback_snub_${player.id}_s5`)
    expect(beat.trigger({ ...game, currentSeason: 6 })).toBe(false)
    expect(beat.trigger({
      ...game,
      players: game.players.map(candidate => candidate.id === player.id
        ? { ...candidate, isInjured: true }
        : candidate),
    })).toBe(false)
    expect(beat.trigger({
      ...game,
      players: game.players.map(candidate => candidate.id === player.id
        ? { ...candidate, clubId: 'free_agent' }
        : candidate),
    })).toBe(false)
  })
})

describe('callback_sale — första verkliga mötet efter exakt försäljning', () => {
  const beat = PORTAL_BEATS.find(candidate => candidate.id === 'callback_sale')!

  it('bär en stabil säsong+matchday-axel över rollover och blockerar om mötet redan skett', () => {
    const base = makeGame({ currentSeason: 5 })
    const buyer = base.clubs.find(club => club.id !== base.managedClubId)!
    const next = {
      ...base.fixtures[0], id: 'next_buyer_meeting', status: 'scheduled' as const,
      homeClubId: base.managedClubId, awayClubId: buyer.id, season: 5, matchday: 3,
    }
    const beforeSale = {
      ...next, id: 'buyer_before_sale', status: 'completed' as const,
      season: 4, matchday: 18,
    }
    const game = {
      ...base,
      currentMatchday: 0,
      fixtures: [beforeSale, next],
      lastRivalSaleMatchday: -2,
      lastRivalSaleInfo: {
        soldPlayerName: 'Lindqvist',
        buyerClubName: buyer.name,
        buyerClubId: buyer.id,
        saleSeason: 4,
        saleMatchday: 20,
      },
    }

    expect(beat.trigger(game)).toBe(true)
    expect(typeof beat.text === 'function' ? beat.text(game) : beat.text)
      .toBe(`Första mötet med ${buyer.name} sedan Lindqvist gick dit.`)
    expect(getBeatKey(beat, game.currentSeason, game))
      .toBe(`callback_sale_${buyer.id}_s4_m20`)
    expect(getBeatKey(beat, 6, { ...game, currentSeason: 6 }))
      .toBe(`callback_sale_${buyer.id}_s4_m20`)

    const alreadyMet = {
      ...next, id: 'buyer_after_sale', status: 'completed' as const,
      season: 4, matchday: 22,
    }
    expect(beat.trigger({ ...game, fixtures: [beforeSale, alreadyMet, next] })).toBe(false)
  })

  it('vägrar första-mötet-påståendet för äldre saves utan säker försäljningsaxel', () => {
    const base = makeGame({ currentSeason: 5 })
    const buyer = base.clubs.find(club => club.id !== base.managedClubId)!
    const next = {
      ...base.fixtures[0], id: 'legacy_next_buyer', status: 'scheduled' as const,
      homeClubId: base.managedClubId, awayClubId: buyer.id, season: 5, matchday: 3,
    }
    const legacy = {
      ...base,
      fixtures: [next],
      lastRivalSaleInfo: {
        soldPlayerName: 'Lindqvist', buyerClubName: buyer.name, buyerClubId: buyer.id,
      },
    }

    expect(beat.trigger(legacy)).toBe(false)
  })
})

describe('callback_manager_return — första matchen tillbaka', () => {
  const beat = PORTAL_BEATS.find(candidate => candidate.id === 'callback_manager_return')!

  it('visas före första mötet med en tidigare klubb och får en klubbperiodsunik nyckel', () => {
    const base = makeGame({ currentSeason: 5 })
    const formerClub = base.clubs.find(club => club.id !== base.managedClubId)!
    const next = {
      ...base.fixtures[0], id: 'first_return', status: 'scheduled' as const,
      homeClubId: base.managedClubId, awayClubId: formerClub.id, season: 5, matchday: 3,
    }
    const game = {
      ...base,
      fixtures: [next],
      managerProfile: {
        ...base.managerProfile!,
        clubSpells: [
          { clubId: formerClub.id, clubName: formerClub.name, fromSeason: 2, toSeason: 5, endedBy: 'fired' as const },
          { clubId: base.managedClubId, clubName: 'Ny klubb', fromSeason: 5 },
        ],
      },
    }

    expect(beat.trigger(game)).toBe(true)
    expect(beat.text).toBe('Första gången tillbaka. Läktaren minns, åt båda hållen.')
    expect(getBeatKey(beat, game.currentSeason, game))
      .toBe(`callback_manager_return_${formerClub.id}_s5`)

    const earlier = { ...next, id: 'return_already_played', status: 'completed' as const, matchday: 2 }
    expect(beat.trigger({ ...game, fixtures: [earlier, next] })).toBe(false)
  })

  it('gissar inte första gången när den nuvarande klubbperioden började en tidigare säsong', () => {
    const base = makeGame({ currentSeason: 6 })
    const formerClub = base.clubs.find(club => club.id !== base.managedClubId)!
    const next = {
      ...base.fixtures[0], id: 'unknown_return', status: 'scheduled' as const,
      homeClubId: base.managedClubId, awayClubId: formerClub.id, season: 6, matchday: 3,
    }
    const game = {
      ...base,
      fixtures: [next],
      managerProfile: {
        ...base.managerProfile!,
        clubSpells: [
          { clubId: formerClub.id, clubName: formerClub.name, fromSeason: 2, toSeason: 5, endedBy: 'fired' as const },
          { clubId: base.managedClubId, clubName: 'Ny klubb', fromSeason: 5 },
        ],
      },
    }

    expect(beat.trigger(game)).toBe(false)
  })
})

describe('callback_nemesis — samma klubbnycklade nemesis på alla ytor', () => {
  const beat = PORTAL_BEATS.find(candidate => candidate.id === 'callback_nemesis')!

  it('väljer högsta gemensamma score, kräver exakt nästa motståndare och tillskriver inte klubb-H2H en tränarperson', () => {
    const base = makeGame({ currentSeason: 5 })
    const [nemesisClub, otherClub] = base.clubs.filter(club => club.id !== base.managedClubId)
    const next = {
      ...base.fixtures[0], id: 'next_nemesis', status: 'scheduled' as const,
      homeClubId: base.managedClubId, awayClubId: nemesisClub.id, season: 5, matchday: 12,
    }
    const game = {
      ...base,
      fixtures: [next],
      aiCoaches: {
        ...base.aiCoaches,
        [nemesisClub.id]: { name: 'Ny Tränare', style: 'defensive' as const, quote: 'Citat' },
      },
      managerProfile: {
        ...base.managerProfile!,
        coachRivalries: [
          { clubId: base.managedClubId, personality: 'odmjuk' as const, h2hWins: 0, h2hDraws: 0, h2hLosses: 10 },
          { clubId: nemesisClub.id, personality: 'kall' as const, h2hWins: 1, h2hDraws: 0, h2hLosses: 3 },
          { clubId: otherClub.id, personality: 'heders' as const, h2hWins: 0, h2hDraws: 4, h2hLosses: 1 },
        ],
      },
    }

    expect(beat.trigger(game)).toBe(true)
    expect(typeof beat.text === 'function' ? beat.text(game) : beat.text)
      .toBe(`Det blir ${nemesisClub.name} igen. 1V 0O 3F i böckerna.`)
    expect(typeof beat.text === 'function' ? beat.text(game) : beat.text)
      .not.toContain('Ny Tränare')
    expect(getBeatKey(beat, game.currentSeason, game))
      .toBe(`callback_nemesis_${nemesisClub.id}_s5`)
    expect(PIVOTAL_BEAT_IDS).toContain('callback_nemesis')

    expect(beat.trigger({
      ...game,
      fixtures: [{ ...next, awayClubId: otherClub.id }],
    })).toBe(false)
  })

  it('triggar inte utan ett faktiskt H2H-underläge', () => {
    const base = makeGame({ currentSeason: 5 })
    const opponent = base.clubs.find(club => club.id !== base.managedClubId)!
    const next = {
      ...base.fixtures[0], id: 'next_even_record', status: 'scheduled' as const,
      homeClubId: base.managedClubId, awayClubId: opponent.id, season: 5, matchday: 12,
    }
    const game = {
      ...base,
      fixtures: [next],
      managerProfile: {
        ...base.managerProfile!,
        coachRivalries: [
          { clubId: opponent.id, personality: 'kall' as const, h2hWins: 2, h2hDraws: 0, h2hLosses: 2 },
        ],
      },
    }

    expect(beat.trigger(game)).toBe(false)
  })
})

describe('callback_legend_mentor — verklig klubbikon bakom nuvarande kapten', () => {
  const beat = PORTAL_BEATS.find(candidate => candidate.id === 'callback_legend_mentor')!

  it('kräver en egen kapten och väljer senaste mentorskapet vars senior faktiskt blev klubbikon', () => {
    const base = makeGame({ currentSeason: 5 })
    const captain = base.players.find(player => player.clubId === base.managedClubId)!
    const oldMentor = base.players.find(player => player.clubId === base.managedClubId && player.id !== captain.id)!
    const latestMentor = base.players.find(player =>
      player.clubId === base.managedClubId && player.id !== captain.id && player.id !== oldMentor.id
    )!
    const game = {
      ...base,
      captainPlayerId: captain.id,
      mentorshipHistory: [
        { seniorPlayerId: oldMentor.id, youthPlayerId: captain.id, startRound: 2, endSeason: 3, outcome: 'ended' as const },
        { seniorPlayerId: latestMentor.id, youthPlayerId: captain.id, startRound: 5, endSeason: 4, outcome: 'graduated' as const },
      ],
      clubLegends: [
        {
          name: `O. ${oldMentor.lastName}`, position: oldMentor.position, seasons: 5,
          totalGames: 100, totalGoals: 20, totalAssists: 15, titles: [], retiredSeason: 4,
          playerId: oldMentor.id,
        },
        {
          name: `L. ${latestMentor.lastName}`, position: latestMentor.position, seasons: 6,
          totalGames: 120, totalGoals: 25, totalAssists: 20, titles: [], retiredSeason: 5,
          playerId: latestMentor.id,
        },
      ],
    }

    expect(beat.trigger(game)).toBe(true)
    expect(typeof beat.text === 'function' ? beat.text(game) : beat.text)
      .toBe(`${captain.firstName} ${captain.lastName} bär bindeln nu. Det var L. ${latestMentor.lastName} som visade honom hur man gör.`)
    expect(getBeatKey(beat, game.currentSeason, game))
      .toBe(`callback_legend_mentor_${captain.id}_${latestMentor.id}_s5`)
    expect(PIVOTAL_BEAT_IDS).toContain('callback_legend_mentor')

    expect(beat.trigger({
      ...game,
      players: game.players.map(player => player.id === captain.id
        ? { ...player, clubId: 'free_agent' }
        : player),
    })).toBe(false)
  })

  it('kallar inte en vanlig mentor för legend och renderar därför aldrig fallbacken En legend', () => {
    const base = makeGame({ currentSeason: 5 })
    const captain = base.players.find(player => player.clubId === base.managedClubId)!
    const mentor = base.players.find(player => player.clubId === base.managedClubId && player.id !== captain.id)!
    const game = {
      ...base,
      captainPlayerId: captain.id,
      mentorshipHistory: [{ seniorPlayerId: mentor.id, youthPlayerId: captain.id, startRound: 2 }],
      clubLegends: [],
    }

    expect(beat.trigger(game)).toBe(false)
  })
})

describe('callback_legend_debut — exakt strukturerad förstamatch', () => {
  const beat = PORTAL_BEATS.find(candidate => candidate.id === 'callback_legend_debut')!

  it('visar bara den aktuella matchdagens verkliga akademidebut för en legends adept', () => {
    const base = makeGame({ currentSeason: 5, currentMatchday: 12 })
    const debutant = base.players.find(player => player.clubId === base.managedClubId)!
    const mentor = base.players.find(player => player.clubId === base.managedClubId && player.id !== debutant.id)!
    const game = {
      ...base,
      players: base.players.map(player => player.id === debutant.id
        ? {
            ...player,
            promotedFromAcademy: true,
            careerStats: { ...player.careerStats, totalGames: 1 },
            diary: [{
              season: 5, matchday: 12, type: 'milestone' as const,
              semanticKey: 'first_team_debut' as const,
              text: 'A-lagsdebut mot MOT. Nerverna satt — men benen höll.',
            }],
          }
        : player),
      mentorshipHistory: [{ seniorPlayerId: mentor.id, youthPlayerId: debutant.id, startRound: 3 }],
      clubLegends: [{
        name: `M. ${mentor.lastName}`, position: mentor.position, seasons: 6,
        totalGames: 120, totalGoals: 25, totalAssists: 20, titles: [], retiredSeason: 5,
        playerId: mentor.id,
      }],
    }

    expect(beat.trigger(game)).toBe(true)
    expect(typeof beat.text === 'function' ? beat.text(game) : beat.text)
      .toBe(`${debutant.firstName} ${debutant.lastName} gör debut, ${debutant.age} år.`)
    expect(getBeatKey(beat, game.currentSeason, game))
      .toBe(`callback_legend_debut_${debutant.id}_${mentor.id}_s5_m12`)
    expect(PIVOTAL_BEAT_IDS).toContain('callback_legend_debut')

    expect(beat.trigger({ ...game, currentMatchday: 13 })).toBe(false)
    expect(beat.trigger({
      ...game,
      players: game.players.map(player => player.id === debutant.id
        ? { ...player, careerStats: { ...player.careerStats, totalGames: 2 } }
        : player),
    })).toBe(false)
  })

  it('gissar inte debut från 1–3 matcher eller från svensk dagbokstext utan semanticKey', () => {
    const base = makeGame({ currentSeason: 5, currentMatchday: 12 })
    const debutant = base.players.find(player => player.clubId === base.managedClubId)!
    const mentor = base.players.find(player => player.clubId === base.managedClubId && player.id !== debutant.id)!
    const game = {
      ...base,
      players: base.players.map(player => player.id === debutant.id
        ? {
            ...player,
            careerStats: { ...player.careerStats, totalGames: 1 },
            diary: [{
              season: 5, matchday: 12, type: 'milestone' as const,
              text: 'A-lagsdebut mot MOT. Nerverna satt — men benen höll.',
            }],
          }
        : player),
      mentorshipHistory: [{ seniorPlayerId: mentor.id, youthPlayerId: debutant.id, startRound: 3 }],
      clubLegends: [{
        name: `M. ${mentor.lastName}`, position: mentor.position, seasons: 6,
        totalGames: 120, totalGoals: 25, totalAssists: 20, titles: [], retiredSeason: 5,
        playerId: mentor.id,
      }],
    }

    expect(beat.trigger(game)).toBe(false)
  })
})

describe('callback_legend_record — verklig högsta legendnotering', () => {
  const beat = PORTAL_BEATS.find(candidate => candidate.id === 'callback_legend_record')!

  it('väljer högsta legendtotalen och närmaste egna spelare under rekordet', () => {
    const base = makeGame({ currentSeason: 5 })
    const [nearest, farther] = base.players.filter(player => player.clubId === base.managedClubId)
    const game = {
      ...base,
      players: base.players.map(player => {
        if (player.id === nearest.id) return { ...player, careerStats: { ...player.careerStats, totalGoals: 98 } }
        if (player.id === farther.id) return { ...player, careerStats: { ...player.careerStats, totalGoals: 96 } }
        return player
      }),
      clubLegends: [
        {
          name: 'L. Lägre', position: nearest.position, seasons: 9,
          totalGames: 180, totalGoals: 80, totalAssists: 30, titles: [], retiredSeason: 3,
          playerId: 'legend_low',
        },
        {
          name: 'H. Högst', position: nearest.position, seasons: 11,
          totalGames: 220, totalGoals: 100, totalAssists: 40, titles: [], retiredSeason: 4,
          playerId: 'legend_high',
        },
      ],
    }

    expect(beat.trigger(game)).toBe(true)
    expect(typeof beat.text === 'function' ? beat.text(game) : beat.text)
      .toBe(`${nearest.firstName} ${nearest.lastName} är 2 mål från H. Högst:s rekord.`)
    expect(getBeatKey(beat, game.currentSeason, game))
      .toBe(`callback_legend_record_${nearest.id}_legend_high_100`)
    expect(getBeatKey(beat, 6, { ...game, currentSeason: 6 }))
      .toBe(`callback_legend_record_${nearest.id}_legend_high_100`)
    expect(PIVOTAL_BEAT_IDS).toContain('callback_legend_record')
  })

  it('triggar inte på den borttagna seasonsPlayed-proxyn eller när legendens mål redan överträffats', () => {
    const base = makeGame({ currentSeason: 5 })
    const [candidate, holder] = base.players.filter(player => player.clubId === base.managedClubId)
    const legend = {
      name: 'R. Rekord', position: candidate.position, seasons: 10,
      totalGames: 200, totalGoals: 100, totalAssists: 30, titles: [], retiredSeason: 4,
      playerId: 'legend_record',
    }
    const seasonsOnly = {
      ...base,
      players: base.players.map(player => player.id === candidate.id
        ? { ...player, careerStats: { ...player.careerStats, totalGoals: 10, seasonsPlayed: 9 } }
        : player),
      clubLegends: [legend],
    }
    expect(beat.trigger(seasonsOnly)).toBe(false)

    const surpassed = {
      ...seasonsOnly,
      players: seasonsOnly.players.map(player => {
        if (player.id === candidate.id) return { ...player, careerStats: { ...player.careerStats, totalGoals: 98 } }
        if (player.id === holder.id) return { ...player, careerStats: { ...player.careerStats, totalGoals: 101 } }
        return player
      }),
    }
    expect(beat.trigger(surpassed)).toBe(false)
  })
})

describe('season_opener — efter försäsongscupen, före aktuell ligarunda 1', () => {
  const beat = PORTAL_BEATS.find(candidate => candidate.id === 'season_opener')!

  it('blockeras av nästa cupmatch och visas när aktuell säsongs första ligamatch står näst', () => {
    const generated = makeGame()
    const base = {
      ...generated,
      currentSeason: 5,
      fixtures: generated.fixtures.map(fixture => ({ ...fixture, season: 5 })),
    }
    const currentLeague = base.fixtures.find(fixture =>
      !fixture.isCup && !fixture.isKnockout &&
      (fixture.homeClubId === base.managedClubId || fixture.awayClubId === base.managedClubId)
    )!
    const managedCup = {
      ...currentLeague,
      id: 'managed_cup_before_league',
      matchday: currentLeague.matchday - 1,
      status: 'scheduled' as const,
      isCup: true,
    }
    const beforeCup = { ...base, fixtures: [managedCup, currentLeague] }
    expect(beat.trigger(beforeCup)).toBe(false)

    const afterCup = {
      ...beforeCup,
      fixtures: [{ ...managedCup, status: 'completed' as const }, currentLeague],
    }
    expect(beat.trigger(afterCup)).toBe(true)
    expect(typeof beat.text === 'function' ? beat.text(afterCup) : beat.text)
      .toBe('Ispremiär. Wienerbröd på morgonen, isen är stenhård. Det är säsong nu.')
    expect(getBeatKey(beat, afterCup.currentSeason, afterCup)).toBe('season_opener_5')

    expect(beat.trigger({
      ...afterCup,
      fixtures: afterCup.fixtures.map(fixture => fixture.id === currentLeague.id
        ? { ...fixture, status: 'completed' as const }
        : fixture),
    })).toBe(false)
  })

  it('ignorerar historiska completed/scheduled fixtures från en annan säsong', () => {
    const generated = makeGame()
    const base = {
      ...generated,
      currentSeason: 5,
      fixtures: generated.fixtures.map(fixture => ({ ...fixture, season: 5 })),
    }
    const currentLeague = base.fixtures.find(fixture =>
      fixture.season === 5 && !fixture.isCup && !fixture.isKnockout &&
      (fixture.homeClubId === base.managedClubId || fixture.awayClubId === base.managedClubId)
    )!
    const oldCompleted = {
      ...currentLeague, id: 'old_completed_league', season: 4,
      matchday: 1, status: 'completed' as const,
    }
    const oldScheduled = {
      ...currentLeague, id: 'old_scheduled_cup', season: 4,
      matchday: 0, status: 'scheduled' as const, isCup: true,
    }
    const game = { ...base, fixtures: [oldCompleted, oldScheduled, currentLeague] }

    expect(beat.trigger(game)).toBe(true)
  })
})

describe('first_win — första segern i någon tävling', () => {
  const beat = PORTAL_BEATS.find(candidate => candidate.id === 'first_win')!

  it('triggar på första cupsegern även när ligatabellen har noll vinster', () => {
    const base = makeGame({ currentSeason: 5 })
    const opponent = base.clubs.find(club => club.id !== base.managedClubId)!
    const cupWin = {
      ...base.fixtures[0], id: 'first_cup_win', season: 5, matchday: 2,
      status: 'completed' as const, isCup: true,
      homeClubId: base.managedClubId, awayClubId: opponent.id,
      homeScore: 2, awayScore: 2,
      penaltyResult: { home: 4, away: 3 }, wentToPenalties: true,
    }
    const game = {
      ...base,
      fixtures: [cupWin],
      standings: base.standings.map(row => row.clubId === base.managedClubId
        ? { ...row, wins: 0 }
        : row),
    }

    expect(beat.trigger(game)).toBe(true)
    expect(typeof beat.text === 'function' ? beat.text(game) : beat.text)
      .toBe('Första segern. Omklädningsrummet lät inte likadant efteråt.')
    expect(getBeatKey(beat, game.currentSeason, game)).toBe('first_win_5')
  })

  it('kallar inte första ligasegern första segern om laget redan vunnit i cupen', () => {
    const base = makeGame({ currentSeason: 5 })
    const opponent = base.clubs.find(club => club.id !== base.managedClubId)!
    const fixture = (id: string, matchday: number, isCup: boolean) => ({
      ...base.fixtures[0], id, season: 5, matchday, status: 'completed' as const, isCup,
      homeClubId: base.managedClubId, awayClubId: opponent.id, homeScore: 3, awayScore: 1,
    })
    const game = {
      ...base,
      fixtures: [fixture('cup_win', 2, true), fixture('league_win', 5, false)],
      standings: base.standings.map(row => row.clubId === base.managedClubId
        ? { ...row, wins: 1 }
        : row),
    }

    expect(beat.trigger(game)).toBe(false)
    expect(beat.trigger({
      ...game,
      fixtures: [
        { ...fixture('old_win', 20, false), season: 4 },
        fixture('current_win', 5, false),
      ],
    })).toBe(true)
  })
})

describe('first_derby — första derbyt i någon tävling', () => {
  const beat = PORTAL_BEATS.find(candidate => candidate.id === 'first_derby')!

  it('visas inför exakt nästa derby även när det är en cupmatch', () => {
    const base = makeGame({ currentSeason: 5 })
    const rival = base.clubs.find(club =>
      club.id !== base.managedClubId && getRivalry(base.managedClubId, club.id) !== null
    )!
    const cupDerby = {
      ...base.fixtures[0], id: 'first_cup_derby', season: 5, matchday: 2,
      status: 'scheduled' as const, isCup: true, isKnockout: true,
      homeClubId: base.managedClubId, awayClubId: rival.id,
    }
    const historicalScheduled = {
      ...cupDerby, id: 'historical_scheduled', season: 4, matchday: 1,
      awayClubId: base.clubs.find(club =>
        club.id !== base.managedClubId && getRivalry(base.managedClubId, club.id) === null
      )!.id,
    }
    const game = { ...base, fixtures: [historicalScheduled, cupDerby] }

    expect(beat.trigger(game)).toBe(true)
    expect(typeof beat.text === 'function' ? beat.text(game) : beat.text)
      .toBe('Första derbyt. Det här är matcher som lever längre än säsongen.')
    expect(getBeatKey(beat, game.currentSeason, game)).toBe('first_derby_5')
  })

  it('kallar inte ligaderbyt det första när ett cupderby redan spelats samma säsong', () => {
    const base = makeGame({ currentSeason: 5 })
    const rival = base.clubs.find(club =>
      club.id !== base.managedClubId && getRivalry(base.managedClubId, club.id) !== null
    )!
    const fixture = (id: string, matchday: number, status: 'scheduled' | 'completed', isCup: boolean) => ({
      ...base.fixtures[0], id, season: 5, matchday, status, isCup,
      isKnockout: isCup,
      homeClubId: base.managedClubId, awayClubId: rival.id,
      homeScore: status === 'completed' ? 3 : undefined,
      awayScore: status === 'completed' ? 2 : undefined,
    })
    const game = {
      ...base,
      fixtures: [
        fixture('completed_cup_derby', 2, 'completed', true),
        fixture('next_league_derby', 8, 'scheduled', false),
      ],
    }

    expect(beat.trigger(game)).toBe(false)
    expect(beat.trigger({
      ...game,
      fixtures: [
        { ...fixture('historical_derby', 20, 'completed', true), season: 4 },
        fixture('next_league_derby', 8, 'scheduled', false),
      ],
    })).toBe(true)
  })

  it('väntar om en annan match ligger före det kommande derbyt', () => {
    const base = makeGame({ currentSeason: 5 })
    const rival = base.clubs.find(club =>
      club.id !== base.managedClubId && getRivalry(base.managedClubId, club.id) !== null
    )!
    const neutral = base.clubs.find(club =>
      club.id !== base.managedClubId && getRivalry(base.managedClubId, club.id) === null
    )!
    const next = {
      ...base.fixtures[0], season: 5, status: 'scheduled' as const,
      homeClubId: base.managedClubId,
    }
    const game = {
      ...base,
      fixtures: [
        { ...next, id: 'non_derby_first', matchday: 4, awayClubId: neutral.id },
        { ...next, id: 'derby_second', matchday: 5, awayClubId: rival.id },
      ],
    }

    expect(beat.trigger(game)).toBe(false)
  })
})

describe('halftime — exakt halva den låsta 22-omgångarsserien', () => {
  const beat = PORTAL_BEATS.find(candidate => candidate.id === 'halftime')!

  it('räknar 11 currentSeason-ligamatcher men inte cup, slutspel eller historik', () => {
    const base = makeGame({ currentSeason: 5 })
    const opponent = base.clubs.find(club => club.id !== base.managedClubId)!
    const leagueFixture = (id: string, season: number, matchday: number) => ({
      ...base.fixtures[0], id, season, matchday, roundNumber: matchday,
      status: 'completed' as const, isCup: false, isKnockout: false,
      homeClubId: base.managedClubId, awayClubId: opponent.id,
      homeScore: 2, awayScore: 1,
    })
    const currentLeague = Array.from({ length: 11 }, (_, index) =>
      leagueFixture(`current_${index + 1}`, 5, index + 1)
    )
    const ignored = [
      leagueFixture('historical', 4, 22),
      { ...leagueFixture('cup', 5, 2), isCup: true },
      { ...leagueFixture('playoff', 5, 30), isKnockout: true },
    ]
    const game = { ...base, fixtures: [...ignored, ...currentLeague] }

    expect(beat.trigger(game)).toBe(true)
    expect(typeof beat.text === 'function' ? beat.text(game) : beat.text)
      .toBe('Halvtid. Det ni gjort står — det som kommer ligger framför er.')
    expect(getBeatKey(beat, game.currentSeason, game)).toBe('halftime_5')
    expect(beat.trigger({ ...game, fixtures: [...ignored, ...currentLeague.slice(0, 10)] })).toBe(false)
    expect(beat.trigger({
      ...game,
      fixtures: [...ignored, ...currentLeague, leagueFixture('current_12', 5, 12)],
    })).toBe(false)
  })
})

describe('last_league_round — exakt nästa managed fixture är ligarunda 22', () => {
  const beat = PORTAL_BEATS.find(candidate => candidate.id === 'last_league_round')!

  it('triggar efter 21 currentSeason-ligamatcher när ronda 22 står exakt näst', () => {
    const base = makeGame({ currentSeason: 5 })
    const opponent = base.clubs.find(club => club.id !== base.managedClubId)!
    const leagueFixture = (roundNumber: number, status: 'completed' | 'scheduled') => ({
      ...base.fixtures[0], id: `league_${roundNumber}`, season: 5,
      matchday: roundNumber + 4, roundNumber, status,
      isCup: false, isKnockout: false,
      homeClubId: base.managedClubId, awayClubId: opponent.id,
      homeScore: status === 'completed' ? 2 : undefined,
      awayScore: status === 'completed' ? 1 : undefined,
    })
    const completed = Array.from({ length: 21 }, (_, index) => leagueFixture(index + 1, 'completed'))
    const finalRound = leagueFixture(22, 'scheduled')
    const game = { ...base, fixtures: [...completed, finalRound] }

    expect(beat.trigger(game)).toBe(true)
    expect(typeof beat.text === 'function' ? beat.text(game) : beat.text)
      .toBe('Sista omgången. Vad som än händer i dag — det är allt det blir av grundserien.')
    expect(getBeatKey(beat, game.currentSeason, game)).toBe('last_league_round_5')
    expect(beat.trigger({ ...game, fixtures: [...completed.slice(0, 20), finalRound] })).toBe(false)
    expect(beat.trigger({ ...game, fixtures: [...completed, { ...finalRound, status: 'completed' as const }] })).toBe(false)
  })

  it('väntar när en annan managed match ligger före ronda 22', () => {
    const base = makeGame({ currentSeason: 5 })
    const opponent = base.clubs.find(club => club.id !== base.managedClubId)!
    const completed = Array.from({ length: 21 }, (_, index) => ({
      ...base.fixtures[0], id: `completed_${index + 1}`, season: 5,
      matchday: index + 5, roundNumber: index + 1, status: 'completed' as const,
      isCup: false, isKnockout: false,
      homeClubId: base.managedClubId, awayClubId: opponent.id,
    }))
    const finalRound = {
      ...base.fixtures[0], id: 'league_22', season: 5, matchday: 30, roundNumber: 22,
      status: 'scheduled' as const, isCup: false, isKnockout: false,
      homeClubId: base.managedClubId, awayClubId: opponent.id,
    }
    const interveningCup = {
      ...finalRound, id: 'cup_before_final', matchday: 29, roundNumber: 5,
      isCup: true, isKnockout: true,
    }

    expect(beat.trigger({ ...base, fixtures: [...completed, interveningCup, finalRound] })).toBe(false)
  })

  it('ignorerar historiska matcher men kräver currentSeason-ronda 22', () => {
    const base = makeGame({ currentSeason: 5 })
    const opponent = base.clubs.find(club => club.id !== base.managedClubId)!
    const currentCompleted = Array.from({ length: 21 }, (_, index) => ({
      ...base.fixtures[0], id: `current_${index + 1}`, season: 5,
      matchday: index + 5, roundNumber: index + 1, status: 'completed' as const,
      isCup: false, isKnockout: false,
      homeClubId: base.managedClubId, awayClubId: opponent.id,
    }))
    const historicalScheduled = {
      ...base.fixtures[0], id: 'historical_22', season: 4, matchday: 1, roundNumber: 22,
      status: 'scheduled' as const, isCup: false, isKnockout: false,
      homeClubId: base.managedClubId, awayClubId: opponent.id,
    }
    const currentFinal = { ...historicalScheduled, id: 'current_22', season: 5, matchday: 30 }

    expect(beat.trigger({ ...base, fixtures: [...currentCompleted, historicalScheduled, currentFinal] })).toBe(true)
    expect(beat.trigger({
      ...base,
      fixtures: [...currentCompleted, { ...currentFinal, roundNumber: 23 }],
    })).toBe(false)
  })
})

describe('facility_completed — completion-kö, händelseidentitet och Bygget-route', () => {
  const beat = PORTAL_BEATS.find(candidate => candidate.id === 'facility_completed')!

  it('visar den äldsta olästa completionen med nodspecifik text och exakt händelsenyckel', () => {
    const base = makeGame({ currentSeason: 5, shownBeats: [] })
    const game = {
      ...base,
      facilityState: {
        builtNodeIds: ['kiosk', 'varmestuga'],
        unseenCompletedFacilities: [
          { nodeId: 'kiosk', season: 5, matchday: 7 },
          { nodeId: 'varmestuga', season: 5, matchday: 12 },
        ],
      },
    }

    expect(beat.trigger(game)).toBe(true)
    expect(typeof beat.text === 'function' ? beat.text(game) : beat.text)
      .toBe('Kiosken är öppen. Kaffe och korv i pausen — små pengar som blir stora över en säsong.')
    expect(getBeatKey(beat, game.currentSeason, game)).toBe('facility_completed_kiosk_s5_m7')
    expect(beat.route).toBe('/game/bygget')
    expect(beat.kicker).toBe('Bygget')

    const afterFirstDismiss = {
      ...game,
      shownBeats: ['facility_completed_kiosk_s5_m7'],
    }
    expect(beat.trigger(afterFirstDismiss)).toBe(true)
    expect(typeof beat.text === 'function' ? beat.text(afterFirstDismiss) : beat.text)
      .toBe('Värmestugan står klar. Folk stannar kvar i kylan nu, pratar färdigt.')
    expect(getBeatKey(beat, afterFirstDismiss.currentSeason, afterFirstDismiss))
      .toBe('facility_completed_varmestuga_s5_m12')
  })

  it('samma nod kan få en ny invigning efter avveckling och återbyggnad', () => {
    const base = makeGame({ currentSeason: 6 })
    const firstKey = 'facility_completed_kiosk_s4_m9'
    const game = {
      ...base,
      shownBeats: [firstKey],
      facilityState: {
        builtNodeIds: ['kiosk'],
        unseenCompletedFacilities: [
          { nodeId: 'kiosk', season: 4, matchday: 9 },
          { nodeId: 'kiosk', season: 6, matchday: 3 },
        ],
      },
    }

    expect(beat.trigger(game)).toBe(true)
    expect(getBeatKey(beat, game.currentSeason, game)).toBe('facility_completed_kiosk_s6_m3')
  })

  it('legacy-kö utan season respekterar tidigare per-nod-dismiss', () => {
    const base = makeGame({ currentSeason: 5 })
    const game = {
      ...base,
      shownBeats: ['facility_completed_kiosk'],
      facilityState: {
        builtNodeIds: ['kiosk'],
        unseenCompletedFacilities: [{ nodeId: 'kiosk', matchday: 7 }],
      },
    }

    expect(beat.trigger(game)).toBe(false)
  })
})
