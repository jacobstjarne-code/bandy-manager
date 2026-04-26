# facts/questions — Q-facts

Öppna forskningsfrågor om bandy och Bandy Manager.

En Q-fact skapas när en finding identifierar en fråga som inte
besvaras av existerande data eller analys. Frågan lever som `open`
tills en finding explicit besvarar den, då status sätts till `answered`.

## Filnamn

`{fact_id}_{kort_slug}.yaml`

Exempel:
- `Q001_ht_lead_by_score_size.yaml`
- `Q042_corner_home_away_split.yaml`

## Obligatoriska fält

```yaml
fact_id: Q001
category: questions
claim: "Hur ser winrate ut splittat på 1–0 vs 2–0 vs 3+–0 vid halvtid?"
spawned_by: "finding:001"
spawned_at: 2026-04-25
status: open          # open | answered
verified_at: 2026-04-25
verified_by: code
```

## Vid svar

När en finding besvarar frågan:

```yaml
status: answered
answered_by: "finding:042"
```

Och i findingens index.astro läggs en HTML-kommentar till:
`<!-- answers: Q001 -->`

## Regler

- Q-facts har INTE `value:`, `unit:`, `source:`, eller `invariants:`.
- `claim:` är frågans fullständiga text.
- Frågor under 20 tecken eller utan specifik bandykontext skapas inte.
- Dubbletter dedupliceras vid pipeline-körning (>80% likhet = länk,
  inte ny Q).
