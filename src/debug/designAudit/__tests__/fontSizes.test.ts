import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { runFontSizes } from '../rules/fontSizes'

describe('fontSizes', () => {
  let root: HTMLElement

  beforeEach(() => {
    root = document.createElement('div')
    document.body.appendChild(root)
  })

  afterEach(() => {
    document.body.removeChild(root)
  })

  it('flags font-size below 8px', () => {
    root.innerHTML = `<span style="font-size:7px">tiny text</span>`
    const findings = runFontSizes(root)
    expect(findings.some(f => f.severity === 'error' && f.message.includes('7px'))).toBe(true)
  })

  it('passes font-size of exactly 8px', () => {
    root.innerHTML = `<span style="font-size:8px">label</span>`
    const findings = runFontSizes(root)
    expect(findings.filter(f => f.severity === 'error')).toHaveLength(0)
  })

  it('warns on 9px uppercase with letter-spacing > 1px', () => {
    root.innerHTML = `<p style="font-size:9px;text-transform:uppercase;letter-spacing:2px">LABEL</p>`
    const findings = runFontSizes(root)
    expect(findings.some(f => f.severity === 'warn')).toBe(true)
  })

  it('does not warn on 9px uppercase without letter-spacing', () => {
    root.innerHTML = `<p style="font-size:9px;text-transform:uppercase;letter-spacing:0">LABEL</p>`
    const findings = runFontSizes(root)
    expect(findings.filter(f => f.severity === 'warn')).toHaveLength(0)
  })
})
