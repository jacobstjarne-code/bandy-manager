import { describe, it, expect } from 'vitest'
import { scanForbudslistan, stripComments, FORBUDSLISTA } from '../../tests/grind/forbudslistan'

/**
 * PÅSTÅENDEGRINDEN nivå 2 (docs/PASTAENDEGRINDEN_2026-08-24.md) —
 * förbudslistan. Se tests/grind/forbudslistan.ts för rotorsak och metod.
 *
 * Till skillnad från routeSceneCoverage (H1 meta-grinden, ratchet mot känd
 * skuld): varje rad i förbudslistan är en yta som redan är fixad idag.
 * Baseline är 0 — ett brott är en regression, inte oadresserad skuld, så
 * detta testet failar hårt istf att ratcheta.
 */
describe('PÅSTÅENDEGRINDEN nivå 2 — förbudslistan', () => {
  it('ingen av de åtta kända proxymönstren har återfallit', () => {
    const violations = scanForbudslistan()
    if (violations.length > 0) {
      throw new Error(
        `${violations.length} brott mot förbudslistan:\n` +
        violations.map(v => `  - [${v.ruleId}] ${v.file} (${v.kind}): ${v.detail}`).join('\n'),
      )
    }
    expect(violations).toEqual([])
  })

  it('kommentar-strippningen tar bort rotorsak-prosa men inte kod', () => {
    const source = [
      '// läste tidigare fulfillmentPct för att avgöra state',
      'const x = fulfillmentPct >= 80 ? "B" : "C"',
      '/* fanMood är fel fält här */',
      'const y = game.supporterGroup?.mood',
    ].join('\n')
    const stripped = stripComments(source)
    expect(stripped).not.toContain('läste tidigare')
    expect(stripped).not.toContain('fel fält här')
    expect(stripped).toContain('fulfillmentPct >= 80')
    expect(stripped).toContain('game.supporterGroup?.mood')
  })

  it('varje rad har minst en fil och minst en check (ingen tom regel av misstag)', () => {
    for (const rule of FORBUDSLISTA) {
      expect(rule.files.length).toBeGreaterThan(0)
      for (const file of rule.files) {
        const totalChecks = (file.forbidden?.length ?? 0) + (file.required?.length ?? 0)
        expect(totalChecks).toBeGreaterThan(0)
      }
    }
  })

  it('varje förbjuden pattern matchar verkligen den historiska buggen (annars är regeln blind)', () => {
    const historicalBugs: Record<string, string> = {
      'vilket-val-spelaren-gjorde': "const key = entry.detail === 'lowered_tempo' ? htTempo : htPress",
      'styrelsens-nojdhet': 'state = fulfillmentPct >= 80 ? \'B\' : \'C\'',
      'publikens-humor': 'const fm = game.fanMood ?? 50',
      'ordning-mellan-matcher': 'games.sort((a, b) => b.roundNumber - a.roundNumber)',
      'vem-eliminerades': 'const bracket = game?.playoffBracket',
      'vem-blev-mastare': 'const champId = game?.playoffBracket?.champion',
      'sasongsindex-naket-tal': 'return `t.o.m. säsong ${contractUntilSeason}`',
      'sasongsfras-verifierad': 'const premiss = `${n.goalsAgainstUs} mål mot er den här säsongen.`',
    }
    for (const rule of FORBUDSLISTA) {
      const bug = historicalBugs[rule.id]
      if (!bug) continue // spelare-lamnat/lagets-form är required-only, inget "typiskt fel"-mönster att testa
      const forbiddenPatterns = rule.files.flatMap(f => f.forbidden ?? [])
      expect(forbiddenPatterns.length).toBeGreaterThan(0)
      const anyMatches = forbiddenPatterns.some(check => new RegExp(check.pattern).test(bug))
      expect(anyMatches, `regel "${rule.id}" fångar inte sin egen historiska bugg: ${bug}`).toBe(true)
    }
  })

  it('rapporterar antal regler (informativ)', () => {
    // eslint-disable-next-line no-console
    console.log(`[PÅSTÅENDEGRINDEN nivå 2] ${FORBUDSLISTA.length} regler, ${
      FORBUDSLISTA.reduce((sum, r) => sum + r.files.length, 0)
    } filkontroller.`)
    expect(FORBUDSLISTA.length).toBeGreaterThan(0)
  })
})
