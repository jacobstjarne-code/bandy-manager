import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { stripComments } from './forbudslistan'

/**
 * A-H4b (SLUTTEST_KO.md, SEXSÄSONGSAUDITEN) — OPUS-PLATSHÅLLARGRINDEN.
 *
 * "'[Opus]' syns för spelaren varje sommar." CLAUDE.md:s regel (SVENSK TEXT
 * — CODE SKRIVER ALDRIG) tillåter Code att skriva literalen `'[Opus]'` som
 * enda platshållarsträng när ett textfält väntar på Opus — men den regeln
 * har ingen mothake mot att platshållaren SHIPPAS. Sex-säsongersauditen
 * (2026-08-27) bekräftade att flera av dem gör precis det: Survive-tiern
 * (H4 Heros lägsta förväntanstier) triggar minst tre av dem VARJE
 * säsongsväxling (styrelsemöte, säsongssammanfattning, delningsbild).
 *
 * Samma "billiga nivå 2"-metod som standingPositionReadGate.ts: kodbas-brett
 * grep (inte en AST-parser), kommentarer bortstrippade (stripComments,
 * återanvänd från forbudslistan.ts) så att en rotorsak-kommentar som NÄMNER
 * '[Opus]' i prosa inte räknas som en kodrad. Skiljer sig från
 * standingPositionReadGate på en punkt: undantagslistan här är EXPLICIT
 * TEMPORÄR, inte en verifierad "säker av annan mekanism"-lista. Varje post
 * är ett KÄNT ÖPPET LÄCKAGE (eller en strukturellt overifierad
 * säkerhetsnätsfallback) som väntar på att Opus skriver den riktiga texten
 * — INTE en permanent godkänd plats för '[Opus]' att bo. Ta bort raden
 * samma commit som texten levereras, sänk aldrig maxAllowed för att någon
 * annan anledning "känns okej".
 *
 * Skopning: hela src/, exkl. tester (samma mönster som övriga grindar) och
 * `src/presentation/screens/dev/` — DevScenesScreen.tsx-katalogen är
 * dev-only (gated på import.meta.env.DEV, se filens eget filhuvud) och
 * redan etablerat undantag i andra kodbas-breda grep-portar i CLAUDE.md
 * (hex-färg-porten, rink-porten). Spelaren når aldrig den ytan.
 */

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '../..')

const RAW_PATTERN = /\[Opus\]/g

const SCOPE_DIRS = ['src']
const EXCLUDE_DIR_PATTERNS = [
  /__tests__/,
  /\.test\.[tj]sx?$/,
  /\.spec\.[tj]sx?$/,
  /^src\/presentation\/screens\/dev\//,
]

/**
 * SPEC_SANNINGSGRINDAR_2026-08-31.md GRIND 1 (2026-09-01): grinden vände.
 * Tidigare tillät `maxAllowed` en NÅBAR, blank platshållare att shippa för
 * evigt så länge räkningen inte steg — precis så sju blanka strängar nådde
 * FatigueFloorConfirm (en yta spelaren står på). Varje post är nu klassad:
 *
 *   reachable: true  → EN blank sträng räcker för hard fail, `maxAllowed`
 *                       ignoreras helt. En spelaryta får ALDRIG shippa blank.
 *   reachable: false → strukturellt overifierad fallback/dokumentation.
 *                       Tillåten upp till `maxAllowed`, men bara till
 *                       `since` + STALENESS_DAYS — spårad skuld med en
 *                       klocka, inte ett permanent hem.
 *
 * TA BORT raden samma commit som texten levereras. Lägg ALDRIG till en ny
 * rad för att få grön build — bara för att dokumentera en NY, medvetet
 * tillfällig platshållare Opus ska fylla.
 */
export const STALENESS_DAYS = 30

interface AllowlistEntry {
  file: string
  maxAllowed: number
  reason: string
  /** Når en spelare denna sträng i normalt spel? true → hard fail vid count>0, maxAllowed ignoreras. */
  reachable: boolean
  owner: 'Opus' | 'Code' | 'Jacob'
  /** ISO-datum posten först loggades — styr STALENESS_DAYS för reachable:false-poster. */
  since: string
}

const ALLOWLIST: AllowlistEntry[] = [
  {
    file: 'src/domain/services/turneringslageService.ts',
    maxAllowed: 1,
    reason: 'Strukturellt onåbar fallback-gren (deriveTurneringslageMode ger aldrig detta läget) — men literalen finns i koden, inte bara en kommentar.',
    reachable: false,
    owner: 'Opus',
    since: '2026-08-31',
  },
  {
    file: 'src/domain/data/scenes/valetScene.ts',
    maxAllowed: 1,
    reason: 'VALET_CONFIRM_CTA-fallback för en facilitetsnod utan CTA-text — verifierad 2026-07-21 att alla 10 dåvarande noder är täckta, men typmässigt overifierad (Record<string,string>) mot framtida noder.',
    reachable: false,
    owner: 'Opus',
    since: '2026-08-31',
  },
  {
    file: 'src/presentation/components/KlubbparmOverlay.tsx',
    maxAllowed: 1,
    reason: 'chapterAwaitsText-säkerhetsnät — verifierad 2026-07-21 att alla 6 nuvarande kapitel har text, men strukturellt overifierad mot ett sjunde kapitel.',
    reachable: false,
    owner: 'Opus',
    since: '2026-08-31',
  },
  {
    file: 'src/domain/data/contentContract.ts',
    maxAllowed: 1,
    reason: 'INTE en spelartextplatshållare — literalen förekommer bara i sponsorOffer-radens `notes`-dokumentationsfält (metadata för Innehållskontraktet), aldrig renderad för spelaren. Kvar på listan för att grinden inte ska false-positive på dokumentation, men detta är inte ett H4b-läckage.',
    reachable: false,
    owner: 'Code',
    since: '2026-08-31',
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

export interface OpusPlaceholderViolation {
  file: string
  count: number
  allowed: number
  reason: string | null
  /** Varför just DENNA violation triggade — grind-1-vändningen (2026-09-01). */
  cause: 'reachable' | 'stale' | 'over-limit' | 'unlisted'
}

/**
 * Sveper hela `src/` (exkl. tester och dev-only-skalet) efter kvarvarande
 * '[Opus]'-platshållare utanför kommentarer.
 *
 * SPEC_SANNINGSGRINDAR_2026-08-31.md GRIND 1 — ordningen en fil prövas mot:
 *   1. Ingen allowlist-post → violation (unlisted, oförändrat — nytt läckage).
 *   2. `reachable: true` → violation OM count>0, ALLTID (cause 'reachable'),
 *      `maxAllowed` ignoreras helt. En nåbar blank platshållare får aldrig
 *      shippa, oavsett hur länge den stått eller hur många den är.
 *   3. `reachable: false` → violation om count>maxAllowed (cause 'over-limit',
 *      som tidigare) ELLER om `since` är äldre än STALENESS_DAYS (cause
 *      'stale') — spårad skuld, men med en klocka så den inte bor för evigt.
 */
export function scanOpusPlaceholders(now: Date = new Date()): OpusPlaceholderViolation[] {
  const allowMap = new Map(ALLOWLIST.map(a => [a.file, a]))
  const files: string[] = []
  for (const d of SCOPE_DIRS) walk(join(REPO_ROOT, d), files)

  const violations: OpusPlaceholderViolation[] = []
  for (const full of files) {
    const rel = relative(REPO_ROOT, full).split('\\').join('/')
    if (EXCLUDE_DIR_PATTERNS.some(p => p.test(rel))) continue
    const stripped = stripComments(readFileSync(full, 'utf-8'))
    const matches = stripped.match(RAW_PATTERN) ?? []
    if (matches.length === 0) continue

    const allow = allowMap.get(rel)
    if (!allow) {
      violations.push({ file: rel, count: matches.length, allowed: 0, reason: null, cause: 'unlisted' })
      continue
    }

    if (allow.reachable) {
      violations.push({ file: rel, count: matches.length, allowed: 0, reason: allow.reason, cause: 'reachable' })
      continue
    }

    if (matches.length > allow.maxAllowed) {
      violations.push({ file: rel, count: matches.length, allowed: allow.maxAllowed, reason: allow.reason, cause: 'over-limit' })
      continue
    }

    const ageDays = (now.getTime() - new Date(allow.since).getTime()) / 86_400_000
    if (ageDays > STALENESS_DAYS) {
      violations.push({ file: rel, count: matches.length, allowed: allow.maxAllowed, reason: `${allow.reason} [stale: ${Math.floor(ageDays)} dagar sedan ${allow.since}, gräns ${STALENESS_DAYS}]`, cause: 'stale' })
    }
  }
  return violations
}
