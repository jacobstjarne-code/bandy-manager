# ⛔ HISTORISK — status i `docs/BACKLOG.md`. BYGG INTE PÅ DENNA.

**Dödmarkerad 2026-06-21 (Opus, process-fil-genomgången).** 05-23 action-tracker (portal-kurering, öppna trådar, trupp-systemet, C-K1). Portal-kureringen är levererad; B-trådarna (kafferum-funktion, målmotor-stress, kafferum-seed) konsumerade (motorn kalibrerad <1%); trupp-arbetet (KORT/SYSTEM player card 2.0 + taktik) byggt. Ev. genuint obyggt: C-K1 landslag (eget framtidsspår) + trupp-POLISH-densitetsbeslutet — designunderlaget lever i `HANDOFF-C-K1-LANDSLAG` resp. `HANDOFF-TRUPP-POLISH` (mockups/arkiv), inte i denna tracker. Om något av dem ska byggas: spåret börjar i handoffen, inte här. **Statusfilen är `docs/BACKLOG.md`.** Lämnad som historik.

---

# ÖPPNA BESLUT — action-tracker (2026-05-23)

**Av:** Opus. **Syfte:** Jacobs instruktion — samla det öppna OCH se till att det
blir action. Inte en lista som rostar. Varje rad har ÄGARE + NÄSTA STEG + STATUS.
När en rad är klar, stryk den. Detta är arbetsdokumentet, inte ännu en spec.

---

## META — läs först

Design är på ~70% av veckokvoten. Men nästan allt som designats den här veckan
är OBYGGT: hela trupp-systemet (3 lager, ~26h), portal-kurering, R1 delvis,
Manager/Skade. **Flaskhalsen är inte längre design-kapacitet — det är bygge +
playtest.** Mer design-% är inte framsteg om det vidgar gapet till det obyggda.
Det som flyttar spelet nu är att Code bygger och Jacob spelar, inte att fler
system specas. Mät progress i "byggt + spelat", inte i design-%.

---

## A · PORTAL-KURERING — SPEC KLAR, redo att byggas (UPPDATERAD)

**Det hände sedan föregående version av detta dokument:** A1-blockeraren är löst —
Opus skrev golv/rotation-regeln OCH typnamn-översättningen direkt in i en komplett
byggbar Code-instruktion (`CODE_UPPDRAG_PORTAL_KURERING_2026-05-23.md`). Design
behövde inte skriva in regeln separat; den ligger i Code-uppdraget med exakt kod.
Kvar är bara Codes egen verifiering vid bygge (titel-prefix-greppet).

| # | Vad | Ägare | Nästa steg | Status |
|---|---|---|---|---|
| A1 | Golv/rotation + typnamn i byggbar spec | KLART (Opus) | Skrivet i `CODE_UPPDRAG_PORTAL_KURERING_2026-05-23.md` — golv på sällsynta, rotation på frekventa, olika typ-set så ingen krock. 4 typnamn översatta. | KLAR ✓ |
| A2 | Titel-prefix-grep (BLOCKERANDE steg 1) | Code | FÖRST: greppa inboxService efter "Karriärsmilstolpe"/"Nemesis", hitta bärande InboxItemType + ev. subtyp-fält. Rapportera FÖRE bygge. Om ren render utan item: flagga. | REDO — tvingande första steg |
| A3 | Bygg DEL 1-4 | Code | inboxToPortal.ts → story-slot i portalBuilder → roundCharacter.ts → vikt-justeringar. Allt specat med exakt kod. | REDO efter A2 |
| A4 | Två hårda verifieringskrav | Code | (1) round-character syns ALDRIG som banner. (2) vikt-sänkning får INTE göra portalen till andra inbox — tabell/ekonomi/nästa match ska än synas. | I specen |

**Action A:** Hela paketet går till Code NU som nästa bygge. Steg A2 (grep) först,
stanna, rapportera. Sedan A3. Detta är det första spret som tas spec→byggt→spelat
hela vägen — prioritet.

---

## B · ÖPPNA TRÅDAR — byggt men ej verifierat/spelat

| # | Vad | Ägare | Nästa steg | Status |
|---|---|---|---|---|
| B1 | Tre Code-spår ospelade | Jacob | Spela nya builden (C-SD1, score-pipeline+R1, ljus-variant). Känns beslutsbördan/åldrandet/fatigue-scenen rätt? | ÖPPEN — kräver speltid |
| B2 | Kafferum: dubbel funktion | Code | `getCoffeeRoomScene` (ny, R1-fatigue) vs `getCoffeeRoomQuote` (gammal). Fatigue-raderna bor bara i Scene. Verifiera vilken portalen faktiskt anropar — annars syns aldrig fatigue-scenen. | ÖPPEN — 1 filläsning |
| B3 | Målmotorn: 9–8 + 10–5 | Code | OMFRAMAT: mätningen finns redan. Kör `npm run stress` (regenerera mot nuvarande motor — sparad data fr 8 maj) + `npm run analyze-stress`, läs sektion C+H (mål/match per fas). Ändra INGET. Cup-gruppmatch är huvudmisstänkt. | REDO — kör befintligt verktyg |
| B4 | R1 kafferumsrader | KLART | Opus skrev 8 rader (4 warm + 4 hot). | KLAR ✓ |
| B5 | Kafferum: upprepning | KLART (text) + Code | Opus utökade GENERIC 19→45, FATIGUE 4→8/nivå. Code-fix för seed+anti-upprepning specad (`CODE_UPPDRAG_KAFFERUM_SLUMP_2026-05-23.md`): hasha seeden, rullande historik 12. | TEXT KLAR ✓ / Code REDO |
| B6 | Tre Code-spr verifierade | KLART (Opus) | Opus läste roundProcessor: snapshot-gard korrekt (4 villkor), fatigueHistory korrekt separat gard. Code-granskning 5 fynd + 2 pixel-fix mot R1-mock. | KLAR ✓ |

**Action B:** B1 är Jacobs (spela). B2+B3+B5 går till Code med portal-paketet —
alla "kör/läs koden". B4+B6 klara.

---

## C · TRUPP-SYSTEMET — specat i 3 lager, INGET byggt (största obyggda paketet)

**Komplett designunderlag finns på disk** — sex filer i `docs/mockups/`:
`HANDOFF-TRUPP-KORT/SYSTEM/POLISH-2026-05-23.md` + tre matchande
`2026-05-23_design_trupp_*.html`. KORT = PlayerRow-grund (border-stripe, chip,
mini-sparkline). SYSTEM = NU/TRUPP/TAKTIK/Modal + portrait-placeholder med
6 arketyp-varianter. POLISH = lekfullhet (veteran-ring, akademi-pärla, captain-band)
+ 7 integrationer (akademi, TRAIT_META, narrativeLog, klubbveteranskap, anniversary,
klacken-favorit, manager-note). Opus har läst alla tre mockar och godkänt KORT+SYSTEM,
flaggat POLISH-densitet.

| # | Vad | Ägare | Nästa steg | Status |
|---|---|---|---|---|
| C1 | 3 lager, dubbelräknade estimat (KORT 7.5h + SYSTEM 11.5h + POLISH 7.5h — överlappar) | Opus | När trupp ska byggas: slå ihop till EN Code-plan, avdubbla timmar, beroende-ordning. | ÖPPEN — när trupp prioriteras |
| C2 | POLISH densitet (12 system på ett kort) | Design/Jacob | Redaktionell hand: trait+story+note pekar ofta på SAMMA känsla ("sur"). Välj ETT uttryck per kort. Beslut FÖRE bygge. Opus flaggade detta i mock-granskningen. | ÖPPEN |
| C3 | Beroenden | — | Full trupp kräver #5/Manager/C-K1 byggda. Bara steg 1 (kosmetik, portrait-placeholder, chip, CA-sparkline) byggbart NU — ~2 av 7.5h i KORT. | NOTERAT |

**Action C:** Trupp är INTE nästa bygge (portal-kurering är det). C1–C3 väntar tills
portal byggts+spelats och något av #5/Manager/C-K1 finns. **Inte parkerat —
sekvensberoende.** Designunderlaget är komplett och får INTE tappas: sex filer,
ett av sessionens största arbeten.

---

## D · C-K1 timing — redan löst, ej till Code än

VM sent januari, ~1 v uppehåll, serien går vidare, kalender-ändring (flytta
`isLandslagsuppehall` R7→R14). Inskrivet i `HANDOFF-C-K1-LANDSLAG`. C-K1 är eget
spår, ej nästa bygge. | NOTERAT — klart när C-K1 byggs.

---

## SAMMANFATTNING — vad som faktiskt ska hända härnäst

1. **Till Code (nästa bygge):** Portal-kurering — `CODE_UPPDRAG_PORTAL_KURERING_2026-05-23.md`.
   Steg A2 (grep efter milstolpe/nemesis-typ) FÖRST, stanna, rapportera. Sedan DEL 1-4.
   Två hårda krav: round-character aldrig banner, portalen blir inte andra inbox.
2. **Till Code (samma pass eller direkt efter):** B2 (vilken kafferum-funktion portalen
   anropar), B3 (`npm run stress` + `analyze-stress`, läs sektion C+H), B5 (kafferum
   seed-fix). Alla små, "kör/läs koden".
3. **Till Jacob:** B1 — spela nya builden. Beslutsbörda/fatigue/ljus-variant: känns det rätt?
   Och när portal byggts: känns story-slot + round-character som skillnad?
4. **Vänta medvetet (sekvensberoende, EJ parkerat):** Trupp (C) — sex filer komplett
   designunderlag, byggs efter portal + när #5/Manager/C-K1 finns. C-K1 timing (D) —
   löst, eget spr när det byggs.

Det här är hela den öppna ytan. Inget mer är glömt. Portal-kureringen är för första
gången på länge ett spr som går spec→byggt→spelat hela vägen — där ligger fokus.

## ÄNDRINGAR DENNA SESSION (för spårbarhet)
- Portal: analys → Design-svar → Opus typnamn-facit → komplett byggbar Code-spec. KLAR.
- Kafferum: upprepning diagnostiserad (nästan-periodisk seed + svag anti-upprepning +
  för grund brunn). Text utökad av Opus (19→45, 4→8). Code-fix specad.
- Målmotor: upptäckte att mätinfra finns (`analyze-stress` sektion C+H, 7666 matcher).
  B3 omframat från "bygg" till "kör befintligt".
- Tre Code-spr verifierade i kod av Opus (ej bara Code-summering): snapshot-gard,
  fatigueHistory, RoundSummary. Plus Codes egen granskning (5 fynd + 2 pixel-fix).
- Trupp: alla tre lager (KORT/SYSTEM/POLISH) lokaliserade på disk och lästa. Komplett.

— Opus, 2026-05-23 (uppdaterad sent samma dag)
