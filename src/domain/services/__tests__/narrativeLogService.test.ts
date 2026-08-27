import { describe, it, expect } from 'vitest'
import { logNarrativeBeat, isOnCooldown, systemhandelseBudgetOk, filterSystemhandelseBudget, pickPoolIndexAvoidingCooldown } from '../narrativeLogService'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../worldGenerator'

/**
 * U5 (SLUTTEST_KO.md, 2026-08-17) — DOM GIVEN: en delad logg, en skrivväg,
 * två läsvägar. Se narrativeLogService.ts för hela resonemanget.
 */
function makeGame() {
  const template = CLUB_TEMPLATES[0]
  return createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
}

describe('logNarrativeBeat', () => {
  it('lägger till en post utan att mutera game.narrativeBeatLog', () => {
    const game = makeGame()
    const updated = logNarrativeBeat(game, 'playoff_final', 5, 37)
    expect(game.narrativeBeatLog).toBeUndefined()
    expect(updated).toHaveLength(1)
    expect(updated[0]).toEqual({ semanticKey: 'playoff_final', season: 5, round: 37 })
  })

  it('systemhandelse-flaggan sätts bara när den skickas in', () => {
    const game = makeGame()
    const updated = logNarrativeBeat(game, 'varsel', 2, 10, true)
    expect(updated[0].systemhandelse).toBe(true)
  })

  it('bygger vidare på en befintlig logg', () => {
    let game = { ...makeGame(), narrativeBeatLog: logNarrativeBeat(makeGame(), 'a', 1, 1) }
    game = { ...game, narrativeBeatLog: logNarrativeBeat(game, 'b', 1, 2) }
    expect(game.narrativeBeatLog).toHaveLength(2)
  })
})

describe('isOnCooldown — U5 narrativ cooldown', () => {
  it('samma semanticKey samma säsong: on cooldown', () => {
    const game = { ...makeGame(), narrativeBeatLog: [{ semanticKey: 'playoff_final', season: 5, round: 37 }] }
    expect(isOnCooldown(game, 'playoff_final', 3, 5)).toBe(true)
  })

  it('samma semanticKey, tillräckligt många säsonger senare: inte on cooldown', () => {
    const game = { ...makeGame(), narrativeBeatLog: [{ semanticKey: 'playoff_final', season: 2, round: 37 }] }
    expect(isOnCooldown(game, 'playoff_final', 3, 5)).toBe(false)
  })

  it('samma semanticKey, precis under gränsen: fortfarande on cooldown', () => {
    const game = { ...makeGame(), narrativeBeatLog: [{ semanticKey: 'playoff_final', season: 3, round: 37 }] }
    expect(isOnCooldown(game, 'playoff_final', 3, 5)).toBe(true)  // 5-3=2 < 3
  })

  it('annan semanticKey påverkar inte', () => {
    const game = { ...makeGame(), narrativeBeatLog: [{ semanticKey: 'arc_vetfinal_p1', season: 5, round: 37 }] }
    expect(isOnCooldown(game, 'playoff_final', 3, 5)).toBe(false)
  })

  it('tom logg: aldrig on cooldown', () => {
    expect(isOnCooldown(makeGame(), 'playoff_final', 3, 5)).toBe(false)
  })
})

describe('systemhandelseBudgetOk — O19 säsongsbudget', () => {
  it('ingen systemhändelse ännu denna säsong: ok', () => {
    expect(systemhandelseBudgetOk(makeGame(), 3, 10)).toBe(true)
  })

  it('under taket (default 3), tillräckligt avstånd: ok', () => {
    const game = {
      ...makeGame(),
      narrativeBeatLog: [
        { semanticKey: 'varsel', season: 3, round: 5, systemhandelse: true },
        { semanticKey: 'sell_star', season: 3, round: 15, systemhandelse: true },
      ],
    }
    expect(systemhandelseBudgetOk(game, 3, 20)).toBe(true)
  })

  it('taket nått: nej', () => {
    const game = {
      ...makeGame(),
      narrativeBeatLog: [
        { semanticKey: 'a', season: 3, round: 2, systemhandelse: true },
        { semanticKey: 'b', season: 3, round: 8, systemhandelse: true },
        { semanticKey: 'c', season: 3, round: 14, systemhandelse: true },
      ],
    }
    expect(systemhandelseBudgetOk(game, 3, 20, 3)).toBe(false)
  })

  it('samma omgång som en tidigare systemhändelse: nej (aldrig två i samma omgång)', () => {
    const game = { ...makeGame(), narrativeBeatLog: [{ semanticKey: 'varsel', season: 3, round: 10, systemhandelse: true }] }
    expect(systemhandelseBudgetOk(game, 3, 10)).toBe(false)
  })

  it('icke-systemhändelse-poster räknas inte mot budgeten', () => {
    const game = {
      ...makeGame(),
      narrativeBeatLog: [
        { semanticKey: 'a', season: 3, round: 2 },
        { semanticKey: 'b', season: 3, round: 4 },
        { semanticKey: 'c', season: 3, round: 6 },
        { semanticKey: 'd', season: 3, round: 8 },
      ],
    }
    expect(systemhandelseBudgetOk(game, 3, 20)).toBe(true)
  })

  it('en annan säsongs systemhändelser räknas inte mot denna säsongens budget', () => {
    const game = {
      ...makeGame(),
      narrativeBeatLog: [
        { semanticKey: 'a', season: 2, round: 2, systemhandelse: true },
        { semanticKey: 'b', season: 2, round: 8, systemhandelse: true },
        { semanticKey: 'c', season: 2, round: 14, systemhandelse: true },
      ],
    }
    expect(systemhandelseBudgetOk(game, 3, 5, 3)).toBe(true)
  })
})

// U5 forts (SLUTTEST_KO.md, 2026-08-20) — den faktiska gatingen, applicerad
// på en batch (roundProcessor.ts:s allNewEvents-motsvarighet).
describe('filterSystemhandelseBudget — U5 forts gating', () => {
  it('icke-systemhändelser släpps alltid igenom, oavsett budget', () => {
    const game = {
      ...makeGame(),
      narrativeBeatLog: [
        { semanticKey: 'a', season: 3, round: 2, systemhandelse: true },
        { semanticKey: 'b', season: 3, round: 8, systemhandelse: true },
        { semanticKey: 'c', season: 3, round: 14, systemhandelse: true },
      ],
    }
    const items = [{ id: 'e1' }, { id: 'e2', systemhandelse: false }]
    expect(filterSystemhandelseBudget(items, game, 3, 20)).toEqual(items)
  })

  it('en systemhändelse släpps igenom när budget finns', () => {
    const game = makeGame()
    const items = [{ id: 'e1', systemhandelse: true }]
    expect(filterSystemhandelseBudget(items, game, 3, 10)).toEqual(items)
  })

  it('taket redan nått: systemhändelsen tappas, icke-systemhändelser i samma batch påverkas inte', () => {
    const game = {
      ...makeGame(),
      narrativeBeatLog: [
        { semanticKey: 'a', season: 3, round: 2, systemhandelse: true },
        { semanticKey: 'b', season: 3, round: 8, systemhandelse: true },
        { semanticKey: 'c', season: 3, round: 14, systemhandelse: true },
      ],
    }
    const items = [{ id: 'e1', systemhandelse: true }, { id: 'e2' }]
    expect(filterSystemhandelseBudget(items, game, 3, 20)).toEqual([{ id: 'e2' }])
  })

  it('två systemhändelser i SAMMA batch: bara den första släpps igenom (aldrig två i samma omgång)', () => {
    // Ingen tidigare logg — utan den provisoriska räkningen hade båda
    // slunkit igenom eftersom det riktiga narrativeBeatLog inte uppdateras
    // förrän spelaren resolvar. Detta test är rotorsaken till varför
    // filterSystemhandelseBudget existerar som egen funktion.
    const game = makeGame()
    const items = [{ id: 'e1', systemhandelse: true }, { id: 'e2', systemhandelse: true }]
    expect(filterSystemhandelseBudget(items, game, 3, 10)).toEqual([{ id: 'e1', systemhandelse: true }])
  })

  it('game.narrativeBeatLog självt muteras aldrig av filtreringen', () => {
    const game = makeGame()
    const items = [{ id: 'e1', systemhandelse: true }, { id: 'e2', systemhandelse: true }]
    filterSystemhandelseBudget(items, game, 3, 10)
    expect(game.narrativeBeatLog).toBeUndefined()
  })
})

/**
 * A-H4a (SEXSÄSONGSAUDITEN 2026-08-26): Birger-citaten (SM-final/cupfinal)
 * valdes tidigare med en ren hash(season, clubId)-formel utan minne — samma
 * citat kunde återkomma i två raka finaler. pickPoolIndexAvoidingCooldown
 * är den delade fixen, återanvänd av useSMFinalData.ts/useCupFinalData.ts.
 */
describe('pickPoolIndexAvoidingCooldown', () => {
  const game = makeGame()

  it('utan logg: tie-break-seedet avgör (deterministiskt, ingen cooldown att undvika)', () => {
    const idx = pickPoolIndexAvoidingCooldown(game, 5, 3, 'birger_sm_quote_', 7)
    expect(idx).toBe(7 % 3)
  })

  it('tie-break-index är på cooldown — väljer ett annat index i poolen', () => {
    const tieBreakSeed = 6 // 6 % 3 === 0
    const gameWithCooldown = {
      ...game,
      narrativeBeatLog: [{ semanticKey: 'birger_sm_quote_0', season: 5, round: 10 }],
    }
    const idx = pickPoolIndexAvoidingCooldown(gameWithCooldown, 5, 3, 'birger_sm_quote_', tieBreakSeed)
    expect(idx).not.toBe(0)
  })

  it('HELA poolen på cooldown (poolen har rullat ett fullt varv) — spärren släpper, tie-break avgör igen', () => {
    const gameFullyOnCooldown = {
      ...game,
      narrativeBeatLog: [0, 1, 2].map(i => ({ semanticKey: `birger_sm_quote_${i}`, season: 5, round: 10 })),
    }
    const idx = pickPoolIndexAvoidingCooldown(gameFullyOnCooldown, 5, 3, 'birger_sm_quote_', 7)
    expect(idx).toBe(7 % 3)
  })

  it('cooldown är per säsong (minSeasonsApart) — en gammal post släpper efter tillräckligt många säsonger', () => {
    const oldEntry = { semanticKey: 'birger_sm_quote_0', season: 1, round: 10 }
    const gameWithOldEntry = { ...game, narrativeBeatLog: [oldEntry] }
    // minSeasonsApart default 2: currentSeason=5, entry.season=1 → 5-1=4 >= 2, inte på cooldown
    const idx = pickPoolIndexAvoidingCooldown(gameWithOldEntry, 5, 3, 'birger_sm_quote_', 6)
    expect(idx).toBe(0) // fritt valt igen, tie-break 6%3===0
  })

  it('sm- och cup-prefix delar aldrig cooldown-utrymme (skilda pooler, skilda semanticKeys)', () => {
    const gameWithSmOnCooldown = {
      ...game,
      narrativeBeatLog: [{ semanticKey: 'birger_sm_quote_0', season: 5, round: 10 }],
    }
    const cupIdx = pickPoolIndexAvoidingCooldown(gameWithSmOnCooldown, 5, 3, 'birger_cup_quote_', 6)
    expect(cupIdx).toBe(0) // cup-poolen opåverkad av sm-poolens cooldown
  })
})
