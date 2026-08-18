/**
 * SLUTTEST_KO.md 4.12 (2026-08-18) — "Delningsbilden kapas i produktion".
 * Rotorsak: fast canvas-höjd (1350) + fast footer-position (H-60), men
 * innehållet är datadrivet (playoff-raden + upp till tre statsrader är
 * villkorade) — värsta kombinationen rymdes inte inom 1350, och footern
 * ritades ändå på samma fasta position, mitt i innehållet.
 *
 * computeSeasonShareImageHeight är den rena delen (ingen canvas) — testad
 * direkt. generateSeasonShareImage kräver en canvas 2d-kontext som jsdom
 * inte ger (getContext('2d') === null i test-miljön, samma begränsning som
 * resten av testsviten möter för renderade komponenter) — draw-vägen
 * verifieras därför genom en minimal mockad kontext som spelar in varje
 * fillText/moveTo-anrops y-koordinat, så att den hårda assertionen
 * (assertWithinContentBounds) faktiskt körs och kan verifieras hålla.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { generateSeasonSummary } from '../../../domain/services/seasonSummaryService'
import { computeSeasonShareImageHeight, generateSeasonShareImage, assertWithinContentBounds, shareSeasonImage } from '../seasonShareImage'
import type { SeasonSummary } from '../../../domain/entities/SeasonSummary'

function baseSummary(): SeasonSummary {
  const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
  return generateSeasonSummary(game)
}

const LONG_SWEDISH_NAME = 'Bengt-Åke Örjansson-Kristoffersen'

function worstCase(): SeasonSummary {
  return {
    ...baseSummary(),
    playoffResult: 'champion',
    topScorer: { playerId: 'p1', name: LONG_SWEDISH_NAME, goals: 34, assists: 12 },
    topRated: { playerId: 'p2', name: LONG_SWEDISH_NAME, avgRating: 8.7, games: 26 },
    mostImproved: { playerId: 'p3', name: LONG_SWEDISH_NAME, caGain: 42, startCA: 90, endCA: 132 },
  }
}

function minimalCase(): SeasonSummary {
  return {
    ...baseSummary(),
    playoffResult: null,
    topScorer: null,
    topRated: null,
    mostImproved: null,
  }
}

describe('computeSeasonShareImageHeight (pure)', () => {
  it('minsta höjden är golvet 1350 när inga villkorade block finns', () => {
    expect(computeSeasonShareImageHeight(minimalCase())).toBe(1350)
  })

  it('växer förbi 1350 för värsta kombinationen (SM-final + tre statsrader)', () => {
    const h = computeSeasonShareImageHeight(worstCase())
    expect(h).toBeGreaterThan(1350)
  })

  it('varje villkorat block ökar höjden monotont', () => {
    const none = computeSeasonShareImageHeight(minimalCase())
    const withPlayoff = computeSeasonShareImageHeight({ ...minimalCase(), playoffResult: 'finalist' })
    const withAll = computeSeasonShareImageHeight(worstCase())
    expect(withPlayoff).toBeGreaterThanOrEqual(none)
    expect(withAll).toBeGreaterThan(withPlayoff)
  })
})

/** Minimal CanvasRenderingContext2D-stub som spelar in y-koordinaten för varje anrop. */
function makeRecordingCtx() {
  const calls: number[] = []
  const ctx = {
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    fillRect: () => {},
    fillText: (_text: string, _x: number, y: number) => { calls.push(y) },
    beginPath: () => {},
    moveTo: (_x: number, y: number) => { calls.push(y) },
    lineTo: () => {},
    stroke: () => {},
    set fillStyle(_v: unknown) {},
    set strokeStyle(_v: unknown) {},
    set lineWidth(_v: unknown) {},
    set font(_v: unknown) {},
    set letterSpacing(_v: unknown) {},
    set textAlign(_v: unknown) {},
  }
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls }
}

describe('generateSeasonShareImage — hård footer-assertion (mockad ctx)', () => {
  it('inget draw-anrop hamnar under footer-gränsen, ens i värsta kombinationen', async () => {
    const { ctx, calls } = makeRecordingCtx()
    const toBlobSpy = vi.fn((cb: (b: Blob | null) => void) => cb(new Blob()))
    let capturedHeight = 0
    const canvasStub = {
      width: 0,
      set height(h: number) { capturedHeight = h },
      get height() { return capturedHeight },
      getContext: () => ctx,
      toBlob: toBlobSpy,
    }
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(canvasStub as unknown as HTMLCanvasElement)

    const blob = await generateSeasonShareImage(worstCase())

    createElementSpy.mockRestore()

    expect(blob).not.toBeNull()
    const expectedHeight = computeSeasonShareImageHeight(worstCase())
    expect(capturedHeight).toBe(expectedHeight)

    // Sista fillText-anropet är footer-vattenmärket, ritat på H-60 — det ligger
    // AVSIKTLIGT inuti den reserverade footer-bandet (H-90..H), inte en innehållsrad.
    const footerY = calls[calls.length - 1]
    expect(footerY).toBe(expectedHeight - 60)

    const maxContentY = expectedHeight - 90
    const contentCalls = calls.slice(0, -1)
    expect(contentCalls.length).toBeGreaterThan(0)
    for (const y of contentCalls) {
      expect(y).toBeLessThanOrEqual(maxContentY)
    }
  })

  it('assertWithinContentBounds kastar när en rad hamnar under footer-gränsen', () => {
    expect(() => assertWithinContentBounds(5000, 100, 'test-raden')).toThrow(/test-raden.*förbi den reserverade footer-gränsen/)
  })

  it('assertWithinContentBounds kastar INTE inom gränsen (inklusive exakt på gränsen)', () => {
    expect(() => assertWithinContentBounds(100, 100, 'test-raden')).not.toThrow()
    expect(() => assertWithinContentBounds(99, 100, 'test-raden')).not.toThrow()
  })
})

/**
 * SLUTTEST_KO.md 4.13 (2026-08-18) — shareSeasonImage returnerade Promise<void>
 * och svalde alla fel. Anroparen kunde aldrig veta om delningen lyckades,
 * laddades ner, avbröts, eller misslyckades. Fyra utfall, ett test per.
 */
describe('shareSeasonImage — returvärde (4.13)', () => {
  function mockCanvasCreation() {
    const { ctx } = makeRecordingCtx()
    const canvasStub = {
      width: 0, height: 0,
      getContext: () => ctx,
      toBlob: (cb: (b: Blob | null) => void) => cb(new Blob(['x'], { type: 'image/png' })),
    }
    const realCreateElement = document.createElement.bind(document)
    return vi.spyOn(document, 'createElement').mockImplementation((tag: string) =>
      tag === 'canvas' ? (canvasStub as unknown as HTMLElement) : realCreateElement(tag)
    )
  }

  function stubObjectURL() {
    const createObjectURL = vi.fn().mockReturnValue('blob:mock')
    const revokeObjectURL = vi.fn()
    // jsdom saknar URL.createObjectURL/revokeObjectURL helt — vi.spyOn kräver
    // att metoden redan finns, så de sätts direkt och städas bort i afterEach.
    // @ts-expect-error — testfixtur
    URL.createObjectURL = createObjectURL
    // @ts-expect-error — testfixtur
    URL.revokeObjectURL = revokeObjectURL
    return { createObjectURL, revokeObjectURL }
  }

  afterEach(() => {
    vi.restoreAllMocks()
    // @ts-expect-error — testfixtur, navigator.share finns inte i jsdom by default
    delete navigator.share
    // @ts-expect-error — samma
    delete navigator.canShare
    // @ts-expect-error — samma, satt av stubObjectURL
    delete URL.createObjectURL
    // @ts-expect-error — samma
    delete URL.revokeObjectURL
  })

  it('"shared" när Web Share lyckas', async () => {
    const createElementSpy = mockCanvasCreation()
    const shareSpy = vi.fn().mockResolvedValue(undefined)
    // @ts-expect-error — testfixtur
    navigator.share = shareSpy
    // @ts-expect-error — testfixtur
    navigator.canShare = () => true

    const result = await shareSeasonImage(minimalCase())

    expect(result).toBe('shared')
    expect(shareSpy).toHaveBeenCalledTimes(1)
    const call = shareSpy.mock.calls[0][0]
    expect(call.text).toBe(minimalCase().narrativeSummary)
    expect(call.url).toBe(window.location.origin)
    createElementSpy.mockRestore()
  })

  it('"cancelled" vid AbortError — laddar INTE ner filen (rotorsak för 4.13)', async () => {
    const createElementSpy = mockCanvasCreation()
    const abortError = new DOMException('User cancelled', 'AbortError')
    // @ts-expect-error — testfixtur
    navigator.share = vi.fn().mockRejectedValue(abortError)
    // @ts-expect-error — testfixtur
    navigator.canShare = () => true
    const { createObjectURL } = stubObjectURL()

    const result = await shareSeasonImage(minimalCase())

    expect(result).toBe('cancelled')
    expect(createObjectURL).not.toHaveBeenCalled()
    createElementSpy.mockRestore()
  })

  it('"downloaded" när Web Share saknas (fallback)', async () => {
    const createElementSpy = mockCanvasCreation()
    const { createObjectURL, revokeObjectURL } = stubObjectURL()

    const result = await shareSeasonImage(minimalCase())

    expect(result).toBe('downloaded')
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledTimes(1)
    createElementSpy.mockRestore()
  })

  it('"failed" när canvas-generering misslyckas (ingen 2d-context)', async () => {
    const canvasStub = { width: 0, height: 0, getContext: () => null }
    const realCreateElement = document.createElement.bind(document)
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) =>
      tag === 'canvas' ? (canvasStub as unknown as HTMLElement) : realCreateElement(tag)
    )

    const result = await shareSeasonImage(minimalCase())

    expect(result).toBe('failed')
    createElementSpy.mockRestore()
  })

  it('"downloaded" när Web Share ger ett annat fel än AbortError (fall-through bevarad)', async () => {
    const createElementSpy = mockCanvasCreation()
    // @ts-expect-error — testfixtur
    navigator.share = vi.fn().mockRejectedValue(new Error('NotAllowedError'))
    // @ts-expect-error — testfixtur
    navigator.canShare = () => true
    const { createObjectURL } = stubObjectURL()

    const result = await shareSeasonImage(minimalCase())

    expect(result).toBe('downloaded')
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    createElementSpy.mockRestore()
  })
})
