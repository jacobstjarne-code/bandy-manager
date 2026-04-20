import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { runChevronButtons } from '../rules/chevronButtons'

describe('chevronButtons', () => {
  let root: HTMLElement

  beforeEach(() => {
    root = document.createElement('div')
    document.body.appendChild(root)
  })

  afterEach(() => {
    document.body.removeChild(root)
  })

  it('passes compliant chevron button', () => {
    root.innerHTML = `<button style="width:16px;height:16px;border-radius:4px">›</button>`
    const findings = runChevronButtons(root)
    expect(findings).toHaveLength(0)
  })

  it('flags chevron button with wrong size', () => {
    root.innerHTML = `<button style="width:20px;height:20px;border-radius:4px">›</button>`
    const findings = runChevronButtons(root)
    expect(findings.length).toBeGreaterThan(0)
    expect(findings[0].actual).toContain('width')
  })

  it('ignores non-chevron buttons', () => {
    root.innerHTML = `<button style="width:20px;height:20px">Kör →</button>`
    const findings = runChevronButtons(root)
    expect(findings).toHaveLength(0)
  })
})
