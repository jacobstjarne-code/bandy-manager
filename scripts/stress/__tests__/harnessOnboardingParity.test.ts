/**
 * KÖRORDER 2026-09-18 §1 — harnessen ska mäta samma spel som spelas.
 *
 * AUDIT_SPAKSVEP_TEXTEXPONERING_2026-09-18 §2.6 visade tre tillståndsövergångar
 * som bodde i presentationslagret och därför aldrig inträffade headless. Varje
 * GRIND-körning och varje mätskript sedan augusti körde utan kontraktskrav, utan
 * besvarade beslutskort och med klack-/politikerkort låsta bakom röstgrinden.
 * De här testerna låser fast att de tre övergångarna nu finns i harnessen.
 */
import { describe, it, expect } from 'vitest'
import { createHeadlessGame, autoResolvePendingScreen, autoSelectLineup, autoResolvePendingEvents } from '../fixtures'
import { advanceToNextEvent } from '../../../src/application/useCases/roundProcessor'
import {
  isVoiceIntroduced, boardVoiceId, klackLeaderVoiceId,
  completeOnboarding, introduceInboxTopic, INBOX_TOPIC_SCREENS,
} from '../../../src/domain/services/voiceIntroductionService'
import { createNewGame } from '../../../src/application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../../src/domain/services/worldGenerator'
import { mulberry32 } from '../../../src/domain/utils/random'
import type { SaveGame } from '../../../src/domain/entities/SaveGame'
import type { ContractDemand } from '../../../src/domain/services/contractDemandService'

describe('§1.3 — createHeadlessGame har passerat onboardingen', () => {
  it('styrelsens röster är introducerade direkt, precis som efter Tillträdet', () => {
    const game = createHeadlessGame(0)
    expect(game.onboardingComplete).toBe(true)
    const chairman = game.board?.find(m => m.role === 'ordförande')
    expect(chairman).toBeDefined()
    expect(isVoiceIntroduced(game, boardVoiceId(game.managedClubId, chairman!.id))).toBe(true)
  })

  it('klackledarens röst är antingen introducerad eller köad som introduktionskort — aldrig tyst utelämnad', () => {
    const game = createHeadlessGame(0)
    const sg = game.supporterGroup
    expect(sg).toBeDefined()
    const voiceId = klackLeaderVoiceId(game.managedClubId, sg!.leader.name)
    const queued = (game.pendingEvents ?? []).some(e => e.introducesVoiceId === voiceId)
    expect(isVoiceIntroduced(game, voiceId) || queued).toBe(true)
  })
})

describe('§1.5 — inbox-ämnesgrinden (TILLÄGG 5, LESSONS #62 tredje instansen)', () => {
  it('createHeadlessGame introducerar samma inbox-ämnen som en spelare efter Tillträdet plus ett besök på varje huvudskärm', () => {
    // Referensen byggs manuellt ur EXAKT samma delade funktion produktionens
    // markScreenVisited anropar (introduceInboxTopic) — inte en egen andra
    // sanning. En riktig spelare besöker Trupp, Klubb och Transfers under de
    // första omgångarna; headless gjorde det aldrig, så varje inbox-post med
    // ämnet `club` eller `transfers` filtrerades tyst bort i ALLA mätningar,
    // §5.1:s 23,15-tal inräknat.
    // Samma konstruktion som createHeadlessGame(0) använder internt, fast utan
    // fixtures.ts som mellanhand — så testet inte kan bli grönt bara för att
    // det råkar anropa samma helper som produktionskoden det ska verifiera.
    const clubTemplate = CLUB_TEMPLATES[0 % CLUB_TEMPLATES.length]
    const raw = createNewGame({ managerName: 'Referens', clubId: clubTemplate.id, seed: 0 })
    const reference = INBOX_TOPIC_SCREENS.reduce(introduceInboxTopic, completeOnboarding(raw))

    const headless = createHeadlessGame(0)

    expect(headless.onboardingComplete).toBe(reference.onboardingComplete)
    expect(new Set(headless.introducedInboxTopics ?? [])).toEqual(new Set(reference.introducedInboxTopics ?? []))
    for (const topic of INBOX_TOPIC_SCREENS) {
      expect(headless.introducedInboxTopics ?? [], `ämnet "${topic}" saknas i headless`).toContain(topic)
    }
    // introducedVoices jämförs som mängd av NYCKLAR — röstobjektens payload
    // (provenance/source) skiljer sig avsiktligt mellan headless-seedning och
    // en riktig sessions Tillträdet-flöde; det är NÄRVARON som ska matcha.
    expect(new Set(Object.keys(headless.introducedVoices ?? {})))
      .toEqual(new Set(Object.keys(reference.introducedVoices ?? {})))
  })
})

describe('§1.1 — season_summary lämnar inte kontraktskraven bakom sig', () => {
  it('övergången season_summary → contract_demands körs och höjer lönerna enligt A-H2b-policyn', () => {
    const base = createHeadlessGame(0)
    const managed = base.players.filter(p => p.clubId === base.managedClubId).slice(0, 3)
    expect(managed.length).toBeGreaterThan(0)

    const demands: ContractDemand[] = managed.map(p => ({
      playerId: p.id,
      currentSalary: p.salary,
      minSalary: p.salary + 5_000,
    }))

    const withSummary: SaveGame = {
      ...base,
      pendingScreen: 'season_summary' as SaveGame['pendingScreen'],
      pendingContractDemands: demands,
    }

    const resolved = autoResolvePendingScreen(withSummary)
    expect(resolved.unresolvable).toBe(false)
    // Skärmen ska vara helt dränerad i SAMMA anrop — inte lämna contract_demands hängande.
    expect(resolved.game.pendingScreen).toBeNull()
    expect(resolved.game.pendingContractDemands).toBeUndefined()

    const raised = resolved.game.players.filter(p => {
      const before = base.players.find(b => b.id === p.id)
      return before !== undefined && p.salary > before.salary
    })
    expect(raised.length).toBeGreaterThan(0)
  })

  it('utan kontraktskrav går season_summary rakt till null, som förut', () => {
    const base = createHeadlessGame(0)
    const withSummary: SaveGame = { ...base, pendingScreen: 'season_summary' as SaveGame['pendingScreen'] }
    const resolved = autoResolvePendingScreen(withSummary)
    expect(resolved.game.pendingScreen).toBeNull()
  })
})

describe('§1.2/§1.4 — beslutskort besvaras och fastnar inte bakom röstgrinden', () => {
  it('ett röstgatat kort ligger inte kvar obesvarat omgång efter omgång', () => {
    let game = createHeadlessGame(3)
    const rand = mulberry32(3 * 7919 + 17)
    const seenAfterAttempt = new Map<string, number>()
    const attempted = new Set<string>()

    for (let i = 0; i < 20; i++) {
      game = autoSelectLineup(game)
      for (const e of game.pendingEvents ?? []) {
        if (attempted.has(e.id)) seenAfterAttempt.set(e.id, (seenAfterAttempt.get(e.id) ?? 0) + 1)
        attempted.add(e.id)
      }
      game = autoResolvePendingEvents(game, rand)
      const r = advanceToNextEvent(game, 3 * 100_000 + i)
      game = r.game
      if (r.seasonEnded || game.managerFired) break
      game = autoResolvePendingScreen(game).game
    }

    // Röstintroduktioner är budgeterade till en per matchdag
    // (MAX_VOICE_INTRODUCTIONS_PER_MATCHDAY) och får därför köa några omgångar.
    // Allt ANNAT som ligger kvar efter ett resolve-försök är ett kort spelaren
    // inte kan agera på — exakt buggen §1 fanns till för (supporter_away_trip
    // låg 24 omgångar före fixen).
    const stuckNonIntro = [...seenAfterAttempt.entries()]
      .filter(([id, rounds]) => rounds > 3 && !id.startsWith('voice_intro_'))
    expect(stuckNonIntro).toEqual([])
  })
})
