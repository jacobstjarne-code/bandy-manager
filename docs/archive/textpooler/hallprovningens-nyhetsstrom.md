# Hallprövningens nyhetsström och styrelsedebatt

> Arkiverad 2026-09-19 enligt **DOM — döda textpooler, 2026-09-18 (Fable)**.
> Texten är bra; ytan finns inte. Arkiverad i stället för struken så arbetet inte försvinner.
> Källa: `src/domain/data/hallProvningData.ts`

## Varför arkiverad

44 rader, skrivna för hallprövningen som fasmaskin (B1 §5). Fasmaskinen använder andra strängar ur
`hallProvningData.ts`; de fyra poolerna här var tänkta för en nyhetsström och en styrelsedebatt som
aldrig byggdes. Innehållet är för specifikt för att kopplas in utan den mekaniken — raderna bär
konkreta tal ("3,2 miljoner per år", "280 åskådare") och en `{hallclub}`-variabel som kräver en
omvärldsklubb-källa spelet inte har.

**Plockas när:** hallen får ett mediaspår, sannolikt efter soft launch.

## Raderna

```ts
export const HALL_NEWS_POSITIVE = [
  '{hallclub} rapporterar perfekt is till kvällens match. Inga problem med väder.',
  '{hallclub}s ungdomslag tränar fem dagar i veckan — året runt. Utan hall hade det inte gått.',
  '"Spelarna slipper förfrusna fingrar och stela muskler" — {hallclub}s tränare i {paper}.',
  '{hallclub} genomför alla planerade träningar i januari. Utomhuslagen ställde in tre.',
  '"Rehabiliteringen går snabbare inomhus" — {hallclub}s sjukgymnast.',
  '{hallclub}s akademi lockar talanger. "Träningsmöjligheterna är avgörande" säger 16-åring.',
  '"Jag hade slutat utan hallen. Kunde inte kombinera jobb och träning ute i minus 20" — spelare i {hallclub}.',
  '{hallclub}s damsektion växer — tack vare året-runt-tillgång till is.',
]

export const HALL_NEWS_NEGATIVE = [
  '{hallclub} drog 280 åskådare igår. Hallen rymmer 4 000.',
  'Problem i {hallclub}s hall: kondens i taket droppade på isen under matchen.',
  '{hallclub}s isbädd måste läggas om. Kostnad: 1,8 miljoner.',
  '"Det är som att spela i ett kylskåp" — bortalagets spelare om {hallclub}s arena.',
  '{hallclub}s driftskostnader: 3,2 miljoner per år. Klubben gick back förra året.',
  'Publiken klagar på sikten i {hallclub}s hall. "Stolparna skymmer halva planen."',
  'Paradoxen: {hallclub}s is blev sämre ju fler som kom. Värmen från publiken.',
  '"Stämningen dör i hallen. Det är inte samma sak" — supporter i {paper}.',
  '{hallclub} tvingades stänga hallen en vecka — värmesystemet kollapsade.',
  'Kommunen höjer hyran för {hallclub}s hall. +15% från nästa säsong.',
  'Kondensproblemen i {hallclub}s hall förvärras. Fjärde matchen med droppar.',
  '{hallclub}s elräkning: 890 000 kr bara i januari. Styrelsen sväljer hårt.',
]

export const HALL_NEWS_OUTDOOR_PRIDE = [
  'Ni drog storpublik i snöstorm. {hallclub} hade 290 i sin hall.',
  'Utomhusmatchen mot {opponent} beskrivs som "årets upplevelse" i {paper}.',
  '"Riktig bandy spelas utomhus" — insändare i {paper} efter er seger.',
  'Strålkastarljus, snöfall och två poäng. Publiken gick hem med röda kinder och leenden.',
  'Er match är den mest sedda på Bandyplay den här veckan. "Atmosfären!" kommenterar tittarna.',
  '"Den här kvällen är anledningen till att jag älskar bandy" — supporter på sociala medier.',
  '{paper}: "Utomhusbandyn lever — {club} bevisar det match efter match."',
  'Ungdomslaget spelade sin bästa match i minus 12. Tränaren: "De växer av det."',
]

export const BOARD_HALL_QUOTES = {
  supporter: [
    '"Jag vill ha publik. Publik kommer utomhus, inte i hallar."',
    '"Har du känt stämningen en snökväll med 1 500 på planen? Det kan ingen hall ge."',
    '"Jag tar hellre 2 000 utomhus än 300 i en hall."',
  ],
  ekonom: [
    '"Vet du vad en hall kostar? Räkna. Sen säger du nej själv."',
    '"Driftskostnaderna för en hall: 3 miljoner per år. Minst."',
    '"Kommunen lovar alltid. Sen kommer besparingarna."',
    '"Gubbängens isbädd kostade 1,8 att lägga om. Och den håller max fem år."',
  ],
  traditionalist: [
    '"Bandy. Spelas. Utomhus. Slut på diskussionen."',
    '"Min farfar stod här i minus 25 och tittade på bandy. Hall? Aldrig."',
    '"Det finns ett ord för bandy inomhus. Det heter innebandy."',
    '"Vi har spelat här i 80 år. Jag tänker inte vara den som ger upp."',
  ],
  modernist: [
    '"Hallklubbarna lockar med träningstider året om. Samband med att vi tappar folk? Kanske."',
    '"Ungdomarna slutar. De orkar inte frysa. Vi måste lyssna."',
    '"En hall ger oss träning 12 månader om året istället för 5."',
    '"Jag säger inte att hall är svaret. Men frågan måste ställas."',
  ],
}
```
