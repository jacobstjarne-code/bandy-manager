import { describe, it, expect, beforeEach } from 'vitest'
import { runCardPadding } from '../rules/cardPadding'

describe('cardPadding', () => {
  let root: HTMLElement

  beforeEach(() => {
    root = document.createElement('div')
    document.body.appendChild(root)
  })

  afterEach(() => {
    document.body.removeChild(root)
  })

  it('passes card-sharp with correct padding 10px 12px', () => {
    root.innerHTML = `<div class="card-sharp" style="padding: 10px 12px"></div>`
    // jsdom computed style reflects inline style
    const findings = runCardPadding(root)
    const errors = findings.filter(f => f.rule === 'cardPadding' && f.severity === 'error'
      && f.message.includes('card-sharp'))
    expect(errors).toHaveLength(0)
  })

  it('flags card-sharp with wrong padding', () => {
    root.innerHTML = `<div class="card-sharp" style="padding: 14px 16px"></div>`
    const findings = runCardPadding(root)
    const errors = findings.filter(f => f.rule === 'cardPadding' && f.severity === 'error')
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].actual).toContain('14px')
  })

  it('passes card-round with correct padding 8px 12px', () => {
    root.innerHTML = `<div class="card-round" style="padding: 8px 12px"></div>`
    const findings = runCardPadding(root)
    const errors = findings.filter(f => f.rule === 'cardPadding' && f.severity === 'error'
      && f.message.includes('card-round'))
    expect(errors).toHaveLength(0)
  })

  it('flags card-round with wrong padding', () => {
    root.innerHTML = `<div class="card-round" style="padding: 10px 14px"></div>`
    const findings = runCardPadding(root)
    const errors = findings.filter(f => f.message.includes('card-round'))
    expect(errors.length).toBeGreaterThan(0)
  })

  it('warns on inline borderRadius without card class', () => {
    root.innerHTML = `<div style="border-radius: 12px">content</div>`
    const findings = runCardPadding(root)
    const warns = findings.filter(f => f.severity === 'warn')
    expect(warns.length).toBeGreaterThan(0)
  })

  it('does not warn on inline borderRadius on btn-classed elements', () => {
    root.innerHTML = `<button class="btn" style="border-radius: 8px">click</button>`
    const findings = runCardPadding(root)
    const warns = findings.filter(f => f.severity === 'warn')
    expect(warns).toHaveLength(0)
  })

  it('does not warn on borderRadius: 50% (circular portrait dot)', () => {
    root.innerHTML = `<div style="border-radius: 50%; width: 22px; height: 22px">dot</div>`
    const findings = runCardPadding(root)
    const warns = findings.filter(f => f.severity === 'warn')
    expect(warns).toHaveLength(0)
  })

  it('does not warn on borderRadius containing 9999 (pill pattern)', () => {
    root.innerHTML = `<div style="border-radius: 9999px">pill</div>`
    const findings = runCardPadding(root)
    const warns = findings.filter(f => f.severity === 'warn')
    expect(warns).toHaveLength(0)
  })

  it('does not warn on inline borderRadius inside svg', () => {
    root.innerHTML = `<svg><g style="border-radius: 4px"></g></svg>`
    const findings = runCardPadding(root)
    const warns = findings.filter(f => f.severity === 'warn')
    expect(warns).toHaveLength(0)
  })
})
