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
 * TEMPORÄR ALLOWLIST — TA BORT VARJE RAD NÄR OPUS LEVERERAR DEN RIKTIGA
 * TEXTEN. Detta är INTE en "verifierad säker"-lista (jmf
 * standingPositionReadGate.ts) — det är en ögonblicksbild av kända,
 * oadresserade platshållare per sex-säsonersauditen 2026-08-27. `maxAllowed`
 * är dagens exakta antal per fil, inte ett tak att växa mot: en NY
 * '[Opus]'-förekomst i en redan listad fil (t.ex. ett åttonde
 * boardObjective-fält) höjer antalet över `maxAllowed` och failar grinden
 * precis som i en helt ny fil.
 */
const ALLOWLIST: { file: string; maxAllowed: number; reason: string }[] = [
  {
    file: 'src/domain/services/turneringslageService.ts',
    maxAllowed: 1,
    reason: 'Strukturellt onåbar fallback-gren (deriveTurneringslageMode ger aldrig detta läget) — men literalen finns i koden, inte bara en kommentar.',
  },
  {
    file: 'src/domain/data/scenes/valetScene.ts',
    maxAllowed: 1,
    reason: 'VALET_CONFIRM_CTA-fallback för en facilitetsnod utan CTA-text — verifierad 2026-07-21 att alla 10 dåvarande noder är täckta, men typmässigt overifierad (Record<string,string>) mot framtida noder.',
  },
  {
    file: 'src/presentation/components/KlubbparmOverlay.tsx',
    maxAllowed: 1,
    reason: 'chapterAwaitsText-säkerhetsnät — verifierad 2026-07-21 att alla 6 nuvarande kapitel har text, men strukturellt overifierad mot ett sjunde kapitel.',
  },
  {
    file: 'src/domain/data/contentContract.ts',
    maxAllowed: 1,
    reason: 'INTE en spelartextplatshållare — literalen förekommer bara i sponsorOffer-radens `notes`-dokumentationsfält (metadata för Innehållskontraktet), aldrig renderad för spelaren. Kvar på listan för att grinden inte ska false-positive på dokumentation, men detta är inte ett H4b-läckage.',
  },
  {
    file: 'src/presentation/components/match/LineupStep.tsx',
    maxAllowed: 1,
    reason: 'A3 (DOM_A3_KONDITIONSSPIRAL_2026-08-29.md) krav 3: teckenförklaringen ovanför spelarlistan för den nya prognoskolumnen — "kondition nu → efter nästa match (ungefärlig), och för otillgängliga: omgångar tills han är valbar igen". Själva talen är språkneutrala och renderas redan; bara den förklarande meningen väntar Opus. (A-H3:s tre tidigare platshållare i samma fil är fyllda och borttagna ur listan.)',
  },
  {
    file: 'src/presentation/components/match/FatigueFloorConfirm.tsx',
    maxAllowed: 7,
    reason: 'A3 (DOM_A3_KONDITIONSSPIRAL_2026-08-29.md) krav 1 — hela bekräftelsegrinden när elvan går under konditionsgolvet. Sju strängar: (1) rubriken för det tvingade läget, (2) brödtexten som namnger kostnaden av att gå in kort över golvet (A-H3:s två ben: höjd skaderisk + risk att förlora dem till nästa match), (3) sektionslabel för listan över spelare under golvet, (4) förklaringen av de två prognostalen (startar / vilas) och att det är en förväntan, inte ett löfte — matchkostnaden slumpas 15–25, (5) sektionslabel för akademikallelsen som konkret utväg, (6) avbryt-knappen, (7) bekräfta-knappen "gå in med dem ändå" — domens synliga beslut. Talen i ytan (N/11, golvet, prognosprocenten) är språkneutrala och står redan renderade.',
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
}

/**
 * Sveper hela `src/` (exkl. tester och dev-only-skalet) efter kvarvarande
 * '[Opus]'-platshållare utanför kommentarer. En fil UTAN allowlist-post som
 * innehåller literalen är alltid en violation (nytt läckage). En fil MED
 * allowlist-post är en violation bara om antalet överstiger `maxAllowed`
 * (ett nytt fält i en redan känd fil).
 */
export function scanOpusPlaceholders(): OpusPlaceholderViolation[] {
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
    const allowed = allow?.maxAllowed ?? 0
    if (matches.length > allowed) {
      violations.push({ file: rel, count: matches.length, allowed, reason: allow?.reason ?? null })
    }
  }
  return violations
}
