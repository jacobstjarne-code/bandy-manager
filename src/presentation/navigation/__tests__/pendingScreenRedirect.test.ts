import { describe, expect, it } from 'vitest'
import { PendingScreen } from '../../../domain/enums'
import { getPendingScreenRedirect } from '../pendingScreenRedirect'

describe('pending screen redirect', () => {
  it('redirectar varje ny skärm i en direkt obligatorisk skärmkedja', () => {
    expect(getPendingScreenRedirect(null, PendingScreen.QFSummary))
      .toBe('/game/qf-summary')
    expect(getPendingScreenRedirect(PendingScreen.QFSummary, PendingScreen.SeasonSummary))
      .toBe('/game/season-summary')
  })

  it('loopar inte tillbaka till samma redan omdirigerade skärm', () => {
    expect(getPendingScreenRedirect(PendingScreen.SeasonSummary, PendingScreen.SeasonSummary))
      .toBeNull()
  })

  it('gör inget när pending-skärm saknas', () => {
    expect(getPendingScreenRedirect(PendingScreen.QFSummary, null)).toBeNull()
  })
})
