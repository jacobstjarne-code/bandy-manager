import { describe, it, expect } from 'vitest'
import { scanOpusPlaceholders, STALENESS_DAYS } from '../../tests/grind/opusPlaceholderGate'

/**
 * A-H4b (SLUTTEST_KO.md, SEXSÄSONGSAUDITEN) — OPUS-PLATSHÅLLARGRINDEN.
 * SPEC_SANNINGSGRINDAR_2026-08-31.md GRIND 1 (2026-09-01): grinden vände —
 * se tests/grind/opusPlaceholderGate.ts för rotorsak och den nya
 * reachable/staleness-logiken. En `reachable:true`-post är ALLTID en
 * violation vid count>0 (maxAllowed ignoreras); en `reachable:false`-post
 * är en violation vid over-limit ELLER när den blivit för gammal
 * (STALENESS_DAYS). Ingen kombination är ett godkänt permanent hem för
 * '[Opus]'.
 */
describe('OPUS-PLATSHÅLLARGRINDEN — ingen [Opus]-platshållare läcker oanmäld till spelaren', () => {
  it('inga [Opus]-fynd utanför den temporära, dokumenterade allowlistan', () => {
    const violations = scanOpusPlaceholders()
    if (violations.length > 0) {
      throw new Error(
        `${violations.length} fil(er) bryter mot OPUS-PLATSHÅLLARGRINDEN:\n` +
        violations.map(v => {
          if (v.cause === 'reachable') return `  - ${v.file}: ${v.count}× NÅBAR platshållare — hard fail, ingen maxAllowed gäller (${v.reason})`
          if (v.cause === 'stale') return `  - ${v.file}: ${v.count}× hittade — allowlist-posten är för gammal (${v.reason})`
          if (v.cause === 'over-limit') return `  - ${v.file}: ${v.count}× hittade, ${v.allowed}× tillåtna (${v.reason})`
          return `  - ${v.file}: ${v.count}× hittade — INTE på allowlistan, nytt läckage. Lägg ALDRIG bara till en rad utan att verifiera att Opus verkligen inte redan skrivit texten.`
        }).join('\n') +
        '\n\nOpus skriver texterna (CLAUDE.md: SVENSK TEXT — CODE SKRIVER ALDRIG). En `reachable:true`-violation löses genom att Opus skriver texten (eller att Code bevisar att ytan faktiskt är onåbar och ändrar flaggan). En `stale`-violation löses genom att antingen fylla texten eller — om den fortfarande är genuint strukturellt overifierad — uppdatera `since` i samma commit som en förnyad motivering.',
      )
    }
    expect(violations).toEqual([])
  })
})

describe('opusPlaceholderGate — reachable/staleness-vändningen (GRIND 1, 2026-09-01)', () => {
  it('reachable-violationer (om några finns just nu) ignorerar alltid maxAllowed', () => {
    // scanOpusPlaceholders() sveper den RIKTIGA src/-katalogen mot den
    // RIKTIGA (levande) ALLOWLIST — beroende på vilka platshållare som
    // råkar vara ofyllda just nu kan denna lista vara tom (grönt, giltigt
    // utfall) eller innehålla poster. Invarianten som testas är formen,
    // inte en specifik fil: en reachable-violation rapporterar ALDRIG
    // `allowed` som en gräns (den är alltid 0 — maxAllowed ignoreras helt).
    const violations = scanOpusPlaceholders()
    const reachableViolations = violations.filter(v => v.cause === 'reachable')
    for (const v of reachableViolations) {
      expect(v.count).toBeGreaterThan(0)
      expect(v.allowed).toBe(0)
    }
  })

  it('en reachable:false-post äldre än STALENESS_DAYS blir stale, oavsett count', () => {
    const farFuture = new Date(Date.now() + (STALENESS_DAYS + 5) * 86_400_000)
    const violations = scanOpusPlaceholders(farFuture)
    const staleFiles = violations.filter(v => v.cause === 'stale').map(v => v.file)
    // De fyra reachable:false-posterna (turneringslageService.ts, valetScene.ts,
    // KlubbparmOverlay.tsx, contentContract.ts) ska ALLA bli stale om klockan
    // hoppar STALENESS_DAYS+5 dagar framåt, oavsett att de låg under maxAllowed idag.
    expect(staleFiles).toContain('src/domain/services/turneringslageService.ts')
    expect(staleFiles).toContain('src/domain/data/scenes/valetScene.ts')
    expect(staleFiles).toContain('src/presentation/components/KlubbparmOverlay.tsx')
    expect(staleFiles).toContain('src/domain/data/contentContract.ts')
  })

  it('samma reachable:false-poster ger INGEN stale-violation vid dagens datum (inom fönstret)', () => {
    const violations = scanOpusPlaceholders(new Date())
    const staleFiles = violations.filter(v => v.cause === 'stale').map(v => v.file)
    expect(staleFiles).not.toContain('src/domain/services/turneringslageService.ts')
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
