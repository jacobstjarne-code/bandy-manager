# Faktarutor om Studenternas och Sävstaås

> Arkiverad 2026-09-19 enligt **DOM — döda textpooler, 2026-09-18 (Fable)**.
> Texten är bra; ytan finns inte. Arkiverad i stället för struken så arbetet inte försvinner.
> Källa: `src/domain/data/specialDateStrings.ts`

## Varför arkiverad

Research-underlag, inte speltext. Raderna innehåller VERKLIGA klubbar (Hammarby, Bollnäs, Edsbyn)
som skrivguiden förbjuder i speltext — spelets tolv klubbar är påhittade, och att låna in riktiga
föreningars meriter bryter regeln i CLAUDE.md om spelvärlden.

**Plockas när:** raderna tvättas från klubbnamn; kan då bli lore-kommentar
(`FINALDAG_COMMENTARY_LORE` finns redan och används).

## Raderna

```ts
export const STUDAN_FACTS = {
  inaugurated: '21 mars 1909',
  totalFinals: 23,
  rank: 'näst flest efter Stockholms Stadion (47)',
  attendanceRecord: 25_560,
  attendanceRecordYear: 2010,
  attendanceRecordMatch: 'Hammarby IF 3–1 Bollnäs GIF',
  attendanceRecordContext: 'Den enda SM-final som spelats i 3×30 minuter — pga ymnigt snöfall',
  location: 'Vid Fyrisån, intill Stadsträdgården i centrala Uppsala',
  reconstruction: 'Ombyggd 2017–2020 av White Arkitekter',
  finalsPeriod1: '1991–2012',
  finalsPeriod2: '2018–2023',
  iconicMatches: [
    {
      year: 2010,
      teams: 'Hammarby–Bollnäs',
      score: '3–1',
      story: '3×30 minuter pga snöfall. "Grisbandy" första två perioderna, "riktig bandy" sista. Hammarbys första SM-guld på 105 år.',
    },
    {
      year: 2011,
      teams: 'SAIK–Bollnäs',
      score: '6–5 (sudden death)',
      story: 'SAIK-ikonen Daniel "Zeke" Eriksson sköt avgörande mål via frislag i sin allra sista match.',
    },
    {
      year: 1999,
      teams: 'Västerås–Falu BS',
      score: '3–2',
      story: 'Falu BS hela vägen till final — första laget med ryska spelare (Sergej Obuchov + Valerij Gratjev).',
    },
  ],
}

export const SAVSTAAS_FACTS = {
  inaugurated: '1973–1974 (säsongen)',
  artificialIce: 1984,
  homePeriod: 'Bollnäs hemmaplan 1974–2022',
  attendanceRecord: 8_151,
  attendanceRecordDate: '26 december 2000',
  attendanceRecordMatch: 'Bollnäs–Edsbyn (annandagen)',
  attendanceRecordContext: 'Publikrekordet är från en annandagsmatch — det är inget tomt sammanträffande',
  atmosphere: {
    supporters: 'Flames — en gång rankad som Sveriges fjärde bästa supporterklubb (alla sporter, Aftonbladet)',
    inmarchSong: 'Dans på Sävstaås',
    fireworks: 'Nisses fyrverkerier innan match',
    flagSize: 'Jumboflaggor 4×4 meter',
    standsSouth: 'Träläktare med murkna brädor, blåaktigt rostigt räcke',
    standsEast: 'Hela långsidan, 25–30 trappsteg hög, inget tak',
    standsMain: 'Tak, störst, nyast — där Flames står',
    iceHall: 'Ishallen bredvid där folk värmer fingrar i halvtid + köper korv',
    smell: 'Kväljande cigarettrök, korv, glögg',
  },
  ghost: 'Sirius vann ingen bortamatch på Sävstaås 1983–2018. 23 raka förluster på 35 år.',
  bollnasFinals: [1943, 1951, 1956, 2010, 2011, 2017],
  bollnasGold: [1951, 1956],
}
```
