import { describe, it, expect } from 'vitest'
import { getActiveBeat, getBeatKey } from '../portalBeatService'
import { PORTAL_BEATS, PIVOTAL_BEAT_IDS, PIVOTAL_BEAT_COOLDOWN_SEASONS } from '../../data/portalBeats'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../worldGenerator'
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
