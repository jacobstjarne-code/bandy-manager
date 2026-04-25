# 001 — Halvtidsledning vs verkligt utfall

**Datum:** 2026-04-25 (utkast)
**Status:** Väntar på data från Sprint 25-HT-analys

---

## FRÅGAN

Hur ofta vinner ett bandylag som leder vid halvtid? Är det 60%? 80%?
Spelar matchställningen vid paus större roll i bandy än i fotboll
(där ungefär 80% av halvtidsledningar håller)?

---

## DATAN

Två källor:

1. **Bandygrytan 2024-26** — 420 matcher i Elitserien. Innehåller
   `htHomeScore`, `htAwayScore` per match plus slutresultat. Möjligt
   att räkna ut hur ofta halvtidsledning leder till seger.

2. **Bandy Manager-motorn** — 10 seeds × 200 matcher. Producerar 77%
   `htLeadWinPct` med nuvarande parametrar (efter Sprint 25f).

---

## VAD VI HITTILLS VET

| Källa | htLeadWinPct |
|-------|--------------|
| Bandy Manager-motor (Sprint 25f) | 77% |
| Sprint 25e (innan kalibrering) | 82% |
| Sprint 25 target (Bandygrytan) | 60-70% |
| Fotbolls-EM/AL referens | ~80% |

**Viktigt:** Target 60-70% kommer från bandy-domänkunskap, inte direkt
från Bandygrytan-extraktion. Code's pågående 25-HT-analys ska räkna
det exakta värdet.

---

## TOLKNING (preliminär — uppdateras när data finns)

Om Bandygrytan visar ~65% och motorn visar 77%, är skillnaden ~12
procentenheter. Det är stort. Möjliga förklaringar:

1. **Bandy är mer comeback-vänligt än fotboll.** 2×45 minuter med fri
   substitution och ingen offside (i den klassiska meningen) ger fler
   skapade lägen i andra halvlek. Trötthet bryter ledare snabbare.

2. **Comebacks underskattas i diskussionen.** Folk minns dramatiska
   matcher men tror att halvtidsledning är "över". Datan kan visa det
   motsatta.

3. **Hörnan som offensivt vapen är comeback-friendly.** Med 23% av mål
   från hörnor, har chasande lag fortfarande tillgång till en hög-värde-
   källa även när de jagar.

Alla tre kan vara sanna samtidigt och det förklarar varför motorn
överskattar ledare.

---

## BEGRÄNSNINGAR

- 420 matcher i Bandygrytan-datan är inte hela sanningen — ligan har
  spelats i 100+ år.
- Datan är från Elitserien specifikt — inte all bandy.
- Halvtidsledningens *storlek* spelar säkert roll. 1-0 vid halvtid är
  inte 4-0 vid halvtid. Initial undersökning bör splitta på det.
- Hemma- vs bortaledning är troligen olika — också värt att splitta.
- Motorn är ett *modell* av bandy. Skillnaden mellan motor och
  Bandygrytan kan vara att motorn fångar något verkligheten inte gör,
  eller tvärtom.

---

## VIDARE FRÅGOR

Om datan visar att htLeadWinPct är ~65% i verkligt bandy:

- Hur ser det ut för 1-0 vs 2-0 vs 3+-0 vid halvtid?
- Skiljer det sig hemma/borta?
- Korrelerar comeback med specifika minuter (t.ex. tidiga andra-halvlek-
  mål)?
- Finns det säsongsmässig variation? Nov-jan vs feb-mar?

Dessa kan bli egna findings.

---

## STATUS

Utkast. Detta find skrivs klart när Code's Sprint 25-HT-analys
levererar de exakta siffrorna från Bandygrytan-extraktionen. Då kan
"Vad vi fann" och "Tolkning" konkretiseras med riktig data.
