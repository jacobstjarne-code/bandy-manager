# Bandy Manager — Project Instructions for Claude Code

## SESSIONSSTART — MINIMUM-LÄSNING (≤2 min) — OBLIGATORISKT

Detta dokument är 3500+ rader. Det är NÄR-DU-BEHÖVER-läsning, inte sessionsstart-läsning. Vid sessionsstart läser du minimum nedan, sedan vidare beroende på uppgiftstyp.

### Varje session, alltid (2 steg):

1. **Tid:** `web_search "current time Stockholm"` följt av `web_fetch` på en sida i resultaten där datum/tid renderas i HTML (time.io, timeanddate.com fungerar). Försök inte gissa API-URL:er — `web_fetch` accepterar bara URL:er som dykt upp i sökresultat eller angetts av Jacob. Skriv överst: `2026-04-22, onsdag morgon (09:41 CEST)`. Om tids-sidan inte svarar — fråga Jacob. Förhåll dig till timestampen när du refererar till tid.

2. **Workspace-check:** kör `tool_search` för att se vilka filsystem-verktyg som är tillgängliga i sessionen (read/write/edit/list). Olika sessioner har olika åtkomst — verifiera, anta inte.

3. **BYGGT-MEN-OSYNLIGT — läs FÖRE du spårar kod.** Öppna `docs/BACKLOG.md` och läs (a) listan "BYGGT MEN OSYNLIGT/ONÅBART" överst och (b) sektion A (aktiva sprintar + sessionsfynd). Detta är obligatoriskt, inte orientering-vid-behov. **Hård regel:** om Jacob frågar om något kan vara byggt-men-osynligt, parkerat, halvfärdigt, eller "finns det redan?" — sök svaret i BACKLOG.md FÖRST, innan du grep:ar koden. Koden visar vad som finns; BACKLOG visar vad vi *vet* om vad som finns och varför det ser ut som det gör. Att spåra fram ett svar ur koden som redan står i BACKLOG är det dyraste felet i det här projektet — det får Jacob att tro att en sak är bortglömd när den är loggad, och tvärtom. Verifiera mot koden EFTER att du läst BACKLOG, inte istället för.

### Innan du börjar arbeta — välj uppgiftstyp:

**A. PLAYTEST-PATCH (bugg från användarrapport):**
- `docs/LESSONS.md` — sök på keyword från buggen. Om mönster finns, använd lärdomen först
- Direkt till koden, grep på relevanta termer

**B. SPEC-SKRIVANDE (ny feature) — OBLIGATORISKT:**
- **PRE-SPEC CROSS-CHECK (Princip 2 nedan):** grep efter befintlig implementation INNAN du skriver:
  ```bash
  grep -rn "huvudkoncept\|relaterat_koncept" src/domain/services \
    src/domain/data src/domain/entities --include="*.ts" | head -20
  ```
  - Träff → läs existerande implementation FÖRST, återanvänd eller medvetet ersätt
  - Ingen träff → grep bredare innan du börjar skriva
- Om specen berör flera services eller domain-entiteter — slå upp `CLAUDE_REFERENCE.md` → Key Files-listan för att se vilka filer som är "huvudet" innan du grep:ar. Sparar onödiga sökrundor och ger mer informerad grep-query.
- `docs/DECISIONS.md` — arkitekturbeslut relevanta för featuren
- Läs Princip 1–4 i "DESIGNPRINCIPER — LÄS FÖRE SPEC"-sektionen längre ned
- **Synlighetsregel:** första svaret i en spec-skrivande session börjar med en kort PRE-SPEC-rapport: "grep:ade på [X] i src/domain — fann [Y, Z]". Då ser Jacob om disciplinen följdes innan spec levererades.

**C. SKRIVUPPGIFT (svensk text, textpool, brev, citat, ansökningar):**
- `docs/WRITING_GUIDELINES_BANDY_MANAGER.md` — tonregler, max 10 citat per block (Lärdom #7)
- `docs/STRINGS_POOL_INVENTORY.md` — vilka pools finns redan, återanvänd struktur
- `docs/SPEC_CUP_ANSLAG_2026-05-08.md` om cup-relaterat
- Två-tre befintliga textpool-filer för mönsterläsning
- Inte plocka strängar — läs helhet

**D. UI-ARBETE:**
- `design-system/CODE-OPUS-INSTRUCTION.md` (auktoritativ, `docs/DESIGN_SYSTEM.md` är arkiverad)
- Senaste mock om finns i `docs/mockups/`
- **Leverans-ingång (juni 2026):** `docs/mockups/CODE-LEVERANS-2026-06-07.md` — enda startpunkten för konsekvens/R2/Q-arbetet + illustration + efterlevnad. Listar byggordning och de fem försoningarna som vinner över äldre dokument. Beslut i `design-system/DESIGN-DECISIONS.md`.
- **Design-efterlevnad (före UI-commit):** inga råa `rgba()`/hex/off-scale-radie i `src/` — bara tokens (`color-mix(in srgb, var(--token) N%, transparent)`, radie 14/8/3, z-skala). Citera DB:t du konformar mot. När `npm run lint:design` finns: kör den och låt den vara grön innan commit. Tokens är enda API:t mot paletten — råvärden är en bugg, inte en genväg.

**E. THE_BOMB-FRÅGOR:**
- `docs/THE_BOMB.md` (vision)
- `docs/THE_BOMB_STATUS_2026-04-26.md` (kod-verifierad status per subprojekt)

**F. ARKITEKTUR / KEY FILES / BANDY-REGLER (slå-upp-vid-behov):**
- `CLAUDE_REFERENCE.md` — läsbar referensfil med arkitektur-overview, bandy-specifika regler, key files, kalibreringsdata, Bandy-Brain-kunskapsbasen. För dessa: läs `CLAUDE_REFERENCE.md` istället för att grep:a `CLAUDE.md`.

**G. BANDY-ANALYS / DATA / BRAIN / RESONEMANG OM SPORTEN — OBLIGATORISK KUNSKAPSBAS:**
Innan du resonerar om bandyns regler, tolkar matchhändelser, eller drar slutsatser ur Bandygrytan-datan — läs:
- `docs/kunskapsbas/REGLER.md` — bandyns regler (stabil referens). Utvisningar, straffar, hörnor, förlängning, dam-undantag.
- `docs/kunskapsbas/DATA.md` — vad Bandygrytan-datan faktiskt innehåller, fält för fält. Särskilt: minute-konventionen och half-flaggan.
- `docs/kunskapsbas/LAGET.md` — nuläget i svensk bandy (FÖRÅLDRAS — kolla datumstämpeln, verifiera med web-sökning om gammal).

**Gissa aldrig om en bandyregel eller ett datafält — slå upp i kunskapsbasen först.** Tre felkällor (minute-konventionen, foul-team-attributionen, foul-duration) uppstod i maj 2026 just genom att gissa utifrån fältnamn istället för att verifiera. Kunskapsbasen är försvaret mot den klassen av fel.

### Backlog & historik — orientering:

- `docs/BACKLOG.md` — ENDA SANNING för "specat men ej byggt" + "idéer som ska bli spec" (etablerad 2026-05-17). Läses vid sessionsstart (steg 3 ovan), inte bara vid behov. När något parkeras (Opus säger "framtid" eller "senare") skrivs det in här SAMMA session, inte vid tillfälle. **När något byggs som domän-utan-yta (logik finns, ingen scen/route/vy läser den) eller medvetet skjuts upp — skriv en rad i "BYGGT MEN OSYNLIGT/ONÅBART"-listan överst i BACKLOG samma session, med vad/varför/stäng-villkor/ägare.** En parkering utan rad i den listan finns inte — den är bara bortglömd, och då springer Jacob på den av en slump månader senare. Vid stor sprint-start scannas BACKLOG för relaterade idéer som kan packas samman.
- `docs/KVAR.md` — historisk logg av leveranser (kronologisk). KVAR är vad SOM HÄNT, BACKLOG är vad som ska göras. Inte samma sak.
- Senaste `docs/HANDOVER_YYYY-MM-DD.md` — dagsläge från föregående session.
- Aktuell sprintfil i `docs/sprints/`.

### Vid första missen i sessionen — STANNA OCH LÄS

Om Design-Claude eller Jacob påpekar att en befintlig fil/system missades: STOPPA. Läs Princip 1–4 (DESIGNPRINCIPER nedan) + de avsnitt i LESSONS.md som matchar uppgiften, innan du fortsätter. En miss = signal att disciplin brutits. Två missar i samma session = signal att hela sessionens approach är fel — gör om sessionsstart-läsningen istället för att fortsätta producera.

---

## SVENSK TEXT — CODE SKRIVER ALDRIG (HÅRD REGEL)

All svensk spelartext (anslag, kafferum, klack, pressfrågor, signature-facts, eventtexter, brev, citat) skrivs av Opus direkt — ALDRIG av Code.

**När ett textfält är markerat `// Opus levererar`:**
- Lämna varianter-arrayen TOM. Skriv ALDRIG egen svensk prosa som placeholder, inte ens "temporär" eller "funktionell" text.
- Om en komponent kraschar utan text — det är ACCEPTABELT. Hellre synlig krasch som Opus fyller inom 24h än felaktig ton som blir kvar i kodbasen.
- Om du behöver en placeholder för att kompilera: använd `'[Opus]'` som enda sträng. Aldrig en hel mening.

**Varför:** Code-skriven svensk text har genomgående fel ton (generisk AI-prosa istället för bandysvensk understatement). Varje sådan text kostar en Opus-omskrivningsrunda i efterhand. 2026-05-20 bröts detta tre gånger samma dag (PLAYOFF_ANSLAG, spectator-pools, SeasonSignature observedFacts) — alla tre krävde omskrivning. Att lämna tomt är billigare än att jaga placeholders.

**Diskvalificerande exempel** (Code skrev, Opus fick skriva om): "Det gör ont precis lagom mycket för att något ska bli annorlunda." Bandysvensk understatement säger samma sak med konkret bild: "Pålsson avgjorde med fyra minuter kvar. Hallen tystnade."

---

## VID SESSIONSSLUT

Skriv eller uppdatera `docs/HANDOVER_YYYY-MM-DD.md` med:
- Vad som levererades och vilka commits
- Aktiva jobb som pågår
- Nyckelbeslut fattade idag
- Kvarstående frågor
- Föreslagen ordning för nästa session

Format: ren markdown (.md), inte RTF eller annat.

---

## ROTORSAK FÖRE FIX — OBLIGATORISKT

Innan kod ändras för att fixa en bugg, formulera i EN mening VARFÖR buggen uppstod. Om du inte kan formulera det — läs mer kod innan du rör något.

Commit-meddelande ska innehålla rotorsaken:

**Rätt:**
```
fix: shotmap prickar klumpade — rot: nextPos('goal') y-range var
20-70 istf 10-90 så alla skott hamnade i målområdet
```

**Fel:**
```
fix: shotmap prickar klumpade — justerade koordinater
```

---

## SJÄLVAUDIT EFTER VARJE SPRINT — OBLIGATORISKT

Ingen sprint får markeras klar utan `docs/sprints/SPRINT_XX_AUDIT.md`.

Mall:

```markdown
# Sprint XX — audit

## Punkter i spec
- [x] 22A Spelarkort-modal scroll — verifierat i: PlayerModal öppnad från Trupp-vy, scrollade hela vägen till EGENSKAPER
- [x] 22B Porträtt-koordinater — verifierat i: Trupp-vy (22px cirklar) + PlayerModal (stor version), ansikten centrerade
- [ ] 22C Trupp-flikar — INTE LEVERERAD, orsak: [beskrivning]
- ...

## Observerat i UI
Öppnade appen som ny manager i Målilla. Navigerade:
- Dashboard → syns normalt
- Trupp → filter + flikar (Startelva/Bänken/Reserv) synliga, klickbart
- PlayerModal → öppnar korrekt som overlay, scrollar till botten
- ...

## Ej levererat (med orsak)
[punkter som inte gick att slutföra — VARFÖR, inte vad]

## Nya lärdomar till LESSONS.md
[om någon bugg i denna sprint matchade ett mönster som borde loggas]
```

"Verifierat i" ska vara en konkret observation i appen, inte "komponenten finns i filen".

### ALTERNATIV: KOD-VERIFIERAD SIMULATION

När manuell playtest inte är praktiskt (t.ex. text-/data-tunga sprintar där utfallet kräver specifika trigger-villkor som tar lång tid att framkalla i live-spel) får Code använda kod-verifierad simulation som audit-form.

**Vad det innebär:** Code skriver ett kort test-script eller kör befintlig stress-infrastruktur som triggar relevanta villkor och dumpar exempel-output från varje system specen berör. Output kopieras in i auditen som bevis.

**Krav för att kod-verifierad simulation ska räknas:**
1. **Konkret output per spec-punkt.** Inte bara "funktionen anropas" — faktisk genererad sträng/state visas.
2. **Edge-cases verifierade.** Lista vilka villkor som testats (t.ex. "tom lookup-array", "villkor som ska filtreras bort", "förra säsongens data").
3. **Reproducerbart med seed/parametrar.** Någon ska kunna köra om samma test och få motsvarande resultat.

**Mall för kod-verifierad audit:**

```markdown
# Sprint XX — audit

## Punkter i spec
- [x] Del 1 [system] — verifierat via simulation: [konkret output-exempel]
- [x] Del 2 [system] — verifierat via simulation: [konkret output-exempel]
- ...

## Kod-verifiering
- 1895/1895 grönt
- Build ren
- Stresstest: [resultat eller "ej kört, motivering"]

## Edge-cases verifierade
- [Edge-case 1]: [hur det testades, utfall]
- [Edge-case 2]: ...

## Ej verifierat / antaganden
[lista vad som inte gick att simulera och varför — ska tas i nästa playtest]
```

**När manuell playtest är obligatorisk (kod-simulation räcker INTE):**
- Visuella ändringar (layout, färger, animationer, scroll-beteende)
- UX-flöden där interaktion/timing/feedback är poängen
- Sprintar som berör MatchLiveScreen-rendering eller andra perception-tunga vyer

För dessa: kod-simulation kan komplettera men ersatter inte manuell verifiering. Markera som "awaiting playtest-verification" i KVAR.md tills Jacob hunnit playtesta.

**Notera:** Build + tester grönt är *teknisk* verifiering, inte audit. Audit kräver att man kan svara på frågan "vad ser spelaren?" — antingen via direkt observation eller via simulation som dumpar output.

**Historik:** Sprint 26 (2026-04-26) var första sprint där kod-verifierad simulation användes. Sprintens 65 nya strängar från fyra system krävde att skandalfönster triggades (omg 6-8/12-14/18-20/24-26) i specifika klubbar med specifika seeds för att se output — inte praktiskt i manuellt spel.

---

## ÅTERKOMMANDE BUGG — UPPDATERA LESSONS.md

Om en bugg uppträder 2+ gånger, eller om en ny bugg matchar ett mönster som redan finns i `docs/LESSONS.md` — uppdatera `LESSONS.md` innan fixen committeras. Lägg till under "Historik" i relevant lärdom, eller skapa ny lärdom om mönstret är nytt.

---

## DESIGN SYSTEM — LÄS FÖRST

**`design-system/CODE-OPUS-INSTRUCTION.md`** är auktoritativ källa för all UI-design. Läs den + `design-system/README.md` + `design-system/DESIGN-DECISIONS.md` INNAN du gör NÅGON visuell ändring.

**`docs/DESIGN_SYSTEM.md` är arkiverad.** Vid konflikt vinner alltid `design-system/`. Använd inte den gamla.

Snabbpekare i `design-system/`:
- `colors_and_type.css` — alla tokens (färg, type, spacing, radii, shadows, säsongsbakgrunder, scoreboard-LED)
- `preview/components-*.html` — komponentkanon (buttons, tags, cards, header, cta, bottomnav, nextmatch)
- `preview/brand-*.html` — logo, ikoner, badges
- `ui_kits/*/` — färdiga skärm-mockar (bandy-manager-pwa, intro_flode, trupp)
- `briefs/*-SPEC.md` — implementations-specs (ARRIVAL-SCENE, CHARACTER, CLUB, ICON)
- `HANDOFF.md` — outstanding to-do per godkänd designändring
- `SYNC.md` — design ↔ code synk-status

Kärnregler (hela listan i `design-system/README.md`):
- CSS-variabler ENBART — inga hårdkodade färger i `.tsx`
- `.card-sharp` (8px) för data, `.card-round` (14px) för narrativ — inga inline borderRadius
- Sektionslabels: 8px / 600 / +2px letter-spacing / UPPERCASE / emoji-prefix (`💰 EKONOMI`)
- En `.btn-primary` per skärm, max
- Inga vänster-border-accent-cards, inga gradient-bakgrunder, inga SaaS-skuggor
- Inga emoji på status-tags (men ja på sektionslabels och kategori-tags)
- 🏒 (inte ⚽), "plan" (inte rink), 2 pts/seger, MV/B/YH/MF/A
- Mobile-first 375–430px, ingen desktoplayout
- Inga rubriker på BottomNav-skärmar
- Events som overlay (zIndex 300) — inte egna routes

---

## INGA FEATURE FLAGS

Detta är ett en-utvecklare-spel. Jacob är beta-testare, dev-team och release-manager i samma person. Feature flags från större team-workflows har ingen bäring här — de skapar bara friktion.

**Regel:** När en feature levereras ska den vara **påslagen som default**. Inga `xEnabled: false`-flaggor som spelaren ska sätta via dev-console.

**Det betyder:**
- Ny feature levereras → `createNewGame.ts` har den på direkt
- Existerande saves migreras till påslaget tillstånd vid laddning, om det är en feature som påverkar core game state
- Om en feature kraschar eller känns trasig → fixa den, eller ta bort den. Inte gömma bakom flagga.

**Undantag:** Om en feature är genuint experimentell och Jacob explicit ber om att kunna toggla den (t.ex. för A/B-jämförelse av två designvarianter), då kan en flagga finnas tillfälligt. Men det är opt-in från Jacobs sida, inte default-beteende från Code.

**Historik:** 2026-04-27 levererade Code Scene-systemet med `scenesEnabled: false` som default. Jacob fick instruktion att redigera localStorage via dev-console för att slå på det. Detta var onödig friktion — Jacob *är* spelaren, inte en testare som ska skyddas från instabila features.

---

## DEPLOY (Vercel-MCP) — AUTOMATISK STATUS, HALVAUTOMATISK FIX

Vercel-MCP är ansluten (claude.ai-integrationen, `https://mcp.vercel.com`). Code kan deploya och läsa build-/runtime-loggar direkt — ingen manuell dashboard-koll, ingen copy-paste av felmeddelanden.

### Det som ALLTID är automatiskt
- Efter en RC-relevant push: deploya till en **preview**-URL, läs build-loggen, rapportera URL + build-status + hash. Detta är ren vinst och kräver inget go.
- Vid grön build: rapportera URL, klart.

### Vid FAILAD build — EN diagnostiserad retry, sen STANNA (hård regel)
En auto-fix-loop på byggfel har en känd failure-mode: modellen ser ett fel, gissar en fix, deployar om, ser ett nytt fel, gissar igen — och kan snurra flera deploys djupt på en feldiagnos. Värre: en "fix" som får bygget grönt är inte garanterat rätt (en `as any`, en bortkommenterad import tystar symptomet, löser inte orsaken — samma klass som Math.random-buggen: lokalt grönt, globalt fel). Därför:

1. Build failar → läs felmeddelandet via MCP, formulera rotorsaken i EN mening (samma krav som ROTORSAK FÖRE FIX).
2. Om rotorsaken är trivial och säker (glömd import, saknat tomt-värde, typfel med uppenbar fix): gör fixen, deploya OM **en gång**.
3. Om andra deployen också failar — eller om rotorsaken inte är trivial/säker — **STANNA**. Rapportera båda felen + din rotorsaksanalys till Jacob (eller Opus för diagnos). Gräv inte djupare på egen hand.
4. Tysta ALDRIG ett byggfel för att få grönt (`as any`, bortkommenterad kod, borttaget test). Ett grönt bygge som döljer ett riktigt fel är värre än ett rött.

Regeln i en mening: **deploya + läs status alltid automatiskt; vid fail, en diagnostiserad retry, sen stanna och rapportera.**

### Production-deploy KRÄVER Jacobs go
Code deployar **preview** fritt. **Production-deploy kräver Jacobs explicita ja** — en production-URL är vad externa testare får, det är ett releasebeslut, inte ett byggsteg. Vercel-account/domän-inställningar är Jacobs bord, inte Code:s.

### Runtime-loggar vid distansfelsökning (när extern RC är ute)
När en testare rapporterar via GAP-2-knappen (build-hash + skärm + fritext): matcha hash mot deploy, läs runtime-loggen för den sessionen. Rapport + logg = rotorsak utan repro-gissning.

---

## DESIGNPRINCIPER — LÄS FÖRE SPEC

Dessa fyra principer adresserar ett mönster vi observerat 2026-04: vi har bra dokumentation av *det som hänt*, men beslutsögonblicken (innan kod skrivs, innan spec klubbas) är otillräckligt strukturerade. Det är där missarna sker.

### 1. INBOX-PRINCIPEN

**Inbox dokumenterar, driver inte funktionalitet.**

En koppling som bara manifesterar sig som ny inbox-rad räknas inte som leverans. Riktig koppling = system A's händelse syns/ändrar text i system B's *vy* (kafferum, klack, presskonferens, granska-screen, dashboard-kort, motståndartränare, etc.).

**Konkret:**
- Skandal i kafferum (kioskvakten kommenterar) → räknas
- Skandal som inbox-rad → räknas inte som koppling till kafferum
- En feature som producerar inbox-text utan att synas någon annanstans är *halvbyggd*

**Historik:** Sprint 25h byggde 8 skandalarketyper med inbox-rader och kafferum-quote *som inbox-rad*. Skandalerna syntes inte i dashboard-kafferum, klack-commentary, eller pressfrågor. Spelaren såg dem inte i någon annan vy än inboxen. Sprint 26 åtgärdade detta i efterhand.

### 2. PRE-SPEC CROSS-CHECK

**Innan ny feature specas — sök efter befintlig implementation.**

För varje funktion/koncept i specen, grep efter motsvarande logik i kodbasen. Två tecken på redundansrisk:
- Funktionen har redan ett namn i kodbasen (sökord från specen ger träffar)
- Specen beskriver något "som inte finns" — verifiera, fråga inte din magkänsla

**Konkret check innan ny service/funktion skrivs:**
```bash
# 60-sekunders grep på huvudkonceptet:
grep -rn "keyword1\|keyword2" src/domain/services --include="*.ts" | head -20
```
Ingen träff → bygg. Träff → läs den först. Beslut: återanvänd eller medvetet ersätt med dokumenterad anledning.

**Historik:**
- *2026-04:* Strukturanalys missade att THE_BOMB 1.3 (kontextuell match-commentary för akademi/kapten/klackfavorit/dayJob) var fullt implementerad i `matchCore.ts`. En 30-sekunders grep på "promotedFromAcademy" hade visat det.
- *2026-04:* `pickSeasonHighlight()` finns i `seasonSummaryService.ts`. SeasonSummaryScreen renderar `summary.matchOfTheSeason`. Möjlig redundans — två mekanismer för samma sak.

### 3. INTEGRATION-COMPLETENESS-CHECK

**När en feature levererar narrativ data — lista vilka vyer som ska visa den.**

En feature som producerar text/state utan att specifikt koppla till relevanta UI-vyer är halvbyggd. Specen ska adressera *alla* logiska vyer eller medvetet välja vilka som lämnas utanför (med skäl).

**Konkret check innan sprint-spec skrivs:**

Lista alla vyer som logiskt borde påverkas av den nya featuren. Exempel för en "händelse i klubbvärlden"-feature:
- Inbox (alltid)
- Dashboard-kafferum (`coffeeRoomService.ts` — visas varje omgång)
- Klack-commentary (`matchCommentary.ts` `supporter_*`-categories)
- Presskonferens (`pressConferenceService.ts` QUESTIONS)
- Motståndartränaren (`opponentManagerService.ts`)
- Granska-screen (efter match)
- Daily briefing (om relevant)
- Tidningsrubriker (`mediaService.ts`)

Specen ska antingen:
- Adressera varje relevant vy explicit, ELLER
- Lista de som lämnas utanför med medveten anledning ("klacken har inte cross-trigger eftersom...")

**Historik:** Sprint 25h-skandaler byggdes utan att specen listade integration-vyer. Resultat: 4 vyer fick aldrig referenser. Adresserades i Sprint 26 men kostade en hel ny sprint.

### 4. MOCK-DRIVEN DESIGN

**När en feature är visuellt eller interaktivt komplex — mock först, kod sen. Mocken är kanon, inte ungefär.**

Detta adresserar ett mönster: Opus producerar fina visuella idéer och Code implementerar dem ungefärligt. Resultatet driver från målbilden — padding blir 14px istället för 16px, gradient blir "liknande" men inte exakt, layout matchar på storleksordning men inte i detalj. Över tid ackumuleras detta till en app som känns *generisk* trots att avsikten var distinkt.

Lösningen är att flytta visuella beslut till mock-stadiet, när de kan diskuteras innan de kodas.

**Opus ansvar (mocks):**
- När en feature är visuellt eller interaktivt distinkt (ny vy, omarbetad layout, ny interaktionspattern) — producera HTML-mock först i `docs/mockups/`.
- Mocken ska vara *interaktiv* där det går (knappar som visar olika tillstånd, kryssrutor som styr what-if-renderingar). En statisk bild duger inte när interaktion ingår.
- Mocken använder samma CSS-variabler som appen (`--accent`, `--text-primary`, etc) så värden är direkt portbara.
- En mock per design-paradigm (en mock för Portal, en för moments, en för inledning) — inte en per komponent.

**Code ansvar (implementation):**
- Läs mocken bredvid editorn, inte i minnet.
- Kopiera CSS-värden bokstavligen — padding, border-radius, font-storlekar, gradient-stops, opacity, gap, letter-spacing. Inte ungefärligt.
- **EN KOMPONENT ÅT GÅNGEN.** Skriv komponent N → pixel-jämför mot mocken → bifoga skärmdump i commit-meddelandet → skriv komponent N+1. Inte hela komponentträdet, sen verifiering. Inte heller "jag granskar alla efter att jag skrev dem". Pixel-jämförelse av komponent N **innan** komponent N+1 påbörjas.
- **CSS-token-disciplin på mörka komponenter.** Mörka scen-bakgrunder (`--bg-deepdark`, `--bg-dark`) får INTE använda ljusa tokens (`--bg-elevated`, `--text-secondary`, `--border` utan dark-prefix) som default. Det är dark-varianter som ska användas. Ljusa tokens på mörk bakgrund är ett återkommande Code-fel.
- Innan commit av en visuell komponent: öppna mocken och appen sida vid sida i samma viewport-bredd, ta skärmdumpar, jämför pixelnivå. Bifoga båda i SPRINT_AUDIT.md.
- Om mocken inte funkar i något avseende (t.ex. tar fel position på mobil, avvikande beteende vid edge case) — fråga Opus om mock-uppdatering. Ändra inte själv "för att det kändes bättre".

**Pixel-jämförelse är commit-blocker, inte best practice.**
- Sprint är inte klar förrän SPRINT_AUDIT.md innehåller skärmdumpar av varje visuell komponent jämfört mot mocken.
- "Verifierat i UI" som checkbox utan bifogad skärmdump räknas inte.
- Om Code commitar en visuell komponent utan pixel-jämförelse i commit-meddelandet — det är en regression som måste fixas innan nästa sprint påbörjas.

**Specen ansvar (referenslänkar):**
- Spec som har en mock måste ha sektion "INNAN DU BÖRJAR" som länkar mocken explicit.
- Spec ska ha tabell som mappar varje komponent till sin mock-vy (t.ex. `SMFinalPrimary` → "SM-final"-knappen i `portal_bag_mockup.html`).
- Verifieringsprotokoll i specen ska kräva pixel-jämförelse för commit, inte bara funktionell verifiering.

**När mock INTE behövs:**
- Pure data-arbete (datafiler, services som inte har UI)
- Algoritmer eller spellogik utan visuell representation
- Små visuella justeringar på befintliga komponenter (ändra padding på ett kort — inte mock-värt)
- Bug-fixar

**Riktmärke:** Om designen tar mer än fem minuter att beskriva i ord — mocka.

**Historik:** 
- 2026-04-27 Portal/inledning/moments. Tre HTML-mocks producerades innan specer skrevs. Mocks användes både för att få Jacobs feedback på designen *innan* kod (innehålls-iteration på vågor, Sverige-bakgrund vs karta, klubbpiller-format) och för att ge Code en konkret målbild att implementera mot. Före detta hade visuella beslut tagits i konversation och drift från målbild observerats i flera sprintar.
- 2026-04-27 Scene-leverans. Code levererade scen-systemet med felaktiga CSS-tokens på mörka bakgrunder (ljusa tokens som `--bg-elevated`, `--text-secondary` användes på svart bakgrund — komponenter blev oläsbara). Pixel-jämförelse hade fångat felet men gjordes inte. Fixades i efterhand av Jacob med Opus-granskning. Detta motiverar de förstärkta reglerna ovan: en komponent åt gången, dark-token-disciplin, pixel-jämförelse som commit-blocker.

---

## VERIFIERINGSPROTOKOLL — OBLIGATORISKT

Gäller ALLA som granskar eller implementerar: Claude Code, 
Opus, eller Jacob. Ingen genväg. Ingen "finns = funkar".

### Vid kodgranskning / audit:

**1. LÄS PARENT FÖRST, INTE CHILDREN.**
Börja ALLTID med skärm-filen (t.ex. MatchScreen.tsx), inte 
komponent-filerna. Följ renderingsflödet uppifrån och ner:
- Vad renderas?
- I vilken ordning?
- Med vilka props?
- Finns redundans (samma info visad två gånger)?

**2. ALDRIG "✅ finns" — ALLTID "✅ renderas korrekt i kontext".**
Att en komponent existerar som fil betyder INGENTING. 
Den måste:
- Importeras i rätt parent
- Få rätt props
- Renderas på rätt plats i DOM-trädet
- INTE dupliceras av en annan komponent som gör samma sak

**3. FÖR UI: FÖLJ VAD SPELAREN SER.**
Tänk: "Om jag öppnar denna skärm, vad ser jag uppifrån 
och ner?" Läs renderingsordningen i JSX:
- Är det dubbel-header? (vanligaste felet)
- Har alla kort samma margin/padding?
- Klipps något av?
- Är visuell hierarki konsekvent?

**4. FÖR SPELLOGIK: TRACESA ETT KOMPLETT FLÖDE.**
Säg aldrig "cupService finns ✅" — tracesa istället:
- Vad händer vid säsongsstart? (scheduleGenerator)
- Vilka fixtures skapas? (logga matchday, isCup, roundNumber)
- Vad händer vid advance()? (roundProcessor)
- I vilken ordning spelas matcher?

Gör detta med PEN OCH PAPPER-logik — följ variablerna 
steg för steg, inte "det ser rätt ut".

**5. VID TVEKSAMHET: VISA KODEN, INTE SLUTSATSEN.**
Om du inte kan verifiera 100% — visa den relevanta koden 
och säg "jag ser X men kan inte bekräfta Y utan att köra". 
ALDRIG "allt ser bra ut" om du inte har tracesat flödet.

**6. CHECKLISTA EFTER VARJE IMPLEMENTATION:**
```
□ Läst PARENT-filen och bekräftat renderingsordning?
□ Kollat att ingen annan komponent renderar samma sak?
□ Kontrollerat margin/padding mot E9 (0 12px page, 14px 16px card)?
□ Bekräftat att alla props skickas korrekt från parent?
□ Kört npm run build && npm test?
□ Verifierat med grep-kommandon (om specen har sådana)?
```

### Vanliga felmönster att ALLTID kolla:

- **Dubbel-header:** Parent renderar matchinfo OCH child-komponent 
  renderar matchinfo → spelaren ser samma info två gånger
- **"finns = funkar":** Service-fil existerar men importeras aldrig 
  eller anropas med fel parametrar
- **Visuell inkonsistens:** Kort på samma skärm har olika margin 
  p.g.a. att de skapats vid olika tillfällen
- **Cup-scheduling:** matchday-nummer måste verifieras genom att 
  LISTA alla fixtures i kronologisk ordning, inte bara "kolla att 
  cupService existerar"
- **Advance-hopp:** roundProcessor.ts anropas ibland dubbelt — 
  kolla alla ställen som anropar advance()

---

## SPEC-LYDNAD — OBLIGATORISKA REGLER (Code)

### 1. KOPIERA BOKSTAVLIGT
När en spec ger kod att kopiera — kopiera den EXAKT.
Ändra INGENTING utan att explicit fråga först.
Om koden inte kompilerar, beskriv felet och föreslå
en minimal ändring — men gör den inte själv utan godkännande.

### 2. ÄNDRA ALDRIG SPEC-GIVNA VÄRDEN
ALDRIG ändra spec-givna värden (px, färger, texter, props).
`padding: 14px 16px` betyder 14px 16px, inte 12px 14px.
`fontSize: 11` betyder 11, inte 12.
Om ett värde skapar ett problem — rapportera problemet,
ändra inte värdet.

### 3. INGA "FÖRBÄTTRINGAR" AV SPEC-KOD
Spec-kod ska inte "förbättras", "städas" eller "optimeras".
Om specen ger props — behåll dem även om de verkar oanvända.
Om specen ger en text — kopiera den bokstavligt, omformulera inte.
Om TypeScript klagar på spec-kod — fixa typfelet, ta inte bort koden.

### 4. DIFF-VERIFIERING EFTER VARJE EDIT
Efter varje edit: visa exakt diff av vad du ändrade.
Om diffen inte matchar specen — STOPPA och fråga.
Gör ALDRIG flera edits utan att visa diff emellan.

---

## KVALITETSPORTAR — OBLIGATORISKT FÖRE COMMIT

Dessa steg är INTE valfria. De körs efter VARJE deluppgift,
inte bara i slutet. Att skippa dem = att leverera trasig kod.

### PORT 1: Build + Test (efter varje ändring)
```bash
npm run build && npm test
```
OM build failar: FIXA OMEDELBART. Commit aldrig broken build.
OM test failar: FIXA eller förklara varför testet är felaktigt.
ALDRIG kommentera bort eller ta bort ett test för att det failar.

### PORT 2: Manuell verifiering (efter varje UI-ändring)
För VARJE UI-ändring, gör denna checklista i terminalen:
```bash
# 1. Inga hårdkodade färger
grep -rn '#[0-9a-fA-F]\{3,8\}' src/ --include="*.tsx" | grep -v node_modules | grep -v ClubBadge | grep -v global.css | grep -v SVG
# Ska returnera 0 relevanta resultat (exkludera badges, SVG, global.css)

# 2. Inga "rink" kvar
grep -rni 'rink' src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
# Ska returnera 0

# 3. Import-verifiering: alla nya imports används
# Kör build — TypeScript fångar unused imports
```

### PORT 3: Render-flöde (efter varje ny komponent)
Innan du säger att en komponent är klar:
1. Hitta PARENT-filen som renderar den
2. Bekräfta att props skickas korrekt
3. Bekräfta att ingen ANNAN komponent renderar samma information
4. Visa: "Parent: X.tsx → renderar <MyComponent prop1={a} prop2={b} />"

### PORT 4: Dupliceringskontroll (efter varje sprint)
```bash
# Sök efter duplicerad logik
grep -rn 'getFormGuide\|getFormResults\|recentForm' src/ --include="*.tsx" --include="*.ts" | grep -v node_modules
# Varje utility ska ha EN källa
```
För varje ny feature: kolla om samma sak redan implementeras
någon annanstans. Om ja — ÅTERANVÄND, skapa inte dubblett.

### PORT 5: Textgranskning (efter varje ny svensk text)
Alla nya svenska strängar → `docs/textgranskning/TEXT_REVIEW_{feature}_{datum}.md`
En fil per feature. Inte optional.

### KONSEKVENSER VID SKIP
Om en port skippas och buggen hittas i playtest:
- Buggen går FÖRST i nästa sprint (före nya features)
- En "post-mortem" rad läggs till i commit:
  `fix: [bugg] — missad av port X, orsak: [förklaring]`

---

## LÖPANDE KVALITET — OBLIGATORISKT

Utöver spec-lydnad och kvalitetsportar finns fyra löpande discipliner som körs kontinuerligt, inte per sprint.

### 5. D-FACT-UPPDATERING VID MAGNITUDÄNDRINGAR

När en sprint ändrar en spelmagnitud (sannolikhet, multiplier, tröskel, formel-konstant) ska motsvarande D-fact uppdateras i samma commit. Om D-fact saknas — skapa det. Om magnituden inte har ett D-fact och inte är kalibreringskritisk — minst en kort not i commit-meddelandet om varför.

**Code's Definition of Done för sprintar som rör magnituder:**
1. Koden ändrad
2. D-fact uppdaterad eller skapad
3. Revisions-post i D-fact om värdet ändrats
4. Validatorn körd och ren (`python3 scripts/validate_brain.py`)



### 1. TESTRYTM

Design-audit (`window.__designAudit`) och stress-test (`npm run stress`) är projektets två runtime-verifieringsverktyg.

**Vid commit av UI-ändring:**
- Kör `window.__designAudit({ format: 'text' })` mot den ändrade skärmen lokalt.
- Nya findings > 0 = motivera eller fixa innan commit.
- Klistra rapporten i commit-meddelandet om findings fanns (så historiken visar).

**Vid sprint-slut (i SPRINT_XX_AUDIT.md):**
- Design-audit på fyra nyckelskärmar: `/game/dashboard`, `/game/board-meeting`, `/game/squad`, `/game/match`. 
- `npm run stress` med default 10×5. Nya invariants-brott loggas i auditen.
- Jämför total findings mot föregående sprint. Ska gå ner eller ligga still. Uppgång = rotorsaksanalys i auditen.

**Innan playtest-release:**
- Full design-audit över alla skärmar spelaren planerar besöka.
- `npm run stress` 20×5.
- Båda rapporterna summeras som "fixat sedan senast" + "fortfarande öppet" till Jacob.

### 2. REFACTOR-DISCIPLIN

Om Code eller Opus ändrar > 2 filer **utöver** vad specen listade: **pausa, rapportera, fortsätt bara efter bekräftelse från Jacob i chatten**.

Commit-meddelandet ska då innehålla:
- Filer specen listade
- Filer som faktiskt ändrades
- Rotorsak till avvikelsen

**Rätt:**
```
fix: styrelsemöte padding — rot: samma template duplicerad i BoardMeetingScreen
spec-scope: 1 fil (BoardMeetingScreen.tsx)
faktisk-scope: 3 filer — utökning: TacticStep.tsx, StartStep.tsx hade samma
  padding-värden p.g.a. shared template för säsongs-kort
```

**Fel:**
```
fix: fixade padding på några skärmar
```

Rotorsak till regeln: Sprint 22.3 expanderade 2 → 5 filer självständigt. Utfallet blev bra, men utan rapport tappar Jacob överblick och kan inte bedöma om scope-expansion är sund eller slapp.

### 3. ARKITEKTURLOGGBOK (`docs/DECISIONS.md`)

Arkitekturbeslut loggas som en kort post **när beslutet tas**, inte efteråt. Gäller: ny service, ny entity-form, ny store-struktur, ny arbetsmetod, ny CSS-primitiv, ny mapp-struktur.

Format: 4-5 rader per post.

```
## 2026-04-20 — .btn-cta istället för fyra inline-CTA:er
Problem: 4 skärmar, 4 olika CTA-implementeringar. DESIGN_SYSTEM.md saknade stor CTA-klass.
Beslut: Ny .btn-cta i global.css. Alla 4 skärmar migrerade.
Alternativ övervägt: Tre storlekar (medveten hierarki) — avvisat, ingen tydlig regel för vilken som är störst.
Konsekvens: Ny inline-CTA är regression. Alla framtida skärm-avslutande CTA:er ska använda .btn-cta.
```

**Vem skriver:** Opus vid tillfället beslutet tas. Inte retroaktivt.
**Vem läser:** Code + Opus vid sessionstart, tillsammans med LESSONS.md.

Syftet är inte formalism. Syftet är att om 6 månader ha ett svar på "varför gjorde vi så här?" som inte är "det bara blev så".

### 4. KOD-GRANSKNING FÖR NYA FILER

Innan Code skapar en ny fil i något av dessa mönster:
- `src/domain/services/*.ts` (ny service)
- `src/domain/entities/*.ts` (ny entity)
- `src/presentation/components/*/[StoreKomponent].tsx` (ny större UI-komponent)
- `.btn-X`, `.card-X`, `.tag-X` i `global.css` (ny CSS-primitiv)

**Code ska:**
1. Söka efter liknande befintlig funktionalitet (`grep -r "nyckelord" src/`, läs relevanta filer)
2. Rapportera till Opus: "jag tänker skapa X, har hittat dessa liknande: Y, Z. Anledning till att de inte passar: ..."
3. Fortsätta bara efter Opus-bekräftelse att dublett inte finns

Rotorsak: `.btn-copper` skapades trots att `.btn-primary` redan existerade med identisk CSS. Ingen granskning fångade det. Dubletten upptäcktes först 4 månader senare vid Sprint 22.5-granskning.

---

## ÅTERKOMMANDE BUGGAR — ESKALERINGSPOLICY

Om samma bugg rapporteras IGEN efter att den "fixats":
1. Skriv FÖRST ett test som reproducerar buggen
2. Kör testet — bekräfta att det FAILAR
3. Fixa buggen
4. Kör testet — bekräfta att det PASSERAR
5. Commit med: `fix: [bugg] — REGRESSION, added test`

Exempel: "Utvisningar centrerade" har rapporterats 4 gånger.
Nästa fix MÅSTE ha ett test som verifierar sidoplacering.

---

## OPUS-REGLER (granskning + spec-skrivning)

### 1. FIX DIREKT OM DU KAN
Om du har workspace:edit_file — skriv koden själv.
Skriv aldrig en spec för något du kan fixa direkt.
En spec som Code halvimplementerar är värre än en
direkt edit som fungerar.

### 2. ALDRIG YTFIXAR
Om problemet är strukturellt, lös det strukturellt.
"Sätt margin X på alla element" är fel svar —
"skapa en CSS-klass som hanterar spacing" är rätt svar.
Fråga dig: "kommer detta problem tillbaka nästa gång
någon lägger till ett element?" Om ja — lösningen är fel.

### 3. VERIFIERA DINA EGNA VERKTYG
create_file ≠ workspace:write_file. Kontrollera att
filen hamnade rätt innan du säger att den är klar.
Använd workspace:get_file_info efter skrivning.

### 4. EN SANNING, ETT STÄLLE
Matchinfo ska inte definieras i MatchScreen OCH
MatchHeader. Väder ska inte renderas i MatchHeader
OCH StartStep. Hitta dubbleringen INNAN du skriver
specen — att skapa en spec som INTE adresserar
dubblering är ett misslyckande.

### 5. SUPERSEDE-DISCIPLIN (dokument) — när du skriver en ny sanning, döda den gamla SAMMA TUR

Detta adresserar en återkommande Opus-miss: att skriva en ny version (V2-spec, "allt byggt"-status) men lämna den gamla kvar utan att peka framåt från den. En annan instans öppnar då den gamla och bygger på fel sanning. Alla fyra dokumentmissar 2026-06-16 var detta mönster.

Missen sker ALLTID i exakt två ögonblick. När du är i ettdera — stanna och gör följdhandlingen SAMMA tur, inte "vid tillfälle":

**A. När du skapar en V2/omskrivning som ersätter en tidigare fil:**
1. Toppa den GAMLA filen med en obsolet-rubrik: `# ⛔ ERSATT AV [ny fil] — BYGG INTE PÅ DENNA` + en rad om VAD som ändrats (särskilt om en spärr/ett antagande vänts).
2. Greppa repo efter den gamla filens namn (`grep -rn "GAMMAL_FIL" docs/`) och uppdatera VARJE referens till att peka på den nya. En stale pekare i körlistan är lika illa som den gamla filen själv.

**B. När du markerar något KLART eller en grind PASSERAD:**
1. Uppdatera statusen i `KORLISTA_CODE_RC.md` (eller den utpekade statusfilen) — ALDRIG i en sidofil.
2. Om en order-/spec-fil har grind-språk ("Jacob spelar inte förrän...", "PRIO 1–4 är grinden") som nu är inaktuellt → toppa den med `✅ HISTORISK — status i körlistan`. Lämna inte två filer som säger olika om vad som är gjort.

**Den bärande regeln (båda fallen):** det finns EN statusfil (`KORLISTA_CODE_RC.md`). Allt annat är antingen (a) en order/spec som pekar PÅ statusfilen, eller (b) historik som SÄGER att den är historik. En fil får aldrig tyst motsäga statusfilen — den måste antingen peka dit eller dödmarkera sig själv. Om du inte hinner göra följdhandlingen samma tur: gör den ändå. "Vid tillfälle" är hur drift uppstår.

**Självkontroll innan du avslutar en tur där du skrev en ny sanning:** "Skapade jag just en version 2 eller markerade något klart? Finns det en gammal fil eller en referens som nu ljuger? Döda den nu."

---

## ARBETSFÖRDELNING: OPUS vs CODE

Opus (Claude 4 Opus, denna chat) drar mer kvot per turn än
Code (Sonnet via Claude Code). Specielt vid iteration —
stress-test, build/test-loops, pixel-jämförelse mot mock —
skalar Code-kostnaden bättre. Fördela arbete utifrån två frågor:

1. **Är det Opus-rollens jobb?** (mocks, specer, svensk text, diagnos)
2. **Kräver fixen iteration?** (stress-test, build/test-loop, pixel-jämför)

### Opus gör direkt
- Mocks i `docs/mockups/` — alltid Opus (princip 4)
- Spec-skrivning — alltid Opus
- Svensk text med specifik ton — alltid Opus (se OPUS_SAMARBETSREGLER #5)
- Kirurgiska kod-fixar som INTE kräver iteration:
  - 1 rad CSS, en konstantändring, en prop-fix där värdet är känt
  - Textändring i en sträng-konstant
  - Tillägg av saknad import
- Diagnos-filer som kräver kod-läsning + analys (ingen kodändring)
- Process-fil-tillägg som kommer FÖRE sprint:
  - LESSONS-lärdom Code behöver känna till
  - DECISIONS-post som motiverar specen
  - KVAR-sektion som dokumenterar parkerat scope

### Code gör (även om diffen är liten)
- Allt som kräver build + test-loop för korrekthetsverifiering
- Allt som kräver stress-test (200+ matcher headless)
- Allt som kräver pixel-jämförelse mot mock i levande app
- Refactors > 5 filer, ny service/entity/större komponent
- Process-fil-uppdateringar EFTER sprint-leverans:
  - `docs/sprints/SPRINT_XX_AUDIT.md` — Code har sett implementationen
  - `docs/HANDOVER_YYYY-MM-DD.md` — Code vet vad som faktiskt levererades
  - `KVAR.md` ✅-markeringar för det Code precis avslutade
  - `LESSONS.md` historik-tillägg när Code stötte på ett mönster

### Kvot-perspektivet — vad det betyder konkret
En "liten" fix som kräver fyra stress-test-iterationer = stort
Opus-jobb (varje iteration är en Opus-turn) men billigt Code-jobb
(varje iteration är en Sonnet-turn). **Default = Code för iteration-
tunga fixar även om diff är 5 rader.**

### Defaultregel
Innan Opus börjar editera, ställ två frågor:
1. *Är det iteration-fritt?* (jag kan veta att fixen är rätt utan att köra appen/testerna mer än en gång)
2. *Är det Opus-rollens jobb?* (mock, spec, text, diagnos, kirurgisk konstantändring)

Båda ja → Opus direkt.
Iteration-tungt → Code, även för små diffar.
Annars → spec.

Om Opus skriver en spec — säg VARFÖR den inte fixades direkt
("berör 8 filer", "kräver stress-test-loop", "kräver pixel-jämför").

---

## ARCHITECTURE OVERVIEW

### Matchday-systemet (refaktorerat mars 2026)
Fixture-ordningen styrs av `fixture.matchday` — ett heltal som bestämmer global spelordning. Sätts EN gång vid fixture-generering. Ingen beräkning behövs vid runtime.

- **Liga:** matchday 1-22 (motsvarar ligaomgång 1-22)
- **Cup:** inflikas mellan ligarunder via `CUP_AFTER_LEAGUE_ROUND` i `scheduleGenerator.ts`:
  - Cup R1 (förstarunda) → matchday 3
  - Cup R2 (kvartsfinal) → matchday 8
  - Cup R3 (semifinal) → matchday 13
  - Cup R4 (final) → matchday 19
- **Slutspel:** matchday 27+ (genereras dynamiskt vid playoffTransition)
  - Kvartsfinal: matchday 27-31
  - Semifinal: matchday 32-36
  - Final: matchday 37+
- `buildSeasonCalendar()` i `scheduleGenerator.ts` returnerar hela säsongens matchdagsordning
- `advanceToNextEvent()` i `roundProcessor.ts` sorterar på `fixture.matchday`
- **VIKTIGT:** Använd ALDRIG `effectiveRound()` eller `roundNumber - 100`. All ordning via `matchday`.

### Ekonomi
- `calcRoundIncome()` i `economyService.ts` — enda stället för intäktsberäkning
- Capacity: `reputation * 7 + 150` (anpassat för svenska bandyklubbar, 200-700 åskådare)
- weeklyBase: `3000 + reputation * 50`
- Matchintäkter BARA vid hemmamatch (`isHomeMatch = true`)
- Derby/slutspel/cup ger bonus (1.4x / 1.5x / 1.25x)
- Lönebudget (`wageBudget`) VARNAR vid överskridning men BLOCKERAR ALDRIG kontraktsförlängningar

### Transfers
- Max 3 samtidiga utgående bud (`createOutgoingBid` i `transferService.ts`)
- Scouting: 0-2 omgångar beroende på region/om man mött laget
- Budrespons: 1 omgång

## Bandyspecifika regler (VIKTIGT)

### Spelets värld
12 fiktiva klubbar på riktiga bruksorter. Alla klubbnamn, arenanamn och klacknamn är PÅHITTADE — inga riktiga föreningar. Definerade i `CLUB_TEMPLATES` i `worldGenerator.ts`. Arena- och klacknamn är required fält.

### Matchmotor-kalibrering
Kalibrerad mot 1124 Elitseriematcher (bandygrytan.se, 2019-26). Data i `docs/data/bandygrytan_detailed.json (1124 matcher, 6 säsonger)`. Nyckeltal:
- 9.12 mål/match (target), 22.2% hörnmål, 5.4% straffmål
- 50.2% hemmaseger, 11.6% oavgjort
- 54.2% av mål i 2:a halvlek

Verifieringsskript: `scripts/calibrate.ts` (varierad lagstyrka, 200 matcher).
Säsongsanalys: `scripts/analyze-stress.ts` — jämför stress-test-loggen mot bandygrytan-targets (säsongsnivå, inte per-match).

- **Offside FINNS i bandy** — ta aldrig bort offside-kommentarer
- **Kort i UI (designval):** Bandy Manager visar inte gula/röda kort i gränssnittet — modellera utvisningar (5/10 min) + matchstraff. OBS: bandy HAR gult kort (= varning) och rött kort (= matchstraff) i verkligheten, se `docs/kunskapsbas/REGLER.md` §3. Reformen "våga visa rött" handlar om just röda kort — säg aldrig att bandy saknar kort.
- **2 poäng för vinst** — inte 3 som i fotboll
- **Termer:** "avslag" (inte avspark), "brytning" (inte tackling), "frislag" (inte frispark), "vaden" (inte vadden)
- **Positioner:** MV, DEF (backar), HALF (halvbackar), FWD (forwards). Midfielder = Half i bandy.
- **Hörnor** = centralt offensivt vapen
- **Flygande byten** som i ishockey (inga begränsade byten)
- 🏒 (INTE ⚽) i all UI
- **"Plan"** — ALDRIG "rink". Bandy spelas på plan, inte rink. Rink = ishockey.

## Verification after ANY design change

```bash
grep -rn "C9A84C\|c9a84c\|201,168,76\|#22c55e\|#f59e0b\|#ef4444\|#0a1520\|#0D1B2A\|#0a1e3a\|#0c2440\|#3b82f6\|#1a2e47\|234,179,8" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules
```
Must return 0 results.

<!-- Tech Stack, mapp-struktur, Key Files och Active Documentation flyttat till `CLAUDE_REFERENCE.md`. Slå upp där. -->


## Commit Convention
```
fix: [short description]
feat: [short description]
design: [short description]
refactor: [short description]
```

---

<!-- BANDY-BRAIN-kunskapsbasen flyttad till `CLAUDE_REFERENCE.md`. Slå upp där. -->

