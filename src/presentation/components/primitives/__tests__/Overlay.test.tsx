/**
 * M4 (audit 5c9a7a8, 2026-08-24): "Facility-sheeten är generic utan dialog/
 * aria-modal/fokusfälla." Overlay är den nya delade primitiven för alla
 * helskärms-overlays/bottensheets — detta testar exakt de fyra kraven
 * auditen namngav: role=dialog/aria-modal, fokusfälla (Tab/Shift+Tab
 * cyklar bara inom dialogen), Escape stänger, och inert bakgrund.
 *
 * Manuell createRoot+act-rendering (samma mönster som GameShell.test.tsx)
 * — projektet saknar @testing-library/react.
 */
import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { ComponentProps } from 'react'
import { Overlay } from '../Overlay'

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

let appRoot: HTMLDivElement
let container: HTMLDivElement | null = null
let root: Root | null = null

beforeEach(() => {
  appRoot = document.createElement('div')
  appRoot.id = 'root'
  document.body.appendChild(appRoot)
})

afterEach(() => {
  if (root) { act(() => { root!.unmount() }); root = null }
  if (container) { container.remove(); container = null }
  appRoot.remove()
})

function renderOverlay(onClose: () => void, children: React.ReactNode, props: Partial<ComponentProps<typeof Overlay>> = {}) {
  container = document.createElement('div')
  appRoot.appendChild(container) // renderas "inuti" #root, som de riktiga anropsställena
  root = createRoot(container)
  act(() => {
    root!.render(<Overlay onClose={onClose} ariaLabel="Test-dialog" {...props}>{children}</Overlay>)
  })
}

describe('Overlay — M4: dialog-semantik, fokusfälla, Escape, inert bakgrund', () => {
  it('portalerar till document.body med role=dialog, aria-modal och aria-label', () => {
    renderOverlay(() => {}, <button>Knapp</button>)
    const dialog = document.body.querySelector('[role="dialog"]')
    expect(dialog).not.toBeNull()
    expect(dialog!.getAttribute('aria-modal')).toBe('true')
    expect(dialog!.getAttribute('aria-label')).toBe('Test-dialog')
    // Portalerad UTANFÖR #root — inte ett barn till appRoot i DOM:en.
    expect(appRoot.contains(dialog)).toBe(false)
  })

  it('sätter inert på #root medan overlayn är öppen, tar bort den vid unmount', () => {
    expect(appRoot.hasAttribute('inert')).toBe(false)
    renderOverlay(() => {}, <button>Knapp</button>)
    expect(appRoot.hasAttribute('inert')).toBe(true)
    act(() => { root!.unmount() })
    root = null
    expect(appRoot.hasAttribute('inert')).toBe(false)
  })

  it('Escape anropar onClose', () => {
    let closed = false
    renderOverlay(() => { closed = true }, <button>Knapp</button>)
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    expect(closed).toBe(true)
  })

  it('klick på bakgrunden anropar onClose, klick på innehållet gör INTE det', () => {
    let closed = false
    renderOverlay(() => { closed = true }, <button data-testid="inner">Knapp</button>)
    const inner = document.body.querySelector('[data-testid="inner"]') as HTMLButtonElement
    act(() => { inner.click() })
    expect(closed).toBe(false)

    const backdrop = document.body.querySelector('[role="dialog"]') as HTMLDivElement
    act(() => { backdrop.click() })
    expect(closed).toBe(true)
  })

  it('kan låsa Escape och bakgrund för blockerande flöden', () => {
    let closeCount = 0
    renderOverlay(() => { closeCount++ }, <button>Knapp</button>, {
      closeOnEscape: false,
      closeOnBackdrop: false,
    })
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      ;(document.body.querySelector('[role="dialog"]') as HTMLDivElement).click()
    })
    expect(closeCount).toBe(0)
  })

  it('kan portaleras utan att göra app-roten inert för en lokal dock', () => {
    renderOverlay(() => {}, <button>Knapp</button>, {
      inertBackground: false,
      trapFocus: false,
      autoFocus: false,
    })
    expect(appRoot.hasAttribute('inert')).toBe(false)
  })

  it('kan stanna inline så en lokal dock ärver förälderns pointer-events', () => {
    renderOverlay(() => {}, <button>Knapp</button>, {
      portal: false,
      inertBackground: false,
    })
    const dialog = appRoot.querySelector('[role="dialog"]')
    expect(dialog).not.toBeNull()
    expect(appRoot.contains(dialog)).toBe(true)
  })

  it('fokusfälla: Tab från sista knappen wrappar till första, inte ut ur dialogen', () => {
    renderOverlay(() => {}, (
      <>
        <button data-testid="first">Första</button>
        <button data-testid="last">Sista</button>
      </>
    ))
    const first = document.body.querySelector('[data-testid="first"]') as HTMLButtonElement
    const last = document.body.querySelector('[data-testid="last"]') as HTMLButtonElement

    act(() => { last.focus() })
    expect(document.activeElement).toBe(last)

    act(() => {
      const evt = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
      document.dispatchEvent(evt)
    })
    expect(document.activeElement).toBe(first)
  })

  it('fokusfälla: Shift+Tab från första knappen wrappar till sista', () => {
    renderOverlay(() => {}, (
      <>
        <button data-testid="first">Första</button>
        <button data-testid="last">Sista</button>
      </>
    ))
    const first = document.body.querySelector('[data-testid="first"]') as HTMLButtonElement
    const last = document.body.querySelector('[data-testid="last"]') as HTMLButtonElement

    act(() => { first.focus() })
    expect(document.activeElement).toBe(first)

    act(() => {
      const evt = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true })
      document.dispatchEvent(evt)
    })
    expect(document.activeElement).toBe(last)
  })

  it('flyttar fokus in i dialogen vid mount (första fokuserbara elementet)', () => {
    renderOverlay(() => {}, <button data-testid="first">Första</button>)
    const first = document.body.querySelector('[data-testid="first"]') as HTMLButtonElement
    expect(document.activeElement).toBe(first)
  })
})
