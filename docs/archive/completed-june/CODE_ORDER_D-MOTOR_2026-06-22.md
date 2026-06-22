# CODE-ORDER — D-MOTOR: moral/referee/sharpness mot matchutfallet

**Av:** Opus · **Datum:** 2026-06-22 · **Till:** Code (fas 1) + Jacob (beslut) · **Surface:** kategori D (logik/motor)
**Status:** Fas 1 GO. Fas 2 gated på Jacobs beslut. Bakgrund i BACKLOG D-MOTOR + arkiverad `AUDIT_MOTORKOPPLING_2026-05-25`.

## Varför detta inte är en enkel order
Auditen 05-25 fann att **moral inte matar matchutfallet** (finns inte i `playerModifier`/squad-poäng/
matchCore-styrka — rör bara ett display-fält), trots att UI lovar det (NU "LÅG MORAL", moral-chips,
prata-med-spelare). Samma för **referee-stil** (visas, men `refStyle` tvingas 'lenient' i sim, ingen
stil-term i foul-kalkylen). **Sharpness** uppdateras men lästes aldrig i någon utfallsväg — auditen
lämnade den som kandidat.

Att stänga gapet kan göras två vägar: **wira in** konsekvensen (moralen påverkar matchen) eller
**tona ned** UI-löftet (moralen presenteras som det den faktiskt styr — trupp/transfer/omklädningsrum,
inte match). Vilken som är rätt är ett designbeslut — och motorn är kalibrerad till <1% mot 1124+
matcher. Jag specar ingen balansändring på gissning. Därför: fas 1 = no-regret-verifiering nu, fas 2
= implementation efter Jacobs val.

## FAS 1 — Code, nu, inget beslut krävs

Allt är läsa/spåra/rapportera. Ändra ingen motorlogik i fas 1.

**1a. Verifiera att auditen fortfarande håller mot HEAD.** Fyra veckors commits sedan 05-25 (bl.a.
kemi-inkopplingen). Bekräfta med kod-citat:
- Moral: greppa varje läsning av moral i `squadEvaluator.ts`, `matchCore.ts`, `matchEngine.ts`,
  `playerStateProcessor.ts`. Når någon `evaluateSquad`/`playerModifier`/matchCore-styrkan i dag, eller
  är det fortfarande bara display + tillgänglighet/lobby + kapten-kaskad? Form uppdateras fortf. från
  match-BETYG, inte moral?
- Referee: i simulerade matcher — tvingas `refStyle` fortf. till 'lenient', och saknar `foulThreshold`/
  foul-kalkylen en refStyle-term? Citera kalkylen.
- Rapportera: håller auditen, eller har något ändrats?

**1b. Avgör sharpness.** Greppa varje läsning av `sharpness` i hela `src/`. Når någon en utfallsväg
(`evaluateSquad`, `playerModifier`, matchCore-styrka, utveckling, lineup-rekommendation)? Ge dom:
attrapp (ingen väg) eller har-väg (vilken). Citat, inte slutsats.

**1c. Lokalisera injektionspunkterna (ändra inget).** Namnge exakt funktion + rad där en moral-modifierare
*skulle* in om vi väljer wire-in:
- `squadEvaluator.ts`: raden `playerModifier = form*0.4 + fitness*0.6` (eller dess nuvarande form) —
  var skulle en centrerad moral-term sitta?
- `playerStateProcessor.ts`: var uppdateras form post-match — var skulle en moral→form-drift över tid
  haka i?
Rapportera båda med rad-citat. Detta gör fas 2 till en surgisk ändring oavsett vilken väg Jacob väljer.

**Fas 1-leverans:** en rapport med (a) audit-status mot HEAD, (b) sharpness-dom, (c) två
injektionspunkter med citat. Inga motorändringar. Tester gröna (du har bara läst).

## FAS 2 — gated på Jacobs beslut (skrivs som egen order efter fas 1-rapporten)

Jacob väljer per system. Opus rekommendation (att väga, inte att följa blint):
- **Moral → wire-in via moral→form-drift över tid.** Lägst perturbation (form matar redan motorn vid
  0.4; en långsam moral→form-koppling rör inte kalibreringen abrupt), mest genre-sann (FM/OOTP har
  moral→prestation), och gör prata-med-spelare ärligt. Alternativet — liten centrerad form/styrka-term
  direkt i `playerModifier` — är möjligt men perturberar kalibreringen mer direkt.
- **Referee-stil → luta mot tona ned.** Att wira refStyle in i foul-kalkylen är en större motorändring
  för mindre spelarvärde. Alternativ: en liten `foulThreshold`-term för strict/lenient om vi vill ha
  effekten — men det är en kalibreringsrunda till. Billigast: presentera domarstilen som relations-/
  färg-element, inte utfallspåverkan.
- **Sharpness → beror på fas 1.** Är den attrapp: antingen tona ned eller koppla in (den uppdateras
  redan rätt — en väg till `playerModifier` vore liten). Har den väg: inget att göra, dokumentera den.

Efter wire-in: om-kör Bandygrytan-benchmarken och bekräfta att motorn håller <1% (eller medvetet
justera target om moralen ska flytta nålen).

## Handoff
Code kör fas 1 nu och rapporterar. Jacob läser rapporten + beslutar per system. Opus skriver fas 2-ordern
mot det beslutet. Denna fil arkiveras när fas 2 är specad.

— Opus, 2026-06-22
