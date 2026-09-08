# Akademins tvåsäsongssolvens — 2026-09-08

**Status:** GODKÄND, 9/9 körningar uppfyllde D2.

## Slutsats

Akademin på nivån **Satsning** kan behålla den låsta driften på 5 tkr per
omgång. Samtliga nio körningar var antingen solventa efter två säsonger eller
hade visat spelets kritiska ekonomiväg innan kassan passerade −100 tkr.
Produktionspriser och ekonomivarningens trösklar lämnades därför orörda.

Mätningen gjordes efter att den sedan tidigare visade akademidriften kopplats
till den faktiska ekonomimutationen. Före fixen stod 2/5/10 tkr per omgång i
Akademi-vyn utan att beloppet drogs från kassan.

## Metod

- Tre deterministiska erbjudandeseeds: 3, 11 och 29.
- Ett erbjudet kontrakt per synlig nivå: LÄTT, MEDEL och SVÅR.
- Nio karriärer kördes i två hela säsonger.
- Varje klubb startade akademinivån Satsning och betalade startkostnaden 50 tkr.
- En eventuell startmecenat välkomnades; övriga beslut använde
  stress-fixturens minsta-ingrepp-policy.
- En körning godkändes om slutkassan var minst −100 tkr, eller om den kritiska
  ekonomivägen hade blivit synlig innan kassan passerade −100 tkr.
- Reproduceras med:

  `node_modules/.bin/vite-node scripts/akademi-tvasasong-solvens-matning-2026-09-08.ts`

## Resultat

| Visad nivå | Godkända | Under −100 tkr | Median slutkassa | Spann |
|---|---:|---:|---:|---:|
| LÄTT | 3/3 | 1 | 670 tkr | −199…1 023 tkr |
| MEDEL | 3/3 | 3 | −322 tkr | −623…229 tkr |
| SVÅR | 3/3 | 3 | −607 tkr | −821…−145 tkr |

De negativa slutvärdena är inte i sig ett godkänt solvensutfall. De passerar
endast D2 därför att spelets kritiska ekonomiväg var synlig före den låsta
djup-negativ-gränsen. Testet verifierar alltså domens två alternativa vägar,
inte att alla klubbar kan ignorera ekonomin i två säsonger.

## Kontroll av erbjudandenas svårighetsnivå

En separat kontroll efter mätningen räknade klubbmallarna genom den kanoniska
`getDifficulty`-funktionen: två LÄTT, sex MEDEL och fyra SVÅR. För seeds 3, 11
och 29 kom varje erbjudandes visade etikett från samma grupp som klubbens
beräknade klass; reservvägen för en tom grupp aktiverades inte. En preliminär
tolkning att LÄTT-poolen var tom var alltså fel och ska inte användas som ett
produkt- eller kalibreringsfynd.

## Verifierad wiring

- 2/5/10 tkr per omgång kommer från en gemensam prisfunktion.
- Ekonomimotorn drar beloppet varje hanterad omgång och skriver
  `Akademidrift` i finansloggen.
- Ekonomivyns prognos räknar med samma kostnad.
- Årsboken fryser domens rad med startkostnad, driftkostnad, uppflyttningar och
  sammanlagd utveckling från återvända lån.
