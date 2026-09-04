import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { runOverlaps } from '../rules/overlaps'

describe('overlaps', () => {
  let root: HTMLElement

  beforeEach(() => {
    root = document.createElement('div')
    document.body.appendChild(root)
  })

  afterEach(() => {
    document.body.removeChild(root)
  })

  it('warns on sticky inside overflow-auto card-sharp (LESSONS #9)', () => {
    root.innerHTML = `
      <div class="card-sharp" style="overflow-y:auto">
        <div style="position:sticky;bottom:0">sticky footer</div>
      </div>
    `
    const findings = runOverlaps(root)
    expect(findings.some(f => f.rule === 'overlaps')).toBe(true)
  })

  it('does not warn on sticky outside scroll container', () => {
    root.innerHTML = `
      <div class="card-sharp">
        <div style="position:sticky;top:0">sticky header</div>
      </div>
    `
    const findings = runOverlaps(root)
    expect(findings).toHaveLength(0)
  })

  it('does not warn on sticky outside card-sharp', () => {
    root.innerHTML = `
      <div style="overflow-y:auto">
        <div style="position:sticky;bottom:0">sticky</div>
      </div>
    `
    const findings = runOverlaps(root)
    expect(findings).toHaveLength(0)
  })

  // design-b4-simulera-bar-fotkrock — jsdom gör ingen riktig layout, så
  // getBoundingClientRect mockas per element för att simulera en verklig
  // geometrisk krock/icke-krock (samma teknik krävs oavsett testram här).
  function mockRect(el: Element, rect: Partial<DOMRect>) {
    const full = { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, toJSON: () => ({}), ...rect }
    el.getBoundingClientRect = () => full as DOMRect
  }

  it('design-b4: flaggar en fast bottenrad (data-fixed-bottom-bar) som täcker synligt innehåll', () => {
    root.innerHTML = `
      <div class="card-stack">
        <p class="foot-row">Kondition 74%</p>
      </div>
      <div data-fixed-bottom-bar>
        <button>Simulera resterande säsong</button>
      </div>
    `
    const foot = root.querySelector('.foot-row')!
    const bar = root.querySelector('[data-fixed-bottom-bar]')!
    mockRect(foot, { top: 700, bottom: 730, left: 0, right: 300, width: 300, height: 30 })
    mockRect(bar, { top: 690, bottom: 780, left: 0, right: 390, width: 390, height: 90 })

    const findings = runOverlaps(root)
    expect(findings.some(f => f.message.includes('design-b4-klassen'))).toBe(true)
  })

  it('design-b4: varnar inte när paddingBottom håller innehållet ovanför baren', () => {
    root.innerHTML = `
      <div class="card-stack">
        <p class="foot-row">Kondition 74%</p>
      </div>
      <div data-fixed-bottom-bar>
        <button>Simulera resterande säsong</button>
      </div>
    `
    const foot = root.querySelector('.foot-row')!
    const bar = root.querySelector('[data-fixed-bottom-bar]')!
    mockRect(foot, { top: 600, bottom: 630, left: 0, right: 300, width: 300, height: 30 })
    mockRect(bar, { top: 690, bottom: 780, left: 0, right: 390, width: 390, height: 90 })

    const findings = runOverlaps(root)
    expect(findings.some(f => f.message.includes('design-b4-klassen'))).toBe(false)
  })

  it('design-b4: ignorerar fast element utan data-fixed-bottom-bar-markören (t.ex. BottomNav)', () => {
    root.innerHTML = `
      <div class="card-stack">
        <p class="foot-row">Kondition 74%</p>
      </div>
      <div class="bottom-nav">
        <button>Hem</button>
      </div>
    `
    const foot = root.querySelector('.foot-row')!
    const nav = root.querySelector('.bottom-nav')!
    mockRect(foot, { top: 700, bottom: 730, left: 0, right: 300, width: 300, height: 30 })
    mockRect(nav, { top: 690, bottom: 780, left: 0, right: 390, width: 390, height: 90 })

    const findings = runOverlaps(root)
    expect(findings).toHaveLength(0)
  })
})
