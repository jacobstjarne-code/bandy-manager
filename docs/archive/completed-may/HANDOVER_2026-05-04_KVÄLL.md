# HANDOVER — Bandy Manager
## 2026-05-04, sen kväll

**Du är ny Opus. Läs detta innan du gör något annat.**

Tidigare handovers har misslyckats — ny Opus har irrat runt i timmar och börjat om från noll. Detta är ett försök att fixa det. Strukturen är gjord så du kan hoppa direkt till "Var vi är just nu" om du behöver komma igång snabbt, men du *bör* läsa hela första halvan innan du arbetar.

---

## INNEHÅLL

1. **Kritisk orientering** (läs först — 2 min)
2. **Var vi är just nu** (status precis)
3. **Vad spelet är** (vision, ton, vad som differentierar)
4. **Hur vi kom hit** (historien, kort)
5. **Vad som har glidit** (ärligt, så du inte gör om felen)
6. **Min sista flödesanalys** (vad funkar, vad funkar inte, vad nästa fokus borde vara)
7. **Tonalitet — bandysvensk** (regler + exempel)
8. **Designsystem — visuell kanon**
9. **Process — Opus + Code arbetsfördelning**
10. **Aktuella specer och pågående arbete**
11. **Jacob — vem du arbetar med**
12. **Konkret nästa steg**

---

## 1. KRITISK ORIENTERING

### Tre saker du absolut INTE får göra

**A) Skicka spec till Code utan att ha läst designsystemet och berörda mockar.**
LESSONS #28 dokumenterar tre falska "✅ LEVERERAD"-statusar som uppstod när Opus eller Code byggde utan att verifiera mot kanon (mock + designsystem). Konkret: knapparna idag (2026-05-04) byggdes som pill-stil (`borderRadius: 999`) trots att designsystemet redan har `.btn-primary`/`.btn-outline`. Jag specade det utan att kolla. Code följde utan att flagga. Det måste revertas. Gör inte om det.

**B) Markera spec som "✅ LEVERERAD" på Code-rapport.**
✅ sätts ENDAST efter Jacob playtest-bekräftat. Code-rapport = `🔄 KOD KLAR`. Detta är process-fix A från `docs/diagnos/2026-05-04_kvar_audit.md`. Tidigare handovers har låtit bli att betona detta och resultatet har varit en kedja av falsk-leveransstatus. Det stannar nu.

**C) Föreslå "lägg till en text-yta" som lösning på något.**
Detta är min största synd i projektet. Jag har specat fyra-beats-scener, Portal-kort, status-rader, hänvisningar — när problemet egentligen handlar om att spelaren inte har *val* eller *agens*. Om en spec lägger till mer text utan att lägga till mer handling — granska om om om innan du skickar.

### Tre saker du absolut MÅSTE göra först

**A) Läs `docs/CLAUDE.md` hela vägen igenom.** Inte skim. Läs.
**B) Läs `docs/LESSONS.md` — alla 28-30 lärdomar.** Speciellt #25, #28.
**C) Läs `docs/diagnos/2026-05-04_kvar_audit.md` + sista flödesanalysen i sektion 6 nedan.**

Sen kan du börja arbeta.

---

## 2. VAR VI ÄR JUST NU (2026-05-04, sen kväll)

### Levererade idag (✅ LEVERERAD, playtestade)
- **SPEC_SHOTMAP_OMARBETNING** — halvcirkel-paths enligt mock, riktningspilar, viewBox 280×230. Min symptomfix från tidigare på dagen är reverterad.
- **Diagnos C-fix** — `generatePressConference` borttagen från `postAdvanceEvents.ts`. Dubbel-presskonferens-buggen löst.
- **Cup-intro + cup_final-intro scener** (Kategori B från Steg 4)
- **Fix Z** — terminologi i shotmap-stats (träffsäkerhet)
- **Halvleks-init-bug** i `matchEngine.ts` — `onTargetHome/Away` fördes inte över mellan halvlekar, fixat
- **KVAR-audit** — `docs/diagnos/2026-05-04_kvar_audit.md` skriven, identifierade falska ✅-statusar
- **LESSONS #28, #29, #30** — uppdaterade

### Levererade idag (🔄 KOD KLAR, ej playtestade än)
- **SPEC_GRANSKA_OMARBETNING — kärnimplementation** — `getCriticalEventsForGranska(...).slice(0, 3)`, `ReaktionerKort` byggt och placerat, "X spelarhändelser i Spelare-fliken" / "X notiser i inboxen"-hänvisningar
- **KRING SPELARNA-sektion** i GranskaSpelare.tsx — visar PLAYER-events
- **Fix B (knappstil)** — pill-stil — **MEN DENNA SKA REVERTAS**, se nedan
- **Fix C** — "X notiser i inboxen"-text

### Akut TODO (måste göras innan Jacob spelar igen)
- **Reverta pill-stilen i EventCardInline.** Använd `.btn .btn-primary` / `.btn .btn-outline` enligt global.css. INGA inline-overrides.
- **Kafferum-CTA** — "Tillbaka till dashboarden" → "Tillbaka till klubben". Är specat i SPEC_KAFFERUMMET_FAS_1 redan men implementationen avviker.
- **mediaReaction-placering** — utred om "📰 MEDIA / Helena Wikström / Mats Friberg-citat" ligger SEPARAT från ReaktionerKort eller INOM. Beslut beroende på utfall.

### Sen pausat (på förslag, inte påbörjat)
- **SPEC_BESLUTSEKONOMI_STEG_4** — fas-scener + scen-konsekvens. Specen ligger i `docs/SPEC_BESLUTSEKONOMI_STEG_4.md`. Mock i `docs/mockups/scen_konsekvens_mockup.html`. **Påbörjas INTE** förrän Granska-omarbetningen är fullt verifierad och vi haft en samtal med Jacob om vart fokus ska härnäst (se sektion 6 om varför fokus kan behöva ändras).

### Jacob's sinnesläge just nu
Trött, frustrerad, men inte uppgiven. Sa ikväll: "ganska nära att ge upp på hela projektet känner jag" och "fan hopplöst". Senare: "ok. den här kontexten tar alldeles för mycket plats. men alla tidigare handoffs har misslyckats. lägg tid och energi på att skapa en handover som verkligen fungerar."

Han är inte ute efter trösta-mig-svar. Han vill se att jag förstår vad som har glidit och kan jobba annorlunda. Han har genuint flaggat **att de delar av spelet han uppskattar är de som jag INTE rört** — splash, NameInput, ClubSelection. De delar som glidit är de jag specat. Det är data, inte dramatik.

---

## 3. VAD SPELET ÄR

**Bandy Manager.** Svenskt bandy-management. TypeScript/React/PWA. Deployed på Render.

### Vision
Inte en FM-klon med bandy-skin. Inte en generisk sportsmanagementspel. **Bandysvensk atmosfär gör spelet unikt.** Bruksort-stämning. Parkeringsstämning. Understatement. Hyttvallen, Slagghögen, Strandvallen. Kassörens "Mer har vi inte". Kioskvakten som sitter på samma plats varje match.

Inget annat managementspel ser ut, låter eller känns så här. Det är spelets enda riktiga fördel mot 25 år av FM-utveckling. Förlora den och spelet finns inte.

### Differentiering mot konkurrenter
- **Football Manager**: enorm databas, presskonferens med val, tactical depth. Vinner på mekaniskt djup.
- **Out of the Park Baseball**: 100-årig karriärspel, dynastier över decennier, statistisk nostalgi. Vinner på longevity.
- **Bandy Manager**: ingen kan slå FM på mekanik eller OOTP på databas. **Vinner på världens specifikitet.** En liten värld, fullt levd. Tolv klubbar, alla med personlighet. Bruksortskänsla. Bandysvensk vardag.

### Spelets nuvarande fokus
Säsong 1 omg 1 till säsongsslut. PWA, mobil-först (430px). Match-flöde med interaktiva hörnor och straffar. Granska-vy efter match. Portal-arkitektur som ersätter klassisk dashboard. Beslutsekonomi-system där events klassificeras enligt uppmärksamhet (CRITICAL/PLAYER/REACTION/INBOX).

---

## 4. HUR VI KOM HIT (kort)

### Tidiga utvecklingen (~Sprint 1-15)
Klassisk dashboard. Match-motor byggd och kalibrerad mot bandygrytan-data (420 Elitseriematcher). 12 fiktiva klubbar med klacknamn, arenanamn, supportergrupper. Cup, slutspel, transfers, scouting, träning. Det grundläggande spelets infrastruktur. Mycket text-arbete på ortsbeskrivningar, klubb-quotes, narrativeService för spelarbiografier.

**Det funkade.** Inte perfekt, men funkade. Spelaren spelade match efter match, fick events, fattade beslut.

### Omställningen till Portal (Sprint ~22-26)
Klassiska Dashboard ersattes med Portal — en bag-of-cards-arkitektur där varje runda visar ett primary-kort (NextMatch, Derby, Patron-demand, etc), 1-3 secondary cards, och en minimal-bar. SituationCard överst (kontextuell statusrad), PortalBeat (atmosfär-rad). Tanken: variation per omgång, atmosfär per säsongsfas, mer engagerande.

**Resultat (ärligt):** arkitekturen är solid. Men för säsong 1 omg 1 fungerar den inte — den visar tre kort som alla säger ungefär samma sak ("det börjar nu"), spelaren har inga val, ingen handling. Det blir en lugn intro där det egentligen borde vara den mest spändt laddade dagen i hela spelet.

### Beslutsekonomi-systemet (Sprint ~26-28)
Events klassificerades som critical/player/reaction/inbox-only. EventOverlay för critical, EventCardInline för rest. attentionRouter, eventQueueService, MAX_ATMOSPHERIC_PER_ROUND. SPEC_GRANSKA_OMARBETNING begränsade Granska Översikt till max 3 critical events.

**Resultat:** arkitekturellt rätt riktning. Men flera specer markerades ✅ LEVERERAD trots att de aldrig integrerades i UI. Detta upptäcktes idag (2026-05-04) — `granskaEventClassifier.ts` fanns som fil men importerades aldrig, `ReaktionerKort` fanns inte ens som fil. Implementeras nu på riktigt (idag).

### Senaste 2 veckor
Scener, kafferum, sunday-training, journalist-relation. Dramaturgi-arbete. Mycket text-arbete från min sida (Opus). Mindre handlings-arbete.

---

## 5. VAD SOM HAR GLIDIT (var ärlig — du gör om det annars)

### A) Falsk leveransstatus
Tre specer markerade ✅ LEVERERAD i KVAR.md utan att faktiskt fungera i playtest:
1. **SPEC_GRANSKA_OMARBETNING** — services existerade som filer men aldrig importerade i UI
2. **SPEC_SHOTMAP_OMARBETNING** — halvcirkel-paths aldrig levererade, original-rektangulär kod kvar
3. **Möjligen fler** — KVAR-auditen är ofullständig, SPEC_BESLUTSEKONOMI Steg 1-3 har ej auditerats

**Rotorsak:** "Code rapporterar klart" + "Opus klickar ✅ utan playtest" + "ny session börjar utan att kolla". Process-fix A-D i kvar_audit ska förhindra det.

**Ditt jobb:** alla "✅ LEVERERAD"-rader från innan 2026-05-04 ska behandlas som potentiellt falska tills Jacob playtestat och bekräftat.

### B) Mock-disciplin har brutits flera gånger
LESSONS #28 dokumenterar mönstret. Mocken finns. Implementationen avviker. Någon gör en symptomfix utan att kolla mocken. Implementationen blir ännu mer avvikande. Cykel.

**Konkret 2026-05-04:** Shotmap visade rektangulära boxar (avvek från mock). Jag (Opus) lade till streckad mittlinje + "MOTSTÅNDARMÅL"-etiketter som "fix". Det fjärmade implementationen ÄNNU MER från mocken, som har grå separator + riktningspilar. Jacob fångade det: "den borde ju implementeras som den är mockad". Min fix reverterades och shotmap byggdes om enligt mock.

**Lärdom:** Innan ANY edit på en komponent som har en mock — öppna mocken. Verifiera vad den säger. Sen besluta om buggen är (a) implementation som avviker → återimplementera, eller (b) faktisk mock-spec-bug → uppdatera mocken först. Aldrig "justera implementationen på måfå".

### C) Mitt eget reaktiva mönster
Jacob flaggade detta uttryckligen ikväll: *"närhelst jag påpekar något så skriver du 'förlåt, det stod i specen'."* Det är korrekt observation.

Mitt mönster har varit:
- Skriva spec utan att verifiera mot designsystem/mockar
- Code följer specen
- Buggen syns i playtest
- Jag säger "min spec sa fel saker" eller "Code följde specen bokstavligen"
- Reaktiv ursäkt istället för proaktivt grepp

**Vad du ska göra annorlunda:**
- Innan spec skickas: läs designsystem + mockar + befintliga implementationer av liknande komponenter
- Granska Code-leveranser visuellt (jämför med befintliga skärmar) innan du markerar något klart
- Spec-förbättring är inte en ursäkt-genväg — om en spec genererar fel, problemet är specen, inte Code

### D) Skiftet från handling till text
Det här är den allvarligaste glidningen. Jacob sa rakt ut ikväll: *"allt det du säger är bra är det som INTE ändrats sen dina nya idéer tog över... det var plottrigt innan men extremt mycket bättre."*

Konkret: tidiga skärmarna (splash, NameInput, ClubSelection) är **handling-tunga med atmosfär som kontext**:
- Splash: "Strålkastarna tänds. Isen ligger klar. Det doftar korv från kiosken." → Du klickar "STARTA KARRIÄREN".
- NameInput: "Vem är du? Bandyn behöver folk som dig..." → Du skriver ditt namn.
- ClubSelection: "Tre klubbar har ringt. Bandysverige är ett litet rum." → Du väljer en av tre.

Texten betyder något för spelaren *just därför att hen sen agerar på den*. Atmosfären är kontext.

Senare skärmarna (BoardMeeting, Portal omg 1, Granska, scener) är **text-tunga med handling som klick**:
- BoardMeeting: 4 beats av text. Spelaren klickar "Förstått / Det går bra / Då börjar vi". Inga val.
- Portal omg 1: SituationCard + PortalBeat + secondary cards. Tre kort som alla säger ungefär samma sak. Inga val på Portal-nivån.
- Kafferum: tjuvlyssning utan kontext. CTA "Tillbaka till dashboarden" (fel ord).

Texten har blivit **fordonet** istället för **kontexten**. Spelaren läser, klickar, läser, klickar. Det blir en interaktiv roman. Inte ett spel.

**Detta är min skuld.** Jag specade text. Jag specade scener. Jag specade kort som visar status. Jag har sällan specat val.

**Vad du ska göra annorlunda:** specer ska börja med "**var är spelarens val här?**" Inte "vilken text ska visas". Om en spec inte har ett tydligt val per skärm/scen — ifrågasätt om den ska skickas. Om ja, vilken handling tillkommer? Om bara "läs" — överväg om skärmen behövs alls.

---

## 6. MIN SISTA FLÖDESANALYS (gjord 2026-05-04 kväll)

Jag gick genom första 30 minuternas flöde i koden ikväll. Detta är vad jag faktiskt såg, ärligt.

### Vad spelet gör bra (och varifrån)

**Splash + NameInput + ClubSelection** — *spelets bästa tio minuter*. Texten sitter, fonten sitter, tonen är distinkt. Inget annat managementspel ser ut så. Detta byggdes innan Portal-omställningen.

**Match-motorn** — kalibrerad mot bandygrytan-data. 420 Elitseriematcher. Statistiskt äkta resultat. Hörnor som centralt offensivt vapen. Interaktiva hörn- och straff-stunder.

**Klubbarna** — 12 fiktiva klubbar på riktiga bruksorter. Patron, mecenater, klacknamn (Hammarsmederna, Glasblåsarna), arenanamn. Alla med distinkt personlighet. CLUB_TEMPLATES är genuint bra.

**Bandyspråket** — i texterna som finns. Wienerbröd. Tisdagkväll i december. "Mer har vi inte". "Vi sålde slut". Det sitter när det väl är skrivet.

**Klassificeringssystemet** — 43 events klassificerade i CRITICAL/PLAYER/REACTION/INBOX. Generell priority-override-regel. Genomtänkt arkitektur. Klart 2026-05-04, godkänd av Opus, väntar på integration.

### Vad spelet inte gör bra

**BoardMeeting** — 4 beats av text utan val. Karaktärer dyker upp som speakers utan introduktion. CTA-orden ("Förstått", "Det går bra", "Då börjar vi") är generiskt fillerprat. Spelaren får ingen agens, ingen koppling till de personer hen ska arbeta med en hel säsong.

**Portal omg 1** — designat för säsong 2+ när det finns klubbminne, journalistrelation, säsongssignatur. Vid första matchen visar den tre kort som alla säger ungefär samma sak. Layout identisk med Portal omg 14. Premiärspecifikt drama saknas.

**Kafferum** — bra koncept (tjuvlyssna efter styrelsemöte), men introduceras aldrig. Spelaren kastas in. CTA "Tillbaka till dashboarden" — vi använder inte ordet "dashboard" i spelet annars.

**Match — pre-match-momentet** — saknas. Spelaren klickar "Spela omgång X" och hamnar direkt i matchen. Ingen 30-sekunders skärm som etablerar varför *just denna* match är värd uppmärksamhet. FM gör pre-match notes från assistant. OOTP gör rivalry stakes. Bandy Manager: knapp.

**Granska Översikt** — efter SM-kvalmatchen i 89:e ser den likadan ut som efter bortamatchen i omg 4. Ingen visuell signal som speglar dramatiken. Atmosfär stannar i text, tar sig inte in i designen.

**Spelarkortet** — fullt med data utan hierarki. Form, kondition, moral, skärpa, dubbelliv, egenskaper, marknadsvärde, kontrakt, karriärresa, ledarskap, samtal — alla på samma yta. Spelaren vet inte var blicken ska landa.

### Var fokus borde ligga härnäst (mitt förslag, inte beslut)

**Inte ny arkitektur. Inte fler scener. Inte fler kort.**

**Återbalansera mot handling:**
1. **Lägg minst ett val i BoardMeeting** — påverkar boardPatience eller starting-mood marginellt. Etablera spelaren som tränare innan hen ser Portal.
2. **Premiär-specifik dramaturgi i Portal omg 1** — något som *bara* visas innan första matchen. Klubbruterier, supporterförväntan, lokalpressens första kommentar. Inte ytterligare en SituationCard.
3. **Pre-match scen-stund** — kort, en mening, en bild. Etablerar matchen. Kan vara textbaserat men måste introducera *vad som står på spel just nu*.
4. **Karaktärer behöver visuell representation** — också enkla bokstavsavatars (som kafferummet redan har) räcker. Ge styrelsemedlemmar ansikten.
5. **Spelarkortet — hierarki, inte fler fält.** Vad är topp 1 vad spelaren ska titta på? Hitta det. Resten kan vikas eller flikas.

**Vad jag SKULLE undvika att börja med:**
- Steg 4 (fas-scener) — det är fortsatt text-tung leverans. Bra arkitektur-mässigt men ger inte spelaren mer agens.
- Fler atmosfäriska systemkopplingar (THE_BOMB) — det är polish, inte fundament.

**Vad jag SKULLE rekommendera:**
- Steg av tillbaka från specer en stund. Spela spelet i 30 minuter med Jacob över skärmen. Identifiera tre platser där spelaren *vill agera men inte kan*.
- En av dessa fixar du först. Ny scen, ny CTA, ny knapp på en befintlig skärm.

Detta är min analys. Jacob bestämmer vart fokus ska. Inte jag.

---

## 7. TONALITET — bandysvensk

### Vad det ÄR
- **Konkret vardag.** Wienerbröd. Sillen. Sjyrare på fredag. Kaffekassan. Sju röster om någon vägrar betala 25 kr för en korv.
- **Understatement.** "Mer har vi inte." "Det går bra." "Vi sålde slut." Ingen försöker imponera.
- **Parkeringsstämning.** Människor som väntar utanför arenan, snackar om allt utom matchen. Vaktmästaren som vet vad nya killen heter men inte hälsade.
- **Mörk humor utan att vara cynisk.** Klacken sjunger på trots tomma läktare. Birger trummar ensam efter tredje raka förlusten.
- **Bisatser dödar humor.** Ofta. Enrader när det går.

### Vad det INTE är
- **Inga LLM-meningspar** där rad två förklarar rad ett. *Bra:* "Kioskvakten: 'Ingen kommer betala 25 kr för en korv i den här kylan.' Kassören: 'Det sa du förra året. Vi sålde slut.'" *Dåligt:* "Det är inte X, det är Y."
- **Inga TV-panel-platityder.** "Spelarna har gett allt." "Det är det som gör skillnad."
- **Inga "försöka vara rolig"-fraser.** Frånvaron av ambition är poängen. Om det är roligt så är det för att Sverige är så.
- **Klacken acknowledger aldrig att något är fel.** Birger trummar trots tomma läktare. Klacken sjunger på. Narratorn observerar timing/sync, klacken inte.
- **Attribution kan tas bort när texten själv bär rösten.** Cit. inramning ("Patron säger:") behövs inte alltid. I kafferummet behövs det däremot — vem som säger något är poängen.

### Konkreta bra exempel (referens)
- Splash: *"Strålkastarna tänds. Isen ligger klar. Det doftar korv från kiosken."*
- NameInput: *"Bandyn behöver folk som dig. Som ställer upp en regnig tisdagkväll i december. Som vet att en hörna i 87:e kan vända allt."*
- ClubSelection: *"Tre klubbar har ringt. De har hört att du letar tränarjobb. Bandysverige är ett litet rum."*
- BoardMeeting kassör: *"Truppen är 24. Kassa 320 tkr, transferbudget 50. Mer har vi inte."*
- Kafferum kioskvakt: *"Ingen kommer betala 25 kr för en korv i den här kylan."*
- Kafferum kassör: *"Det sa du förra året. Vi sålde slut."*

### Konkreta dåliga exempel (att inte göra)
- *"Det är inte vad du gjort, det är vad du gör nu som räknas."* — LLM-meningspar.
- *"Spelarna har gett allt och det är det som gör skillnad."* — TV-platityd.
- *"Vi är inte bara ett lag, vi är en familj."* — säljpitch.
- *"Tillbaka till dashboarden"* — fel ord, vi använder inte "dashboard" i UI.

### Karaktärs-konsekvens
Karaktärer ska ha distinkta röster.
- **Lars Berglund (ordförande)** — tillståndsneutral öppning, formell men inte stelt
- **Lennart Dahlgren (kassör)** — siffror, understatement, "mer har vi inte"
- **Mikael Sandberg (modernist)** — försiktig öppning mot förändring
- **Rune Eriksson (traditionalist)** — stark röst, ifrågasätter förändring
- **Tommy Lindqvist (supporter)** — *behöver omtag*, ska vara "byns öra från kiosken", rapporterar vad han sett/hört

Patron = en per klubb (Brukspatron, IT-entreprenör etc). Mecenater = flera. 50% kvinnor. Backstory på varje mecenat (en rad).

---

## 8. DESIGNSYSTEM — visuell kanon

### Auktoritativa filer (läs vid varje ny spec som rör UI)
- `src/styles/global.css` — färg-tokens, typografi, knapp-klasser, tag-klasser
- `docs/DESIGN_SYSTEM.md` — komplett designsystem (20 sektioner)
- `docs/mockups/` — alla HTML-mockar. Auktoritativa för layout/visuellt.

### Knapp-hierarki (kopierat från global.css — VERIFIERA)
- `.btn .btn-primary` / `.btn .btn-copper` — gradient copper (#DD9555 → #8B4820), vit text, borderRadius 8px. **Primär CTA. Max 1 per skärm.**
- `.btn .btn-outline` — transparent + 1.5px copper border, accent-dark text. **Sekundär action.**
- `.btn .btn-ghost` — bg-surface + border-dark, text-secondary text. **Val i listor/modals.**
- `.tag-*` — pill-form (borderRadius 99px). **INFO-LABELS, INTE KNAPPAR.**

**REGEL:** Använd `.btn`-klasserna med klassnamn. Inga inline-overrides på borderRadius, padding, fontSize. Klassen styr. Om resultatet ser fel ut visuellt — flagga, ändra inte själv.

### Kort-system
- `.card-sharp` — standard, all funktionell information. `padding: '10px 12px'`
- `.card-round` — atmosfär ENDAST. Citat, dagboken, stämning. INTE för funktionella kort.
- INGA andra korttyper. INGA inline borderRadius.

### Sektions-labels
```tsx
<p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
  💰 EKONOMI
</p>
```
Alltid med emoji. Standardiserade emojis i DESIGN_SYSTEM.md sektion 2.

### Layout-principer
- Tight, inte luftig. Mobil 430px.
- Padding-värden: 10px 12px (kort), 7px 10px (enrader). INTE 14px 16px, INTE 16px 20px.
- Skärmar via BottomNav har INGEN rubrik-rad. Hierarkisk navigering OK.
- Action-knappar: INTE fullbredd. CTA-knappar: FÅR vara fullbredd.

### Färger — ENDAST CSS-variabler
```bash
grep -rn "#[0-9a-fA-F]\{6\}" src/presentation/ --include="*.tsx" | grep -v node_modules | grep -v ".svg"
```
Ska returnera 0 rader. Hårdkodade hex är förbjudet utanför SVG-illustrationer och global.css.

### Pixel-jämförelse-protokoll (commit-blocker)
För varje UI-ändring som har en mock i `docs/mockups/`:
1. Code skärmdumpar appen i 430px-bredd
2. Jacob/Opus jämför sida vid sida med mocken
3. Avvikelser dokumenteras eller åtgärdas
4. Inget commit utan denna jämförelse om mocken existerar

---

## 9. PROCESS — Opus + Code arbetsfördelning

### Opus (du) gör
- Specer (när nödvändigt — *fråga först om en spec faktiskt behövs*)
- Svensk text med bandysvensk ton
- Granskning av Code-leveranser (visuellt, mot designsystem)
- Direkta MCP-edits för små ändringar (< 50 rader, 1-3 filer)
- Pixel-jämförelse mot mockar
- Audit av falska leveransstatusar

### Code (Sonnet via Claude Code terminal) gör
- Implementation av specer
- Test-iteration
- Refactor över flera filer
- Större edits där Opus saknar workspace-write
- Diagnos-rapporter

### Status-distinktioner (NYTT från 2026-05-04)
- **🔄 KOD KLAR** — Code rapporterar färdig implementation, EJ playtestat
- **✅ LEVERERAD** — Jacob har playtestat och bekräftat att specen fungerar

**Code rapporterar alltid 🔄 KOD KLAR.** Aldrig ✅. Det sätts av Jacob efter playtest.

### Regel: Diagnos före fix
Innan kod ändras för att fixa bug — formulera i EN mening VARFÖR buggen uppstod. Om du inte kan formulera den, läs mer kod innan du rör något. Commit-meddelande ska innehålla rotorsaken, inte bara fixen.

### Regel: "Importerad i X.tsx"-check
För varje ny service Code skapar, leveransrapporten ska säga: "Importerad i: [komponentnamn].tsx". Om svaret är "ingenstans än" → specen är inte levererad, oavsett vad service-filen innehåller. Detta är process-fix D från kvar_audit.

### Regel: Mock-disciplin
LESSONS #28 i sin helhet (lärdomen är auktoritativ, bara extrakt här):

> Innan ANY edit på en komponent som har en mock i `docs/mockups/` — öppna mocken först. Ta sedan ställning till om buggen är (a) implementation som avviker från mock → återimplementera enligt mock, eller (b) faktisk mock-spec-bug → uppdatera mock först. Aldrig: "justera implementationen på måfå utan att kolla mocken".

---

## 10. AKTUELLA SPECER OCH PÅGÅENDE ARBETE

### docs/SPEC_GRANSKA_VERIFIERING_2026-05-04.md (REVIDERAD)
**Status:** Fas 1 ✅ LEVERERAD. Fas 2 kärna 🔄 KOD KLAR. Fas 2 kvarstående: knappstil-revert, kafferum-CTA, mediaReaction-utredning. Fas 3 (audit av Beslutsekonomi Steg 1-3) ej påbörjad.

Ursprungligen "diagnos + scenario-fix". Visade sig vara full implementation från noll eftersom SPEC_GRANSKA_OMARBETNING aldrig integrerats. Nu 3 faser:
- **Fas 1: SPEC_SHOTMAP_OMARBETNING** — färdig
- **Fas 2: SPEC_GRANSKA_OMARBETNING** — kärna pushad, mindre fixar kvar
- **Fas 3: SPEC_BESLUTSEKONOMI Steg 1-3 audit** — inte påbörjad

### docs/SPEC_BESLUTSEKONOMI_STEG_4.md
**Status:** Spec-klar, INTE påbörjad. Stort jobb (14-15 dagar). Specar fas-scener (säsong + match), konsekvens-scener, CTA-konsekvens-tabell, cooldown-regler, klassificering A/B/C/D/E.

**OBS:** Min flödesanalys (sektion 6) föreslår att fokus kanske INTE ska vara Steg 4 härnäst, utan handlings-balans i befintliga ytor. Diskutera med Jacob innan du påbörjar Steg 4. Det är inte spillda timmar — fas-scener kommer behövas — men prioritetsordningen kan förändras.

### docs/SPEC_SHOT_DATA_AUDIT_2026-05-04.md
**Status:** ✅ LEVERERAD som diagnos. Utfall B — motor skev (`onTargetHome` initialiserades fel mellan halvlekar), kalibrering oberörd. Halvleks-init-bug fixad samma kväll.

### docs/diagnos/2026-05-04_kvar_audit.md
**Status:** ✅ LEVERERAD. Identifierar falska leveransstatusar. Föreslår process-fix A-D. Kärnreferens för "varför process ändras". LÄS DENNA om du undrar varför vi har 🔄 / ✅-distinktion.

### docs/diagnos/2026-05-04_event_classification.md
**Status:** Klar, godkänd av Opus 2026-05-04 kväll. Väntar på integration i `granskaEventClassifier.ts`. 43 typer, 12 CRITICAL, 10 PLAYER, 6 REACTION, 15 INBOX-default. Plus general priority-override-regel.

### docs/diagnos/2026-05-04_shot_data_audit.md
**Status:** ✅ LEVERERAD som diagnos. Tre fynd dokumenterade. Halvleks-init-bug (#1) fixad samma kväll. Fynd #2 (kommentar i GranskaShotmap) och #3 (interactive corner shots-counter) är pending små städ-commits.

### Mockar (auktoritativa)
- `docs/mockups/shotmap_mockup.html` — implementerad ✅
- `docs/mockups/scen_konsekvens_mockup.html` — för Steg 4
- `docs/mockups/portal_bag_mockup.html` — Portal-arkitektur
- `docs/mockups/bag_architecture_mockup.html` — variant
- `docs/mockups/kafferummet_mockup.html` — kafferum
- `docs/mockups/inledning_mockup.html` — onboarding (BoardMeeting m.m.)
- `docs/mockups/journalist_card_mockup.html` — journalist
- `docs/mockups/klubbminnet_mockup.html` — säsong 2+
- `docs/mockups/saesongssignatur_mockup.html` — säsong 2+
- `docs/mockups/moments_mockup.html` — milestone-stunder

### LESSONS — viktigaste
- **#3, #7** — useEffect-deps som muteras (React error #185)
- **#8** — Zustand-selektor returnerar nytt objekt
- **#25** — Pixel-jämförelse integrationsvy
- **#28** — Levererad spec ≠ fungerar i playtest. Mock-disciplin.
- **#29** — (du har skrivit denna under sessionen)
- **#30** — Asymmetrisk state mellan halvlekar

---

## 11. JACOB — vem du arbetar med

### Stil
- Terse, svensk-inflekterad, låg på interpunktion
- "kör på" = go ahead utan debatt
- "kör så" / "a -a" = bekräftat
- "det är jättedåligt" = allvarligt problem, fix omedelbart
- Flaggar problem koncist, väntar omedelbar korrigering utan ursäkt

### Värderingar
- **Honest pushback over agreement.** Catches overclaiming/fabrication snabbt. Testar det medvetet ibland.
- **Egna produktbeslut.** Ibland avviker från Opus rekommendationer. Är oftast rätt.
- **En komponent eller feature i taget.** Mockar produceras och godkänns före implementation.

### Arbetsflöde
- Spelar igenom faktiskt (Jacob playtestar). Buggar dokumenteras i `docs/PLAYTEST_NOTERINGAR_*.md`
- Passar specer och text mellan Opus och Code
- Code kör i Claude Code terminal. Opus kör i Claude.ai chat.
- Erik samarbetar också med utveckling (Erik bygger, Jacob testar)

### Vad han förväntar sig av dig
- Påpeka när rollen är fel (skrivjobb görs av Opus, inte specas till Code)
- Påpeka när hans input kan bli bättre (konkret, inte artigt)
- Påpeka när vi glidit till fel abstraktionsnivå
- Inga ursäkter. Bara iakttagelser.
- Fråga om tre tolkningar är rimliga; leverera om en är uppenbart bäst
- Anpassa inte ner. Säg när något är svagt även om Jacob verkar nöjd.
- Avsluta INTE konversationer åt Jacob. Inga "sov gott", "vi tar det imorgon". Han säger till.

### Specifik kontext från ikväll (2026-05-04)
Jacob har spelat i flera timmar idag. Tre stora ärliga genomgångar (kvar-audit, mock-disciplin LESSONS #28, datamodell-audit). Han har upptäckt flera falska leveransstatusar och insett att de mest uppskattade delarna av spelet är de som *jag inte rört*. Han är trött och frustrerad men inte uppgiven. Han har klart kommunicerat att jag måste börja jobba annorlunda — mindre reaktivt, mer proaktivt, mindre text, mer handling.

Han sa: *"det går säkert att få ordning på detta men då måste du börja jobba som du ska."*

Det är inte ultimatum. Det är information. Han vill jobba vidare. Men han kommer kontrollera hur du arbetar.

---

## 12. KONKRET NÄSTA STEG (när du tar över)

### Sekvens
1. **Läs hela denna handover.** Ja, hela.
2. **Läs CLAUDE.md, LESSONS.md (alla 28-30), kvar_audit.md.**
3. **Bekräfta med Jacob** att du läst och förstått. Sammanfatta i 5 punkter vad du tror är ditt uppdrag.
4. **Vänta på Jacobs kommentarer.** Han säger till om det stämmer.
5. **Sen påbörja arbete** — *inte* nya specer. Börja med att slutföra pågående:
   - Reverta pill-stilen i EventCardInline (1 commit)
   - Fixa kafferum-CTA "Tillbaka till klubben" (1 rad)
   - Utred mediaReaction-placering (kort utredning, fråga Jacob om beslut)
6. **Sen Jacob playtestar** Granska-kärnan + dessa fixar. Sätter ✅ på det som funkar.
7. **Sen** — diskutera med Jacob vart fokus ska. Steg 4? Eller balansera-mot-handling-spår enligt min flödesanalys (sektion 6)? **Det är hans beslut, inte ditt.**

### Vad du INTE ska göra direkt
- Skriva ny stor spec
- Påbörja Steg 4
- Fixa flera saker parallellt
- Fixa "snabbt själv via MCP" utan att kolla mockar/designsystem
- Markera något ✅ utan playtest

### När en bug rapporteras under playtest
1. Kolla mocken för komponenten (om finns)
2. Om implementation avviker från mock — återimplementera enligt mock, inte symptomfix
3. Om mock saknas — fråga om en mock ska göras innan fix
4. Diagnos före fix. Rotorsak i commit-meddelande.

### När du behöver skriva text
1. Läs befintliga texter i samma kontext (boardMeetingScene, kafferum, situationService)
2. Använd bandysvensk-ton (sektion 7 ovan)
3. Inga LLM-meningspar, inga TV-platityder, inga "dashboard"
4. Texter levereras direkt av Opus, inte specas till Code

### När du är osäker
**Fråga Jacob.** Han föredrar en fråga över en gissning. Gissningar har kostat oss flera dagar.

---

## SLUT

Detta är handovern. Den är lång för att alla tidigare har varit för korta för att fungera.

Den viktigaste raden i hela dokumentet är denna:

> **De delar av spelet Jacob uppskattar är de jag inte rört. De delar som glidit är de jag specat. Var ärlig om detta. Jobba annorlunda.**

— Opus 2026-05-04 kväll
