import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { runHexColors } from '../rules/hexColors'

describe('hexColors', () => {
  let root: HTMLElement

  beforeEach(() => {
    root = document.createElement('div')
    document.body.appendChild(root)
  })

  afterEach(() => {
    document.body.removeChild(root)
  })

  it('flags inline hex color', () => {
    root.innerHTML = `<div style="color: #ff0000">text</div>`
    const findings = runHexColors(root)
    expect(findings.length).toBeGreaterThan(0)
    expect(findings[0].actual).toContain('#ff0000')
  })

  it('passes CSS variable usage', () => {
    root.innerHTML = `<div style="color: var(--accent)">text</div>`
    const findings = runHexColors(root)
    expect(findings).toHaveLength(0)
  })

  it('skips SVG descendants', () => {
    root.innerHTML = `<svg><rect style="fill: #aabbcc"></rect></svg>`
    const findings = runHexColors(root)
    expect(findings).toHaveLength(0)
  })

  it('skips elements with data-allow-hex', () => {
    root.innerHTML = `<div data-allow-hex="true" style="color: #123456">text</div>`
    const findings = runHexColors(root)
    expect(findings).toHaveLength(0)
  })

  it('flags 3-char hex', () => {
    root.innerHTML = `<div style="color: #abc">text</div>`
    const findings = runHexColors(root)
    expect(findings.length).toBeGreaterThan(0)
  })
})
