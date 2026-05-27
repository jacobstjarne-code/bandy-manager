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
import { useGameStore } from '../../store/gameStore'

type SceneId = 'cup-victory' | 'sm-victory' | 'season-arc' | 'portal-cards'

const SCENES: { id: SceneId; label: string }[] = [
  { id: 'cup-victory',   label: 'Cup Victory' },
  { id: 'sm-victory',    label: 'SM-Final Victory' },
  { id: 'season-arc',    label: 'SeasonArcCard (toppa, omg 16)' },
  { id: 'portal-cards',  label: 'Portal Cards (mörk yta)' },
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

const devPlayers = [
  {
    id: 'p1', firstName: 'Karl', lastName: 'Lindström', age: 34,
    clubId: HOME_ID, position: PlayerPosition.Forward,
    fitness: 72, sharpness: 78, seasonForm: 65, form: 68,
    currentAbility: 75, potentialAbility: 76, morale: 70,
    attributes: { finishing: 74, dribbling: 68, passing: 65, defending: 40, stamina: 52, positioning: 65, goalkeeping: 5, corners: 70, penaltyShooting: 65, longShots: 60 },
    isInjured: false, contractEnd: 9, wage: 1800, value: 22000, goals: 8, assists: 5, gamesPlayed: 14,
  },
  {
    id: 'p2', firstName: 'Erik', lastName: 'Johansson', age: 19,
    clubId: HOME_ID, position: PlayerPosition.Half,
    fitness: 82, sharpness: 55, seasonForm: 70, form: 72,
    currentAbility: 62, potentialAbility: 82, morale: 75,
    attributes: { finishing: 58, dribbling: 64, passing: 70, defending: 60, stamina: 74, positioning: 62, goalkeeping: 5, corners: 55, penaltyShooting: 50, longShots: 55 },
    isInjured: false, contractEnd: 10, wage: 1200, value: 18000, goals: 3, assists: 7, gamesPlayed: 14,
  },
  {
    id: 'p3', firstName: 'Mattias', lastName: 'Holm', age: 27,
    clubId: HOME_ID, position: PlayerPosition.Defender,
    fitness: 85, sharpness: 82, seasonForm: 78, form: 74,
    currentAbility: 80, potentialAbility: 81, morale: 68,
    attributes: { finishing: 40, dribbling: 52, passing: 68, defending: 80, stamina: 74, positioning: 76, goalkeeping: 5, corners: 60, penaltyShooting: 55, longShots: 45 },
    isInjured: false, contractEnd: 9, wage: 2100, value: 28000, goals: 1, assists: 3, gamesPlayed: 14,
  },
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

function makeGame(fixtureOverrides: object[]): SaveGame {
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
  } as unknown as SaveGame
}

// ── Component ────────────────────────────────────────────────────────────────

const cupGame   = makeGame([...makeLeagueFixtures(), cupFinalFixture])
const smGame    = makeGame([...makeLeagueFixtures(), smFinalFixture])
const arcGame   = makeGame(makeLeagueFixtures())
const portalGame = makeGame(makeLeagueFixtures())

export function DevScenesScreen() {
  const [scene, setScene] = useState<SceneId>('cup-victory')

  // Seed the store so components that call useGameStore() work (SeasonArcCard actions)
  useEffect(() => {
    const g = scene === 'cup-victory' ? cupGame
      : scene === 'sm-victory' ? smGame
      : scene === 'season-arc' ? arcGame
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
      </div>
    </div>
  )
}
