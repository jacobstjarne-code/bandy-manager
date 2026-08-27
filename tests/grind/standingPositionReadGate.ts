import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { stripComments } from './forbudslistan'

/**
 * PÅSTÅENDEKARTAN, LÄST-FÖRE-INITIERING (2026-08-26, sjätte arten,
 * `PASTAENDEKARTAN_2026-08-24.md`). Sex bekräftade instanser av samma bugg
 * (GRIND1-skriptet, `cupProcessor.ts`, `bestFinish`, och fem till hittade i
 * ett fullt kodsvep) delade en rotorsak: `standings.find(s => s.clubId ===
 * X)?.position` läst som om det alltid vore en verklig placering — vid
 * noll spelade matcher (säsongsstart, eller precis efter en säsongs-
 * rollover) är alla klubbar på 0 poäng och tie-breaken ger en alfabetisk
 * skuggposition, inte en verklig.
 *
 * Jacobs order (2026-08-26): "Sex instanser av samma bugg betyder att den
 * sjunde kommer, och den ska failas i CI i stället för hittas av en
 * märklig statistik." Till skillnad från `forbudslistan.ts` (som är
 * skopad per FIL till redan fixade ytor, av skäl den filen själv
 * dokumenterar) behöver DEN HÄR regeln vara kodbas-bred — bugmönstret kan
 * dyka upp var som helst en ny funktion läser en klubbs tabellplacering.
 *
 * Metod: samma "billiga, nivå 2"-avvägning som forbudslistan.ts (grep,
 * inte en riktig AST-parser) men kodbas-bred med en SLUTEN, granskningsbar
 * undantagslista — exakt samma mönster som CLAUDE.md:s två andra
 * kodbas-breda ord-/mönstergrep (dokumenterade undantag inbyggda i
 * kommandot, inte en gissad allowlist). Ett
 * nytt fynd av mönstret UTANFÖR listan FAILAR grinden — antingen migrera
 * till `safeStandingPosition`/`getCurrentLeaguePosition`
 * (standingsService.ts), eller lägg till filen i listan med en anledning
 * (kräver att du faktiskt verifierat att den är gated på annat sätt, t.ex.
 * en `hasLeagueStarted`/omgångsspärr — inte en gissning).
 *
 * Undantagslistan nedan är populerad av 2026-08-26-svepet (samtliga filer
 * verifierade gated på annat sätt: en round-nummer-spärr, en
 * `hasLeagueStarted`/`anyLeagueMatchPlayed`-vakt, `getCurrentLeaguePosition`,
 * eller att anropet sker EFTER den lokala tabellomräkningen i
 * roundProcessor.ts/seasonEndProcessor.ts, inte före).
 */

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '../..')

// Fångar `<ngt>.find(<pred med clubId>)<?.>.position` — kräver clubId i
// predikatet för att skilja en standings-rad från t.ex. en spelares
// PlayerPosition-fält (`player.position`, helt orelaterat).
const RAW_PATTERN = /\.find\([^)]*clubId[^)]*\)\s*\??\.\s*position\b/g

const SCOPE_DIRS = ['src']
const EXCLUDE_DIR_PATTERNS = [/__tests__/, /\.test\.[tj]sx?$/, /\.spec\.[tj]sx?$/]

// Den kanoniska, säkra vägen — filen där mönstret FÅR förekomma rått,
// eftersom den ÄR den godkända implementationen.
const CANONICAL_FILE = 'src/domain/services/standingsService.ts'

/**
 * Sluten undantagslista (2026-08-26-svepet). Varje rad = en fil där
 * mönstret verifierats säkert av EN ANNAN mekanism än `played>0` — inte en
 * gissning. Se `RAPPORT_FYRA_UTREDNINGAR_2026-08-26.md` för
 * verifieringen bakom varje post.
 */
const ALLOWLIST: { file: string; reason: string }[] = [
  { file: 'src/application/useCases/seasonEndProcessor.ts', reason: 'läser antingen den lokalt omräknade riktiga säsongsslut-tabellen, eller game.standings FÖRE nästa-säsongs-överskrivningen — aldrig efter/före i fel ordning' },
  { file: 'src/application/useCases/roundProcessor.ts', reason: 'scoreSnapshots m.fl. läser updatedGame.standings EFTER den lokala calculateStandings-omräkningen (rad ~301)' },
  { file: 'src/application/useCases/playoffTransition.ts', reason: 'körs efter hela grundserien (22 omgångar) — standings är alltid reella vid den tidpunkten' },
  { file: 'src/domain/services/economyService.ts', reason: 'calcRoundIncome-anropets egen position-läsning matas med den lokalt omräknade tabellen från anropsstället (economyProcessor.ts), samma ordning som roundProcessor' },
  { file: 'src/domain/services/contextualSponsorService.ts', reason: 'gated till currentRound===11 (och 5/18 för kommunstöd) — aldrig omgång 1' },
  { file: 'src/domain/services/mediaService.ts', reason: 'gated roundNumber>=10' },
  { file: 'src/domain/services/boardObjectiveService.ts', reason: 'checkInObjectives anropas bara vid [7,14,22].includes(leagueRound)' },
  { file: 'src/domain/services/reputationMilestoneService.ts', reason: 'gated currentLeagueRound>=8 vid enda anropsstället (mediaProcessor.ts)' },
  { file: 'src/domain/services/seasonGoalService.ts', reason: 'anropas med säsongsslutets redan-reella standings (före nästa säsongs överskrivning)' },
  { file: 'src/domain/services/situationFragments.ts', reason: 'de två position-läsande fragmenten är gated completedLeague>=3/>=5 — den tredje, ogatade grenen (situationService.ts) är EN EGEN, redan flaggad öppen fråga (RAPPORT_FYRA_UTREDNINGAR_2026-08-26.md), inte gated via detta mönster' },
  { file: 'src/domain/services/functionaryQuoteService.ts', reason: 'matar getFunctionaryPhase, som bevisligen ignorerar tablePosition-argumentet för omgång<=11' },
  { file: 'src/domain/services/portal/atmosphereResolver.ts', reason: 'samma getFunctionaryPhase-inertness som ovan' },
  { file: 'src/domain/services/portal/portalBuilder.ts', reason: 'samma getFunctionaryPhase-inertness som ovan' },
  { file: 'src/presentation/components/portal/PortalPhaseMark.tsx', reason: 'samma getFunctionaryPhase-inertness som ovan' },
  { file: 'src/presentation/store/actions/gameFlowActions.ts', reason: 'samma getFunctionaryPhase-inertness (rad ~312-316); scoreSnapshot-raden läser post-omräkning' },
  { file: 'src/presentation/components/match/PreMatchContext.tsx', reason: 'gated av getCurrentLeaguePosition(...) !== null innan positionen används' },
  { file: 'src/presentation/screens/granska/GranskaOversikt.tsx', reason: 'använder redan getCurrentLeaguePosition(), renderar "—" vid null' },
  { file: 'src/presentation/components/portal/secondary/TabellSecondary.tsx', reason: 'komponenten returnerar null helt om !hasLeagueStarted' },
  { file: 'src/presentation/components/dashboard/NextMatchCard.tsx', reason: 'standing-variablerna är explicit undefined om inte anyLeagueMatchPlayed' },
  { file: 'src/presentation/screens/TabellScreen.tsx', reason: 'visar HELA den faktiska (om än 0-poängs) tabellen — ingen enskild "din placering"-siffra som kan vilseleda, låg risk' },
  { file: 'src/presentation/screens/PlayoffIntroScreen.tsx', reason: 'körs djupt in i säsongen (efter grundserien) — standings alltid reella' },
  { file: 'src/presentation/components/portal/primary/SMFinalPrimary.tsx', reason: 'samma djup-i-säsongen-motivering' },
  { file: 'src/presentation/screens/match/FinalIntroScreen.tsx', reason: 'samma djup-i-säsongen-motivering' },
  { file: 'src/domain/services/seasonSummaryService.ts', reason: 'läser standingsSnapshot — en fryst kopia av game.standings tagen VID SÄSONGSSLUT (generateSeasonSummary), aldrig en pågående säsongs tabell' },
  {
    file: 'src/application/useCases/processors/cupProcessor.ts',
    reason: 'KÄND, ICKE FIXAD BUGG — inte verifierad säker. "Baserat på er ranking (X:a)" i cupbye-texten beräknas under försäsongens cupfönster (matchday 1-4), innan någon ligamatch spelats — bekräftat en av de tre ursprungliga instanserna. Jacobs order (BACKLOG.md): rätt källa är SeasonSummary.finalPosition, men "bygg inget här utan ett separat beslut". Kvar på listan tills det beslutet finns — TA INTE bort utan att antingen fixa eller få ett uttryckligt Jacob-beslut att lämna den.',
  },
]

function walk(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      walk(full, out)
    } else if (['.ts', '.tsx'].includes(extname(full))) {
      out.push(full)
    }
  }
}

export interface StandingPositionViolation {
  file: string
  count: number
}

/**
 * Sveper hela `src/` efter det råa mönstret. Returnerar filer som
 * INNEHÅLLER mönstret men INTE finns på undantagslistan (eller är den
 * kanoniska implementationen själv) — dessa är regressioner/nya fynd.
 */
export function scanStandingPositionReads(): StandingPositionViolation[] {
  const allowedFiles = new Set([CANONICAL_FILE, ...ALLOWLIST.map(a => a.file)])
  const files: string[] = []
  for (const d of SCOPE_DIRS) walk(join(REPO_ROOT, d), files)

  const violations: StandingPositionViolation[] = []
  for (const full of files) {
    const rel = relative(REPO_ROOT, full)
    if (EXCLUDE_DIR_PATTERNS.some(p => p.test(rel))) continue
    if (allowedFiles.has(rel)) continue
    const stripped = stripComments(readFileSync(full, 'utf-8'))
    const matches = stripped.match(RAW_PATTERN) ?? []
    if (matches.length > 0) {
      violations.push({ file: rel, count: matches.length })
    }
  }
  return violations
}
