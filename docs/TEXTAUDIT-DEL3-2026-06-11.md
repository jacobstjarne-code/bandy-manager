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

## §2 Kvar i DEL 3
scenes/ (8 filer) · arrivalDialogue · managerKaraktarText · managerKvittoText · hallDebateData · patronData · politicianData

## §3 Nytt till köerna
- **Code (valfri):** {lastName}-interpolation i RIVAL_SALE_KAFFERUM + INCOMING_BID_KAFFERUM (transferResponseText) — återför specificitet som togs bort av korrekthetsskäl. Samma möjlighet för boardMeetingCopy: en {akademispelare}-token vore bättre än "Yngste i truppen" — resolvern vet vem.
- **Jacob:** inget nytt detta pass.

## §4 Mönsteruppdatering
F2-klassen (hårdkodad specifik fakta i slumpade pooler) är INTE begränsad till pre-guideline-text: boardMeetingCopy (05-31) och transferResponseText (guideline-era) hade båda varianten med påhittade namn/utfall. Skrivguiden saknar regeln — bör in som Lärdom #9: *en poolsträng får bara hävda det som triggern garanterar eller det som interpoleras ur data.*

— Opus/Fable, 2026-06-11
