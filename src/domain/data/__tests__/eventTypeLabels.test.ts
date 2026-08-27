import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EVENT_TYPE_LABELS, getEventTypeMeta } from '../eventTypeLabels'
import { GAME_EVENT_TYPE_IDS } from '../contentContract'

/**
 * A-M3 (SEXSÄSONGSAUDITEN 2026-08-26, SPÅR 2b) — "exhaustiv
 * speltextsmappning; okända typer får generisk mänsklig etikett + telemetri,
 * aldrig rå kod."
 *
 * `Record<GameEventType, EventTypeLabel>` i eventTypeLabels.ts ger redan en
 * TS-kompileringstidsgrind (samma disciplin som contentContract.ts:s
 * AssertNoMissingIds — en ny GameEventType-medlem utan motsvarande rad
 * failar `npx tsc` direkt). Detta test är den RUNTIME-sidan: iterera de 49
 * id:na i contentContract.ts:s GAME_EVENT_TYPE_IDS (samma redan etablerade
 * täckningslista, inte en tredje driftbenägen kopia) och bekräfta att
 * ENSKILDA VÄRDEN faktiskt är icke-rå, mänsklig text — inte bara att en
 * nyckel finns i EVENT_TYPE_LABELS.
 */
describe('eventTypeLabels — exhaustiv täckning', () => {
  it('har exakt en rad per av de 49 kända GameEventType-värdena', () => {
    expect(Object.keys(EVENT_TYPE_LABELS).sort()).toEqual([...GAME_EVENT_TYPE_IDS].sort())
  })

  it.each(GAME_EVENT_TYPE_IDS)('%s mappar till en icke-rå, läsbar svensk etikett', (type) => {
    const meta = getEventTypeMeta(type)
    // Aldrig den råa camelCase-strängen tillbaka, exakt som den kommer in.
    // (Not: 'varsel' är redan ett riktigt svenskt ord — etiketten 'Varsel'
    // skiljer sig ändå från den råa TYPEN på gemener/versaler, vilket räcker
    // för att inte räknas som ett läckage av en teknisk nyckel.)
    expect(meta.label).not.toBe(type)
    // Etiketten ska vara mänsklig text: ingen camelCase-gräns kvar (den råa
    // nyckelns kännetecken, t.ex. "dayJobConflict", "criticalEconomy").
    expect(meta.label).not.toMatch(/[a-z][A-Z]/)
    expect(meta.label.length).toBeGreaterThan(0)
    expect(meta.icon.length).toBeGreaterThan(0)
  })

  it('okänd/framtida typ faller tillbaka till en generisk etikett — ALDRIG den råa strängen', () => {
    const meta = getEventTypeMeta('heltNyFramtidaEventTypSomInteFinnsAn')
    expect(meta.label).toBe('Händelse')
    expect(meta.label).not.toBe('heltNyFramtidaEventTypSomInteFinnsAn')
  })

  it('undefined-typ faller tillbaka till samma generiska etikett', () => {
    const meta = getEventTypeMeta(undefined)
    expect(meta.label).toBe('Händelse')
  })

  describe('telemetri vid okänd typ', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    })
    afterEach(() => {
      warnSpy.mockRestore()
    })

    it('loggar en console.warn-rad, taggad [eventTypeLabels], för en ny okänd typ', () => {
      getEventTypeMeta('annanHeltNyOkandTyp')
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy.mock.calls[0][0]).toContain('[eventTypeLabels]')
      expect(warnSpy.mock.calls[0][0]).toContain('annanHeltNyOkandTyp')
    })

    it('varnar bara EN gång per okänd typ (inte varje anrop)', () => {
      getEventTypeMeta('upprepadOkandTyp')
      getEventTypeMeta('upprepadOkandTyp')
      getEventTypeMeta('upprepadOkandTyp')
      expect(warnSpy).toHaveBeenCalledTimes(1)
    })

    it('varnar INTE för en känd GameEventType', () => {
      getEventTypeMeta('playoffEvent')
      expect(warnSpy).not.toHaveBeenCalled()
    })
  })
})
