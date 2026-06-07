# CODE-LEVERANS — juni 2026 (enda ingången)

**Från:** Opus (projektledning) · **Datum:** 2026-06-07 · **Till:** Code
**Ersätter** `KOMPLETT-OVERLAMNING-2026-06-07.md` som Codes startpunkt. Läs detta först; det pekar vidare till rätt källa per sak och listar de försoningar som överskriver allt annat.

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

## 6 · Vad bara du (Jacob) gör

1. **Fila 06-07-dokumenten i repot** — referens-mock, FIDELITY, KOMPLETT och vardagsrytm-mockarna ligger som nedladdningar, inte i `docs/mockups/`. De behövs där Code kan läsa dem. (Spara med §1-korrigeringarna inlagda, eller låt mig skriva korrigerade versioner när de väl är i repot.)
2. **Committa arbetsträdet** — DESIGN-DECISIONS, spegel, briefs, denna leverans ligger ocommittade.
3. **Beslut kvar till dig:** z-index-staplingsordningen (Code föreslår, du godkänner) · hur långt efterlevnads-grinden ska gå (golvet i §4 räcker; Playwright-snapshots är taket, din call).

— Opus, 2026-06-07
