import type { Finding } from '../types'

export function runEmojiConsistency(_root: HTMLElement): Finding[] {
  const findings: Finding[] = []
  const screenPath = window.location.pathname
  // innerText requires layout (not available in jsdom) — fall back to textContent
  const text: string = document.body.innerText ?? document.body.textContent ?? ''

  if (text.includes('⚽')) {
    findings.push({
      rule: 'emojiConsistency',
      severity: 'error',
      message: '⚽ hittad — bandy använder 🏒, aldrig ⚽',
      selector: 'document.body',
      actual: '⚽',
      expected: '🏒',
      screenPath,
    })
  }

  if (text.includes('🟨')) {
    findings.push({
      rule: 'emojiConsistency',
      severity: 'error',
      message: '🟨 hittad — bandy har 10 min utvisning, inte gula kort',
      selector: 'document.body',
      actual: '🟨',
      expected: 'ta bort (bandy = utvisning, inte gult kort)',
      screenPath,
    })
  }

  if (text.includes('🟥')) {
    findings.push({
      rule: 'emojiConsistency',
      severity: 'error',
      message: '🟥 hittad — bandy har 10 min utvisning, inte röda kort',
      selector: 'document.body',
      actual: '🟥',
      expected: 'ta bort (bandy = utvisning, inte rött kort)',
      screenPath,
    })
  }

  return findings
}
