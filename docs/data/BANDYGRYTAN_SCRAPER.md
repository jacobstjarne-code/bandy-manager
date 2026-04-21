# Bandygrytan — Scraper-dokumentation

**Skapad:** 2026-04-21  
**Skript:** `scripts/scrape-allsvenskan.mjs` (Allsvenskan + kval), `scripts/scrape-detailed.mjs` (Elitserien)  
**Output:** `docs/data/bandygrytan_kval.json`, `docs/data/bandygrytan_allsvenskan.json`, `docs/data/bandygrytan_detailed.json`

---

## Firebase-anslutning

```
URL:     https://eu-bandygrytan-dev.firebaseio.com
API key: AIzaSyD6MTl6ELLWp9QgiyPXsF5a5NsdKGY0or4
Auth:    Anonym Firebase-auth (Identity Toolkit)
```

### Auth-flöde (inget konto behövs)

```js
const res = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
  { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnSecureToken: true }) }
)
const { idToken, expiresIn } = await res.json()
```

Token räcker `expiresIn` sekunder (~3600). Lägg `?auth=${token}` på alla requests.

---

## Firebase-struktur (preCache)

```
preCache/
├── getCompetitionsBySeason/{year}        ← lista tävlingar per år (år = heltal, e.g. 2024)
├── getCompetitionFixtures/{competitionId} ← fixture-lista per tävling
├── getFixtureData/{fixtureId}             ← matchdata (resultat, lag, datum)
└── getFixtureEvents/{fixtureId}           ← händelselogg (mål, hörnor, utvisningar)
```

Varje path avslutas med `.json?auth={token}` vid GET:

```js
const data = await fetch(`${DB}/preCache/getFixtureData/${id}.json?auth=${token}`)
```

---

## Competition ID-format — viktigt

Firebase bytte format 2023:

| Säsong | Format | Exempel |
|--------|--------|---------|
| ~2019–2022 | Numeriskt | `11831` |
| 2023+ | `fx_XXXXX` | `fx_1139491` |

**Ny-format i `getCompetitionFixtures`:**  
Det kombinerade nyckeln `fx_1139491-fx_3318853-` (som visas i `getCompetitionsBySeason`) returnerar `null`. Använd den korta formen `fx_1139491` — bara det första segmentet utan bindestreck.  

**Undantag 2024-25 Allsvenskan:** Sub-competition-nyckeln `fx_1156266-fx_3358532-` fungerar (denna täcker Övre-gruppen specifikt och är ett undersegment, inte en "huvud"-tävling).

---

## Matchstatus

| Säsong | Komplett match-status |
|--------|----------------------|
| ~2019–2022 | `"signed"` |
| 2023+ | `"ended"` |

Status-fältet i `getCompetitionFixtures` är **alltid "upcoming"** — det är stale. Kolla alltid status i `getFixtureData` direkt. Acceptera båda: `fd.status !== 'signed' && fd.status !== 'ended'` → hoppa över.

---

## Event-typer

| ID | Typ |
|----|-----|
| 1 | Hörna |
| 2 | Mål |
| 3 | Utvisning |
| 4 | Straff |
| 13 | Halvtid (HALFEND) |

Halvtidsresultat: leta efter `type === 13` → `homeGoals` / `awayGoals`.

---

## Kända competition-IDs (hard-kodade i skriptet)

### Elitseriekval (kval)

| Säsong | Key |
|--------|-----|
| 2019-20 | `11166` |
| 2020-21 | `11423` |
| 2021-22 | `11554` |
| 2022-23 | `11831` |
| 2023-24 | **saknas** — inte i preCache |
| 2024-25 | **saknas** — inte i preCache |

### Bandyallsvenskan Herr

| Säsong | Key | Matcher |
|--------|-----|---------|
| 2019-20 | `11177` | 176 |
| 2020-21 | `11436` | 176 |
| 2021-22 | `11571` | 156 |
| 2022-23 | `11845` | 176 |
| 2023-24 | `fx_1139491` | 175 |
| 2024-25 Övre | `fx_1156266-fx_3358532-` | 28 |
| 2024-25 Nedre | **saknas** — inte i preCache | — |

### Elitserien Herr (grundserie + slutspel)

Se `scripts/scrape-detailed.mjs` för fullständig lista. Täckning: 2019-20 till 2024-25, ~1242 matcher.

---

## Hur man hittar nya competition-IDs

```js
// Hämta alla tävlingar för ett år
const data = await fbGet(`preCache/getCompetitionsBySeason/2025`)
// data är ett objekt: { "11234": { name, competitionId, ... }, ... }
// Hitta rätt tävlingsnamn, notera competitionId-värdet

// Prova sedan:
await fbGet(`preCache/getCompetitionFixtures/${competitionId}`)
// Om null → prova bara det första fx_-segmentet (utan bindestreck)
// Om fortfarande null → tävlingen är inte cachad
```

För att lista alla fixture-nycklar med `fx_`-prefix:
```js
// Hämta ett lager upp och kolla nycklar
const fixtures = await fbGet(`preCache/getCompetitionFixtures`)
// Filtrera keys som börjar med 'fx_'
```

---

## Kända begränsningar

| Problem | Förklaring |
|---------|------------|
| `cornerGoal%` opålitlig | Parser-metod: hörnevent ≤2 min före mål → "corner". Ger ~45% hörnmål mot korrekt ~22%. Använd inte cornerGoal%-analys från kval/Allsvenskan-data. |
| `fouls[].team` alltid null | Event typ 3 innehåller inget lag-ID i Firebase. Utvisningsfrekvens är tillförlitlig, men inte per lag. |
| `fouls[].duration` alltid 10 min | Duration kan inte bestämmas från events — defaultas till 10. |
| 2023-24 kval saknas | Competition fixture-listan finns inte i preCache. |
| 2024-25 kval saknas | Dito. |
| 2024-25 Allsvenskan Nedre saknas | Sub-competition-nyckeln finns inte i preCache. |

---

## Köra scrapern

```bash
node scripts/scrape-allsvenskan.mjs
# → skriver docs/data/bandygrytan_kval.json och bandygrytan_allsvenskan.json

node scripts/scrape-detailed.mjs
# → skriver docs/data/bandygrytan_detailed.json (Elitserien)
```

Rate-limit: 150ms sleep mellan varje fixture-request (inbyggt i skriptet). Totaltid ~10-15 min per komplett körning.

---

## Hur scrapern hittades (historik)

Förra gången dokumenterades inte scrapern — vilket innebar att Firebase-strukturen, auth-metoden och competition-ID-formaten fick hittas om från grunden nästa session. Den viktigaste lärdomen:

- `getCompetitionsBySeason` listar tävlingsnamn men ger stale-status
- `getCompetitionFixtures` med kort `fx_`-nyckel fungerar (utan kombinerat suffix)
- Sub-competition-nycklar (med bindestreck + suffix) används bara när de är direkta preCache-nycklar, inte konstruerade kombinationer
- Gamla matchstatus "signed" + nya "ended" — båda måste accepteras
