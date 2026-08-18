/**
 * 5.1 Sommaren (SLUTTEST_KO.md, 2026-08-18). Ren-funktions-täckning för hela
 * härledningskedjan — text är kopierad bokstavligt ur CODE_INSTRUKTION_
 * SOMMAREN_2026-08-17.md och Jacobs DOM samma dag.
 */
import { describe, it, expect } from 'vitest'
import {
  seasonOrdinalSwedish,
  deriveEpokVariant,
  deriveEpokLine,
  deriveWorsePlacementOrEarlierExit,
  deriveWonTitleLastSeason,
  deriveSommarLine,
  selectAwayEventLines,
  deriveIsPlayoffUnlikely,
  deriveTandLine,
  deriveSeasonRoundCount,
  deriveEyebrowLabel,
  deriveCtaButtonText,
  applyBurnoutRecoveryAtTransition,
} from '../seasonTransitionService'
import type { SeasonTransitionEvent } from '../../entities/SaveGame'
import type { SeasonSummary } from '../../entities/SeasonSummary'

function summary(finalPosition: number, playoffResult: SeasonSummary['playoffResult']): SeasonSummary {
  return { finalPosition, playoffResult } as SeasonSummary
}

describe('seasonOrdinalSwedish', () => {
  it('andra..tionde skrivs i bokstäver', () => {
    expect(seasonOrdinalSwedish(2)).toBe('andra')
    expect(seasonOrdinalSwedish(5)).toBe('femte')
    expect(seasonOrdinalSwedish(6)).toBe('sjätte')
    expect(seasonOrdinalSwedish(8)).toBe('åttonde')
    expect(seasonOrdinalSwedish(10)).toBe('tionde')
  })
  it('11 och uppåt blir siffra + :e', () => {
    expect(seasonOrdinalSwedish(11)).toBe('11:e')
    expect(seasonOrdinalSwedish(23)).toBe('23:e')
  })
})

describe('deriveEpokVariant — prioritetsordning', () => {
  it('titelförsvarare vinner även vid säsong 2 (vann säsong 1)', () => {
    expect(deriveEpokVariant({ seasonCount: 2, wonTitleLastSeason: true, worsePlacementOrEarlierExit: false })).toBe('titelforsvarare')
  })
  it('efter tapp vinner över etablerad', () => {
    expect(deriveEpokVariant({ seasonCount: 5, wonTitleLastSeason: false, worsePlacementOrEarlierExit: true })).toBe('efterTapp')
  })
  it('säsong 2 väljs när varken titelförsvarare eller efter-tapp gäller', () => {
    expect(deriveEpokVariant({ seasonCount: 2, wonTitleLastSeason: false, worsePlacementOrEarlierExit: false })).toBe('sasong2')
  })
  it('etablerad är defaulten för säsong ≥3 utan de andra villkoren', () => {
    expect(deriveEpokVariant({ seasonCount: 5, wonTitleLastSeason: false, worsePlacementOrEarlierExit: false })).toBe('etablerad')
  })
  it('titelförsvarare vinner över efter-tapp om båda (strukturellt orimligt, men prioritetsordning gäller ändå)', () => {
    expect(deriveEpokVariant({ seasonCount: 5, wonTitleLastSeason: true, worsePlacementOrEarlierExit: true })).toBe('titelforsvarare')
  })
})

describe('deriveEpokLine — text kopierad bokstavligt', () => {
  it('säsong 2', () => {
    expect(deriveEpokLine({ seasonCount: 2, clubName: 'Forsbacka', wonTitleLastSeason: false, worsePlacementOrEarlierExit: false }))
      .toBe('Din andra säsong. Nu vet de vad du heter.')
  })
  it('etablerad utan titel — klubbnamnet interpolerat', () => {
    expect(deriveEpokLine({ seasonCount: 5, clubName: 'Forsbacka', wonTitleLastSeason: false, worsePlacementOrEarlierExit: false }))
      .toBe('Din femte säsong. Forsbacka är inte nykomlingar längre.')
  })
  it('titelförsvarare', () => {
    expect(deriveEpokLine({ seasonCount: 6, clubName: 'Forsbacka', wonTitleLastSeason: true, worsePlacementOrEarlierExit: false }))
      .toBe('Din sjätte säsong. Ni är laget alla vill slå.')
  })
  it('efter tapp', () => {
    expect(deriveEpokLine({ seasonCount: 8, clubName: 'Forsbacka', wonTitleLastSeason: false, worsePlacementOrEarlierExit: true }))
      .toBe('Din åttonde säsong. Förra våren sitter kvar i väggarna.')
  })
  it('säsong 11 — siffervarianten', () => {
    expect(deriveEpokLine({ seasonCount: 11, clubName: 'Forsbacka', wonTitleLastSeason: false, worsePlacementOrEarlierExit: false }))
      .toBe('Din 11:e säsong. Forsbacka är inte nykomlingar längre.')
  })
})

describe('deriveWonTitleLastSeason', () => {
  it('SM-mästare räknas', () => {
    expect(deriveWonTitleLastSeason(summary(3, 'champion'))).toBe(true)
  })
  it('serievinnare (1:a plats) räknas även utan slutspelstitel', () => {
    expect(deriveWonTitleLastSeason(summary(1, 'quarterfinal'))).toBe(true)
  })
  it('varken serieetta eller SM-mästare — false', () => {
    expect(deriveWonTitleLastSeason(summary(2, 'finalist'))).toBe(false)
  })
  it('ingen föregående säsong — false', () => {
    expect(deriveWonTitleLastSeason(undefined)).toBe(false)
  })
})

describe('deriveWorsePlacementOrEarlierExit', () => {
  it('färre än två summaries — false (strukturellt omöjligt vid säsong 2)', () => {
    expect(deriveWorsePlacementOrEarlierExit([summary(3, 'quarterfinal')])).toBe(false)
    expect(deriveWorsePlacementOrEarlierExit([])).toBe(false)
  })
  it('sämre placering', () => {
    expect(deriveWorsePlacementOrEarlierExit([summary(3, 'quarterfinal'), summary(6, 'quarterfinal')])).toBe(true)
  })
  it('utslagen tidigare (samma placering, sämre slutspelsutfall)', () => {
    expect(deriveWorsePlacementOrEarlierExit([summary(3, 'semifinal'), summary(3, 'quarterfinal')])).toBe(true)
  })
  it('lika bra eller bättre på båda axlarna — false', () => {
    expect(deriveWorsePlacementOrEarlierExit([summary(5, 'quarterfinal'), summary(3, 'semifinal')])).toBe(false)
  })
  it('exakt samma utfall — false', () => {
    expect(deriveWorsePlacementOrEarlierExit([summary(3, 'quarterfinal'), summary(3, 'quarterfinal')])).toBe(false)
  })
})

describe('deriveSommarLine', () => {
  it('mappar de tre zonerna rakt av (Jacobs DOM: ingen ny text)', () => {
    expect(deriveSommarLine('frisk')).toBe('Du var på Gotland i tre veckor. Ingen ringde.')
    expect(deriveSommarLine('markbar')).toBe('Halva sommaren gick åt till att inte tänka på bandy. Det gick sådär.')
    expect(deriveSommarLine('hog')).toBe('Du sov mycket. Det hjälpte lite.')
  })
})

describe('selectAwayEventLines', () => {
  it('tomt fall — en rad, inte tre tomma punkter', () => {
    expect(selectAwayEventLines([])).toEqual(['Ingenting hände. Isen låg och väntade.'])
  })
  it('kontraktsutgång väljs FÖRE de tre andra (Jacobs DOM)', () => {
    const events: SeasonTransitionEvent[] = [
      { type: 'retired', playerId: 'p1', playerLastName: 'Berglund' },
      { type: 'aged', playerId: 'p2', playerLastName: 'Åberg', age: 34 },
      { type: 'promoted', playerId: 'p3', playerLastName: 'Nilsson' },
      { type: 'contractExpired', playerId: 'p4', playerLastName: 'Holm' },
    ]
    const lines = selectAwayEventLines(events)
    expect(lines[0]).toBe('Holms kontrakt gick ut. Ingen ringde honom i tid.')
    expect(lines).toHaveLength(3)
  })
  it('max tre rader även med fyra händelser — fjärde (lägst prioritet) faller bort', () => {
    const events: SeasonTransitionEvent[] = [
      { type: 'contractExpired', playerId: 'p1', playerLastName: 'Holm' },
      { type: 'retired', playerId: 'p2', playerLastName: 'Berglund' },
      { type: 'aged', playerId: 'p3', playerLastName: 'Åberg', age: 34 },
      { type: 'promoted', playerId: 'p4', playerLastName: 'Nilsson' },
    ]
    const lines = selectAwayEventLines(events)
    expect(lines).toEqual([
      'Holms kontrakt gick ut. Ingen ringde honom i tid.',
      'Berglund la av.',
      'Åberg fyllde 34.',
    ])
  })
  it('radformerna, en och en', () => {
    expect(selectAwayEventLines([{ type: 'retired', playerId: 'p1', playerLastName: 'Berglund' }])).toEqual(['Berglund la av.'])
    expect(selectAwayEventLines([{ type: 'aged', playerId: 'p1', playerLastName: 'Åberg', age: 34 }])).toEqual(['Åberg fyllde 34.'])
    expect(selectAwayEventLines([{ type: 'promoted', playerId: 'p1', playerLastName: 'Nilsson' }])).toEqual(['Nilsson kom upp från P19.'])
  })
})

describe('deriveIsPlayoffUnlikely', () => {
  it('styrelsen vill undvika nedflyttning', () => {
    expect(deriveIsPlayoffUnlikely(true, false)).toBe(true)
  })
  it('förra säsongen missade slutspel', () => {
    expect(deriveIsPlayoffUnlikely(false, true)).toBe(true)
  })
  it('varken eller — false', () => {
    expect(deriveIsPlayoffUnlikely(false, false)).toBe(false)
  })
})

describe('deriveTandLine', () => {
  it('normalfall', () => {
    expect(deriveTandLine('Skutskär', false)).toBe('Det börjar med Skutskär. Det slutar i mars.')
  })
  it('slutspel inte rimligt', () => {
    expect(deriveTandLine('Skutskär', true)).toBe('Det börjar med Skutskär. Sen får vi se hur långt det räcker.')
  })
})

describe('deriveSeasonRoundCount', () => {
  it('12 lag → 22 omgångar (härlett, matchar scheduleGenerator.ts:s kommentar)', () => {
    expect(deriveSeasonRoundCount(12)).toBe(22)
  })
  it('formeln är (N-1)*2, inte hårdkodad 22', () => {
    expect(deriveSeasonRoundCount(10)).toBe(18)
    expect(deriveSeasonRoundCount(14)).toBe(26)
  })
})

describe('deriveEyebrowLabel / deriveCtaButtonText', () => {
  it('cup kvartsfinal', () => {
    const args = { tavlingstyp: 'cup' as const, skede: 'kvartsfinal' as const, roundNumber: 1, opponentName: 'Skutskär' }
    expect(deriveEyebrowLabel(args)).toBe('🏆 Cup · kvartsfinal')
    expect(deriveCtaButtonText(args)).toBe('CUPEN BÖRJAR. KVARTSFINAL MOT SKUTSKÄR →')
  })
  it('slutspel semifinal', () => {
    const args = { tavlingstyp: 'slutspel' as const, skede: 'semifinal' as const, roundNumber: 32, opponentName: 'Rögle' }
    expect(deriveEyebrowLabel(args)).toBe('⚔️ Slutspel · semifinal')
    expect(deriveCtaButtonText(args)).toBe('SLUTSPELET BÖRJAR. SEMIFINAL MOT RÖGLE →')
  })
  it('ligastart — Omgång N, inget skede', () => {
    const args = { tavlingstyp: 'liga' as const, skede: undefined, roundNumber: 1, opponentName: 'Karlsborg' }
    expect(deriveEyebrowLabel(args)).toBe('🏒 Omgång 1')
    expect(deriveCtaButtonText(args)).toBe('SÄSONGEN BÖRJAR. OMGÅNG 1 MOT KARLSBORG →')
  })
})

describe('applyBurnoutRecoveryAtTransition — exakta exempel ur ordern', () => {
  it('80 → 55', () => { expect(applyBurnoutRecoveryAtTransition(80)).toBe(55) })
  it('62 → 46', () => { expect(applyBurnoutRecoveryAtTransition(62)).toBe(46) })
  it('40 → 35', () => { expect(applyBurnoutRecoveryAtTransition(40)).toBe(35) })
  it('20 → 20 (redan under golvet, ingen ändring)', () => { expect(applyBurnoutRecoveryAtTransition(20)).toBe(20) })
  it('exakt på golvet (30) → oförändrat', () => { expect(applyBurnoutRecoveryAtTransition(30)).toBe(30) })
  it('resultatet går aldrig under 30 för något score ≥ 30 (golv-garantin är inbyggd i formeln)', () => {
    for (let score = 30; score <= 100; score += 1) {
      expect(applyBurnoutRecoveryAtTransition(score)).toBeGreaterThanOrEqual(30)
    }
  })
})
