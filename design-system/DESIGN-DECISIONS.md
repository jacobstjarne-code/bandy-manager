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

*Senast uppdaterad: 2026-05-06 — stripes och klammer omdefinierade som genomgående visuellt språk (Mock 1+2-besluten konsoliderade)*
