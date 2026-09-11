import { describe, it, expect } from 'vitest'
import { imageRightsPressQuestion, contractTermAcceptText, JOBBET_FORSVANN_TEXT } from '../contractTermText'

/**
 * Jacobs körorder 2026-09-11: de ~13 flaggade ${namn}s-genitiven
 * (mecenat/sponsor) wirade nu ALLA genom swedishGenitive() i stället för
 * att bedömas namn för namn. Regressionstest med ett s-slutande
 * sponsornamn — verifierar att den befintliga, redan korrekta regeln
 * (namn på s/x/z får inget extra s) faktiskt appliceras HÄR, inte bara i
 * matchCommentaryTemplate.test.ts's kontroll av själva helper-funktionen.
 */
describe('contractTermText — sponsorgenitiv (s-slutande namn)', () => {
  it('imageRightsPressQuestion: "Fors" får inget extra s', () => {
    const question = imageRightsPressQuestion('Erik Berg', 'Fors', 3)
    expect(question).toContain('Fors affischer')
    expect(question).not.toContain('Forss')
  })

  it('imageRightsPressQuestion: ett namn UTAN s/x/z-ändelse får sitt extra s som vanligt', () => {
    const question = imageRightsPressQuestion('Erik Berg', 'Karlsson', 3)
    expect(question).toContain('Karlssons affischer')
  })

  it('contractTermAcceptText (imageRights): s-slutande sponsornamn får inget extra s', () => {
    const text = contractTermAcceptText('imageRights', 'Erik Berg', 'Fors')
    expect(text).toContain('Fors skyltfönster')
    expect(text).not.toContain('Forss')
  })

  it('JOBBET_FORSVANN_TEXT.title: s-slutande spelarnamn får inget extra s', () => {
    expect(JOBBET_FORSVANN_TEXT.title('Fors')).toBe('Fors jobb är borta')
  })
})
