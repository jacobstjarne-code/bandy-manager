import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { MatchFlowFrame } from '../MatchFlowFrame'

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

let container: HTMLDivElement | null = null
let root: Root | null = null

afterEach(() => {
  if (root) act(() => root!.unmount())
  container?.remove()
  root = null
  container = null
})

function renderMatchFlow() {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root!.render(
      <MatchFlowFrame
        clubId="club_forsbacka"
        clubName="Forsbacka IK"
        managerName="Test"
        season="2026/27"
        roundLabel="OMGÅNG 1"
        phase="forbered"
        stepIndicator={[
          { id: 'lineup', label: '① Uppställning', state: 'current' },
          { id: 'tactic', label: '② Taktik', state: 'pending' },
        ]}
        stamp={{ label: 'FYLL ELVAN FÖRST', onClick: () => {}, disabled: true }}
      >
        <div>Förberedelse</div>
      </MatchFlowFrame>,
    )
  })
}

// matchflode-forbered-linjar (mock Forbered-flode.dc.html): stegindikatorn
// är LÄSBAR, inte klickbar — taktik är ett steg man passerar via stämpeln,
// aldrig en flik man kan hoppa till/förbi direkt.
describe('MatchFlowFrame — Förbered', () => {
  it('renderar stegindikatorn under RPS-stripen, läsbar utan klickbara element', () => {
    renderMatchFlow()
    const stepIndicator = container!.querySelector('.mf-subtabs')!
    const body = container!.querySelector('.mf-body')!
    expect(stepIndicator.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(stepIndicator.querySelectorAll('button')).toHaveLength(0)
    const steps = [...stepIndicator.querySelectorAll('.mf-step')]
    expect(steps.map(s => s.textContent)).toEqual(['① Uppställning', '② Taktik'])
    expect(steps[0].className).toContain('mf-step-current')
    expect(steps[1].className).toContain('mf-step-pending')
  })

  it('ett klart steg får en synlig ✓, inget klickbart element', () => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() => {
      root!.render(
        <MatchFlowFrame
          clubId="club_forsbacka" clubName="Forsbacka IK" managerName="Test"
          season="2026/27" roundLabel="OMGÅNG 1" phase="forbered"
          stepIndicator={[
            { id: 'lineup', label: '① Uppställning', state: 'done' },
            { id: 'tactic', label: '② Taktik', state: 'current' },
          ]}
          stamp={{ label: 'Spela →', onClick: () => {}, disabled: false }}
        >
          <div>Taktik</div>
        </MatchFlowFrame>,
      )
    })
    const steps = [...container!.querySelectorAll('.mf-step')]
    expect(steps[0].textContent).toBe('① Uppställning ✓')
    expect(steps[0].className).toContain('mf-step-done')
  })

  it('visar spärrad status i samma stämpel i stället för en separat CTA', () => {
    renderMatchFlow()
    const stamp = container!.querySelector('.mf-stamp') as HTMLButtonElement
    expect(stamp.disabled).toBe(true)
    expect(stamp.textContent).toBe('FYLL ELVAN FÖRST')
  })
})
