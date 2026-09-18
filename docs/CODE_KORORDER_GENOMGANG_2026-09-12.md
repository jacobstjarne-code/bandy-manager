# CODE-KÖRORDER — genomgången, i turordning (2026-09-12)

**Datum:** lördag 2026-09-12
**Källa:** `CODE_INSTRUKTION_GENOMGANG_2026-09-11.md` (§-hänvisningar nedan pekar dit — läs paragrafen innan passet, den här filen är bara ordningen och acceptanskriterierna). MASTER-raderna finns redan (`genomgang-*`, sista KÄLLA-sektionen i `MASTER_OPPET.md`). Claima raden före varje pass enligt protokollet.

**Läget i en rad:** pass 0 är redan gjort på disk av Opus men ocommittat. Pass 1–2 är det som påverkar första installationen på mobil och ska ligga före soft-launch. Pass 3–5 är egna commits efter det. Opus-punkten (CLAUDE.md-rättelsen) är utförd. Jacob-besluten är öppna och blockerar inget av passen.

---

## Pass 0 — verifiera och committa Opus edits (rad `genomgang-opus-edits-commit`)

Femton filer låg ändrade i arbetsträdet efter genomgången; Språksvep 4-domen (`DOM_SPRAKSVEP4_2026-09-12.md`) lade till sju textfiler till samma ocommittade hög (refereeService, academyBreakthroughText, portalBeats, assistantCoachService, csPressEventText, scandalService, schoolAssignmentService — plus mecenatService/economicCrisisService från den parallella instansen). Samma pass, samma grind. Domens två Code-punkter (seasonsInAcademy till akademicitatet, testförväntningar) görs här. De är iteration-fria fixar, inte spec — jobbet är att köra grinden och committa, inte att göra om dem.

1. `npx tsc --noEmit && npx vitest run` (hela sviten) `&& npm run build`.
2. Kända möjliga röda:
   - Ett test som gör `getByText('💰 …')` på en `SectionLabel` → byt testet till `toHaveTextContent`. Komponenten är rätt.
   - `gameInvariants.test.ts` om det räknar `INVARIANT_NAMES.length` → 15.
   - Tester som asserterar exakta utfall EFTER ett interaktivt mål i livematch (den andra Opus-instansens `liveMatchContext()` ger fler rand-anrop) → uppdatera förväntningarna, inte kontexten.
3. Öppna `dist/sw.js` efter build: precache-manifestet ska INTE innehålla `assets/portraits/` eller `assets/illustrations/`. Ikonerna, logotyperna och `intro-bg.jpg` ska finnas kvar.
4. En commit per fil-grupp med rotorsak i meddelandet (server/persistens/PWA/a11y/motor/CI/docs). Pusha.

**Klart när:** grön svit, grön build, sw.js utan bilder, allt på `origin/main`.

## Pass 1 — illustrationer till webp (§2, rad `genomgang-illustrationer-webp`)

1. Engångsskript `scripts/convert-illustrations.mjs` med `sharp`: alla `public/assets/illustrations/*.jpg` → `.webp`, kvalitet 80, max bredd 1170 px. Skriptet committas, output-JPG:erna raderas.
2. Byt referenser i `eventIllustration.ts`, `IllustrationScene.tsx`, `imageAssetIntegrity.test.ts` (`illustrationNames` → `.webp`) och det grep av `assets/illustrations/` i `src/` hittar. `intro-bg.jpg` i roten rörs inte.
3. Browserprov 390 px: Portal med SM-finalband, årsbok, game over, kafferum — bilden laddas, ingen bruten länk, ingen synlig kvalitetsförlust.

**Klart när:** mappen < 3 MB (var 12 MB), `imageAssetIntegrity` grön, browserprov noterat i commit.

## Pass 2 — code-splitting (§1, rad `genomgang-code-splitting`)

1. `React.lazy` + `Suspense` på route-nivå i `AppRouter.tsx`: SeasonSummary, Squad, History, Tabell, Inbox, Transfers, Tilltrade, GameOver. `DevScenesScreen` gate:as på `import.meta.env.DEV` så den inte ligger i prod-bundeln alls.
2. Match-bundeln (MatchLiveScreen + matchCore/matchEngine + `components/match/*`) som EN lazy chunk.
3. Fallback: tom yta i `var(--bg)`. Ingen spinner, ingen text (LESSONS #31).
4. Riskprov: byt till en annan save med `pendingScreen` satt → `pendingScreenRedirect` ska landa rätt även när målrouten inte hunnit laddas. Kall PWA-start → Portal → Match → Granska → Årsbok på 390 px.
5. Samma pass: `contentContract.ts` (§8) delas i runtime-fil (id + whyNow) och register utanför appen — det är 267 kB prosa i huvudchunken och samma mål.

**Klart när:** huvudchunk < 1,5 MB (var 2,79 MB) — siffran ur `vite build`-utskriften i commit-meddelandet, full svit + `npm run test:visual` gröna, browserprov noterat.

## Pass 3 — toolchain (§4, rad `genomgang-toolchain-bump`)

Node 22 är redan satt i `render.yaml`, `app-ci.yml`, `visual-baselines.yml` (pass 0). Kvar: `vite` ^5.2 → 6 eller 7, `vitest` ^1.4 → 3, `@types/node` → 22, `vite-plugin-pwa`/`@vitejs/plugin-react` till versioner som stödjer vald Vite. `npm install` så lock-filen följer.

1. Full svit, build, `npm run test:visual`, `npm run lint:design`.
2. Om vitest 3 ändrar `environmentOptions`-formen: följ migreringsguiden, ändra inte testerna.
3. Kör `npm run stress` en gång så motorn bevisas oförändrad under ny toolchain (samma seed → samma utfall som före bumpen; jämför `season_stats.json`-nyckeltalen).

**Klart när:** allt grönt lokalt OCH app-ci grön på GitHub efter push.

## Pass 4 — docs-omflyttning (§3, rad `genomgang-docs-omflyttning`)

**Villkor:** inga `in_progress`-rader i `MASTER_OPPET.md` när passet startar. Finns det claims — vänta.

1. `git mv` enligt §3 steg 1 (dom/, rapport/, handover/, spec/, playtest/).
2. Grep-uppdatera pekare enligt §3 steg 2–3. CLAUDE.md sessionsstart steg 3 och "VID SESSIONSSLUT" pekar på `docs/handover/`.
3. `MASTER_OPPET.md` "AKTUELL STATUS": räknarnarrativet ersätts med EN rad (`**Aktiva poster: N** (råräknat YYYY-MM-DD)`). Det gamla stycket flyttas ordagrant till `MASTER_ARKIV.md` under "Räknarhistorik 2026-09-08 → 2026-09-12".
4. `SLUTTEST_KO.md` och `BACKLOG.md` → `docs/archive/`, pekare uppdaterade.
5. Verifiera med `grep -rn "docs/DOM_\|docs/RAPPORT_\|docs/HANDOVER_" CLAUDE.md CLAUDE_REFERENCE.md AGENTS.md docs/*.md` → noll träffar på gamla sökvägar.

**Klart när:** `ls docs/*.md | wc -l` < 60 (var 352), MASTER_OPPET läsbar på under en minut, noll döda pekare.

## Pass 5 — motorn (§12, rad `genomgang-motor-utvisning-halvlek`) — EGEN commit, efter pass 0–4

Utvisningstimers över halvleks-/regen-gränsen. Följ §12 steg 1–6 exakt. Stresstest före och efter; om `goalsPerMatch` glider mer än 0,15 från 9,12 — rapportera siffran till Opus, rör inte `GOAL_RATE_MOD`. Bumpa `MATCH_ENGINE_VERSION` patch. Ta bort den dubbla `ENGINE_VERSION`-konstanten i samma commit.

## Utförd Opus-punkt

CLAUDE.md § Spelets värld är rättad (klubbnamnen ÄR verkliga föreningars, allt runt namnet är påhittat) och kommunvapen-regeln står där. Ingår i pass 0-commiten.

## Öppna Jacob-beslut (blockerar inget pass)

1. `docs/data/bandygrytan_detailed.json` i repot eller gitignorad lokal katalog (databasskydd, sui generis). Svar ja/nej → Code gör `.gitignore`-raden i pass 4 om det blir gitignorad.
2. Mätbart soft-launch-mål. Förslag: båda testarna når `season_completed ≥ 1` och median `session_end.durationSeconds > 15 min` inom två veckor. Ja/justera → Opus skriver in det i `RELEASE_DEFINITION_MJUKLANSERING.md`.

## Inte i denna körorder (egna rader, egna pass)

`genomgang-motor-attribut-aldras-ej` (Jacob-dom först), `genomgang-motor-smafynd`, `genomgang-match-dod-kod`, `genomgang-portal-effekter`, `genomgang-matchprofile-halvlek`, `genomgang-portal-cue-typografi` (Design), `genomgang-save-storlek-matrad`. Alla står i MASTER med sin §.
