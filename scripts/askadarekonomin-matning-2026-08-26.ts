/**
 * Åskådarekonomin — mätning innan dom (Jacobs order 2026-08-26): "Kör med
 * kandidatvärden, rapportera totalintäkt per klubb och tier före/efter."
 *
 * Metod: en riktig säsong per klubb (samma headless-harness som
 * h4-alla-tolv-avskedsfrekvens.ts, standardkörning — communityStanding
 * orört, default 50) ger REALISTISKA per-omgångs publiksiffror (samma
 * calcAttendance()-väg som matchSimProcessor faktiskt använder, läst av
 * fixture.attendance efter simulering). För VARJE hemmamatch, för TRE
 * aktivitetstiers (none / basic+ingen VIP / upgraded+VIP), räknas GAMLA
 * formeln (moodMult) och NYA formeln (kronor-per-huvud + golv) ut mot
 * SAMMA publiksiffra — så jämförelsen isolerar formelbytet, inte olika
 * simulerade säsonger.
 *
 * Kör: node_modules/.bin/vite-node scripts/askadarekonomin-matning-2026-08-26.ts
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

function runSeason(clubId: string): { samples: HomeMatchSample[]; crashed: boolean; finalRep: number } {
  let game: SaveGame = createNewGame({ managerName: `Askadare-${clubId}`, clubId, seed: SEED })
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

      // Fånga hemmamatcher med attendance satt (nyligen simulerade denna omgång)
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
    return { samples, crashed: true, finalRep: 0 }
  }
  const finalClub = game.clubs.find(c => c.id === clubId)
  return { samples, crashed: false, finalRep: finalClub?.reputation ?? 0 }
}

// ── Gamla formeln (moodMult) ────────────────────────────────────────────────
function oldKioskVipLottery(tier: 'none' | 'basic' | 'upgraded', vip: boolean, attendance: number, fanMood: number, isHomeMatch: boolean, lotteryOn: boolean): number {
  const moodMult = 0.7 + (fanMood / 100) * 0.6
  const kioskBase = tier === 'upgraded' ? 2500 : tier === 'basic' ? 1250 : 0
  let income = Math.round(kioskBase * moodMult)
  if (vip) income += 2500 // 1250 + medel(rand()*2500)=1250 → 1250+1250=2500
  let runningCost = 0
  if (tier === 'upgraded') runningCost += 2500
  else if (tier === 'basic') runningCost += 1500
  if (vip) runningCost += 2000
  income -= runningCost
  if (lotteryOn) income += (500 + 375) - 500 // basic lottery, medel av rand
  return income
}

// ── Nya formeln (kr/huvud + golv) ───────────────────────────────────────────
const KIOSK_PER_HEAD_BASIC = 4.5
const KIOSK_PER_HEAD_UPGRADED = 9
const KIOSK_FLOOR_BASIC = 700
const KIOSK_FLOOR_UPGRADED = 1200
const VIP_PER_HEAD = 9
const VIP_FLOOR = 1000
const LOTTERY_HOME_MULT = 1.5

function newKioskVipLottery(tier: 'none' | 'basic' | 'upgraded', vip: boolean, attendance: number, isHomeMatch: boolean, lotteryOn: boolean): number {
  let income = 0
  if (tier === 'upgraded') income += Math.max(KIOSK_FLOOR_UPGRADED, Math.round(KIOSK_PER_HEAD_UPGRADED * attendance))
  else if (tier === 'basic') income += Math.max(KIOSK_FLOOR_BASIC, Math.round(KIOSK_PER_HEAD_BASIC * attendance))
  if (vip) income += Math.max(VIP_FLOOR, Math.round(VIP_PER_HEAD * attendance))
  let runningCost = 0
  if (tier === 'upgraded') runningCost += 2500
  else if (tier === 'basic') runningCost += 1500
  if (vip) runningCost += 2000
  income -= runningCost
  if (lotteryOn) {
    const mult = isHomeMatch ? LOTTERY_HOME_MULT : 1.0
    income += Math.round((500 + 375) * mult) - 500
  }
  return income
}

interface TierResult { tierLabel: string; oldTotal: number; newTotal: number }

function main(): void {
  console.log(`\n=== Åskådarekonomin — mätning, alla tolv, standardkörning (seed=${SEED}) ===\n`)

  const TIERS: { label: string; kiosk: 'none' | 'basic' | 'upgraded'; vip: boolean }[] = [
    { label: 'none/inget', kiosk: 'none', vip: false },
    { label: 'basic/ingen VIP', kiosk: 'basic', vip: false },
    { label: 'upgraded/VIP', kiosk: 'upgraded', vip: true },
  ]

  const under55: { name: string; rep: number; results: TierResult[] }[] = []
  const allResults: { name: string; rep: number; results: TierResult[] }[] = []

  for (const template of CLUB_TEMPLATES) {
    const { samples, crashed, finalRep } = runSeason(template.id)
    if (crashed) { console.log(`${template.name}: KRASCH`); continue }

    const results: TierResult[] = TIERS.map(t => {
      let oldTotal = 0
      let newTotal = 0
      for (const s of samples) {
        oldTotal += oldKioskVipLottery(t.kiosk, t.vip, s.attendance, s.fanMood, true, t.kiosk !== 'none')
        newTotal += newKioskVipLottery(t.kiosk, t.vip, s.attendance, true, t.kiosk !== 'none')
      }
      return { tierLabel: t.label, oldTotal, newTotal }
    })

    const avgAttendance = samples.length > 0 ? Math.round(samples.reduce((s, x) => s + x.attendance, 0) / samples.length) : 0
    console.log(`${template.name.padEnd(16)} rep=${String(template.reputation).padStart(3)} snittpublik=${String(avgAttendance).padStart(4)} hemmamatcher=${samples.length}`)
    for (const r of results) {
      const delta = r.newTotal - r.oldTotal
      console.log(`    ${r.tierLabel.padEnd(16)} gammal=${String(r.oldTotal).padStart(7)} ny=${String(r.newTotal).padStart(7)} Δ=${delta >= 0 ? '+' : ''}${delta}`)
    }

    allResults.push({ name: template.name, rep: template.reputation, results })
    if (template.reputation < 55) under55.push({ name: template.name, rep: template.reputation, results })
  }

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
