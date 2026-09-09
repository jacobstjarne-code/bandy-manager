# DOM — manager-återkomst: kanonisk liggarpost, inte state-undantag i pushadaptern

**Datum:** 2026-09-08 · **Av:** Opus · **Beställd av:** Jacob (Code-eskalering, `stickiness-copy-roster`) · **Grund:** ratificerad Berättaren-spec (push via redaktörens liggaragenda, förbud mot ny minneslagring), `DOM_CENTRALREDAKTOREN` (dirigenten koordinerar ytning), `managerProfile.clubSpells`. Löser vägvalet Code flaggade: state-undantag i pushadaptern vs kanonisk liggarrepresentation.

## Konflikten

Manager-återkomst (du tar en klubb du tränat förr) är SANN och bevisbar via `managerProfile.clubSpells`. Men Berättaren-specen kräver att narrativ push kommer via redaktörens liggaragenda och förbjuder ny minneslagring. Att läsa `clubSpells` direkt i pushadaptern skulle uppfylla sanningen men bryta routingen.

## Domen — kanonisk liggarpost (alternativ b)

Karriärhändelsen får en kanonisk liggarrepresentation. En liggartyp för manager-återkomst (ny `EventLedgerType`, ELLER återbruk av en befintlig karriär-/tenure-typ om unionen redan har en — Code grep:ar de fyra registren per LESSONS #58 innan ny typ läggs till). Skrivs när managern tar en klubb där `clubSpells` visar en tidigare sejour. subject = klubben. Konsument: redaktören plockar posten för push vid återkomst-/tidig-tenure-tillfället, koordinerat av dirigenten.

## Varför inte state-undantag (alternativ a)

Ett state-undantag i pushadaptern kringgår `DOM_CENTRALREDAKTOREN`-dirigenten — ingen kollisionskoordinering när flera pushar samma kanal samma omgång (nemesis-callback, k12-callback, den här) — och sätter precedens för att andra adaptrar också sträcker sig ner i råstate. Det är just den erosion Berättaren-specen förbjuder. Och att härleda narrativ ur råstate i stället för en recordad händelse är anti-mönstret hela liggararkitekturen finns för att förhindra. Återkomsten ÄR en händelse (den skedde vid signeringen) — den hör ontologiskt i liggaren, som license_event och board_verdict.

## "Ny minneslagring" — gäller inte

En ny TYP på den befintliga liggaren är inte en ny STORE. Det förbjudna är en parallell minnesficka (som gamla `mentorshipHistory`). Liggaren ÄR den kanoniska minnet; en ny posttyp använder den, dubblerar den inte. Alternativ b respekterar alltså båda specens krav — routas via liggaragendan, ingen ny store — medan a bryter routingen.

## Text

Push-raden tas ordagrant ur registret om den finns där (§7 "återkomst till gamla klubben"). Finns ingen låst rad för scenariot — flagga, så skriver jag den. Kopiera inte-improvisera.

## Ägarskap

Code: grep de fyra registren (#58), lägg liggartypen (eller återbruk), producent vid signering (clubSpells-koll), konsument i redaktören för push. Opus: denna dom + raden om den saknas i registret. Jacob: mandatet givet.
