# Copy-pool — Upptakt-portalen (C-SD2)

Per sub-state. Code slumpar utan upprepning per spelinstans. Bandysvensk understatement. **Mittfält-utan-dramatik visar ingen upptakt** — vanlig portal kvarstår tills kvart börjar.

Sub-state-resolver i Code (`portalEscalationResolver.ts`) returnerar en av fyra:
- `sakrat` — slutspelet matematiskt säkrat, slåss om placering/seedning
- `farozon` — slutspelsplatsen aktivt på spel (matematiskt nåbar OCH förlust kan kosta plats)
- `mittfalt` — matematiskt cementerad, varken upp eller ner möjligt → **ingen upptakt visas**
- `bottenstrid` — slutspelet utom räckhåll, kval på spel

Upptakt visas när `remaining === 3` OCH `subState !== 'mittfalt'`.

---

## SÄKRAT — slutspelet klart, jagar placering

Lugn självbild men kämpar om något konkret (seedning, hemmaplan i kvart).

### PhaseMark (eyebrow + quote + helper)

```ts
{
  eyebrow: "⬩ Slutspelet är klart ⬩",
  quote: "Nu är det placeringen som ska avgöras.",
  helper: "Slutspelsplatsen säkrad — seedningen kämpar vi för.",
}
{
  eyebrow: "⬩ Placeringen avgör ⬩",
  quote: "Slutspelet väntar. Frågan är var vi möter vem.",
  helper: "Tre omgångar avgör hur högt vi seedar.",
}
{
  eyebrow: "⬩ Inräknade i slutspelet ⬩",
  quote: "Det är klart att vi spelar. Inte var.",
  helper: "Hemmaplan i kvart kostar tre poäng mer.",
}
{
  eyebrow: "⬩ Placering att jaga ⬩",
  quote: "Slutspelet är säkrat. Nästa fråga är seedning.",
  helper: "Hög seedning ger lättare motstånd i kvart.",
}
{
  eyebrow: "⬩ Slutspelet garanterat ⬩",
  quote: "Tre omgångar för att klippa placeringen.",
  helper: "Toppen är inte färdigplockad än.",
}
{
  eyebrow: "⬩ Säkrade — men inte färdiga ⬩",
  quote: "Vi har en plats. Inte den vi vill ha.",
  helper: "Slutspelets seedning hänger på vad vi gör nu.",
}
```

### Countdown-text (under pip-rail)

```
"{N} omgångar kvar — till seedningen."
"{N} till spel — placeringen avgörs."
"{N} kvar — slutspelsplaceringen klar efter sista omgången."
"{N} omgångar för att klippa seedningen."
"{N} kvar — toppen inte färdigplockad än."
```

---

## FAROZON — slutspelsplatsen på spel

Spänd, ärlig, "varje match räknas". Tonen Design använde i sin mock.

### PhaseMark

```ts
{
  eyebrow: "⬩ Slutstriden närmar sig ⬩",
  quote: "Tre omgångar. Sen avgörs allt.",
  helper: "Slutspelsplatsen är inom räckhåll — men inte säkrad.",
}
{
  eyebrow: "⬩ Marginalen krymper ⬩",
  quote: "Varje match räknas nu.",
  helper: "Marginalen tål inte slarv. Tre omgångar kvar.",
}
{
  eyebrow: "⬩ På strecket ⬩",
  quote: "Slutspelet ligger i våra händer. Hittills.",
  helper: "Slipper vi slarva tre omgångar är vi inne.",
}
{
  eyebrow: "⬩ Tre matcher kvar ⬩",
  quote: "Vi vet vad som krävs.",
  helper: "Sex poäng räcker. Fyra räcker om de andra snubblar.",
}
{
  eyebrow: "⬩ Det börjar närma sig ⬩",
  quote: "Lugna det här först. Sen spelar vi slutspel.",
  helper: "En förlust och vi får börja räkna scenarier.",
}
{
  eyebrow: "⬩ Slutet närmar sig ⬩",
  quote: "Slutspelet eller inte avgörs nu.",
  helper: "Övriga lag spelar också — våra resultat räcker inte alltid.",
}
```

### Countdown-text

```
"{N} omgångar kvar — till slutspelet eller hemfärd."
"{N} till spel som avgör säsongen."
"{N} matcher kvar. Marginalen tål inte slarv."
"{N} omgångar att hålla isär det här."
"{N} kvar. Sex poäng räcker — slipper vi misstag."
```

---

## BOTTENSTRID — slutspelet utom räckhåll, kval på spel

Cold istället för warm. Allvar utan att skylla. "Något att spela för fast inte slutspel."

**OBS för Code:** den här sub-state använder warm-PhaseMark men `helper`-color tonad mot cold (`--cold-light` istället för `--warm-light`). Visuell mod: warm-frame med cold-undertext signalerar "ramen är allvarlig men innehållet är åt andra hållet". Design bekräftade i mocken: "warm-upptakt men annan copy".

### PhaseMark

```ts
{
  eyebrow: "⬩ Annat att spela för ⬩",
  quote: "Slutspelet är utom räckhåll. Men det finns annat.",
  helper: "Tre omgångar för att hålla oss ifrån kvalet.",
}
{
  eyebrow: "⬩ Säsongens sista akt ⬩",
  quote: "Inte slutspelet. Men inte heller över.",
  helper: "Bottenkampen avgörs nu.",
}
{
  eyebrow: "⬩ Strecket åt fel håll ⬩",
  quote: "Vi spelar för att slippa kvalet.",
  helper: "Två lag åker direkt. Vi ligger i farozonen.",
}
{
  eyebrow: "⬩ Slutspelet är borta ⬩",
  quote: "Men ärligheten i de tre sista är allt.",
  helper: "Vi måste hålla nivån — för truppen, för bygden, för nästa år.",
}
{
  eyebrow: "⬩ Lugnare men inte mindre viktigt ⬩",
  quote: "Vi spelar för säsongen som kommer, inte den som var.",
  helper: "Sluta starkt sätter tonen för sommarens fönster.",
}
{
  eyebrow: "⬩ Ingen lyx — bara plikt ⬩",
  quote: "Sista tre. Slipp kvalet och visa nivå.",
  helper: "Inget att vinna, mycket att förlora.",
}
```

### Countdown-text

```
"{N} omgångar kvar — för att hålla oss ifrån kvalet."
"{N} kvar. Annat att spela för än slutspel."
"{N} matcher till. Inte slutspelet — något annat."
"{N} sista matcherna. Visa nivå."
"{N} kvar. Sluta starkt sätter tonen för sommaren."
```

---

## CRIT-TAGS för primary (must-win-tag på pcard)

Visas när sub-state `farozon` OCH motståndaren konkurrerar om samma slutspelsplats (sex-poängsmatch).

```ts
"Måste-vinna"
"Sex-poängsmatch"
"Avgörande"
"Slutspelsstrid"
"Strecket avgörs"
"Bortskaffning"
"Plats på spel"
"Sant-läge"
```

Visas också vid `bottenstrid` när motståndaren slåss om samma kvalstreck — då med samma tags men i cold-tonad rendering.

---

## Format-anteckning till Code

TypeScript-konvertering i `src/domain/data/upptaktCopy.ts`:

```ts
type PhaseMarkVariant = { eyebrow: string; quote: string; helper: string };
type SubState = 'sakrat' | 'farozon' | 'bottenstrid';

export const UPPTAKT_PHASEMARKS: Record<SubState, PhaseMarkVariant[]> = { ... };
export const UPPTAKT_COUNTDOWN: Record<SubState, string[]> = { ... };
export const MUSTWIN_CRIT_TAGS: string[] = [ ... ];

export function pickUpptaktPhaseMark(state: SubState, seed: number, seen: Set<number>): PhaseMarkVariant;
export function pickCountdownText(state: SubState, remainingRounds: number, seed: number, seen: Set<number>): string;
```

No-repeat-tracker per pool och spelinstans. Countdown-text interpolerar `{N}` med faktisk remainingRounds.

PhaseMark är **engångs per säsong** — markeras seen efter första visning, samma pattern som "Slutspelet börjar"-PhaseMark.
