# DESIGN-BRIEF — Match-laddning (A3)

**Från:** Opus · **Till:** Design · **Datum:** 2026-06-07
**Ursprung:** FRESH-EYES-flödesanalysen (A3, rankad #1) + reserv-principen från konsekvens-/kvalitets-auditen.
**Vad jag ber om:** en mock av en *pre-match-beat* — ögonblicket mellan "Spela omgång X" och uppställningen — för de matcher som förtjänar laddning. Inte för alla matcher.

---

## 1 · Principen (läs först, annars bygger vi fel sak)

Spelets kärnhandlingar ska ha en båge: **ladda → handla → kvittera.** Matchresultatet har den (Granska kvitterar). Match-*ingången* har den inte — i dag startar derbyt, annandagsbandyn och den betydelselösa mittenmatchen likadant. Den här briefen gäller *laddningen* före matchen.

**Detta är samma reserv-princip som styr guld, hjälte-rubriken och illustrationerna.** En laddning på *varje* match är ceremoni-inflation — då betyder den lika lite som guld gör när det sitter överallt. Den vanliga ligamatchen ska fortsätta gå rakt in i uppställningen som i dag, utan beat. Beat:en är till för att de *få* stora ska resa sig. Om mocken får en laddning att kännas rätt på annandagen *och* harmlös att hoppa över på en mittenmatch i mars, är den löst.

Detta är *inte* fotboll. Vikten kommer inte från en tabellduell ("sexpoängsmatch" finns inte här — spelet kör tvåpoängsvinst). Den kommer från bandyns egna tillfällen: annandagen, grannfejden, premiären, finalen på Studenternas, en svit som måste vändas.

---

## 2 · Grinden — vilka matcher får en beat (grundat i kod)

Signalen finns redan. `getRoundCharacter(game)` i `src/domain/data/roundCharacter.ts` returnerar sju värden; plus fixtur-flaggor (`isCup`, `isAnnandagen`) och `round === 'Final'`/slutspel, plus `seasonContextService` för insats. Beat:en grindas på en *kurerad delmängd* — inte på allt som är ≠ standard:

| Tillfälle | Källa | Beat? |
|---|---|---|
| Cup-dag | `cup_day` (`isCup`) | Ja |
| Derby / grannfejd | `pre_derby` (`isRivalryMatch`) | Ja |
| Premiär | `premiere` | Ja |
| Annandagsbandy | `isAnnandagen` | Ja |
| Nyår/trettondag | kalender-flagga | Ja |
| Final / slutspel | `round === 'Final'` / playoff | Ja (störst) |
| Förlustsvit (≥3) | `losing_streak` | Ja (lättare) |
| Vinstsvit (≥3) | `winning_streak` | Ja (lättare) |
| **Efter en förlust** | `post_loss` | **Nej** — triggar efter varje enskild förlust, alltså ofta. För frekvent för en beat; hör hemma i portal-tonen, inte här. |
| Vanlig ligamatch | `standard`, ingen flagga | **Nej** — rakt in i uppställningen som i dag |

`seasonContextService` (relegationFight / topRace / midTable / firstSeason) styr inte *om* det blir en beat, utan *färgar texten*: en derbymatch i nedflyttningsstrid får överlevnadston, samma derby mittseason lutar på traditionen. **Mittfältsläge manufakturerar aldrig insats** (C-SD2-beslutet står) — ett derby utan tabellbetydelse är fortfarande ett derby, men texten lovar inte en avgörande kväll som inte finns.

Exakt wiring (var i flödet, hur flaggorna kombineras) är Codes — jag namnger bara de befintliga signalerna så ingen ny "stor match"-klassificering byggs.

---

## 3 · Var den sitter

Flödet i dag: Portal → "Spela omgång X" → uppställning/taktik (StartStep) → live → Granska. Beat:en hör hemma **före uppställningen**, så tillfället ramar in lagvalet — du vet att det är annandagen mot ärkerivalen *innan* du sätter laget, vilket gör valet tyngre. För icke-grindade matcher: ingen beat, rakt till StartStep.

Föreslå själva uttrycket: full scen-takeover vs ett band ovanför uppställningen. Min hypotes är **två nivåer** — full scen för de största (final, annandagen, derby, premiär), ett slimmat band för de lättare (sviter). Det är reserven gjord granulär: inte bara "beat eller inte" utan "hur mycket".

---

## 4 · Vad beat:en bär (innehållsslots, disciplinerat)

Kort. Den ska ladda, inte informera. Undvik stat-dump — Granska är för siffror, det här är för stämning.

- **Tillfälle** (eyebrow): DERBY · ANNANDAGEN · CUPEN · PREMIÄR · FINAL · TRE RAKA
- **Motståndare** + relation (grannfejd, fjolårets finalmotståndare, nykomling)
- **En laddningsrad** — tillfällets ton, inte en analys (se §6)
- **Insats** *bara om den finns* (seasonContext) — annars utelämnas, ingen falsk spänning
- **Atmosfärsfäste:** illustrationen. Det här är ögonblicket illustrationssystemet reserverades för — beat:en är dess naturliga hem:

| Beat | Illustration | Status |
|---|---|---|
| Annandagsbandy | `annandagen.jpg` | filad |
| Final | `final.jpg` | filad |
| Derby | `derby.jpg` | beställd |
| Nyår/trettondag | `nyarsbandy.jpg` | beställd |
| Premiär · cup · sviter | ingen — band utan bild (placeholder/text) | — |

`<IllustrationScene>` med inbyggd scrim (DB-8-sanktionerad) bär de fyra första; de bildlösa blir text/band.

---

## 5 · Vad jag ber dig mocka

Tre representativa, så vi ser spannet:

1. **Annandagsbandy** — full scen, `annandagen.jpg` fullbleed, eyebrow + motståndare + laddningsrad. Den ceremoniella ytterligheten.
2. **Derby i mittfältsläge** — full scen, men *utan* insats-rad (visar att vi inte hittar på tabellspänning). Visar hur traditionen bär ensam.
3. **Förlustsvit** — slimmat band, ingen bild. Den lätta nivån. Visar kontrasten mot scenerna.

Och, viktigast: **visa reserven.** En liten "vanlig mittenmatch → rakt till uppställning, ingen beat" så vi ser att laddningen inte klistras på allt. Det är den raden som avgör om principen håller.

---

## 6 · Text (min, inte Codes — seeds för ton)

Bandy-Sverige, understatement, ingen AI-ton. Detta är riktiga strängar för mocken, inte platshållare. Den fulla pool:en (flera varianter per tillfälle) skriver jag direkt i `matchLaddningText.ts` när mocken låst slotsen — den spec:as aldrig till Code.

**Annandagen:** "Fullt på läktaren, oavsett tabell. Så har annandagen alltid sett ut."

**Derby (tradition, ingen insats):** "Två bruk, en älv emellan. Man bygger inte upp sånt på en säsong — läktaren har räknat åren."

**Cup:** "Kortare väg, hårdare luft. Förlorar man får man åka hem och tänka på det."

**Premiär:** "Sju månader sedan sist. Ny is, samma klack. Nu börjar det på riktigt."

**Final, Studenternas:** "Studenternas, Uppsala. Längre kommer man inte i den här sporten."

**Förlustsvit:** "Det har inte lossnat på ett tag. Någonstans vänder det — lika gärna här."

**Vinstsvit:** "Fjärde raka om det lossnar. Ingen säger det högt i omklädningsrummet, men alla räknar."

---

## 7 · Inte i scope

- Grind-logiken och flödes-wiringen → Code, från de befintliga signalerna i §2.
- Den fulla textpoolen → Opus, direkt, efter att mocken låst slotsen.
- Mocka inte de icke-grindade matcherna (utöver den enda kontrast-raden i §5).
- `post_loss` som beat → nej, avgjort, se §2.

## 8 · Öppna frågor till dig

1. En nivå eller två (full scen + slimmat band)? Min hypotes är två — men säg om bandet känns som en halvmesyr som vore bättre som ingenting.
2. Sitter scenen *före* uppställningen (ramar lagvalet) eller *som* uppställningens topp (band)? Påverkar om det blir ett eget steg eller en sektion.

---

## 9 · Avgjort efter mock (2026-06-07)

Mocken levererad, grunden godkänd — kontrast-spalten, band-på-uppställning och den villkorliga insats-pillen sitter rätt. Tre avgöranden ovanpå:

**Gränsfall 1 — premiär + cup-dag = SCEN, inte band.** Tier styrs av *tillfället*, inte av om en bild råkar finnas. "Scen = bild" kopplar nivån till bild-pipelinen: då degraderas cup-dagen till band bara för att ingen illustratör levererat konst, och en beställd derby-bild skulle tyst beforda derbyt. Fel axel. Rätt axel: **scen = tillfälle** (annandagen, derby, cup, premiär, final, nyår) · **band = tillstånd** (sviter) · **bild = rikedomslager** (finns → fullbleed; saknas → placeholder-scen). Mocken bevisar redan att den bildlösa scenen funkar — derby-spalten visar placeholder-läget. Premiär/cup använder samma, ingen ny mock behövs. (Detta stämmer med din egen §8-svar-1-lista, som redan radade premiär + cup under full scen — lutningen mot band i de öppna frågorna var motsägelsen.) Premiär är dessutom en stark framtida bild-beställning (ny is, klacken tillbaka).

**Gränsfall 2 — svit-bandet är en tillstånds-*förändrings*-markör, inte ett engångs-beat och inte ett permanent kort.** Inom samma rond: det sitter kvar (backa och återvänd → bandet finns kvar; det är rondens sanning, inte en avfärdbar toast). Över ronder: det tänds på *förändring* — sviten når tröskeln (≥3), fördjupas till en notabel milstolpe, eller bryts — och är tyst de ronder den bara fortsätter oförändrad. Återanvänd portalens anti-upprepnings-disciplin (staleBias/lastShown) så det inte blir tapet. Brottet är ett eget litet beat: laddningsraden "någonstans vänder det" får sin kvittering när den gör det. Datat (dålig form) syns ändå alltid i truppen — att tysta den narrativa rösten mellan trösklar döljer ingen information.

**Mock-audit — två konsekvens-fynd att rätta i *bygget*, inte i mocken:**
- **Eyebrow-färgen är guld-creep.** `.eyebrow` är `var(--gold)` som default — men guld är reserverat för fullbordad seger + landslagsmerit + SM-final-portalen (DB-2). En annandags- eller cup-eyebrow är inget av det. Default eyebrow → `--accent` (eller `--warm` för derby/band, som mocken redan gör). Guld ENDAST på final-laddningen (`round === 'Final'`). Annars späder vi guldet på var laddad match.
- **Scen-CTA:n är standard-primary, inte `.btn--hero`.** Match-ingång sker ofta nog att hjälte-knappen blir hjälte-creep (R2-2 reserverar `.btn--hero` för säsongsslut/seger/cup-klimax). Kopparknappen i mocken är rätt nivå; bygget använder standard-primary-token + on-scale-radie (14 eller 8, inte mockens 12).

Slots i §8-noterna är låsta för textpoolen. `matchLaddningText.ts` skriver jag direkt (Opus, aldrig spec:at till Code) när A3-bygget tee:as upp.

— Opus, 2026-06-07
