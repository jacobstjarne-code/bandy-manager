# Korta pooler ur strykbeslutet, 2026-09-18

> Arkiverad 2026-09-19 enligt **DOM — döda textpooler, 2026-09-18 (Fable)**, post 17.
> Domen klassade dessa som hjälpare vars anropare försvunnit och sa STRYK. Koden är struken —
> men texten stod på `docs/BEVARANDELISTA.md`, och bevaranderegeln säger att färdig text inte
> får försvinna osynligt. Raderna ligger därför kvar här.

## Varför arkiverad i stället för raderad

Domens skäl håller för KODEN: konsumenterna finns inte, och att låta exporterna ligga kvar i
`src/` gör att nästa läsare tror att de är kanon (CLAUDE.md princip 7). Men skälet säger
ingenting om texten, och de tre poolerna nedan är skriven, godkänd text utan yta.

`HALL_PROCESS_BEATS` hör till samma post men saknas här med flit: dess tre rader MIGRERADES
in i den levande stegpoolen `PROVNING_AMBIENT` (`hallProvningData.ts`) innan strykningen,
precis som domen begärde. De är alltså i spel, inte i arkiv.

**Plockas när:** en portalbeat för "ny nod möjlig" byggs (FACILITY_AVAILABLE_BEAT), upptaktens
kritikalitetstaggar får en yta (MUSTWIN_CRIT_TAGS), eller årsdagsraden får en detaljnivå
under sin etikett (ECHO_DETAIL).

## Raderna

### facilityPortalBeats.ts — FACILITY_AVAILABLE_BEAT

```ts
export const FACILITY_AVAILABLE_BEAT =
  'Det finns något nytt att bygga om man vill. Klubben har råd att tänka framåt.'
```

### upptaktCopy.ts — MUSTWIN_CRIT_TAGS

```ts
export const MUSTWIN_CRIT_TAGS: string[] = [
  'Måstematch', 'Fyrapoängsmatch', 'Avgörande', 'Slutspelsstrid',
  'Strecket avgörs', 'Plats på spel',
]
```

### anniversaryMemoryRowText.ts — ECHO_DETAIL (konsumerad av anniversaryRowDetail)

```ts
const ECHO_DETAIL: Record<'won' | 'lost' | 'neutral', string> = {
  won: 'Samma vecka som detta hände — ett ljust minne som återkommer.',
  lost: 'Samma vecka som detta hände — det skaver fortfarande.',
  neutral: 'Samma vecka som detta hände, ett annat år.',
}
```
