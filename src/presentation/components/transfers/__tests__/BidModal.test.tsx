import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import type { Player } from '../../../../domain/entities/Player'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import { BidModal } from '../BidModal'

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

const player = {
  id: 'erik', firstName: 'Erik', lastName: 'Ström', clubId: 'other',
  marketValue: 280_000, salary: 12_000,
} as Player

const game = { managedClubId: 'managed', clubs: [{ id: 'managed' }] } as SaveGame
const managedClub = { transferBudget: 400_000, finances: 650_000 }

describe('Buddialogen', () => {
  it('visar budsumma i tkr men skickar beloppet i kronor', () => {
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    const onConfirm = vi.fn()
    act(() => root.render(<BidModal player={player} game={game} managedClub={managedClub} onClose={() => {}} onConfirm={onConfirm} />))

    const amount = document.querySelector<HTMLInputElement>('input[type="number"]')!
    expect(document.body.textContent).toContain('Budsumma (tkr)')
    expect(amount.value).toBe('280')
    act(() => (document.querySelector<HTMLButtonElement>('.transfers-bid-submit')!).click())
    expect(onConfirm).toHaveBeenCalledWith('erik', 280_000, 12_000, 3, {})

    act(() => root.unmount())
    host.remove()
  })

  it('håller fri-agent-läget utan budsumma och med avtalsvillkor', () => {
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    act(() => root.render(
      <BidModal
        player={{ ...player, clubId: 'free_agent' }} game={game} managedClub={managedClub}
        mode="freeAgent" salaryRange={{ min: 12_000, max: 18_000 }} minSalary={12_000}
        availableTerms={['housing']} onClose={() => {}} onConfirm={() => {}}
      />,
    ))
    expect(document.body.textContent).toContain('Lönekrav: 12–18 tkr/mån')
    expect(document.body.textContent).not.toContain('Budsumma')
    expect(document.body.textContent).toContain('Lägenhet')
    expect(document.querySelector<HTMLButtonElement>('.transfers-bid-submit')?.disabled).toBe(false)

    act(() => root.unmount())
    host.remove()
  })

  it('föreslår minst den lön som budregeln kräver', () => {
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    const onConfirm = vi.fn()
    act(() => root.render(<BidModal player={player} game={game} managedClub={managedClub} minSalary={14_000} onClose={() => {}} onConfirm={onConfirm} />))
    const salary = document.querySelectorAll<HTMLInputElement>('input[type="number"]')[1]
    expect(salary.value).toBe('14')
    act(() => document.querySelector<HTMLButtonElement>('.transfers-bid-submit')!.click())
    expect(onConfirm).toHaveBeenCalledWith('erik', 280_000, 14_000, 3, {})
    act(() => root.unmount())
    host.remove()
  })

  it('visar ett nekat bud i dialogen och rensar felet när spelaren ändrar erbjudandet', () => {
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    const onEdit = vi.fn()
    act(() => root.render(<BidModal player={player} game={game} managedClub={managedClub} error="Erik kräver minst 14 tkr/mån" onEdit={onEdit} onClose={() => {}} onConfirm={() => {}} />))
    expect(document.querySelector('[role="alert"]')?.textContent).toContain('14 tkr/mån')
    act(() => document.querySelector<HTMLButtonElement>('.transfers-year-btn')!.click())
    expect(onEdit).toHaveBeenCalledOnce()
    act(() => root.unmount())
    host.remove()
  })

  it('visar även fri agents nekade villkor i dialogen', () => {
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    const onEdit = vi.fn()
    act(() => root.render(
      <BidModal
        player={{ ...player, clubId: 'free_agent' }} game={game} managedClub={managedClub}
        mode="freeAgent" salaryRange={{ min: 12_000, max: 18_000 }} minSalary={12_000}
        error="Erik vill ha högre lön" onEdit={onEdit} onClose={() => {}} onConfirm={() => {}}
      />,
    ))
    expect(document.querySelector('[role="alert"]')?.textContent).toContain('högre lön')
    act(() => document.querySelector<HTMLButtonElement>('.transfers-year-btn')!.click())
    expect(onEdit).toHaveBeenCalled()
    act(() => root.unmount())
    host.remove()
  })
})
