# CODE-LEVERANS — Patron/Mecenat-differentiering (beslut B)

**Datum:** 2026-06-09
**Beslut (låst med Jacob):** Differentiera — INTE konsolidera.

**Patronen** = den dolda foundational-figuren (Hedin-för-Leksand-arketypen) som håller klubben under armarna. **Mecenaterna** = de synliga lokala välgörarna som vill hjälpa men inte är grunden. Skillnaden ska sitta i **mekanik + synlighet**, inte i etikett — annars är det fortfarande två humörmätare som gör samma sak.

## Var sakerna bor (verifierat i kod)
- `game.patron?: Patron` (singular) — typ i `src/domain/entities/Community.ts` (`Patron`, `PatronPersonality`). Data: `src/domain/data/patronData.ts`. Events: `src/domain/services/events/patronEvents.ts`. Portal-triggers: `src/domain/services/portal/triggers/patronTriggers.ts`. Portal-kort: `src/presentation/components/portal/primary/PatronDemandPrimary.tsx`.
- `game.mecenater?: Mecenat[]` (plural) — typ i `src/domain/entities/Mecenat.ts` (re-exporteras via `SaveGame.ts`, ingen dubblett). Service: `src/domain/services/mecenatService.ts`. Middag: `mecenatDinnerService.ts` + `MecenatDinnerEvent.tsx`.
- Sponsor-systemet (`Sponsor.ts`, `sponsorService.ts`) är separat (kommersiellt) och **rörs inte**.

## Problemet (conflation-spår)
Två generationer av samma fantasi, hopflätade:
1. Mecenats intro- och sociala events skickar `type: 'patronEvent'` + `effect: { type: 'patronHappiness' }` (se `mecenatService.ts`). NARR-001-pensionseventet använder redan korrekt `mecenatEvent`/`mecenatHappiness` → migreringen påbörjad men ofullständig.
2. `SaveGame.patronWithdrawnSeason` har kommentaren "managed club **mecenat** locked until this season + 2" — fältnamnet säger patron, kommentaren säger mecenat. Oklart ägarskap.
3. Nästan identisk mekanik i båda (happiness/influence/patience/krav/uttågshot/eskalering). Enda strukturella skillnaden idag: singular vs plural.

## De fem mekaniska skiljelinjerna (design-låst)
1. **Insats:** patronens bidrag dvärgar varje mecenat — egen ekonomirad man tar för given tills den försvinner. Mecenatens är trevliga påslag.
2. **Synlighet:** mecenater lever på OrtenMap + sociala kalendern (publika). Patronen INTE på kartan — verkar via events/ekonomi/styrelse. Delvis dold.
3. **Krav-register:** patronen få men tunga/personliga (nepotism, styrelseplats, veto-i-förklädnad). Mecenater lätta/sociala (bli bjuden, hedrad, delaktig).
4. **Förlust:** patron-uttåg = kris (eget stort event, fundamentet knakar). Mecenat-avhopp = ambient slitage.
5. **Antal:** en patron (per klubb/era), flera mecenater (roterande, konflikt/allians, social kalender).

## Fas 1 — reda ut plumbing + lås rollerna (low-risk, inga nya features)
1. **Untangle effekt/event-typer.** I `mecenatService.ts`: `generateMecenatIntroEvent`, `generateSocialEvent`, `generateSilentShoutEvent`, `generateMecenatConflictEvent`, `generateMecenatAllianceEvent` → alla `type: 'patronEvent'` blir `'mecenatEvent'`, alla `effect: { type: 'patronHappiness' }` blir `'mecenatHappiness'`. Följ NARR-001-pensionseventet (`checkMecenatRetirement`) som redan gör rätt.
2. **Verifiera effekt-reducern** hanterar `mecenatHappiness` och targetar rätt mecenat via id. Bekräfta att inga mecenat-effekter längre routas till patron-state.
3. **Nepotism-/speltidskravet hör patronen till.** Bekräfta att `PATRON_PLAYTIME_DEMANDS` bara konsumeras av patron-events. Mecenat-`demands` behåller buy_player/change_tactic/fire_player/name_facility.
4. **Klargör `patronWithdrawnSeason`-ägarskap.** Avgör om fältet hör patron eller mecenat till; döp om eller fixa kommentaren så de matchar. Normalisera även Mecenat-importväg (vissa filer importerar från `SaveGame`-re-exporten, andra från `Mecenat.ts` direkt) — valfri hygien.
5. Grep: inga `patronEvent`/`patronHappiness` kvar i mecenat-vägen. `npx tsc --noEmit` + test.

**Acceptans Fas 1:** systemen delar ingen plumbing — en mecenat-interaktion påverkar aldrig patron-state och vice versa. Ingen ny feature, bara separation.

## Fas 2 — patronen som dold foundational-figur
1. **Patronen av OrtenMap.** Ta bort patron som hanterad nod/tile på Orten. Kartan visar mecenat-nätverket + övriga noder.
2. **Surfa patronen via events/ekonomi/styrelse**, inte en skötsel-panel. Behåll `PatronDemandPrimary` som portal-event-yta; patronen ska inte ha en humörmätare-ruta på Orten.
3. **Existentiell uttågs-beat.** Patron-withdrawal = eget stort krisevent, skilt från mecenat-avhopp; bidraget är en tung ekonomirad vars förlust märks i budgeten.
4. **(Uppföljning) avtäckning.** Patronen kan börja delvis okänd och avtäckas via styrelse/rykte. Bygg grundseparationen (Fas 1) + av-kartan (2.1) först; avtäcknings-mekaniken kan vara eget steg om den växer.

**Öppet beslut (Jacob, ej blockerande):** kan en klubb sakna patron från start, så att säkra en blir ett mål? Min rek: ja, men efter Fas 1/2.1.

## INTE röra
Sponsor-systemet (kommersiellt, separat). scheduleGenerator, matchCore, currentMatchday utanför säsongsövergång.

**Rapportera:** Fas 1 klar (plumbing separerad · nepotism→patron · patronWithdrawnSeason-ägarskap · dubbel-importväg-status), därefter Fas 2.

— Opus, 2026-06-09
