import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
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

function renderMatchFlow(onTactic = vi.fn()) {
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
        subTabs={[
          { id: 'lineup', label: 'Trupp', active: true, onClick: () => {} },
          { id: 'tactic', label: 'Taktik', active: false, onClick: onTactic },
        ]}
        stamp={{ label: 'FYLL ELVAN FÖRST', onClick: () => {}, disabled: true }}
      >
        <div>Förberedelse</div>
      </MatchFlowFrame>,
    )
  })
  return { onTactic }
}

describe('MatchFlowFrame — Förbered', () => {
  it('renderar subflikarna under RPS-stripen och aktiverar deras handlingar', () => {
    const { onTactic } = renderMatchFlow()
    const subTabs = container!.querySelector('.mf-subtabs')!
    const body = container!.querySelector('.mf-body')!
    expect(subTabs.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect([...subTabs.querySelectorAll('button')].map(button => button.textContent)).toEqual(['Trupp', 'Taktik'])

    act(() => { (subTabs.querySelectorAll('button')[1] as HTMLButtonElement).click() })
    expect(onTactic).toHaveBeenCalledOnce()
  })

  it('visar spärrad status i samma stämpel i stället för en separat CTA', () => {
    renderMatchFlow()
    const stamp = container!.querySelector('.mf-stamp') as HTMLButtonElement
    expect(stamp.disabled).toBe(true)
    expect(stamp.textContent).toBe('FYLL ELVAN FÖRST')
  })
})
