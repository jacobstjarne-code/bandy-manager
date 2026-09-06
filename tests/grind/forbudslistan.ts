import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

/**
 * PÅSTÅENDEGRINDEN nivå 2 — förbudslistan (docs/PASTAENDEGRINDEN_2026-08-24.md).
 *
 * "Vissa fält är ALDRIG giltiga citat för vissa påståenden." Den fullt
 * precisa versionen (nivå 1: @cites-deklaration + AST-kontroll av vad en
 * funktion FAKTISKT läser) kommer senare — den här filen är den billiga
 * versionen: grep-driven, skopad till de FILER där varje påstående faktiskt
 * genereras, inte ett blint codebase-brett förbud mot ett fältnamn (ett
 * sådant hade gett falska positiva överallt roundNumber/fanMood/etc.
 * legitimt används för något annat än just detta påstående).
 *
 * Värdet nivå 2 ger, per PÅSTÅENDEGRINDEN.md: "fem av dagens fynd var
 * syskongrenar till fixar vi gjort samma dygn" — en regel skopad till FILEN
 * (inte bara raden) fångar just den klassen: någon lägger till en ny
 * funktion i samma fil som återupprepar det gamla, redan underkända
 * mönstret.
 *
 * Baseline är 0 för samtliga regler nedan — till skillnad från
 * routeSceneCoverage.ts (som ratchet:ar mot KÄND, oadresserad skuld) är
 * varje rad här en yta som redan är fixad. Ett brott är alltså per
 * definition en REGRESSION, inte ouppmärksammad gammal skuld — testet ska
 * failas hårt, inte ratcheta.
 */

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '../..')

function readSrc(relPath: string): string {
  return readFileSync(join(REPO_ROOT, relPath), 'utf-8')
}

/**
 * Naiv kommentar-strippning — tar bort // till radslut och /* … *\/-block.
 * Räcker för att undvika falska positiva från rotorsak-kommentarer som
 * (med rätta) nämner det förbjudna fältnamnet i prosa ("läste tidigare
 * fulfillmentPct...") utan att det är en kodrad. Inte en riktig parser —
 * exakt den avvägningen nivå 2 är byggd för (nivå 1 gör det på riktigt).
 */
export function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
}

interface ForbiddenCheck {
  pattern: RegExp
  maxAllowed: number
  note: string
}

interface RequiredCheck {
  pattern: RegExp
  minCount: number
  note: string
}

interface FileCheck {
  path: string
  forbidden?: ForbiddenCheck[]
  required?: RequiredCheck[]
}

export interface Rule {
  id: string
  claim: string
  forbiddenField: string
  correctField: string
  files: FileCheck[]
}

export interface Violation {
  ruleId: string
  claim: string
  file: string
  kind: 'forbidden' | 'required'
  detail: string
}

/**
 * Tabellen ur PÅSTÅENDEGRINDEN.md nivå 2, rad för rad. "Listan växer när
 * nya proxyer hittas" — lägg till en ny Rule när en ny proxy fixas, ta inte
 * bort en gammal (om ytan som bar den försvinner helt, ta bort den raden i
 * samma commit som tar bort ytan).
 */
export const FORBUDSLISTA: Rule[] = [
  {
    id: 'vilket-val-spelaren-gjorde',
    claim: 'vilket val spelaren gjorde',
    forbiddenField: 'taktikfält (htTempo/htPress/htMentality)',
    correctField: 'resolvedChoices',
    files: [
      {
        path: 'src/presentation/screens/granska/GranskaOversikt.tsx',
        forbidden: [{
          pattern: /\bhtTempo\b|\bhtPress\b|\bhtMentality\b/,
          maxAllowed: 0,
          note: 'H2 (2026-08-24): paussnackets härledning läste tidigare fel taktikreglage.',
        }],
      },
      {
        path: 'src/presentation/screens/granska/helpers.ts',
        required: [{
          pattern: /resolvedChoices/,
          minCount: 1,
          note: 'mergeResolvedChoices ska fortsatt läsa game.resolvedChoices.',
        }],
      },
      {
        path: 'src/presentation/screens/granska/GranskaScreen.tsx',
        required: [{
          pattern: /resolvedChoices/,
          minCount: 1,
          note: 'GranskaScreen ska fortsatt slå ihop mot den persisterade sanningen.',
        }],
      },
    ],
  },
  {
    id: 'spelare-lamnat',
    claim: 'att en spelare lämnat klubben',
    forbiddenField: 'choiceId ensamt (ingen gameAfter-koll)',
    correctField: 'truppen efter mutationen (player.clubId === gameAfter.managedClubId)',
    files: [
      {
        path: 'src/domain/services/seasonDecisionCaptureService.ts',
        required: [{
          pattern: /player\.clubId === gameAfter\.managedClubId/,
          minCount: 4,
          note: 'H3 (2026-08-24): sell_star, detOmojligaValet/sell, keep, transferBidReceived/accept ska var för sig verifiera klubbmedlemskap innan de skriver en mening.',
        }],
      },
    ],
  },
  {
    id: 'styrelsens-nojdhet',
    claim: 'styrelsens nöjdhet',
    forbiddenField: 'tabellplacering, fulfillmentPct',
    correctField: 'boardPatience',
    files: [
      {
        path: 'src/application/services/boardMeetingStateResolver.ts',
        forbidden: [{
          // Tillåter fulfillmentPct < 0 (ingen-data-fallbacken till state A)
          // — förbjuder varje ANNAN jämförelse (>=80/<50/>=65 etc, den gamla
          // state-härledningen).
          pattern: /fulfillmentPct\s*(>=|<=|>|<)\s*(?!0\b)\d+/,
          maxAllowed: 0,
          note: 'BoardMeetingScene (2026-08-24): mötets ton läste tidigare fulfillmentPct, en fjärde oberoende nöjdhetsformel.',
        }],
        required: [{
          pattern: /getBoardPatienceZone/,
          minCount: 1,
          note: 'state ska härledas ur getBoardPatienceZone(game).zone.',
        }],
      },
    ],
  },
  {
    id: 'publikens-humor',
    claim: 'publikens humör',
    forbiddenField: 'fanMood',
    correctField: 'supporterGroup.mood',
    files: [
      {
        path: 'src/domain/services/boardObjectiveService.ts',
        forbidden: [{
          pattern: /\.fanMood\b/,
          maxAllowed: 0,
          note: 'growFanbase (2026-08-24): läste tidigare fanMood (matchmotor/attendance-fält) istf klackens faktiska humör.',
        }],
        required: [{
          pattern: /supporterGroup\??\.mood/,
          minCount: 1,
          note: 'evaluateObjective ska läsa supporterGroup.mood. (Kravet sänkt 2026-08-25: '
            + 'styrelseobjektiv-tiern gjorde generering rent tier-härledd — growFanbase '
            + 'erbjuds nu alltid till MidTable oavsett aktuellt klackhumör, så genererings-'
            + 'gaten som tidigare läste mood för att BESLUTA OM den skulle erbjudas är '
            + 'medvetet borttagen. Kvar att skydda: att evaluateObjective fortsatt mäter '
            + 'mot supporterGroup.mood, inte fanMood — förbudsregeln ovan täcker det.)',
        }],
      },
    ],
  },
  {
    id: 'ordning-mellan-matcher',
    claim: 'ordning mellan matcher',
    forbiddenField: 'roundNumber',
    correctField: 'matchday',
    files: [
      {
        path: 'src/domain/services/events/postAdvanceEvents.ts',
        forbidden: [{
          // [\s\S]{0,120}? (inte [^)]*) — en sort-komparator har egna
          // parenteser (a, b) => ... som en "stanna vid första )"-klass
          // hade avbrutit matchningen på, precis den bugg meta-testet
          // ("fångar regeln sin egen historiska bugg?") fångade i denna fil.
          pattern: /\.sort\([\s\S]{0,120}?roundNumber/,
          maxAllowed: 0,
          note: 'CLAUDE.md: "Använd ALDRIG roundNumber ... All ordning via matchday." Fyra sorteringar i denna fil bytta 2026-08-24 (en vid captain-mergen, tre vid PÅSTÅENDEGRINDEN-bygget).',
        }],
      },
    ],
  },
  {
    id: 'lagets-form',
    claim: 'lagets form',
    forbiddenField: 'player.form (attributsnitt) märkt som "Form"',
    correctField: 'resultaten (V/O/F, getFormResults)',
    files: [
      {
        path: 'src/presentation/components/portal/minimal/FormStatusMinimal.tsx',
        required: [{
          pattern: /Spelarform/,
          minCount: 1,
          note: 'Skutskär Medium 3: attributsnittet ska heta "Spelarform", inte den odifferentierade "Form" — annars läses det som resultatkurva.',
        }],
      },
    ],
  },
  {
    id: 'vem-eliminerades',
    claim: 'vem som eliminerades ur slutspelet',
    forbiddenField: 'bracket-närvaro (game.playoffBracket, live)',
    correctField: 'SeasonSummary.eliminatedByClubId (snapshottat)',
    files: [
      {
        path: 'src/presentation/screens/SeasonSummaryScreen.tsx',
        forbidden: [{
          pattern: /game\??\.playoffBracket/,
          maxAllowed: 0,
          note: 'Stickiness-audit 2026-08-17: game.playoffBracket nollställs vid rollover, opålitligt för en gammal summary.',
        }],
      },
    ],
  },
  {
    id: 'vem-blev-mastare',
    claim: 'vem som blev mästare',
    forbiddenField: 'game.playoffBracket.champion (live)',
    correctField: 'SeasonSummary.championClubId (snapshottat)',
    files: [
      {
        path: 'src/presentation/screens/SeasonSummaryScreen.tsx',
        forbidden: [{
          pattern: /game\??\.playoffBracket\??\.champion/,
          maxAllowed: 0,
          note: 'smWinnerSentence (2026-08-24): läste tidigare det live-fältet direkt, kunde tappa vem som blev mästare efter en säsongsväxling.',
        }],
      },
    ],
  },
  {
    id: 'hur-en-spelare-bevakas',
    claim: 'hur en spelare bevakas defensivt',
    forbiddenField: 'fotbollslånord för man-mot-man-bevakning ("man-man", "åka efter", "var två på", "hänga på")',
    correctField: 'zonspråk (BANDY_KANON §2: backen zonmarkerar, "det går inte att åka efter en spelare")',
    files: [
      {
        path: 'src/domain/services/opponentAnalysisService.ts',
        forbidden: [{
          pattern: /\bman[- ]man\b|\båka efter\b|\bvar två på\b|\bhänga på\b/i,
          maxAllowed: 0,
          note: 'sluttest-b10-zonmarkering (TEXT LÅST 2026-09-03, Opus): B10-textriktlinjen — THREAT_REASON_LINES:s evasive[3]/clinical[3] talade tidigare man-mot-man ("Var två", "en mot en"), bandy zonmarkerar.',
        }],
      },
      {
        path: 'src/domain/data/matchCommentary.ts',
        forbidden: [{
          pattern: /\bman[- ]man\b|\båka efter\b|\bvar två på\b|\bhänga på\b/i,
          maxAllowed: 0,
          note: 'sluttest-b10-zonmarkering: samma fotbollslån får inte återkomma i matchtexten. Baseline 0 idag (ingen konkret rad flaggad av granskningen) — ett brott är alltså en genuin regression, inte gammal skuld.',
        }],
      },
    ],
  },
  {
    // sluttest-narrative-truth-grind R1 (SPEC 2026-09-04, Opus; byggd 2026-09-06).
    // design-d2: en ABSOLUT säsongsreferens (vilken bandysäsong något gäller)
    // renderas som bandyårs-span ("2028/29") via seasonSpanLabel(), aldrig ett
    // naket kalenderår. Gäller INTE varaktigheter/antal ("8:e säsongen",
    // formatContractRemaining) — de är ordningstal med rätta och rör inte
    // denna regel. Fem levande brott hittades och fixades i samma pass som
    // denna regel skrevs (format.ts, eventFactories.ts, hallProcessService.ts,
    // seasonEndProcessor.ts, transferActions.ts) — två redan korrekta filer
    // (ContractsTab.tsx, BoardMeetingScene.tsx) skyddas här mot regression.
    id: 'sasongsindex-naket-tal',
    claim: 'vilken bandysäsong något gäller (kontraktsslut, byggpaus, övergångsfönster, styrelsemål)',
    forbiddenField: 'naket kalenderår interpolerat direkt i en "säsong ..."-sträng',
    correctField: 'seasonSpanLabel(season)',
    files: [
      {
        path: 'src/domain/format.ts',
        forbidden: [{
          pattern: /säsong \$\{contractUntilSeason\}/,
          maxAllowed: 0,
          note: 'design-d2 (2026-09-06): formatContractUntil visade tidigare "t.o.m. säsong 2028" (naket kalenderår).',
        }],
        required: [{ pattern: /seasonSpanLabel\(contractUntilSeason\)/, minCount: 1, note: 'formatContractUntil ska fortsatt formatera via seasonSpanLabel.' }],
      },
      {
        path: 'src/domain/services/events/eventFactories.ts',
        forbidden: [{
          pattern: /säsong \$\{player\.contractUntilSeason\}/,
          maxAllowed: 0,
          note: 'design-d2 (2026-09-06): kontraktsförfrågan-eventets brödtext visade tidigare ett naket kalenderår.',
        }],
        required: [{ pattern: /seasonSpanLabel\(player\.contractUntilSeason\)/, minCount: 1, note: 'contractRequest-eventet ska fortsatt formatera via seasonSpanLabel.' }],
      },
      {
        path: 'src/domain/services/events/hallProcessService.ts',
        forbidden: [{
          pattern: /säsong \$\{trial\?\.buildPausedUntilSeason\}/,
          maxAllowed: 0,
          note: 'design-d2 (2026-09-06): formatHallNodeSub visade tidigare ett naket kalenderår för byggpaus.',
        }],
        required: [{ pattern: /seasonSpanLabel\(pausedUntilSeason\)/, minCount: 1, note: 'bygge-paus-grenen ska fortsatt formatera via seasonSpanLabel.' }],
      },
      {
        path: 'src/application/useCases/seasonEndProcessor.ts',
        forbidden: [{
          pattern: /säsong \$\{nextSeason\}/,
          maxAllowed: 0,
          note: 'design-d2 (2026-09-06): AI-övergångar-inboxposten visade tidigare ett naket kalenderår.',
        }],
        required: [{ pattern: /seasonSpanLabel\(nextSeason\)/, minCount: 1, note: 'inboxpostens titel ska fortsatt formatera via seasonSpanLabel.' }],
      },
      {
        path: 'src/presentation/store/actions/transferActions.ts',
        forbidden: [{
          pattern: /\$\{game\.currentSeason \+ years\}\)/,
          maxAllowed: 0,
          note: 'design-d2 (2026-09-06): kontraktsförlängningens finanslogg-etikett visade tidigare ett naket kalenderår.',
        }],
        required: [{ pattern: /seasonSpanLabel\(game\.currentSeason \+ years\)/, minCount: 1, note: 'finanslogg-etiketten ska fortsatt formatera via seasonSpanLabel.' }],
      },
      {
        path: 'src/presentation/components/transfers/ContractsTab.tsx',
        required: [{ pattern: /seasonSpanLabel\(game\.currentSeason \+ years\)/, minCount: 1, note: 'kontrakt-förlängd-bekräftelsen var redan korrekt 2026-09-06 — skyddar mot regression.' }],
      },
      {
        path: 'src/presentation/screens/scenes/BoardMeetingScene.tsx',
        required: [{ pattern: /seasonSpanLabel\(game\.currentSeason\)/, minCount: 2, note: 'målrubriken och CTA-knappen var redan korrekta 2026-09-06 (två anropsställen) — skyddar mot regression.' }],
      },
    ],
  },
  {
    // sluttest-narrative-truth-grind R4 (SPEC 2026-09-04, Opus; byggd 2026-09-06).
    // "final"/"semifinal"/"kvartsfinal"/cupfinal i matchtext/kort/portal-kort
    // ska gatas på fixture-flaggor/bracket-data, aldrig bara ett fritt
    // matchday-antagande. Baseline var redan 0 vid granskning 2026-09-06 —
    // MatchLiveScreen.tsx:s kommentar dokumenterar en tidigare "falska
    // SM-guld"-bugg (neutral venue ensamt räckte inte, cupfinaler är också
    // neutral venue) som redan är fixad; denna regel är en ren regressions-
    // vakt, inga levande brott hittades.
    id: 'turneringsfas-fixture-gate',
    claim: 'att matchen är i en viss turneringsfas (final/semifinal/kvartsfinal/cupfinal)',
    forbiddenField: 'ett fritt matchday-antagande utan bracket-/cupBracket-koppling',
    correctField: 'game.playoffBracket/cupBracket-uppslag (fixtures.includes/round-match)',
    files: [
      {
        path: 'src/domain/services/matchCore.ts',
        required: [
          { pattern: /matchPhase === 'final'/, minCount: 2, note: 'kickoff- och målkommentaren ska båda gata final-poolerna på matchPhase.' },
          { pattern: /matchPhase === 'semifinal'/, minCount: 2, note: 'kickoff- och målkommentaren ska båda gata semifinal-poolerna på matchPhase.' },
          { pattern: /matchPhase === 'quarterfinal'/, minCount: 1, note: 'kickoff-kommentaren ska gata kvartsfinal-poolen på matchPhase.' },
          { pattern: /fixture\.isCup && input\.isCupFinalhelgen && fixture\.roundNumber === 4/, minCount: 1, note: 'cupfinalens fulltids-pooler ska kräva isCup + isCupFinalhelgen + rond 4, inte bara isCup.' },
        ],
      },
      {
        path: 'src/presentation/screens/match/MatchLiveScreen.tsx',
        required: [{
          pattern: /bracket\.final\?\.fixtures\.includes\(fixture\.id\)|bracket\.semiFinals\.some\(s => s\.fixtures\.includes\(fixture\.id\)\)/,
          minCount: 2,
          note: 'Falska-SM-guld-fyndet: final/semifinal ska härledas ur playoffBracket-fixtures, inte enbart neutral venue eller roundNumber (cupfinaler är också neutral venue).',
        }],
      },
      {
        path: 'src/application/useCases/processors/matchSimProcessor.ts',
        required: [{
          pattern: /game\.playoffBracket\?\.final\?\.fixtures\.includes\(fixture\.id\)|game\.playoffBracket\?\.semiFinals\.some\(s => s\.fixtures\.includes\(fixture\.id\)\)/,
          minCount: 2,
          note: 'isPlayoffFinal/isPlayoffSemi ska vara bracket-backade, inte bara roundNumber > 22.',
        }],
      },
      {
        path: 'src/domain/services/portal/triggers/matchTriggers.ts',
        required: [
          { pattern: /series\.round === PlayoffRound\.Final && series\.fixtures\.includes\(next\.id\)/, minCount: 1, note: 'nextMatchIsSMFinal: fallback ska vara bracket-backad, inte bara isFinaldag.' },
          { pattern: /finalMatch\?\.fixtureId === next\.id/, minCount: 1, note: 'nextMatchIsCupFinal: ska matcha cupBracket-rond 4:s fixtureId, inte bara isCup.' },
        ],
      },
    ],
  },
  {
    // sluttest-narrative-truth-grind R2 (SPEC 2026-09-04, Opus; byggd 2026-09-06).
    // En relativ säsongsfras ("i år"/"den här säsongen"/"i somras"/"förra
    // året") får bara renderas när den är verifierbart knuten till
    // entry.season === currentSeason (resp. currentSeason-1) — aldrig som
    // ambient stämningstext om ett fält som i själva verket är en
    // karriärackumulator eller saknar en säsongskoppling alls. Skopat till de
    // FYRA liggar-/entry-drivna producenterna recon hittade — INTE den stora
    // ytan av ambient stämningstext (functionaries.ts, boardMeetingCopy.ts
    // m.fl.) som inte har något entry.season att verifiera mot och där
    // regeln därför inte äger något mönster att skydda.
    id: 'sasongsfras-verifierad',
    claim: 'att en händelse gäller "i år"/"den här säsongen"/"i somras"/"förra året"',
    forbiddenField: 'en relativ säsongsfras utan en verifierad entry.season-koppling',
    correctField: 'entry.season === currentSeason (resp. currentSeason-1) innan frasen väljs',
    files: [
      {
        path: 'src/domain/attention/narrativePushCopyResolver.ts',
        required: [
          { pattern: /const seasonsAgo = game\.currentSeason - item\.post\.season/, minCount: 1, note: 'både revansch- och ex-spelare-grenen ska räkna seasonsAgo innan en tidsfras väljs.' },
          { pattern: /if \(seasonsAgo < 0 \|\| seasonsAgo > 1\) return null/, minCount: 2, note: 'ingen gren får rendera "i höstas"/"i somras"/"förra säsongen"/"förra året" utan att först stänga av allt äldre än förra säsongen.' },
        ],
      },
      {
        path: 'src/domain/services/portal/pickEfterklang.ts',
        forbidden: [{
          pattern: /mål mot er den här säsongen/,
          maxAllowed: 0,
          note: 'minne-codex-svep-slutprov (commit a3dd2151): nemesis-premissen påstod tidigare att goalsAgainstUs (en karriärackumulator som aldrig nollställs) gällde innevarande säsong.',
        }],
        required: [{ pattern: /\$\{n\.goalsAgainstUs\} mål mot er\.`/, minCount: 1, note: 'premissen ska förbli säsongslös text — talet är en karriärsumma, inte en säsongsclaim.' }],
      },
      {
        path: 'src/presentation/screens/HistoryScreen.tsx',
        required: [{
          pattern: /deriveGoalOutcomeLine\(s\.personalGoal/,
          minCount: 1,
          note: 'seasonGoalService.deriveGoalOutcomeLine (som säger "i somras") ska bara anropas med den FRUSNA per-säsongs-posten (s.personalGoal), aldrig ett levande currentSeason-fält.',
        }],
      },
      {
        path: 'src/presentation/components/match/HalftimeModal.tsx',
        forbidden: [{
          pattern: /förra året/,
          maxAllowed: 0,
          note: 'Påståendesvepet #1 (MASTER.md, 2026-08-24): en "förra året"-rad ströks helt eftersom komponenten saknar säsongskoll (kunde fyra i en klubbs FÖRSTA match) — får aldrig återinföras utan en riktig säsongsverifiering.',
        }],
      },
      {
        // SPEC_PASTAENDEGRIND_NIVA2_2026-09-06.md §R2: "Code verifierar före
        // scoping" — kontrollerat 2026-09-06, GATED: post.season === fixture.season
        // && post.matchday === 0 (preseason-försäljning samma säsong som
        // matchen), en riktig säsongsverifiering, inte ambient text.
        path: 'src/domain/services/reviewCallbackService.ts',
        required: [{
          pattern: /scorerIds\.has\(subjectId\) && post\.season === fixture\.season && post\.matchday === 0/,
          minCount: 1,
          note: '"...som ni sålde i somras"-callbacken ska bara fyra för en preseason-försäljning (matchday 0) samma säsong som den aktuella matchen.',
        }],
      },
    ],
  },
  {
    // sluttest-narrative-truth-grind R3 (SPEC 2026-09-04, Opus; RETARGETAD
    // SPEC_PASTAENDEGRIND_NIVA2_2026-09-06.md §R3): ursprungsspecen namngav
    // seasonGoalService som källan för "uppfyllt/missat" — men den systemet
    // äger noll av de orden (dess enda text, deriveGoalOutcomeLine, säger
    // "Du gjorde det"/"Det blev inte så", aldrig "uppfyllt"). VARENDA levande
    // "uppfyllt/missat"-rendering kommer från boardObjectiveService.ts's
    // evaluateObjective()/status-fältet. Skriven bokstavligt mot seasonGoal
    // hade varit vakuös (inga träffar) + en required-import som failar
    // överallt — retargetad mot det system texten faktiskt bor i.
    id: 'malstatus-evaluateobjective',
    claim: 'att ett styrelsemål är uppfyllt/missat/i fara',
    forbiddenField: 'ett mall-default eller hårdkodat "uppfyllt"/"missat" utan status-koppling',
    correctField: 'evaluateObjective(obj, game).status (eller det frusna boardObjectiveHistory-record den skrev)',
    files: [
      {
        path: 'src/domain/services/boardObjectiveService.ts',
        required: [{
          pattern: /newStatus === 'met' && obj\.status !== 'met'/,
          minCount: 1,
          note: '"Uppfyllt!"-inboxmeddelandet ska bara fyra på en verklig statusövergång ur evaluateObjective, inte ovillkorligt.',
        }],
      },
      {
        path: 'src/application/useCases/seasonEndProcessor.ts',
        required: [{
          pattern: /const finalStatus = result\.status === 'met' \? 'met' as const : 'failed' as const/,
          minCount: 1,
          note: 'säsongsslutets uppfyllt/misslyckat-inboxpost ska härledas ur evaluateObjective(obj, game).status, inte ett eget antagande.',
        }],
      },
      {
        path: 'src/presentation/components/club/OrtenTab.tsx',
        required: [{
          pattern: /obj\.status === 'met' \? 'Uppfyllt' : obj\.status === 'at_risk' \? 'I fara' : obj\.status === 'failed' \? 'Missat' : 'Aktivt'/,
          minCount: 1,
          note: 'Klubb → Ortens objektivlista ska läsa det levande obj.status-fältet, inte en egen etikett-logik.',
        }],
      },
      {
        path: 'src/application/useCases/roundProcessor.ts',
        required: [{
          pattern: /if \(foretroendepottAmount > 0\)/,
          minCount: 1,
          note: '"uppfyllt flaggskeppsmål"-förtroendepotten ska förbli gated på flagshipMetThisCheckIn-summan från checkInObjectives (evaluateObjective), inte alltid visas.',
        }],
      },
      {
        // DOM (Jacob, 2026-09-06, SPEC_PASTAENDEGRIND_NIVA2 §R3): det frusna
        // record-mönstret ACCEPTERAS som en namngiven undantagsklass — samma
        // legitima mönster som SeasonSummary.championClubId i
        // vem-blev-mastare-regeln. Att läsa ett korrekt skrivet historik-
        // fält räknas som korrekt härlett, inte som ett mall-default.
        path: 'src/domain/services/seasonDecisionsService.ts',
        required: [{
          pattern: /obj\.result === 'met' \? 'uppfyllt' : 'misslyckat'/,
          minCount: 1,
          note: 'läser boardObjectiveHistory (frusen post skriven av seasonEndProcessor) — ett accepterat undantag, inte en live evaluateObjective-import.',
        }],
      },
    ],
  },
]

/**
 * Kör hela förbudslistan mot repot. Samma fil kan förekomma i flera regler
 * (t.ex. SeasonSummaryScreen.tsx) — läses en gång per FileCheck, inte
 * cachead mellan regler (filen är liten, kostnaden försumbar, och att hålla
 * reglerna oberoende av varandra är värt det).
 */
export function scanForbudslistan(): Violation[] {
  const violations: Violation[] = []
  for (const rule of FORBUDSLISTA) {
    for (const file of rule.files) {
      const stripped = stripComments(readSrc(file.path))
      for (const check of file.forbidden ?? []) {
        const matches = stripped.match(new RegExp(check.pattern, 'g')) ?? []
        if (matches.length > check.maxAllowed) {
          violations.push({
            ruleId: rule.id, claim: rule.claim, file: file.path, kind: 'forbidden',
            detail: `"${rule.forbiddenField}" hittad ${matches.length}× (tillåtet: ${check.maxAllowed}). ${check.note}`,
          })
        }
      }
      for (const check of file.required ?? []) {
        const matches = stripped.match(new RegExp(check.pattern, 'g')) ?? []
        if (matches.length < check.minCount) {
          violations.push({
            ruleId: rule.id, claim: rule.claim, file: file.path, kind: 'required',
            detail: `"${rule.correctField}" hittad ${matches.length}× (krävs minst: ${check.minCount}). ${check.note}`,
          })
        }
      }
    }
  }
  return violations
}
