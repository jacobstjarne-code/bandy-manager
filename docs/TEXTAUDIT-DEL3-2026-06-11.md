# TEXTAUDIT — DEL 3 (scener & relationer) — PÅGÅENDE

**Datum:** 2026-06-11 · **Auditör:** Opus (Fable) · Röstkarta + felklasser per DEL 1. Datumtriage per DEL 2-mönstret: pre-guideline-filer (före 10 maj) läses hårdast.

## §1 Granskat & fixat

### transferResponseText.ts — 4 fixar (i övrigt guldklass)
- **F2 hårdkodade spelarnamn i händelsepooler:** kafferumspoolerna sa "Hörde du om **Henriksson**?" och "hört av sig om **Lundberg**" — men poolerna triggas av verkliga transfers med andra namn. Namnlösa nu ("Hörde du?" / "om honom"). *Valfri Code-förbättring:* {lastName}-interpolation skulle ge specificiteten tillbaka — poolerna vet vilken spelare det gäller.
- **F4/F5:** "Banderoller blir måleri i veckan" (obegriplig) → "Det målas banderoller i veckan" · "Han hade ridit på det" (felsvenska) → "Han hade anat det länge"

### injuryStories.ts — 10 fixar (pre-guideline, tydligast felkoncentration i DEL 3)
- **F1 sport:** "Halka på is" (spelare på skridskor halkar inte som fotgängare) → "Skäret släppte i en kurva" · "Trampade på en back" (obegriplig) → "Fick en klubba under skridskon" · "mittzonen" (hockey) → "mittplan"
- **F4:** "en långsam pass" → "ett lugnt träningspass" · "ledbandet är stukat men hel" → "sträckt men helt" · "Tacklas" → "Tacklades" · "Svimlade" → "Var borta en sekund" · "i sprinthastighet" → "i full sprint" · "Muskelfiber sönder" → "Fibrer av" · "Magkände" → "Kände på sig"

### injuryDoctorText.ts — ✅ REN (Opus 05-25; doktorsröstens "tre veckor om vi tar det lugnt, sex om vi inte gör det" är guldstandard)

### boardQuotes.ts — ✅ FREDAD
Kurerat bibliotek med uttrycklig hands-off-instruktion i filhuvudet ("Får EJ förbättras, omformuleras eller utökas av Code"). Kvaliteten motiverar fredningen — Lennarts kaffekassa, Runes 1994, hockeyklubborna i omklädningsrummet. Auditens roll här: konstatera att fredningen ska respekteras, även av mig.

### suspensionText.ts — ✅ REN (Opus 05-25)

### landslagText.ts — ✅ REN (Opus 05-25)

### retirementText.ts — 3 fixar
- **F2 hårdkodade årtal/längder i klack-pooler:** "Tjugotvå år" och "Vi var där första spelet i 04" — backas inte av spelarens faktiska karriär → generaliserade ("Hela karriären här", "när han spelade sin första")
- **F4:** trasig ordföljd "Det är ett svar du väntade dig kanske inte" → "Kanske inte svaret du väntade dig"

### clubOfferQuotes.ts — ✅ FREDAD-KLASS
Kurerat lore-bibliotek, verklig bandyhistoria korrekt invävd (Skutskärs 28 848 år 1959, Slottsbrons fyra guld varav senaste 41, Rögles bandyursprung, Lesjöfors köldhål). Rör inget.

### boardMeetingCopy.ts — 7 fixar (Opus 05-31, men F2-klassen fanns även här)
- **F2 hårdkodad spelare:** "Henriksson" ×2 i talpooler (truppen har ingen sådan) → "Akademin"/"Yngste i truppen"
- **F2 hårdkodade utfall:** "Silvret sitter i" ×2 (B = måluppfyllelse ≥80%, inte silver), "Slutspelet — och mer", "Plats sju är plats sju", "Tio är inte slutet" → utfallsneutrala ("Fjolåret sitter i", "Mer än vi lovade", "Tabellen blev vad den blev", "Ett sånt här år")

### scenes/ — katalogen klar (8 filer)
- **smFinalVictoryScene — 2 fixar (KLIMAXSCENEN):** bodyText hårdkodade "Henriksson" + "87:e" trots placeholder-löfte (cup-systern hade redan {playerName}/{minute} — SM var äldre varianten) → tokens; "25 412 ÅSKÅDARE" → {arenaCapacity}. **Code KRITISK:** SM-renderns interpolation måste hantera de tre nya tokens — återanvänd useCupFinalData-helpern, annars renderas {playerName} rått.
- **sundayTrainingScene — 1 grammatikfix + strukturell order:** ArrivalScene-klassens bugg — Henriksson/Lindberg/Bergström hårdkodade men valen lovar relationseffekter mot spelare som inte finns. **Code-order:** casta scenen från truppen (först på is = högst lojalitet/professionalism, telefonen = lägst träningsvilja, frysaren = lägst moral, tre skyttar = forwards), texter får {efternamn}-tokens.
- **journalistRelationshipScene — 6 strängar fixade (F2 kön):** namnpoolen är blandad (Erik, Lars, Magnus...) men scenen sa "Hon" genomgående → efternamn istället för pronomen (lokal funktionsändring, inga exporterade signaturer rörda). **Code-order:** grep `"Hon \|henne"` i journalist-kontexter (pressConference, inbox-strängar) — samma bugg kan finnas fler ställen.
- **seasonSignatureReveal — 2 fixar:** "Tre-gånger-trettio" (obegriplig) → "Veckor av tjugo minus"; "Klubborna beställt fler klubbor" → "Klubbarna"; "Fyra klubbar" → "Flera" (Lärdom #9). Emoji-fältet = ikonografi-undantagsklassen per domslutet.
- **boardMeetingScene — REN text, men:** "Plats fem till åtta. Inget kvalspel." är hårdkodad förväntan säsong 2+ oavsett målsystemets A/B/C-state. **Code-verify:** vilken av boardMeetingScene (beats) och boardMeetingCopy (A/B/C) renderar säsong 2+? Om beats lever ska förväntnings-beatet läsa från objectives. BONUS: filens kommentar LÖSER DEL 2-verify #2 — currentSeason ÄR kalenderår, {season}-token renderar korrekt.
- **cupIntroScene ✅ REN** · **cupFinalVictoryScene ✅ REN** (ordinal-{minute} ingår i DEL 2-ordern) · **cupFinalIntroScene ✅ REN men AVSTÄNGD** sedan 05-10 (innehåll flyttat till cupAnslag — dödfil-kandidat).

### Sista passet (2026-06-12) — DEL 3 KOMPLETT
- **arrivalDialogue — 1 fix** ("spritt" → "glest" på östra läktaren), i övrigt FREDAD-KLASS kurerad lore med dokumenterad ton per klubb.
- **managerKvittoText — 3 fixar:** **F1 fel sport** ×2 ("slutperioden"/"andra perioden" — bandy har halvlekar, perioder är hockey) + obegriplig "kvitterat på båda håll".
- **managerKaraktarText — 2 fixar:** falsifierbara head-to-head-claims i rivalcitat ("Aldrig förlorat mot honom", "fyra av sju") → ofalsifierbara. **Jacob-fråga:** manager-pronomen — hela bio/burnout/rivalry säger "han/honom" men kommentaren säger själv "Sture/Margareta" och spelaren namnger sig fritt. Alternativ: (a) acceptera "han" som default-persona, (b) pronomenfri omskrivning, (c) könsval vid NameInput + interpolation. Min rek: (c) på sikt, (a) tills dess.
- **politicianData — 1 fix:** "Borgmästaren" (finns inte i svenska kommuner) → "Hela fullmäktige". I övrigt korrekt kommunsverige.
- **patronData — 4 fixar:** "kioskkiosk", "maskiner och **mud**" (engelska), två tempusfel. Lorekvalitet i övrigt hög (servettanbudet, cykeln i garaget).
- **hallDebateData — 7 fixar:** "i en hal" ×2, "Floodlight" + hårdkodad "4-1-seger", "Ni drog 1 400" (F2 — vår publik är data), tre titel-emojis strukna varav en 🏒 (domslut c). Rösterna i övrigt utmärkta ("Det heter innebandy"). OBS: filen är råmaterial för matchhall-prövningen (SPEC_MATCHHALL_PROVNING) — BOARD_HALL_QUOTES och news-poolerna ska återanvändas i förankringssteget.

## §2 Kvar i DEL 3
INGET — DEL 3 komplett. Återstår: DEL 4 (värld & kuriosa per DEL 1 §4).

## §3 Nytt till köerna
- **Code (valfri):** {lastName}-interpolation i RIVAL_SALE_KAFFERUM + INCOMING_BID_KAFFERUM (transferResponseText) — återför specificitet som togs bort av korrekthetsskäl. Samma möjlighet för boardMeetingCopy: en {akademispelare}-token vore bättre än "Yngste i truppen" — resolvern vet vem.
- **Jacob:** (1) manager-pronomen (se managerKaraktarText ovan); (2) verkliga varumärken — "Bandypuls" (DEL 2) OCH "Bandyplay" (hallDebateData): samma beslut täcker båda — fiktiva namn eller verklighetsförankring?

## §4 Mönsteruppdatering
F2-klassen (hårdkodad specifik fakta i slumpade pooler) är INTE begränsad till pre-guideline-text: boardMeetingCopy (05-31) och transferResponseText (guideline-era) hade båda varianten med påhittade namn/utfall. Skrivguiden saknar regeln — bör in som Lärdom #9: *en poolsträng får bara hävda det som triggern garanterar eller det som interpoleras ur data.*

— Opus/Fable, 2026-06-11
