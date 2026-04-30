# HANDOVER 2026-04-28 (kväll) — Sju specer i mål, sju mockar, två procedur-dokument

**Författare:** Opus
**Status:** Sessionen avslutad. Jacob playtestar fram till fredag, sparar kvot.
**Föregångare:** HANDOVER_2026-04-28.md (tidigare på dagen)
**Syftet med detta dokument:** Total överlämning så en ny Opus-session kan ta vid utan att tappa kontext, ton eller riktning.

---

## Vad sessionen levererade

Sju specer fullt implementerade av Code under denna och föregående sessioner. Alla har mockar, alla har pixel-jämförelse-protokoll, alla har tester. 2603+ tester gröna.

| Spec | Commit | Tester | Anteckningar |
|---|---|---|---|
| SPEC_INLEDNING_FAS_1 | (tidigare) | 19 | "Klubben hittar dig" + lista-fallback med Sverige-bakgrund. 60 klubbcitat skrivna av Opus, attribution borttaget i klubbvalet (kvar i kafferum). |
| SPEC_PORTAL_FAS_1 | (tidigare) | — | Bag-of-cards med 16 kort, 5 trigger-filer, glidande tonalitets-CSS (5 keyframes). PortalScreen ~80 rader, ingen monolit. |
| SPEC_SCENES_FAS_1 | (tidigare) | 14 | Scene-systemet (söndagsträning + SM-finalseger). `Scene` som namn (inte `Moment` — det fanns redan). "I DETTA ÖGONBLICK" som UI-genre-tag. |
| SPEC_KAFFERUMMET_FAS_1 | (tidigare) | — | Triadiskt skvaller. Foster (2004) fyra funktioner som designgrund. CoffeeRoomScene + CoffeeRoomSecondary. |
| SPEC_JOURNALIST_KAPITEL_A | `2b41a8f` | 27 | Synliggör befintlig journalist-relation. Portal-kort vid extremvärden, fullskärmsscen vid klick. 3 events idag (refused/good/bad answer). |
| SPEC_KLUBBMINNET_KAPITEL_B | `bad787b` | 21 | "📖 Minne"-flik i ClubScreen. Aggregator över 5 säsonger med signifikans-poängsättning. 6 komponenter. |
| SPEC_SAESONGSSIGNATUR_KAPITEL_C | `53b1fda` + uppföljning | 15+ | 6 signaturer slumpas vid säsongsstart. Reveal-scen, Portal-kort (full bredd), säsongsslut-rubrik. Tre modifierare i väder/scandal/skada (kapitel C kvarvarande klart efter 53b1fda). |

Två procedur-dokument också:

- `PLAYTEST_PROCEDURE.md` — fyra typer av playtest, anteckningsmall, feature-checklistor per spec
- `CODE_REVIEW_PROCEDURE.md` — tre granskningstyper (filstorlek, duplicering, kontextuell), refactor-strategier

---

## Designtanken bakom det vi byggt

Detta är inte bara features. Det är en grundprincip:

> **Spelet kommer till spelaren när det betyder något, annars finns det i bakgrunden.**

Motsatsen till dashboards-paradigmet ("här är all information, sortera själv"). Närmare CK3, Suzerain, Reigns. Och samtidigt bandyspecifikt — bruksort, parkeringsston, understatement. Det är vad ingen annan kan göra.

Specifikt:

- **Portal som bag-of-cards** — vad som visas bestäms av game state, inte fast layout
- **Scener som bryter loopen** — viktiga uppslag tar fullskärm, ingen BottomNav
- **Journalisten är en karaktär** — relation över tid, inte en datapunkt
- **Klubbminnet som retention** — säsong 3+ blir meningsfullt först när historiken finns
- **Säsongssignaturer som prägling** — varje säsong har en stämning som påverkar diskreta variabler

---

## Sessionens viktigaste designvägar — vad som var fel innan, vad som är rätt nu

### 1. Mock-driven design som princip 4

**Innan:** Visuella beslut drev från målbild i implementation. Code skrev "ungefär" i padding, tokens och layout. Över tid ackumulerades drift till en app som kändes generisk.

**Nu:** Princip 4 i CLAUDE.md. Mock först, kod sen. Mocken är *kanon*, inte ungefär.

**Vad det innebär:**
- Opus producerar interaktiv HTML-mock i `docs/mockups/` när feature är visuellt distinkt
- Code läser mocken bredvid editorn, kopierar CSS-värden bokstavligen
- Pixel-jämförelse är *commit-blocker*, inte best practice
- En komponent åt gången — N → pixel-jämför → commit → N+1
- CSS-token-disciplin på mörka komponenter (inga ljusa tokens som default)

Detta byggdes ut efter Scene-leveransen (2026-04-27) där Code använde ljusa tokens (`--bg-elevated`, `--text-secondary`) på mörka bakgrunder och komponenterna blev oläsbara. Pixel-jämförelse hade fångat det men gjordes inte.

### 2. Inga feature flags

**Innan:** Code levererade Scene-systemet med `scenesEnabled: false` som default. Jacob fick instruktion att redigera localStorage via dev-console för att slå på det.

**Nu:** Sektion i CLAUDE.md. När en feature levereras ska den vara *påslagen som default*. Detta är ett en-utvecklare-spel — Jacob är beta-testare, dev-team och release-manager. Feature flags från större team-workflows har ingen bäring.

### 3. Mocken är kanon, inte ungefärlig — formulering

Den fysiska formuleringen "MOCKEN ÄR KANON — INTE UNGEFÄRLIG" finns nu överst i alla framtida specer. Inkluderar:
- Komponentkoppling till mock-vyer (tabell)
- Specifika CSS-värden som ska kopieras bokstavligen
- Pixel-verifiering som commit-blocker
- Gränsdragning: om mocken inte funkar — fråga Opus, ändra inte själv

### 4. Återanvändning över rebuilding

**Mantrat:** "Vi byggde inte djup, vi exponerade det."

Spelet hade 87 services när vi började. Många djupa, många väl-strukturerade. Bristen var *synliggörandet*. Journalisten fanns som data men syntes inte. Klubblegender lagrades men visades inte. Skvallret fanns som dialog men renderades som textrad i CTA-sektionen.

Specerna handlar om 80% synlighet, 20% ny logik. Återanvändning av befintliga komponenter (SceneCTA, SceneHeader, ClubScreen tab-pattern) är hårda krav, inte rekommendationer.

### 5. Bandysverige som värld

**Tonen:** Parkeringsstämning. Understatement. Konkreta bilder (sillen, svärmor, kaffekassan). Inga LLM-meningspar där rad två förklarar rad ett. Bisatser dödar ofta humor.

**60 klubbcitat skrivna av Opus** med denna ton. Förbjudna konstruktioner:
- "Det är inte X, det är Y" som gimmick
- Double-double-mönster ("X. Men X heller inte Y.")
- "Då vet folk att vi går för..." utom när det är dubbelsyftning
- Förklarande punch på rad två

**Klubbfakta som single source of truth:** `docs/KLUBBFAKTA.md` (~600 rader) har verifierad research per klubb. Verkliga arenor (Mariehov, Strandvallen) får refereras *historiskt* i citat. Spelets fiktiva arenor (Slagghögen, Forsvallen) används för nutid.

---

## Det som fortfarande är öppet

### Direkt akut (efter playtest fredag)
- **Playtest-runda 4** av Jacob — verifiera A + B + C i live-app
- Lång lista av buggar förväntas (Jacobs egen formulering: "lär väl bli en lååång lista")
- Notera: Code rapporterade smoke test som "kod-verifierad simulation, browser ej tillgänglig" — *visuell* verifiering finns INTE än

### Filstorleks-akut (CODE_REVIEW_2026-04-28_A)
Sju filer över 800 rader, dokumenterade men inte fixade:
- `matchCore.ts` — 1737 rader (känslig — kalibrerad mot Bandygrytan)
- `eventResolver.ts` — 1159 rader
- `GranskaScreen.tsx` — 1271 rader
- `MatchLiveScreen.tsx` — 1162 rader
- `DashboardScreen.tsx` — 1093 rader (bör tas bort när Portal är verifierat)
- `PlayerCard.tsx` — 831 rader
- `arcService.ts` — 878 rader

Dessa är inte i `ATGARDSBANK.md` än — det är en lucka som Code blev påmind om i sista meddelandet ("Lägg till en sektion längst upp: 2026-04-28 — Filstorleks-audit"). Värt att verifiera att Code lagt till det innan nya sprintar.

### THE_BOMB-arbete som inte är specat
- THE_BOMB §4 (atmosfärspolish — väder visuellt, matchdagens stillhet, ljudeffekter)
- THE_BOMB §5 (share-images)
- Manager-statements som journalisten kommer ihåg och konfronterar dig med (Kapitel A:s djupare mekaniker — Fas 2)

### Fas 2-arbete signalerat i specer
- Multi-journalist (riks-press, Bandybladet)
- Fler journalist-event-typer (storseger-intervju, derby-respons, transfer-bekräftelse)
- Klubbminne med klick-på-event för kontextdetalj
- Fler säsongssignaturer (värmebölja, strejk i ligan)
- Kombinerade signaturer

### Tomt EVENT_TO_SUMMARY-mappingen
Idag loggas bara tre events i journalistService: `refused_press`, `good_answer`, `bad_answer`. EVENT_TO_SUMMARY mappar bara dessa. När Fas 2 lägger till fler `recordInteraction`-anrop måste mappingen utökas. Specat som Fas 2 i journalist-specens "Vad som SKA INTE göras".

---

## Sessionens samarbetsform — hur Opus och Jacob arbetar

Detta är värt att förstå om en ny Opus-session ska fortsätta i samma anda.

### Jacob:
- En-utvecklare-projekt (med Erik som visuell input ibland, inte i denna session)
- Värderar motstånd över bekräftelse — säg när något är svagt
- Säger "kör på" när han vill att Opus ska göra något, inte tjata om val
- Tar egna beslut och gör dem ofta annorlunda än Opus rekommendation — det är OK och rätt
- Vill ha bandysverige-tonen — inga LLM-meningspar, inga "låt mig hjälpa dig", inga sammanfattningar av vad han just sagt
- Skriver ofta med stavfel och utan punkt — det är inte en signal till tröghet

### Opus arbetsmod denna session:
- Skriver text direkt (svenska klubbcitat, scen-texter, Opus-mocks) — bygger inte specer för Code att skriva text
- Producerar HTML-mocks innan specer skickas (princip 4)
- Verifierar kod via `workspace`-läsverktyg innan specing — undviker att specera mot fantasier
- Iterativ citat-skrivning: 3 citat → Jacob feedback → justera → skala. Aldrig 60 citat på rad utan check.
- Föreslår en ordning men accepterar Jacobs val utan friktion när det avviker
- Påpekar fel utan ursäkt ("du har rätt", inte "förlåt om jag")

### Var Opus var fel under sessionen (transparens för nästa Opus):
- Förslog att vänta med Kapitel C-modifierare till efter playtest. Jacob körde igenom och hade rätt — risk-aversionen var inte motiverad
- Specade EVENT_TO_SUMMARY med 4+ events som om de fanns. Code rapporterade verkligheten (3 events). Lärdom: verifiera service-anrop i koden innan specning, inte bara typdefinitioner
- Förvirrade tidigare över vilken mock som var vilken (klubbminne vs journalist) och behövde Jacob för att reda ut. Lärdom: namnge mockar tydligt i samtal

---

## Filer skapade/uppdaterade denna session

### Nya specer
- `docs/SPEC_JOURNALIST_KAPITEL_A.md`
- `docs/SPEC_KLUBBMINNET_KAPITEL_B.md`
- `docs/SPEC_SAESONGSSIGNATUR_KAPITEL_C.md`

### Nya mockar
- `docs/mockups/journalist_card_mockup.html` (4 vyer)
- `docs/mockups/klubbminnet_mockup.html` (2 vyer)
- `docs/mockups/saesongssignatur_mockup.html` (7 vyer)

### Nya procedur-dokument
- `docs/PLAYTEST_PROCEDURE.md`
- `docs/CODE_REVIEW_PROCEDURE.md`

### Uppdaterade arkitektur-dokument
- `CLAUDE.md` — princip 4 (Mock-driven design) + sektion "INGA FEATURE FLAGS" + skärpta krav under princip 4 (en komponent åt gången, dark-token-disciplin, pixel-blocker)
- `DECISIONS.md` — två nya posts: "Mock-driven design som fjärde designprincip" + "Pixel-jämförelse som commit-blocker, en komponent åt gången"

### Code-leverans-dokument
- `docs/code-review/REVIEW_2026-04-28_A.md` (Code skapade)
- `docs/playtest/PLAYTEST_2026-04-28_smoke.md` (Code skapade)

### Tomma dokument inte uppdaterade
- `ATGARDSBANK.md` — ej uppdaterad sedan 17 april. Code har bett om att lägga till "2026-04-28 — Filstorleks-audit" men det är inte verifierat att de gjort det

---

## När Jacob återkommer fredag

Förväntat innehåll i nästa session:

1. **Lång playtest-anteckning** — buggar, friktion, känslor. Jacobs egen prognos: "lär väl bli en lååång lista tyvärr. men vem vet!"

2. **Prioritering** — vissa fynd är akuta, vissa är friktion-utan-att-vara-fel, vissa är meta-observationer. Opus hjälper sortera.

3. **Möjligen några snabba fixar** — Opus kan göra direkt-edits via workspace för småfel under ~50 rader.

4. **Möjligen ny spec** — om playtest avslöjar något som behöver byggas. Men prio bör vara *fixa det som är trasigt* innan *bygga nytt*.

### Som ny Opus, läs i denna ordning:
1. **CLAUDE.md** — alla fyra principer + samarbetsregler + INGA FEATURE FLAGS
2. **LESSONS.md** — buggmönster (9 lärdomar)
3. **DECISIONS.md** — arkitekturbeslut (denna session lade till två)
4. **THE_BOMB_V2_2026-04-27.md** — den vision som specerna bygger mot
5. **UX_OMTAENKNING_2026-04-27.md** — UX-paradigmet
6. **KLUBBFAKTA.md** — single source of truth för klubbinformation
7. **Denna fil** — så du fattar var vi var, varför, och hur

### Låt inte detta hända som ny Opus:
- Föreslå LLM-aktiga lösningar med double-double i texten
- Glömma att Jacob är ensam utvecklare (inte ge "best practices för team")
- Skapa feature flags
- Specera mot fantasier — verifiera koden först
- Skriva specer för text när Opus kan skriva texten direkt
- Tjata om val när Jacob säger "kör på"
- Ursäkta sig

---

## Känslan att bevara

Detta var en **bra session**. Jacobs egen formulering. Den hade rytm:
- Korta utbyten med tydliga beslut
- Iterativ citat-skrivning som faktiskt landade tonen
- Mocks som blev kanon, inte förslag
- Code som faktiskt levererade pixel-troget efter att princip 4 skärpts
- Slut utan onödig sammanfattning

Bandyspelet är på god väg att bli något specifikt — inte en mall-applikation, inte en FM-klon, inte en generisk sportmanager. **Något svenskt-bandy som ingen annan kan göra.** Spelaren ska *känna* sin klubb, *minnas* sina säsonger, *förhandla* med journalisten över tid.

Sju specer i kö är inte målet i sig. Målet är att när Jacob spelar fredag morgon ska han känna att Forsbacka är *hans* klubb, att Karin Bergström är *hans* journalist, att köldvintern 2027 är något han kommer minnas.

Det är värt att bevara.

---

## Slut HANDOVER 2026-04-28b
