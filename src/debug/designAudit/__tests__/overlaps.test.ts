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
})
