import { describe, it, expect } from 'vitest'
import { mkdtempSync, writeFileSync, unlinkSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { scanGenereringskontrakt, findEventConstructionSites, checkGenereringskontrakt } from '../../tests/grind/genereringskontrakt'
import { createNewGame } from '../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../domain/services/worldGenerator'
import { generatePatronEvents, generatePatronEmergenceEvent } from '../domain/services/events/patronEvents'
import type { SaveGame } from '../domain/entities/SaveGame'

/**
 * PÅSTÅENDEGRINDEN, genererings-tids-lagret — patronEvents.ts-piloten
 * plus de utvidgade skivorna hallProcessService.ts, postAdvanceEvents.ts
 * och eventFactories.ts
 * (DOM_PASTAENDE_GENERERINGSKONTRAKT_2026-09-08).
 *
 * Två halvor, samma disciplin som nivå 1/2: en STATISK del (varje
 * GameEvent-konstruktion bär en giltig proofSource-form, meta-testad mot
 * en återskapad kropp som bevisar grinden fångar sin egen anledning att
 * finnas) och en RUNTIME-del (för state-predicate-formen: när en verklig
 * spelstate faktiskt uppfyller villkoret, är `evaluatedTrue` sant — samma
 * boolean som gejtade pushen, inte en omskriven kopia).
 */

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '../..')

const PARTICIPATING_FILES = [
  'src/domain/services/events/patronEvents.ts',
  'src/domain/services/events/hallProcessService.ts',
  'src/domain/services/events/postAdvanceEvents.ts',
  'src/domain/services/events/eventFactories.ts',
].map(p => join(REPO_ROOT, p))

function makeGame(): SaveGame {
  return createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
}

describe('PÅSTÅENDEGRINDEN — genererings-tids-kontraktet', () => {
  it('statisk baseline: varje GameEvent-konstruktion i deltagande filer bär en giltig proofSource', () => {
    const violations = scanGenereringskontrakt(PARTICIPATING_FILES)
    expect(violations, JSON.stringify(violations, null, 2)).toHaveLength(0)
  })

  it('rapporterar hur många event-konstruktioner som faktiskt granskades', () => {
    const sites = PARTICIPATING_FILES.flatMap(f => findEventConstructionSites(f))
    // 8 patronkonstruktioner + 10 hallprocesskonstruktioner + 6 direkta
    // postAdvance-konstruktioner + 17 fabriker. Ett lägre tal
    // betyder att en fil eller en konstruktionsform fallit ur svepet.
    expect(sites.length).toBeGreaterThanOrEqual(41)
  })

  it('meta: en GameEvent-konstruktion utan proofSource fångas', () => {
    const dir = mkdtempSync(join(tmpdir(), 'genereringskontrakt-meta-'))
    const file = join(dir, 'missingProof.ts')
    writeFileSync(file, `
      export function generateSomethingEvent(game) {
        const events = []
        events.push({
          id: 'x',
          type: 'patronEvent',
          body: 'Något har hänt.',
          choices: [],
        })
        return events
      }
    `)
    try {
      const violations = checkGenereringskontrakt(file)
      expect(violations.some(v => v.kind === 'proofSource-saknas')).toBe(true)
    } finally {
      unlinkSync(file)
    }
  })

  it('meta: en proofSource med ogiltig form fångas', () => {
    const dir = mkdtempSync(join(tmpdir(), 'genereringskontrakt-meta-'))
    const file = join(dir, 'invalidForm.ts')
    writeFileSync(file, `
      export function generateSomethingEvent(game) {
        const events = []
        events.push({
          id: 'x',
          type: 'patronEvent',
          body: 'Något har hänt.',
          proofSource: { form: 'vibes', description: 'kändes rätt' },
          choices: [],
        })
        return events
      }
    `)
    try {
      const violations = checkGenereringskontrakt(file)
      expect(violations.some(v => v.kind === 'proofSource-ogiltig-form')).toBe(true)
    } finally {
      unlinkSync(file)
    }
  })

  it('friskt: en giltig proofSource (state-predicate) flaggas inte', () => {
    const dir = mkdtempSync(join(tmpdir(), 'genereringskontrakt-meta-'))
    const file = join(dir, 'validProof.ts')
    writeFileSync(file, `
      export function generateSomethingEvent(game) {
        const events = []
        const due = game.happiness < 60
        if (due) {
          events.push({
            id: 'x',
            type: 'patronEvent',
            body: 'Något har hänt.',
            proofSource: { form: 'state-predicate', description: 'happiness < 60', evaluatedTrue: due },
            choices: [],
          })
        }
        return events
      }
    `)
    try {
      const violations = checkGenereringskontrakt(file)
      expect(violations, JSON.stringify(violations, null, 2)).toHaveLength(0)
    } finally {
      unlinkSync(file)
    }
  })

  it('friskt: en giltig proofSource (ledger-formen, ren funktionsretur) flaggas inte', () => {
    const dir = mkdtempSync(join(tmpdir(), 'genereringskontrakt-meta-'))
    const file = join(dir, 'validLedgerProof.ts')
    writeFileSync(file, `
      export function generateSomethingEvent(game) {
        return {
          id: 'x',
          type: 'patronEvent',
          body: 'Något har hänt.',
          proofSource: { form: 'ledger', ledgerType: 'patron_emerge' },
          choices: [],
        }
      }
    `)
    try {
      const violations = checkGenereringskontrakt(file)
      expect(violations, JSON.stringify(violations, null, 2)).toHaveLength(0)
    } finally {
      unlinkSync(file)
    }
  })

  describe('runtime: state-predicate-formens evaluatedTrue är sant när det verkliga villkoret faktiskt håller', () => {
    function withPatron(overrides: Partial<NonNullable<SaveGame['patron']>>): SaveGame {
      const game = makeGame()
      return {
        ...game,
        currentSeason: 2026,
        patron: {
          id: 'patron_testsson', name: 'Patron Testsson', business: 'Testbruket',
          influence: 50, happiness: 50, contribution: 75000, isActive: true,
          goodwill: 80, totalContributed: 0, demands: [], introducedSeason: 2025,
          ...overrides,
        },
      }
    }

    function assertAllStatePredicatesTrue(events: ReturnType<typeof generatePatronEvents>) {
      expect(events.length).toBeGreaterThan(0)
      for (const event of events) {
        expect(event.proofSource, `${event.id} saknar proofSource`).toBeDefined()
        if (event.proofSource?.form === 'state-predicate') {
          expect(event.proofSource.evaluatedTrue, `${event.id}: predikatet "${event.proofSource.description}" var falskt trots att eventet pushades`).toBe(true)
        }
      }
    }

    it('patron_intro', () => {
      const game = withPatron({ introducedSeason: undefined })
      assertAllStatePredicatesTrue(generatePatronEvents(game, 3, new Set(), () => 0))
    })

    it('patron_unhappy', () => {
      const game = withPatron({ happiness: 30 })
      assertAllStatePredicatesTrue(generatePatronEvents(game, 7, new Set(), () => 0))
    })

    it('patron_withdraw', () => {
      const game = withPatron({ happiness: 10 })
      assertAllStatePredicatesTrue(generatePatronEvents(game, 8, new Set(), () => 0))
    })

    it('patron_style', () => {
      const game = withPatron({ happiness: 50, wantsStyle: 'attacking' })
      assertAllStatePredicatesTrue(generatePatronEvents(game, 12, new Set(), () => 0))
    })

    it('patron_bonus', () => {
      const game = withPatron({ happiness: 90 })
      assertAllStatePredicatesTrue(generatePatronEvents(game, 12, new Set(), () => 0))
    })

    it('patron_influence_60', () => {
      const game = withPatron({ influence: 65, goodwill: 50 })
      assertAllStatePredicatesTrue(generatePatronEvents(game, 5, new Set(), () => 0))
    })

    it('patron_ignored', () => {
      const game = withPatron({ influence: 40, goodwill: 10 })
      assertAllStatePredicatesTrue(generatePatronEvents(game, 5, new Set(), () => 0))
    })

    it('patron_emerge — evaluatedTrue sant när eventProcessor.ts:s gate faktiskt håller (fotfäste-era, CS över tröskeln)', () => {
      const base = makeGame()
      const game: SaveGame = {
        ...base,
        currentSeason: 2026,
        patron: undefined,
        communityStanding: 65,
        trainerArc: { seasonCount: 1, bestFinish: 6, titlesWon: 0 },
      }
      const event = generatePatronEmergenceEvent(game, () => 0)!
      expect(event).not.toBeNull()
      expect(event.proofSource?.form).toBe('state-predicate')
      if (event.proofSource?.form === 'state-predicate') {
        expect(event.proofSource.evaluatedTrue).toBe(true)
      }
    })

    it('patron_emerge — evaluatedTrue ärligt falskt när funktionen (avsiktligt, som i patronEventTruth.test.ts) kallas isolerat utan att eventProcessor.ts:s gate håller', () => {
      const base = makeGame()
      const game: SaveGame = { ...base, currentSeason: 2026, patron: undefined }
      const event = generatePatronEmergenceEvent(game, () => 0)!
      expect(event.proofSource?.form).toBe('state-predicate')
      if (event.proofSource?.form === 'state-predicate') {
        // Fresh game: communityStanding under tröskeln — ingen kastning (se
        // patronEvents.ts:s kommentar om varför), bara en ärlig false. Detta
        // ÄR kontraktets poäng: en integrationskonsument kan filtrera på
        // evaluatedTrue, en isolerad enhetstest (som denna och den befintliga
        // patronEventTruth.test.ts) kan fortfarande testa generatorns form.
        expect(event.proofSource.evaluatedTrue).toBe(false)
      }
    })
  })
})
