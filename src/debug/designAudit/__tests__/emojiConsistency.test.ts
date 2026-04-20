import { describe, it, expect, afterEach } from 'vitest'
import { runEmojiConsistency } from '../rules/emojiConsistency'

describe('emojiConsistency', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('flags ⚽ in body text', () => {
    document.body.innerHTML = `<div>Match ⚽ idag</div>`
    const findings = runEmojiConsistency(document.body)
    expect(findings.some(f => f.actual === '⚽')).toBe(true)
  })

  it('flags 🟨 (gult kort) in body text', () => {
    document.body.innerHTML = `<div>🟨 utvisning</div>`
    const findings = runEmojiConsistency(document.body)
    expect(findings.some(f => f.actual === '🟨')).toBe(true)
  })

  it('flags 🟥 (rött kort) in body text', () => {
    document.body.innerHTML = `<div>🟥 utvisning</div>`
    const findings = runEmojiConsistency(document.body)
    expect(findings.some(f => f.actual === '🟥')).toBe(true)
  })

  it('passes when none of the forbidden emojis are present', () => {
    document.body.innerHTML = `<div>🏒 Match idag</div>`
    const findings = runEmojiConsistency(document.body)
    expect(findings).toHaveLength(0)
  })
})
