# Handoff · Portal secondary cards + Stålvallens scoreboard

Två komponenter, två kontexter, samma designspråk. Detta dokument är för Code att implementera mot bandy-manager-koden.

**Mockfiler att jämföra mot:**
- `preview/portal-secondary-cards.html` — tre Portal-secondary-cards
- `preview/scoreboard-stalvallen.html` — matchvy-scoreboard (mekanisk + digital lager)

---

## DEL A · Portal secondary cards

Tre nya kort i Portal-vyn, alla under sektionen *"Pågående narrativ"* / *"Veckans fråga"* / *"Styrelsens kontrakt"*. De är **secondary** — mindre än hero-card, ligger på `--bg-portal-surface` med 1 px border.

### Gemensam anatomi

```css
.card {
  position: relative;
  background: var(--bg-portal-surface);
  border: 1px solid rgba(196, 122, 58, 0.15);
  border-radius: var(--radius-md);
  padding: 14px 16px 14px 18px;
  overflow: hidden;
  cursor: pointer;
}
.card:hover {
  background: var(--bg-portal-elevated);
  border-color: rgba(196, 122, 58, 0.3);
}
.card::before {
  content: '';
  position: absolute; left: 0; top: 0; bottom: 0;
  width: 2px;            /* 2px = innehåll */
  background: var(--accent);
}
.card.relations::before {
  width: 3px;            /* 3px = relations/persona */
  background: var(--warm);
}
```

**Stripe-system (bär hierarki):**
- **2 px `--accent`** = innehållstyp (Veckans beslut, I blickfånget, Styrelsens krav)
- **3 px `--warm`** = relations/persona (Veckans supporterfråga, Klacken, Kafferum-preview)
- **0.5 px** = inre avdelare mellan rader

**Card-label (övre raden):**
```
🎯  STYRELSENS KRAV          ›
[emoji] [9px, letter-spacing 2px, uppercase, accent 0.85]   [chevron, muted]
```

---

### A1 · WeeklyDecisionSecondary

**Komponent:** `<WeeklyDecisionSecondary />`

**Innehåll:**
- card-label: `📋 Veckans beslut`
- fråga (italic Georgia, 14 px, line-height 1.5): *"Klacken vill starta ett 50/50-lotteri på matcherna. Leif har redan pratat med Konsum."*
- 2 val-knappar i rad, **identisk styling** tills klick:
  - Solid `--accent` background → `selected`
  - Effekt-text under varje val (10 px, italic, muted): *"Klacken +, kassa +0.5 tkr/match"* / *"Inget händer den här veckan"*

**Knappstyling (kritisk):**
```css
.wd-option {
  flex: 1;
  background: transparent;
  border: 1px solid rgba(196,122,58,0.4);
  /* ingen falsk default-känsla — båda val är likvärdiga */
}
.wd-option.selected {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
```

**Aldrig:** solid + transparent som default-states. Det skapar visuell hierarki som inte finns i logiken.

---

### A2 · ActiveArcsSecondary

**Komponent:** `<ActiveArcsSecondary />`

**Innehåll:**
- card-label: `📖 I blickfånget` (inte "Pågående berättelser" — för meta-jargong)
- 1–3 arc-rader, vardera:
  - **arc-emoji** (18 px): ⭐ veteran/karriär · 🎯 form/prestation · 🃏 mystery/joker · 💔 skada/relation
  - **arc-headline** (12 px, semibold): *"L. Berg — sista säsongen"* (kortform, namn + situation)
  - **phase-dots** (3 prickar, 5 px): done/active/upcoming
  - **arc-meta** (10 px, muted): *"3 omgångar kvar"* / *"Fönstret krymper"* / *"Kommer den här veckan?"*

**Tonalitet:** Sture-Forsbacka-diction. *Aldrig* "ÖDESMÄTT FINAL!", *aldrig* "DRAMATIK" — bandy är lokalt, småstad-Sverige. Korta meningar, ellipsis tillåtet, understatement.

**Phase-dots:**
```css
.phase-dot                { background: rgba(196,122,58,0.3); }     /* upcoming */
.phase-dot.active         { background: var(--accent); }
.phase-dot.done           { background: var(--accent-deep); }
```

Klick på rad → öppnar arc-detalj eller spelarkort.

---

### A3 · BoardObjectivesSecondary

**Komponent:** `<BoardObjectivesSecondary />`

**Innehåll:**
- card-label: `🎯 Styrelsens krav` (inte "Styrelsens uppdrag" — för formellt)
- 3 mål-rader, vardera:
  - **status-icon** (14 px): 📌 pågår · ⚠️ varning · ❌ riskerar · ✅ klart
  - **obj-label** (12 px, semibold): *"Ta er till slutspel"*
  - **obj-owner** (9 px, uppercase, letter-spacing 1.5 px, muted): *"PELLE"* — ägare av målet
  - **EITHER progress-bar EITHER pengar-rad:**
    - Progress: 3 px hög, fill i `--accent` / `.danger` / `.success` beroende på status
    - Pengar: *"+120 tkr"* (display 13 px, semibold) + delta i italic muted: *"av mål +200 tkr"*

**Layout-detalj:** label + owner är `space-between`, progress/money tar full bredd undertill.

---

### Datakontrakt (alla tre)

```ts
type WeeklyDecision = {
  id: string;
  question: string;       // italic Georgia, max ~110 tecken
  options: [
    { label: string; effect: string; selected?: boolean },
    { label: string; effect: string; selected?: boolean },
  ];
  variant?: 'content' | 'relations';   // styr stripe (2px accent / 3px warm)
};

type ActiveArc = {
  id: string;
  emoji: '⭐' | '🎯' | '🃏' | '💔';
  headline: string;       // "L. Berg — sista säsongen"
  phase: 1 | 2 | 3;       // active-prick
  meta: string;           // "3 omgångar kvar"
};

type BoardObjective = {
  id: string;
  status: '📌' | '⚠️' | '❌' | '✅';
  label: string;
  owner: 'Pelle' | 'Margareta' | 'Kerstin' | 'Leif';
  display:
    | { kind: 'progress'; pct: number; tone?: 'default' | 'danger' | 'success' }
    | { kind: 'money'; current: string; goal: string };
};
```

---

## DEL B · Stålvallens scoreboard

**Komponent:** `<MatchScoreboard />` på matchvy.

Detta är inte en re-skin av befintlig scoreboard. Det är en **modulär konstruktion av tre paneler bredvid varandra**, byggd på en tvålagrad designidé:

- **Lager 1 (mekanisk sanning)** — röda 7-segment LED som finns på arenan, översatt rent. Score, tid, lag-koder.
- **Lager 2 (digital dimension)** — en tunn tidslinje under huvudraden. *Inte* en LED-imitation utan en GRAF: minuterna som horisont, mål som lodräta streck, utvisningar som grå luckor, NU som pulserande punkt. Den finns inte på arenan — den får bara finnas i appen.

### Tre moduler i rad

```
┌────────────────────────────────────────────────────────────┐
│ MODUL 1: HUVUDTAVLAN          (mekanisk översättning)      │
│   STÅL  3  ·  2  IFK                                       │
│   ─────────────────────                                    │
│         74:32 · 2 HL                                       │
├────────────────────────────────────────────────────────────┤
│ MODUL 2: TEXTREMSAN           (operatörens röst)           │
│   ◀ 71′ MÅL · L. BERG (Sundström) ▶                        │
├────────────────────────────────────────────────────────────┤
│ MODUL 3: TIDSLINJEN           (digital dimension)          │
│   |·····|··●··|·····|·····|·····|··|··|··|··|··|           │
│   0     20   40    60    74↑   80              90          │
│                       (NU)                                 │
└────────────────────────────────────────────────────────────┘
```

### Designprinciper (icke-förhandlingsbara)

1. **Asymmetri tillåten.** Westerstrand-tavlor är inte symmetriska — de är moduler bredvid varandra. Inte tvinga in symmetri-besatthet.
2. **Inga kostym-detaljer.** Förbjudet: skruvar, gulnat hörn, flimrande lampa, "WESTERSTRAND · 1974"-etikett. Det blir LARP, inte design.
3. **Röda 7-segment är det enda dot-typsnittet.** Inte blandning av färger på siffrorna. Operatören-rösten i textremsan är dot-matrix grön/orange (eget lager).
4. **Ingen permanent utvisningssektion.** Utvisningar lever i tidslinjen som grå luckor. Det håller huvudtavlan ren och låter tidslinjen göra jobbet den finns för.
5. **När mål görs → halvsekundens tystnad innan siffran ändras.** Operatör-känsla. Score-flip-animation: scale(1.0) → 1.08 → 1.0 över 400 ms, med liten röd glow-pulse.

### Färg- & ljus-tokens

```css
--led-red:       #FF2A18;
--led-red-dim:   rgba(255, 42, 24, 0.07);   /* "släckta" segment */
--led-red-glow:  rgba(255, 42, 24, 0.55);   /* glow på pulserande element */

--bezel-top:     #3a3632;   /* ramen — ljusare ovan */
--bezel-mid:     #2a2622;
--bezel-bot:     #15130f;   /* mörkare under, gravity */
--panel:         #0A0908;   /* själva LED-ytan */

/* Tidslinje */
--line-bg:       rgba(255, 255, 255, 0.04);
--line-stroke:   rgba(255, 255, 255, 0.12);
--home-mark:     #C47A3A;   /* hemmalagets mål */
--away-mark:     #6B7F8E;   /* bortalagets mål */
--now-mark:      #FFB347;   /* NU-position, pulserande */
```

### Modul 1 · Huvudtavlan

7-segment LED-glyfer, byggda som SVG-symboler (en `<symbol id="d0">` … `<symbol id="d9">`-uppsättning). Använd `<use>` för rendering. **Använd inte font-baserade 7-segment-fonter** — vi behöver per-segment-färgning för "släckta" segment-illusionen.

**Score-glyf:** 36 px hög, 2 dot bredd, varje segment med dim-tillstånd så även "släckta" segment visar svagt rött (`--led-red-dim`).

**Tid-glyf:** 22 px hög (mindre än score), kolon-prick blinkar 1 Hz när matchen är live.

**Lag-koder:** 9 px monospace, letter-spacing 3 px, "STÅL" / "IFK" — uppercase 4 bokstäver max. Subtil text-shadow `0 0 4px rgba(255,80,60,0.2)` för glow.

### Modul 2 · Textremsan

26 px hög rad. Svart bakgrund (#07060a), dot-matrix textur via radial-gradient. Texten rullar höger→vänster, **5 sekunder per fullt varv på 320 px bredd**, paus 800 ms vid byte.

Format: `◀  71′  MÅL · L. BERG (Sundström)  ▶`
- Tid: gul/orange dot-matrix
- Händelseord (MÅL/UTV/FRISLAG): röd, uppercase
- Spelarnamn + assist: vit/cream

Detta är **operatörens röst**, inte spelets data. Den får ha personlighet (*"FÖRSTA MÅLET LJUST FÖR HEMMALAGET"*).

### Modul 3 · Tidslinjen

Höjd 28 px. Horisontell linje från 0 till 90 (eller match-längd). Tickmark var 10:e minut.

- **Mål** = 8 px hög lodrät linje, 1.5 px bred, hemmalag uppåt från linjen, bortalag nedåt
- **Utvisningar** = grå luckor (rektanglar) på spelarens sida, längd = utvisnings-varaktighet
- **NU-position** = 6 px gul prick som pulserar (1 Hz, opacity 0.6 → 1.0)
- **Periodavbrott** = vertikal streckad linje vid 45'

Klick på en mål-markering → toast med målskytt + assist + tid. Klick på utvisning → spelarinfo + återkomst-tid.

### Live-states

```ts
type ScoreboardState =
  | { kind: 'pre'; kickoff: Date }      // mörk panel, "AVSPARK 19:00"
  | { kind: 'live'; minute: number }    // alla tre moduler aktiva
  | { kind: 'half'; }                   // tid pulsar inte, textremsa: "PAUS"
  | { kind: 'full'; }                   // tid stannad, textremsa: "SLUT"
```

---

## Implementationsordning (rekommenderat)

1. **Portal secondary cards** först — mindre, isolerade, lätt att verifiera mot mock
   - A1 WeeklyDecisionSecondary (1–2 h)
   - A2 ActiveArcsSecondary (1 h)
   - A3 BoardObjectivesSecondary (1–2 h)
2. **Scoreboard** sen — större, behöver matchvy som värd
   - 7-segment SVG-symbols + `<DigitDisplay>` primitive (3–4 h)
   - Modul 1 huvudtavla (2 h)
   - Modul 2 textremsa (1–2 h)
   - Modul 3 tidslinje (3–4 h)
   - State-overgångar + score-flip-animation (1–2 h)

**Totalt ~16–22 h.**

---

## Acceptanskriterier

### Portal cards
- [ ] Stripe-system korrekt: 2 px accent (innehåll) eller 3 px warm (relations)
- [ ] WeeklyDecision: båda knappar identiska tills klick (ingen falsk default)
- [ ] ActiveArcs: phase-dots done/active/upcoming visar rätt
- [ ] BoardObjectives: status-icon + ägare + (progress eller money) växlar via display.kind
- [ ] Hover på kort höjer bg till `--bg-portal-elevated` + border 0.3
- [ ] Chevron i övre högra hörnet på alla tre

### Scoreboard
- [ ] 7-segment är SVG-symbols, inte font — per-segment-färg fungerar
- [ ] Släckta segment visar svagt rött (`--led-red-dim`), inte helsvart
- [ ] Mål-flip: scale-pulse + glow + 500 ms paus innan siffran byts
- [ ] Tidslinje: hemmamål uppåt, bortamål nedåt, utvisningar som grå luckor
- [ ] NU-prick pulserar 1 Hz när live
- [ ] Inga skruvar, ingen "WESTERSTRAND 1974"-etikett, ingen kostym
- [ ] Vid mobilbredd: tre moduler staplade, inte hopträngda i rad
