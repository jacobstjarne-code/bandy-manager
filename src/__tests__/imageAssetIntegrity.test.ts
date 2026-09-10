import { existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CURATED_PORTRAIT_INDICES } from '../domain/services/portraitService'

const illustrationNames = [
  'academy-breakthrough', 'annandagen', 'avsked', 'board-ultimatum',
  'bruksort-header', 'career-break', 'club-democracy', 'cup', 'cupguld',
  'derby', 'facility-completed', 'final', 'game-over', 'intro', 'kafferummet',
  'mecenat-dinner', 'nedflyttning', 'nyar', 'premiar', 'press', 'season-end',
  'valet', 'varsol',
] as const

const clubIntroNames = [
  'forsbacka', 'gagnef', 'halleforsnas', 'heros', 'karlsborg', 'lesjofors',
  'malilla', 'rogle', 'skutskar', 'slottsbron', 'soderfors', 'vastanfors',
] as const

function expectNonEmptyPublicAsset(relativePath: string) {
  const absolutePath = resolve(process.cwd(), 'public', relativePath)
  expect(existsSync(absolutePath), relativePath).toBe(true)
  expect(statSync(absolutePath).size, relativePath).toBeGreaterThan(0)
}

describe('product image asset integrity', () => {
  it('has every illustration selected by a production image surface', () => {
    for (const name of illustrationNames) {
      expectNonEmptyPublicAsset(`assets/illustrations/${name}.jpg`)
    }
    for (const name of clubIntroNames) {
      expectNonEmptyPublicAsset(`assets/illustrations/intro-${name}.webp`)
    }
  })

  it('has every curated portrait that the selector can return', () => {
    for (const [tier, indices] of Object.entries(CURATED_PORTRAIT_INDICES)) {
      for (const index of indices) {
        expectNonEmptyPublicAsset(`assets/portraits/portrait_${tier}_${index}.png`)
      }
    }
  })

  it('has all directly linked shell and brand images', () => {
    for (const path of ['bandymanager-logo.png', 'buryfen-logo.png', 'intro-bg.jpg', 'icon-192.png', 'icon-512.png', 'icon.svg']) {
      expectNonEmptyPublicAsset(path)
    }
  })
})
