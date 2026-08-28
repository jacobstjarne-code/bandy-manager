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
    file: 'src/application/useCases/roundProcessor.ts',
    maxAllowed: 2,
    reason: 'patronWithdrawal-eventets title/body (mecenat lämnar p.g.a. orten, inte relationen) — väntar Opus.',
  },
  {
    file: 'src/application/useCases/seasonEndProcessor.ts',
    maxAllowed: 2,
    reason: 'Sponsor-lämnar-vid-licensöverskridande-inboxradens title/body. Triggas vid säsongsslut — sommaren.',
  },
  {
    file: 'src/application/useCases/processors/eventProcessor.ts',
    maxAllowed: 2,
    reason: 'mecenatWithdrawal-eventets title/body (samma mönster som roundProcessor, skild orsak).',
  },
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
    file: 'src/application/useCases/setLineup.ts',
    maxAllowed: 1,
    reason: 'A-H3 (DOM_AH3_TILLGANGLIGHET_2026-08-28.md): felmeddelandet för "vilar/överbelastad efter förra matchens sannolikhetskast" — skild orsak från isInjured/avstängd, väntar Opus.',
  },
  {
    file: 'src/presentation/components/match/LineupStep.tsx',
    maxAllowed: 3,
    reason: 'A-H3 (DOM_AH3_TILLGANGLIGHET_2026-08-28.md): tre platser — radtaggen "vilar" (isRestingOut), förhandsvarnings-taggen (isFatigueRisk, domens icke förhandlingsbara krav) och valideringsboxens tredje textgren. Alla väntar Opus.',
  },
  {
    file: 'src/presentation/components/match/NodtruppScene.tsx',
    maxAllowed: 1,
    reason: 'A-H3 (DOM_AH3_TILLGANGLIGHET_2026-08-28.md): nödtrupp-statusradens tredje otillgänglighetsorsak ("X [Opus]" bredvid "Y skadade, Z avstängda") — väntar Opus.',
  },
  {
    file: 'src/presentation/screens/SeasonContractDemandsScreen.tsx',
    maxAllowed: 2,
    reason: 'A-H2b (DOM_AH2B_RETENTION_2026-08-28.md): säsongsövergångens lönekravskort — rubrik + förklaringsrad. Doktrinen skärper explicit: "any new UI copy... must use the literal placeholder string [Opus]" tills mekanik/magnituder står. Funktionella knapp-/sektionsetiketter på samma yta är inte gated (samma kategori som befintliga Förläng/Avslå-knappar). Väntar Opus.',
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
