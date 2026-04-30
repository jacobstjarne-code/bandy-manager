# PLAYTEST_2026-04-28_kvall — Akuta visuella fel i Portal omgång 1

**Sessionens kontext:** Jacob spelade igång appen efter tre nya specer levererade (Kapitel A + B + C). Första vyn (omgång 1, säsong 1, ny manager Forsbacka) visar flera kritiska visuella och arkitekturella fel. Spelet är inte spelbart i nuvarande tillstånd för en ny användare.

**Bilaga:** Skärmdump bifogad separat (`Skärmavbild_2026-04-28_kl__14_36_22.png`).

---

## STATUS efter Code-fix-runda 1 (2026-04-28 14:55)

**Verifierat fixat:**
- ✅ #1 NextMatchCard har dark-tokens
- ✅ #2 "SLUTFÖR PÅGÅENDE FLÖDE"-banner borta

**Kvarstår (verifierat i ny skärmdump 14:55):**
- ❌ #3 Stor grå layouttomhet under Portal-content + ovanför BottomNav

**Nya fel funna i andra skärmdump (Gagnef cup R1):**
- #9 Klubbsköldar renderar bara symbol, inte klubbnamn-text (Gagnef-text saknas, motståndare visar bara "Pragmatiker")
- #10 Horisontellt streck mitt i NextMatchCard — separator mellan "EN MATCH AVGÖR/NEUTRAL PLAN"-knapprad och "VÄLJ TRUPP"-knapp som inte fyller ngn meningsfull funktion

---

## Akuta fel (måste fixas innan vidare playtest)

### 1. NextMatchCard har vit bakgrund mot mörk Portal-bakgrund

**Vad:** I Portal-vyn omgång 1 har NextMatchCard ljus-tema-bakgrund (vitt kort med svart text). Den krockar visuellt med Portals mörka bakgrund (`var(--bg-portal)`).

**Rotorsak:** `NextMatchPrimary` wrappar befintlig `NextMatchCard` (från `components/dashboard/`). NextMatchCard byggdes för DashboardScreen som hade ljus bakgrund — den använder `card-sharp`-klassen med vit fyllning. När den nu renderas i Portal som har mörk bakgrund blir resultatet en ljus klimphalm.

**Fix:** Två alternativ:
- **A)** Skapa Portal-specifik variant `NextMatchCardPortal.tsx` med dark-tokens som ersätter den ljusa NextMatchCard inne i NextMatchPrimary
- **B)** Lägg till en prop `theme: 'light' | 'dark'` på NextMatchCard som styr tokens, default 'light' för bakåtkompatibilitet, 'dark' i Portal

Rekommendation: A. Skäl: NextMatchCard har 100+ rader styling som behöver bytas. Att bygga en Portal-variant ger ren separation och bryter inte befintlig kod.

### 2. "SLUTFÖR PÅGÅENDE FLÖDE"-banner visas utan kontext

**Vad:** En vit banner med text "SLUTFÖR PÅGÅENDE FLÖDE" visas mellan Portal-content och BottomNav. Den är klickbar men oförklarad. Spelaren vet inte vad det "pågående flödet" är.

**Rotorsak:** Troligen `useNavigationLock` (LESSONS.md #8) som indikerar att en oavslutad scen eller flöde finns på `game.pendingScreen`. Vid nytt spel kan detta vara restmaterial från BoardMeeting → PreSeason-övergången, eller en scen som inte rensades korrekt.

**Fix:** Kontrollera `game.pendingScreen`-värde vid nytt spel. Om det är satt utan att en scen faktiskt renderas är det en bugg. Felsök:
1. `console.log(game.pendingScreen)` vid PortalScreen-render
2. Identifiera var `pendingScreen` sätts vid intro-flödet
3. Antingen rensa korrekt eller rendera scenen som banner pekar på

### 3. Stort tomt grått layoutfält mellan Portal-content och bottom

**Vad:** Ett stort grått (vit) tomrum syns mellan `+ Akademi · Cup · Klacken · Andra matcher`-knappen och `SLUTFÖR PÅGÅENDE FLÖDE`-bannern. Det är inte design — det är en arkitekturell krock.

**Rotorsak:** Hypotes: PortalScreen renderar inom GameShell som också renderar något annat (DashboardScreen-fragment, padding från gammalt layout-system, eller route-wrapper). Det ljusa tomrummet är troligen `body`-bakgrund som lyser igenom ett hål i komponentträdet.

**Fix:** Verifiera komponentträdet:
1. Inspektera DOM med browser-devtools på den vita arean
2. Identifiera vilken komponent (eller wrapper) genererar den
3. Antingen ta bort den, sätt bakgrund till `var(--bg-portal)`, eller ändra layoutsättning så Portal fyller höjden

### 4. Fasindikator (FÖRBERED · SPELA · GRANSKA) renderas tillsammans med Portal

**Vad:** Den gamla fasindikatorn från DESIGN_SYSTEM.md sektion 3 renderas överst i Portal-vyn. Den är arkitekturellt en del av det gamla dashboard-paradigmet (Förbered → Spela → Granska som omgångscykel) — Portal är en annan paradigm (bag-of-cards som kontextuell vy).

**Rotorsak:** PhaseIndicator renderas i GameHeader (eller motsvarande shell-komponent) som omsluter alla skärmar oavsett om Portal är aktiv eller inte.

**Fix:** Beslut behövs:
- **A)** Behåll PhaseIndicator i alla vyer (även Portal). Skäl: konsistens, spelaren vet alltid var hen är i omgångscykeln.
- **B)** Göm PhaseIndicator när Portal är aktiv. Skäl: Portal är bag-of-cards, inte dashboard — fasindikatorn lägger till visuell brus utan att tillföra information som inte redan finns i Portal-cards.

Opus rekommenderar **A** för Fas 1 (mindre arbete, bibehåller orientering). Diskutera med Jacob om B är önskvärt senare.

### 5. "FÖRRA UPPST."-tag visas i NextMatchCard omgång 1 säsong 1

**Vad:** NextMatchCard visar tag "FÖRRA UPPST." trots att det är första omgången i nya manager-spelet. Det finns ingen "förra uppställning" att referera till.

**Rotorsak:** Troligen att `getLineupState`-logiken returnerar 'auto-carryover' (DESIGN_SYSTEM.md sektion 17) som default när `lineupConfirmedThisRound` är false, utan att kontrollera att en föregående uppställning faktiskt existerar.

**Fix:** I `getLineupState` (eller motsvarande) — verifiera att det finns en tidigare lineup. Om `game.currentSeason === 1 && game.currentMatchday === 1` ELLER om ingen lineup någonsin valts, returnera 'no-lineup'-state istället ("Välj trupp").

### 6. Heros visas som 4:e plats i tabellen omgång 1

**Vad:** I NextMatchCard visas "Heros 4:E" som tabellplacering trots att ingen omgång spelats än.

**Rotorsak:** Tabell-beräkningen sorterar antagligen klubbar baserat på initial-rep eller hard-coded ordning innan första omgången. Ger ologiska placeringar.

**Fix:** Före första omgången ska tabellplaceringar visas som streck (—) eller döljas helt. Sätt fixed condition: `if (game.currentMatchday === 1 && game.currentSeason === 1) → showPlaceholder`.

---

## Mindre fel (bör fixas men inte akut)

### 7. Klacken-citat "sitter på samma plats sedan 1997" för ny klubb

**Vad:** Järnklacken-citatet visas som "Jag sitter på samma plats sedan 1997. Det ändrar jag inte på." när spelaren precis börjat sin första säsong.

**Inte ett tekniskt fel** — citatet är generiskt och tidsoberoende från klackens perspektiv. Men *kontextuellt* fel: spelaren har ingen relation till klacken än. Citatet förutsätter en kontinuitet som inte finns för spelaren.

**Inget krav på fix nu.** Markera som "design-iteration när Klacken-Fas-2 byggs".

### 8. "+ Akademi · Cup · Klacken · Andra matcher" som dashed border-knapp

**Vad:** "Mer info"-fold renderas som en streckad-border-knapp. Funktionellt sett är den en placeholder (`onClick={() => {/* TODO: expandera MoreInfoFold */}}` enligt PortalScreen-koden).

**Inte akut, men:** TODO-kommentaren betyder att den inte gör något när den klickas. Antingen implementera fold-logiken eller ta bort knappen helt.

---

## Metaobservation från Opus

Detta är *exakt* vad pixel-jämförelse-protokollet ska fånga. Code rapporterade "inga pixel-avvikelser" på Kapitel B och C — men ingen visuell verifiering av Portal-skärmen i sig själv har gjorts denna session. Smoke-testet var "kod-verifierad simulation, browser ej tillgänglig."

Princip 4 i CLAUDE.md är på plats men har inte tillämpats på *grundvyn* (Portal omgång 1) — bara på de nya komponenterna i sprintarna.

**Lärdom till CLAUDE.md (kandidat för LESSONS.md):** Pixel-jämförelse måste inkludera *integrations-vyer* där den nya komponenten visas tillsammans med befintlig UI. Det räcker inte att verifiera den nya komponenten i isolation. Det är när Portal renderas tillsammans med wrappade legacy-komponenter (NextMatchCard) som de verkliga problemen syns.

---

## Hur Code ska prioritera fixarna

**Akut prio 1 (denna session):**
- Fel #1 (vit NextMatchCard) — blockerar visuell upplevelse
- Fel #2 (SLUTFÖR PÅGÅENDE FLÖDE) — blockerar funktionalitet
- Fel #3 (grå layouttomhet) — blockerar visuell upplevelse

**Prio 2 (innan playtest fortsätter):**
- Fel #4 (fasindikator) — diskutera A/B med Jacob först
- Fel #5 (FÖRRA UPPST. omgång 1)
- Fel #6 (Heros 4:e omgång 1)

**Prio 3 (lägg i ATGARDSBANK):**
- Fel #7 (klacken-citat-kontext)
- Fel #8 (TODO MoreInfoFold)

---

## Slut PLAYTEST_2026-04-28_kvall
