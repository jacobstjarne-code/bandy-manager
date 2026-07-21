import { describe, it, expect } from 'vitest'
import { shouldTriggerBoardMeeting } from '../boardMeetingScene'
import { migrateSaveGame } from '../../../../infrastructure/persistence/saveGameMigration'
import { CLUB_TEMPLATES } from '../../../services/worldGenerator'
import type { SaveGame } from '../../../entities/SaveGame'
import type { Club, BoardMember } from '../../../entities/Club'

// ─── Minimal Club factory ──────────────────────────────────────────────────

function makeClub(overrides: Partial<Club> = {}): Club {
  const template = CLUB_TEMPLATES.find(t => t.id === 'club_forsbacka')!
  return {
    id: 'club_forsbacka',
    name: 'Forsbacka',
    shortName: 'Forsbacka',
    region: 'Gästrikland',
    reputation: 85,
    finances: 330000,
    wageBudget: 120000,
    transferBudget: 65000,
    youthQuality: 75,
    youthRecruitment: 70,
    youthDevelopment: 72,
    facilities: 80,
    hasArtificialIce: true,
    boardExpectation: 'win_league' as never,
    fanExpectation: 'win_league' as never,
    preferredStyle: 'technical' as never,
    activeTactic: {} as never,
    squadPlayerIds: [],
    arenaName: 'Slagghögen',
    clubhouse: template.clubhouse,
    ...overrides,
  }
}

// KF4 (2026-06-21): styrelsen lever på game.board (EN modell). Bygg den från template-namn
// + en personlighet per roll, precis som createNewGame/migration gör.
function makeBoard(clubId: string): BoardMember[] {
  const tb = CLUB_TEMPLATES.find(t => t.id === clubId)?.board
    ?? CLUB_TEMPLATES[0].board
  return [
    { id: 'ordforande-0', ...tb.chairman, role: 'ordförande', personality: 'supporter' },
    { id: 'kassor-0', ...tb.treasurer, role: 'kassör', personality: 'ekonom' },
    { id: 'ledamot-0', ...tb.member, role: 'ledamot', personality: 'traditionalist' },
  ]
}

// ─── Minimal SaveGame factory ──────────────────────────────────────────────

function makeGame(overrides: {
  clubId?: string
  squadSize?: number
  cash?: number
  transferBudget?: number
  season?: number
  matchday?: number
  shownScenes?: string[]
  expiring?: number
} = {}): SaveGame {
  const clubId = overrides.clubId ?? 'club_forsbacka'
  const squadSize = overrides.squadSize ?? 16
  const season = overrides.season ?? 1
  const expiring = overrides.expiring ?? 3

  const template = CLUB_TEMPLATES.find(t => t.id === clubId)
  const club = makeClub({
    id: clubId,
    finances: overrides.cash ?? 330000,
    transferBudget: overrides.transferBudget ?? 65000,
    squadPlayerIds: Array.from({ length: squadSize }, (_, i) => `p${i}`),
    arenaName: template?.arenaName,
    clubhouse: template?.clubhouse,
  })

  // Build fake players with contractUntilSeason = season for 'expiring' count
  const players = Array.from({ length: squadSize }, (_, i) => ({
    id: `p${i}`,
    contractUntilSeason: i < expiring ? season : season + 2,
  }))

  return {
    id: 'test',
    managerName: 'Test',
    managedClubId: clubId,
    currentDate: '2026-10-04',
    currentSeason: season,
    currentMatchday: overrides.matchday ?? 0,
    clubs: [club],
    board: makeBoard(clubId),
    players: players as never,
    fixtures: [],
    standings: [],
    inbox: [],
    league: {} as never,
    transferState: {} as never,
    youthIntakeHistory: [],
    matchWeathers: [],
    managedClubTraining: 'balanced' as never,
    trainingHistory: [],
    playoffBracket: null,
    cupBracket: null,
    pendingEvents: [],
    transferBids: [],
    handledContractPlayerIds: [],
    sponsors: [],
    activeTalentSearch: null,
    talentSearchResults: [],
    mentorships: [],
    loanDeals: [],
    academyLevel: 'basic' as never,
    scoutReports: {},
    activeScoutAssignment: null,
    scoutBudget: 0,
    seasonSummaries: Array.from({ length: Math.max(0, season - 1) }, (_, i) => ({ season: season - 1 - i } as never)),
    version: '0.2.0',
    lastSavedAt: '2026-10-04T00:00:00Z',
    shownScenes: (overrides.shownScenes ?? []) as never,
  } as SaveGame
}

// ─── shouldTriggerBoardMeeting ────────────────────────────────────────────
// 2026-07-21: getBoardMeetingBeats-testblocket raderat samtidigt som
// funktionen (superseterat förstautkast, se boardMeetingScene.ts:s
// filhuvud). Den levande scenens täckning ligger i BoardMeetingScene-
// relaterade tester (boardMeetingCopy/boardMeetingStateResolver).

describe('shouldTriggerBoardMeeting — trigger-villkor', () => {
  it('triggar inte säsong 1 (ArrivalScene täcker det)', () => {
    expect(shouldTriggerBoardMeeting(makeGame({ season: 1, matchday: 0 }))).toBe(false)
  })

  it('triggar säsong 2, matchday 0, inte visad', () => {
    expect(shouldTriggerBoardMeeting(makeGame({ season: 2, matchday: 0 }))).toBe(true)
  })

  it('triggar inte om redan visad', () => {
    expect(shouldTriggerBoardMeeting(makeGame({ season: 2, matchday: 0, shownScenes: ['board_meeting'] }))).toBe(false)
  })

  it('triggar inte matchday 1+', () => {
    expect(shouldTriggerBoardMeeting(makeGame({ season: 2, matchday: 1 }))).toBe(false)
  })
})

// ─── Club migration (KF4: club.board → game.board) ─────────────────────────

describe('Board migration — game.board + clubhouse', () => {
  it('seedar game.board och clubhouse på saves som saknar styrelse-data', () => {
    const oldSave = {
      id: 'old',
      managerName: 'Test',
      managedClubId: 'club_forsbacka',
      currentDate: '2026-10-04',
      currentSeason: 1,
      clubs: [
        {
          id: 'club_forsbacka',
          name: 'Forsbacka',
          // board och clubhouse saknas
        },
      ],
      players: [],
      fixtures: [],
      standings: [],
      inbox: [],
      league: {},
      transferState: {},
      youthIntakeHistory: [],
      matchWeathers: [],
      managedClubTraining: 'balanced',
      trainingHistory: [],
      playoffBracket: null,
      cupBracket: null,
      pendingEvents: [],
      transferBids: [],
      handledContractPlayerIds: [],
      sponsors: [],
      activeTalentSearch: null,
      talentSearchResults: [],
      mentorships: [],
      loanDeals: [],
      academyLevel: 'basic',
      scoutReports: {},
      activeScoutAssignment: null,
      scoutBudget: 0,
      seasonSummaries: [],
      version: '0.1.0',
      lastSavedAt: '2026-10-04T00:00:00Z',
    }

    const migrated = migrateSaveGame(oldSave)
    const chair = migrated.board?.find(m => m.role === 'ordförande')
    expect(chair?.firstName).toBe('Lars')
    expect(chair?.lastName).toBe('Berglund')
    const club = migrated.clubs.find(c => c.id === 'club_forsbacka')
    expect(club?.clubhouse).toBe('klubbhuset vid Slagghögen')
    // KF4: club.board ska vara borta (konsoliderat till game.board)
    expect((club as Record<string, unknown> | undefined)?.board).toBeUndefined()
  })

  it('bevarar befintliga club.board-namn — template skriver inte över egna namn', () => {
    const existingBoard = {
      chairman: { firstName: 'Befintlig', lastName: 'Chef', age: 50, gender: 'm' as const },
      treasurer: { firstName: 'Befintlig', lastName: 'Kassör', age: 45, gender: 'f' as const },
      member: { firstName: 'Befintlig', lastName: 'Ledamot', age: 60, gender: 'm' as const },
    }
    const saveWithBoard = {
      id: 'existing',
      managerName: 'Test',
      managedClubId: 'club_forsbacka',
      currentDate: '2026-10-04',
      currentSeason: 1,
      clubs: [
        {
          id: 'club_forsbacka',
          name: 'Forsbacka',
          board: existingBoard,
          clubhouse: 'mitt befintliga klubbhus',
        },
      ],
      players: [],
      fixtures: [],
      standings: [],
      inbox: [],
      league: {},
      transferState: {},
      youthIntakeHistory: [],
      matchWeathers: [],
      managedClubTraining: 'balanced',
      trainingHistory: [],
      playoffBracket: null,
      cupBracket: null,
      pendingEvents: [],
      transferBids: [],
      handledContractPlayerIds: [],
      sponsors: [],
      activeTalentSearch: null,
      talentSearchResults: [],
      mentorships: [],
      loanDeals: [],
      academyLevel: 'basic',
      scoutReports: {},
      activeScoutAssignment: null,
      scoutBudget: 0,
      seasonSummaries: [],
      version: '0.2.0',
      lastSavedAt: '2026-10-04T00:00:00Z',
    }

    const migrated = migrateSaveGame(saveWithBoard)
    const chair = migrated.board?.find(m => m.role === 'ordförande')
    expect(chair?.firstName).toBe('Befintlig')
    expect(chair?.lastName).toBe('Chef')
    const club = migrated.clubs.find(c => c.id === 'club_forsbacka')
    expect(club?.clubhouse).toBe('mitt befintliga klubbhus')
  })
})
