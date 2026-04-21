# Analys: Elitseriekval Herr

**Källa:** `bandygrytan_kval.json`
**Säsonger:** 2019-20, 2020-21, 2021-22, 2022-23 (4 säsonger, 38 matcher)
**Saknas:** 2023-24 och 2024-25 (Firebase preCache-väg ej tillgänglig)
**Referens:** `ANALYS_SLUTSPEL.md` (Elitserien reguljär), `ANALYS_MATCHMONSTER.md`

---

## Format

Kval spelas som miniserie (4 lag, round-robin) under cirka två veckor i slutet av februari/mars. Fyra lag möts: de två sämsta i Elitserien + de två bästa i Allsvenskan. Bäst i kval stannar/klättrar till Elitserien.

2020-21 spelades bara 2 matcher (COVID-avbrott — 3 av 4 lag hopade ihop inget kval genomfördes fullt ut).

---

## Nyckeltal (38 matcher, 2019-23)

| Mått | Kval | Elitserien (ref) | Allsvenskan (ref) |
|---|---|---|---|
| Mål/match | **8.66** | 9.12 | 9.16 |
| Hemmaseger% | **36.8%** | 50.2% | 51.2% |
| Oavgjort% | **26.3%** | 11.6% | 12.6% |
| Bortaseger% | **36.8%** | 38.3% | 36.2% |
| Mål/halvtid | **4.11** | 4.19 | 4.21 |
| Halvtidsledare vinner% | **70.4%** | 78.1% | 79.9% |
| Comeback -1% | **8.3%** | 24.5% | 20.0% |
| 2:a halvlek % | **52.9%** | 54.2% | 54.3% |
| Utvisningar/match | **4.45** | 3.77 | 4.60 |

---

## Tolkning

**Lägre målsnitt än seriebandy.** 8.66 mål/match mot 9.12 (Elitserien) och 9.16 (Allsvenskan). Kvalspel är tätare och mer nervöst — lagen spelar försiktigare när allt hänger på.

**Ovanligt hög oavgjortfrekvens.** 26.3% oavgjort mot 11-12% i serierna. Kval-format pressar lagen att ibland acceptera poäng och spela på resultat, inte öppet anfall. Dessutom spelar lagen mot varandra 2 gånger (hem + borta) vilket ger taktisk anpassning.

**Extremt låg comeback-frekvens.** 8.3% comeback vid -1 i halvtid jämfört med 24.5% i Elitserien. Det nervösa spelet gör att halvtidsledning håller extremt väl — laget som leder håller ihop ordentligt.

**Ingen tydlig hemmafördel.** 36.8% hemmaseger = sämre än genomsnittet i both divisions. Möjlig förklaring: lag kände varandra väl (spelar mot varandra två gånger per serie), matchvana utjämnar.

**Lätt förhöjda utvisningar.** 4.45/match ligger mellan Allsvenskan (4.60) och Elitserien (3.77). Nervositeten ger fler fouls, men inte lika hög frekvens som Allsvenskan-nivå.

---

## Kval-resultat (IK Sirius relevant — Nässjö-kontext)

### 2019-20 kval (12 matcher)
Lag: IK Sirius, Frillesås BK, Lidköpings AIK, Falu BS Bandy.
IK Sirius: 4-4 Lidköpings, 3-6 Frillesås, 4-4 Frillesås, 1-5 Falu, 9-0 Lidköpings → stannade i Elitserien.

### 2020-21 kval (2 matcher — COVID)
Gripen BK 4-4 IFK Rättvik, IFK Rättvik 3-3 Gripen. Avbruten serie.

### 2021-22 kval (12 matcher)
Lag: Åby/Tjureda IF, Frillesås BK, Lidköpings AIK, Bollnäs GIF.
Bollnäs GIF klättrade till Elitserien, Lidköpings åkte ur.

### 2022-23 kval (12 matcher)
Lag: IFK Kungälv, GripenTrollhättan BK, Åby/Tjureda IF, Frillesås BK.
Gripen klättrade, Åby/Tjureda åkte ur.

---

## Implikationer för Nässjö IF

Nässjö IF befinner sig på Allsvenskan-nivå och siktar på Elitserien. Kval-data visar att nivåskillnaden Elitserien ↔ Allsvenskan är liten i mål/match men stor i spelstil:

- Kval-matcher spelas tätare, med färre öppna lägen
- Hemmafördel nästan obefintlig — alla lag är vana vid press
- Halvtidsledning är avgörande: den som leder i HT vinner i 70.4% av fallen (lägre än seriebandy men fortfarande starkt)
- Comebacks är extremt sällsynta i kval — leder man vid paus, behåller man kontrollen

---

## Datavarning

`cornerGoal%` utelämnad från tabellen ovan. Mitt parsing-skript klassificerar mål som hörnmål om ett hörnevent inträffade ≤2 minuter innan — detta ger ~47% hörnmål vilket är klart för högt (Elitserien-referens: 22%). Metodiken fungerar inte för Allsvenskan/kval-data. Övriga nyckeltal (mål, hemmaseger, halvtid, utvisningar) är tillförlitliga.
