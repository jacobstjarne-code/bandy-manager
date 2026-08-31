/**
 * HIGH 5, steg 2 (audit 2026-08-29) — slutspelets `roundNumber` var tre
 * hårdkodade gissningar som INTE var överens om samma övergång:
 *
 *   playoffTransition.ts:36   QF-start           → 23
 *   matchActions.ts:211,348   QF→SF / SF→final   → 26 / 29 / 32
 *   playoffProcessor.ts:113   QF→SF / SF→final   → 28 / 33 / 36
 *
 * `matchday` härleddes redan korrekt (max+1) på alla tre ställen. Fixen är
 * att härleda `roundNumber` på SAMMA sätt, via nextPlayoffStart() — då kan de
 * inte längre säga olika, för de hårdkodar ingenting.
 *
 * Testet har två halvor: en funktionell (räkningen blir rätt och monoton
 * genom hela slutspelet) och en strukturell (de tre anropsställena kallar
 * faktiskt den delade härledningen och har inga literaler kvar). Den
 * strukturella behövs eftersom matchActions.ts:s båda anropsställen ligger
 * inne i zustand-actions som inte går att köra utan en hel store.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { handlePlayoffStart } from '../playoffTransition'
import { createNewGame } from '../createNewGame'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'
import { advancePlayoffRound, nextPlayoffStart, updateSeriesAfterMatch } from '../../../domain/services/playoffService'
import { FixtureStatus, PlayoffStatus } from '../../../domain/enums'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { Fixture } from '../../../domain/entities/Fixture'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../..')

function playedSeason(): SaveGame {
  const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 7 })
  // Spela klart hela grundserien (och cupen) så handlePlayoffStart har en tabell.
  const fixtures = game.fixtures.map((f, i) => ({
    ...f,
    status: FixtureStatus.Completed,
    homeScore: (i % 5) + 1,
    awayScore: i % 3,
  }))
  return { ...game, fixtures }
}

/** Låt en serie avgöras genom att markera tillräckligt många fixtures spelade. */
function decideAllSeries(fixtures: Fixture[], bracket: NonNullable<SaveGame['playoffBracket']>) {
  const seriesList = bracket.status === PlayoffStatus.QuarterFinals ? bracket.quarterFinals
    : bracket.status === PlayoffStatus.SemiFinals ? bracket.semiFinals
    : bracket.final ? [bracket.final] : []
  let updated = { ...bracket }
  for (const series of seriesList) {
    for (const fid of series.fixtures) {
      const f = fixtures.find(x => x.id === fid)
      if (!f) continue
      const completed = { ...f, status: FixtureStatus.Completed, homeScore: 3, awayScore: 1 }
      const idx = fixtures.findIndex(x => x.id === fid)
      fixtures[idx] = completed
      updated = {
        ...updated,
        quarterFinals: updated.quarterFinals.map(s => s.fixtures.includes(fid) ? updateSeriesAfterMatch(s, completed) : s),
        semiFinals: updated.semiFinals.map(s => s.fixtures.includes(fid) ? updateSeriesAfterMatch(s, completed) : s),
        final: updated.final && updated.final.fixtures.includes(fid)
          ? updateSeriesAfterMatch(updated.final, completed) : updated.final,
      }
    }
  }
  return updated
}

describe('slutspelets roundNumber — funktionellt', () => {
  it('kvartsfinalens roundNumber börjar direkt efter ligans sista omgång, inte på ett hårdkodat 23', () => {
    const game = playedSeason()
    const maxBefore = Math.max(...game.fixtures.map(f => f.roundNumber))
    const result = handlePlayoffStart(game)
    const qfFixtures = result.game.fixtures.filter(f => f.isKnockout && !f.isCup)

    expect(qfFixtures.length).toBeGreaterThan(0)
    expect(Math.min(...qfFixtures.map(f => f.roundNumber))).toBe(maxBefore + 1)
    // Grindarna i matchSimProcessor.ts/economyService.ts förutsätter > 22.
    for (const f of qfFixtures) expect(f.roundNumber).toBeGreaterThan(22)
  })

  it('QF → SF → final: monotont stigande, aldrig överlappande med föregående fas', () => {
    const game = playedSeason()
    const afterStart = handlePlayoffStart(game).game
    const fixtures = [...afterStart.fixtures]
    let bracket = afterStart.playoffBracket!

    const qfMax = Math.max(...fixtures.filter(f => f.isKnockout && !f.isCup).map(f => f.roundNumber))

    // QF avgörs → SF genereras med den delade härledningen.
    bracket = decideAllSeries(fixtures, bracket)
    const sfStart = nextPlayoffStart(fixtures)
    const sfResult = advancePlayoffRound(bracket, game.currentSeason, sfStart.startRound, sfStart.startMatchday)
    expect(sfResult.newFixtures.length).toBeGreaterThan(0)
    expect(Math.min(...sfResult.newFixtures.map(f => f.roundNumber))).toBe(qfMax + 1)
    fixtures.push(...sfResult.newFixtures)
    bracket = sfResult.bracket

    const sfMax = Math.max(...sfResult.newFixtures.map(f => f.roundNumber))

    // SF avgörs → finalen.
    bracket = decideAllSeries(fixtures, bracket)
    const finalStart = nextPlayoffStart(fixtures)
    const finalResult = advancePlayoffRound(bracket, game.currentSeason, finalStart.startRound, finalStart.startMatchday)
    expect(finalResult.newFixtures.length).toBe(1)
    expect(finalResult.newFixtures[0].roundNumber).toBe(sfMax + 1)

    // roundNumber och matchday rör sig i lås — det var hela poängen.
    const all = [...fixtures, ...finalResult.newFixtures].filter(f => f.isKnockout && !f.isCup)
    const rounds = all.map(f => f.roundNumber).sort((a, b) => a - b)
    const days = all.map(f => f.matchday).sort((a, b) => a - b)
    expect(rounds.length).toBe(days.length)
    const offset = days[0] - rounds[0]
    for (let i = 0; i < rounds.length; i++) {
      expect(days[i] - rounds[i]).toBe(offset)
    }
  })
})

describe('slutspelets roundNumber — de tre anropsställena kan inte gå isär igen', () => {
  const CALL_SITES = [
    'src/application/useCases/playoffTransition.ts',
    'src/presentation/store/actions/matchActions.ts',
    'src/application/useCases/processors/playoffProcessor.ts',
  ]

  for (const rel of CALL_SITES) {
    it(`${rel} härleder startRound via nextPlayoffStart`, () => {
      const src = readFileSync(join(REPO_ROOT, rel), 'utf8')
      expect(src).toContain('nextPlayoffStart(')
    })
  }

  it('inga hårdkodade startRound-literaler kvar (23/26/28/29/32/33/36)', () => {
    // Kommentarer strippas — de tre gamla värdena NÄMNS i rotorsaks-
    // kommentarerna, vilket är poängen med dem.
    for (const rel of CALL_SITES) {
      const src = readFileSync(join(REPO_ROOT, rel), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
      expect(src, `${rel} har kvar en hårdkodad nextRoundStart`).not.toMatch(/nextRoundStart/)
      expect(src, `${rel} skickar ett literalt startRound till generatePlayoffFixtures/advancePlayoffRound`)
        .not.toMatch(/(generatePlayoffFixtures|advancePlayoffRound)\([^)]*,\s*(23|26|28|29|32|33|36)\s*[,)]/)
    }
  })
})
