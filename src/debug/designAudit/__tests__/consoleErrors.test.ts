import { describe, it, expect } from 'vitest'
import { consoleErrors } from '../rules/consoleErrors'

describe('consoleErrors', () => {
  it('returns findings for buffered console.error calls', () => {
    // The module patches console.error at load time — trigger one
    console.error('test error from audit test')
    const findings = consoleErrors.getFindings(document.body)
    expect(findings.some(f => f.rule === 'consoleErrors' && f.severity === 'error')).toBe(true)
  })

  it('marks reactInfiniteLoop rule for update depth exceeded', () => {
    console.error('Minimum update depth exceeded. This can happen when a component calls setState inside useEffect')
    const findings = consoleErrors.getFindings(document.body)
    expect(findings.some(f => f.rule === 'reactInfiniteLoop' && f.severity === 'error')).toBe(true)
  })
})
