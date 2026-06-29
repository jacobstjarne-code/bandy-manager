# ⛔ HISTORISK — status i `docs/BACKLOG.md`. BYGG INTE PÅ DENNA.

**Dödmarkerad 2026-06-21 (Opus, process-fil-genomgången).** RC-moment-bedömning 2026-06-14. Nästan allt levererat: GAP-1/2/4 ✅, RC-blockerande 1–9 ✅, RC-polish (primitiver/HIDDEN_PATHS/svep/pensionsval/klack-8a) ✅, fanMood-8b ✅ (KF8), T1+T2 ✅. Tre latenta trådar som INTE var RC-blockerande migrerade till **BACKLOG D-RC** (GAP-5 save-bloat, T3 round-trip-test, kartfynd-14 ekonomi-passivitet-verifiering). Avbrottsbudgeten (post 17) lever som §D i KF-sektionen. **Statusfilen är `docs/BACKLOG.md`.** Lämnad som historik — värdefull som RC-strategins resonemang (DEL 0 dom, DEL 4 modellval), men inte status.

---

# RC-BEDÖMNING — Vägen till externt speltest

**Datum:** 2026-06-14 · **Av:** Opus · **Mål:** release candidate för externt speltest
**Underlag:** SYSTEMKARTA DEL 1–3 (14 kartfynd) + Design-Fables spelkänsle-rapport (2 säsonger) + verifieringar i koden 2026-06-14 (ErrorBoundary, saveGameMigration, persistens, supporterService, economyService).

> **Korrigering 2026-06-14:** kartfynd 8 var en sammanslagning av TVÅ separata känslomätare med olika rotorsaker — uppdelat nedan (klack-matchreaktion + fanMood-reversion). Kartfynd 14 (ekonomi-passivitet) tillagt. Verifierat i supporterService + communityProcessor + narrativeProcessor + economyService.

---

## DEL 0 · DOM

DEL 3-backloggen är rätt, men den är skriven för fel fråga. Den svarar på *"är spelet bra?"* — och svaret är nästan ja. En extern RC ställer en annan fråga: *"överlever spelet en främling som spelar ensam, på sin egen telefon, utan att du sitter bredvid?"* Den frågan har fyra svar som backloggen inte täcker, och de avgör om speltestet ger användbar data eller brus. De är billiga relativt sin betydelse. Med dem plus DEL 3:s röda tier är vi vid en RC.

Tre saker är redan verifierat starka och ska inte röras: **save/migration** (versionsstämplad, idempotent, tål gamla saves), **motorn/navet/minnet/ceremonierna** (båda källor), **rösten** (höll på två säsonger). Det är den dyra halvan av ett spel, och den är gjord.

---

## DEL 1 · GAP-ANALYS — det DEL 3 inte täckte (RC-blockerande)

Dessa är inte buggar i det byggda. De är frånvaro av det en extern testsession kräver. Var och en verifierad i koden där det går.

### GAP-1 · Kraschloopen (VERIFIERAD) 🟥
`ErrorBoundary` är rotmonterad men dess enda utväg är `window.location.reload()`. Ett render-fel som härrör ur save-staten (en edge-kombination i en spelares data) återkommer vid omladdning → testaren fastnar i en loop och sessionen dör utan att du ser det.
**Fix:** (a) felskärmen ska erbjuda "Tillbaka till huvudmenyn" som rensar pendingScreen/pendingScene/pendingEvent och renderar en säker yta — inte bara reload. (b) Auto-spara INNAN risk­operationer (round-advance, season-end) så en krasch aldrig kostar mer än en omgång. (c) Överväg en per-skärm boundary runt PortalScreen + MatchScreen så ett trasigt kort inte släcker hela appen. Arkitektur — högre modell (se DEL 4).

### GAP-2 · Ingen feedback-fångst (VERIFIERAD — sökning tom) 🟥
Det finns ingen väg för en testare att rapportera. Utan den är speltestdatan lossy: du får "det kändes konstigt nån gång" i efterhand istället för "build 678bf5d, säsong 2 omg 14, den här skärmen, det här hände".
**Fix:** en lättviktig "Rapportera"-knapp (finns redan en build-hash-overlay att bygga vidare på i App.tsx) som fångar build-hash + save-id + currentScreen + currentSeason/matchday + fritext, och antingen POSTar till en enkel endpoint eller exporterar en rad testaren mejlar. Detta 10-faldigar speltestets värde. Liten komponent — Sonnet, mot tydlig spec.

### GAP-3 · Färska ögon är instrumentet vi saknar 🟥 (process, ej kod)
Design sa onboarding är en styrka — men Design KAN spelet. Den enda granskning varken jag eller Design kan ge är en riktig förstagångsspelare som inte kan bandy, inte vet att orterna är fiktiva, inte kan tvåpoängssystemet. Det är precis vad det externa testet är till för. Men det måste instrumenteras, annars får vi intryck utan struktur.
**Fix:** en testar-ensidare (utanför koden): "det här är ett managerspel i fiktiva svenska bruksorter — gör dessa tre saker: ta dig genom din första match, ditt första transferfönster, din första säsong; rapportera var du fastnade." Plus: bestäm svårighetsgraden för säsong 1 (se GAP-6).

### GAP-4 · Laddningstillstånd på tunga operationer (EJ VERIFIERAD — Code kollar) 🟧
roundProcessor är 2000 rader, seasonEndProcessor 62 KB. På en riktig telefon kan round-advance/season-end ta märkbar tid. En frys utan spinner läses som krasch av en främling.
**Fix:** verifiera att round-advance och season-end har laddningsindikator; om inte, lägg en. Code rapporterar status innan ev. bygge.

### GAP-5 · Obegränsad tillväxt över säsonger (DELVIS KÄND) 🟧
freeAgents är fixad (kartfynd 7), inbox är känd (C2). Men clubMemory, storylines, scoreSnapshots, allTimeRecords, recentMoments, financeLog — växer någon av dem obegränsat och blåser upp saven / saktar rendering över många säsonger? Externa testare når sällan säsong 5+, så detta blockerar inte första testrundan, men det är en latent RC-defekt.
**Fix:** ingår i den headless-säsongsharness jag föreslår i DEL 3 — billigast att fånga där, inte manuellt.

### GAP-6 · Balans för en icke-expert (FRÅGA, ej defekt) 🟧
Du är expertspelare. Är säsong 1 vinnbar-men-inte-trivial för en främling? Förlorar testaren allt och får sparken i säsong 1 är första intrycket brän t; vinner hen ligan utan motstånd finns ingen spänning. Detta är en speltestfråga, men defaulten bör bestämmas medvetet före testet, och win/förlust/sparkad-frekvens bör loggas (kan ingå i feedback-fångsten, GAP-2).

---

## DEL 2 · DEL 3-BACKLOGGEN — omtierad för RC

Samma poster, omsorterade efter *skyddar detta speltestets datakvalitet*. Kosmetik som inte påverkar om testaren kan spela igenom flyttas ner.

### RC-BLOCKERANDE (måste vara grönt före extern testare)
1. **GAP-1 kraschloop** — utan detta dör sessioner osynligt.
2. **GAP-2 feedback-fångst** — utan detta är datan lossy.
3. **C1 endgame-kurering** (DEL 3 prio 1) — slutspelets "fel fokus" är det mest jarrande en testare möter.
4. **C2 notis-diet** (DEL 3 prio 6) — 59 olästa är ett trasigt-intryck som får inkorgen att se buggig ut.
5. **BUG-3/4 playoff-rensning** (rotorsakad) — fel rundtext i slutspelet bryter trovärdigheten i spelets höjdpunkt.
6. **BUG-1 straffrad** (rotorsakad) — 5–5-final utan straffutfall ser ut som en resultatbugg.
7. **BUG-5/6 minnesgenerator** (rotorsakad) — "cupfinal" om en semifinal, spökår, syns på Minne-fliken direkt.
8. **BUG-2 svart portal säsong 2** — varje testare som når säsong 2 ser den.
9. **GAP-4 laddningstillstånd** — perceived-crash-skydd.

### RC-POLISH (höjer kvaliteten, blockerar inte datan — kan ske parallellt/efter första rundan)
10. **Delade primitiver** (DEL 3 prio 7) + lagfoto-overflow (BUG-8) — bygg primitiven FÖRE svepen.
11. **HIDDEN_PATHS** BottomNav-svep (DEL 3 prio 8).
12. **Globala svep** (DEL 3 prio 12): emoji→Lucide, disabled B8, gold→copper, tomma kort, Klubb-kollaps, scoreboard-redundans, taktik-kontrast.
13. **Pensionsval → decision-card** (DEL 3 prio 11).
14. **Copy-pooler** (DEL 3 prio 13) — Opus skriver.
15. **processors/ Lager 2-textsvep** (kartfynd 9) — Opus dömer träffar.
16. **Klack-matchreaktion (KARTFYND 8a) — UPPFLYTTAD från våg 2.** `supporterGroup.mood` startar 60 och ändras ENBART av supporter-events (tifo, Sture/Elin-konflikt, Tommys brev, bortaresa — alla med supporterMood-deltan). Den saknar matchreaktion: ingen koppling från vinst/förlust/derby/annandagen till moodet. En sim-spelare som inte triggar sidoevents ser klacken parkerad på 60 hela säsongen (= exakt Designs observation). Setter:n (`adjustSupporterMood`) finns; pulsen (communityProcessor) har redan mönstret att kopiera. **Fix:** mata `adjustSupporterMood` på matchutfall i communityProcessor — vinst/storseger/derby upp, förlust ned, mindre magnitud än pulsen (klacken är känsligare men smärre grupp). Liten, RC-värd: lyfter en signaturmätare från "står still om du inte petar" till "lever med laget". Sonnet mot denna spec.

### VÅG 2 (efter RC, mot speltestets data)
17. **Avbrottsbudget** (DEL 3 prio 9 = kartfynd 3) — wira interruptClassifier; gallra beslut, ej narrativ. Stort, korsar attentionRouter.
18. **fanMood reversion (KARTFYND 8b)** — `fanMood` (publiken, biljettintäkt) är ren symmetrisk delta i narrativeProcessor (storseger +8 … storförlust −8), INGEN reversion/asymmetri — kan parkeras i taket. Skild från 8a: 8a är klacken (saknar matchreaktion), 8b är publiken (har matchreaktion men ingen reversion). Opus specar kurvan mot speltestdata (pulsens modell: reversion mot ~50 + diminishing returns nära taket). Väntar på genomspelningens sifferunderlag.
19. **GAP-5 tillväxt** — om headless-harnessen visar bloat.
20. **KARTFYND 14 — ekonomi-passivitet.** Verifierad i economyService: garanterad intäktsbotten (`weeklyBase = 3000 + rep×50`) + passiv sponsorintäkt + dämpad kostnadssida (kommentarer visar weeklyBase höjd 2000→3000, arenakostnad sänkt 8→5 "broms spiral för medelklubbar"). Spiralskyddet blev en hängmatta: en passiv spelare (Jacobs Målilla-genomspelning, ~600k stabilt utan ingrepp) möts aldrig av en utgift som svarar mot ambition. **Diagnos:** ekonomin är inte trasig, den är passiv — belönar/bestraffar inte engagemang. **Fix (beslutad inriktning, Jacob 2026-06-14): ge kassan ett SYFTE, inte svältkur.** Anläggningsutgifterna (B1 med Orten-finansiering) är den primära motvikten — ett bygge som drar 210k efter kommunandel gör 600k till ett val. Verifiera med T2-harnessen: växer kassan monotont för en icke-aktiv spelare över 10 säsonger? Om ja — är anläggning + ev. löpande driftskostnad tillräcklig motvikt, eller behövs mer. INTE en svältkur på int.kterna (gör spelet stressigt utan att bli intressant).

---

## DEL 3 · TESTSTRATEGI — "på djupet"

Manuell genomspelning fångar upplevelse (Design gjorde det). Den fångar INTE invarianter och long-tail. Tre tester ger djupet:

### T1 · Determinism-regressionstest (HÖGST VÄRDE) 🟥
Math.random-fixen (kartfynd 10) återställde determinism-kontraktet — men inget skyddar det från att tyst regrera nästa gång någon skriver simuleringskod. Test: samma seed → identiskt matchutfall (score, events, ratings) över två körningar. Och: ladda samma save, spela samma omgång två gånger, assertera identiskt. Detta är den enskilt viktigaste testen för att fixen ska hålla.

### T2 · Headless flersäsongs-harness (DJUP-MULTIPLIKATORN) 🟥
roundProcessor/seasonEndProcessor är tillräckligt rena för att köras utan UI. Ett skript som simulerar 10 säsonger och asserterar: ingen krasch, bounded save-storlek (fångar GAP-5), inga NaN/negativa i finances/mätare, alla klubbar har giltig trupp (positionsminima), licens/nedflyttning beter sig. Detta fångar en hel klass av säsong-3+-fel som ingen manuell genomspelning når, på sekunder. Bygg den EN gång; kör den i CI.

### T3 · Save round-trip (migrationsskydd) 🟧
export → reimport → assertera ekvivalens; och: ladda en hårdkodad gammal-version-fixtur och assertera att migrateSaveGame ger giltig SaveGame utan kast. Skyddar det mogna save-systemet mot framtida schemaändringar.

Det finns redan en testkultur (`__tests__` överallt) — luta er mot den. T1 och T2 före extern testare; T3 kan följa.

---

## DEL 4 · MODELLVAL FÖR CODE

Determinism-buggen är beviset som styr rådet: fem osådda `Math.random()` i en annars seedad kodbas. Var och en var lokalt rimlig; tillsammans bröt de en kodbasövergripande invariant. **Sonnet är stark på lokal korrekthet mot tydlig spec, svagare på globala invarianter och genomskärande arkitektur.** Därav delningen:

**Högre modell (Opus-tier) för — där ett felbeslut propagerar:**
- **GAP-1 kraschloop/error-boundary-omarbetningen** — app-vid blast radius, arkitektur.
- **Avbrottsbudgeten (våg 2)** — korsar attentionRouter + flera kanaler, lätt att bryta serialiseringen som höll.
- **Delade primitiver-ARKITEKTUREN** (prio 10) — definiera kontraktet EN gång rätt. Designs eget mönster ("global svep sitter halvgjort där route:n rörts") är beviset att route-för-route degraderar. Högre modell sätter primitiven; Sonnet sveper sedan call-sites mot den.
- **Headless-harnessen (T2)** — kräver helhetsgrepp om vad som kan växa/krascha över säsonger.
- **Live-debugging under speltestet** där rotorsak är okänd.

**Sonnet för — bredd mot tydlig spec:**
- De rotorsakade buggarna (BUG-1/3/4/5/6 + soft-lock) — rotorsaken är redan gjord, fixarna är enpunkts.
- Mekaniska svep när primitiven finns (prio 12).
- Formelimplementation när Opus specat (fanMood-reversion 8b, klack-matchreaktion 8a).
- Feedback-knappen (GAP-2), laddningstillstånd (GAP-4), determinism-testet (T1).

**Opus direkt (via workspace) för:**
- All svensk text/copy (redan regeln).
- fanMood-kurvans spec.
- Granska avbrudsbudget-diffen och primitive-kontraktet före commit.

Tumregel till Code: **låt Sonnet ta bredden, reservera den högre modellen för de tre–fyra ställen där ett fel sprider sig** — invarianter, genomskärande wiring, arkitektur som allt annat sveper mot.

---

## DEL 5 · SEKVENS TILL RC

1. **Code (Sonnet):** RC-blockerande buggar 5–8 (rotorsakade, enpunkts) + GAP-4 verifiering. Rapportera hash per fix.
2. **Code (högre modell):** GAP-1 kraschloop-omarbetning + GAP-2 feedback-fångst-arkitektur. Opus granskar.
3. **Code (Sonnet):** C2 notis-diet (aggregering + säsongsnollställning).
4. **Code (högre modell):** C1 endgame-kurering (R3-specen) — eller Opus specar, Sonnet bygger mot spec.
5. **Code (högre modell):** T1 + T2-testerna. Kör T2 → åtgärda vad den hittar.
6. **Jacob:** testar-ensidaren (GAP-3) + svårighetsbeslut (GAP-6).
7. → **Intern genomspelning mot grönt** → om ren: **RC, extern testare.**
8. RC-polish (10–15) och våg 2 (16–18) parallellt/efter.

— Opus, 2026-06-14
