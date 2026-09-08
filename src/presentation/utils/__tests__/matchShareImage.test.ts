import { afterEach, describe, expect, it, vi } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { generateSeasonSummary } from '../../../domain/services/seasonSummaryService'
import type { MatchHighlight } from '../../../domain/entities/SeasonSummary'
import { generateMatchShareImage, shareMatchImage } from '../matchShareImage'

afterEach(() => {
  vi.useRealTimers()
  Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
  Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined })
  Reflect.deleteProperty(URL, 'createObjectURL')
  Reflect.deleteProperty(URL, 'revokeObjectURL')
  vi.restoreAllMocks()
})

function mockCanvas() {
  const context = {
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn((text: string) => ({ width: text.length * 20 })),
    fillStyle: '',
    font: '',
    textAlign: '',
  } as unknown as CanvasRenderingContext2D
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context)
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
    callback => callback(new Blob(['png'], { type: 'image/png' })),
  )
}

function shareFixture() {
  const game = createNewGame({
    managerName: 'Test',
    clubId: 'club_forsbacka',
    season: 2025,
    seed: 42,
  })
  const summary = generateSeasonSummary(game)
  const match: MatchHighlight = {
    fixtureId: 'finalen',
    matchday: 22,
    roundLabel: 'SM-final',
    opponentName: 'Bollnäs',
    homeScore: 5,
    awayScore: 4,
    isHome: true,
    category: 'late_winner',
    narrative: 'Avgörandet kom i sista minuten.',
    potmName: 'Karl Lindström',
    shareImageReady: true,
  }
  return { summary, match }
}

describe('generateMatchShareImage', () => {
  it('ritar en separat ÅRETS MATCH-artefakt med sann matchdata', async () => {
    const texts: string[] = []
    const gradient = { addColorStop: vi.fn() }
    const context = {
      createLinearGradient: vi.fn(() => gradient), fillRect: vi.fn(),
      fillText: vi.fn((text: string) => texts.push(text)),
      measureText: vi.fn((text: string) => ({ width: text.length * 20 })),
      fillStyle: '', font: '', textAlign: '',
    } as unknown as CanvasRenderingContext2D
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context)
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(callback => callback(new Blob(['png'], { type: 'image/png' })))

    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    const summary = generateSeasonSummary(game)
    const match: MatchHighlight = {
      fixtureId: 'finalen', matchday: 22, roundLabel: 'SM-final', opponentName: 'Bollnäs',
      homeScore: 5, awayScore: 4, isHome: true, category: 'late_winner',
      narrative: 'Avgörandet kom i sista minuten.', potmName: 'Karl Lindström', shareImageReady: true,
    }

    const blob = await generateMatchShareImage(summary, match)
    expect(blob?.type).toBe('image/png')
    expect(texts).toContain('ÅRETS MATCH')
    expect(texts).toContain('5–4')
    expect(texts).toContain('SM-final')
    expect(texts.join(' ')).toContain('Karl Lindström')
  })

  it('gissar inte ligaomgång för en äldre match utan frusen rondetikett', async () => {
    const texts: string[] = []
    const context = {
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })), fillRect: vi.fn(),
      fillText: vi.fn((text: string) => texts.push(text)),
      measureText: vi.fn((text: string) => ({ width: text.length * 20 })),
      fillStyle: '', font: '', textAlign: '',
    } as unknown as CanvasRenderingContext2D
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context)
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(callback => callback(new Blob(['png'], { type: 'image/png' })))

    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    const summary = generateSeasonSummary(game)
    const match: MatchHighlight = {
      fixtureId: 'legacy', matchday: 8, opponentName: 'Bollnäs',
      homeScore: 3, awayScore: 2, isHome: true, category: 'late_winner',
      narrative: 'Avgörandet kom sent.', shareImageReady: true,
    }

    await generateMatchShareImage(summary, match)
    expect(texts).toContain('Matchdag 8')
    expect(texts).not.toContain('Omgång 8')
  })

  it('använder native fildelning när plattformen stöder matchartefakten', async () => {
    mockCanvas()
    const nativeShare = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { configurable: true, value: nativeShare })
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: vi.fn(() => true),
    })
    const { summary, match } = shareFixture()

    await expect(shareMatchImage(summary, match)).resolves.toBe('shared')
    expect(nativeShare).toHaveBeenCalledWith(expect.objectContaining({
      files: [expect.any(File)],
      title: expect.stringContaining('Årets match'),
      text: match.narrative,
    }))
  })

  it('laddar ner samma matchartefakt när native fildelning saknas', async () => {
    vi.useFakeTimers()
    mockCanvas()
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined })
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:arets-match'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const { summary, match } = shareFixture()

    await expect(shareMatchImage(summary, match)).resolves.toBe('downloaded')
    expect(click).toHaveBeenCalledOnce()
    await vi.runAllTimersAsync()
  })
})
