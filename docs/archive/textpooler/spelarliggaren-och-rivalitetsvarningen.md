# Spelarliggarens karaktärsrader och rivalitetsvarningen

> Arkiverad 2026-09-19 enligt **DOM — döda textpooler, 2026-09-18 (Fable)**.
> Texten är bra; ytan finns inte. Arkiverad i stället för struken så arbetet inte försvinner.
> Källa: `src/domain/data/transferResponseText.ts`

## Varför arkiverad

Spelarliggarens rader ("Kör grävmaskin åt kommunen på vardagarna") är bland de bästa i hela
korpusen, men de är hårdkodade EXEMPEL utan variabler — Ekström, Sjödin och Skutskär står i
klartext — och kan därför inte kopplas in generiskt. De arkiveras som förlaga, inte som pool.

Rivalitetsvarningen (nio intensitetsnivåer) arkiveras tills transferytorna rörs.

**Plockas när:** POST_LAUNCH `scout-shortlist-transferfonster`.

## Raderna

```ts
export const PLAYER_LEDGER_TENURE_LINES = [
  'Sju säsonger i klubben. Har ratat två bud förr.',
  'Nio år i tröjan. Han vet var isen är hårdast.',
  'Kom hit som junior, har aldrig lämnat.',
] as const

export const PLAYER_LEDGER_DAY_JOB_LINES = [
  'Kör grävmaskin åt kommunen på vardagarna.',
  'Står i järnhandeln på stan mellan träningarna.',
  'Vaktmästare på skolan. Alla ungar känner honom.',
] as const

export const PLAYER_LEDGER_BLOODLINE_LINES = [
  '214 matcher. Fostrad av Ekström, fostrar Sjödin.',
  'Bär numret hans farbror bar. Ingen glömmer det.',
  'Tredje generationen i klubben. Det står i pärmen.',
] as const

export const PLAYER_LEDGER_TRIUMPH_LINES = [
  'Nollade Skutskär i SM-finalen.',
  'Avgjorde derbyt när det stod och vägde.',
  'Gjorde målet som tog upp laget. Det pratas om det än.',
] as const

export const RIVALRY_WARNING_PER_INTENSITY: Record<RivalryIntensity, string[]> = {
  1: [
    'Klacken hörs på avstånd. De vet redan.',
    'Det blir prat i kafferummet. Inget värre.',
    'Vi har spelat dem flera gånger. Det här blir noterat.',
  ],
  2: [
    'Klacken kommer inte att gilla det här.',
    'Det är en rivalitet. Spelare som går dit minns det länge.',
    'Det stannar inte vid klubben. Hela bygden får veta.',
  ],
  3: [
    'Det är den klubben. Klacken kommer inte att glömma.',
    'Det målas banderoller i veckan. Han blir ihågkommen.',
    'Det stannar i klubben i tio år. Sture pratar fortfarande om Lindgren-affären 02.',
  ],
}
```
