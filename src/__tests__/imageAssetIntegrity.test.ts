import { existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { CURATED_PORTRAIT_INDICES } from '../domain/services/portraitService'

const illustrationNames = [
  'academy-breakthrough', 'annandagen', 'avsked', 'board-ultimatum',
  'bruksort-header', 'career-break', 'club-democracy', 'cup', 'cupguld',
  'derby', 'facility-completed', 'final', 'game-over', 'intro', 'kafferummet',
  'klack-konflikt', 'klack-tifo', 'mecenat-dinner', 'nedflyttning', 'nyar',
  'premiar', 'press', 'season-end', 'valet', 'varsol', 'burnout-ceiling',
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
      expectNonEmptyPublicAsset(`assets/illustrations/${name}.webp`)
    }
    for (const name of clubIntroNames) {
      expectNonEmptyPublicAsset(`assets/illustrations/intro-${name}.webp`)
    }
  })

  it('keeps the three narrative moment illustrations in the shared compressed format', async () => {
    for (const name of ['burnout-ceiling', 'klack-tifo', 'klack-konflikt'] as const) {
      const relativePath = `assets/illustrations/${name}.webp`
      const metadata = await sharp(resolve(process.cwd(), 'public', relativePath)).metadata()
      expect(metadata.format, relativePath).toBe('webp')
      expect(metadata.width, relativePath).toBeLessThanOrEqual(1170)
    }
  })

  it('has every curated portrait that the selector can return in the shared transparent product format', async () => {
    for (const [tier, indices] of Object.entries(CURATED_PORTRAIT_INDICES)) {
      for (const index of indices) {
        const relativePath = `assets/portraits/portrait_${tier}_${index}.png`
        expectNonEmptyPublicAsset(relativePath)
        const metadata = await sharp(resolve(process.cwd(), 'public', relativePath)).metadata()
        expect(metadata, relativePath).toMatchObject({ format: 'png', width: 400, height: 400, hasAlpha: true })
      }
    }
  })

  it('has all three production badge sizes for every playable club', () => {
    for (const name of clubIntroNames) {
      expectNonEmptyPublicAsset(`assets/clubs/${name}/badge-16.svg`)
      expectNonEmptyPublicAsset(`assets/clubs/${name}/badge-32.svg`)
      expectNonEmptyPublicAsset(`assets/clubs/${name}/badge-64.svg`)
    }
  })

  it('has all directly linked shell and brand images', () => {
    for (const path of ['bandymanager-logo.png', 'buryfen-logo.png', 'intro-bg.jpg', 'icon-192.png', 'icon-512.png', 'icon.svg']) {
      expectNonEmptyPublicAsset(path)
    }
  })
})
