# Bandy Manager — Design Decisions

**Levande dokument.** Single source of truth för vad som är godkänt, vad som är på is, vad som pågår.
Allt arbete (här och i `bandy-manager`-codebasen) ska kunna försvaras mot den här listan.

---

## ⚠️ ENDA DESIGNSYSTEMET ÄR DETTA PROJEKT

Det finns ett enda designsystem för Bandy Manager — och det är **detta projekt**. Färger, typografi, komponenter, copy, layout, ikoner — allt är definierat här och ingen annanstans. Codebasens `docs/DESIGN_SYSTEM.md` är arkiverad och får inte konsulteras. Vid konflikt vinner detta projekt alltid.

Hur Code arbetar mot detta: se `HANDOFF.md` § "Enda designsystemet är detta projekt".

---

## Hur dokumentet läses

| Status | Betydelse |
|---|---|
| ✅ **Godkänt** | Klart att implementera. Får inte ändras utan ny diskussion. |
| 🚧 **Pågående** | Aktivt arbete. Riktning bekräftad men inte finaliserad. |
| ⏸ **På is** | Påbörjat men avvisat. Får inte återanvändas i nuvarande form. |
| ❌ **Refused** | Avvisat principiellt. Kräver helt ny ansats om det tas upp igen. |
| 📋 **Backlog** | Identifierat men inte påbörjat. |

---

## ✅ Godkända beslut

### Säsongsnamngivning — bandyår (display)
**Var:** `src/domain/utils/seasonYear.ts` · `SeasonSummaryScreen` · `SMFinalVictoryScene` · `CupFinalVictoryScene`
**Beslut:** Absoluta säsongsreferenser — vilken säsong i tiden det är — visas som **bandyår** (spann, t.ex. "2033/34"), aldrig som ordningstal ("8/9" eller "8"). SM-final/mästare benämns med året finalen spelas (mars = andra året i spannet, t.ex. 2034); Svenska Cupen med höståret den avgörs (startåret, t.ex. 2033). **Varaktigheter och antal** (säsonger-i-klubben, "8:e säsongen") förblir ordningstal — de räknar, de pekar inte ut en tidpunkt. Basår: säsong 1 = 2026/27, styrt av en enda konstant `SEASON_BASE_YEAR` (= 2025; 25/26 är färdigspelad, spelet startar inte i det förflutna).
**Konsekvens:** Inga "Säsong N"-strängar för tidpunkter direkt i komponenter — gå via `seasonSpanLabel`/`seasonStartYear`/`seasonChampionYear`. Variabelnamn visas aldrig. Datum-mattan i `scheduleGenerator` (som använder säsongsnumret som räkne-år för veckodag/dag/månad) är skild med flit och får inte läsas för visning. Övriga "Säsong N"-ytor (history, portal, dashboard) ska svepas mot helpern — **pågående**.
**Verifierat i kod:** `src/domain/utils/seasonYear.ts`, wirat i SeasonSummary (header/cup/elim/starta-knapp) + båda victory-scenerna 2026-06-08.

---

### Portal är dynamiskt, inte statiskt
**Var:** `README.md` § "Portal — dynamiskt dashboard"
**Beslut:** Portal beskrivs alltid som **byggblock + varianter + skift-parametrar**, aldrig som en fast vy. Varje mock måste ha anteckning som listar frusna parametrar (säsong, signatur, primary-variant, situation, journalist-severity). Tokens som styr: månadsfamilj `--bg-october`…`--bg-april`, portal-mörka `--bg-portal*`, severity `--cold` / `--warm`.
**Konsekvens:** Designinstruktioner i formatet "Portal har bakgrund X och knapp Y" är fel format — ska skrivas som parameterbeskrivningar.
**Verifierat i kod:** `src/styles/global.css` (tokens), `src/presentation/screens/PortalScreen.tsx` (token-injection), `src/presentation/components/portal/` (PortalBeat, SituationCard, primary/secondary).

---

### Designfilosofin (3 principer)
**Var:** `README.md` § "Designfilosofi"
**Beslut:** Tre principer är *filter*, inte dekoration. Varje element måste kunna försvaras mot dem:
1. *"Vi har nostalgi men är inte nostalgiska"* — 70-talsliggaren bär minnet, men appen är samtida och snabb
2. Nostalgin har alltid ett jobb: **förstärkning** (harmoni) eller **kontrast** (spänning) — aldrig pastisch
3. *"Brukets själ, inte kostym"* — autenticitet, inte teater

**Konsekvens:** Pergament, sigillrullar, "Välkommen herr Patron"-copy är förbjudet. Det är pastisch.

---

### Header (GameHeader)
**Var:** `preview/components-header.html` · `bandy-manager/src/presentation/components/GameHeader.tsx`
**Beslut:** 3-kolumns grid (logo · klubb · meta), inte centrerad klump. Handritad kuvert-SVG istället för 🔔. Undertext lyft till `#C9B89A` för läsbarhet på läderyta. Georgia italic för undertext.
**Status:** Implementerad i Code (HANDOFF-BATCH-1).

---

### Wordmark — färgteknik
**Var:** `preview/brand-logo.html`
**Beslut:** Logon kan användas mot både vit och svart bakgrund, men måste **inverteras till svart** mot vit. CSS: `filter: invert(1) brightness(0)`.
**Konsekvens:** Aldrig den vita logon mot vit bakgrund.

---

### Stripes och klammer — genomgående visuellt språk
**Var:** `docs/mockups/2026-05-05_stripes_alternativ.html` (mock 1) · `docs/mockups/2026-05-06_stripes_alternativ_2.html` (mock 2)
**Beslut:** Vänster-border-stripes och full-border-klammer är del av Bandy Managers visuella språk. De används genomgående för att markera relation, state, hierarki, innehållstyp och säsongs-temperament. Mock 1 + 2 utforskade alternativ utan stripes — Jacob valde 2026-05-06 att behålla dem genomgående.

**Användningsmönster:**

| Syfte | Var | Token | Mock |
|---|---|---|---|
| Severity-relation (kall/varm) | JournalistSecondary, SeasonSignatureSecondary cold/injury | `--cold` / `--warm` 2 px + relationsbar-fyll | `colors-severity.html` |
| Säsongssignatur (övriga) | SeasonSignatureSecondary calm/scandal/transfer/dream | `--accent` / `--danger` / `--gold` / `--accent-glow` 2 px | mock 2 D |
| Klickbarhet (secondary cards utan chevron) | KlackenSecondary, CoffeeRoomSecondary, OfferCard, SituationCard, ClubExpandedCard | `--accent` 2 px + `.card-tap`-hover | mock 1 C |
| Innehållstyp — danger/skada | PlayerCard skadeblock, RoundSummary skade-alert | `--danger` 3 px | mock 1 D |
| Innehållstyp — atmosfäriskt block | SeasonSummary signatur-rubric, narrativ summary, VictoryQuote (om återinförd) | `--accent` 3 px | mock 2 E/F |
| State — oläst/scoutad/relevant/derby | InboxScreen, TabellScreen, RoundSummary relevant rad, GranskaForlop derbyrad, TransferPlayerCard, ActiveBidsList | `--accent` / `--danger` / zonbaserad | mock 1 A/B + mock 2 övrigt |
| Match-interaktion utfall | Counter/FreeKickInteraction outcome-box | `--accent` 3 px (mål) / `--bg-dark-elevated` 3 px (miss) | mock 2 A |
| Hierarki — stor händelse | ClubMemoryEventRow isBig | `--accent` 2 px | mock 2 B |
| Atmosfärisk inramning | ClubMemoryLegendsBlock, klubblegender | `--accent-dark` 2 px | mock 2 C |

**Klickbarhets-mönster (`.card-tap`):**
```css
.card-tap { cursor: pointer; transition: filter 0.15s; }
.card-tap:hover { filter: brightness(1.08); }
.card-tap:active { filter: brightness(0.95); }
```
Appliceras på alla kort med klickbarhets-stripe där ingen chevron finns. Brightness-baserat hover funkar oavsett kortets bakgrundsfärg — matchar HANDOFF #5 buttons.

**Tinter, dividers och taggar adderas — ersätter inte:**
Mockernas alternativ-förslag (bakgrunds-tint på oläst, zone-dividers i tabellen, `tag-copper "Scoutad"`-taggar) används som **kompletterande** signaler ovanpå stripes — inte som ersättning. Resultat: rikare visuellt språk.

**Specialfall som fortfarande väntar:**
- `MatchHeader.tsx:61` — `atmo.borderAccent` dynamiskt värde, kräver kontextläsning av matchatmosfär-beräkningen
- `CommentaryFeed.tsx` — väntar på Stålvallen B-redesign

**Konsekvens:** DIAGNOS B i `docs/diagnos/2026-05-05_design_krockar.md` lista är till stor del inaktuell — de listade stripes-användningarna är inte krockar. Inventeringen markeras med not.

**Status:** ✅ Beslutat 2026-05-06. Steg 3 (B2-implementation) revideras med revert-instruktion.

---

### Severity-systemet — vänsterstipe är dokumenterat undantag
**Var:** `preview/colors-severity.html` · `colors_and_type.css` (--cold, --warm)
**Beslut:** Severity-paret `--cold` (#4a6680) och `--warm` (#8c6e3a) signalerar relationell tonalitet på journalist-relationskortet (relation 0–100) och säsongssignaturer (cold_winter / injury_curve etc.). Mocken `colors-severity.html` visar mönstret som **2 px vänsterstipe + matchande relationsbar-fyll + uppercase-label i samma färg**.
**Konsekvens:** Vänster-border-accent-cards är fortsatt principiellt avvisat (§ Principiellt avvisat) — *utom* för severity-mönstret. Reglerna:
- `--cold` / `--warm` får användas som 2 px vänsterstipe + relationsbar-fill på severity-signalerande kort
- `--cold` / `--warm` får inte återanvändas för annan UI-state
- `--cold-light` (#7095b8) / `--warm-light` (#c8a058) tillagda 2026-05-05 — ljusare varianter för text-/tag-färg inom severity-domän (t.ex. label-färg i JournalistSecondary). Får inte återanvändas utanför severity.
- Andra färgtokens (`--accent`, `--danger`, `--text-muted` etc.) får inte användas som vänsterstipe på kort — prio/danger-signaler ska bäras av label-färg + ikon, inte stripe
**Implementation:** `JournalistSecondary.tsx` är konformt och behålls. Generic accent-stripes på event-cards (`EventCardInline.tsx`, `EventPrimary.tsx`) är krockar och ska bort — prio/danger-signal flyttas till label-färg.
**Datum:** 2026-05-05 (förtydligande av befintlig tolkning, inte ny regel)

---

### Tags — inga emojis
**Var:** `preview/components-tags.html`
**Beslut:** Tags förekommer aldrig med emojis. Texten bär.
**Konsekvens:** Alla `<Tag>`-användningar i Code som har emoji ska rensas.

---

### Screen CTA
**Var:** `preview/components-cta.html`
**Beslut:** Meta-rad **över** huvudtext (sans uppercase 9px, kopparfärg). Tunn kopparlinje som separator. Huvudtext stor och tung nedanför. Variant 1 och 2 har **identisk hierarki**.
**Konsekvens:** Ingen variant får ha meta-rad under.

---

### Buttons
**Var:** `preview/components-buttons.html`
**Beslut:** Status godkänt. Inga aktiva ändringar planerade.

---

### PhaseIndicator
**Var:** `bandy-manager/src/presentation/components/PhaseIndicator.tsx`
**Beslut:** Implementerad i Code (HANDOFF-BATCH-1).

---

### Pixel-scoreboard (5×7 dot-matrix)
**Var:** `preview/pixel-scoreboard.html`
**Beslut:** Westerstrand-inspirerad LED-tavla med 5×7 dot-matrix glyfer byggda i HTML/CSS. Tre färger: röd (tid/poäng), gul (utvisningar), grön (period). Goal-flash pulsar amber.
**Status:** ✅ Godkänd som byggblock.

---

### Stålvallens tavla — pixliga horisontella varianten
**Var:** `preview/scoreboard-stalvallen.html`
**Beslut:** Den pixliga varianten (5×7 dot-matrix-glyfer på Westerstrand-låda) är vald framför den "polerade" v2. Hela tavlan ska kännas som en fysisk LED-tavla, inte ett UI-element. Score och tid på samma rad, ~3× bredare än hög.
**Konsekvens:** Aldrig stapla score och tid vertikalt. Tavlan ska alltid kännas som "en blick".
**Status:** ✅ Godkänd. Integration i commentary feed pågår.

---

### Commentary feed — riktning B (Rytmen)
**Var:** `preview/commentary-redesign-v2.html`
**Beslut:** Variant B "Rytmen" valdes över A (Protokollet) och C (Tidslinjen). Pulsmätare där varje händelse har specifik visuell rytm. Pixel-scoreboard ovanför.
**Status:** 🚧 Pågående — väntar på att Stålvallen-tavlan godkänts.

---

### Intro-flöde — kontinuerlig scen (Ankomsten)
**Var:** `ui_kits/intro_flode/Intro Flode v1.html`
**Beslut:** Vägen från klubbval till Dashboard är **EN sammanhängande scen**, inte separata vyer. Spelaren klipper aldrig till svart. Bakgrunden består, genre-etiketten består ("Ankomsten" hela vägen).

**Anatomi (kumulativ):**
1. **Auto-fade in** (~3.4 s): klubbnamn (Georgia 26px) → "Onsdag kväll. Lampan vid klubbhuset lyser." → styrelsens namn + "Tre kaffekoppar redan på bordet." → CTA "Gå in →"
2. **Klick "Gå in":** Ankomstens text dimmas till opacity 0.42 + krymper till 12-18px (men *försvinner inte*). Tunn divider tonas in. Margareta (kassör, M-cirkel, vänster) syns med lägesrapport (truppstorlek, kontrakt, kassa, transferbudget). CTA: "Förstått"
3. **Klick "Förstått":** Pelle (ordförande, P-cirkel, höger) läggs till med förväntningar (placering, läktarmål)
4. **Klick "Det går bra":** Sture (ledamot, S-cirkel, vänster) läggs till med kort betydelse-replik
5. **Klick "Då börjar vi":** Fade till Dashboard

**Visuella regler:**
- CoffeeRow vänster/höger-alternering (samma som CoffeeExchange i kafferummet)
- 9px UPPERCASE letter-spacing 1.5 för speakerName
- Georgia kursiv för repliker, omslutna i `"…"`
- Initial-cirkel 32px, `--bg-dark-elevated` med `--bg-leather` border
- Progress (4 streck) visas först när dialogen startar — Ankomsten räknas inte
- Copper-glow uppifrån dimmas (0.3) när du går in (du är inomhus nu)
- DifficultyTag, "⬩ TRE SAMTAL ⬩" och separata vy-headers förbjudna i introt

**Konsekvens:** `Intro*.tsx` slås samman till en `ArrivalScene.tsx` med fyra `step`-tillstånd. Inga route-byten mellan rörelserna.
**Status:** ✅ Godkänd. Implementeras i Code (HANDOFF § 9).

---

## 🚧 Pågående arbete

### Commentary feed med Stålvallens tavla
**Plan:** Integrera den pixliga horisontella tavlan (`scoreboard-stalvallen.html`) i commentary feed (riktning B "Rytmen"). Spelhändelser (hörna, straff, slutpush etc) måste in i flödet — inte bara mål.
**Nästa steg:** Designa hur händelse-pulsen ser ut för olika typer (hörna, frispark, straff, utvisning, slutminuters-push).

---

## ⏸ På is — får inte användas i nuvarande form

### Ikoner — pilot v1, v3, v4, v5
**Var:** `preview/icons-pilot.html`, `preview/icons-pilot-v4.html`
**Anledning:** Kvalitén otillräcklig. Bandyklubbor och mål ej igenkännbara, "powerpoint-känsla", för tunna linjer, förlitar sig på SVG där bildasset hade behövts.
**Lärdom:** SVG fungerar för geometriska piktogram (hus, verktyg, geometri) men inte för organiska silhuetter (klubba, spelare, instrument). Se `lessons.md` och `briefs/ICON-BRIEF.md` § "Produktionsregler".
**Nästa ansats kräver:** Bildreferens från användaren, inte from-memory. Eventuellt extern illustratör.

### BottomNav-ikoner
**Var:** `preview/components-bottomnav.html`
**Anledning:** Claude-kodade SVG:er räcker tekniskt men har ingen designintention.
**Status:** Lämnas orörda just nu. Behandlas tillsammans med ikon-systemet i nästa ansats.

### Klubbmärken (12 st)
**Var:** `preview/brand-badges.html`
**Anledning:** Placeholders. Kräver research per ort (lokalt vapen, brukshistoria, supportergrupp-symbol).
**Plan:** `briefs/CLUB-BRIEF.md` driver FAS 4. Ej påbörjat.

### Emoji-kategori-system
**Var:** `preview/brand-emoji.html`
**Anledning:** Standard Apple/Google-emojis. Genusiska, säger inget om bandy eller bruksort.
**Plan:** Eget piktogram-språk (korslagda klubbor istf 🏒, myntpung istf 💰, etc.). Ej påbörjat.

---

## 📋 Backlog — identifierat, ej påbörjat

### Karaktärsillustrationer
**Var:** `briefs/CHARACTER-BRIEF.md`
**Vad:** Spelare, domare, politiker, styrelse, fans. Stilram + generator-logik för spelarporträtt.
**Status:** Brief skriven. Awaiting kickoff.

### Sponsorsystem (visuellt)
**Vad:** Lokala rörmokare, byggfirmor, etc. som sponsrar klubbar. Visuell behandling oklar — ska kännas autentiskt lokalt utan att tappa kvalitet.
**Status:** Diskuterat, ej formaliserat.

### Karlstad-symbolik (Solen)
**Vad:** "Solen skiner i Karlsta" som lokal devis. Karlstads klubbar kan bära den.
**Status:** Identifierat. Ej formaliserat.

### Match-grafik utöver scoreboard
**Vad:** Shotmap, formation-row, tactical events, substitutions, atmosphere indicators. Allt detta finns i Opus-mockupen `preview/screens-reference.html` men ej redesignat ännu.
**Status:** Backlog. Adresseras efter att commentary feed är klar.

---

## ❌ Principiellt avvisat

- **Pergamentbakgrunder, sigillrullar, lacksigill** — pastisch. Vi är inte 1800-tal.
- **"Välkommen, herr Patron"-copy** — pastisch.
- **Fejkad Westerstrand-tillverkare-etikett** ("Westerstrand · 1974" på scoreboarden) — museum, inte produkt.
- **Skruvar och fysiska detaljer på scoreboard** — översättning, inte rendering.
- **AI-slop-tropes** — gradient-bakgrunder på stora ytor, generic emoji.
- **"Polerad" Stålvallen v2** — för UI-mässig, tappade LED-känslan. Den pixliga varianten är vald.

---

## Hur Code (utvecklare) använder detta

1. **Innan implementation:** Läs § Godkända beslut för det område du arbetar med.
2. **Vid tveksamhet:** Konsultera `preview/`-filen som beslutet refererar till.
3. **Vid förändring:** Uppdatera detta dokument **innan** kod ändras. Aldrig efter.
4. **HANDOFF-filer** (`HANDOFF.md`, `HANDOFF-BATCH-1.md`) listar konkreta implementations-uppgifter; detta dokument förklarar *varför*.

---

### Score-primitiver — tre register för score-data (ScoreBlock + Sparkline)
**Datum:** 2026-05-23
**Var:** `src/presentation/components/primitives/ScoreBlock.tsx`, `Sparkline.tsx`, `src/presentation/styles/score-primitives.css`. Mock: `docs/mockups/2026-05-20_design_score_system.html`.

**Beslut:** Tre specialiserade register — ingen konfliktar med de andra:
- **LED-numerals** (`.scoreboard-*`, `--led-*`): live, just nu, under match
- **ScoreBlock** (`.score-block`): retrospekt, avgjord match
- **Sparkline** (`<svg>`): trend över tid (min 5 datapunkter)

**ScoreBlock som FEMTE form-primitiv:** `.card-sharp` (8px) · `.card-round` (14px) · `.tag` (pill) · `.btn` (interaktiv) + `.score-block` (2px). Radius 2px är **medvetet vassare** än allt annat — score är hårdast fakta. Får **inte** harmoniseras mot `.card-sharp`.

**Gold-regel:** `variant="gold"` reserveras uteslutande för SM-final och Cup-final. Inga andra kontexter. Tvingas vid anropssidan, inte av komponenten.

**Label-regel:** Label > 11 tecken utelämnas helt — aldrig trunkeras.

**Sparkline-regler:**
- Minimum 5 datapunkter — färre renderar tomt-tillstånd
- `vector-effect="non-scaling-stroke"` på polyline — förhindrar ojämn stroke vid viewBox-distorsion
- Normalisering: kurvan täcker alltid höjd oavsett indata-range ([1..12] och [100..1200] ger identisk kurvform)
- `yInverted=true` för tabellplacering (1 = bäst = högst upp på skärmen)
- Stroke-token per kontext: `--accent` (default), `--cold` (relation), `--success` (positiv trend)

**Mörk vs ljus variant (mellanvägen — beslutad 2026-05-23):**
- Mörk variant (portalkort): `background: var(--bg-portal-elevated)`, stripe = `--success`/`--danger`/`--warm` rakt av, num-text färgad per variant (grön/röd)
- Ljus variant (`.score-block.light`, pappersytor): `background: var(--bg-surface)`, stripe = dämpade tokens (`--success-muted`/`--danger-muted`), num-text = `var(--text-primary)` (mörk, ej färgad)
- **Regel:** stripe bär alltid resultatsignalen på båda ytor (samma primitiv). Num-färg skiftar med yta. Undantag: `gold` på ljus yta behåller gold-siffra (ceremoniell SM-final).
- **Dämpade tokens:** `--success-muted: rgba(74,124,89,0.7)`, `--danger-muted: rgba(168,74,74,0.7)` — definierade i `design-system/colors_and_type.css`
- Sparkline stroke-token `danger` (var(--danger)) tillagd 2026-05-23 — för fatigue-tryckindikator (R1)

**Konsekvens:** RoundSummary "andra matcher" migrerad till `<ScoreBlock light compact>` (2026-05-23). Nästa: GranskaForlopp, SimSummary (separat utrullning — se BACKLOG).

## D-ST1 — Seasonala tone-tokens: runtime-mutation via PortalScreen (2026-05-25)

**Problem:** `--bg-portal`, `--bg-portal-surface`, `--bg-portal-elevated`, `--accent-portal` ändras per säsongsfas (7 faser/år). Tokens behövde definieras som default-värden i CSS men saknade dokumentation om mutations-mekaniken.

**Beslut:** Behåll runtime-mutation. Default-värden (höst/vinter) ligger i `design-system/colors_and_type.css` — synliga och auktoritativa. PortalScreen.tsx useEffect skriver över dem med `document.documentElement.style.setProperty` och rensar via `removeProperty` vid unmount.

**Vilka tokens muteras:** `--bg-portal`, `--bg-portal-surface`, `--bg-portal-elevated`, `--accent-portal`

**Vilken funktion muterar:** `getSeasonalTone(currentDate)` i `src/domain/services/portal/seasonalTone.ts`. Returnerar `{ bgPrimary, bgSurface, bgElevated, accentTone }`.

**Faser och triggers:** 7 månadsbaserade faser (sep/okt/nov/dec/jan/feb/mar-aug). Varje fas har sina hex-värden i `seasonalTone.ts`.

**Konsekvens:** Komponenter som använder `--bg-portal*` eller `--accent-portal` i portal-kontexten skiftar ton automatiskt utan komponent-ändringar. Använd aldrig hårdkodade hex på portal-ytor — token-referens garanterar att tonskiftet slår igenom.

---

### Konsekvens-unifiering — DB-1…DB-9 (designkonsekvens-audit)
**Datum:** 2026-06-05
**Var:** brief `design-system/briefs/DESIGN-BRIEF-KONSEKVENS-2026-06-04.md` · mock `docs/mockups/2026-06-05_design_konsekvens_db1-9.html` · Code-mekanik `docs/CODE-KONSEKVENS-MEKANIK-2026-06-04.md`
**Bakgrund:** Designuttrycket hade glidit isär över många sessioner (mock + direkt-kod). Nio visuella systembeslut fattade i ett svep för att dra tillbaka uttrycket. Opus-diagnos → Design-beslut → inskrivning här.

**Beslut:**
- **DB-1 · Alpha/tint (master).** Enda tekniken för alpha ovanpå paletten är `color-mix(in srgb, var(--token) N%, transparent)`. Fem kanoniska steg per semantisk färg: **6%** tint-bg · **18%** divider · **30%** border/chip-kant · **35%** glow (box-shadow, sparsamt) · **55%** halv-fyllning (sällsynt). Hårdkodad `rgba()` och hex-append (`${color}18`) fasas ut → mekanisk konvertering. Tailwind-rgb (`34,197,94` / `239,68,68`) tas bort, ersätts av `--success` / `--danger`.
- **DB-2 · Guld-gräns.** Guld (`--gold`) = **fullbordad seger + bekräftad landslagsmerit (uttagen)**. Aldrig aspiration eller pågående tillstånd. Gränsfall: kontrakt-utgår → `--warm`; BoardMeeting B-läge → `--accent`; stretch-mål → `--accent`. Guld får aldrig bäras av en squad-rad-stripe (DB-5) — landslag blir chip.
- **DB-3 · Hero-score.** En primitiv: `ScoreBlock` hero-variant för alla resultat i UI-flöde (Granska, Säsongssammanfattning, Tabell-cup). Ceremoniell Georgia-siffra **endast** i de pixel-låsta segerscenerna (SM/cup). Slutar bespoke-Georgia per yta.
- **DB-4 · Numerisk behandling.** Pengar = **Georgia 700** ("almanacka, ej kalkylblad"). Score = ScoreBlock/**mono**. Statistik = **mono tabular**. Placering = **Georgia display**. Mono i BoardMeeting + sans-bold i EkonomiTab dras tillbaka till Georgia.
- **DB-5 · Squad-rad.** Vänster-stripe bär **en prioriterad state**: skada/avstängd > moral/lobby > kontrakt > ålder. Övriga states → chips. `--cold`/`--warm` tillåtna i squad-domänen som **dokumenterat undantag** (utöver journalist/säsongssignatur). Guld aldrig i stripe; landslag = chip.
- **DB-6 · Mörk-variant.** Delade kort får en riktig `.card--portal`-modifier som sätter portal-ytans tokens via CSS. Slutar inline token-override per render (t.ex. `NextMatchPrimary`). Komponenten väljer variant på `context`-prop.
- **DB-7 · Scen-typografi + atmosfär.** (a) `.h-scene-*` är kanon — inline-reimplementering dras tillbaka. (b) Scen-atmosfär tokeniseras via `--bg-scene` / `--bg-scene-deep` (radial-gradient i scener = enda sanktionerade yt-gradienten, se DB-8). Spegeln `colors_and_type.css` synkad mot `global.css` (scen-tokens tillagda 2026-06-05).
- **DB-8 · Gradient-policy.** Scrim/fade JA (läsbarhet — sticky-footer, text över foto). Dekorativ yt-fyllnads-gradient NEJ (Tabell header-strip + managed-rad, "Årets match"-kort → solid yta + accent-stripe). Undantag: scen-atmosfär (DB-7).
- **DB-9 · Radie.** Off-scale `6px` → `--radius-md` (8px). Skalan 14 / 8 / 3 oförändrad. **Obs:** `--radius-md` finns i spegeln men saknas i `global.css` :root — Code lägger till `--radius-md: 8px` i global.css före snäppning.

**Konsekvens:** Mekaniken körs via `docs/CODE-KONSEKVENS-MEKANIK-2026-06-04.md` — Tier 1 oberoende, Tier 2 nu avgrindad (alla DB beslutade). Gap-ytor (Tabell/Inbox/SimSummary) har konkreta fixar i mock-noterna.

**Avgjorda flaggor:** spegel-synk klar (scen-tokens); glow-steget (35%) konverteras **inte** automatiskt — varje box-shadow flaggas för manuell review; EkonomiTab hero-saldo → `.h-display-sm` (Georgia 22), inline-belopp Georgia 700; mock-demos använder ungefärliga %-värden (4/7/14) — Code snäpper till de fem kanoniska stegen.

**Uppföljning 2026-06-05 — Tier 1-flaggor avgjorda (Code-rapport, commit 3605904):**
- **`.h-label` ratificeras till 9px / letter-spacing 2.5px** (var 8px/2px). ~30 platser använde redan 9/2.5 självständigt — rollen var avvikaren, inte instanserna. En token-edit gör dem rena swaps; redan bytta SimSummary/QFSummary växer 1px (försumbart). *Live `global.css` av Code (bygg+test); spegeln re-synkas efter.*
- **Z-skalan utökas med `--z-header` (200) och `--z-sticky` (50)** — persistent header resp. sticky-footer saknade nivåer. Code mappar kvarvarande literaler (Portal 288, GameHeader 200/201, MatchDone 91, Help 250, RoundSummary 50) till skalan med uttalad staplingsordning för Jacobs godkännande — ingen blind snäppning.
- **SectionLabel:** `.h-label` förblir typ + 4px marginal; SectionLabel använder klassen och override:ar `margin:0` explicit där tätt behövs (avvikelsen blir avsiktlig, ej tyst reimplementering).
- **Kvar till Design (runda 2):** display/scen-rubrik-kalibrering, hjälte-CTA-variant (löser radius-12 + Dela/Historik), åldersband-taggar. Brief: `design-system/briefs/DESIGN-BRIEF-KONSEKVENS-R2-2026-06-05.md`.

**Runda 2 — R2-1…R2-3 avgjorda (Design-mock `docs/mockups/2026-06-05_design_konsekvens_r2.html`):**
- **R2-1 · Rubrik-kalibrering.** Instanser konformar till befintliga roller — ingen storleks-flora. EN ny roll: `.h-display-hero` = Georgia 52px / 900 / letter-spacing −1px, **endast** säsongsavslut + seger-hjälte (ceremoniell, DB-3-anda). Ny `.h-eyebrow` = 11px / letter-spacing 3px / uppercase / accent (skild från `.h-label` 8/2px) för återkommande "ÅRSBOK"-eyebrow. SeasonSummary h1 900 → `.h-display-hero`; BoardMeeting 23→28 + 12.5→13 (`.h-scene-*`).
- **R2-2 · Hjälte-CTA.** Sanktionera `.btn--hero`: radius 14, padding 17×22, 16px/800, glow. `.btn--hero.gold` för SM/cup-seger. Domängräns (DB-2-anda): **endast** säsongsslut/seger/cup — aldrig vardags-CTA (förblir `.btn-primary`). Stänger radius-12 (hero→14, allt annat→8) och Dela/Historik → `.btn-outline` (accent; Historik slutar vara grå).
- **R2-3 · Åldersband (DB-5-familjen).** En chip-form: radius 99, `color-mix`-fyllning, Utvecklas=`--cold`, Peak=`--success`, Avtar=`--text-muted`. `--ice` + radius-4 + grå-fyllning dras tillbaka. Guld aldrig (DB-2). Åldersband är chip, inte stripe (stripen bär actionable state).

**Avgjorda flaggor (Opus):**
- **Georgia 900-fallback:** ratificerad som best-effort. Georgia har bara 400/700 — 900 syntetiseras/klampas på de flesta OS. Hjälten bärs av **storlek (52) + letter-spacing −1px**; vikten är bonus där den finns. Ingen webfont (PWA-lätthet väger tyngre). Deklarera `font-weight: 900` som intent, acceptera bold-render där 900 saknas.
- **Pill-alpha:** **dra till DB-1-kanon (6% fyllning / 30% kant)** — inget pill-undantag. 8/40 återöppnar floran DB-1 stängde; full-färgad text+ikon bär läsbarheten, inte kanten. Samma regel gäller `.btn--hero`-glowen → kanon-glowsteget **35%**, inte 40%.

**Kvalitet Q1–Q3 — form-audit-svar (Design-mock `docs/mockups/2026-06-05_design_kvalitet_q1-3.html`, handover `docs/mockups/CODE-OVERLAMNING-DESIGNPAKET-2026-06-05.md`):**
Designs form-audit lyfte sju observationer; #4–#6 är omvandlade till beslut här. #1 (rytm i vardagen) och #3 (tomma/lugna tillstånd) kvarstår som öppen riktning; #2 (bild) och #7 (säsongston) hanteras av illustrationssystemet nedan.
- **Q1 · Sparkline-disciplin (audit #4).** Sparkline endast när riktningen i sig är info — inte default-dekoration. Max 1/kort, ~4/skärm. Squad-radens CA → tal + delta; sparkline endast i PlayerCard-modalen.
- **Q2 · `--warm`-semantik (audit #5).** `--warm` betyder **tilltagande mänskligt tryck** — en betydelse, inte sex. Åldersband "avtar" → `--text-muted`; vardagskafferum → `--cold`. (Skärper squad-undantaget i DB-5/R2-3.)
- **Q3 · Emoji vs Lucide (audit #6).** Emoji = diegetiskt (klacken, kafferum, närvaro), Lucide = chrome (status, riktning). Konvertera `▾ ● 🌱 🔥 💔` → Lucide (TrendingDown/Circle/Sprout/Flame/HeartCrack, stroke 1.8). Behåll `🏒 📣 ☕ 🩺 🇸🇪` + kategori-set + ★ rating.

**Illustrationssystem — form-audit #2/#7 (mock `docs/mockups/2026-06-05_design_illustrationssystem.html`, briefer `BESTALLNINGSBRIEFER-ILLUSTRATIONER-2026-06-05.md`):**
- **Domnäregel (som guldet):** illustration **endast vid ögonblick** — ankomst, säsongsstart, ceremoniella speldagar, slutspel/final, seger, kris. **Aldrig bakom vardagsflöde** (portal, trupp, transfers). Kort äger vardagen. Späd inte ut — då tappar ögonblicken sin vikt.
- **Komponent:** `<IllustrationScene mode src alt>` med tre lägen (`fullbleed` / `band` / `header`) + inbyggd scrim (DB-8-sanktionerad gradient — text aldrig naken på bild). Placeholder-yta (`--bg-portal-surface` + accent-ram + mono-label) tills bilden finns; ingen trasig img.
- **Bildbank:** `public/assets/illustrations/` (parallellt med `public/assets/portraits/`), refererad `/assets/illustrations/{namn}.jpg`. **OBS:** handover-paketet skrev `src/assets/` — fel för det här projektet; statiska bilder ligger i `public/`. Tre finns (intro/annandagen/final), fem beställda (nyarsbandy/varsol/kafferummet/derby/nedflyttning).
- **Konstanter:** vertikal ~1436×2550, platt woodcut, navy-natt eller is-dag, **en** varm accent per bild, bruksort-skala, silhuetter ej porträtt. Finalen alltid Uppsala. Ceremoni-bilder (annandagen/nyår) alltid ljusa oavsett tabelläge.

**Q4 · Vardagsrytm & tystnad — form-audit #1/#3 (mock `docs/mockups/2026-06-07_design_vardagsrytm_portal.html`):**
Form-auditens #1 (vardagen saknar rytm) och #3 (tystnaden odesignad) är samma problem sett från två håll — löses som ett spår. C-N1 (stiltje) generaliseras från en specifik vy till en princip för hela vardagen.
- **Tystnad är inte "mindre" — det är en annan prioriteringsyta.** En lugn vecka är när det tålmodiga, icke-tidskritiska får sin scen: den unge som utvecklas tyst, kontraktet som tickar, bygden som lever på. Inversen av story-slot — samma slot, motsatt urval: story-slot lyfter drama, tålamodskortet lyfter det långsamma när dramat tiger.
- **Mekanik:** `andningsrad` (full-bredds atmosfärisk rad) bryter kort-väggen; `tålamodskort` lyfter veckans tysta fokus. Löser "tight vs airy" — vardagen är inte tom, den är tålmodig.
- **Omfång:** portalen djup först (mest sedd), trupp + granska generaliseras därifrån.
- **Öppet:** tålamodskort endast vid stark kandidat — tomt är bättre än tvingat "i tysthet" som rutin.

**Q3-precisering (i kontext, upptäckt i vardagsrytm-arbetet):** diegetiskt → emoji, chrome → Lucide, **men diegetiskt OCH känslo-laddat → emoji vinner även om det tekniskt är data.** `💔` ("hälsar inte längre") stannar emoji — HeartCrack-Lucide kallnar den varma raden. Funktionella Lucide (kalender, trend) sitter fint intill Georgia. Konverteras: `▾ ● 🌱`. Stannar: `💔` (+ `🔥` när det markerar burnout/känsla, ej ren streak-statistik). Verifieras i varm rad, ej på spec-yta.

---

## Visuell rikedom — tre lager, skild frekvens (2026-06-07)

Reserv-principen (guld, hjälte, ceremoni-illustration sällsynt) vaktar mot *inflation* men sa inget om *svält*: en klubb som aldrig når finalen ska inte mötas av enbart text och ramar. Det är inte reserv, det är fattigdom. Lösningen är att skilja **ceremoni** (händelse) från **grundvärdighet** (textur) — två olika saker vi felaktigt buntat ihop.

Tre lager med medvetet skild frekvens:
1. **Ceremoni** (full-scen-illustration, guld, hjälte-typ) — *sällsynt*, avbryter, stoppar dig. Reserven gäller här, oförändrat.
2. **Miljö** (konstant bruksort-header) — *konstant*, rik, omger varje vardagsyta, tävlar aldrig om fokus. Lika rik som ceremonin men återkommande i stället för sällsynt.
3. **Innehåll** (kort, text) — informerar.

De konkurrerar inte: ceremoni avbryter, miljö omger, innehåll informerar. Mörk-rik header mot ljust pappers-kropp ger ljus-mörk-rytm — headern är vyn ut, korten liggaren på bordet.

**Regler som håller alla tre intakta:**
- Miljö-lagret får vara *vackert* men måste *recedera* — neutralt, stillsamt, header-band, fade mot papper. Test: går ögat till innehållet, inte till miljön. "Ambient = konstant närvarande, inte blekt" — men aldrig fokus.
- Miljö-lagret lånar aldrig ceremonins vokabulär: inget guld, ingen hjälte-typ, ingen fullbleed-takeover, ingen laddad händelse. Plats, inte scen.
- Miljö-lagret är billigt/återanvändbart: en bas-bild, tintad i kod per säsong/väder, aldrig per-tillfälle. Per-klubb-identitet bärs av billigt overlay (märke + klubbton + namn), inte av 12 målningar.
- **Vakt mot motsatt creep:** börjar miljö-lagret använda guld, fullbleed eller laddade händelser har vi inflaterat på nytt. Ceremonin måste fortsätta skilja sig *i art* — en laddad händelse med fokus, miljön en stilla plats utan. När vardagen också är målad kommer ceremonins kraft från att den *avbryter lugnet*, inte från måleri-mot-text. Ceremoni-bilderna får därför luta hårdare åt att vara *händelser* (människor, drama, ögonblick) för att stå ut mot den stilla headern.

Grundvärdighet är inte polish — bruksort-vardagen ÄR USP:n. Mest atmosfär-investering hör hemma i vardagen, inte i den sällsynta finalen.

---

**Implementations-noter (2026-06-07, Code-rapport — 8f99981 infra, 72982c6 DB-1):**
- **DB-1 körd i två faser (ratificerat).** Code separerade DB-1:s två mål: (1) *tekniken* — all hårdkodad palett-`rgba()` → `color-mix(var(--token) N%)`, **exakt-alpha bevarad** (0.08→8%), 231 konv./50 filer, noll visuell ändring. Strukturmålet nått: tokens/säsongston styr färgen, ingen hårdkodad palett-RGB kvar. **Klart.** (2) *kanon-snäppningen* till 5 steg = en *visuell* ändring (mockens egen CSS använder mellansteg 7/8/12/14/25/40 — snäpp skiftar alphas synligt). **Skjuts till eget visuellt pass med playtest (BACKLOG: DB-1 Fas 2).** Alpha-floran lever kvar tokeniserad tills dess — medvetet. Hård-snäppa INTE nu.
- **z-staplingsordning applicerad (`e9aa268`), med en kontext-korrigering:** PortalScreen:288 var INTE en modal (tidiga scanningen fel) utan den sticky botten-CTA:n ovanför BottomNav (persistent chrome) — `--z-modal` hade lyft den över modaler, så den mappades rätt till `--z-header` (under modaler, över innehåll). GameHeader save-toast 201→`--z-toast`, HelpOverlay 250→`--z-overlay`, MatchDoneOverlay 91→`--z-overlay` (91 var latent under-dropdown-bugg). MatchDone+Help delar 400 (samexisterar aldrig). Playtest-koll: toasten 201→600 (över modaler, rätt); och att botten-CTA:n på header-nivå (200, över dropdowns 100) inte hamnar framför något som ska täcka den.
- **Två luckor att stänga:** (a) `74,102,128` i SeasonArcCard = `--cold`, missades i token-mappen — konvertera (ej glow, ej uppskjuten). (b) SquadScreen CA-glow/fitness (Tailwind-grön/röd i text-shadow) är både Tailwind-rgb *och* glow — blockerar gate-villkoret "Tailwind-rgb borta" tills glow-passet kört. Gate→error först efter glow-passet (ratchet håller).
- **DB-4 bekräftat:** ScoreBlock var redan mono; EkonomiTab saldo → `.h-display-sm`. Infrastruktur (`.h-label` 9/2.5, z-tokens, `--radius-md` — fixade en latent radie-bugg där `var(--radius-md)` löstes till intet — SectionLabel) klar.

---

*Senast uppdaterad: 2026-06-07 — tre-lager visuell rikedom (ceremoni/miljö/innehåll) inskriven; DB-1 tvåfas + z-stapling + infra*
