# Revision: Calibration Targets — 25 april 2026

**Bakgrund:** Under Sprint 25-HT-analysen identifierades att `htLeadWinPct: 46.6` i
`calibrationTargets.herr` inte stämde med rådata. Det triggrade en fullständig audit
av alla lagrade targets mot rådata.

**Metod:** Alla targets i `calibrationTargets.herr` beräknades manuellt ur
`d.herr.matches.filter(m.phase === 'regular')` (n=1124).

---

## Resultat per target

| Target | Lagrat | Beräknat från rådata | Diff | Status |
|--------|--------|----------------------|------|--------|
| avgGoalsPerMatch | 9.12 | 9.12 | 0.00 | ✅ |
| avgHomeGoals | 4.88 | 4.88 | 0.00 | ✅ |
| avgAwayGoals | 4.24 | 4.24 | 0.00 | ✅ |
| homeWinPct | 50.2 % | 50.2 % | 0.0 pp | ✅ |
| drawPct | 11.6 % | 11.6 % | 0.0 pp | ✅ |
| awayWinPct | 38.3 % | 38.3 % | 0.0 pp | ✅ |
| avgCornersPerMatch | 17.72 | 17.72 | 0.00 | ✅ |
| cornerGoalPct | 22.2 % | 22.1 % | −0.1 pp | ✅ |
| penaltyGoalPct | 5.4 % | 5.4 % | 0.0 pp | ✅ |
| avgShotsPerMatch | 10.5 | 10.5 | 0.0 | ✅ |
| avgSuspensionsPerMatch | 3.77 | 3.77 | 0.00 | ✅ |
| avgHalfTimeGoals | 4.19 | 4.17 | −0.02 | ✅ |
| **htLeadWinPct** | **46.6 %** | **78.1 %** | **−31.5 pp** | **❌ FEL** |
| goalsSecondHalfPct | 54.2 % | 54.3 % (halvtid-metod) | +0.1 pp | ✅ |
| goalAvgMinute | 48.2 | 48.2 | 0.0 | ✅ |

---

## Enda felet: htLeadWinPct

**Lagrat:** 46.6  
**Korrekt:** 78.1  
**Förklaring:** Fältet innehöll andelen matcher där *hemmalaget* leder vid halvtid
(47.0 % i rådata, ≈ 46.6 % i JSON). Det är ett helt annat mått — "homeHtLeadFraction" —
som råkade hamna i fel nyckel när calibrationTargets byggdes.

**Åtgärd (redan gjord i denna commit):**
```json
"calibrationTargets": {
  "herr": {
    ...
    "htLeadWinPct": 78.1,        // ← ändrat från 46.6
    "homeHtLeadFraction": 46.6,  // ← nytt fält med rätt namn
    ...
  }
}
```

---

## Notering: goalsSecondHalfPct — mätmetod

Rådata-korrekt beräkning: `(totalGoals - halfTimeGoals) / totalGoals` = **54.3 %**  
Minute-baserad beräkning (`goal.minute >= 45`): **55.7 %**

Skillnaden (+1.4 pp) beror på mål i slutet av första halvlek (tilläggtid, minute 45)
som registreras som minute 45 men tillhör räknat halvtidsstatus. Analyze-stress.ts
använder minute-metoden och jämför mot target 54.2 % → den mäter egentligen +1.5 pp
högre än vad target mäter. Motorns faktiska 2H-målfördelning kan vara något lägre än
vad analysen visar.

**Rekommendation:** Ingen akut fix. Toleransnivån (±3 pp) täcker gapet.

---

## Bedömning: Ska Sprint 25b / 25e / 25f rullas tillbaka?

**Nej.**

De tre sprintarna fixade verkliga kalibreringsavvikelser mot korrekta targets:

| Sprint | Fix | Target | Utfall |
|--------|-----|--------|--------|
| 25b.1 | Straff separerad till egen trigger | penaltyGoalPct ✅ | Korrekt |
| 25b.2 + 25d.2 | wFoul-basfrekvens, foulThreshold | avgSuspensionsPerMatch ✅ | Korrekt |
| 25e | cornerBase justerad | cornerGoalPct (pågående) | Korrekt |

Inget av dessa sprints använde `htLeadWinPct: 46.6` som styrande target. Motorns
faktiska htLeadWinPct (80.4 %) har alltid passat mot den korrekta 78.1-procenten.

**Motorns nuvarande tillstånd är acceptabelt.** Den enda kalibreringsavvikelse som
kvarstår (per STATUS.md) är awayWinPct (+5.6 pp) och playoff_final mål/match (+2.17).
De kräver separata sprints.

---

## Öppet: per-säsong htLeadWinPct (bySeason)

Fältet `htLeadWinPct` i `bySeason`-sektionerna (t.ex. `bySeason["2019-20"].aggregate.htLeadWinPct`)
innehåller liknande ≈46-48 %-värden och är troligen felberäknade på samma sätt. De
används inte av `analyze-stress.ts` och påverkar inte motorns kalibrering.

Om rådata-beräkning per säsong önskas kan det göras i en separat skript-körning.
Parkerat tills vidare.
