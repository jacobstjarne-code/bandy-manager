import { afterEach, describe, expect, it, vi } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { generateSeasonSummary } from '../../../domain/services/seasonSummaryService'
import type { MatchHighlight } from '../../../domain/entities/SeasonSummary'
import { generateMatchShareImage } from '../matchShareImage'

afterEach(() => vi.restoreAllMocks())

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
})
