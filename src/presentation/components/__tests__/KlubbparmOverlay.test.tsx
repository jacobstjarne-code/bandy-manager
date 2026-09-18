import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { KLUBBPARM_CHAPTERS } from '../../../domain/data/klubbparmContent'
import { KlubbparmOverlay } from '../KlubbparmOverlay'

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

describe('Klubbpärmen', () => {
  it('öppnar alla skrivna kapitel även i en helt ny karriär', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
    act(() => root.render(<KlubbparmOverlay game={game} onClose={() => {}} />))

    const dialog = document.querySelector<HTMLElement>('[role="dialog"][aria-label="Klubbpärmen"]')!
    expect(dialog).not.toBeNull()

    for (const chapter of KLUBBPARM_CHAPTERS) {
      const tab = [...dialog.querySelectorAll<HTMLButtonElement>('button')]
        .find(button => button.textContent === chapter.label)!
      expect(tab.disabled).toBe(false)
      act(() => tab.click())
      expect(dialog.textContent).toContain(`Kapitel · ${chapter.label}`)
      expect(dialog.querySelector('details summary')?.textContent).toContain('Läs mer')
    }

    expect(dialog.querySelectorAll('button[disabled]')).toHaveLength(0)
    expect(dialog.textContent).not.toContain('Kapitlet öppnas när systemet låses upp')
  })

  it('visar matchens hörnplan utan påhittade procentsatser', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
    act(() => root.render(<KlubbparmOverlay game={game} onClose={() => {}} />))

    const dialog = document.querySelector<HTMLElement>('[role="dialog"][aria-label="Klubbpärmen"]')!
    expect(dialog.querySelector('svg text')?.textContent).toBe('MV')
    expect(dialog.textContent).toContain('Oddsen visas först i matchen')
    expect(dialog.textContent).not.toMatch(/\d+\s*%/)
  })

  it('använder spelfas, puls, kassa och spelets illustrationer i övriga kapitel', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
    const game = { ...base, communityStanding: 73 }
    act(() => root.render(<KlubbparmOverlay game={game} onClose={() => {}} />))
    const dialog = document.querySelector<HTMLElement>('[role="dialog"][aria-label="Klubbpärmen"]')!
    const open = (label: string) => {
      const tab = [...dialog.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === label)!
      act(() => tab.click())
    }

    open('Matchen')
    expect(dialog.querySelector('img')?.getAttribute('src')).toBe('/assets/illustrations/premiar.webp')
    expect(dialog.querySelector('.mf-rps')?.textContent).toContain('FÖRBERED')
    expect(dialog.querySelector('.mf-rps')?.textContent).toContain('GRANSKA')

    open('Orten')
    expect(dialog.querySelector('img')?.getAttribute('src')).toBe('/assets/illustrations/bruksort-header.webp')
    expect(dialog.querySelector('[aria-label="Spelgrafik: Orten"]')?.textContent).toContain('73')

    open('Klacken')
    expect(dialog.querySelector('img')?.getAttribute('src')).toBe('/assets/illustrations/klack-tifo.webp')

    open('Ekonomi')
    expect(dialog.querySelector('[aria-label="Spelgrafik: Ekonomi"]')?.textContent).toContain('Saldo')
    expect(dialog.querySelector('[aria-label="Spelgrafik: Ekonomi"]')?.textContent).toContain('Transferbudget')

    open('Slutspel')
    expect(dialog.querySelector('img')?.getAttribute('src')).toBe('/assets/illustrations/final.webp')
    expect(dialog.textContent).not.toContain('Ur spelet')
  })
})
