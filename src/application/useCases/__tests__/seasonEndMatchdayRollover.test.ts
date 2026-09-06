import { describe, expect, it } from 'vitest'
import { archiveCompletedSeasonInbox, handleSeasonEnd, rebaseFutureMatchday, rolloverActiveArcs, rolloverCoffeeRoomReturns, rolloverEconomicCrisis, rolloverFollowUps, rolloverLeadershipActions, rolloverNationalTeamCamp, rolloverPendingDemand, rolloverPlayerInjuryRamp, rolloverRiskySponsorContract, rolloverSeasonMatchdayAnchors, rolloverTransientEchoMatchdays, rolloverYouthAvailability } from '../seasonEndProcessor'
import { createNewGame } from '../createNewGame'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'
import { InboxItemType } from '../../../domain/enums'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { Player } from '../../../domain/entities/Player'
import type { YouthPlayer } from '../../../domain/entities/Academy'

describe('season rollover — absoluta matchday-fält', () => {
  it('stänger ett kvarvarande P19-mentorskap när den aktiva listan nollställs', () => {
    const base = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 11 })
    const senior = base.players.find(p => p.clubId === base.managedClubId)!
    const youth = base.youthTeam!.players[0]
    const rolled = handleSeasonEnd({
      ...base,
      mentorships: [{ seniorPlayerId: senior.id, youthPlayerId: youth.id, startRound: 2, isActive: true }],
      mentorshipHistory: [{
        seniorPlayerId: senior.id,
        youthPlayerId: youth.id,
        seniorName: `${senior.firstName} ${senior.lastName}`,
        youthName: `${youth.firstName} ${youth.lastName}`,
        startRound: 2,
      }],
    }, 11).game

    expect(rolled.mentorships).toEqual([])
    expect(rolled.mentorshipHistory).toEqual([
      expect.objectContaining({ youthPlayerId: youth.id, endSeason: base.currentSeason, outcome: 'ended' }),
    ])
  })

  it('bevarar återstående burnouttid på nästa säsongs nollpunkt', () => {
    expect(rebaseFutureMatchday(26, 22)).toBe(4)
    expect(rebaseFutureMatchday(22, 22)).toBe(0)
    expect(rebaseFutureMatchday(undefined, 22)).toBeUndefined()
  })

  it('bevarar riskavtalets återstående mognadstid och flyttar dess säsongsaxel', () => {
    expect(rolloverRiskySponsorContract({
      sponsorId: 'risk',
      riskMaturityRound: 26,
      season: 1,
    }, 22, 2)).toEqual({
      sponsorId: 'risk',
      riskMaturityRound: 4,
      season: 2,
    })
  })

  it('bevarar cooldowners återstående tid, historikankarnas ålder och flyttar cursorn till start', () => {
    const rolled = rolloverSeasonMatchdayAnchors({
      currentMatchday: 22,
      lastCoffeeSceneRound: 21,
      weeklyDecisionLastRound: 21,
      lastEconomicStressRound: 20,
      lastCSPressMatchday: 19,
      lastRumorRound: 21,
      lastEventQueueRound: 22,
      lastRivalSaleMatchday: 20,
      lastIncomingBidMatchday: 21,
      lastProcessedMatchday: 22,
      cardStaleTracking: {
        ekonomi: { firstShownAt: 18, lastShownAt: 22, shownCount: 5 },
      },
    } as SaveGame)

    expect(rolled).toMatchObject({
      lastCoffeeSceneRound: -1,
      weeklyDecisionLastRound: -1,
      lastEconomicStressRound: -2,
      lastCSPressMatchday: -3,
      lastRumorRound: -1,
      lastEventQueueRound: 0,
      lastRivalSaleMatchday: -2,
      lastIncomingBidMatchday: -1,
      lastProcessedMatchday: 0,
      cardStaleTracking: {
        ekonomi: { firstShownAt: -4, lastShownAt: 0, shownCount: 5 },
      },
    })
  })

  it('kopplar in samma ankare i det verkliga handleSeasonEnd-rollovern', () => {
    const base = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
    const rolled = handleSeasonEnd({
      ...base,
      currentMatchday: 22,
      lastCoffeeSceneRound: 21,
      weeklyDecisionLastRound: 21,
      lastRivalSaleMatchday: 20,
      lastProcessedMatchday: 22,
      riskySponsorContract: { sponsorId: 'risk', riskMaturityRound: 26, season: 1 },
      cardStaleTracking: {
        ekonomi: { firstShownAt: 18, lastShownAt: 22, shownCount: 5 },
      },
    }, 1).game

    expect(rolled.currentMatchday).toBe(0)
    expect(rolled.lastCoffeeSceneRound).toBe(-1)
    expect(rolled.weeklyDecisionLastRound).toBe(-1)
    expect(rolled.lastRivalSaleMatchday).toBe(-2)
    expect(rolled.lastProcessedMatchday).toBe(0)
    expect(rolled.riskySponsorContract).toEqual({ sponsorId: 'risk', riskMaturityRound: 4, season: rolled.currentSeason })
    expect(rolled.cardStaleTracking?.ekonomi).toEqual({
      firstShownAt: -4,
      lastShownAt: 0,
      shownCount: 5,
    })
  })

  it('bevarar permanent röstgrind men nollställer introbudgeten', () => {
    const base = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 31 })
    const introducedVoices = {
      'mecenat:club:m1': {
        provenance: 'observed' as const,
        source: 'event' as const,
        introducedSeason: base.currentSeason,
        introducedDate: base.currentDate,
      },
    }
    const rolled = handleSeasonEnd({
      ...base,
      introducedVoices,
      voiceIntroductionBudget: { season: base.currentSeason, matchday: 22, used: 1 },
    }, 31).game

    expect(rolled.introducedVoices).toEqual(introducedVoices)
    expect(rolled.voiceIntroductionBudget).toBeUndefined()
  })

  it('bevarar återstående juniorlandslagsfrånvaro för kvarvarande P19-spelare', () => {
    const player = {
      id: 'p19', firstName: 'Bo', lastName: 'Test', age: 17,
      currentAbility: 20, potentialAbility: 50, developmentRate: 50,
      confidence: 50, schoolConflict: false, seasonGoals: 0, seasonAssists: 0,
      readyForPromotion: false, roundsReadyForPromotion: 0,
      availabilityUntilRound: 25,
    } as YouthPlayer

    expect(rolloverYouthAvailability([player], 22)[0].availabilityUntilRound).toBe(3)
  })

  it('bevarar både ålder och återstående frist för patron-/mecenatkrav', () => {
    const demand = {
      category: 'league_position' as const,
      description: 'Nå tabellmålet',
      createdRound: 20,
      deadlineRound: 28,
    }

    expect(rolloverPendingDemand(demand, 24)).toMatchObject({
      createdRound: -4,
      deadlineRound: 4,
    })
  })

  it('bevarar uppföljningens förflutna och återstående matchdagar', () => {
    const [followUp] = rolloverFollowUps([{
      id: 'fu', triggerEventId: 'event', type: 'simple_inbox',
      createdMatchday: 21, matchdaysDelay: 5,
    }], 23)

    expect(followUp.createdMatchday).toBe(-2)
    expect(1 - followUp.createdMatchday).toBe(3)
    expect(followUp.matchdaysDelay - (1 - followUp.createdMatchday)).toBe(2)
  })

  it('bevarar ledarskapsåtgärdens cooldown och aktiva fönster', () => {
    const [action] = rolloverLeadershipActions([{
      playerId: 'p1', action: 'public_praise', fromRound: 21, expiresRound: 26,
      effect: { stat: 'morale', delta: 5 },
    }], 23)

    expect(action).toMatchObject({ fromRound: -2, expiresRound: 3 })
    expect(action.expiresRound - action.fromRound).toBe(5)
  })

  it('bevarar kafferumsåterkomstens exakta deadline, även för äldre saves', () => {
    const [pending] = rolloverCoffeeRoomReturns([{
      questionId: 'q1', answerId: 'A', answeredMatchday: 21,
    }], 23)

    const originalDue = pending.dueMatchday! + 23
    expect(pending.answeredMatchday).toBe(-2)
    expect(pending.dueMatchday).toBe(originalDue - 23)
  })

  it('bevarar olöst ekonomisk kris elapsed time men avslutar redan löst kris', () => {
    const crisis = {
      startedSeason: 2026, startedMatchday: 21,
      phase: 'awareness' as const, eventsFired: ['awareness'],
    }

    expect(rolloverEconomicCrisis(crisis, 23)?.startedMatchday).toBe(-2)
    expect(rolloverEconomicCrisis({ ...crisis, phase: 'resolved' }, 23)).toBeUndefined()
  })

  it('bevarar en aktiv arcs fasålder och återstående livstid', () => {
    const [arc] = rolloverActiveArcs([{
      id: 'arc1', type: 'hungrig_breakthrough', startedMatchday: 20,
      expiresMatchday: 27, phase: 'building', eventsFired: [], decisionsMade: [],
    }], 23)

    expect(arc).toMatchObject({ startedMatchday: -3, expiresMatchday: 4 })
    expect(arc.expiresMatchday - arc.startedMatchday).toBe(7)
  })

  it('rebasar alla tre transient-eko-deadlines och klackens orsakstid', () => {
    const rolled = rolloverTransientEchoMatchdays({
      currentMatchday: 23,
      victoryEchoExpires: 24,
      nationalTeamReturnExpires: 25,
      hallEchoExpires: 24,
      klackEcho: { type: 'derby_win', resultMatchday: 22, initialWeight: 1, currentWeight: 1, decayPerRound: 0.5 },
    } as SaveGame)

    expect(rolled).toMatchObject({
      victoryEchoExpires: 1,
      nationalTeamReturnExpires: 2,
      hallEchoExpires: 1,
      klackEcho: { resultMatchday: -1 },
    })
  })

  it('bevarar återstående landslagsläger och dess startpunkt', () => {
    expect(rolloverNationalTeamCamp({ startRound: 22, endRound: 24, playerIds: ['p1'] }, 23))
      .toMatchObject({ startRound: -1, endRound: 1 })
  })

  it('bevarar återstående "ramp först"-frist för nyligen skadade spelare (steg C)', () => {
    const player = { id: 'p1', recentlyInjuredUntil: 25 } as Player
    const untouched = { id: 'p2' } as Player

    const [rolled, rolledUntouched] = rolloverPlayerInjuryRamp([player, untouched], 22)

    expect(rolled.recentlyInjuredUntil).toBe(3)
    expect(rolledUntouched.recentlyInjuredUntil).toBeUndefined()
  })

  it('bevarar periodiseringslägets faktiska elapsed-tid över säsongsskiftet (steg C)', () => {
    const since = 20
    const completedSeasonMatchday = 22
    const elapsedBeforeRollover = completedSeasonMatchday - since

    const rebasedSince = rebaseFutureMatchday(since, completedSeasonMatchday)!
    const elapsedOneRoundIntoNextSeason = 1 - rebasedSince

    expect(elapsedOneRoundIntoNextSeason).toBe(elapsedBeforeRollover + 1)
  })

  it('arkiverar transferdeadlinen när dess budkö avslutas', () => {
    const [item] = archiveCompletedSeasonInbox([{
      id: 'bid', date: '2026-01-01', type: InboxItemType.TransferBidReceived,
      title: 'Bud', body: 'Svara', isRead: false, expiresRound: 25,
    }])

    expect(item).toMatchObject({ isRead: true })
    expect(item.expiresRound).toBeUndefined()
  })
})
