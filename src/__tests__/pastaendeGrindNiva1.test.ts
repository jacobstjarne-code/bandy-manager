import { describe, it, expect } from 'vitest'
import { readFileSync, mkdtempSync, writeFileSync, unlinkSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { scanCitesDeclarations, findCitesTags, checkCitesTag, KNOWN_PROXY_TOKENS, type CitesTag } from '../../tests/grind/citesDeclaration'

/**
 * PÅSTÅENDEGRINDEN nivå 1 — @cites-deklarationen (docs/PASTAENDEGRINDEN_2026-08-24.md).
 *
 * Samma disciplin som nivå 2 (pastaendeGrindNiva2.test.ts): baseline-noll +
 * ett meta-test som bevisar att kontrollen fångar sin egen anledning att
 * finnas, inte bara att den är grön för att inget rört den.
 *
 * ANNOTERADE FUNKTIONER (2026-08-24, denna commit): sju verkliga,
 * modulnivå-funktioner taggade — de som redan är fixade denna session och
 * vars "sanning" läses direkt i funktionens EGEN kropp (den skopning
 * citesDeclaration.ts:s filhuvud argumenterar för): didManagedWinFinal,
 * mergeResolvedChoices, resolveBoardMeetingState, createSuspensionItem,
 * generatePostAdvanceEvents, evaluateObjective. EN kandidat (BUILDERS-
 * objektet i seasonDecisionCaptureService.ts) undveks MEDVETET — den
 * faktiska player.clubId===gameAfter.managedClubId-koll sitter i anonyma
 * metoder INNE I ett objektlitteral, ett steg under modulnivån den billiga
 * skannern når. Rapporterat som en känd gräns, inte dolt.
 */

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '../..')

// PÅSTÅENDEKARTAN omsvep, sista mekaniska passet (2026-08-25): utökad från
// de sex ursprungliga filerna till samtliga filer som fick @cites-taggar
// under omsvepets tagg-pass (85 kandidat-funktioner granskade, ~65 taggade
// Sanning-rader över dessa filer). Listan hålls i synk manuellt — om en ny
// fil får sin första @cites-tagg, lägg till den här.
const TAGGED_FILES = [
  'src/application/services/boardMeetingStateResolver.ts',
  'src/domain/data/nextOpponentHookText.ts',
  'src/domain/data/scenes/journalistRelationshipScene.ts',
  'src/domain/services/arcService.ts',
  'src/domain/services/bandyGalaService.ts',
  'src/domain/services/boardObjectiveService.ts',
  'src/domain/services/boardService.ts',
  'src/domain/services/contextualSponsorService.ts',
  'src/domain/services/economicCrisisService.ts',
  'src/domain/services/events/eventFactories.ts',
  'src/domain/services/events/eventResolver.ts',
  'src/domain/services/events/hallProcessService.ts',
  'src/domain/services/events/patronEvents.ts',
  'src/domain/services/events/postAdvanceEvents.ts',
  'src/domain/services/freeKickInteractionService.ts',
  'src/domain/services/inboxService.ts',
  'src/domain/services/insandareService.ts',
  'src/domain/services/matchHighlightService.ts',
  'src/domain/services/narrativeService.ts',
  'src/domain/services/opponentManagerService.ts',
  'src/domain/services/portal/pickEfterklang.ts',
  'src/domain/services/postVictoryNarrativeService.ts',
  'src/domain/services/pressConferenceService.ts',
  'src/domain/services/retirementService.ts',
  'src/domain/services/schoolAssignmentService.ts',
  'src/domain/services/seasonGoalService.ts',
  'src/domain/services/seasonSummaryService.ts',
  'src/domain/services/silentMatchReportService.ts',
  'src/domain/services/situationFragments.ts',
  'src/domain/services/supporterRituals.ts',
  'src/domain/services/trainerArcService.ts',
  'src/domain/services/transferService.ts',
  'src/presentation/components/club/AkademiTab.tsx',
  'src/presentation/components/club/EkonomiTab.tsx',
  'src/presentation/components/match/HalftimeModal.tsx',
  'src/presentation/screens/ChampionScreen.tsx',
  'src/presentation/screens/HistoryScreen.tsx',
  'src/presentation/screens/PlayoffIntroScreen.tsx',
  'src/presentation/screens/QFSummaryScreen.tsx',
  'src/presentation/screens/SeasonSummaryScreen.tsx',
  'src/presentation/screens/TabellScreen.tsx',
  'src/presentation/screens/granska/GranskaAnalys.tsx',
  'src/presentation/screens/granska/GranskaOversikt.tsx',
  'src/presentation/screens/granska/GranskaShotmap.tsx',
  'src/presentation/screens/granska/helpers.ts',
  'src/presentation/screens/match/MatchLiveScreen.tsx',
  'src/presentation/store/actions/matchActions.ts',
  'src/presentation/store/actions/transferActions.ts',
  'src/presentation/utils/finalJourneys.ts',
  'src/presentation/utils/finalResult.ts',
  'src/presentation/utils/tacticData.ts',
].map(p => join(REPO_ROOT, p))

describe('PÅSTÅENDEGRINDEN nivå 1 — @cites-deklarationen', () => {
  it('baseline: noll brott bland de taggade funktionerna idag', () => {
    const violations = scanCitesDeclarations(TAGGED_FILES)
    expect(violations, JSON.stringify(violations, null, 2)).toHaveLength(0)
  })

  it('rapporterar hur många @cites-taggade funktioner som faktiskt finns', () => {
    const tags = TAGGED_FILES.flatMap(f => findCitesTags(f))
    expect(tags.length).toBeGreaterThanOrEqual(6)
    // Informativt facit i testrapporten — inte en hemlighet, syns i CI-loggen.
    console.log(`@cites-taggade funktioner: ${tags.map(t => t.functionName).join(', ')}`)
  })

  it('meta: varje känd proxy-token i KNOWN_PROXY_TOKENS fångas OM den läses odeklarerat', () => {
    for (const proxy of KNOWN_PROXY_TOKENS) {
      const fakeBody = `function claimSomething(game) {\n  const x = game.${proxy.label.split('/')[0]}\n  return x\n}`
      const tag: CitesTag = {
        file: 'fake.ts',
        functionName: 'claimSomething',
        declaredFields: ['someUnrelatedField'],
        bodyText: fakeBody,
      }
      const violations = checkCitesTag(tag)
      const hit = violations.some(v => v.kind === 'odeklarerad-känd-proxy-läst' && v.detail.includes(proxy.label))
      expect(hit, `proxy "${proxy.label}" missades av grinden i återskapad kropp:\n${fakeBody}`).toBe(true)
    }
  })

  it('friskt: samma proxy-läsning flaggas INTE om den öppet deklareras', () => {
    for (const proxy of KNOWN_PROXY_TOKENS) {
      const fieldToken = proxy.declareAs[0]
      const fakeBody = `function claimSomething(game) {\n  const x = game.${proxy.label.split('/')[0]}\n  return x\n}`
      const tag: CitesTag = {
        file: 'fake.ts',
        functionName: 'claimSomething',
        declaredFields: [fieldToken],
        bodyText: fakeBody,
      }
      const violations = checkCitesTag(tag)
      expect(violations, `proxy "${proxy.label}" flaggades trots öppen deklaration`).toHaveLength(0)
    }
  })

  it('meta: en fabricerad/föråldrad deklaration (fältet nämns aldrig i kroppen) fångas', () => {
    const tag: CitesTag = {
      file: 'fake.ts',
      functionName: 'claimSomething',
      declaredFields: ['SaveGame.someFieldThatIsNeverActuallyRead'],
      bodyText: `function claimSomething(game) {\n  return game.completelyUnrelatedField\n}`,
    }
    const violations = checkCitesTag(tag)
    expect(violations.some(v => v.kind === 'odeklarerat-fält-saknas-i-koden')).toBe(true)
  })

  it('meta: "@cites" i löpande prosa (inte först på sin rad) fångas INTE som en deklaration', () => {
    // Regression för fyndet 2026-08-25: en förklarande kommentar som
    // bokstavligen skriver ordet "@cites" mitt i en mening ("...taggen ska
    // stå kvar, @cites är inte tänkt att flyttas hit") ska INTE tolkas som
    // en riktig deklaration — bara "@cites" som FÖRSTA icke-whitespace/*-
    // tecken på sin egen rad räknas.
    const dir = mkdtempSync(join(tmpdir(), 'nivå1-parser-meta-'))
    const file = join(dir, 'proseCollision.ts')
    writeFileSync(file, `
      /**
       * Not a real declaration: mentions @cites mid-sentence on purpose,
       * to prove the parser doesn't grab it. Faktisk sanning finns
       * någon annanstans, inte här.
       */
      export function claimSomething(game) {
        return game.someField
      }
    `)
    try {
      const tags = findCitesTags(file)
      expect(tags, JSON.stringify(tags)).toHaveLength(0)
    } finally {
      unlinkSync(file)
    }
  })

  it('meta: "@cites" korrekt placerad (först på raden i en block-kommentar) FÅNGAS', () => {
    const dir = mkdtempSync(join(tmpdir(), 'nivå1-parser-meta-'))
    const file = join(dir, 'properTag.ts')
    writeFileSync(file, `
      /**
       * @cites game.someField
       */
      export function claimSomething(game) {
        return game.someField
      }
    `)
    try {
      const tags = findCitesTags(file)
      expect(tags).toHaveLength(1)
      expect(tags[0].declaredFields).toEqual(['game.someField'])
    } finally {
      unlinkSync(file)
    }
  })

  it('meta: kompakt engradsformat ("/** @cites X */") FÅNGAS — självupptäckt fälleklass 2026-08-25', () => {
    // Motsatsen till prosa-kollisionen: en riktig, avsiktlig tagg skriven på
    // EN rad ("/** @cites Fixture.events */", en helt naturlig JSDoc-stil)
    // ignorerades tyst av den ursprungliga regexen, som bara kände igen ett
    // ensamt `*`-prefix. Författaren TROR funktionen är skyddad — den är
    // det inte. Hittad genom att själv råka skriva formatet i seasonSummaryService.ts.
    const dir = mkdtempSync(join(tmpdir(), 'nivå1-parser-meta-'))
    const file = join(dir, 'compactTag.ts')
    writeFileSync(file, `
      /** @cites game.someField */
      export function claimSomething(game) {
        return game.someField
      }
    `)
    try {
      const tags = findCitesTags(file)
      expect(tags, JSON.stringify(tags)).toHaveLength(1)
      expect(tags[0].declaredFields).toEqual(['game.someField'])
    } finally {
      unlinkSync(file)
    }
  })

  it('meta: "@cites" i en //-radkommentar (inte block-kommentar) fångas INTE', () => {
    const dir = mkdtempSync(join(tmpdir(), 'nivå1-parser-meta-'))
    const file = join(dir, 'lineComment.ts')
    writeFileSync(file, `
      // @cites game.someField
      export function claimSomething(game) {
        return game.someField
      }
    `)
    try {
      const tags = findCitesTags(file)
      expect(tags, JSON.stringify(tags)).toHaveLength(0)
    } finally {
      unlinkSync(file)
    }
  })

  it('regressionsdokument: forbudslistan.ts och citesDeclaration.ts ska dela samma fältvokabulär', () => {
    // Inte en strikt identitetskoll (nivå 1:s lista är medvetet snävare,
    // choiceId uteslutet — se citesDeclaration.ts:s filhuvud) — bara en
    // påminnelse, läst av en människa i diffen, om att båda ska uppdateras
    // tillsammans när en ny proxy hittas. Ren dokumentation, ingen assertion
    // som kan bli röd av sig själv.
    const src = readFileSync(join(REPO_ROOT, 'tests/grind/citesDeclaration.ts'), 'utf-8')
    expect(src).toContain('forbudslistan.ts')
  })
})
