/** Targeted reproductions, explicitly NOT a two-season playthrough or a Grind 2 pass.
 * Usage: vite-node scripts/playtest-targeted-replay.ts <original-evidence-dir> <new-output-dir>
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import type { SaveGame } from '../src/domain/entities/SaveGame'
import { createNewGame } from '../src/application/useCases/createNewGame'
import { getPriorBurnoutChoice, getBurnoutRelapseText } from '../src/domain/services/burnoutMemoryTextService'
import { generateSupporterEvents } from '../src/domain/services/events/supporterEvents'
import { resolveEvent } from '../src/domain/services/events/eventResolver'
import { klackLeaderVoiceId } from '../src/domain/services/voiceIntroductionService'
import { promoteFromQueue } from '../src/domain/services/decisionBudgetService'
import { classifyVictory, generateVictoryEcho, shouldSurfaceVictoryEcho } from '../src/domain/services/postVictoryNarrativeService'
import { logNarrativeBeat } from '../src/domain/services/narrativeLogService'

const [inputArg, outputArg] = process.argv.slice(2)
assert(inputArg && outputArg, 'Provide an existing evidence directory and a NEW output directory')
const input = resolve(inputArg)
const output = resolve(outputArg)
assert.notEqual(input, output)
// No overwrites: the evidence destination must be new.
mkdirSync(output)
const manifest: Array<{ file: string; sha256: string }> = []
function save(name: string, data: unknown) {
  const json = JSON.stringify(data, null, 2)
  writeFileSync(join(output, name), json, { flag: 'wx' })
  manifest.push({ file: name, sha256: createHash('sha256').update(json).digest('hex') })
}
function load(name: string): SaveGame { return JSON.parse(readFileSync(join(input, 'saves', name), 'utf8')) }
const checks: Array<Record<string, unknown>> = []

const burnout = load('00689-s2027-d5.json')
assert.equal(getPriorBurnoutChoice(burnout), 'stepped_back')
const burnoutText = getBurnoutRelapseText(burnout, 'hog')
assert.match(burnoutText.quotes[2], /klev jag tillbaka/)
checks.push({ kind: 'unaltered-checkpoint', checkpoint: '00689-s2027-d5.json', priorChoice: 'stepped_back', text: burnoutText.quotes[2] })

for (const [firstName, secondName, expectedType] of [
  ['00415-s2026-d26.json', '00811-s2027-d15.json', 'derby_win'],
  ['00879-s2027-d20.json', '00992-s2027-d28.json', 'big_derby_win'],
] as const) {
  const first = load(firstName)
  const second = load(secondName)
  const f = first.fixtures.filter(f => f.status === 'completed' && (f.homeClubId === first.managedClubId || f.awayClubId === first.managedClubId))
    .sort((a, b) => b.matchday - a.matchday).find(f => classifyVictory(f, first.managedClubId) === expectedType)
  assert(f)
  const type = classifyVictory(f, first.managedClubId)
  assert(type)
  const echo = generateVictoryEcho(type, f, 'Motståndet', first.managedClubId, first)
  assert(echo.coffeeSemanticKey)
  // Old build never logged this branch. Explicitly apply the NEW display receipt
  // to the old trajectory; do not pretend the old save already had that receipt.
  const marked = { ...second, narrativeBeatLog: logNarrativeBeat(second, echo.coffeeSemanticKey, first.currentSeason, first.currentMatchday) }
  assert.equal(shouldSurfaceVictoryEcho(marked, echo), false)
  checks.push({ kind: 'checkpoint-with-new-display-receipt', firstName, secondName, semanticKey: echo.coffeeSemanticKey, suppressed: true })
}

for (const season of [2026, 2027]) {
  for (const choiceId of ['both', 'sture', 'elin']) {
    const base = createNewGame({ managerName: 'Riktat test', clubId: 'club_lesjofors', season, seed: 41 })
    assert(base.supporterGroup)
    const voiceId = klackLeaderVoiceId(base.managedClubId, base.supporterGroup.leader.name)
    let g: SaveGame = { ...base, currentMatchday: 5, currentDate: `${season}-11-01`, pendingEvents: [], deferredDecisions: [],
      introducedVoices: { [voiceId]: { provenance: 'legacy_assumed', source: 'migration' } } }
    const tifo = generateSupporterEvents(g, 5, new Set(), () => 0).find(e => e.id.startsWith('supporter_tifo_'))!
    assert(tifo)
    g = resolveEvent({ ...g, pendingEvents: [tifo] }, tifo.id, 'yes', undefined, true)
    assert.equal(g.supporterGroup?.tifoDone, true)
    g = { ...g, currentMatchday: 9, currentDate: `${season}-11-20` }
    const event = generateSupporterEvents(g, 9, new Set(), () => 0).find(e => e.id.startsWith('supporter_conflict_'))!
    assert(event)
    // Adversarial legacy duplicate: the resolver must consume both copies once.
    const before = { ...g, pendingEvents: [event], deferredDecisions: [{ ...event, deferredAt: 8 }] }
    save(`supporter-${season}-${choiceId}-before.json`, before)
    const resolved = resolveEvent(before, event.id, choiceId, undefined, true)
    const after = promoteFromQueue(JSON.parse(JSON.stringify(resolved)))
    assert(after.resolvedEventIds?.includes(event.id))
    assert.equal(after.pendingEvents.some(e => e.id === event.id), false)
    assert.equal(after.deferredDecisions?.some(e => e.id === event.id), false)
    assert.equal(after.resolvedChoices?.filter(c => c.eventId === event.id).length, 1)
    assert.equal(resolveEvent(after, event.id, choiceId, undefined, true), after)
    for (const round of [9, 10, 11]) {
      // Empty dedupe set deliberately tests the canonical season guard itself.
      assert.equal(generateSupporterEvents({ ...after, currentMatchday: round }, round, new Set(), () => 0).some(e => e.id === event.id), false)
    }
    save(`supporter-${season}-${choiceId}-after.json`, after)
    checks.push({ kind: 'synthetic-targeted-scenario', eventId: event.id, season, matchday: 9, resolution: choiceId,
      tifoResolvedThroughRealResolver: true, choicesRecorded: 1, reloadStable: true, regenerated: false })
  }
}
save('result.json', { scope: 'Targeted code/checkpoint replay; not a playthrough', grind2Passed: false,
  syntheticControls: ['fresh generated career per scenario', 'matchday/date set to trigger windows', 'known supporter voice', 'RNG fixed to trigger', 'duplicate deliberately placed in both queues'],
  checks })
writeFileSync(join(output, 'manifest.json'), JSON.stringify(manifest, null, 2), { flag: 'wx' })
console.log(JSON.stringify({ output, checks: checks.length, checkpointFiles: manifest.length, grind2Passed: false }))
