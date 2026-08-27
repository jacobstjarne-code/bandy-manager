/**
 * A-L1 (SLUTTEST_KO.md): "Relation Relation" i Efterklangs journalist-sparkline.
 * Rotorsak: raden hade en synlig mono-etikett ("Relation") OCH skickade
 * label="Relation" vidare till <Sparkline>, som satte samma ord som SVG:ns
 * aria-label — allt som konkatenerar DOM-text (skärmläsare, ett design-audit-
 * skript som läser textContent/aria-label i sekvens) fick "Relation Relation".
 * Fix: Sparkline-anropet skickar inte längre label — den synliga etiketten
 * räcker, ingen egen aria-label krävs på en rent dekorativ SVG intill den.
 * @testing-library/react är inte installerat i projektet — renderToStaticMarkup
 * (react-dom/server) räcker för att verifiera faktiskt renderad HTML/attribut.
 */
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { EfterklangSecondary } from '../EfterklangSecondary'
import { FixtureStatus } from '../../../../../domain/enums'
import type { SaveGame } from '../../../../../domain/entities/SaveGame'

const MANAGED = 'club_managed'

function leagueFixtures(n: number, season = 3) {
  return Array.from({ length: n }, (_, i) => ({
    id: `lg-${i}`,
    season,
    roundNumber: i + 1,
    matchday: i + 1,
    status: FixtureStatus.Completed,
    isCup: false,
    homeClubId: MANAGED,
    awayClubId: 'club_x',
    events: [],
  }))
}

function makeGame(): SaveGame {
  return {
    id: 'test',
    currentSeason: 3,
    currentMatchday: 10,
    currentDate: '2026-01-01',
    managedClubId: MANAGED,
    clubs: [{ id: 'club_x', name: 'Söderfors IF', shortName: 'Söderfors' }],
    players: [],
    fixtures: leagueFixtures(6),
    inbox: [],
    journalist: {
      name: 'Britta Sandström',
      outlet: 'Lokaltidningen',
      relationship: 60,
      pressRefusals: 0,
      memory: [
        { season: 3, matchday: 2, event: 'good_answer', sentiment: 4, opponentShort: 'Karlsborg' },
      ],
    },
    // hasJournalistSparkline kräver >= MIN_POINTS (5) snapshots
    scoreSnapshots: { standingsPosition: [], journalistRelation: [48, 50, 52, 55, 58], playerForm: [] },
  } as unknown as SaveGame
}

describe('EfterklangSecondary — journalist-sparkline visar inte "Relation" två gånger', () => {
  it('exakt ETT förekomst av "Relation" i den renderade HTML:en', () => {
    const game = makeGame()
    const html = renderToStaticMarkup(<EfterklangSecondary game={game} />)
    const occurrences = (html.match(/Relation/g) ?? []).length
    expect(occurrences).toBe(1)
  })

  it('Sparkline-SVG:n bär ingen egen aria-label (den synliga etiketten räcker)', () => {
    const game = makeGame()
    const html = renderToStaticMarkup(<EfterklangSecondary game={game} />)
    expect(html).not.toMatch(/aria-label="Relation"/)
  })
})
