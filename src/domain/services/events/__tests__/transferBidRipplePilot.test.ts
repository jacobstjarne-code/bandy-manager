// ÖVERLÄMNING 2 steg 1-pilot (2026-08-12): rapporterar vad
// pilotTransferBidRippleChain faktiskt producerar för transferbudets tre
// utfall (accept/avslag/kräv mer). Se commit-meddelandet för full rapport.
import { describe, it, expect } from 'vitest'
import { resolveEvent } from '../eventResolver'
import { bidReceivedEvent } from '../eventFactories'
import type { SaveGame } from '../../../entities/SaveGame'
import type { TransferBid } from '../../../entities/GameEvent'
import type { Player } from '../../../entities/Player'
import type { Club } from '../../../entities/Club'
import { PlayerPosition, PlayerArchetype, TrainingType, TrainingIntensity, TacticMentality, TacticTempo, TacticPress, TacticPassingRisk, TacticWidth, TacticAttackingFocus, CornerStrategy, PenaltyKillStyle, ClubExpectation, ClubStyle } from '../../../enums'

const defaultTactic = {
  mentality: TacticMentality.Balanced, tempo: TacticTempo.Normal, press: TacticPress.Medium,
  passingRisk: TacticPassingRisk.Mixed, width: TacticWidth.Normal, attackingFocus: TacticAttackingFocus.Mixed,
  cornerStrategy: CornerStrategy.Standard, penaltyKillStyle: PenaltyKillStyle.Passive,
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'berg', firstName: 'Anders', lastName: 'Berg',
    age: 27, nationality: 'SE', clubId: 'c1', isHomegrown: false,
    position: PlayerPosition.Forward, archetype: PlayerArchetype.Finisher,
    salary: 15000, contractUntilSeason: 2027, marketValue: 300000,
    morale: 70, form: 65, fitness: 80, sharpness: 70,
    currentAbility: 72, potentialAbility: 75, developmentRate: 50,
    injuryProneness: 30, discipline: 60,
    attributes: { skating: 60, acceleration: 60, stamina: 60, ballControl: 60, passing: 60, shooting: 65, dribbling: 60, vision: 60, decisions: 60, workRate: 60, positioning: 60, defending: 40, cornerSkill: 40, goalkeeping: 10 },
    isInjured: false, injuryDaysRemaining: 0, suspensionGamesRemaining: 0,
    seasonStats: { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0 },
    careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 0 },
    ...overrides,
  } as Player
}

function makeClub(overrides: Partial<Club> = {}): Club {
  return {
    id: 'c1', name: 'Managed FK', shortName: 'MFK', region: 'Mälardalen',
    reputation: 60, finances: 500000, wageBudget: 200000, transferBudget: 500000,
    youthQuality: 50, youthRecruitment: 50, youthDevelopment: 50, facilities: 60,
    boardExpectation: ClubExpectation.MidTable, fanExpectation: ClubExpectation.MidTable,
    preferredStyle: ClubStyle.Balanced, hasArtificialIce: false,
    activeTactic: defaultTactic, squadPlayerIds: ['berg'],
    ...overrides,
  } as Club
}

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  const managedClub = makeClub({ id: 'c1', squadPlayerIds: ['berg'] })
  const buyingClub = makeClub({ id: 'c2', name: 'Köparklubben', shortName: 'KÖP', squadPlayerIds: [] })
  const berg = makePlayer({ id: 'berg', clubId: 'c1' })

  return {
    id: 'g1', managerName: 'Test', managedClubId: 'c1',
    currentDate: '2025-09-15', currentSeason: 2025, currentMatchday: 14,
    clubs: [managedClub, buyingClub],
    players: [berg],
    league: { id: 'l1', name: 'Test League', season: 2025 },
    fixtures: [], standings: [], inbox: [],
    transferState: { freeAgents: [], pendingOffers: [] },
    youthIntakeHistory: [], matchWeathers: [],
    managedClubTraining: { type: TrainingType.Physical, intensity: TrainingIntensity.Normal },
    trainingHistory: [], playoffBracket: null, cupBracket: null, seasonSummaries: [],
    pendingScreen: null, scoutReports: {}, activeScoutAssignment: null, scoutBudget: 10,
    pendingEvents: [], transferBids: [], version: '0.1.0', lastSavedAt: '2025-01-01T00:00:00Z',
    // De fem ripple-spårade fälten, satta till mittenvärden så en förändring
    // (om någon skulle inträffa) syns tydligt i diffen.
    fanMood: 50, communityStanding: 50, boardPatience: 70, sponsorNetworkMood: 50,
    supporterGroup: { mood: 50 } as SaveGame['supporterGroup'],
    ...overrides,
  } as unknown as SaveGame
}

function makeBid(overrides: Partial<TransferBid> = {}): TransferBid {
  return {
    id: 'bid1', playerId: 'berg', buyingClubId: 'c2', sellingClubId: 'c1',
    offerAmount: 250000, offeredSalary: 20000, contractYears: 3,
    direction: 'incoming', status: 'pending', createdRound: 14, expiresRound: 16,
    ...overrides,
  } as TransferBid
}

describe('ÖVERLÄMNING 2 steg 1-pilot: transferbud → ripple', () => {
  it('accept: producerar vilken kedja?', () => {
    const bid = makeBid()
    const game = makeGame({ transferBids: [bid] })
    const event = bidReceivedEvent(bid, game)
    const gameWithEvent = { ...game, pendingEvents: [event] }

    const after = resolveEvent(gameWithEvent, event.id, 'accept')
    const chain = after.pilotTransferBidRippleChain

    console.log('=== ACCEPT ===')
    console.log(JSON.stringify(chain, null, 2))
    console.log('finances före/efter (säljande klubb):', game.clubs[0].finances, '→', after.clubs.find(c => c.id === 'c1')?.finances)
    console.log('spelaren kvar i truppen?', after.players.find(p => p.id === 'berg')?.clubId)

    // AUDIT DEL 4 steg 2 (2026-08-12): kassan in — accept ska nu visa den,
    // scope:'club' (klubbomfattande, inte en enskild spelares fält).
    // Transferbudget rörs INTE här (managed club SÄLJER — transferBudget
    // dras bara för den KÖPANDE klubben i executeTransfer).
    // wageBudget 200 000, kassaD +250 000 → 125% → kraftigt
    expect(chain?.steps).toEqual([{ label: 'Kassan', dir: 'up', scope: 'club', magnitude: 'kraftigt' }])
  })

  it('avslag: producerar vilken kedja?', () => {
    const bid = makeBid()
    const game = makeGame({ transferBids: [bid] })
    const event = bidReceivedEvent(bid, game)
    const gameWithEvent = { ...game, pendingEvents: [event] }

    const after = resolveEvent(gameWithEvent, event.id, 'reject')
    const chain = after.pilotTransferBidRippleChain

    console.log('=== AVSLAG ===')
    console.log(JSON.stringify(chain, null, 2))
    console.log('spelarens moral före/efter:', game.players[0].morale, '→', after.players.find(p => p.id === 'berg')?.morale)

    // ÖVERLÄMNING 2 steg 3 (2026-08-15, Jacobs dom): spelarnivå byggd, egen
    // scope:'player' — etiketten är fältets namn ("Moralen"), inte "Spelaren"
    // (subjectName bär redan vem det gäller). Detta var den enda konsekvensen
    // avslaget faktiskt har, och den var osynlig fram till nu.
    // discipline 60, gap 16.7% (under 20%-baseline), 2 år kvar → vikt <1 → delta 4 → knappt
    expect(chain?.steps).toEqual([{ label: 'Moralen', dir: 'down', scope: 'player', magnitude: 'knappt' }])
  })

  it('kräv mer: förblir tom (Jacobs dom, verifierad efter steg 2)', () => {
    const bid = makeBid()
    const game = makeGame({ transferBids: [bid] })
    const event = bidReceivedEvent(bid, game)
    const hasCounterChoice = event.choices.some(c => c.id === 'counter')
    console.log('counter-alternativet fanns i choices?', hasCounterChoice)
    const gameWithEvent = { ...game, pendingEvents: [event] }

    const after = resolveEvent(gameWithEvent, event.id, 'counter')
    const chain = after.pilotTransferBidRippleChain

    console.log('=== KRÄV MER ===')
    console.log(JSON.stringify(chain, null, 2))
    console.log('budets belopp före/efter:', bid.offerAmount, '→', after.transferBids?.find(b => b.id === 'bid1')?.offerAmount)

    // Jacobs dom (2026-08-12): "kräv mer" ändrar bara budets storlek — inget
    // tillstånd (kassa/moral/humör) rör sig, så kedjan SKA vara tom. Detta är
    // en regressionsvakt mot att steg 3 (magnitud/fler fält) av misstag
    // börjar fyra en falsk rad här.
    expect(chain?.steps).toEqual([])
  })
})
