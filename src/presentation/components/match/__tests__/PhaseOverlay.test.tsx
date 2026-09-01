import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { PhaseOverlay } from '../PhaseOverlay'

describe('PhaseOverlay', () => {
  it('beskriver bandyns 90 ordinarie minuter före förlängning', () => {
    const html = renderToStaticMarkup(<PhaseOverlay phase="overtime" onContinue={() => {}} />)
    expect(html).toContain('Oavgjort efter 90 minuter.')
    expect(html).not.toContain('efter 60 minuter')
    expect(html).toContain('type="button"')
  })
})
