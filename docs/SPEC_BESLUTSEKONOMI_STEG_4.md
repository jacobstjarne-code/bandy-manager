# SPEC_BESLUTSEKONOMI STEG 4 — Fas-scener + scen-konsekvens

**Datum:** 2026-05-04
**Författare:** Opus
**Status:** Spec-klar för Code
**Ersätter:** Sektionen "STEG 4 — Scen-markörer för fas-skiften" i `SPEC_BESLUTSEKONOMI.md` (2026-04-30)
**Beroende:** SPEC_SCENES_FAS_1 (levererad). SPEC_KAFFERUMMET_FAS_1 (levererad). Steg 1-3 i SPEC_BESLUTSEKONOMI (levererade).
**Mock:** `docs/mockups/scen_konsekvens_mockup.html` (Opus producerar i samband med denna spec)

---

## Varför revidering

Original-Steg 4 listade sex *nya* fas-scener att bygga. Playtest 2026-05-04 (`docs/PLAYTEST_NOTERINGAR_2026-05-04.md`) visade att problemet är större än "bygg sex nya":

1. **Existerande fullskärm-paus i match-flödet är fula.** FÖRLÄNGNING (90') och STRAFFAR (120') visas som halv-overlays ovanpå scoreboarden, bottennav och "MATCH PÅGÅR"-bannern syns fortfarande. Stora versaler-rubriker, gradient-knappar i röd-orange. Inkonsekvent med Scene-systemet.

2. **Match-end-ceremonier avviker stilmässigt.** CeremonyCupFinal (CUPFINALFÖRLUST) är en bra skärm men har "helt egen stil" (Jacob, playtest 17:17). Stora versaler-rubrik, silvermedalj-emoji, "Ni kom ändå långt" — närmar sig scen-stil utan att följa den.

3. **CTA-konsekvens saknas.** Vi har "Då börjar vi", "Då kör vi", "Fortsätt", "Tillbaka till dashboarden", "Påbörja straffläggning →" — alla olika ord, olika stilar. Ingen styrning.

4. **Cup-faser saknades.** cup_intro + cup_final_intro byggdes idag (2026-05-04) som förskott på Steg 4.

5. **Befintliga scener följer inte sin egen spec.** Kafferummets CTA är "Tillbaka till dashboarden" i appen — SPEC_KAFFERUMMET_FAS_1 säger "Tillbaka till klubben". Implementations-avvikelse.

6. **Trigger-tajming felar.** Kafferummet triggade direkt efter cupfinalförlust. Övergången är abrupt — spelaren har precis fått "CUPFINALFÖRLUST" och hamnar mitt i kafferum-skvaller. Cooldown saknas efter förlust-scener.

**Slutsats:** Steg 4 måste reitereras. Inte bara "bygg sex nya scener" utan "etablera scen-konsekvens i hela spelet, befintligt + nytt".

---

## Princip — Scene-systemet är auktoritativt

`SPEC_SCENES_FAS_1.md` definierar scen-arkitekturen. Den är auktoritativ källa för stil. Allt fullskärm-paus i spelet ska följa det ramverket:

- Mörk bakgrund (`var(--bg-scene)`)
- Genre-tag `⬩ I DETTA ÖGONBLICK ⬩` *eller* kategori-specifik tag (se nedan)
- Georgia för rubriker, body
- Shared components: `SceneHeader`, `SceneChoiceButton`, `SceneCTA`, `SceneContainer`
- Mock-driven design är commit-blocker (princip 4 i CLAUDE.md)

Detta gäller även element som *idag* inte är "scener" enligt kodens definition (PhaseOverlay, CeremonyCupFinal). De ska migreras till Scene-systemet eller anta dess stil.

---

## Klassificering — fem kategorier

Varje fullskärm-paus i spelet faller under exakt en av dessa kategorier. Kategorin styr stil, genre-tag, och CTA.

### Kategori A — Fas-intro (säsong)

Etablerar att en säsongsfas börjar. Ingen drama. Spelaren förbereder sig.

| Scen | Trigger | Status |
|---|---|---|
| `season_premiere` | Innan första ligamatch | NY |
| `mid_season` | Omg 11, efter avslutad match | NY |
| `final_stretch` | Omg 19, innan match | NY |
| `playoff_intro` | Innan KVF, om managed kvalat | NY |
| `season_end_recap` | Efter sista matchen, oavsett placering | NY |

**Stil:** Standard scen-mall. Genre-tag `⬩ I DETTA ÖGONBLICK ⬩`. Ingen accent-färg utöver default.
**CTA:** "Då kör vi"

### Kategori B — Fas-intro (match)

Match-fas. Spelaren stannar i match-flödet, scenen signalerar att läget förändras.

| Scen | Trigger | Status |
|---|---|---|
| `cup_intro` | Innan första cupmatch (säsong 1) | ✅ BYGGT 2026-05-04 |
| `cup_final_intro` | Innan cupfinal | ✅ BYGGT 2026-05-04 |
| `match_overtime` | Vid 90' när oavgjort | OMARBETAS (ersätter PhaseOverlay 'overtime') |
| `match_penalties` | Vid 120' när oavgjort | OMARBETAS (ersätter PhaseOverlay 'penalties') |

**Stil:** Standard scen-mall, kortare. Genre-tag = scen-namn ("CUPFINAL", "FÖRLÄNGNING", "STRAFFLÄGGNING"). AutoAdvance möjligt på kort intro-beat.
**CTA:** Action-fokuserad — "Spela förlängningen", "Påbörja straffar". Ingen "Då kör vi".

### Kategori C — Konsekvens

Något har inträffat. Spelaren ser resultatet, processar.

| Scen | Trigger | Status |
|---|---|---|
| `sm_final_victory` | Vinst SM-final | ✅ FINNS |
| `cup_final_victory` | Vinst cupfinal | NY (kontrollera om CeremonyCupFinal vid vinst täcker detta) |
| `cup_final_loss` | Förlust cupfinal | OMARBETAS (CeremonyCupFinal vid förlust idag) |
| `sm_final_loss` | Förlust SM-final | NY (verifiera om CeremonySmFinal vid förlust finns) |
| `playoff_eliminated` | Utslagen i KVF/SF | NY |

**Stil:** Standard scen-mall. Genre-tag `⬩ I DETTA ÖGONBLICK ⬩`. Diskret medalj-/pokal-emoji om relevant (silvermedalj för förlust). Kort förklarande text — *inte* "Ni kom ändå långt"-platityder. Bandysverige-ton: konstaterande, understatement.
**CTA:** "Fortsätt"

### Kategori D — Reflektion

Spelaren tjuvlyssnar eller upplever. Ingen handling. Befintliga scener.

| Scen | Trigger | Status |
|---|---|---|
| `sunday_training` | Säsong 1, omg 1-2 | ✅ FINNS |
| `coffee_room` | Cooldown 3 omg + override-triggers | ✅ FINNS (CTA-fix krävs) |
| `journalist_relationship` | Vid relationsextrem | ✅ FINNS |
| `season_signature_reveal` | Vid säsongsstart | ✅ FINNS |

**Stil:** Lugn, dialogisk. Genre-tag `⬩ I DETTA ÖGONBLICK ⬩`.
**CTA:** "Tillbaka till klubben"

### Kategori E — Konfrontation

Beslut krävs.

| Scen | Trigger | Status |
|---|---|---|
| `board_meeting` | Säsongsstart | ✅ FINNS |
| `patron_conflict` | Patron-relation kraschar | NY (Steg 5 i ursprungsspec) |
| `transfer_deadline` | Sista 24h transferfönster | NY (Steg 5) |
| `club_scandal` | Egen klubb drabbas | NY (Steg 5) |

**Stil:** Standard scen-mall + val-knappar. Genre-tag `⬩ I DETTA ÖGONBLICK ⬩`.
**CTA:** Per val. Ingen generisk CTA.

---

## CTA-konsekvens (tabell)

| Kategori | CTA-text | Format |
|---|---|---|
| A — Fas-intro säsong | "Då kör vi" | btn-primary, fullbredd nederst |
| B — Fas-intro match | "Spela [scenen]" — "Spela förlängningen", "Påbörja straffar", "Spela cupfinalen" | btn-primary, fullbredd nederst |
| C — Konsekvens | "Fortsätt" | btn-primary, fullbredd nederst |
| D — Reflektion | "Tillbaka till klubben" | btn-primary, fullbredd nederst |
| E — Konfrontation | per val | Standard val-knappar |

**Förbjudna CTA-texter:** "Då börjar vi", "Tillbaka till dashboarden", "OK", "Stäng", "Klar". Plus alla varianter av "Fortsätt →" där pilen är inkonsekvent.

**Pil-konvention:** Alla CTAs i kategori A, B, C, D får följt av `→` i samma textsträng. Konsekvent.

---

## Stil-spec per kategori (CSS-tokens)

Alla scener delar bas-mall via `SceneContainer`:

```css
background: var(--bg-scene)  /* ny token, default = var(--bg-dark) */
min-height: 100vh
display: flex
flex-direction: column
position: relative
```

**Genre-tag (alla kategorier):**
```css
font-size: 9px
font-weight: 600
letter-spacing: 4px
color: var(--accent)
opacity: 0.7
text-transform: uppercase
margin-top: 30px
margin-bottom: 10px
text-align: center
```

**Rubrik (alla kategorier):**
```css
font-family: Georgia, serif
font-size: 22-28px (kategori-beroende)
font-weight: 700
color: var(--text-light)
line-height: 1.2
text-align: center
margin-bottom: 4px
```

**Body (kategori A, B, C, D):**
```css
font-family: Georgia, serif
font-size: 16px
color: var(--text-light)
line-height: 1.65
padding: 0 24px
```

**Kategori-specifika justeringar:**

| Kategori | Justering |
|---|---|
| A | Standard ovan |
| B | Body fontSize 14px (kortare meddelande), autoAdvance på första beat möjligt |
| C | Diskret emoji ovanför rubrik (silvermedalj 🥈 för förlust, pokal 🏆 för vinst). Body kortare, mer konstaterande. |
| D | Body kan vara lång (dialog). Lugn animations-takt. |
| E | Val-knappar via `SceneChoiceButton`. |

---

## Tajming & cooldown-regler

### Scen-trigger-prio (uppdaterad)

`detectSceneTrigger` returnerar första matchande:

```
1. sm_final_victory          (Kat C)
2. sm_final_loss             (Kat C, NY)
3. cup_final_victory         (Kat C, NY)
4. cup_final_loss            (Kat C, OMARBETAS)
5. playoff_eliminated        (Kat C, NY)
6. board_meeting             (Kat E)
7. season_end_recap          (Kat A, NY)
8. patron_conflict           (Kat E, Steg 5)
9. transfer_deadline         (Kat E, Steg 5)
10. club_scandal             (Kat E, Steg 5)
11. season_premiere          (Kat A, NY)
12. mid_season               (Kat A, NY)
13. final_stretch            (Kat A, NY)
14. playoff_intro            (Kat A, NY)
15. cup_final_intro          (Kat B)  ← byggt
16. cup_intro                (Kat B)  ← byggt
17. sunday_training          (Kat D)
18. journalist_relationship  (Kat D)
19. season_signature_reveal  (Kat D)
20. coffee_room              (Kat D)
```

### Cooldown efter konsekvens-scener (NY regel)

**Problem (playtest 2026-05-04):** Kafferummet triggade direkt efter cupfinalförlust. Övergången abrupt.

**Regel:** Efter en Kategori C-scen (Konsekvens) i en omgång, får ingen Kategori D-scen (Reflektion) trigga *samma omgång*. Spelaren får processa förlusten/vinsten utan att direkt kastas in i kafferum-skvaller.

Implementation: Sätt `lastConsequenceSceneRound` på SaveGame när Kat C-scen visas. `shouldTriggerCoffeeRoom` (och övriga Kat D-triggers) returnerar `false` om `currentRound === lastConsequenceSceneRound`.

### Cooldown efter Kat C-fortsätt (extra regel)

Om spelaren just klickat "Fortsätt" på en Kat C-scen, gå direkt till Portal — inte vidare till nästa scen i kedjan. Spelaren har precis processat något stort. Ingen mer fullskärm-paus samma turn.

`completeScene` för Kat C-scener anropar **inte** `detectSceneTrigger` igen i samma turn (jämför "scen-kedja" från 2026-05-04).

### Match-fas-scener (Kat B) flödar utan paus

Vid förlängning/straffar: scenen visas, CTA klickas, match fortsätter direkt. Ingen Portal-paus mellan scen och match.

---

## Inventering — vad ska byggas, omarbetas, fixas

### Bygga från noll

| ID | Kategori | Trigger | Estimat |
|---|---|---|---|
| `season_premiere` | A | Innan första ligamatch | 1d Code + texter (Opus) |
| `mid_season` | A | Omg 11, efter match | 1d Code + texter |
| `final_stretch` | A | Omg 19, innan match | 1d Code + texter |
| `playoff_intro` | A | Innan KVF | 1d Code + texter |
| `season_end_recap` | A | Efter sista matchen | 2d Code (kontextuella varianter) + texter |
| `cup_final_victory` | C | Vinst cupfinal | 0.5d Code + texter (kontrollera om CeremonyCupFinal vid vinst kan kompletteras istället) |
| `sm_final_loss` | C | Förlust SM-final | 0.5d Code + texter |
| `playoff_eliminated` | C | Utslagen KVF/SF | 1d Code (varianter per runda) + texter |

### Omarbeta befintliga (stil-migration till Scene-systemet)

| ID | Idag | Ny implementation |
|---|---|---|
| `match_overtime` | `PhaseOverlay phase='overtime'` (halv-overlay) | Migrera till Scene-systemet, Kat B. Visas via samma trigger-mekanik som scen, ej overlay. |
| `match_penalties` | `PhaseOverlay phase='penalties'` (halv-overlay, röd-orange knapp) | Migrera till Scene-systemet, Kat B. |
| `cup_final_loss` | `CeremonyCupFinal` vid förlust | Migrera till Scene-systemet, Kat C. Behåll bra delarna (silvermedalj-koncept, kort text), kassera "Ni kom ändå långt"-platityden. |
| Kafferum-CTA | "Tillbaka till dashboarden" | Ändra till "Tillbaka till klubben" enligt SPEC_KAFFERUMMET_FAS_1. |

### Verifiera/komplettera befintliga

| ID | Status att utreda |
|---|---|
| `CeremonyCupFinal` vid vinst | Finns det redan? Stil OK? Om ja, omarbeta till Kat C-stil. Om saknas, bygg som `cup_final_victory`. |
| `CeremonySmFinal` vid förlust | Finns det? Om saknas, bygg som `sm_final_loss`. |
| `sm_final_victory` | Stil OK enligt SPEC_SCENES_FAS_1? Om avvikelse, justera till Kat C-stil. Behåll guld-konfetti-eleganta detaljer. |
| "Matchen avgjordes på straffar"-skärm | CTA saknas helt enligt playtest. Bestäm: är detta del av cup_final_loss-flödet eller egen scen? Förmodligen integreras i cup_final_loss/win som första beat. |

---

## Match-flödet (Kat B + C) — koreografi

Cup-final och SM-final har en match-end-koreografi som måste fungera som en sammanhängande sekvens. Föreslagen koreografi:

```
1. Match slut, oavgjort
   ↓
2. Kat B-scen: match_overtime
   "Förlängning. Oavgjort efter 60 minuter. Ytterligare 2×15 spelas."
   CTA: "Spela förlängningen →"
   ↓
3. Förlängning körs (match-flöde)
   ↓
4. Förlängning slut, fortfarande oavgjort
   ↓
5. Kat B-scen: match_penalties
   "Straffläggning. Fortfarande oavgjort efter förlängning. Nu avgör straffarna."
   CTA: "Påbörja straffar →"
   ↓
6. Straffar körs
   ↓
7. Match slut (cupfinal-förlust på straffar)
   ↓
8. Kat C-scen: cup_final_loss
   Genre-tag: "CUPFINAL"
   Rubrik: "Förlorade på straffar."  (eller "Förlust." om reguljär)
   Body: kort konstaterande text. Vem vann. Inget "ni kom ändå långt".
   Eventuell statistik: var ni nära? Var det jämnt?
   CTA: "Fortsätt →"
   ↓
9. Portal. Cooldown aktiv: ingen kafferum/sunday-training-trigger samma omgång.
```

**Notera:** "Matchen avgjordes på straffar"-skärmen som idag saknar CTA är förmodligen samma sak som steg 8 i ny koreografi — förlust-scenen själv. Verifiera vid implementation.

---

## Mock-referens

`docs/mockups/scen_konsekvens_mockup.html` (skrivs av Opus i samband med denna spec).

**Mocken visar:**
1. Bas-mall (SceneContainer + SceneHeader + body + SceneCTA)
2. Kategori A-variant (`season_premiere`)
3. Kategori B-variant (`match_overtime`)
4. Kategori C-variant (`cup_final_loss`)
5. Kategori D-variant (befintligt kafferum med rätt CTA)

**Pixel-jämförelse är commit-blocker.** Ingen scen committeras utan att Code skärmdumpat appen + mocken sida vid sida i 430px.

---

## Tester

### Pure logic

`sceneTriggerService.test.ts`:
- Cooldown efter Kat C-scen blockerar Kat D
- Kat C-scen anropar inte detectSceneTrigger igen i samma turn
- Prio-ordning korrekt (sm_final_victory först, coffee_room sist)

`cooldownService.test.ts` (ny om relevant):
- `lastConsequenceSceneRound` sätts vid Kat C-scen
- Reset vid ny omgång

### Visuell verifiering

För varje scen som byggs/omarbetas:
- Skärmdump app + mock i 430px
- Bifoga i SPRINT_AUDIT
- Beskriv eventuella avvikelser

---

## Texter — Opus levererar

För varje ny/omarbetad scen lämnar Code tomma string-slots i datafil. Opus fyller dem i separat textpass.

**Innehåll Opus skriver:**
- `season_premiere`: 2-3 beats med bandysverige-ton, ispremiär-tema
- `mid_season`: kort konstaterande, halvtidsläge
- `final_stretch`: spänd ton, tre matcher kvar
- `playoff_intro`: spänd, "vinn eller åk hem"
- `season_end_recap`: 4-6 varianter beroende på utfall (mästare / SM-final / KVF-utslagen / mitt-i / nedflyttning)
- `cup_final_loss`: kort konstaterande, vem vann, ingen platityd
- `sm_final_loss`: motsvarande för SM
- `playoff_eliminated`: per runda
- `match_overtime`: kort, autoAdvance-beat möjligt
- `match_penalties`: kort, spänd

**Stilreferenser:** SPEC_KAFFERUMMET_FAS_1 (skvaller-tonen), boardQuotes (understatement), cup_final_intro (ny — bra exempel på Kat B).

**Förbud:** Ingen LLM-stil-paired-sentence där rad två förklarar rad ett. Inga "Det är inte X, det är Y"-konstruktioner. Inga "Det är läget"-avslut. Inga TV-panel-platityder.

---

## Implementation-ordning

1. **Inventering & verifiering** (1 dag, Code + Opus)
   - Code dokumenterar exakt vad som finns idag (PhaseOverlay-implementation, CeremonyCupFinal-implementation, sm_final_victory-implementation)
   - Code verifierar om CeremonyCupFinal vid vinst, CeremonySmFinal vid förlust finns
   - Rapport: `docs/diagnos/2026-05-04_scen_inventering.md`

2. **Mock + token-spec** (Opus, parallellt med 1)
   - HTML-mock med fem kategori-varianter
   - Lägg till `--bg-scene` i CSS-tokens om saknas
   - Bekräfta CTA-texter

3. **Stil-migration: PhaseOverlay → Scene-system** (2 dagar, Code)
   - `match_overtime` + `match_penalties` som Kat B-scener
   - Verifiera mot mock
   - Behåll match-flödets pause-funktionalitet

4. **Stil-migration: CeremonyCupFinal → cup_final_loss/victory** (2 dagar, Code)
   - Migrera till Kat C-mall
   - "Matchen avgjordes på straffar" integreras som första beat
   - Behåll silvermedalj-emoji subtilt

5. **CTA-konsekvens** (0.5 dag, Code)
   - Kafferum CTA "Tillbaka till klubben"
   - Granska alla scen-CTAs mot tabellen ovan
   - Korrigera avvikelser

6. **Cooldown efter Kat C-scen** (0.5 dag, Code)
   - `lastConsequenceSceneRound` på SaveGame
   - Trigger-blockering i Kat D-triggers
   - Tester

7. **Bygg Kat A-scener** (5 dagar, Code + Opus parallellt)
   - season_premiere, mid_season, final_stretch, playoff_intro, season_end_recap
   - Opus skriver texter mellan/parallellt

8. **Bygg Kat C-nya** (2 dagar, Code + Opus)
   - sm_final_loss, playoff_eliminated, eventuell cup_final_victory
   - Texter

9. **Verifiering** (1 dag)
   - Pixel-jämförelse mot mock per scen
   - Playtest helsäsong, alla scener triggar i rätt ordning
   - SPRINT_AUDIT.md

**Total estimat:** 14-15 dagar Code + parallell text-leverans Opus. Stort jobb. Levereras iterativt — stopp efter steg 6 (CTA + cooldown + befintliga omarbetade), playtest, sen Kat A-scener.

---

## Vad detta INTE är

- Inte ett filter — inga scener tas bort.
- Inte en omtolkning av Scene-systemet — SPEC_SCENES_FAS_1 är auktoritativ.
- Inte Steg 5 (kritiska enskilda händelse-scener) — patron_conflict, transfer_deadline, club_scandal är listade här för komplettsynt men implementeras separat.
- Inte text-pass — texter lämnas tomma av Code, fylls av Opus.
- Inte ett ersättande av befintliga Kat D-scener (kafferum, sunday_training) — bara CTA-fix.

---

## Verifieringsprotokoll

Efter steg 1-6 (befintligt omarbetat + CTA + cooldown):

1. `npm run build && npm test` — alla tester gröna
2. Pixel-jämförelse mot mock för varje omarbetad scen — bifoga i commit
3. Playtest: spela cupfinal, förlora på straffar. Verifiera:
   - Förlängning visas som scen, ej halv-overlay
   - Straffläggning visas som scen, ej halv-overlay
   - Förlust-skärm i Kat C-stil med "Fortsätt →"
   - INGEN kafferum-trigger samma omgång
   - Tillbaka till Portal direkt efter "Fortsätt"
4. Kafferum-CTA verifierat: "Tillbaka till klubben"

Efter steg 7-8 (nya scener):

1. Spela helsäsong med båda nya manager-saves
2. Skärmdump varje ny scen som triggar
3. Verifiera prio-ordning vid kollisioner
4. SPRINT_AUDIT.md med alla skärmdumpar

---

## Slut SPEC_BESLUTSEKONOMI_STEG_4
