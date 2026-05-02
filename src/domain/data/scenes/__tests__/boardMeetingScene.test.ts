import { describe, it, expect } from 'vitest'
import { getBoardMeetingBeats, shouldTriggerBoardMeeting } from '../boardMeetingScene'
import { migrateSaveGame } from '../../../../infrastructure/persistence/saveGameMigration'
import { CLUB_TEMPLATES } from '../../../services/worldGenerator'
import type { SaveGame } from '../../../entities/SaveGame'
import type { Club } from '../../../entities/Club'

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
    board: template.board,
    clubhouse: template.clubhouse,
    ...overrides,
  }
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
    board: template?.board,
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
    seasonSummaries: [],
    version: '0.2.0',
    lastSavedAt: '2026-10-04T00:00:00Z',
    shownScenes: (overrides.shownScenes ?? []) as never,
  } as SaveGame
}

// ─── BoardMeetingScene — beats ─────────────────────────────────────────────

describe('BoardMeetingScene — getBoardMeetingBeats', () => {
  it('renderar 4 beats med inflätade siffror', () => {
    const game = makeGame({ clubId: 'club_forsbacka', squadSize: 16, cash: 330000, transferBudget: 65000, expiring: 4 })
    const beats = getBoardMeetingBeats(game)
    expect(beats).toHaveLength(4)
    expect(beats[1].body).toContain('16 spelare')
    expect(beats[1].body).toContain('330 tkr')
    expect(beats[1].body).toContain('65')
  })

  it('beat 0 är inramning med autoAdvance', () => {
    const game = makeGame()
    const beats = getBoardMeetingBeats(game)
    expect(beats[0].id).toBe('inramning')
    expect(beats[0].autoAdvance).toBe(true)
    expect(beats[0].durationMs).toBe(4000)
  })

  it('beat 1 är lagesrapport med kassör som speaker', () => {
    const game = makeGame()
    const beats = getBoardMeetingBeats(game)
    expect(beats[1].id).toBe('lagesrapport')
    expect(beats[1].cta).toBe('Förstått')
    expect(beats[1].speaker?.firstName).toBe('Lennart')
    expect(beats[1].speaker?.lastName).toBe('Dahlgren')
  })

  it('beat 2 är forvantningar med ordförande som speaker', () => {
    const game = makeGame()
    const beats = getBoardMeetingBeats(game)
    expect(beats[2].id).toBe('forvantningar')
    expect(beats[2].cta).toBe('Det går bra')
    expect(beats[2].speaker?.firstName).toBe('Lars')
  })

  it('beat 3 är avslut med ledamot som speaker', () => {
    const game = makeGame()
    const beats = getBoardMeetingBeats(game)
    expect(beats[3].id).toBe('avslut')
    expect(beats[3].cta).toBe('Då börjar vi')
    expect(beats[3].speaker?.firstName).toBe('Mikael')
  })

  it('inflätar arenanamn och styrelsemedlemmar per klubb — Forsbacka', () => {
    const game = makeGame({ clubId: 'club_forsbacka' })
    const beats = getBoardMeetingBeats(game)
    expect(beats[0].body).toContain('Slagghögen')
    expect(beats[0].body).toContain('Lars Berglund')
  })

  it('inflätar arenanamn och styrelsemedlemmar per klubb — Målilla', () => {
    const malillaGame = makeGame({ clubId: 'club_malilla' })
    const beats = getBoardMeetingBeats(malillaGame)
    expect(beats[0].body).toContain('Hyttvallen')
    expect(beats[0].body).toContain('Karin Petersson')
  })

  it('räknar utgående kontrakt korrekt', () => {
    const game = makeGame({ squadSize: 10, expiring: 3 })
    const beats = getBoardMeetingBeats(game)
    expect(beats[1].body).toContain('3 har utgående kontrakt')
  })

  it('returnerar tom array om board saknas på klubb', () => {
    const game = makeGame()
    const clubWithoutBoard = { ...game.clubs[0], board: undefined }
    const gameWithoutBoard = { ...game, clubs: [clubWithoutBoard] }
    const beats = getBoardMeetingBeats(gameWithoutBoard as never)
    expect(beats).toHaveLength(0)
  })
})

// ─── shouldTriggerBoardMeeting ────────────────────────────────────────────

describe('shouldTriggerBoardMeeting — trigger-villkor', () => {
  it('triggar säsong 1, matchday 0, inte visad', () => {
    expect(shouldTriggerBoardMeeting(makeGame({ season: 1, matchday: 0 }))).toBe(true)
  })

  it('triggar inte om redan visad', () => {
    expect(shouldTriggerBoardMeeting(makeGame({ season: 1, matchday: 0, shownScenes: ['board_meeting'] }))).toBe(false)
  })

  it('triggar inte säsong 2', () => {
    expect(shouldTriggerBoardMeeting(makeGame({ season: 2, matchday: 0 }))).toBe(false)
  })

  it('triggar inte matchday 1+', () => {
    expect(shouldTriggerBoardMeeting(makeGame({ season: 1, matchday: 1 }))).toBe(false)
  })
})

// ─── Club migration ──────────────────────────────────────────────────────

describe('Club migration — board + clubhouse', () => {
  it('lägger till board och clubhouse på saves som saknar dem', () => {
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
    const club = migrated.clubs.find(c => c.id === 'club_forsbacka')
    expect(club?.board?.chairman.firstName).toBe('Lars')
    expect(club?.board?.chairman.lastName).toBe('Berglund')
    expect(club?.clubhouse).toBe('klubbhuset vid Slagghögen')
  })

  it('bevarar befintliga board-värden — skriver inte över', () => {
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
    const club = migrated.clubs.find(c => c.id === 'club_forsbacka')
    expect(club?.board?.chairman.firstName).toBe('Befintlig')
    expect(club?.clubhouse).toBe('mitt befintliga klubbhus')
  })
})
