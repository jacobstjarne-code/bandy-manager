# Sessionssammanfattning — 27 april 2026

**Datum:** 2026-04-27
**Författare:** Opus
**Syfte:** Fånga hela sessionens slutsatser. Vi gick från SPEC-granskning av specialdatum-systemet till en omtänkning av hela spelets UX-paradigm. Detta dokument samlar allt så ingenting glöms.

---

## Sessionens båge

Vi började dagen med konkret SPEC-arbete och avslutade med radikal UX-omtänkning. Tre faser:

**Fas 1: Specialdatum-systemet stängdes** — granskningar, fixar, implementation, audit, dead-code-fix av 3×30-grenen, lärdom #11 till LESSONS.md.

**Fas 2: Playtest + THE_BOMB-uppdatering** — Opus mentalt genomspel av hela kodbasen, statusering av V1-visionen mot vad som faktiskt är byggt.

**Fas 3: UX-omtänkning** — Jacob frågade "är du med på vad jag menar?" om enformigheten, vilket triggade research av FM26, CK3, Suzerain och Reigns. Resulterade i ett nytt paradigm: portal + moments + dialog + minne.

---

## Konkreta leveranser denna session

### 1. SPEC-arbete (avslutat)

- `SPEC_VADER.md` V2 — alla blockerare fixade, Bandy-Brain-granskningens 11 punkter applicerade
- `SPEC_MATCHDAGAR.md` V3 — cup-konstanter dokumenterade, migrationsplan, B8 om top 4 bye
- `SMHI_STATIONS.md` — stations-mappning per klubb (skickad till Erik)
- `SPEC_REVIEW_2026-04-27.md` — granskning med V3-status överst
- `STRINGS_SPECIALDATUM.md` V2 — 60 kurerade strängar plus arena-konstanter (Studenternas IP, Sävstaås IP), lore-pooler, kontextuella triggers (3×30-final)
- LESSONS.md utökad med lärdom #11 om hook-kedjor (pool definierad ≠ pool nåbar)

### 2. Playtest + THE_BOMB (analys)

- `PLAYTEST_OPUS_2026-04-27.md` — 7 förslag i prioriteringsordning. **Detta dokument är delvis föråldrat efter UX-omtänkningen** — quick wins gäller fortfarande som riktning men implementeras inom Portal-paradigmet, inte som dashboard-justeringar.
- `THE_BOMB_V2_2026-04-27.md` — verifierad statusrapport på V1 plus tre nya kapitel:
  - **A:** Synliggör journalist-relationen (`Journalist.relationship` finns redan, visas inte)
  - **B:** Klubbens minne som egen vy (samla `narrativeLog`, `clubLegends`, `fixtures`)
  - **C:** Säsongens signatur (slumpat tema som påverkar hela säsongen)

### 3. UX-omtänkning (det nya)

- `UX_OMTAENKNING_2026-04-27.md` — paradigmförskjutning baserad på research av fyra spel
- `mockups/portal_bag_mockup.html` — fyra tillstånd av samma dashboard (routine, derby, deadline, SM-final)
- `mockups/moments_mockup.html` — söndagsträningen + SM-guld med buckla

---

## Det nya UX-paradigmet (kärnan av sessionen)

Bandy Manager går från **dashboard-loop** till **portal + moments + dialog + minne**. Fyra principer:

### Princip 1: Portal med "veckans bag"

Dashboarden är inte 8 fasta sektioner som scrollas. Det är en **kontextuell hub** där innehållet bestäms av vad som händer just nu. Reigns-mekanik: en bag av möjliga primary-cards där sammansättningen ändras med game state.

Derby-vecka → derbyt är primary, klacken är secondary, tabellen är minimal status.
Transferdeadline → deadline är primary, nästa match degraderas.
SM-finalsdagen → bara finalen, inget annat.

Mocken visar fyra tillstånd. Det är detta vi bygger först.

### Princip 2: Moments — "I DETTA ÖGONBLICK"

Helsidesvyer som *bryter loopen*. Ingen BottomNav, ingen flykt. Spelet håller kvar tills beslut tagits. Sparsamt — 3-7 per säsong.

Genre-namn: **"I DETTA ÖGONBLICK"** (Jacobs formulering). Fångar både *just nu* och *fångar dagen*.

Två kategorier av moments:

**Tidiga moments — etablering (säsong 1, omg 1-8):**
- M1: Första kvällen i klubbhuset
- M2: Söndagsträningen — sex spelare på isen *(mockad)*
- M3: Birger berättar om derbytraditionen
- M4: Karin Bergström från lokaltidningen ringer
- M5: Klubbhusets veggtelefon ringer (Lindberg via vaktmästaren)
- M6: Patron-mötet hos Lars Berglund

(Tidigare M5 — cup-bortamatch mot lägre-divisions-klubb — borttagen eftersom cup bara spelas mellan elitserielag i nuvarande version.)

**Senare moments — payoff:**
- SM-finalsdagen (helsida före match)
- Klubblegendens pension
- Klacken protesterar
- Transferdeadline-stress
- Patron-konflikten
- SM-guld med buckla *(mockad)*

Tidiga moments etablerar plats, karaktärer, kultur. Senare moments är payoff på det som etablerats.

### Princip 3: Vissa interaktioner är dialog, inte dashboard

Suzerain visar att vissa saker *vill* vara dialog. Bandy Manager-kandidater:

- Presskonferensen → fullskärm istället för overlay
- **Kafferummet → en plats du besöker**, inte text längst ner. Lo-fi vektor av rummet, två röster som svarar varandra, du står i dörren med val.
- Klackens röst → en briefing från Birger, inte ett card med citat
- Patron-möten → utveckla det som redan börjat dialogform

### Princip 4: Visuell årssignatur

CSS-tonal shift över säsongen. Inte snöpartiklar — strukturell:

- Aug-okt (cup + säsongsstart): varm, optimistisk, accent ljusare
- Nov-jan (vinterkamp): mörkare, dämpad, accent neddragen
- Feb-mars (slutspel): vass, kontrastrik, accent skarpare

En CSS-variabel `--act` som ändras vid omgångsövergångar. Spelaren öppnar appen i januari och *känner* att det är vinter, även utan att läsa något.

---

## Kafferummet — vad som ska förändras

Du sa kafferummet blivit "ytterligare ett sätt att säga samma sak". Du har rätt. Det är just nu *eko* av spelets state — vinst → kioskvakten säger vi sålde dubbelt, förlust → tyst vid kiosken. Spelaren har redan sett att de vann eller förlorade.

**Vad gör det rikt:**

**A) Information som inte finns någon annanstans.** Vaktmästaren har sett saker. "Henriksson satt kvar i omklädningsrummet en timme efter förra matchen. Sa inget, bara satt." → spelaren får hint om formdipp innan systemet skriver ut den.

**B) Skvaller om andra klubbar.** Kassören ringde sin kompis i Slottsbron — "Dom är panik på pengar därinne. Hörde att deras anfallare är till salu." Det är scout-info som kommer genom en *människa*, inte en rapport.

**C) Frågor du faktiskt kan svara på.** Inte "Veckans beslut" som popup. Naturliga frågor i samtalet:

> Vaktmästaren: "Birger frågade om vi ska boka extra parkering för annandagsmatchen."
> [Boka extra] / [Klarar oss med ordinarie]

Konsekvens kommer kanske, kanske inte. Bag-of-cards-mekaniken styr det.

**Skillnaden mot nuvarande:** Kafferummet *driver* spelet, inte kommenterar det.

---

## Rangordning för implementation

### Fas 1 (~2 sprintar) — Portal-paradigmet etableras

1. **UX-1 Portal med veckans bag** — utgångspunkt för allt annat. Bygger på befintlig dashboard, ersätter den successivt. Mocken visar målbilden.
2. **PLAYTEST QW-2 Stakes-tagg** — naturlig del av Portal.
3. **UX-2 Tre årssignaturer** — låg kostnad, hög atmosfär.

### Fas 2 (~3 sprintar) — Första moments

4. **UX-3 Första moments** — börja med 1-2 fullskärms-momenter:
   - SM-finalsdagen (lättast — flagg finns redan)
   - Söndagsträningen (early-game etablerings-moment)
5. **THE_BOMB Kapitel A — Manager-statements + journalist-relation** — landar naturligt i moment-format

### Fas 3 (~3 sprintar) — Kafferummet + minne

6. **UX-4 Kafferummet som plats** — fullskärms-scen med info-A/B/C-mekaniken ovan
7. **UX-5 Klubbens minne som horisontell tidslinje**
8. **THE_BOMB Kapitel B — clubMemoryService** — datakällan för UX-5

### Fas 4 (~2 sprintar) — Säsongssignatur

9. **THE_BOMB Kapitel C — Säsongens signatur** — slumpat tema vid säsongsstart, kopplar till UX-2 (visuell signatur) och UX-5 (minnet)

**Totalt: ~10 sprintar över ~6 månader.** Inte allt samtidigt. Men *riktningen* är etablerad.

---

## Det som står kvar att besluta

1. **Var ska första moments triggas i koden?** matchSimProcessor? roundProcessor? Eller en ny `momentTriggerService.ts` som körs vid roundProcessor-end?

2. **Bag-of-cards-arkitekturen för Portal** — hur strukturera DashboardCard-typ + triggers + weights? Det är ett designbeslut innan implementation.

3. **Tonalitets-CSS — när ska den byta?** Vid matchday-tröskel? Vid datum-tröskel? Vid manuell konfiguration per säsong?

4. **Lo-fi vektorgrafik för moments** — vem ritar (Erik?), eller hur lågt scope håller vi första iterationen?

5. **Tidiga moments-implementation** — implementeras alla 6 i en sprint eller en åt gången? Min rekommendation: en åt gången, börja med söndagsträningen eftersom den är mockad.

---

## Lärdomar för arbetsformen denna session

Tre saker som fungerade:

**1. Research vid rätt tillfälle.** Jacobs avbrott "ska vi researcha andra spel?" mitt i UX-skissandet ändrade hela kvaliteten. Innan: jag gissade. Efter: jag stod på axlarna av FM26:s erkända problem, CK3:s designprincip, Suzerains paradigm, Reigns bag-mekanik.

**2. Mocks gör abstrakt konkret.** Två HTML-mocks (portal + moments) gjorde att vi gick från "veckans bag-mekanik" som koncept till något Jacob kunde *känna*. Diskussionen om "behövs rubrik?" och "var är bucklan?" hade varit omöjlig utan mock.

**3. Successiv förfining.** Vi gick från fem moments → fråga om tidiga moments → sex tidiga moments → upptäckte cup-omfattnings-felet → ersatte M5. Det är så bra design fungerar — inte färdiga svar i ett pass utan iteration baserat på vad nya frågor avslöjar.

Tre saker som var sämre:

**1. Jag drog gamla trådar utan verifiering.** "Erik kommer leverera Python-skript" var ett antagande från sessions-sammanfattningen som aldrig var bekräftat. Jacob fick korrigera mig.

**2. Mina första moment-förslag var alla payoff.** Det var Jacobs fråga "vad är spännande i början?" som tvingade fram tidiga etablerings-moments. Jag missade detta initialt eftersom payoff är lättare att tänka i.

**3. Code byggde med egna texter trots att STRINGS-filen fanns.** Hälften kommunikationsmiss från min sida (jag flaggade inte tydligt nog). Lärdom: när jag skapar en datafil bör jag aktivt nämna sökvägen i instruktionen till Code, inte bara i sammanfattning.

---

## Slut sessionssammanfattning
