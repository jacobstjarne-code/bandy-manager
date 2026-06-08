# CODE-LEVERANS — juni 2026 (enda ingången)

**Från:** Opus (projektledning) · **Datum:** 2026-06-07 · **Till:** Code
**Ersätter** `KOMPLETT-OVERLAMNING-2026-06-07.md` som Codes startpunkt. Läs detta först; det pekar vidare till rätt källa per sak och listar de försoningar som överskriver allt annat.

---

## 📌 NÄSTA STEG (pinnat 2026-06-07, rev. 3) — Spår A pågår; svep-signoff nu, match-vy-signoff senare

**Två oberoende granskningar, inte en kombinerad i slutet.** Svepet (Spår B) är byggt och fångat — granskas NU. MatchLive-ytorna (Spår A, pågår) får egen signoff när de byggts och fångats. De rör olika ytor (ingen in-match-vy ligger i svep-bilagan), så ingen omgransknings-risk.

**Spår A — motorkänsla / MatchLive-ombyggnad (PÅGÅR).** Källor: **`design-system/SPEC-SPAK-AB-2026-06-08.md` (bygg-spec för Spak A/B — gäller före listan nedan)**, copy i `src/domain/data/matchLiveText.ts`, `design-system/briefs/DESIGN-BRIEF-MOTORKANSLA-2026-06-07.md` (§8 + ärlighetsprincip §2), `design-system/HANDOFF-MOTORKANSLA-2026-06-07.md`, `docs/AUDIT-MATCH-MODALER-2026-06-07.md`, mockar `docs/mockups/2026-06-07_design_{motorkansla,matchlive_helhet,match_modaler,event_audit}.html`.

**Status 2026-06-08:** steg 0 (motorexponering, `d0768ab`), ärlig MomentumBar (`c301327`) och de två 🟥 modalerna → mörk panel (`23d00b4`) är KLARA. Kvar = **Spak A** (HalftimeModal: paussnack + preview + `postBreakUrgency`-wiring [Jacob auktoriserade], 🟧 mörk panel) + **Spak B** (sent matchningsval, feed-kort) + pixelpass — allt per SPEC-SPAK-AB. Brytpunkts-copy byts till `matchLiveText.ts`-importen (inkl. ny kvitterings-rad).
1. **Förutsättning (steg 0):** exponera motorvariablerna per steg på `MatchStep` — `homeInitiative` (reell initiativ-andel, EJ skott-proxyn `momentumDiff`), `postBreakUrgency`, `postEqualizerMomentum` (+lag), `lateFactor`, `matchProfile`. Utan dem är baren en proxy-lögn (brief §8).
2. **MomentumBar:** ersätt skott+hörn-proxyn med ärlig läsning av variablerna ovan. Tre §4.1-beteenden; decay per dynamik (§8 Q3); volatilitetsband ur lateFactor+profil, aldrig tick-historik (§8 Q1).
3. **MatchLive-helhet:** komponera IN ny bar + Spak A (paussnack i HalftimeModal, bar-preview) + Spak B (feed-kort, lateFactor-gate) i stacken — inte ovanpå.
4. **Modaler (audit):** 🟥 TacticChangeModal + SubstitutionModal → mörk Stålvallen-panel (ljus pappersmodal mitt i mörk matchvy bryter immersionen — högst prio); 🟧 HalftimeModal → mörk panel + Spak A-wiring. Corner/Penalty/FreeKick/Counter/LastMinute är redan klara — rör ej.

**Spår B — svep-täckning: KLAR** (`97f57b0`). `screenshots/audit/INDEX.md` står på **28 ytor** (de 5 + `season-header` + `squad-trupp`), error-boundary-verifierad, en yta i taget. **Väntar på Jacobs signoff NU** — oberoende av Spår A, så ingen omgransknings-risk.

**Granskning är två oberoende avstämningar:**
- **Svepet (28) — signoff nu.** FÖRST EFTER godkännande: Playwright Linux-baselines ur de godkända svep-lägena.
- **MatchLive-ytorna (Spår A) — egen signoff** när A är byggt + fångat (nya dev-scener för MomentumBar/modaler/MatchLive-stacken), sedan deras baselines.

Q4 vardagsrytm sist (kräver Opus-text + live-känslokoll). Rör inte `matchCore.ts` (motorn committad, grön) eller `stash@{0}`. Håll bygget grönt.

**Svep-granskning 2026-06-08 — fynd & status.** Jacob gick igenom svep-bilagan: **alla ytor godkända** utom fyra fynd. Tre är copy (Opus, klara): upptakt `sakrat` (seedning/färdigplockad ut), TranareTab ("i klubben" + `BIO_OPENERS[4]` avsalladad), SquadScreen ("den" ej "dem" + "laguppställning" ej "lineup"), PortalScreen-CTA ("Säsong över" ej "Säsong klar", `playoff_spectator`). Två är Code:

- **V/O/F-läsbarhet (season a/b/c + r2_seasonsummary, graf-fynd).** Rot: SeasonSummary är ljus yta men dess ScoreBlocks renderas **utan `light`** → faller på mörk-portal-basen (`.score-block` bg `--bg-portal-elevated`, num `--text-light`, loss-num `--danger` på mörkt i 12px compact → lågkontrast, läser "suddigt"). Fix: skicka `light` till alla ScoreBlocks på `SeasonSummaryScreen` (plats-blocket + V/O/F-trion) och dev-scenerna `season-a/b/c` → `.score-block.light` (ljus bg, `--text-primary`-num, dämpade stripes). Residualer efter om-capture: subtle-num blir `--text-primary` i light (bra), ev. grad-bump på `.score-block.compact .score-block-num` (12px) om det fortf. läser mjukt, `.light.gold` behåller guldsiffra (mästar-plats). Verifiera via `audit:scenes`.
- **Bandyår-konvention (b) — Opus klar, en Code-koll.** `src/domain/utils/seasonYear.ts` (basår: säsong 1 = 2026/27, en konstant). Wirat: SM-victory (mars-år), Cup-victory (höst-år), SeasonSummary (header-span, cup-startår, elim-syftning, starta-knapp-span). Kanon i DESIGN-DECISIONS. Code: (i) **re-glance SeasonSummary hero-grad** — "SÄSONG 2032/33" är längre än "8/9" i `h-display-hero` (52px/900); kolla att den inte spränger/radbryter på 375px, ev. ned i grad; (ii) **säsongsnamn-svep:** ChampionScreen klar (2026-06-08); kvar = greppa `{season}/{season + 1}` och `Säsong {currentSeason}` (HistoryScreen, SimSummary, GameOver, RoundSummary, Tabell, GameHeader m.fl. — allt som pekar ut en *tidpunkt*, ej varaktighet) → `seasonSpanLabel`/`seasonStartYear`. Mekaniskt, Code (grep + bygg). Kanon i DESIGN-DECISIONS.

**Om-capture:** `season-a/b/c` + `season-header` ändrade både text (bandyår) och kommer ändra utseende (V/O/F-light) → fånga om dem innan deras Playwright-baselines. Övriga svep-ytor oförändrade.

*Ta bort detta block när allt är byggt, granskat och godkänt.*

---

## 0 · Auktoritetsordning (vid konflikt vinner högre upp)

1. **`design-system/DESIGN-DECISIONS.md`** — kanoniska beslut. Sanning för *vad som gäller*.
2. **Denna leverans** — byggordning + försoningarna i §1.
3. **`design-system/global.css` (tokens)** — sanning för *exakta värden*. Inte en mock.
4. Mockar (`docs/mockups/*`) + `CODE-OVERLAMNING-DESIGNPAKET-2026-06-05.md` + `FIDELITY-CHECKLISTA` — visuellt/verifiering.
5. Per-spår-handoffs (`design-system/HANDOFF-*`) — feature-detalj.

Designs implementations-referens-mock och handover-paket är bra, men de glider isär från besluts-loggen på fem punkter. **§1 vinner över dem.**

## 1 · Försoningar — dessa överskriver alla motsägande dokument

| Sak | Fel i något dokument | Gäller |
|---|---|---|
| `.btn--hero` glow | referens-mock: `--accent 40%` | **35%** (kanon-glowsteg, DB-1) |
| Åldersband-chip alpha | referens-mock + R2-mock: 8% fyll / 40% kant | **6% fyll / 30% kant** (kanon, ingen pill-flora) |
| `.btn--hero` mått | referens-mock: padding 13×18, 16→14px | **padding 17×22, 16px/800** (R2-2) |
| Illustrations-sökväg | KOMPLETT + CODE-OVERLAMNING: `src/assets/illustrations/` | **`public/assets/illustrations/`**, ref `/assets/illustrations/{namn}.jpg` (bilderna ligger redan där) |
| Q3 emoji-konvertering | CODE-OVERLAMNING + FIDELITY: konvertera `💔` → HeartCrack | **`💔` stannar emoji** (diegetiskt+känslo-laddat); konvertera bara `▾ ● 🌱` |

## 2 · Byggordning (beroendekarta)

1. **Score-system** (ScoreBlock + Sparkline) — primitiver DB-3/Q1 vilar på. Bygg först.
2. **DB-1 alpha-system** (color-mix, steg 6/18/30/35/55) — master, låser upp all rgba-städning. Glow-35% flaggas för review, auto-konverteras ej.
3. **DB-2…DB-9 + R2 + Q1–Q3** — resten av mekaniken, parallelliserbart efter DB-1. (Mekanik-detalj: `docs/CODE-KONSEKVENS-MEKANIK-2026-06-04.md`, Tier 1/2/2b.)
4. **Q4 Vardagsrytm & tystnad** — `andningsrad` + `tålamodskort`, **portalen först och grundligt**, sedan trupp + granska. (Beror på att färgsemantiken/Q2 stramats åt först.)
5. **IllustrationScene** + placeholders — komponent + tre platser; bilderna droppas efterhand i `public/assets/illustrations/`.
6. **Efterlevnads-grind (§4)** — sätts på när 3 nått grep-rent (ratchet).
7. **Feature-spår** — parallellt, egna handoffs (§3).

## 3 · Alla spår — status & källa

| Spår | Status | Källa |
|---|---|---|
| DB-1…DB-9 | beslutat; **Tier 1 byggt (3605904)**, Tier 2 kvar | DESIGN-DECISIONS · mock `konsekvens_db1-9` |
| R2-1…R2-3 | beslutat, ej byggt | DESIGN-DECISIONS · mock `konsekvens_r2` |
| Q1–Q3 (+ Q3-precisering) | beslutat, ej byggt | DESIGN-DECISIONS · mock `kvalitet_q1-3` |
| **Q4 vardagsrytm & tystnad** | **beslutat (nytt), ej byggt** | DESIGN-DECISIONS · mock `2026-06-07_design_vardagsrytm_portal` |
| Tier 1-flaggor (`.h-label` 9/2.5, z-index +`--z-header`/`--z-sticky`, SectionLabel, `--radius-md`) | beslutat, ej byggt | DESIGN-DECISIONS · CODE-KONSEKVENS-MEKANIK |
| Illustrationssystem | beslutat; 3 bilder i `public/`, 5 beställda | DESIGN-DECISIONS · mock `illustrationssystem` · BESTALLNINGSBRIEFER |
| Feature-spår (spectator, klubbminne/R5, manager, skade, landslag, koreografi, portal-kurering, efterklang, trupp, granska IA, boardmeeting) | per handoff | CODE-OVERLAMNING DEL 3 + `HANDOFF-*` |

## 4 · Efterlevnads-grind (gör efterlevnaden självbärande — Code-arbete)

Designs FIDELITY-CHECKLISTA är ett bra *verifierings-protokoll* men en checkpoint man måste köra för hand. Lyft den till en stående grind så drift inte kan återkomma:

- **`scripts/check-design-tokens.mjs`** — kodifiera FIDELITY:s `▣ grep`-villkor: hårdkodad `rgba([0-9]` (utom scrim/flaggad glow), Tailwind-rgb `34,197,94`/`239,68,68`, `border-radius: 6px`, `border-radius: 12px` (utom `.btn--hero`), `--ice` i squad, `--warm` på åldersband-avtar, emoji-som-data. Varje regel citerar sitt DB. Exit non-zero vid träff.
- **`npm run lint:design`** + **GitHub Actions-workflow på appen** (`tsc` + `vitest` + `lint:design` på PR/push). Det finns ingen app-CI idag — de två workflows som finns är för bandy-brain.
- **Ratchet:** sätt grinden till error *efter* att mekaniken (steg 3) nått grep-rent; warn under tiden. Annars blir bygget rött på befintlig skuld.
- **Generera spegeln:** `colors_and_type.css` ska genereras ur `global.css` (script), inte handsynkas. Den desyncade den här månaden (`--radius-md`, scen-tokens). En genererad spegel kan inte ljuga.
- **CLAUDE.md-kontrakt:** kort sektion Code läser varje session — "före UI-commit: `npm run lint:design`; bara tokens, inga råvärden; citera DB:t du konformar mot."

## 5 · Verifierings-loop (Designs FIDELITY, med §1-korrigeringar)

Per block: Code bockar `▣ grep` + `□` själv → levererar screenshots för `◉ syn` → Design pixel-audit mot mock → `⚑`-flaggor (glow-shadows, spegel) till beslut → block stängs först när allt grönt. Aldrig "klart på känsla". **Korrigera FIDELITY:s Q3-rad (`💔` stannar) och referens-mockens glow/pill/hero-värden mot §1 innan de filas i repot.**

## 6 · Beslut & Jacob-uppgifter (status 2026-06-07)

1. ~~Fila 06-07-dokumenten i repot~~ **KLART** (commit `2e664ab`) — filade, och verifierat §1-korrekta: referens-mock + FIDELITY bär redan glow 35% / chip 6/30 / 💔-stannar. Ingen korrigering behövdes.
2. ~~Committa arbetsträdet~~ Code committar löpande (baseline `2e664ab`).
3. **Avgjorda beslut — APPLICERA (låg inte kvar som "väntar"):**
   - **z-staplingsordning GODKÄND.** PortalScreen-modal 288→`--z-modal`, GameHeader save-toast 201→`--z-toast`, HelpOverlay 250→`--z-overlay`, MatchDoneOverlay 91→`--z-overlay` (91 var en latent under-dropdown-bugg). MatchDone+Help delar 400 — samexisterar aldrig, ok. Playtest-koll: toasten flyttar 201→600, dvs över modaler (semantiskt rätt).
   - **Efterlevnads-grindens omfång:** golvet (grep-grind + `tsc`/`vitest`/`lint:design` i app-CI, ratchet) **står nu** (3 error/2 warn, spegel-generator klar). Playwright + galleri-täckning var taket men är **nu prioriterat per Jacob-direktiv 2026-06-07 — se §7** (allt maskinellt auditeras före mänsklig granskning). Taket byggs härnäst, inte "om/när".

## 7 · Aktuell prioritet (2026-06-07) — maskin-audit FÖRE mänsklig granskning

Jacob-direktiv: allt tekniskt/maskinellt auditeras innan han tittar. Det **vänder** §6.3:s gamla "Playwright uppskjutet" — galleri-täckning + Playwright är nu prioriterat. Konsekvens: **det visuella svepet är INTE live-playtest-gated. Det är screenshot-godkännande.**

Två spår, båda UTAN playtest, görs härnäst (de är inte 'klara' — en rapport om 'allt utan playtest gjort' missade dem):

1. **MiljöHeader-lagret** — bygg mot fallback nu (gradient + dev-only stämpel `⌧ ... saknas`, `klimateArchetype`→tint ur `clubExtendedInfo`). Spec: `docs/mockups/BESTALLNINGSBRIEF-MILJOHEADER-2026-06-07.md` (bygg-spec-sektionen). Bilden droppas in sen; lagret byggs nu.
2. **Maskin-audit-expansionen** — spec: `docs/MASKINELL-AUDIT-EXPANSION-2026-06-07.md`. Utöka `/dev/scenes` så ALLA svep-ytor renderar isolerat headless (fast seed); bygg svepet (DB-3/8/Q2/Q4/IllustrationScene-inkoppling/glow-passet); producera `◉ syn`-screenshots i en samlad bilaga; seeda Playwright-baselines; snapshot-steg i app-ci.

Resultat: svepet byggs och renderas, Jacob godkänner en **screenshot-bilaga** (engång per yta), inte en live-session. Live-spel reserveras för det enda ett öga över tid måste avgöra: *känsla* (landar Q4-tystnaden, är det kul, svårighetskurva) — inte pixel.

A3 match-laddning: spec + text klara (`DESIGN-BRIEF-MATCH-LADDNING` + `src/domain/data/matchLaddningText.ts`), byggs efter svepet.

— Opus, 2026-06-07
