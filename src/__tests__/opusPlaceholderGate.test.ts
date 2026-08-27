import { describe, it, expect } from 'vitest'
import { scanOpusPlaceholders } from '../../tests/grind/opusPlaceholderGate'

/**
 * A-H4b (SLUTTEST_KO.md, SEXSÄSONGSAUDITEN) — OPUS-PLATSHÅLLARGRINDEN.
 * Se tests/grind/opusPlaceholderGate.ts för rotorsak, metod och den
 * TEMPORÄRA allowlistens innehåll (varje rad = ett känt öppet läckage,
 * inte ett godkänt permanent hem för '[Opus]').
 *
 * Baseline = dagens exakta antal per fil (allowlistens maxAllowed). Ett
 * brott betyder antingen en HELT NY fil med '[Opus]' i produktionskod,
 * eller ett NYTT fält i en redan listad fil — bägge är regressioner som
 * ska stoppa bygget, inte tystas.
 */
describe('OPUS-PLATSHÅLLARGRINDEN — ingen [Opus]-platshållare läcker oanmäld till spelaren', () => {
  it('inga [Opus]-fynd utanför den temporära, dokumenterade allowlistan', () => {
    const violations = scanOpusPlaceholders()
    if (violations.length > 0) {
      throw new Error(
        `${violations.length} fil(er) har fler '[Opus]'-platshållare än den temporära allowlistan tillåter:\n` +
        violations.map(v =>
          `  - ${v.file}: ${v.count}× hittade, ${v.allowed}× tillåtna` +
          (v.reason ? ` (${v.reason})` : ' (INTE på allowlistan — nytt läckage, lägg ALDRIG bara till en rad utan att verifiera att Opus verkligen inte redan skrivit texten)'),
        ).join('\n') +
        '\n\nOpus skriver texterna (CLAUDE.md: SVENSK TEXT — CODE SKRIVER ALDRIG). Lägg aldrig till en ny allowlist-rad för att få grön build — höj bara maxAllowed om du just NU dokumenterat en ny, medvetet tillfällig platshållare Opus ska fylla.',
      )
    }
    expect(violations).toEqual([])
  })
})

describe('opusPlaceholderGate — mönstret fångar en nyintroducerad platshållare', () => {
  it('fångar literalen i okommenterad kod', async () => {
    const { stripComments } = await import('../../tests/grind/forbudslistan')
    const RAW_PATTERN = /\[Opus\]/g
    const leak = "newInboxItems.push({ title: '[Opus]', body: '[Opus]' })"
    expect(stripComments(leak).match(RAW_PATTERN)).toHaveLength(2)
  })

  it('ignorerar literalen när den bara nämns i en kommentar', async () => {
    const { stripComments } = await import('../../tests/grind/forbudslistan')
    const RAW_PATTERN = /\[Opus\]/g
    const onlyComment = "// SVENSK TEXT — CODE SKRIVER ALDRIG: platshållare '[Opus]' tills Opus levererar\nconst x = 1"
    expect(stripComments(onlyComment).match(RAW_PATTERN)).toBeNull()
  })
})
