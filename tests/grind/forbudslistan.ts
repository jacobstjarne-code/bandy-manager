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
