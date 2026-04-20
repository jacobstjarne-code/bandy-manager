import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { runSectionLabels } from '../rules/sectionLabels'

describe('sectionLabels', () => {
  let root: HTMLElement

  beforeEach(() => {
    root = document.createElement('div')
    document.body.appendChild(root)
  })

  afterEach(() => {
    document.body.removeChild(root)
  })

  it('passes compliant section label', () => {
    root.innerHTML = `<p style="text-transform:uppercase;letter-spacing:2px;font-size:8px;font-weight:600">💰 EKONOMI</p>`
    const findings = runSectionLabels(root)
    expect(findings).toHaveLength(0)
  })

  it('flags fontSize 9px on section label', () => {
    root.innerHTML = `<p style="text-transform:uppercase;letter-spacing:2px;font-size:9px;font-weight:600">💰 EKONOMI</p>`
    const findings = runSectionLabels(root)
    const fs = findings.filter(f => f.message.includes('fontSize'))
    expect(fs.length).toBeGreaterThan(0)
  })

  it('flags wrong letterSpacing on section label', () => {
    root.innerHTML = `<p style="text-transform:uppercase;letter-spacing:2.5px;font-size:8px;font-weight:600">💰 EKONOMI</p>`
    const findings = runSectionLabels(root)
    const ls = findings.filter(f => f.message.includes('letterSpacing'))
    expect(ls.length).toBeGreaterThan(0)
  })

  it('warns when section label has no emoji', () => {
    root.innerHTML = `<p style="text-transform:uppercase;letter-spacing:2px;font-size:8px;font-weight:600">EKONOMI</p>`
    const findings = runSectionLabels(root)
    const warns = findings.filter(f => f.severity === 'warn')
    expect(warns.length).toBeGreaterThan(0)
  })

  it('does not flag uppercase BUTTON elements', () => {
    root.innerHTML = `<button style="text-transform:uppercase;letter-spacing:3px;font-size:13px;font-weight:700">STARTA KARRIÄREN</button>`
    const findings = runSectionLabels(root)
    expect(findings).toHaveLength(0)
  })
})
