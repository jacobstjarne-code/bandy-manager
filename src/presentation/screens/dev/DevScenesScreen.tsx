/**
 * DevScenesScreen — dev-only gallery for visually verifying hard-to-reach surfaces.
 * Gated on import.meta.env.DEV — never shipped in production builds.
 *
 * Add a scene: extend SCENES, create fingered game via makeGame(), render below.
 */

import { useState, useEffect } from 'react'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { Club } from '../../../domain/entities/Club'
import { PlayerPosition } from '../../../domain/enums'
import { CupFinalVictoryScene } from '../scenes/CupFinalVictoryScene'
import { SMFinalVictoryScene } from '../scenes/SMFinalVictoryScene'
import { SeasonArcCard } from '../../components/squad/SeasonArcCard'
import { TabellSecondary } from '../../components/portal/secondary/TabellSecondary'
import { FormStatusMinimal } from '../../components/portal/minimal/FormStatusMinimal'
import { EfterklangSecondary } from '../../components/portal/secondary/EfterklangSecondary'
import { SquadScreen } from '../SquadScreen'
import { PortalScreen } from '../PortalScreen'
import { TranareTab } from '../../components/club/TranareTab'
import { BoardMeetingScene } from '../scenes/BoardMeetingScene'
import { GranskaScreen } from '../granska/GranskaScreen'
import { PortalUpptakt } from '../../components/portal/PortalUpptakt'
import { NextMatchPrimary } from '../../components/portal/primary/NextMatchPrimary'
import { EkonomiTab } from '../../components/club/EkonomiTab'
import { PlayerCard } from '../../components/PlayerCard'
import { ScoreBlock as ScoreBlockComp } from '../../components/primitives/ScoreBlock'
import { Sparkline as SparklineComp } from '../../components/primitives/Sparkline'
import { useGameStore } from '../../store/gameStore'

type SceneId = 'cup-victory' | 'sm-victory' | 'season-arc' | 'portal-cards' | 'efterklang' | 'squad' | 'portal' | 'tranare' | 'board-a' | 'board-b' | 'board-c' | 'stillness' | 'granska' | 'upptakt' | 'ekonomi' | 'playercard' | 'season-a' | 'season-b' | 'season-c'

const SCENES: { id: SceneId; label: string }[] = [
  { id: 'cup-victory',  label: 'Cup Victory' },
  { id: 'sm-victory',   label: 'SM-Final Victory' },
  { id: 'season-arc',   label: 'SeasonArcCard (toppa, omg 16)' },
  { id: 'portal-cards', label: 'Portal Cards (mörk yta)' },
  { id: 'efterklang',   label: 'Efterklang (journalist-tråd)' },
  { id: 'squad',        label: 'SquadScreen (trupp)' },
  { id: 'portal',       label: 'PortalScreen (dashboard)' },
  { id: 'tranare',      label: 'TranareTab (manager-karaktär)' },
  { id: 'board-a',      label: 'BoardMeeting A (första)' },
  { id: 'board-b',      label: 'BoardMeeting B (bra)' },
  { id: 'board-c',      label: 'BoardMeeting C (dålig)' },
  { id: 'stillness',    label: 'NU-stiltje (lugn vecka)' },
  { id: 'granska',      label: 'Granska (IA: 3 grupper)' },
  { id: 'upptakt',      label: 'Upptakt (C-SD2 sub-states)' },
  { id: 'ekonomi',      label: 'Ekonomi (Våg 4: kassa-trend)' },
  { id: 'playercard',   label: 'PlayerCard (Våg 4: rating-block)' },
  { id: 'season-a',     label: 'SeasonSummary A (mästare → gold)' },
  { id: 'season-b',     label: 'SeasonSummary B (topp 3 → win)' },
  { id: 'season-c',     label: 'SeasonSummary C (mittfält → subtle)' },
]

// ── Fingered data ────────────────────────────────────────────────────────────

const HOME_ID = 'dev-managed'
const AWAY_ID = 'dev-opponent'

const devClubs = [
  {
    id: HOME_ID, name: 'Edsbyn BK', shortName: 'EBK', region: 'Hälsingland',
    reputation: 72, finances: 80000, wageBudget: 25000, transferBudget: 15000,
    youthQuality: 65, youthRecruitment: 60, youthDevelopment: 62, facilities: 68,
    boardExpectation: 'playoff', fanExpectation: 'playoff',
    preferredStyle: 'balanced', hasArtificialIce: false,
    arenaCapacity: 500, arenaName: 'Edsbyns IP',
    activeTactic: { formation: '2-2-5', mentality: 'balanced', tempo: 'normal', press: 'medium', passingRisk: 'safe', width: 'normal', attackingFocus: 'balanced', cornerStrategy: 'near_post', penaltyKillStyle: 'box' },
    squadPlayerIds: ['p1', 'p2', 'p3'],
  },
  {
    id: AWAY_ID, name: 'Bollnäs GoIF', shortName: 'BGF', region: 'Hälsingland',
    reputation: 65, finances: 60000, wageBudget: 20000, transferBudget: 10000,
    youthQuality: 55, youthRecruitment: 52, youthDevelopment: 55, facilities: 58,
    boardExpectation: 'midtable', fanExpectation: 'midtable',
    preferredStyle: 'defensive', hasArtificialIce: false,
    arenaCapacity: 420, arenaName: 'Sävstaås IP',
    activeTactic: { formation: '2-3-4', mentality: 'defensive', tempo: 'slow', press: 'low', passingRisk: 'safe', width: 'narrow', attackingFocus: 'balanced', cornerStrategy: 'far_post', penaltyKillStyle: 'diamond' },
    squadPlayerIds: [],
  },
]

function makePlayer(id: string, first: string, last: string, age: number, pos: PlayerPosition, ca: number, extra: Record<string, unknown> = {}) {
  return {
    id, firstName: first, lastName: last, age, clubId: HOME_ID, position: pos,
    fitness: 75 + Math.floor(ca / 10), sharpness: 60 + Math.floor(ca / 8), seasonForm: 68, form: 70,
    currentAbility: ca, potentialAbility: Math.min(100, ca + 5), morale: 68,
    attributes: { finishing: 60, dribbling: 58, passing: 62, defending: 60, stamina: 65, positioning: 62, goalkeeping: pos === PlayerPosition.Goalkeeper ? 78 : 5, corners: 55, penaltyShooting: 50, longShots: 50 },
    isInjured: false, suspensionGamesRemaining: 0, contractEnd: 9, wage: ca * 25, salary: ca * 100, value: ca * 300, goals: 0, assists: 0, gamesPlayed: 14,
    seasonStats: { goals: 0, assists: 0, gamesPlayed: 14, averageRating: 6.5 },
    careerStats: { goals: 0, assists: 0, gamesPlayed: 50, averageRating: 6.5, seasons: 3 },
    seasonHistory: [
      { season: 6, goals: 4, assists: 3, games: 18, rating: 6.4, clubId: HOME_ID },
      { season: 7, goals: 5, assists: 4, games: 20, rating: 6.7, clubId: HOME_ID },
    ],
    ...extra,
  }
}

const devPlayers = [
  // GK
  makePlayer('p-gk1', 'Anders', 'Nilsson', 30, PlayerPosition.Goalkeeper, 78),
  makePlayer('p-gk2', 'Jonas', 'Berg', 24, PlayerPosition.Goalkeeper, 65),
  // DEF
  makePlayer('p-d1', 'Mattias', 'Holm', 27, PlayerPosition.Defender, 80, { sharpness: 82 }),
  makePlayer('p-d2', 'Sven', 'Eriksson', 32, PlayerPosition.Defender, 74),
  makePlayer('p-d3', 'Patrik', 'Björk', 22, PlayerPosition.Defender, 68, { contractEnd: 9, availability: 'contract_expiring' }),
  makePlayer('p-d4', 'Lars', 'Forsberg', 29, PlayerPosition.Defender, 72),
  // HALF
  makePlayer('p-h1', 'Erik', 'Johansson', 19, PlayerPosition.Half, 62, { potentialAbility: 84, promotedFromAcademy: true }),
  makePlayer('p-h2', 'Mikael', 'Strand', 26, PlayerPosition.Half, 75),
  makePlayer('p-h3', 'Thomas', 'Ågren', 33, PlayerPosition.Half, 71, { isInjured: true, injuryDaysRemaining: 14, injuryNarrative: 'Muskelskada, vänster lår. Räknar med 2 veckor.' }),
  makePlayer('p-h4', 'Viktor', 'Lund', 28, PlayerPosition.Half, 69),
  // FWD
  makePlayer('p-f1', 'Karl', 'Lindström', 34, PlayerPosition.Forward, 75, { seasonForm: 65, fitness: 72 }),
  makePlayer('p-f2', 'Daniel', 'Pettersson', 25, PlayerPosition.Forward, 77, { isCharacterPlayer: true }),
  makePlayer('p-f3', 'Marcus', 'Svensson', 21, PlayerPosition.Forward, 64),
  makePlayer('p-f4', 'Henrik', 'Magnusson', 30, PlayerPosition.Forward, 70),
  makePlayer('p-f5', 'Johan', 'Karlsson', 28, PlayerPosition.Forward, 73, { suspensionGamesRemaining: 1 }),
]

// Standing rows for 12-lag liga; managed = 3:a, opponent = 7:e
function makeStandings() {
  const rows = [
    { clubId: 'club-s1', position: 1, played: 14, wins: 12, draws: 1, losses: 1, goalsFor: 52, goalsAgainst: 22, goalDifference: 30, points: 25 },
    { clubId: 'club-s2', position: 2, played: 14, wins: 11, draws: 2, losses: 1, goalsFor: 48, goalsAgainst: 24, goalDifference: 24, points: 24 },
    { clubId: HOME_ID,   position: 3, played: 14, wins: 10, draws: 4, losses: 0, goalsFor: 44, goalsAgainst: 20, goalDifference: 24, points: 24 },
    { clubId: 'club-s4', position: 4, played: 14, wins: 9,  draws: 2, losses: 3, goalsFor: 38, goalsAgainst: 28, goalDifference: 10, points: 20 },
    { clubId: 'club-s5', position: 5, played: 14, wins: 8,  draws: 2, losses: 4, goalsFor: 35, goalsAgainst: 30, goalDifference: 5,  points: 18 },
    { clubId: 'club-s6', position: 6, played: 14, wins: 7,  draws: 3, losses: 4, goalsFor: 32, goalsAgainst: 31, goalDifference: 1,  points: 17 },
    { clubId: AWAY_ID,   position: 7, played: 14, wins: 6,  draws: 4, losses: 4, goalsFor: 28, goalsAgainst: 30, goalDifference: -2, points: 16 },
    { clubId: 'club-s8', position: 8, played: 14, wins: 6,  draws: 3, losses: 5, goalsFor: 27, goalsAgainst: 31, goalDifference: -4, points: 15 },
    { clubId: 'club-s9', position: 9, played: 14, wins: 5,  draws: 2, losses: 7, goalsFor: 24, goalsAgainst: 36, goalDifference: -12, points: 12 },
    { clubId: 'club-s10',position: 10, played: 14, wins: 4, draws: 2, losses: 8, goalsFor: 22, goalsAgainst: 40, goalDifference: -18, points: 10 },
    { clubId: 'club-s11',position: 11, played: 14, wins: 2, draws: 2, losses: 10, goalsFor: 18, goalsAgainst: 45, goalDifference: -27, points: 6 },
    { clubId: 'club-s12',position: 12, played: 14, wins: 1, draws: 1, losses: 12, goalsFor: 14, goalsAgainst: 52, goalDifference: -38, points: 3 },
  ]
  return rows
}

// Completed league fixtures (needed for hasLeagueStarted + getFormResults)
function makeLeagueFixtures() {
  return Array.from({ length: 14 }, (_, i) => ({
    id: `fx-lg-${i}`,
    leagueId: 'liga-dev', season: 8, roundNumber: i + 1, matchday: i + 1,
    homeClubId: i % 2 === 0 ? HOME_ID : AWAY_ID,
    awayClubId: i % 2 === 0 ? AWAY_ID : HOME_ID,
    homeScore: i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1,
    awayScore: i % 3 === 0 ? 1 : i % 3 === 1 ? 2 : 3,
    status: 'completed' as const,
    events: [], isCup: false,
  }))
}

// Cup final fixture — triggers useCupFinalData
const cupFinalFixture = {
  id: 'fx-cup-final', leagueId: 'liga-dev', season: 8, roundNumber: 4, matchday: 38,
  homeClubId: HOME_ID, awayClubId: AWAY_ID,
  homeScore: 5, awayScore: 3,
  status: 'completed' as const,
  isCup: true, isKnockout: true,
  arenaName: 'Göransson Arena', attendance: 3412, events: [],
  report: { playerRatings: {}, shotsHome: 18, shotsAway: 10, onTargetHome: 9, onTargetAway: 4, savesHome: 4, savesAway: 9, cornersHome: 8, cornersAway: 4, penaltiesHome: 0, penaltiesAway: 0, possessionHome: 57, possessionAway: 43 },
}

// SM-final fixture — triggers useSMFinalData
const smFinalFixture = {
  ...cupFinalFixture,
  id: 'fx-sm-final', matchday: 40,
  isCup: false, isFinaldag: true, isNeutralVenue: true,
  arenaName: 'Studenternas IP', venueCity: 'Uppsala', attendance: 5840,
}

// 12 rounds of fitness history — båge: grundform 60→80, fitness sågtand, skärpa 50→78
const devFitnessHistory = Array.from({ length: 12 }, (_, i) => ({
  matchday: i + 1,
  avgSeasonForm: Math.round(60 + (i / 11) * 20),
  avgFitness: Math.round(55 + (Math.sin(i * 0.85 + 1) * 0.5 + 0.5) * 30),
  avgSharpness: Math.round(50 + (i / 11) * 28),
  avgMorale: 68,
  injuryCount: i % 4 === 0 ? 1 : 0,
}))

function makeGame(fixtureOverrides: object[], extra: Record<string, unknown> = {}): SaveGame {
  return {
    id: 'dev-game',
    managedClubId: HOME_ID,
    currentSeason: 8,
    currentMatchday: 16,
    currentDate: '2026-01-15',
    trainingHistory: [{ season: 8, roundNumber: 15, focus: { type: 'physical', intensity: 'normal' }, effects: {} }],
    clubs: devClubs,
    players: devPlayers,
    fixtures: fixtureOverrides,
    standings: makeStandings(),
    scoreSnapshots: {
      standingsPosition: [8, 7, 7, 5, 4, 3, 3],
      journalistRelation: [48, 50, 52, 54, 55, 56, 57],
      playerForm: [60, 62, 65, 63, 68, 70],
    },
    teamFitnessHistory: devFitnessHistory,
    managedClubPeriodisation: 'toppa',
    managedClubPeriodisationSince: 14,
    // Minimal required fields
    inbox: [], leagueId: 'liga-dev', managedClubName: 'Edsbyn BK',
    transferBids: [], scoutingReports: [],
    managerProfile: {
      id: 'mgr-dev', firstName: 'Jacob', lastName: 'Stjärne',
      age: 45, hometown: 'Uppsala',
      burnoutScore: 42, burnoutHistory: [28, 31, 35, 38, 40, 42],
      coachRivalries: [{ clubId: AWAY_ID, h2hWins: 3, h2hDraws: 2, h2hLosses: 4, personality: 'kall', intensity: 6 }],
      contractUntilSeason: 10, seasonsAtClub: 8, monthlySalary: 32,
      careerWins: 62, careerDraws: 24, careerLosses: 44,
      personalityType: 'ambitious', trait: 'ironman',
      familyStatus: 'partner',
    },
    aiCoaches: {
      [AWAY_ID]: { name: 'Per Andersson', persona: 'confident', yearsAtClub: 3, clubId: AWAY_ID },
    },
    ...extra,
  } as unknown as SaveGame
}

// Efterklang — fingered journalist (3 memories) + nemesis, så flödet visar två trådar
const efterklangGame = makeGame(makeLeagueFixtures(), {
  journalist: {
    name: 'Britta Sandström',
    persona: 'sceptical',
    relationship: 62,
    memory: [
      { season: 8, matchday: 4, event: 'good_answer', sentiment: 4, opponentShort: 'Karlsborg' },
      { season: 8, matchday: 7, event: 'bad_answer', sentiment: -5 },
      { season: 8, matchday: 9, event: 'big_win', sentiment: 6 },
    ],
  },
  nemesisTracker: {
    [AWAY_ID]: { playerId: 'np-1', name: 'Theo Dahlqvist', clubId: AWAY_ID, goalsAgainstUs: 3 },
  },
})

// economicScar — resolutions-medveten efterdyning. Varje variant har BARA en budgetkris
// (ingen journalist/nemesis) så economicScar är enda Efterklang-kandidaten och syns.
// currentMatchday=16, resolvedMatchday=13 → recency 3 (inom 10-fönstret).
const efterklangCrisisVariants: Array<{ label: string; game: SaveGame }> = [
  {
    label: 'Aktiv kris (decision-fas)',
    game: makeGame(makeLeagueFixtures(), {
      economicCrisisState: { startedSeason: 8, startedMatchday: 9, phase: 'decision', eventsFired: [] },
    }),
  },
  {
    label: 'Efterdyning · sold_star',
    game: makeGame(makeLeagueFixtures(), {
      economicCrisisState: { startedSeason: 8, startedMatchday: 9, phase: 'resolved', eventsFired: [], outcome: 'sold_star', resolvedMatchday: 13, soldToSurvivePlayerName: 'Viktor Ahlén' },
    }),
  },
  {
    label: 'Efterdyning · loan',
    game: makeGame(makeLeagueFixtures(), {
      economicCrisisState: { startedSeason: 8, startedMatchday: 9, phase: 'resolved', eventsFired: [], outcome: 'loan', resolvedMatchday: 13 },
    }),
  },
  {
    label: 'Efterdyning · mecenat',
    game: makeGame(makeLeagueFixtures(), {
      economicCrisisState: { startedSeason: 8, startedMatchday: 9, phase: 'resolved', eventsFired: [], outcome: 'mecenat', resolvedMatchday: 13 },
    }),
  },
  {
    label: 'Efterdyning · natural_recovery',
    game: makeGame(makeLeagueFixtures(), {
      economicCrisisState: { startedSeason: 8, startedMatchday: 9, phase: 'resolved', eventsFired: [], outcome: 'natural_recovery', resolvedMatchday: 13 },
    }),
  },
]

// ── Component ────────────────────────────────────────────────────────────────

const cupGame    = makeGame([...makeLeagueFixtures(), cupFinalFixture])
const smGame     = makeGame([...makeLeagueFixtures(), smFinalFixture])
const arcGame    = makeGame(makeLeagueFixtures())
const portalGame = makeGame(makeLeagueFixtures())
const squadGame  = makeGame(makeLeagueFixtures(), { captainPlayerId: 'p-d1' })
// Lugn trupp (allEmpty) för NU-stiltje: inga skador/avstängningar/låg moral
const calmPlayers = devPlayers.map(p => ({ ...p, isInjured: false, injuryDaysRemaining: 0, suspensionGamesRemaining: 0, morale: 70 }))
const stillnessGame = makeGame(makeLeagueFixtures(), { players: calmPlayers, captainPlayerId: 'p-d1' })

// Granska IA — fingerad spelad match (md 20) + andra matcher + roundSummary
const granskaFixture = {
  id: 'fx-granska', leagueId: 'liga-dev', season: 8, roundNumber: 20, matchday: 20,
  homeClubId: HOME_ID, awayClubId: AWAY_ID, homeScore: 4, awayScore: 2,
  status: 'completed' as const,
  events: [
    { minute: 8, type: 'goal', clubId: HOME_ID, playerId: 'p-f1', description: 'Mål', isCornerGoal: false },
    { minute: 22, type: 'goal', clubId: AWAY_ID, playerId: undefined, description: 'Kvittering' },
    { minute: 34, type: 'corner', clubId: HOME_ID, description: 'Hörna' },
    { minute: 41, type: 'goal', clubId: HOME_ID, playerId: 'p-h1', description: 'Mål', isCornerGoal: true },
    { minute: 58, type: 'suspension', clubId: AWAY_ID, description: 'Utvisning' },
    { minute: 67, type: 'goal', clubId: HOME_ID, playerId: 'p-f2', description: 'Mål' },
    { minute: 79, type: 'penalty', clubId: AWAY_ID, description: 'Straff' },
    { minute: 81, type: 'goal', clubId: AWAY_ID, playerId: undefined, description: 'Straffmål' },
    { minute: 88, type: 'goal', clubId: HOME_ID, playerId: 'p-f1', description: 'Mål' },
  ],
  report: { playerRatings: { 'p-f1': 8.4, 'p-h1': 7.2, 'p-f2': 7.0, 'p-d2': 5.2 }, shotsHome: 17, shotsAway: 9, onTargetHome: 9, onTargetAway: 4, savesHome: 3, savesAway: 8, cornersHome: 9, cornersAway: 3, penaltiesHome: 0, penaltiesAway: 1, possessionHome: 58, possessionAway: 42, playerOfTheMatchId: 'p-f1' },
  attendance: 478,
}
const granskaOtherFixtures = [
  { id: 'fx-o1', leagueId: 'liga-dev', season: 8, roundNumber: 20, matchday: 20, homeClubId: 'club-s1', awayClubId: 'club-s5', homeScore: 3, awayScore: 2, status: 'completed' as const, events: [] },
  { id: 'fx-o2', leagueId: 'liga-dev', season: 8, roundNumber: 20, matchday: 20, homeClubId: 'club-s8', awayClubId: 'club-s2', homeScore: 1, awayScore: 1, status: 'completed' as const, events: [] },
]
const granskaGame = makeGame([...makeLeagueFixtures(), granskaFixture, ...granskaOtherFixtures], {
  lastCompletedFixtureId: 'fx-granska', lastProcessedMatchday: 20, communityStanding: 58,
})
// Upptakt sub-states — fingerade tabeller (played=19, 3 omg kvar)
function makeUpptaktStandings(managedPoints: number, otherPoints: number[]) {
  const rows = [
    { clubId: HOME_ID, played: 19, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: managedPoints, position: 0 },
    ...otherPoints.map((p, i) => ({ clubId: `us${i}`, played: 19, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: p, position: 0 })),
  ]
  rows.sort((a, b) => b.points - a.points).forEach((r, i) => { r.position = i + 1 })
  return rows
}
// Schemalagd nästa match (md 20, grundserie) så NextMatchPrimary renderar w2-warm pcard
const upptaktNextFixture = {
  id: 'fx-upptakt-next', leagueId: 'liga-dev', season: 8, roundNumber: 20, matchday: 20,
  homeClubId: HOME_ID, awayClubId: AWAY_ID, homeScore: 0, awayScore: 0,
  status: 'scheduled' as const, events: [], isCup: false, date: '2026-02-08', tipoffHour: 14,
}
const upptaktFx = () => [...makeLeagueFixtures(), upptaktNextFixture]
const upptaktSakrat = makeGame(upptaktFx(), { currentMatchday: 19, standings: makeUpptaktStandings(34, [38, 36, 30, 28, 28, 20, 18, 16, 14, 12, 10]) })
const upptaktFarozon = makeGame(upptaktFx(), { currentMatchday: 19, standings: makeUpptaktStandings(20, [30, 30, 28, 28, 28, 28, 26, 24, 22, 12, 10]) })
const upptaktBottenstrid = makeGame(upptaktFx(), { currentMatchday: 19, standings: makeUpptaktStandings(8, [32, 30, 28, 26, 24, 22, 20, 18, 16, 10, 6]) })

// Ekonomi (Våg 4) — kassa-trend härledd ur financeLog. Två states för stroke-färgning.
function makeFinanceLog(nets: number[]) {
  return nets.map((amount, i) => ({ round: i + 1, amount, reason: 'match_income' as const, label: `Omg ${i + 1}` }))
}
// Lugn säsong: stigande kassa (positiva netton) → success-stroke
const ekonomiCalmClub = { ...devClubs[0], finances: 96000, transferBudget: 30000, wageBudget: 40000 } as unknown as Club
const ekonomiCalmGame = makeGame(makeLeagueFixtures(), {
  financeLog: makeFinanceLog([4000, 6000, 3000, 7000, 5000, 8000, 6000, 9000]),
  sponsors: [], communityActivities: {},
})
// Krissäsong: fallande kassa (negativa netton) → danger-stroke
const ekonomiCrisisClub = { ...devClubs[0], finances: 7000, transferBudget: 0, wageBudget: 28000 } as unknown as Club
const ekonomiCrisisGame = makeGame(makeLeagueFixtures(), {
  financeLog: makeFinanceLog([-3000, -5000, 2000, -7000, -4000, -6000, -3000, -8000]),
  sponsors: [], communityActivities: {},
})

// SeasonSummary — fingerade summaries för fyra states
function makeSeasonSummary(overrides: Record<string, unknown>) {
  const base = {
    season: 8, clubId: HOME_ID, clubName: 'Edsbyn BK', finalPosition: 5,
    wins: 14, draws: 4, losses: 4, goalsFor: 62, goalsAgainst: 38, goalDifference: 24, points: 32,
    totalGoals: 14, totalAssists: 10, totalCornerGoals: 4, totalCleanSheets: 6,
    longestWinStreak: 5, longestLossStreak: 2, biggestWin: { opponent: 'BGF', score: '7–1', round: 12 }, worstLoss: null,
    homeRecord: { wins: 8, draws: 2, losses: 1 }, awayRecord: { wins: 6, draws: 2, losses: 3 },
    firstHalfPoints: 15, secondHalfPoints: 17, formTrend: 'improving' as const,
    totalInjuries: 2, mostInjuredPlayer: null,
    startFinances: 60000, endFinances: 95000, financialChange: 35000,
    youthIntakeCount: 2, bestYouthProspect: null,
    roundPoints: [2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,32,32,32,32,32,32],
    narrativeSummary: 'En stark säsong.',
    boardExpectation: 'playoff' as const, metExpectation: true, expectationVerdict: 'met' as const,
    playoffResult: null, cupResult: null, signatureRubric: null, cupFinalScore: null,
    topScorer: null, topAssister: null, topRated: null, mostImproved: null, youngPlayer: null,
    storyTriggers: [],
    ...overrides,
  }
  return base
}
const seasonSumChampion = makeSeasonSummary({ finalPosition: 1, playoffResult: 'champion', expectedVerdict: 'exceeded', expectationVerdict: 'exceeded' as const })
const seasonSumTopThree = makeSeasonSummary({ finalPosition: 2, playoffResult: 'finalist', expectationVerdict: 'met' as const })
const seasonSumMidtable = makeSeasonSummary({ finalPosition: 6, playoffResult: 'quarterfinal', expectationVerdict: 'met' as const, formTrend: 'stable' as const })
const seasonGameA = makeGame(makeLeagueFixtures(), { seasonSummaries: [seasonSumChampion] })
const seasonGameB = makeGame(makeLeagueFixtures(), { seasonSummaries: [seasonSumTopThree] })
const seasonGameC = makeGame(makeLeagueFixtures(), { seasonSummaries: [seasonSumMidtable] })

const granskaRoundSummary = {
  round: 20, date: '2026-02-01', matchPlayed: true,
  communityStandingBefore: 54, communityStandingAfter: 58, communityStandingChanges: [],
  standingBefore: 5, financesBefore: 70000, financesAfter: 84000,
  injuries: ['Holm — lätt stukning, 1 vecka'], youthMatchResult: 'P19 vann 3–1',
  newInboxCount: 2,
}

// BoardMeeting fingered state — season 2+, prev-season objective history + new goals
const boardPersonalities = [
  { name: 'Margareta Sahlin', role: 'ordförande', personality: 'traditionalist' },
  { name: 'Bengt Ek', role: 'kassör', personality: 'ekonom' },
]
const newGoalsSet = [
  { id: 'g-sport', type: 'sporting', label: 'Topp 6', description: 'Ett steg upp', ownerId: 'b1', ownerPersonality: 'traditionalist', targetValue: 6, currentValue: 0, measureFn: 'placement', status: 'active', assignedSeason: 3, successReward: '', failureConsequence: '', carryOver: false },
  { id: 'g-acad', type: 'academy', label: 'En egenfostrad i startelvan', description: 'Akademin ska synas', ownerId: 'b1', ownerPersonality: 'traditionalist', targetValue: 1, currentValue: 0, measureFn: 'academy', status: 'active', assignedSeason: 3, successReward: '', failureConsequence: '', carryOver: false },
]
const stretchGoalsSet = [
  ...newGoalsSet.slice(0, 1),
  { id: 'g-sm', type: 'sporting', label: 'SM-guld', description: 'SM-final och hela vägen', ownerId: 'b1', ownerPersonality: 'modernist', targetValue: 1, currentValue: 0, measureFn: 'title', status: 'active', assignedSeason: 3, successReward: '', failureConsequence: '', carryOver: false },
]
const histA = [{ season: 1, objectiveId: 'x', result: 'met' as const, ownerReaction: 'Bra jobbat.', label: 'Kvar i serien' }]
const histB = [
  { season: 2, objectiveId: 'a', result: 'met' as const, ownerReaction: '', label: 'Topp 4' },
  { season: 2, objectiveId: 'b', result: 'met' as const, ownerReaction: '', label: 'Slutspel' },
  { season: 2, objectiveId: 'c', result: 'met' as const, ownerReaction: '', label: 'Egenfostrad i startelva' },
]
const histC = [
  { season: 2, objectiveId: 'a', result: 'failed' as const, ownerReaction: '', label: 'Topp 6' },
  { season: 2, objectiveId: 'b', result: 'failed' as const, ownerReaction: '', label: 'Undvik kvalstrid' },
  { season: 2, objectiveId: 'c', result: 'met' as const, ownerReaction: '', label: 'Egenfostrad i startelva' },
]
const boardGameA = makeGame(makeLeagueFixtures(), { currentSeason: 2, boardPersonalities, boardObjectives: newGoalsSet, boardObjectiveHistory: histA, seasonStartFinances: 62000 })
const boardGameB = makeGame(makeLeagueFixtures(), { currentSeason: 3, boardPersonalities, boardObjectives: stretchGoalsSet, boardObjectiveHistory: histB, seasonStartFinances: 40000 })
const boardGameC = makeGame(makeLeagueFixtures(), { currentSeason: 3, boardPersonalities, boardObjectives: newGoalsSet, boardObjectiveHistory: histC, seasonStartFinances: 120000 })

export function DevScenesScreen() {
  const [scene, setScene] = useState<SceneId>('cup-victory')
  const storeReady = useGameStore(s => s.game?.lastCompletedFixtureId === 'fx-granska')

  // Seed the store so all screens that call useGameStore() work
  useEffect(() => {
    const g = scene === 'cup-victory' ? cupGame
      : scene === 'sm-victory' ? smGame
      : scene === 'season-arc' ? arcGame
      : scene === 'efterklang' ? efterklangGame
      : scene === 'squad' || scene === 'portal' || scene === 'tranare' ? squadGame
      : scene === 'board-a' ? boardGameA
      : scene === 'board-b' ? boardGameB
      : scene === 'board-c' ? boardGameC
      : scene === 'stillness' ? stillnessGame
      : scene === 'granska' ? granskaGame
      : scene === 'season-a' ? seasonGameA
      : scene === 'season-b' ? seasonGameB
      : scene === 'season-c' ? seasonGameC
      : portalGame
    useGameStore.setState({ game: g, roundSummary: scene === 'granska' ? granskaRoundSummary : null } as never)
  }, [scene])

  return (
    <div style={{ background: '#080808', minHeight: '100vh' }}>
      {/* ── Nav ── */}
      <div
        data-dev-nav
        style={{
          position: 'sticky', top: 0, zIndex: 999,
          background: '#111', borderBottom: '1px solid #2a2a2a',
          padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 9, letterSpacing: '2px', color: '#555', textTransform: 'uppercase', marginRight: 4 }}>
          DEV GALLERY
        </span>
        {SCENES.map(s => (
          <button
            key={s.id}
            onClick={() => setScene(s.id)}
            style={{
              background: s.id === scene ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: `1px solid ${s.id === scene ? '#555' : '#2a2a2a'}`,
              borderRadius: 4, color: s.id === scene ? '#e0e0e0' : '#666',
              fontSize: 11, padding: '4px 10px', cursor: 'pointer',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Scene output — 375 px mobile viewport ── */}
      <div style={{ maxWidth: 375, margin: '0 auto' }}>

        {scene === 'cup-victory' && (
          <CupFinalVictoryScene game={cupGame} onComplete={() => {}} />
        )}

        {scene === 'sm-victory' && (
          <SMFinalVictoryScene game={smGame} onComplete={() => {}} />
        )}

        {scene === 'season-arc' && (
          <div style={{ padding: '20px 0' }}>
            <SeasonArcCard game={arcGame} />
          </div>
        )}

        {scene === 'portal-cards' && (
          <div
            style={{
              background: 'var(--bg-portal-surface)',
              minHeight: 'calc(100vh - 40px)',
              padding: '20px 12px',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <TabellSecondary game={portalGame} />
              <div
                style={{
                  background: 'var(--bg-portal-surface)',
                  border: '1px solid var(--bg-leather)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <FormStatusMinimal game={portalGame} />
              </div>
            </div>
          </div>
        )}

        {scene === 'efterklang' && (
          <div style={{ padding: '20px 12px', background: 'var(--bg-portal-surface)', minHeight: 'calc(100vh - 40px)' }}>
            <EfterklangSecondary game={efterklangGame} />
            <div style={{ marginTop: 28, fontSize: 8, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              ⬩ economicScar — resolutions-medveten efterdyning
            </div>
            {efterklangCrisisVariants.map(v => (
              <div key={v.label} style={{ marginTop: 14 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 6 }}>{v.label}</div>
                <EfterklangSecondary game={v.game} />
              </div>
            ))}
          </div>
        )}

        {scene === 'squad' && (
          <div style={{ height: '812px', overflow: 'hidden', position: 'relative' }}>
            <SquadScreen />
          </div>
        )}

        {scene === 'portal' && (
          <div style={{ height: '812px', overflow: 'hidden', position: 'relative' }}>
            <PortalScreen />
          </div>
        )}

        {scene === 'tranare' && (
          <div style={{ background: 'var(--bg)', padding: '12px', minHeight: '812px' }}>
            <TranareTab game={squadGame} />
          </div>
        )}

        {scene === 'board-a' && <BoardMeetingScene game={boardGameA} onComplete={() => {}} />}
        {scene === 'board-b' && <BoardMeetingScene game={boardGameB} onComplete={() => {}} />}
        {scene === 'board-c' && <BoardMeetingScene game={boardGameC} onComplete={() => {}} />}

        {scene === 'stillness' && (
          <div style={{ height: '812px', overflow: 'hidden', position: 'relative' }}>
            <SquadScreen />
          </div>
        )}

        {scene === 'granska' && storeReady && (
          <div style={{ height: '812px', overflow: 'hidden', position: 'relative' }}>
            <GranskaScreen />
          </div>
        )}

        {scene === 'playercard' && (
          <div style={{ background: 'var(--bg)', minHeight: '812px', padding: '12px' }}>
            {([
              ['Över snitt → win', [{ rating: 5.8, result: 'O' as const, opponentShortName: 'BGF' }, { rating: 6.2, result: 'V' as const, opponentShortName: 'EBK' }, { rating: 6.0, result: 'O' as const, opponentShortName: 'VÄS' }, { rating: 7.1, result: 'V' as const, opponentShortName: 'SAN' }, { rating: 7.8, result: 'V' as const, opponentShortName: 'BOL' }]],
              ['Under snitt → loss', [{ rating: 6.5, result: 'V' as const, opponentShortName: 'BGF' }, { rating: 6.0, result: 'O' as const, opponentShortName: 'EBK' }, { rating: 5.8, result: 'F' as const, opponentShortName: 'VÄS' }, { rating: 5.2, result: 'F' as const, opponentShortName: 'SAN' }, { rating: 4.9, result: 'F' as const, opponentShortName: 'BOL' }]],
              ['Neutral → subtle', [{ rating: 6.2, result: 'O' as const, opponentShortName: 'BGF' }, { rating: 5.9, result: 'F' as const, opponentShortName: 'EBK' }, { rating: 6.1, result: 'V' as const, opponentShortName: 'VÄS' }, { rating: 6.0, result: 'O' as const, opponentShortName: 'SAN' }, { rating: 6.0, result: 'O' as const, opponentShortName: 'BOL' }]],
            ] as const).map(([label, ratings]) => (
              <div key={label} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 9, letterSpacing: '2px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
                <PlayerCard player={devPlayers[10] as never} clubName="Edsbyn BK" isOwned currentSeason={8} recentRatings={ratings as never} game={portalGame} />
              </div>
            ))}
          </div>
        )}

        {(scene === 'season-a' || scene === 'season-b' || scene === 'season-c') && (() => {
          const sumMap = { 'season-a': seasonSumChampion, 'season-b': seasonSumTopThree, 'season-c': seasonSumMidtable }
          const sum = sumMap[scene as 'season-a' | 'season-b' | 'season-c']
          const isChamp = sum.playoffResult === 'champion' || sum.cupResult === 'winner'
          const posVariant = isChamp ? 'gold' : sum.finalPosition <= 3 ? 'win' : 'subtle'
          const formStroke = sum.formTrend === 'improving' ? 'success' : sum.formTrend === 'declining' ? 'danger' : 'accent'
          return (
            <div style={{ background: 'var(--bg)', padding: '20px 16px', minHeight: '812px' }}>
              <p style={{ fontSize: 9, letterSpacing: '2px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
                {scene === 'season-a' ? 'Mästare → gold' : scene === 'season-b' ? 'Topp 3 → win' : 'Mittfält → subtle'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <ScoreBlockComp score={`${sum.finalPosition}.`} variant={posVariant} label="plats" />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{sum.points} poäng</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <ScoreBlockComp score={String(sum.wins)} variant="win" label="V" compact />
                <ScoreBlockComp score={String(sum.draws)} variant="draw" label="O" compact />
                <ScoreBlockComp score={String(sum.losses)} variant="loss" label="F" compact />
              </div>
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px' }}>
                <p style={{ fontSize: 9, letterSpacing: '1.5px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>POÄNGKURVA</p>
                <SparklineComp points={sum.roundPoints} stroke={formStroke} height={40} areaFill />
              </div>
            </div>
          )
        })()}

        {scene === 'ekonomi' && (
          <div style={{ background: 'var(--bg)', minHeight: '812px', padding: '12px' }}>
            {([['Lugn säsong (stigande)', ekonomiCalmClub, ekonomiCalmGame], ['Krissäsong (fallande)', ekonomiCrisisClub, ekonomiCrisisGame]] as const).map(([label, c, g]) => (
              <div key={label} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 9, letterSpacing: '2px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
                <EkonomiTab club={c} game={g} seekSponsor={() => ({ success: false })} activateCommunity={() => ({ success: false })} setTransferBudget={() => {}} buyScoutRounds={() => {}} />
              </div>
            ))}
          </div>
        )}

        {scene === 'upptakt' && (
          <div style={{ background: 'var(--bg-portal)', minHeight: '812px', padding: '14px 0' }}>
            {([['Säkrat', upptaktSakrat], ['Farozon', upptaktFarozon], ['Bottenstrid', upptaktBottenstrid]] as const).map(([label, g]) => (
              <div key={label} style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 9, letterSpacing: '2px', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0 14px 6px' }}>{label}</div>
                <PortalUpptakt game={g} />
                <div style={{ padding: '0 14px' }}><NextMatchPrimary game={g} /></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
