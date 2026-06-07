# KOMPLETT ÖVERLÄMNING — Design → Code, juni 2026

**Från:** Design-Claude · **Datum:** 2026-06-07 · **Till:** Code + Jacob
**Status:** Allt designarbete maj–juni 2026 samlat och verifierbart. Inga öppna designbeslut blockerar.

---

## De fyra dokumenten (läs i ordning)

1. **`CODE-OVERLAMNING-DESIGNPAKET-2026-06-05.md`** — VAD som ska byggas, i tre delar (mekanik → illustration → features) + beroendekarta.
2. **`FIDELITY-CHECKLISTA-2026-06-07.md`** — HUR vi vet att det blev rätt. Grep- + screenshot-villkor per beslut.
3. **`2026-06-07_design_implementations_referens.html`** — EXAKTA värden renderade. Sanningskälla för pixlar.
4. **`mockups/index.html`** — alla 27 mockar grupperade, klickbara.

Tillsammans: prosa (vad) → checklista (bevis) → referens (exakta tal) → galleri (helheten).

---

## Arbetsmodellen — så blir mock till verklighet

```
SANNINGSKÄLLA          referens-mock + tokens i CSS (samma tal båda håll)
      ↓
KONTRAKT               CODE-OVERLAMNING (vad) + handoffs (per spår)
      ↓
BYGGE                  Code implementerar block
      ↓
BEVIS                  FIDELITY-CHECKLISTA: ▣ grep (maskin) + ◉ syn (Design)
      ↓
STÄNGNING              block klart först när checklistan är grön
```

**Nyckelprincip:** besluten lever som **kod-artefakter**, inte prosa. När referens-mocken säger `--radius-md: 8px` och koden använder samma token kan de aldrig glida isär. Drift uppstår bara när Code tolkar text — så minimera text, maximera tokens/klasser.

---

## Byggordning (från beroendekartan)

1. **Score-system** (ScoreBlock + Sparkline) — primitiver som DB-3/Q1 vilar på
2. **DB-1 alpha-system** (color-mix) — master, låser upp all rgba-städning
3. **DB-2…9 + R2 + Q1–3** — resten av mekaniken (parallelliserbart efter DB-1)
4. **IllustrationScene** + placeholders — komponent klar, bilder droppas efterhand
5. **Feature-spår** — parallellt, egna handoffs-acceptans

---

## Verifierings-rytm (per block)

- Code bockar `▣ grep` + `□` själv, levererar screenshots för `◉ syn`-raderna.
- Design kör pixel-audit mot mock, sätter ✅/⚠️ per `◉`.
- `⚑`-flaggor (glow-shadows, token-spegel-synk) → Design-beslut innan stängning.
- Block stängs först när alla `▣` + `◉` gröna. Aldrig "klart på känsla".

Vi körde redan en runda av detta (Code byggde Tier 1 → jag granskade → tre avvikelser → svar i `HANDOFF-PIXEL-AUDIT-SVAR-2026-05-31`). Mekanismen fungerar — checklistan formaliserar den.

---

## Illustrationer — status

- **Tre finns:** intro, annandagen, final i `public/assets/illustrations/`.
- **Fem beställda:** nyarsbandy, varsol, kafferummet, derby, nedflyttning (`BESTALLNINGSBRIEFER-ILLUSTRATIONER-2026-06-05.md`).
- **Code bygger nu med placeholders** — när en bild droppas i mappen byts platshållaren automatiskt, ingen layout hoppar.
- Konstant: finalen alltid Uppsala; ceremoni-bilder alltid ljusa.

---

## Vad som INTE är Design-bord (för tydlighet)

- Mekanisk token-/klass-städning i koden = Code utför, Design verifierar.
- C-FT1 (b) symmetri + (c) balans = speldesign, Jacob.
- Implementations-prioritering inom en sprint = Code + Jacob.

Allt designat är levererat eller medvetet parkerat. Nästa steg ligger hos Code (bygge) och Jacob (playtest) — Design verifierar per checklista när block landar.

— Design-Claude, 2026-06-07
