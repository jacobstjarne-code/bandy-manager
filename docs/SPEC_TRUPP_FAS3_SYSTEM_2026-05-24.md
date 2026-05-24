# SPEC — System bakom trupp Fas 3-krokarna 2026-05-24

**Av:** Opus. **Surface:** arkitektur + prioritering. **Underlag:** kodläsning av
`SquadScreen.tsx` (Fas 3-krokarna verifierade tomma), `Player.ts`, `SaveGame.ts`,
`clubMemoryService.ts`. **Föregående:** `SPEC_TRUPP_REDESIGN_2026-05-24.md`.

## Utgångspunkt

Trupp-kortet har fem `// VÄNTAR PÅ`-krokar (verifierade som rena kommentarer, inget
renderas). Var och en kräver ett system bakom sig. De är INTE jämbördiga — de spänner
från ett textfält (en kvälls arbete) till ett helt landslagsfeature (eget projekt).
Specen tar dem i storleksordning, minst först, så prioritering blir möjlig. Att bygga
dem i krok-ordning vore fel; bygg i värde-mot-ansträngning-ordning.

Princip som gäller alla fem: kroken aktiveras FÖRST när datakontraktet är uppfyllt och
verifierat i ett spelläge. Ingen render mot halv data.

---

## TIER 1 — En kvälls arbete (gör först om trupp ska kännas rikare snabbt)

### A. Manager-anteckning (`player.managerNote`)
**Storlek:** Minst. Ett textfält + en edit-yta + render av en rad. ~1.5h.
**Värde:** Högt per krona. Ger spelaren en egen röst i trupplistan ("Förläng innan han
hör från Söderfors") — minne för en själv, helt utan att något annat system behöver finnas.

**Datakontrakt:**
```ts
// Player.ts
managerNote?: string   // fri text, max 80 tecken
```

**Bygg:**
1. Lägg `managerNote?: string` på `Player`. Migration: odefinierat = ingen anteckning.
2. Edit-yta: MODAL (Design-beslut, låst). Inte long-press, inte inline i listan. Skäl:
   anteckningen är reflektion inte snabb-action (modalen tvingar en kort paus); inline
   kraschar med listans densitet på 375px; modalen är där det djupare spelar-arbetet
   (förläng/prata/scout) redan sker. UI:
   - Längst ner i hero-blocket (under portrait + stats): en rad som visar nuvarande
     anteckning, eller "Lägg till anteckning" om tom, med ✎-ikon till höger.
   - Klick öppnar en kompakt textarea INLINE (inte ny modal ovanpå modalen), 80-teckens
     räknare, Spara/Avbryt-knappar.
   - VIKTIGT: scrolla INTE automatiskt till anteckningen när modalen öppnas och en
     anteckning finns. Den ska upptäckas, inte påtvingas.
3. Render i PlayerRow (listan): read-only `✎`-prefixad italic-rad under storyline-raden,
   samma stil som storyline. INGET edit-affordance i listan — klick på raden öppnar bara
   modalen som vanligt. Visa BARA om `managerNote` är satt (ingen tom placeholder-slot).
4. Aktivera kroken `{/* VÄNTAR PÅ ny datamodell: Manager-anteckning */}`.

**Surface:** Datamodell + listans render-rad är mekanik (Code). Edit-ytan är Design-
beslutad (ovan, låst). Ingen Opus-text behövs — spelaren skriver sin egen.

### B. Klacken-favorit-chip (`narrativeLog`-mappning) — RAPPORT: kräver Klack-taggning
**Storlek:** Större än hoppats. Code-rapport: Klack-systemet (`klackPresenter.ts`,
`klackEchoText.ts`) skriver INTE till `narrativeLog` — det håller eget tillstånd i
`game.klackEcho`. Det finns ingen härledbar koppling spelare→klackfavorit. Chipet kräver
att Klack-systemet börjar tagga. Inte 1h.
**Värde:** Medel. Identitetsmarkör, inte beslutskritiskt.

**Två vägar (Jacob/Opus väljer när den prioriteras):**
- **(i)** Ny `narrativeLog`-typ `'klack'` — Klack-systemet skriver ett entry när en spelare
  får tifo/specialbehandling. Chipet härleds som övriga narrativeLog-chips. Konsekvent med
  hur trupp-kortet redan läser narrativeLog, men kräver ändring i Klack-systemet.
- **(ii)** Explicit `isKlackFavorite?: boolean` på Player — enklare flagga, men ännu ett
  bool-fält och måste underhållas när favoritskap ändras.
Opus lutar åt (i) — narrativeLog är redan trupp-kortets källa för härledda chips, och en
`'klack'`-typ öppnar för mer än bara chipet (klack-rader i spelarbiografin senare).

**Status:** Nedprioriterad — inte 1h, kräver Klack-systemarbete. Tas när Klack-narrativ
prioriteras, inte för chipets skull ensamt.

**Surface:** Mekanik + klack-text när typen byggs (Opus).

---

## TIER 2 — Halv till hel dag (eget pass, men data finns delvis)

### C. Squad-pulse-sparkline (NU-vyns hero) — RAPPORT: scope-val krävs
**Storlek:** Beror på scope. Code-rapport: `fatigueHistory` är PLATT — `number[]`, bara
ett aggregerat konditionsmått. Ingen morale, inga skador, ingen form separat. Så
full squad-pulse (flerkomponents) kräver NY `teamFitnessHistory`. ~2-3h med ny datamodell,
~30 min om man nöjer sig med befintlig kondition-sparkline.
**Värde:** Högt. NU-vyn saknar en sammanfattande "hur mår truppen"-signal.

**SCOPE-VAL (Jacob äger — inte byggbar förrän valt):**
- **(i) Enkel:** Återanvänd `fatigueHistory` som-den-är → en kondition-sparkline. Billig
  (~30 min), men visar BARA kondition. Morale och skador syns inte. Risk: en "squad-pulse"
  som bara är kondition lovar mer än den håller — spelaren tror den fångar lag-hälsa brett.
- **(ii) Full:** Ny `teamFitnessHistory` med `avgFitness`/`avgMorale`/`injuryCount` per
  omgång, samplad vid omgångsövergång. ~2-3h. Visar verklig lag-hälsa, komponenter på tap.

**Opus rekommendation:** (ii) eller skjut upp. En "puls" som bara är kondition är en
halv sanning som riskerar att kännas tunnare ju mer man tittar på den — och NU-vyn har
redan separata kort för skadade/moral/kontrakt, så en kondition-only-sparkline duplicerar
utan att tillägga. Antingen bygg den ordentligt (ii), eller låt den vänta tills den
prioriteras på riktigt. Inte värt en halvmesyr.

**Datakontrakt (om (ii) väljs):**
```ts
// SaveGame.ts — NY
teamFitnessHistory?: Array<{
  matchday: number
  avgFitness: number    // snitt fitness över truppen
  avgMorale: number     // snitt morale
  injuryCount: number   // antal skadade
}>
```

**Bygg (om (ii)):**
1. Sampla `teamFitnessHistory` vid omgångsövergång (push ett sample, rullande ~10 omg).
2. Squad-pulse-formel (viktning = Opus+Design). Komponenterna synliga på tap, inte dolda.
3. Sparkline-hero överst i NU-vyn (återanvänd `Sparkline`-primitiven).
4. VISUALISERING GÅR TILL DESIGN FÖRST (ny hero-komponent — se SURFACE nedan).

**Surface:** Mekanik = Code. Formel-viktning = Opus+Design. Hero-VISUALISERING = Design
ritar innan Code bygger. Detta är INTE byggbart nu — väntar på (a) scope-val och (b) Design.

### D. Anniversary-eko (`activeAnniversaries`) — RAPPORT: ren render, BYGGBAR NU
**Storlek:** Liten. Code-rapport bekräftade: `ActiveAnniversary` bär redan
`subjectPlayerId` (clubMemoryService.ts rad 157, satt vid generering 203/329/389).
`findActiveAnniversaries(game)` returnerar dem matchade mot `currentMatchday` med rätt
significance-trösklar. Ingen ny taggning krävs. ~1h.
**Värde:** Medel. En guld-rad när en spelares jubileum infaller — stämning och klubbidentitet.

**Datakontrakt:** Finns redan. `ActiveAnniversary` har `subjectPlayerId?`, `yearsAgo`,
`echoSize` ('small'|'medium'|'big'), `originalEventText`, `type`, `outcome`.

**VIKTIGT om text:** `originalEventText` ska INTE renderas rått — kommentaren i koden
säger "visas inte direkt — Opus skriver eko". Guld-raden är ett EKO, inte den ursprungliga
händelsetexten. Opus skriver eko-formlerna (se nedan), Code renderar dem.

**Bygg:**
1. I PlayerRow: anropa `findActiveAnniversaries(game)`, filtrera på
   `subjectPlayerId === player.id`. Lyft anropet till SquadScreen och skicka ner resultatet
   som prop (anropa inte per rad — det är samma beräkning för alla spelare; beräkna en gång,
   memoisera, mappa per spelare). Undvik samma per-rad-anropsmiss som captainPlayerId löste.
2. Render: guld italic-rad under storyline-raden (samma `paddingLeft: 50`-rytm), om en
   aktiv anniversary matchar. Vid flera — ta högsta `significance`/`echoSize`.
3. Eko-text (Opus, nedan) väljs på `type` + `yearsAgo` + `outcome`.
4. Aktivera kroken `{/* VÄNTAR PÅ R5: Anniversary-eko */}`.

**Eko-formler (Opus — svensk text, bandy-underdrift):**
Varianter väljs på `yearsAgo` (1 år = närmare, 2+ = avlägset/vördnadsfullt) och `outcome`:
- `sm_final`/`season_finish` guld (outcome won, big): `Å {yearsAgo} år sedan i dag — guldet. Han var med.`
- triumf medium (won): `På dagen {yearsAgo} år sedan storsegern. Samma kar, samma is.`
- scar (lost, SM-final-förlust): `{yearsAgo} år sedan finalen som glipade. Han bar den länge.`
- milstolpe (player_milestone): `Just denna omgång för {yearsAgo} år sedan — hans 100:e match.`
- neutral/default: `Samma omgång, {yearsAgo} år tillbaka. Klubben minns.`
Code: rapportera vilka `type`-värden som faktiskt förekommer med spelar-id (sannolikt
`player_milestone`, `academy_promotion`, `retirement`, `storyline_resolution`) så Opus
kan skriva exakt eko per typ — ovan är grunduppsättningen, kan behöva kompletteras.

**Surface:** Mekanik (render + memoiserat anrop) = Code. Eko-text = Opus (ovan).

---

## TIER 3 — Egna projekt (INTE ett trupp-pass — speca separat när de prioriteras)

### E. Landslags-chip (C-K1)
**Storlek:** Stort. Det finns inget landslagssystem. Chipet är toppen av ett isberg.
**Värde:** Högt OM landslag byggs — men chipet är inte skälet att bygga landslag.

**Detta är inte en krok att fylla — det är ett feature att besluta om.** Landslag kräver:
uttagningslogik (vilka spelare, vilken takt), en kalender (samlingar krockar med ligan),
konsekvenser (spelare borta, trötta, skadade på landslagsuppdrag), och narrativ (uttagen/
förbigången). Chipet ("🇸🇪 Uttagen" / lobby-chip för förbigångna) är sista 30 minuterna
av det arbetet.

**Rekommendation:** Bygg INTE för chipets skull. Om landslag prioriteras som feature,
skriv en egen spec då — och lägg chip-aktiveringen sist i den. Lämna kroken tom tills dess.

### F. Full lobby-kategorisering (Manager v1 + R1)
**Storlek:** Stort. Fas 2 byggde en GROV lobby via `availability`-enumen (unhappy/
want_to_leave). Full lobby = spelare som aktivt begär saker (lön, speltid, uttagning) med
motiv, köade som beslut (decision-fatigue R1).
**Värde:** Högt OM Manager v1 byggs — det är en kärnmekanik, inte en chip.

**Detta är också ett feature, inte en krok.** Den grova versionen (Fas 2) räcker tills
Manager v1 finns. Full lobby kräver: ett krav-objekt per spelare (typ + motiv + deadline),
en förhandlings-/beslutsyta, konsekvenser vid nekande (moral, lobby eskalerar, want_to_leave),
och integration med decision-fatigue-kön.

**Rekommendation:** Bygg INTE för chipets skull. När Manager v1 specas, lägg lobby-
kategoriseringen där. Den grova `availability`-chippen i Fas 2 håller tills dess.

---

## PRIORITERINGSORDNING (Opus rekommendation — UPPDATERAD efter Code-rapporter)

Rapporterna omkullkastade den ursprungliga ordningen. Faktisk byggbarhet nu:

1. **Manager-anteckning** (Tier 1A) — byggs nu (Code kör). Minst, högst värde, noll beroenden.
2. **Anniversary-eko** (Tier 2D) — BYGGBAR NU. Rapport: `subjectPlayerId` finns redan, ren
   render. Opus har skrivit eko-formlerna. Nästa efter manager-anteckningen.
3. **Squad-pulse** (Tier 2C) — BLOCKERAD på två beslut: (a) Jacobs scope-val (enkel
   kondition-sparkline vs full `teamFitnessHistory` — Opus rek: full eller skjut upp),
   (b) Design ritar hero-visualiseringen. Inte byggbar förrän båda klara.
4. **Klacken-favorit** (Tier 1B) — NEDPRIORITERAD. Rapport: Klack-systemet skriver inte
   narrativeLog, kräver ny `'klack'`-typ eller flagga. Inte 1h. Tas med Klack-narrativ.
5. **Landslag + Lobby v1** (Tier 3) — egna features. Speca separat. Bygg ALDRIG för chipet.

Kvar att besluta innan vidare bygge: Jacobs scope-val på squad-pulse (i/ii), och om
anniversary-eko ska byggas direkt efter manager-anteckningen (Opus rek: ja, den är mogen).
En ny Code-rapport behövs för anniversary: vilka `type`-värden förekommer med spelar-id,
så Opus kan komplettera eko-formlerna per typ.

---

## SURFACE — vad som går till Design, vad som inte gör det

Inte allt här är mekanik. Två punkter är genuina designfrågor som Opus inte ska låsa ensam:

**Går till Design:**
- **Squad-pulse-visualisering (C).** Hero-sparkline överst i NU-vyn är en NY visuell
  komponent — placering, storlek, hur komponenterna (fitness/moral/skador) visas vid tap,
  hur den förhåller sig till status-korten under. Design ritar innan Code bygger. (Formeln
  i sig — viktningen — är Opus+Design tillsammans; uttrycket är Design.) EJ BESVARAD än —
  går till Design när squad-pulse prioriteras (steg 2).

**Besvarad av Design (låst):**
- **Manager-anteckningens edit-yta (A).** MODAL, inte long-press/inline. Inline-textarea
  i hero-blockets botten, read-only italic-rad i listan utan edit-affordance, ingen
  auto-scroll till anteckningen. Detaljer inflätade i Tier 1A ovan.

**Går INTE till Design (ren tillämpning av etablerat språk):**
- Klacken-favorit-chip (B) och anniversary-eko (D) följer chip- resp. italic-rad-mönstret
  som Fas 1–2 redan etablerade. Tillämpning, inte ny design.
- Manager-anteckningens datamodell + render-rad (A) — mekanik, Code.
- Landslag + Lobby v1 (E, F) — designfrågan är inte aktuell förrän featuren beslutas.

**Praktiskt:** Eftersom manager-anteckningen byggs först, är den ENDA omedelbara Design-
frågan dess edit-yta. Squad-pulse-visualiseringen går till Design när den prioriteras
(steg 2), inte nu. Skicka inte hela specen till Design — bara den aktuella frågan.

— Opus, 2026-05-24
