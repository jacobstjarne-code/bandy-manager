# 4.2 — SVAR TILL DE 17 STORYLINE- OCH ARC-FRÅGORNA

**Datum:** 2026-08-19 · **Av:** Opus
**Underlag:** `docs/DERBYREPLIKEN_STORYLINE_FRAGOR_2026-08-19.md`

---

## Fyndet under fyndet

Buggen är att `preferIds` ärvs från föregående fråga. Men att peka dem rätt räcker inte: **den befintliga svarsbanken kan inte besvara de här frågorna.**

Alla 130 svar i `PLAYER_RESPONSES` handlar om matchen — insats, form, taktik, publik, tabellen. De 17 frågorna handlar om människor, orten och tid. Ett korrekt `preferIds` mot `w_h1` ("Stark insats av hela laget") på frågan "Varslet drabbade era spelare hårt" ger rätt kod och lika fel svar.

Därför: **31 nya svar**, grupperade i fyra ämnesfamiljer. De läggs i samma `PLAYER_RESPONSES`-array med samma struktur.

**Alla nya taggar får `generic: 'none'` i `TAG_DEFS`.** De ska aldrig kunna slinka in i en vanlig matchfråga via generic-fallbacken — samma disciplin som `win_derby` fick i U2.

---

## Nya svar — ämnesfamilj 1: människor och arbete

Trigger: varsel, heltidskontrakt, återvändare, spelarens liv utanför isen.

```
{ id: 'tp_liv1', tag: 'topic_person', label: '"Han går till jobbet klockan sex. Sen tränar han. Det är det man ska skriva om."', moraleEffect: 5,
  mediaQuote: 'Tränaren: "Han går till jobbet klockan sex och tränar sen. Det är det man ska skriva om."' },

{ id: 'tp_liv2', tag: 'topic_person', label: '"Vi är en förening. Det betyder att vi bryr oss om folk även när det inte lönar sig."', moraleEffect: 6,
  mediaQuote: 'Tränaren: "Vi är en förening. Vi bryr oss om folk även när det inte lönar sig."' },

{ id: 'tp_liv3', tag: 'topic_person', label: '"Det är inte min sak att prata om andras privatliv."', moraleEffect: 1,
  mediaQuote: 'Tränaren avböjde: "Det är inte min sak att prata om andras privatliv."' },

{ id: 'tp_liv4', tag: 'topic_person', label: '"Han bad aldrig om något. Det var vi som frågade."', moraleEffect: 5,
  mediaQuote: 'Tränaren: "Han bad aldrig om något. Det var vi som frågade honom."' },

{ id: 'tp_liv5', tag: 'topic_person', label: '"Trygghet gör folk modigare. Det syns på isen också."', moraleEffect: 6,
  mediaQuote: 'Tränaren: "Trygghet gör folk modigare. Det syns på isen också."' },

{ id: 'tp_liv6', tag: 'topic_person', label: '"Ett kontrakt är papper. Det som räknas är att någon vill ha en kvar."', moraleEffect: 5,
  mediaQuote: 'Tränaren: "Ett kontrakt är bara papper. Det som räknas är att någon vill ha en kvar."' },

{ id: 'tp_liv7', tag: 'topic_person', label: '"Han hade kunnat gå någon annanstans. Han gjorde inte det."', moraleEffect: 6,
  mediaQuote: 'Tränaren: "Han hade kunnat gå någon annanstans. Han valde oss."' },

{ id: 'tp_liv8', tag: 'topic_person', label: '"Vi lovade ingenting. Vi sa bara att vi finns kvar."', moraleEffect: 4,
  mediaQuote: 'Tränaren: "Vi lovade honom ingenting. Vi sa bara att vi finns kvar."' },
```

## Ämnesfamilj 2: orten

Trigger: hög eller låg communityStanding, mecenat, bygge.

```
{ id: 'tp_ort1', tag: 'topic_town', label: '"Folk säger hej i affären igen. Det är hela mätaren."', moraleEffect: 6,
  mediaQuote: 'Tränaren: "Folk säger hej i affären igen. Det är hela mätaren för mig."' },

{ id: 'tp_ort2', tag: 'topic_town', label: '"Vi spelar för dem som står ut med oss när det går dåligt."', moraleEffect: 5,
  mediaQuote: 'Tränaren: "Vi spelar för dem som står ut med oss när det går dåligt."' },

{ id: 'tp_ort3', tag: 'topic_town', label: '"De kommer tillbaka när vi ger dem en anledning. Inte innan."', moraleEffect: 3,
  mediaQuote: 'Tränaren var rak: "De kommer tillbaka när vi ger dem en anledning. Inte innan."' },

{ id: 'tp_ort4', tag: 'topic_town', label: '"Det är ingen press. Det är att någon bryr sig. Skillnaden är stor."', moraleEffect: 6,
  mediaQuote: 'Tränaren: "Det är ingen press. Det är att någon bryr sig. Skillnaden är stor."' },

{ id: 'tp_ort5', tag: 'topic_town', label: '"Tomma läktare är vårt fel, inte deras."', moraleEffect: 3,
  mediaQuote: 'Tränaren tog ansvar: "Tomma läktare är vårt fel, inte publikens."' },

{ id: 'tp_ort6', tag: 'topic_town', label: '"Pengar löser en sak i taget. Laget löser resten."', moraleEffect: 4,
  mediaQuote: 'Tränaren: "Pengar löser en sak i taget. Laget löser resten."' },

{ id: 'tp_ort7', tag: 'topic_town', label: '"Han gör det för att han växte upp här. Inte för att synas."', moraleEffect: 5,
  mediaQuote: 'Tränaren om sponsorn: "Han gör det för att han växte upp här. Inte för att synas."' },

{ id: 'tp_ort8', tag: 'topic_town', label: '"Det låter och dammar. Grabbarna klarar av lite oväsen."', moraleEffect: 3,
  mediaQuote: 'Tränaren log: "Det låter och dammar. Grabbarna klarar lite oväsen."' },

{ id: 'tp_ort9', tag: 'topic_town', label: '"Om två år står det där. Då är det värt varenda dag."', moraleEffect: 5,
  mediaQuote: 'Tränaren: "Om två år står bygget där. Då är det värt varenda dag."' },
```

## Ämnesfamilj 3: förväntan och tvivel

Trigger: underdog-storyline, kaptenens tal.

```
{ id: 'tp_tvi1', tag: 'topic_doubt', label: '"Jag lyssnade aldrig. Det är inte högmod, jag hann bara inte."', moraleEffect: 6,
  mediaQuote: 'Tränaren: "Jag lyssnade aldrig på tvivlarna. Jag hann bara inte."' },

{ id: 'tp_tvi2', tag: 'topic_doubt', label: '"De hade rätt på papperet. Papperet spelar inga matcher."', moraleEffect: 7,
  mediaQuote: 'Tränaren: "De hade rätt på papperet. Men papperet spelar inga matcher."' },

{ id: 'tp_tvi3', tag: 'topic_doubt', label: '"Vi har inte bevisat något än. Fråga mig i mars."', moraleEffect: 4,
  mediaQuote: 'Tränaren bromsade: "Vi har inte bevisat något än. Fråga mig i mars."' },

{ id: 'tp_tvi4', tag: 'topic_doubt', label: '"Det som höll oss uppe var att ingen väntade sig något."', moraleEffect: 3,
  mediaQuote: 'Tränaren: "Det som höll oss uppe var att ingen väntade sig något. Nu gör de det."' },

{ id: 'tp_tvi5', tag: 'topic_doubt', label: '"Vi föll ihop när vi började tro på berömmet."', moraleEffect: 2,
  mediaQuote: 'Tränaren var självkritisk: "Vi föll ihop när vi började tro på berömmet."' },

{ id: 'tp_tvi6', tag: 'topic_doubt', label: '"Han sa det ingen annan vågade säga. Sen sa han inget mer."', moraleEffect: 6,
  mediaQuote: 'Tränaren om kaptenen: "Han sa det ingen annan vågade säga. Sen sa han inget mer."' },

{ id: 'tp_tvi7', tag: 'topic_doubt', label: '"Sånt håller i tre veckor. Sen får man förtjäna det igen."', moraleEffect: 4,
  mediaQuote: 'Tränaren: "Ett tal håller i tre veckor. Sen får man förtjäna det igen."' },
```

## Ämnesfamilj 4: enskilda spelare under press

Trigger: arc i `peak`, ung spelare, galavinnare.

```
{ id: 'tp_spe1', tag: 'topic_player', label: '"Jag tror på honom. Det är hela svaret."', moraleEffect: 6,
  mediaQuote: 'Tränaren var kort: "Jag tror på honom. Det är hela svaret."' },

{ id: 'tp_spe2', tag: 'topic_player', label: '"Han får spela sig ur det. Det finns ingen annan väg."', moraleEffect: 4,
  mediaQuote: 'Tränaren: "Han får spela sig ur det. Det finns ingen annan väg."' },

{ id: 'tp_spe3', tag: 'topic_player', label: '"Han kostar ibland. Men han vinner matcher ingen annan vinner."', moraleEffect: 5,
  mediaQuote: 'Tränaren: "Han kostar ibland. Men han vinner matcher ingen annan vinner."' },

{ id: 'tp_spe4', tag: 'topic_player', label: '"Det bestämmer han, inte jag. Och inte ni."', moraleEffect: 4,
  mediaQuote: 'Tränaren: "Det bestämmer han själv. Inte jag, och inte pressen."' },

{ id: 'tp_spe5', tag: 'topic_player', label: '"Han har gett klubben tolv år. Han får ta den tid han behöver."', moraleEffect: 7,
  mediaQuote: 'Tränaren: "Han har gett klubben tolv år. Han får ta den tid han behöver."' },

{ id: 'tp_spe6', tag: 'topic_player', label: '"Rykten kommer varje vinter. Han är kvar varje vår."', moraleEffect: 5,
  mediaQuote: 'Tränaren avfärdade: "Rykten kommer varje vinter. Han är kvar varje vår."' },

{ id: 'tp_spe7', tag: 'topic_player', label: '"Vi pratar om det när säsongen är slut. Inte nu."', moraleEffect: 3,
  mediaQuote: 'Tränaren: "Vi pratar om kontraktet när säsongen är slut. Inte nu."' },
```

---

## Mappningen — `preferIds` per fråga

### Storyline-triggade

| # | Ämne | `preferIds` |
|---|---|---|
| 1 | Underdog, vann | `['tp_tvi2', 'tp_tvi1', 'tp_tvi3']` |
| 2 | Underdog, tappar | `['tp_tvi4', 'tp_tvi5', 'tp_tvi3']` |
| 3 | Kaptenens tal | `['tp_tvi6', 'tp_tvi7', 'w_h5']` |
| 4 | Räddad från varsel, matchhjälte | `['tp_liv1', 'tp_liv4', 'tp_liv2']` |
| 5 | Räddad från varsel, allmänt | `['tp_liv2', 'tp_liv8', 'tp_liv3']` |
| 6 | Heltidsproffs | `['tp_liv5', 'tp_liv1', 'tp_liv6']` |
| 7 | Återvänt till klubben | `['tp_liv7', 'tp_liv6', 'tp_liv3']` |
| 8 | Galavinnare | `['tp_spe1', 'tp_ort4', 'w_p3']` |

### Community-standing-triggade

| # | Ämne | `preferIds` |
|---|---|---|
| 9 | Hög status i orten | `['tp_ort4', 'tp_ort1', 'tp_ort2']` |
| 10 | Låg status i orten | `['tp_ort5', 'tp_ort3', 'tp_ort2']` |
| 11 | Ny mecenat | `['tp_ort7', 'tp_ort6', 'tp_liv3']` |
| 12 | Bygge pågår | `['tp_ort8', 'tp_ort9', 'tp_ort6']` |
| 13 | Ung akademispelare | `['tp_spe4', 'tp_spe2', 'cl32']` |

### Arc-aware

| # | Ämne | `preferIds` |
|---|---|---|
| 14 | Genombrott, tveksam | `['tp_spe1', 'tp_spe2', 'tp_liv3']` |
| 15 | Jokern, delade meningar | `['tp_spe3', 'tp_spe2', 'tp_liv3']` |
| 16 | Veteranens sista säsong | `['tp_spe5', 'tp_spe4', 'tp_spe7']` |
| 17 | Kontraktsrykten | `['tp_spe6', 'tp_spe7', 'tp_spe4']` |

**Fyra återanvändningar** av befintliga svar där de faktiskt passar: `w_h5` (fråga 3), `w_p3` (8), `cl32` (13). Resten är nya.

---

## Wiring

Ersätt `preferIds: question.preferIds` med listan ovan på alla 17 rader.

Lägg de fyra nya taggarna i `TAG_DEFS`:

```ts
topic_person: { matches: () => false, generic: 'none' },
topic_town:   { matches: () => false, generic: 'none' },
topic_doubt:  { matches: () => false, generic: 'none' },
topic_player: { matches: () => false, generic: 'none' },
```

`matches: () => false` är avsiktligt: dessa svar ska **bara** nås via explicit `preferIds`, aldrig via kontextmatchning eller generic-fallback. De hör till en fråga, inte till ett matchutfall.

**Verifiera:** ett tabelltest som för var och en av de 17 frågorna kollar att alla tre `preferIds` finns i banken, och att inget `topic_*`-svar kan dyka upp på en vanlig matchfråga.
