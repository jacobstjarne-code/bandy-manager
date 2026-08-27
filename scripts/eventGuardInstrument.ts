/**
 * Throw-guard-instrumentet (2.5 runda 2, 2026-08-17).
 *
 * Simulerar N seeds × M säsonger, och för VARJE event som genereras under
 * körningen resolvar den ALLA dess choices (mot en engångskopia av
 * speltillståndet — probe, inte spelad) och fångar allt som kastar. Ett
 * kast betyder: choice-konstruktionen saknar ett fält vakten i
 * eventResolver.ts nu kräver — exakt den no-op-klass choice-label-svepets
 * första runda letade efter för hand (fyra no-ops hittade manuellt; detta
 * instrument hittar hela klassen mekaniskt, i hela event-universum, inte
 * bara de event en människa råkade läsa).
 *
 * Efter probe-passet resolvas EN riktig choice (seedad slumpvalt bland de
 * som INTE kastade) på det faktiska speltillståndet, så att stateful
 * maskiner (hallprövning, mecenat, patron, community-uppgraderingar,
 * klack) faktiskt fortskrider till sina djupare grenar under körningen.
 *
 * Kör med:
 *   node_modules/.bin/vite-node scripts/eventGuardInstrument.ts [--seeds=3] [--seasons=6]
 */

import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { SaveGame } from '../src/domain/entities/SaveGame'
import type { GameEvent } from '../src/domain/entities/GameEvent'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { resolveEvent } from '../src/domain/services/events/eventResolver'
import { createHeadlessGame, autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function parseArgs(): { seeds: number; seasons: number } {
  const args = process.argv.slice(2)
  let seeds = 3
  let seasons = 6
  for (const arg of args) {
    if (arg.startsWith('--seeds=')) seeds = parseInt(arg.split('=')[1], 10)
    if (arg.startsWith('--seasons=')) seasons = parseInt(arg.split('=')[1], 10)
  }
  return { seeds, seasons }
}

interface GuardThrow {
  seed: number
  season: number
  round: number | null
  eventId: string
  eventType: string
  choiceId: string
  effectType: string
  message: string
  live: boolean // true = threw on the REAL advancing choice (blocked state progression), false = probe-only
}

function cloneGame(game: SaveGame): SaveGame {
  return JSON.parse(JSON.stringify(game))
}

function collectPendingItems(game: SaveGame): GameEvent[] {
  const items: GameEvent[] = [...(game.pendingEvents ?? [])]
  if (game.pendingPressConference) items.push(game.pendingPressConference)
  if (game.pendingRefereeMeeting) items.push(game.pendingRefereeMeeting)
  if (game.pendingCSPress) items.push(game.pendingCSPress)
  return items
}

function mulberry32(seed: number): () => number {
  let a = seed
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

async function main(): Promise<void> {
  const { seeds, seasons } = parseArgs()
  console.log(`\nThrow-guard-instrumentet: ${seeds} seeds × ${seasons} säsonger`)
  console.log('─'.repeat(50))

  const throws: GuardThrow[] = []
  let totalChoicesProbed = 0
  let totalEventsSeen = 0
  const seenEventTypes = new Set<string>()

  for (let seedIdx = 0; seedIdx < seeds; seedIdx++) {
    let game = createHeadlessGame(seedIdx)
    const rand = mulberry32(seedIdx * 7919 + 13)
    let crashed = false

    for (let season = 1; season <= seasons && !crashed; season++) {
      let seasonDone = false
      let stepSeed = seedIdx * 100_000 + season * 1_000
      let guardRounds = 0
      const MAX_ROUNDS_PER_SEASON = 80 // backstop, league is ~26 + playoffs

      while (!seasonDone && guardRounds < MAX_ROUNDS_PER_SEASON) {
        guardRounds++
        game = autoSelectLineup(game)

        let roundPlayed: number | null = null
        try {
          const result = advanceToNextEvent(game, stepSeed++)
          game = result.game
          roundPlayed = result.roundPlayed
          if (result.seasonEnded || result.game.managerFired) seasonDone = true
        } catch (e) {
          console.error(`  [seed ${seedIdx}] advanceToNextEvent kraschade (season ${season}): ${e instanceof Error ? e.message : e}`)
          crashed = true
          break
        }

        // ── Probe ALL choices of ALL pending items on a throwaway clone ──
        const pending = collectPendingItems(game)
        for (const item of pending) {
          totalEventsSeen++
          seenEventTypes.add(item.type)
          const survivingChoiceIds: string[] = []
          for (const choice of item.choices) {
            totalChoicesProbed++
            try {
              resolveEvent(cloneGame(game), item.id, choice.id, rand)
              survivingChoiceIds.push(choice.id)
            } catch (e) {
              throws.push({
                seed: seedIdx, season, round: roundPlayed,
                eventId: item.id, eventType: item.type, choiceId: choice.id,
                effectType: (choice.effect as { type?: string })?.type ?? 'unknown',
                message: e instanceof Error ? e.message : String(e),
                live: false,
              })
            }
          }

          // ── Advance real state via one surviving choice (or the first, to surface a live-path throw) ──
          const pickId = survivingChoiceIds.length > 0
            ? survivingChoiceIds[Math.floor(rand() * survivingChoiceIds.length)]
            : item.choices[0]?.id
          if (pickId === undefined) continue
          try {
            game = resolveEvent(game, item.id, pickId, rand)
          } catch (e) {
            throws.push({
              seed: seedIdx, season, round: roundPlayed,
              eventId: item.id, eventType: item.type, choiceId: pickId,
              effectType: (item.choices.find(c => c.id === pickId)?.effect as { type?: string })?.type ?? 'unknown',
              message: e instanceof Error ? e.message : String(e),
              live: true,
            })
            // Bugged event can never resolve without crashing — drop it so the sim doesn't stall.
            game = {
              ...game,
              pendingEvents: (game.pendingEvents ?? []).filter(e => e.id !== item.id),
              ...(game.pendingPressConference?.id === item.id ? { pendingPressConference: undefined } : {}),
              ...(game.pendingRefereeMeeting?.id === item.id ? { pendingRefereeMeeting: undefined } : {}),
              ...(game.pendingCSPress?.id === item.id ? { pendingCSPress: undefined } : {}),
            }
          }
        }

        const resolved = autoResolvePendingScreen(game)
        game = resolved.game
        if (resolved.unresolvable) {
          console.error(`  [seed ${seedIdx}] olöst pendingScreen: ${resolved.screenType}`)
          crashed = true
          break
        }
      }
    }
    console.log(`  seed ${seedIdx}: klar${crashed ? ' (kraschade, se ovan)' : ''}`)
  }

  console.log('─'.repeat(50))
  console.log(`Events sedda: ${totalEventsSeen} (${seenEventTypes.size} distinkta typer)`)
  console.log(`Choices probade: ${totalChoicesProbed}`)
  console.log(`Kast: ${throws.length}`)
  if (throws.length > 0) {
    console.log('\nEvent-typer sedda (för täckningskontroll):')
    console.log('  ' + [...seenEventTypes].sort().join(', '))
    console.log('\nKast, grupperade per unikt (eventType, choiceId, effectType, message):')
    const byKey = new Map<string, GuardThrow[]>()
    for (const t of throws) {
      const key = `${t.eventType}::${t.choiceId}::${t.effectType}::${t.message}`
      if (!byKey.has(key)) byKey.set(key, [])
      byKey.get(key)!.push(t)
    }
    for (const [, group] of byKey) {
      const first = group[0]
      console.log(`\n  ${first.eventType} → ${first.choiceId} (${first.effectType})${first.live ? ' [LIVE — blockerade riktig spelframdrift]' : ' [probe]'}`)
      console.log(`    "${first.message}"`)
      console.log(`    sedd ${group.length}x — seeds: ${[...new Set(group.map(g => g.seed))].join(',')}`)
    }
  } else {
    console.log('\nInga kast. Alla probade choices resolvade utan att någon vakt triggade.')
  }

  const outFile = resolve(__dirname, 'stress/eventGuardInstrument_results.json')
  writeFileSync(outFile, JSON.stringify({
    _meta: { seeds, seasons, totalEventsSeen, distinctEventTypes: [...seenEventTypes].sort(), totalChoicesProbed, generatedAt: new Date().toISOString() },
    throws,
  }, null, 2))
  console.log(`\nSkriven ${outFile}`)
}

main().catch(e => {
  console.error('Instrumentet kraschade oväntat:', e)
  process.exit(1)
})
