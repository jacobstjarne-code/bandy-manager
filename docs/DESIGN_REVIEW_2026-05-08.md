# Design-leverans 2026-05-08 — kritisk granskning

**Granskare:** Opus  
**Granskat:** `HANDOFF-PORTAL-SECONDARY-AND-SCOREBOARD.md` + `2026-05-08_design_portal-secondary-cards.html` + `2026-05-08_design_scoreboard-stalvallen.html`  
**Mot:** befintlig kod i `src/presentation/components/portal/secondary/`, `src/presentation/screens/MatchScreen.tsx` med flera, `design-system/colors_and_type.css`, `design-system/DESIGN-DECISIONS.md`.

**Syfte:** identifiera konflikter mellan leverans och existerande kod/designsystem innan Code-instruktion skickas. Inte bedöma designens kvalitet — bara konflikt-yta.

---

## Stora fynd

### 1. HANDOVER beskriver redan-byggda komponenter som "nya" — kritiskt

De tre Portal-secondary-komponenterna **finns redan i kod**:

- `src/presentation/components/portal/secondary/WeeklyDecisionSecondary.tsx` — commit `3b06ce6`
- `src/presentation/components/portal/secondary/ActiveArcsSecondary.tsx` — commit `ad43cce`
- `src/presentation/components/portal/secondary/BoardObjectivesSecondary.tsx` — commit `ad43cce`

Alla tre på 🟠 i `INLASTA_SYSTEM.md`-tracker, registrerade som "implementation klar, väntar playtest". Margareta-replik-tonalitet uppdaterades så sent som commit `35d6a44` (2026-05-08).

HANDOVER's första rad: *"Tre nya kort i Portal-vyn..."* — det är fel framing. Det är **redesign av existerande komponenter**, inte ny implementation.

**Risk:** Code läser literally och bygger från scratch, vilket raderar:
- `CATEGORY_META`-systemet i WeeklyDecision
- `formatOwnerInitial()` i BoardObjectives
- `STATUS_LABEL`-svensktexten
- `ARC_ICON`-mappningen från `activeArcStrings`
- Senaste Margareta-replik (commit `35d6a44`)

**Åtgärd:** Code-instruktionen måste explicit säga: *"Tre redan-existerande komponenter som ska redesignas mot mock. Börja med diff, inte rewrite."*

---

### 2. Systemiska diff:ar mock vs kod

Tio konkreta punkter där mocken säger en sak och koden gör en annan. För varje måste **någon välja** innan Code rör något.

#### A. WeeklyDecision card-label

| Befintlig kod | Mock |
|---|---|
| `CATEGORY_META` mappar `decision.category` till 4 varianter:<br>`'🏒 Veckans spelarfråga'`<br>`'📣 Veckans supporterfråga'`<br>`'📋 Veckans träningsbeslut'`<br>`'🏛️ Veckans kommunfråga'` | Hårdkodad: `'📋 Veckans beslut'`<br>(en variant för "innehåll", `📣 Veckans supporterfråga` för "relations") |

**Bedömning:** Befintlig är rikare och bär information om beslutets natur (spelar/klack/träning/kommun). Mocken förenklar bort distinktionen. Kategori-systemet är inte trivialt — `weeklyDecisionService.ts` exporterar `WeeklyDecisionCategory`-typ som drivs av faktiskt content i decision-poolen.

**Förslag:** behåll `CATEGORY_META` och stripe-systemet (2px accent vs 3px warm) som mocken inför. De säger olika saker — kategori = vilken sektor i klubblivet, stripe = innehåll vs relation.

#### B. WeeklyDecision knappar — likvärdighet

| Befintlig | Mock |
|---|---|
| Solid `--bg-portal-elevated` + `1.5px solid var(--accent)` border<br>(likvärdiga SOLID båda) | Transparent + `1px solid rgba(196,122,58,0.4)`<br>(likvärdiga TRANSPARENT båda) |

Båda lösningar respekterar likvärdighets-principen ("aldrig solid + transparent som default"). Skillnaden är ren visuell vikt.

**Bedömning:** mockens transparenta är lättare och låter frågan dominera. Nuvarande är tyngre och mer "knapp-känsla". Designval — säg till.

#### C. WeeklyDecision resolution-mönster

| Befintlig | Mock |
|---|---|
| Vid klick: `setTimeout 1500ms` med ✓-icon + valt label + effekt-text<br>(en delvis-fördröjd resolution-yta) | Vid klick: `selected`-state med solid accent-bg + vit text<br>(persistent val visad) |

**Bedömning:** Helt olika UX-modeller. Befintlig fungerar som "konfirmation efter val", mockens som "valt val visas". Mocken specificerar inte vad som händer efter — försvinner kortet? Stannar selected-staten? Det är spec-gap.

**Förslag:** behåll befintlig resolution-yta. Mock-mönstret saknar after-state-spec.

#### D. WeeklyDecision frågans typografi

| Befintlig | Mock |
|---|---|
| `fontFamily: var(--font-body)`, `fontSize: 13.5`, `fontWeight: 600`, `lineHeight: 1.4`<br>(sans, semibold, tight) | `font-family: var(--font-display)`, `font-size: 14`, `font-style: italic`, `line-height: 1.5`<br>(Georgia italic, lufitig) |

**Bedömning:** Mockens "Georgia italic" är konsekvent med scen-typografi-tokens (`.h-scene-quote` är Georgia italic). Det ger frågan citatkänsla. Befintlig är mer "label". Mock-stilen är troligen rätt.

**Förslag:** anamma mock-typografi.

#### E. Antal rader visade

| Befintlig | Mock |
|---|---|
| ActiveArcs: `slice(0, 2)`<br>BoardObjectives: `slice(0, 2)` | "1–3 arc-rader"<br>"3 mål-rader" |

**Bedömning:** mock visar fler. Befintlig 2 är troligen avsiktligt val för att hålla Portal-höjd nere. Förändring kräver Portal-layoutbedömning.

**Förslag:** behåll 2-cap tills Jacob spelat playoff med 3 aktiva arcs (säkert dec-feb i säsongen) och kan bedöma om 3:e raden gör Portal överlastad.

#### F. ActiveArcs emoji-mappning

| Befintlig | Mock |
|---|---|
| `ARC_ICON[arc.type]` från `activeArcStrings.ts` — täcker 6+ typer:<br>hungrig_breakthrough, veteran_farewell, contract_drama, lokal_hero, ledare_crisis, derby_echo, m.fl. | Hårdkodar 4: ⭐🎯🃏💔<br>"⭐ veteran/karriär · 🎯 form/prestation · 🃏 mystery/joker · 💔 skada/relation" |

**Bedömning:** Mocken förenklar för designkommunikation, inte för produktion. Behåll `ARC_ICON`-mappningen från `activeArcStrings.ts`. Mock-emojierna bör verifieras mot vad som finns där.

**Förslag:** ingen ändring. Mocken är illustrativ.

#### G. BoardObjective ägar-format

| Befintlig | Mock |
|---|---|
| `formatOwnerInitial(obj.ownerId)` → "P. Andersson" (initial + efternamn) | "PELLE" (uppercase, 9px, letter-spacing 1.5px) |

**Bedömning:** STOR konflikt. Mocken tappar efternamn — bara förnamn caps. Detta är **identitets-fråga**: är ägaren en specifik styrelseledamot ("Pelle Andersson, ordförande") eller ett label som syftar till en roll?

I koden är ägare specifika personer med fullnamn lagrade i `Club.board.boardMembers`. Mocken förkastar detta.

**Förslag:** behåll fullnamn med initial. Mock-stilen tappar identitet och bryter mot R2-ambitionen från fresh-eyes-analysen (karaktärs-åldring kräver att Pelle är *Pelle Andersson*, inte bara "PELLE").

#### H. BoardObjective datamodell

| Befintlig (`BoardObjective` entity) | Mock (datakontrakt i HANDOFF) |
|---|---|
| `measureFn: 'balanceBudget' \| 'communityStanding' \| ...`<br>`currentValue: number`<br>`targetValue: number`<br>`status: 'active' \| 'at_risk' \| 'failed' \| 'met'` | `display: { kind: 'progress' \| 'money'; ... }`<br>`status: '📌' \| '⚠️' \| '❌' \| '✅'` |

**Bedömning:** Datamodell-krock. Mockens `display.kind` är ren UI-strategi (visa progress eller pengar?). Koden har en domänmodell (`measureFn`) som driver beräkning + visualisering. Mockens kontrakt är tunnare.

**Förslag:** Code ska INTE migrera till mockens datakontrakt. Mappa istället mockens visuella val till befintlig modell:
- `measureFn === 'balanceBudget'` → mockens `display.kind === 'money'`
- annars → `display.kind === 'progress'`

Det här blir en mappnings-funktion i komponenten, inte en domänmigration.

#### I. BoardObjective status-label

| Befintlig | Mock |
|---|---|
| Visar text-label: "Aktivt", "I fara", "Misslyckat", "Uppfyllt" bredvid namnet, färgkodad | Bara icon (📌⚠️❌✅), ingen textlabel |

**Bedömning:** Designval. Mocken är tystare och förlitar sig på icon-betydelse. Befintlig är mer explicit men brus.

**Förslag:** anamma mock — färre ord på Portal är bra. Status-text kan flyttas till hover-tooltip om accessibility kräver.

#### J. Sektionsrubriker mellan secondaries

| Befintlig (`PortalSecondarySection`) | Mock |
|---|---|
| Inga subsektioner — secondaries staplas vertikalt | `⬩ Veckans fråga ⬩`, `⬩ Pågående narrativ ⬩`, `⬩ Styrelsens kontrakt ⬩` som section-titles |

**Bedömning:** Strukturändring. Mocken inför ny komponent (section-title) som inte finns i koden. HANDOVER nämner inget.

**Förslag:** kräver explicit beslut. Antingen:
- (a) Sektionsrubriker är produktionsavsedd ny komponent → Code implementerar `PortalSectionTitle` + grupperar secondaries
- (b) Sektionsrubriker är mock-layout för designkommunikation → ignorera i implementation

Mest sannolikt (b) baserat på avsaknad i HANDOVER. Verifiera med Design.

---

### 3. HANDOVER och mocken motsäger varandra om scoreboard 7-segment

**HANDOVER (Modul 1):**
> "7-segment LED-glyfer, byggda som SVG-symboler (en `<symbol id="d0">` ... `<symbol id="d9">`-uppsättning). Använd `<use>` för rendering. **Använd inte font-baserade 7-segment-fonter** — vi behöver per-segment-färgning för 'släckta' segment-illusionen."

**Mockens faktiska implementation:**
```javascript
const SEG_MAP = {
  '0': 'abcdef', '1': 'bc', '2': 'abged', ...
}
function renderDigit(char, sizeClass) {
  const wrap = document.createElement('span')
  wrap.className = `seg ${sizeClass}`
  for (const id of 'abcdefg') {
    const s = document.createElement('span')
    s.className = `s ${id}` + (segs.includes(id) ? ' on' : '')
    wrap.appendChild(s)
  }
}
```

Mocken använder `<span>` + CSS `clip-path: polygon(...)` per segment. Inte SVG, inte font, en tredje teknik.

**Bedömning:** HANDOVER's "SVG-symboler" är inte vad mocken faktiskt levererar. Code kommer förvirras.

**Förslag:** välj en. Mockens CSS-clip-path-approach fungerar bra och är lättare att React-portera än SVG-symbols. Uppdatera HANDOVER att matcha mocken, eller ändra mocken att matcha HANDOVER. Inte båda.

---

### 4. 14 nya CSS-tokens utan registrering i DESIGN-DECISIONS

Mocken introducerar nya tokens i `:root`:

```css
--led-red:       #FF2A18;
--led-red-dim:   rgba(255, 42, 24, 0.07);
--led-red-glow:  rgba(255, 42, 24, 0.55);
--bezel-top:     #3a3632;
--bezel-mid:     #2a2622;
--bezel-bot:     #15130f;
--panel:         #0A0908;
--panel-edge:    #050402;
--line-bg:       rgba(255, 255, 255, 0.04);
--line-stroke:   rgba(255, 255, 255, 0.12);
--line-tick:     rgba(255, 255, 255, 0.18);
--line-text:     rgba(245, 241, 235, 0.55);
--home-mark:     #C47A3A;
--away-mark:     #6B7F8E;
--now-mark:      #FFB347;
```

**Inget av detta finns i `design-system/colors_and_type.css`.**

Och: token-namnrymden krockar med befintliga match-tokens. Existerande `Scoreboard.tsx` (commit `83ab6c1`) använder `--match-copper`. Mockens `--home-mark` är `#C47A3A` — samma copper-värde, men annat namn. Detta är **token-drift**: två namn för samma färg.

**Förslag:**
- Lägg till nya tokens i `colors_and_type.css` med kommentar om syfte
- Registrera i `DESIGN-DECISIONS.md` som ny post: "Match-vy får ny industrial-LED-token-familj"
- Konsolidera `--home-mark` med befintlig `--match-copper` om det är samma värde — eller ge en av dem nytt namn

---

### 5. Strategisk fråga: copper-warm vs industrial-LED för match-vyn

Befintlig match-yta använder copper-paletten (`--match-copper`, `--bg-leather`, `--accent`-derivat). Den nya scoreboard-mocken bryter helt med det och introducerar industrial LED-grammatik (röda 7-segment, mörk panel, dot-matrix scroll, scanline-textur).

Det här är inte ett misstag — Designs noter förklarar resonemanget tydligt: "tavlan på Stålvallen översatt rent". Det är medveten omläggning.

Men det är **stort designbeslut** som påverkar hela match-flödet, inte bara scoreboard-komponenten:
- `MatchHeader.tsx` — copper just nu, ska den följa mot industrial?
- `CommentaryFeed.tsx` — copper, samma fråga
- `MatchLiveScreen.tsx`-bg — leather just nu
- `MatchDoneOverlay.tsx`, `HalfTimeSummaryScreen.tsx` — etc

**Ingen av dessa nämns i HANDOVER.** Code kommer få frågan: ska scoreboard vara industrial-LED OCH allt annat fortsätta copper-warm, eller är detta starten på en match-yta-omläggning?

**Förslag:** Detta blocker innan Code rör scoreboard. Designval krävs:
- (a) Scoreboard är ensam industrial-LED, resten copper-warm → Code implementerar isolerat, accepterar visuell drift inom match-vyn
- (b) Match-vyn ska helt om till industrial-LED → ny separat sprint, scoreboard är första steget
- (c) Industrial-LED är förslag, copper-warm vinner → Designs scoreboard-vision modifieras

---

### 6. Operatörens röst (textremsan) saknar data-source

Mockens textremsa visar:
> `★ MÅL 74:08 #14 KRONBERG (FOR) | ASS #11 LINDQVIST | 3—2 EFTER 74 MIN`

Det här är hårdkodad demo-data. För produktion behöver Code:
- Vilken data-stream? `MatchEvent[]` från `matchCore`?
- Vem genererar texten? Ny `commentaryRibbonService.ts`?
- Hur ofta uppdateras den? Per ny event? Per minut?
- Vad är "operatörens röst"? Får den ha personlighet (mock säger ja)?

**HANDOVER säger:** "Detta är operatörens röst, inte spelets data. Den får ha personlighet."

Det är en designvision men ingen implementation-spec. Code kommer improvisera.

**Förslag:** Antingen separat spec för `commentaryRibbonService.ts` (kort fil), eller utöka HANDOVER med data-source-detaljer. Annars får Code göra antaganden och Jacob får bygga om sen.

---

### 7. Mock-fil ligger i fel relation till `_base.css`

`docs/mockups/2026-05-08_design_portal-secondary-cards.html` har:
```html
<link rel="stylesheet" href="_base.css">
```

`_base.css` ligger i `design-system/preview/_base.css`. Relativ länk leder till `docs/mockups/_base.css` som inte finns. Mocken renderar trasigt om man öppnar den lokalt.

**Förslag:** ändra länken till `../../design-system/preview/_base.css`, eller kopiera `_base.css` till `docs/mockups/`-mappen.

---

## Sammanfattning — vad behöver beslutas innan Code-instruktion

### Måste-svar (blockerar):
1. **Bekräfta för Code:** "redesign existerande komponenter, ej ny implementation"
2. **WeeklyDecision: behåll CATEGORY_META** (4 kategorier) eller använd mockens generiska "Veckans beslut"?
3. **WeeklyDecision: knapp-stil** transparent (mock) eller solid elevated (kod)?
4. **WeeklyDecision: resolution** behåll setTimeout+checkmark eller anamma `selected`-state?
5. **BoardObjective ägare:** behåll fullnamn ("P. Andersson") eller mockens uppercase förnamn ("PELLE")?
6. **BoardObjective status-label:** behåll text ("Aktivt") eller bara icon?
7. **Sektionsrubriker:** ny strukturkomponent eller bara mock-layout?
8. **Scoreboard 7-segment:** SVG-symbols (HANDOFF) eller CSS clip-path (mock)?
9. **Match-vy färgvokabulär:** scoreboard ensam industrial-LED, eller hela match-vyn omläggning?

### Bör-svar (mindre blockerar):
10. WeeklyDecision frågans typografi: anamma Georgia italic
11. ActiveArcs/BoardObjectives cap: behåll 2-rader tills playoff-test
12. Tokens: lägg till i `colors_and_type.css`, konsolidera `--home-mark` ↔ `--match-copper`
13. Operatör-textremsa: separat spec för `commentaryRibbonService.ts`
14. Mock-fil `_base.css`-länk: fixa eller kopiera

---

## Vad detta dokument INTE bedömer

- Designens estetiska kvalitet (mockarna är fina)
- Strategiska val om Stålvallen-konceptet (det är designs jobb)
- Tonalitet i copy (Sture-Forsbacka-känslan håller)

Bara konflikt-yta mellan leverans och vad Code skulle bygga utan att Jacob väljer.
