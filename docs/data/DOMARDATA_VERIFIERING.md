# Steg 1 — Verifiering av domardata i Bandygrytan

**Utförd:** 2026-05-30  
**Status:** DATAN FINNS — gå vidare till steg 2

---

## Fält och format

Domardata finns i `preCache/getFixtureData/{fixtureId}` under nyckeln `referees`.

### Gammalt format (2019–2022, numeriska fixture-ID:n)

```json
{
  "referees": {
    "referee": {
      "firstName": "Jacob",
      "lastName": "Sulasalmi",
      "peopleName": "Jacob Sulasalmi",
      "position": "Head referee",
      "positionID": 20,
      "role": "Referee"
    },
    "assistantReferee1": {
      "firstName": "Robin",
      "lastName": "Sörensson",
      "peopleName": "Robin Sörensson",
      "position": "Assistant referee",
      "positionID": 21,
      "role": "Referee"
    },
    "assistantReferee2": {
      "firstName": "Andreas",
      "lastName": "Pettersson",
      "peopleName": "Andreas Pettersson",
      "position": "Assistant referee",
      "positionID": 21,
      "role": "Referee"
    }
  }
}
```

### Nytt format (2023+, `fx_`-prefixade fixture-ID:n)

Utökat med `birthday`, `fxPlayerID`, `peopleID`. Nyckeln `referees` kvar, understruktur likadan.

### Identifiering

- Huvuddomare: `referees.referee` (positionID 20)
- Assistenter: `referees.assistantReferee1`, `referees.assistantReferee2` (positionID 21)
- Damernas matcher: identiskt format, bekräftat i 2019-20 och 2022-23

---

## Verifierade fixtures

| Fixture ID | Säsong | Serie | Domare (huvud) | Assistenter |
|------------|--------|-------|----------------|-------------|
| 27431 | 2019-20 | herr | Jacob Sulasalmi | Robin Sörensson, Andreas Pettersson |
| 37381 | 2022-23 | herr | Andreas Broberg | Jonas Lindberg, Gustav Olhans |
| 27613 | 2019-20 | dam | Victoria Bergström | Amanada Bäverhag, Oskar Stenberg |
| 37962 | 2022-23 | dam | Elisabeth Englund | Samuel Karlsson, Matviy Khotyaintsev |
| fx_32055946 | 2024-25 | allsv | Björn Spångmark (bekräftat field finns) | — |

---

## Datavolym

Befintlig `bandygrytan_detailed.json` täcker:

| Serie | Säsonger | Matcher |
|-------|----------|---------|
| Herr | 2019-20, 2020-21, 2021-22, 2022-23, 2024-25, 2025-26 | 1321 |
| Dam | 2019-20, 2020-21, 2021-22, 2022-23, 2024-25, 2025-26 | 428 |
| **Totalt** | | **1749** |

Notera: 2023-24 saknas i båda serierna (competition fixture-lista inte i preCache — känt sedan tidigare).

---

## Täckningsfrågor att besvara i steg 2

- Hur stor andel av de 1749 matcherna har `referees != null`?
- Varierar täckningen per säsong eller serie?
- Finns tredje assistent eller annan roll förutom positionID 20 och 21?
