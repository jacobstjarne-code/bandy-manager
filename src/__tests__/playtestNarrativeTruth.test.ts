import { describe, expect, it } from 'vitest'
import { createNewGame } from '../application/useCases/createNewGame'
import type { SaveGame, InboxItem } from '../domain/entities/SaveGame'
import type { Fixture } from '../domain/entities/Fixture'
import type { GameEvent } from '../domain/entities/GameEvent'
import { FixtureStatus, InboxItemType, MatchEventType } from '../domain/enums'
import { getBurnoutRelapseText, getPriorBurnoutChoice } from '../domain/services/burnoutMemoryTextService'
import { BURNOUT_MARK_RELAPSE } from '../domain/data/managerKaraktarText'
import { getPepTalk, selectPepTalk } from '../domain/services/pepTalkService'
import { deriveContext } from '../presentation/components/match/PreMatchContext'
import { getNextOpponentTeaserFacts } from '../domain/services/nextOpponentTeaserService'
import { buildNextOpponentHook } from '../domain/data/nextOpponentHookText'
import { generateMatchStory } from '../domain/utils/matchStory'
import { interactiveCornerGoalEvent } from '../presentation/screens/match/interactiveCornerEvent'
import { getEventContextLabel } from '../domain/services/eventContextService'
import { getInboxGroup } from '../domain/services/inboxPresentationService'
import { finalizeInboxDelivery } from '../domain/services/inboxDeliveryService'
import { localPressVoiceId } from '../domain/services/voiceIntroductionService'
import { pickEfterklang } from '../domain/services/portal/pickEfterklang'

const base = createNewGame({ managerName: 'Test', clubId: 'club_lesjofors', season: 2026, seed: 41 })
function fixture(overrides: Partial<Fixture> = {}): Fixture {
  return { ...base.fixtures[0], id: 'match', homeClubId: base.managedClubId, awayClubId: 'opponent',
    isCup: false, isKnockout: false, matchday: 30, roundNumber: 6, season: 2026,
    status: FixtureStatus.Completed, homeScore: 3, awayScore: 1, events: [], date: '2027-02-11', ...overrides }
}
function game(overrides: Partial<SaveGame> = {}): SaveGame {
  return { ...base, currentMatchday: 30, fixtures: [fixture()],
    standings: [{ ...base.standings[0], clubId: base.managedClubId, played: 22, position: 5, wins: 10, losses: 8, points: 24 }],
    clubs: [...base.clubs, { ...base.clubs[0], id: 'opponent', name: 'Motståndet', shortName: 'Motståndet' }],
    pendingEvents: [], deferredDecisions: [], ...overrides }
}
function notice(type: InboxItemType, id = 'notice'): InboxItem {
  return { id, type, date: '2026-11-01', title: id, body: id, isRead: false }
}
const chronology = { season: 2026, matchday: 4, leagueRound: 1, date: '2026-11-01' }

describe('speltest — berättelsen följer kanoniskt state', () => {
  it.each(['step_back', 'push_through'] as const)('burnout minns %s även när årets ärr säger annat', choice => {
    const g = game({ currentSeason: 2027, eventLedger: [
      { type: 'decision', semanticKey: `burnoutCeiling:${choice}`, season: 2026, matchday: 20, managerId: base.id, significance: 100 },
      { type: 'decision', semanticKey: 'burnoutCeiling:push_through', season: 2027, matchday: 14, managerId: base.id, significance: 100 },
    ], managerProfile: { ...base.managerProfile!, burnoutScar: 'hardened' } })
    expect(getPriorBurnoutChoice(g)).toBe(choice === 'step_back' ? 'stepped_back' : 'hardened')
    expect(getBurnoutRelapseText(g, 'hog').quotes[2]).toContain(choice === 'step_back' ? 'klev jag tillbaka' : 'körde jag vidare')
    expect(getBurnoutRelapseText(g, 'hog').quotes).toHaveLength(BURNOUT_MARK_RELAPSE.quotesByZone.hog.length)
    expect(getBurnoutRelapseText(g, 'hog').helpers).toHaveLength(BURNOUT_MARK_RELAPSE.helpersByZone.hog.length)
  })

  it('burnout hittar inte på ett val när historiken saknas', () => {
    expect(getPriorBurnoutChoice(game({ eventLedger: [], managerProfile: { ...base.managerProfile!, diary: [], burnoutScar: 'hardened' } }))).toBeUndefined()
    expect(getBurnoutRelapseText(game(), 'hog').quotes[2]).not.toMatch(/höll jag ut|klev jag tillbaka|körde jag vidare/)
  })

  it.each([true, false])('straffseger räknas som seger både hemma=%s och borta', home => {
    const f = fixture({ isKnockout: true, homeClubId: home ? base.managedClubId : 'opponent',
      awayClubId: home ? 'opponent' : base.managedClubId, homeScore: 3, awayScore: 3,
      penaltyResult: home ? { home: 4, away: 3 } : { home: 3, away: 4 } })
    expect(selectPepTalk(game({ fixtures: [f] }))?.category).toBe('win')
    expect(getPepTalk(game({ fixtures: [f] }))).not.toMatch(/poäng|Tabellen|avgörandet/)
  })

  it('ingen slutspelstext lånar tabellkris eller poäng från serien', () => {
    for (let roundNumber = 1; roundNumber <= 22; roundNumber++) {
      const g = game({ fixtures: [fixture({ isKnockout: true, roundNumber })] })
      expect(getPepTalk(g)).not.toMatch(/poäng|Tabellen|avgörandet/)
    }
    const g = game({ fixtures: [fixture({ isKnockout: true })], standings: [{ ...game().standings[0], position: 12 }] })
    expect(selectPepTalk(g)?.category).toBe('win')
  })

  it('oavgjort hemma påstår inte bortaplan', () => {
    for (let roundNumber = 1; roundNumber <= 3; roundNumber++) {
      expect(getPepTalk(game({ fixtures: [fixture({ homeScore: 2, awayScore: 2, roundNumber })] }))).not.toContain('borta')
    }
  })

  it('förmatchens tabellkrok är inte behörig i slutspel', () => {
    const g = game({ standings: [game().standings[0], { ...game().standings[0], clubId: 'opponent', position: 4, points: 25 }] })
    expect(deriveContext(fixture(), g, true)?.trigger).toBe('table_above')
    expect(deriveContext(fixture({ isKnockout: true }), g, true)?.trigger ?? '').not.toMatch(/^table_/)
  })

  it('nästa motståndare minns senaste strafförlusten, inte ligavinsten', () => {
    const next = fixture({ id: 'next', matchday: 31, isKnockout: true, status: FixtureStatus.Scheduled })
    const g = game({ fixtures: [fixture({ id: 'league', matchday: 22 }), fixture({ id: 'qf4', isKnockout: true,
      homeScore: 3, awayScore: 3, penaltyResult: { home: 2, away: 3 } }), next] })
    const facts = getNextOpponentTeaserFacts(g)!
    expect(facts.previousMeetingThisSeason?.outcome).toBe('F')
    expect(buildNextOpponentHook(facts).factLine).toBe('De vann förra mötet.')
  })

  it('en cupvändning ger seger men inga ligapoäng', () => {
    const f = fixture({ isCup: true, events: [
      { type: MatchEventType.Goal, clubId: 'opponent', minute: 1, description: 'Mål' },
      { type: MatchEventType.Goal, clubId: base.managedClubId, minute: 2, description: 'Mål' },
    ] })
    expect(generateMatchStory(f, game())).toContain('vann till slut')
    expect(generateMatchStory(f, game())).not.toContain('poäng')
  })

  it('det interaktiva hörnmålet syns i referatets hörnräkning', () => {
    const goal = interactiveCornerGoalEvent({ minute: 8, clubId: base.managedClubId, description: 'Mål!' })
    expect(goal).toMatchObject({ isCornerGoal: true, origin: 'CORNER', type: MatchEventType.Goal })
    expect(generateMatchStory(fixture({ events: [goal] }), game())).toContain('Ett hörnmål')
  })

  it('fördröjt spelarberöm anger ursprunglig match', () => {
    const event = { relatedFixtureId: 'match', type: 'playerPraise' } as GameEvent
    expect(getEventContextLabel(event, game())).toBe('Gäller Motståndet hemma · 2027-02-11')
    expect(getEventContextLabel({ type: 'captainSpeech', occurredAt: { season: 2026, matchday: 5, date: '2026-11-01' } } as GameEvent, game())).toBe('Från 2026-11-01')
    expect(getEventContextLabel({ type: 'seasonGoalHalfway' } as GameEvent, game())).toContain('halva serien')
  })

  it.each([InboxItemType.Injury, InboxItemType.BoardFeedback, InboxItemType.Scandal, InboxItemType.LicenseReview])('%s är inte ett fabricerat svarskrav', type => {
    expect(getInboxGroup(notice(type), game())).toBe('nyheter')
  })

  it('bara ett faktiskt öppet inkommande bud kräver svar', () => {
    const n = { ...notice(InboxItemType.TransferOffer), relatedPlayerId: 'p' }
    const g = game({ transferBids: [{ playerId: 'p', direction: 'incoming', status: 'pending' }] as SaveGame['transferBids'] })
    expect(getInboxGroup(n, g)).toBe('kräver-svar')
    expect(getInboxGroup(n, { ...g, transferBids: [] })).toBe('nyheter')
  })

  it('även skadenotiser väntar på truppintroduktionen', () => {
    const result = finalizeInboxDelivery(game({ inbox: [], introducedInboxTopics: [] }), [notice(InboxItemType.Injury)], chronology)
    expect(result.inbox).toHaveLength(0)
    expect(result.deferredInbox).toHaveLength(1)
  })

  it('en direkt skriven notis kan inte kringgå röstintroduktionen', () => {
    const voiceId = localPressVoiceId(base.managedClubId, 'Maria')
    const n = { ...notice(InboxItemType.BoardFeedback), voiceId }
    const g = game({ inbox: [n], introducedVoices: {} })
    const blocked = finalizeInboxDelivery(g, [], chronology)
    expect(blocked.inbox).toHaveLength(0)
    expect(blocked.deferredInbox).toHaveLength(1)
    const known = { ...g, inbox: blocked.inbox, deferredInbox: blocked.deferredInbox,
      introducedVoices: { [voiceId]: { source: 'migration', provenance: 'legacy_assumed' } } } as SaveGame
    expect(finalizeInboxDelivery(known, [], chronology).inbox.map(i => i.id)).toContain(n.id)
  })

  it('en serie skadenyheter kan inte spräcka informationsbudgeten', () => {
    const g = game({ inbox: [], introducedInboxTopics: ['squad'] })
    const result = finalizeInboxDelivery(g, Array.from({ length: 16 }, (_, i) => notice(InboxItemType.Injury, `injury-${i}`)), chronology)
    expect(result.inbox.filter(i => !i.isRead)).toHaveLength(4)
    expect(result.deferredInbox).toHaveLength(12)
  })

  it('gammal Maria-efterklang får vila utan att minnet raderas', () => {
    const g = game({ fixtures: Array.from({ length: 6 }, (_, i) => fixture({ id: `f-${i}`, matchday: i + 1 })),
      journalist: { ...base.journalist!, name: 'Maria', memory: [{ season: 2026, matchday: 1, event: 'good_answer', sentiment: 10 }] } })
    expect(pickEfterklang(g).some(m => m.type === 'journalist')).toBe(false)
    expect(g.journalist?.memory).toHaveLength(1)
    expect(pickEfterklang({ ...g, currentMatchday: 5 }).some(m => m.type === 'journalist')).toBe(true)
  })
})
