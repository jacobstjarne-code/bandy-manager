/**
 * DevScenesScreen — dev-only gallery for visually verifying hard-to-reach surfaces.
 * Gated on import.meta.env.DEV — never shipped in production builds.
 *
 * Add a scene: extend SCENES, create fingered game via makeGame(), render below.
 */

import { useState, useEffect } from 'react'
import type { SaveGame } from '../../../domain/entities/SaveGame'
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
import { useGameStore } from '../../store/gameStore'

type SceneId = 'cup-victory' | 'sm-victory' | 'season-arc' | 'portal-cards' | 'efterklang' | 'squad' | 'portal' | 'tranare'

const SCENES: { id: SceneId; label: string }[] = [
  { id: 'cup-victory',  label: 'Cup Victory' },
  { id: 'sm-victory',   label: 'SM-Final Victory' },
  { id: 'season-arc',   label: 'SeasonArcCard (toppa, omg 16)' },
  { id: 'portal-cards', label: 'Portal Cards (mörk yta)' },
  { id: 'efterklang',   label: 'Efterklang (journalist-tråd)' },
  { id: 'squad',        label: 'SquadScreen (trupp)' },
  { id: 'portal',       label: 'PortalScreen (dashboard)' },
  { id: 'tranare',      label: 'TranareTab (manager-karaktär)' },
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
    isInjured: false, suspensionGamesRemaining: 0, contractEnd: 9, wage: ca * 25, value: ca * 300, goals: 0, assists: 0, gamesPlayed: 14,
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

// Efterklang — fingered journalist with 3 memories over 5 rounds
const efterklangGame = makeGame(makeLeagueFixtures(), {
  journalist: {
    name: 'Britta Sandström',
    persona: 'sceptical',
    relationship: 62,
    memory: [
      { season: 8, matchday: 4, event: 'big_win', sentiment: 6 },
      { season: 8, matchday: 7, event: 'bad_answer', sentiment: -5 },
      { season: 8, matchday: 9, event: 'good_answer', sentiment: 4 },
    ],
  },
})

// ── Component ────────────────────────────────────────────────────────────────

const cupGame    = makeGame([...makeLeagueFixtures(), cupFinalFixture])
const smGame     = makeGame([...makeLeagueFixtures(), smFinalFixture])
const arcGame    = makeGame(makeLeagueFixtures())
const portalGame = makeGame(makeLeagueFixtures())
const squadGame  = makeGame(makeLeagueFixtures(), { captainPlayerId: 'p-d1' })

export function DevScenesScreen() {
  const [scene, setScene] = useState<SceneId>('cup-victory')

  // Seed the store so all screens that call useGameStore() work
  useEffect(() => {
    const g = scene === 'cup-victory' ? cupGame
      : scene === 'sm-victory' ? smGame
      : scene === 'season-arc' ? arcGame
      : scene === 'efterklang' ? efterklangGame
      : scene === 'squad' || scene === 'portal' || scene === 'tranare' ? squadGame
      : portalGame
    useGameStore.setState({ game: g })
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
                  borderRadius: 6,
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
      </div>
    </div>
  )
}
