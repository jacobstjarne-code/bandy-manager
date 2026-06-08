# SPEC — Spak A + Spak B (bygg-klar)

**Från:** Opus · **Datum:** 2026-06-08 · **Till:** Code
**Auktorisation:** Jacob godkände `postBreakUrgency`-wiringen 2026-06-08 (motortouch för Spak A). Den var den enda öppna frågan; resten var redan klart.
**Källor:** denna spec + `src/domain/data/matchLiveText.ts` (all spelartext) + mockarna `2026-06-07_design_match_modaler.html` (Spak A/HalftimeModal) och `2026-06-07_design_matchlive_helhet.html` (Spak B/feed-kort + bar i stacken). §2 i `DESIGN-BRIEF-MOTORKANSLA` är hård och går före allt här.

**Hård regel, hela vägen:** ingen spelarvänd svensk sträng inline i komponenterna. Allt importeras ur `matchLiveText.ts`. Behöver du en sträng som inte finns där — be Opus, skriv den inte själv.

---

## A · Spak A — HalftimeModal: paussnack + preview + mörk panel

Tre saker i en yta (de hör ihop, bygg dem tillsammans):

### A1 · Motortouch (matchCore — auktoriserad, bounded)
Pausvalet ska modulera `postBreakUrgency` — den variabel baren visar i 2H — så previewn blir ärlig. **Additivt till** den befintliga morale/sharpness-deltan (behåll den; den var den osynliga delen — det här är den synliga).

Varje `PepOption` i `matchLiveText.ts` bär ett `lean`:
- `'push'` (ni jagar och tänder): multiplicera **ert eget** `postBreakUrgency` med en bounded faktor > 1.
- `'calm'` (ni leder och håller): multiplicera **motståndarens** `postBreakUrgency` med en bounded faktor < 1.
- `'hold'`: ingen modulering (×1.0).

Gränser (icke förhandlingsbart): **klampa så det lutar, aldrig vänder.** Storleken (förslag ±20–25 %) är din kalibrerings-bedömning mot 1100-matchsviten — målet är att en jagande spelares comeback-frekvens rör sig mot verkliga ~13 % **utan overshoot**. Constraint:en är bounded + att riktningen matchar `lean`; exakt faktor och kodställe är ditt (du sa line 918–925, före `simulateSecondHalf`).

**Ärlighetskravet (§2, hårt):** samma uträknade faktor driver BÅDE previewn (före avspark) och den faktiska 2H-baren. Räkna en gång, visa i preview, applicera i sim. Preview och utfall får aldrig divergera — det är hela poängen med att den får finnas.

### A2 · Preview (`.prev`)
- `.prev-fill` / `.prev-arrow` visar nålens **förväntade** läge givet vald `lean`:s faktor. Riktning + grov magnitud — aldrig ett resultat, aldrig en siffra.
- Etikett = `PAUSSNACK_PREVIEW_LABEL`.
- **Ingen variabel-tag i UI.** Mockens `.prev-v` ("modulerar postBreakUrgency") är en dev-annotering — den stannar i mocken. Visa på sin höjd en ren reassurance utan motornamn, eller inget alls. Spelaren ser luten, inte `postBreakUrgency`.

### A3 · Copy + lägesval
- Eyebrow: `PAUSSNACK_EYEBROW[situation]`.
- Alternativ: `PAUSSNACK[situation]` — `.pep-t` = `line`, `.pep-e` = `effect`. Index 0 är default-markerat.
- `situation`: `'behind' | 'level' | 'leading'` ur managed-lagets halvtidsställning (mål-diff < 0 / = 0 / > 0).

### A4 · Mörk panel (🟧, audit)
HalftimeModal från ljust `--bg` → mörk LED-panel per modaler-mocken: tabbar (ÖVERSIKT/TAKTIK/BYTEN) i mono, LED-score i topp, `.ht-analysis`/`.ht-best` behålls. Mekanik och flöde orört — språkbyte + A1–A3 är det enda funktionella tillägget.

---

## B · Spak B — sent matchningsval (feed-kort)

### B1 · Yta + gate
Ett **kort överst i commentary-feeden** (helhet-mock state 3) — inte modal, inte ny skärm. Tänds bara **sent i jämnt läge** (lateFactor stiger + mål-diff inom snäv marginal). Resolvar och lämnar feeden efter val (eller efter N ticks om spelaren inte rör det).

### B2 · Mekanik (återanvänd befintligt — ingen ny matchCore-variabel om det går)
Valet applicerar en sen hållning via den **befintliga mentality/tacticModifier-vägen** för återstoden:
- `'Gå på'` → anfallshållning: ↑ er sena anfallsvikt → ↑ målchans **och** ↑ exponering (risk). Ärligt åt båda håll.
- `'Stäng igen'` → defensiv hållning: ↓ sen varians åt båda håll.

Det här ska inte behöva en ny motorvariabel — mentality ger redan anfalls/försvarsvikt motorn omsätter. Bekräfta mot `tacticModifiers`; **om** det visar sig kräva en matchCore-touch, stanna och flagga (jag tror den befintliga vägen räcker).

### B3 · Amber taktik-glow
När Spak B är tänd får taktik-knappen i controls amber-glow (mock + brief §3: taktikskifte ÄR det svaga handtaget sent). Ärligt — bekräfta att det är OK att lägga vikt på den annars passiva knappen.

### B4 · Copy
`SENT_VAL`: `eyebrow` ({minut} interpoleras), `question`, `push`/`shut` ({title, effect}), `gate`. Ingen variabel-tag i gaten — den lyder "Tänds bara sent i jämna lägen", inte "när lateFactor stiger".

---

## C · MomentumBar — brytpunkter
Importera `BRYTPUNKT` ({lag} interpoleras): `postPaus`, `kvittering`, `sent`. Byt ut den inline:ade mock-texten du shippade — särskilt `kvittering`, som inte fanns i helhet-mockens states (nålen rycker till målskytten och **stannar**, ingen 50/50-reset). **Ingen variabel-tag** i shippad bar — mockens `.mb-bp-v` ("speglar postBreakUrgency") är dev-annotering.

---

## D · §2 — hårda linjen (gäller A–C)
1. Preview och etiketter lovar **riktning + grov magnitud, aldrig utfall.**
2. Preview och faktiskt utfall speglar **samma uträknade variabel** — räkna en gång, visa och applicera samma.
3. Variabelnamn (`postBreakUrgency`, `lateFactor`) är dev/mock-annoteringar — **aldrig** i spelarens UI.
4. Kan en etikett inte knytas till en verklig variabel: **stanna och flagga.** Skicka aldrig en dekorativ version.

---

## E · Ordning + pixelpass
1. Spak A (A1 motortouch → A2 preview → A3 copy → A4 mörk panel).
2. Spak B (B1 gate → B2 hållning → B3 glow → B4 copy).
3. **Sedan** hela pixelpasset över MatchLive-stacken (bar + modaler + Spak B) mot de två mockarna, sida vid sida — sist, över allt (briefens ordning). Egna dev-scener för bar/modaler/Spak B-läget så de fångas i bilagan, egen signoff.

Håll bygget grönt. Motortouchen kräver att 1078-sviten står grön + en kalibreringskoll att comeback-frekvensen rör sig mot 13 % utan overshoot. Rör inte `stash@{0}`.

— Opus, 2026-06-08
