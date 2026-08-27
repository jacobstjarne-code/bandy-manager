/**
 * Åskådarekonomin — andra kandidaten (Jacobs order 2026-08-27, efter att
 * den första kastades): "Nästa kandidat med avtagande marginalintäkt —
 * kiosken skalar med kvadratroten av publiken eller mot en mättnadskurva,
 * inte linjärt. Och Heros som blir SÄMRE på dyraste tiern betyder att
 * golvet ska vara relativt driftskostnaden, inte ett fast tal."
 *
 * Två ändringar mot den kastade kandidaten (RAPPORT_ASKADAREKONOMIN_
 * MATNING_2026-08-26.md):
 * 1. sqrt(attendance) istf linjär attendance — komprimerar spannet mellan
 *    en svag klubb (~172 publik) och en stark (~1859 publik) från en 10,8×
 *    skillnad till en ~3,3× skillnad (sqrt(1859)/sqrt(172) ≈ 3,3).
 * 2. Golvet är en ANDEL av driftskostnaden (50%), inte ett fritt valt
 *    kronbelopp — samma golv-mot-kostnad-relation oavsett vilken tier.
 *
 * Metod identisk med förra mätningen: en riktig säsong per klubb, samma
 * publiksiffror (fixture.attendance efter riktig simulering), tre tiers,
 * gamla moodMult-formeln som referens.
 *
 * Kör: node_modules/.bin/vite-node scripts/askadarekonomin-matning-v2-2026-08-27.ts
 */
import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { autoSelectLineup, autoResolvePendingScreen, autoBuildCheapestAffordableFacility } from './stress/fixtures'
import { CLUB_TEMPLATES } from '../src/domain/services/worldGenerator'
import { FixtureStatus } from '../src/domain/enums'
import type { SaveGame } from '../src/domain/entities/SaveGame'

const SEASONS = 1
const SEED = 90_000

interface HomeMatchSample {
  matchday: number
  attendance: number
  fanMood: number
}

function runSeason(clubId: string): { samples: HomeMatchSample[]; crashed: boolean } {
  let game: SaveGame = createNewGame({ managerName: `Askadare2-${clubId}`, clubId, seed: SEED })
  game = { ...game, pendingScreen: null }
  const samples: HomeMatchSample[] = []
  let stepSeed = SEED * 100_000 + 1_000

  try {
    let seasonDone = false
    let guardRounds = 0
    let lastSeenFixtureCount = 0
    while (!seasonDone) {
      guardRounds++
      if (guardRounds > 2000) throw new Error('season never ended — round guard tripped')

      game = autoSelectLineup(game)
      game = autoBuildCheapestAffordableFacility(game)
      const result = advanceToNextEvent(game, stepSeed++)
      game = result.game

      const homeFixtures = game.fixtures.filter(f =>
        f.homeClubId === clubId && f.status === FixtureStatus.Completed && typeof f.attendance === 'number',
      )
      if (homeFixtures.length > lastSeenFixtureCount) {
        const newOnes = homeFixtures.slice(lastSeenFixtureCount)
        for (const f of newOnes) {
          samples.push({ matchday: f.matchday ?? 0, attendance: f.attendance!, fanMood: game.fanMood ?? 50 })
        }
        lastSeenFixtureCount = homeFixtures.length
      }

      if (result.seasonEnded || game.managerFired) {
        seasonDone = true
      } else {
        const resolved = autoResolvePendingScreen(game)
        if (resolved.unresolvable) throw new Error(`unresolvable pendingScreen: ${resolved.screenType}`)
        game = resolved.game
      }
    }
  } catch (e) {
    return { samples, crashed: true }
  }
  return { samples, crashed: false }
}

// ── Gamla formeln (moodMult) — oförändrad referens ─────────────────────────
function oldKioskVipLottery(tier: 'none' | 'basic' | 'upgraded', vip: boolean, fanMood: number, isHomeMatch: boolean, lotteryOn: boolean): number {
  const moodMult = 0.7 + (fanMood / 100) * 0.6
  const kioskBase = tier === 'upgraded' ? 2500 : tier === 'basic' ? 1250 : 0
  let income = Math.round(kioskBase * moodMult)
  if (vip) income += 2500
  let runningCost = 0
  if (tier === 'upgraded') runningCost += 2500
  else if (tier === 'basic') runningCost += 1500
  if (vip) runningCost += 2000
  income -= runningCost
  if (lotteryOn) income += (500 + 375) - 500
  return income
}

// ── Kandidat 2: sqrt(attendance), golv = andel av driftskostnaden ─────────
const KIOSK_SQRT_RATE_BASIC = 75
const KIOSK_SQRT_RATE_UPGRADED = 150
const VIP_SQRT_RATE = 150
const FLOOR_SHARE_OF_COST = 0.5 // golvet är hälften av driftskostnaden, oavsett tier
const LOTTERY_HOME_MULT = 1.5

const KIOSK_RUNNING_COST_BASIC = 1500
const KIOSK_RUNNING_COST_UPGRADED = 2500
const VIP_RUNNING_COST = 2000

function newKioskVipLotteryV2(tier: 'none' | 'basic' | 'upgraded', vip: boolean, attendance: number, isHomeMatch: boolean, lotteryOn: boolean): number {
  const sqrtAtt = Math.sqrt(Math.max(0, attendance))
  let income = 0
  if (tier === 'upgraded') {
    income += Math.max(FLOOR_SHARE_OF_COST * KIOSK_RUNNING_COST_UPGRADED, Math.round(KIOSK_SQRT_RATE_UPGRADED * sqrtAtt))
  } else if (tier === 'basic') {
    income += Math.max(FLOOR_SHARE_OF_COST * KIOSK_RUNNING_COST_BASIC, Math.round(KIOSK_SQRT_RATE_BASIC * sqrtAtt))
  }
  if (vip) {
    income += Math.max(FLOOR_SHARE_OF_COST * VIP_RUNNING_COST, Math.round(VIP_SQRT_RATE * sqrtAtt))
  }
  let runningCost = 0
  if (tier === 'upgraded') runningCost += KIOSK_RUNNING_COST_UPGRADED
  else if (tier === 'basic') runningCost += KIOSK_RUNNING_COST_BASIC
  if (vip) runningCost += VIP_RUNNING_COST
  income -= runningCost
  if (lotteryOn) {
    const mult = isHomeMatch ? LOTTERY_HOME_MULT : 1.0
    income += Math.round((500 + 375) * mult) - 500
  }
  return income
}

interface TierResult { tierLabel: string; oldTotal: number; newTotal: number }

function main(): void {
  console.log(`\n=== Åskådarekonomin v2 (sqrt + kostnadsrelativt golv) — alla tolv, standardkörning (seed=${SEED}) ===\n`)

  const TIERS: { label: string; kiosk: 'none' | 'basic' | 'upgraded'; vip: boolean }[] = [
    { label: 'none/inget', kiosk: 'none', vip: false },
    { label: 'basic/ingen VIP', kiosk: 'basic', vip: false },
    { label: 'upgraded/VIP', kiosk: 'upgraded', vip: true },
  ]

  const under55: { name: string; rep: number; results: TierResult[] }[] = []
  let maxRatio = 0
  let maxRatioClub = ''

  for (const template of CLUB_TEMPLATES) {
    const { samples, crashed } = runSeason(template.id)
    if (crashed) { console.log(`${template.name}: KRASCH`); continue }

    const results: TierResult[] = TIERS.map(t => {
      let oldTotal = 0
      let newTotal = 0
      for (const s of samples) {
        oldTotal += oldKioskVipLottery(t.kiosk, t.vip, s.fanMood, true, t.kiosk !== 'none')
        newTotal += newKioskVipLotteryV2(t.kiosk, t.vip, s.attendance, true, t.kiosk !== 'none')
      }
      return { tierLabel: t.label, oldTotal, newTotal }
    })

    const avgAttendance = samples.length > 0 ? Math.round(samples.reduce((s, x) => s + x.attendance, 0) / samples.length) : 0
    console.log(`${template.name.padEnd(16)} rep=${String(template.reputation).padStart(3)} snittpublik=${String(avgAttendance).padStart(4)} hemmamatcher=${samples.length}`)
    for (const r of results) {
      const delta = r.newTotal - r.oldTotal
      const ratio = r.oldTotal > 0 ? r.newTotal / r.oldTotal : NaN
      if (!Number.isNaN(ratio) && Math.abs(ratio) > maxRatio && r.tierLabel !== 'none/inget') {
        maxRatio = Math.abs(ratio)
        maxRatioClub = `${template.name} (${r.tierLabel})`
      }
      console.log(`    ${r.tierLabel.padEnd(16)} gammal=${String(r.oldTotal).padStart(7)} ny=${String(r.newTotal).padStart(7)} Δ=${delta >= 0 ? '+' : ''}${delta}${!Number.isNaN(ratio) ? `  (${ratio.toFixed(2)}×)` : ''}`)
    }

    if (template.reputation < 55) under55.push({ name: template.name, rep: template.reputation, results })
  }

  console.log(`\n=== Största kvot ny/gammal (icke-none-tier): ${maxRatio.toFixed(2)}× — ${maxRatioClub} ===`)

  console.log(`\n=== De fyra under rep 55 — nedåtriktningen ===\n`)
  for (const c of under55) {
    console.log(`${c.name} (rep=${c.rep}):`)
    for (const r of c.results) {
      console.log(`    ${r.tierLabel.padEnd(16)} gammal=${String(r.oldTotal).padStart(7)} ny=${String(r.newTotal).padStart(7)} Δ=${r.newTotal - r.oldTotal >= 0 ? '+' : ''}${r.newTotal - r.oldTotal}`)
    }
  }

  console.log('\n=== SLUT ===\n')
}

main()
