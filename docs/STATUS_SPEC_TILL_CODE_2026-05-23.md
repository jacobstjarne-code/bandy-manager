# STATUS — allt specat material → Code (2026-05-23)

**Av:** Opus. **Syfte:** Svara ärligt på "är allt specat och redo, inget
parkerat, inget glömt?" Verifierat mot dokument + kod, inte mot minnet.

**Kort svar:** Nästan. Allt Design levererat är genomgånget och har nu en
Code-ingång eller väntar på ett namngivet beroende. EN blockerare var
feldiagnostiserad (guld — se §D). Inget är tyst parkerat; det som väntar väntar
på något konkret (score-primitiver, dina Q-svar, eller speldesign-beslut).

---

## A · HAR CODE-UPPDRAG NU (byggbart)

| Spår | Dokument | Status |
|---|---|---|
| Score-system steg 1–4 | `CODE_UPPDRAG_SCORE_SYSTEM_2026-05-22.md` | **Code har börjat** — `score-primitives.css` finns redan i src |
| Slutspels-buggar, simulera, UI-skip | `CODE_UPPDRAG_2026-05-22.md` | Redo |
| R1 fatigue | `CODE_UPPDRAG_R1_FATIGUE_2026-05-23.md` | Specad, BLOCKERAD tills score steg 3 (Sparkline) |

---

## B · SPECAT AV DESIGN — behöver Code-plan från Opus (väntar på score-primitiver)

Alla fyra Design-handoffs från 2026-05-23 är lästa och genomgångna. Tre av fyra
är **beroende av score-primitiverna** (ScoreBlock/Sparkline) — kan inte byggas
före score steg 1–3. Det binder ihop hela leveransen i en sekvens:

| Spår | Handoff | Beroende | Öppna Q till Jacob |
|---|---|---|---|
| C-SD1 koreografi | `HANDOFF-C-SD1-KOREOGRAFI` | Inget (ren arkitektur) — **kan byggas NU** | Q låsta (Q1-Q4 besvarade i handoff) |
| C-SY1 #1 Efterklang | `HANDOFF-C-SY1-EFTERKLANG` | Score (ScoreBlock + Sparkline) | Q1 (3 minnen rätt mängd?), Q2 (egen tier/secondary?) |
| C-SY1 #4 Manager-kvitto | `HANDOFF-C-SY1-MANAGER-KVITTO` | Inget tungt (choice-logg finns) | Q1 (alla val/bara mätbara?), Q2 (outcome-text Opus/LLM?), Q3 (max 4 rader?) |
| C-FT1 (a) synlighet | `HANDOFF-C-FT1-TROTTHETS-SYNLIGHET` | Score (mini-sparkline) | Q1 (mini-bar/stapel?), Q2 (banner-tröskel?), Q3 (siffra/färg?) |

**C-SD1 är den enda som kan byggas direkt** — den är ren arkitektur
(`getSeasonEndPhase()` + gateway-checks), inget score-beroende, och dess Q är
redan låsta av Design. Den löser tre buggar (sommaren-före-slutspel,
halvvägs-dubblering, granska-CTA C-SP1) med en helper istället för tre fixar.
**Rekommendation: C-SD1 får en Code-plan näst — den blockeras inte av något.**

De tre score-beroende (Efterklang, Manager-kvitto, FT1-synlighet) får Code-planer
EFTER score steg 1–3, och var och en har öppna Q som behöver dina svar först.

---

## C · MANAGER + SKADE — Q låsta, väntar Code-plan

Design uppdaterade handoffsen v2/v3 med Q-besluten du skickade. Manager (#4) och
Skade (#5) har nu låsta Q men ingen Code-plan ännu. De är STORA (10.5h + 8.5h)
och båda score-beroende (burnout-sparkline, skade-timeline-sparkline). Code-plan
när score-primitiverna står + du sagt att de ska prioriteras.

**OBS dubbletter:** `HANDOFF-MANAGER-KARAKTAR (kopia).md`, `-R1- (kopia).md`,
`-SKADE- (kopia).md` ligger i mockups. Troligen från filflytt. Jag raderar inte
(prohibited utan din bekräftelse) — men de bör bort så Code inte läser fel
version. Säg till, eller ta dem själv.

---

## D · GULD — LÖST AV DESIGNS RESTERANDE-TICKETS-PAKET (uppdaterad 2026-05-23)

**Uppdatering:** Designs `HANDOFF-RESTERANDE-TICKETS-2026-05-23.md` §3 har nu
RÄTT formulering — den bekräftar mitt fynd. Guld-statusen är inte längre en
öppen feldiagnos:

1. **Gold-tokens:** Design skriver nu korrekt att tokens "lever som inline-
   fallbacks i stalvallen-portal.css" och att fixen är att lägga dem i
   `design-system/colors_and_type.css` OCKSÅ. Det är SYNK-frågan jag misstänkte:
   tokens finns i `global.css` (verifierat) men saknas i design-system-CSS:en
   som R3+ baseras på. Fix: ~5 min, lägg `--gold-deep` + `--shadow-gold` i
   colors_and_type.css. Behåll fallbacks. INTE en blockerare (fallbacks räddar).

2. **SMFinalPrimary:** Design säger komponenten använder `var(--match-gold)`.
   Delvis fel mekanism — jag LÄSTE komponenten, den använder
   `className="primary-weight-3"` (= korrekt `--gold` via CSS), och `--match-gold`
   jag hittade var i en KOMMENTAR. Men Designs ÅTGÄRD är rätt: säkerställ
   `primary-weight-3`, rensa vilseledande `--match-gold`-referens i kommentaren.
   ~1h (egentligen mindre — komponenten renderar redan rätt). Ofarlig.

**Slutsats:** guld är inte en R3+-blockerare. Två små hygien-fixar (token-synk +
kommentar-rensning) kvarstår, bägge i audit-fix-paketet med rätt prioritet.
Kvar som separat fråga: ska `--match-gold` (#D4B860, NextMatchCard) konsolideras
in i `--gold`-familjen (#E8B95C)? Det är D-ST1-närliggande token-arkitektur.

### Ursprunglig kod-verifikation (kvar för spårbarhet):
Design flaggade två röda blockerare. **Båda stämmer inte mot koden:**

1. **"`--gold-deep` + `--shadow-gold` saknas i tokens (R3+ blockerad)"** — FEL.
   Båda finns i `global.css` (rad ~141): `--gold-deep: #B88838`,
   `--shadow-gold: 0 3px 12px rgba(232,185,92,0.32)`. De ANVÄNDS dessutom korrekt
   i `stalvallen-portal.css` `.btn-gold` med fallback (`var(--gold-deep, #B88838)`).
   R3+ är inte blockerad av saknade tokens.

2. **"SMFinalPrimary använder fel guld"** — FEL i orsak. Komponenten använder
   `className="primary-weight-3"`, som i `stalvallen-portal.css` är
   `rgba(232,185,92)` = `--gold` (#E8B95C). Det är RÄTT guld. Komponenten
   renderar korrekt.

**Den ÄKTA observationen bakom blockeraren:** SMFinalPrimary har en
mock-KOMMENTAR högst upp som refererar `rgba(212,164,96,0.20)` (= `--match-gold`
#D4A850, NextMatchCard-paletten) — ett ANNAT guld än det komponenten faktiskt
använder. Det är en dokumentations-inkonsekvens, inte en render-bugg. Två
guldsystem lever sida vid sida i kodbasen: `--gold`/`--gold-deep` (det riktiga)
och `--match-gold` (NextMatchCard). Mock-kommentaren ljuger om vilket som
används.

**Verklig åtgärd (liten, ej blockerande):** rensa mock-kommentaren i
`SMFinalPrimary.tsx` så den refererar `--gold`/`primary-weight-3`, inte
`--match-gold`. Och ett designsystem-beslut värt att ta: ska `--match-gold`
konsolideras in i `--gold`-familjen, eller är NextMatchCard-guldet medvetet eget?
Det är D-ST1-närliggande (token-arkitektur). INTE en R3+-blockerare.

---

## E · GENUINT OSPECAT / VÄNTAR (inget av detta är glömt — det väntar på något namngivet)

**Uppdaterad 2026-05-23 efter Designs restlista-leverans.** Det mesta av det som
stod här har nu handoffs:

| Punkt | Status efter 2026-05-23 |
|---|---|
| C-K1 landslagsuttagning | ✅ SPECAD — `HANDOFF-C-K1-LANDSLAG` + mock. 4 öppna Q (VM/EM-år, lobby, ekonomi-bonus, visa hela truppen). ~6h Code. Score-oberoende men använder PhaseMark-anatomi. |
| D-ST1 seasonalTone | ✅ SPECAD — `HANDOFF-RESTERANDE-TICKETS` §1. ~1h, dokumentation + tokens i colors_and_type.css. Inget runtime ändras. |
| C-SP5 SM-final-skarv | ✅ SPECAD — `HANDOFF-RESTERANDE-TICKETS` §2. ~1h crossfade. Code lokaliserar exakt skarv. |
| Audit-fix-paket (guld, klubbminne, transfers) | ✅ SPECAD — `HANDOFF-RESTERANDE-TICKETS` §3. ~10h spridda, prioritetsordning given. |
| **C-N1 NU-fliken** | ⚠️ **PÅSTÅDD LEVERERAD MEN SAKNAS.** Designs statusrad säger "C-N1 ✅ mock + handoff" — men ingen C-N1-handoff och ingen NU-flik-mock finns i `docs/` eller `docs/mockups/`. Verifierat med sökning. Antingen sparad på fel plats, ej sparad, eller felaktig statusrad. **Be Design bekräfta/leverera.** |
| C-FT1 (b) symmetri + (c) balans | Speldesign — du/Erik. Mät-data finns. Ej Design, ej Code än. |
| Manager/Skade Code-planer | Score-primitiver + din prioritering |
| Score audit våg 2–4 (17 ytor) | Score steg 1–4 klara (CODE_UPPDRAG_SCORE §F) |

---

## F · SAMMANFATTNING — svaret på frågan

**Inget tyst parkerat. Inget glömt.** Men "allt redo för Code" är inte sant —
det korrekta är:

- **Byggbart nu:** score (pågår), buggar/simulera, **C-SD1** (ren arkitektur, Q
  låsta — bör få Code-plan näst).
- **Väntar på score-primitiver:** R1, Efterklang, Manager-kvitto, FT1-synlighet,
  Manager, Skade. Sekventiellt, inte parkerat.
- **Väntar på dina Q-svar:** Efterklang (2 Q), Manager-kvitto (3 Q),
  FT1-synlighet (3 Q). Behövs innan deras Code-planer skrivs.
- **Väntar på speldesign (du/Erik):** C-FT1 (b)+(c).
- **Guld-blockeraren:** avförd som blockerare — feldiagnos. Liten kommentar-fix
  + ett token-konsolideringsbeslut kvarstår, men inget blockerar R3+.

**Nästa konkreta Opus-steg (om du vill):** (1) Code-plan för C-SD1 — den är
redo. (2) Samla de 8 öppna Q från Efterklang/Manager-kvitto/FT1 i en
beslutslista till dig, så de score-beroende planerna kan skrivas så fort score
står. (3) Rätta guld-kommentaren i SMFinalPrimary.

— Opus, 2026-05-23
