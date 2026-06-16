import { describe, it, expect } from 'vitest'
import { createNewGame } from '../application/useCases/createNewGame'
import { advanceToNextEvent } from '../application/useCases/advanceToNextEvent'
import type { SaveGame } from '../domain/entities/SaveGame'

/**
 * T1 · Determinism-regressionstest (RC_BEDOMNING DEL 3 — "HÖGST VÄRDE").
 *
 * Math.random-fixen (kartfynd 10) återställde determinism-kontraktet: samma
 * spelläge → samma utfall. Inget skyddade det från att tyst regrera nästa gång
 * någon skriver simuleringskod med en osådd Math.random(). Detta gör det.
 *
 * Kontraktet (preRoundContextProcessor): baseSeed = seed ?? (matchday*1000 +
 * season*7). Appen anropar advance UTAN seed → determinismen vilar på det
 * state-härledda fröet. Därför är no-seed-replay nedan det skarpa testet: en
 * osådd Math.random() någonstans i round-pipelinen får de två körningarna att
 * divergera och fäller testet.
 */

function fresh(): SaveGame {
  return createNewGame({ managerName: 'Det', clubId: 'club_forsbacka', season: 2025, seed: 777 })
}

// Kompakt deterministiskt fingeravtryck av round-pipelinens reproducerbara utdata.
function fingerprint(g: SaveGame): string {
  const fixtures = g.fixtures
    .filter(f => f.status === 'completed')
    .map(f => `${f.id}:${f.homeScore}-${f.awayScore}:${(f.events ?? []).length}`)
    .sort()
  const standings = [...g.standings]
    .sort((a, b) => a.clubId.localeCompare(b.clubId))
    .map(s => `${s.clubId}:${s.points}:${s.played}:${s.goalsFor}-${s.goalsAgainst}`)
  const finances = [...g.clubs]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(c => `${c.id}:${c.finances}`)
  return JSON.stringify({ md: g.currentMatchday, fixtures, standings, finances, inbox: g.inbox.length })
}

describe('T1 determinism', () => {
  it('createNewGame: samma seed → identisk värld', () => {
    expect(fingerprint(fresh())).toBe(fingerprint(fresh()))
  })

  it('advanceToNextEvent UTAN seed: samma utgångsläge → identiskt resultat (round-pipeline)', () => {
    // Mirrorar appen (anropar advance utan seed). Fäller en osådd Math.random()
    // var som helst i round-processorn — inte bara i matchmotorn.
    const r1 = advanceToNextEvent(fresh())
    const r2 = advanceToNextEvent(fresh())
    expect(r1.roundPlayed).toBe(r2.roundPlayed)
    expect(fingerprint(r1.game)).toBe(fingerprint(r2.game))
  })

  it('advanceToNextEvent MED explicit seed: samma seed → identiskt resultat', () => {
    const r1 = advanceToNextEvent(fresh(), 4242)
    const r2 = advanceToNextEvent(fresh(), 4242)
    expect(fingerprint(r1.game)).toBe(fingerprint(r2.game))
  })

  it('sanity: skilda frön → skilt utfall (determinism ≠ konstant)', () => {
    const r1 = advanceToNextEvent(fresh(), 1)
    const r2 = advanceToNextEvent(fresh(), 999983)
    // Omgång 1 simulerar 6 matcher med fröet → olika frön ska (i praktiken
    // säkert) ge olika matchutfall. Skyddar mot att testet skulle passera på
    // ett konstant-buggat utfall.
    expect(fingerprint(r1.game)).not.toBe(fingerprint(r2.game))
  })

  it('determinism håller över flera omgångar (3 advances utan seed)', () => {
    function playThree(): SaveGame {
      let g = fresh()
      for (let i = 0; i < 3; i++) g = advanceToNextEvent(g).game
      return g
    }
    expect(fingerprint(playThree())).toBe(fingerprint(playThree()))
  })
})
