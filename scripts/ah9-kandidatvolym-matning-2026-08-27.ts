/**
 * A-H9 (DOM_AH9_ARSBOKENS_BESLUT_2026-08-27.md) — "Rapportera innan bygge",
 * fråga 1: hur många beslut per säsong kvalificerar med den nya regeln
 * (minst 2 av kriterierna namngiven person / irreversibelt / spänning),
 * i en typisk och en händelsefattig säsong? Om svaret är tjugo är
 * kriteriet för brett.
 *
 * METOD-RESERVATION: domen definierar kriterierna narrativt ("gjorde
 * valet ont", "pekade två system åt olika håll"), inte som ett datafält
 * som redan finns. Detta script approximerar med generiska proxies mot
 * EventEffect-schemat (se kommentarerna vid varje klassificerare) — det
 * är en MÄTNING för att svara på "hur bred blir poolen ungefär", inte en
 * färdig implementation av den slutgiltiga rangordningslogiken. Exakt var
 * gränsen ska gå per (eventType, choiceId) kräver samma sorts läsning per
 * källa som contentContract.ts:s egen dom redan konstaterat inte går att
 * gissa sig igenom.
 *
 * Harness: samma mönster som scripts/eventGuardInstrument.ts (advanceToNextEvent
 * + resolveEvent på riktigt speltillstånd, seedad slumpmässig choice-val).
 *
 * Kör: node_modules/.bin/vite-node scripts/ah9-kandidatvolym-matning-2026-08-27.ts
 */
import type { SaveGame } from '../src/domain/entities/SaveGame'
import type { GameEvent, EventChoice, EventEffect } from '../src/domain/entities/GameEvent'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { resolveEvent } from '../src/domain/services/events/eventResolver'
import { createHeadlessGame, autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'

const SEEDS = 6
const SEASONS = 3

function mulberry32(seed: number): () => number {
  let a = seed
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function collectPendingItems(game: SaveGame): GameEvent[] {
  const items: GameEvent[] = [...(game.pendingEvents ?? [])]
  if (game.pendingPressConference) items.push(game.pendingPressConference)
  if (game.pendingRefereeMeeting) items.push(game.pendingRefereeMeeting)
  if (game.pendingCSPress) items.push(game.pendingCSPress)
  return items
}

function allEffectsOf(effect: EventEffect): EventEffect[] {
  if (effect.type !== 'multiEffect' || !effect.subEffects) return [effect]
  try {
    const subs = JSON.parse(effect.subEffects) as EventEffect[]
    return [effect, ...subs]
  } catch {
    return [effect]
  }
}

// Proxy 1: namngiven person — refererar effekten (eller en subEffect) en
// spelare/mecenat som faktiskt existerar (går att slå upp ett namn för)?
function hasNamedPerson(effects: EventEffect[], gameBefore: SaveGame, gameAfter: SaveGame): boolean {
  for (const e of effects) {
    const pid = e.targetPlayerId ?? e.removePlayerId
    if (pid) {
      const p = gameBefore.players.find(p => p.id === pid) ?? gameAfter.players.find(p => p.id === pid)
      if (p) return true
    }
    if (e.targetMecenatId) {
      const m = (gameBefore.mecenater ?? []).find(m => m.id === e.targetMecenatId)
        ?? (gameAfter.mecenater ?? []).find(m => m.id === e.targetMecenatId)
      if (m) return true
    }
    if (e.bidId) {
      const bid = (gameBefore.transferBids ?? []).find(b => b.id === e.bidId)
      if (bid) return true // ett bud namnger alltid en spelare
    }
    if (e.type === 'patronWithdrawn' || e.type === 'spawnPatron') {
      if (gameBefore.patron || gameAfter.patron) return true
    }
    if (e.refereeId) return true
  }
  return false
}

// Proxy 2: irreversibelt — effekttyper som representerar att någon/något
// LÄMNAR eller en möjlighet stängs permanent, inte en löpande justering.
const IRREVERSIBLE_TYPES = new Set<EventEffect['type']>([
  'acceptTransfer', 'releasePlayer', 'patronWithdrawn', 'rejectTransfer',
  'hallProcess',
])
function isIrreversible(effects: EventEffect[]): boolean {
  return effects.some(e => IRREVERSIBLE_TYPES.has(e.type) || !!e.removePlayerId)
}

// Proxy 3: "spänning" (pekade två system åt olika håll, gjorde valet ont)
// — approximerad som: effekten (eller en subEffect) har ett numeriskt
// fält med NEGATIVT värde (en kostnad betalades för att få valet), ELLER
// en person förlorades. Fångar INTE alla verkliga fall (t.ex. rena
// text-svar utan sifferkostnad kan ändå ha "gjort ont" narrativt) — en
// medveten underskattning snarare än en överskattning.
function hasTension(effects: EventEffect[]): boolean {
  return effects.some(e => {
    const v = e.value ?? e.amount
    if (v !== undefined && v < 0) return true
    if (e.removePlayerId || e.type === 'patronWithdrawn' || e.type === 'rejectTransfer' || e.type === 'rejectContract') return true
    return false
  })
}

interface SeasonTally {
  seed: number
  season: number
  totalResolved: number
  qualifying: number // >= 2 av 3 kriterier
}

async function main(): Promise<void> {
  console.log(`\n=== A-H9 kandidatvolym — ${SEEDS} seeds × ${SEASONS} säsonger ===\n`)
  const tallies: SeasonTally[] = []

  for (let seedIdx = 0; seedIdx < SEEDS; seedIdx++) {
    let game = createHeadlessGame(seedIdx)
    const rand = mulberry32(seedIdx * 7919 + 13)
    let crashed = false

    for (let season = 1; season <= SEASONS && !crashed; season++) {
      let seasonDone = false
      let stepSeed = seedIdx * 100_000 + season * 1_000
      let guardRounds = 0
      let totalResolved = 0
      let qualifying = 0

      while (!seasonDone && guardRounds < 80) {
        guardRounds++
        game = autoSelectLineup(game)

        try {
          const result = advanceToNextEvent(game, stepSeed++)
          game = result.game
          if (result.seasonEnded || result.game.managerFired) seasonDone = true
        } catch (e) {
          console.error(`  [seed ${seedIdx}] kraschade säsong ${season}: ${e instanceof Error ? e.message : e}`)
          crashed = true
          break
        }

        const pending = collectPendingItems(game)
        for (const item of pending) {
          const pickId = item.choices[Math.floor(rand() * item.choices.length)]?.id
          if (pickId === undefined) continue
          const choice = item.choices.find(c => c.id === pickId) as EventChoice
          const gameBefore = game
          let gameAfter: SaveGame
          try {
            gameAfter = resolveEvent(game, item.id, pickId, rand, false)
          } catch {
            game = { ...game, pendingEvents: (game.pendingEvents ?? []).filter(e => e.id !== item.id) }
            continue
          }
          game = gameAfter

          const effects = allEffectsOf(choice.effect)
          const named = hasNamedPerson(effects, gameBefore, gameAfter)
          const irreversible = isIrreversible(effects)
          const tension = hasTension(effects)
          const score = [named, irreversible, tension].filter(Boolean).length
          totalResolved++
          if (score >= 2) qualifying++
        }

        const resolved = autoResolvePendingScreen(game)
        game = resolved.game
        if (resolved.unresolvable) { crashed = true; break }
      }

      if (!crashed) {
        tallies.push({ seed: seedIdx, season, totalResolved, qualifying })
        console.log(`  seed ${seedIdx} säsong ${season}: ${totalResolved} lösta val, ${qualifying} kvalificerar (≥2 av 3)`)
      }
    }
  }

  console.log('\n=== Sammanfattning ===\n')
  const qualCounts = tallies.map(t => t.qualifying)
  const min = Math.min(...qualCounts)
  const max = Math.max(...qualCounts)
  const avg = qualCounts.reduce((a, b) => a + b, 0) / qualCounts.length
  const zeroSeasons = tallies.filter(t => t.qualifying === 0).length
  console.log(`Kvalificerande beslut/säsong: min=${min} max=${max} snitt=${avg.toFixed(1)}`)
  console.log(`Säsonger med NOLL kvalificerande (fallback-texten skulle synas): ${zeroSeasons}/${tallies.length}`)
  console.log(`\nRådata:`)
  for (const t of tallies) console.log(`  seed=${t.seed} säsong=${t.season} lösta=${t.totalResolved} kvalificerar=${t.qualifying}`)
}

main().catch(e => {
  console.error('Mätningen kraschade:', e)
  process.exit(1)
})
