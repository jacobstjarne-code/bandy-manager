# AUDIT — Score-system coverage

**Datum:** 2026-05-23
**Audit-typ:** Systematisk genomgång av befintliga UI-ytor mot score-systemet (LED / Block / Sparkline)
**Pairas med:** `HANDOFF-SCORE-SYSTEM-2026-05-20.md`

## Sammanfattning

Score-system-handoffen listade 10 ytor. Denna audit har systematiskt skannat *alla* 50+ screens, scenes och components i `bandy-manager/src/presentation/`. Resultat: **27 ytor** har score-data, varav 10 redan listades. **17 nya identifierade** — flera där text idag bär det score-block borde bära.

| Status | Antal | Innebörd |
|---|---|---|
| 🟢 Redan i handoff | 10 | Migrationsplan finns |
| 🟠 Nya träffar | 17 | Bör adderas till migrationsplanen |
| ⚪ Score-data men passar bättre med text | 6 | Lämnas oförändrad |

---

## 🟠 NYA TRÄFFAR (utöver de 10 i handoffen)

| # | Yta | Fil | Idag | Föreslag |
|---|---|---|---|---|
| 1 | **GranskaOversikt match-hero** | `granska/GranskaOversikt.tsx:56` | `<span style="font-size: 36px">3</span> – <span>1</span>` inline | **ScoreBlock featured** (stor variant). Eller behåll inline om det är medvetet "hero-uppskruvad" textuell score. |
| 2 | **GranskaForlopp rivaler-listan** | `granska/GranskaForlopp.tsx:160` | `f.homeScore–f.awayScore` plain | **ScoreBlock compact** per match |
| 3 | **MatchResultScreen** | `MatchResultScreen.tsx` | Stor score inline | Antingen LED (om "nyss spelad live") eller Block featured. Behöver designval. |
| 4 | **QFSummaryScreen** | `QFSummaryScreen.tsx` | Per-match-resultat som text | **ScoreBlock-row** per serie-match |
| 5 | **SimSummaryScreen** | `SimSummaryScreen.tsx` | Andra lags resultat text | **ScoreBlock compact** per match |
| 6 | **HalfTimeSummaryScreen** | `HalfTimeSummaryScreen.tsx` | Andra matchers halvtid som text | **ScoreBlock compact** med "HT"-label |
| 7 | **HistoryScreen** | `HistoryScreen.tsx` | Historik-resultat som text-rader | **ScoreBlock compact** + ev. Sparkline över säsong |
| 8 | **PlayoffIntroScreen serie-status** | `PlayoffIntroScreen.tsx` | Serie 1-0 etc. som text | Serie-tracker (befintlig komponent funkar) + ScoreBlock per gjord match |
| 9 | **ChampionScreen** | `ChampionScreen.tsx` | Final-score text | ScoreBlock gold variant (final-result) |
| 10 | **CupFinalVictoryScene** | `scenes/CupFinalVictoryScene.tsx` | Score inline i scene-text | ScoreBlock gold |
| 11 | **SMFinalVictoryScene** | `scenes/SMFinalVictoryScene.tsx` | Samma som ovan | ScoreBlock gold |
| 12 | **TabellScreen** | `TabellScreen.tsx` | Plats/poäng som tabular text | Behåll tabular + addera **mini-Sparkline** för senaste 5 i samma rad |
| 13 | **SquadScreen player-rows** | `SquadScreen.tsx` | Form via emoji-string | **Mini-Sparkline** över senaste matcher per spelare |
| 14 | **R1 Decision-fatigue fatigue-meter** | (denna sessions mock) | Egen bar | **Sparkline** över senaste N omgångars pressure |
| 15 | **EkonomiTab budget-history** | `club/EkonomiTab.tsx` | Saknas idag | **Sparkline** över kassa/intäkter — nytt feature |
| 16 | **JournalistRelationshipScene** | `scenes/JournalistRelationshipScene.tsx` | Memory-list, ingen trend | **Sparkline** över relation över N omgångar |
| 17 | **BoardMeetingScene resultat-sammanfattning** | `scenes/BoardMeetingScene.tsx` | Säsong-form text | **Sparkline** över säsongsplacering (=samma som formkurva) |

---

## ⚪ SCORE-DATA SOM LÄMNAS OFÖRÄNDRAD

Vissa ytor *har* score men passar bättre med text — score är inte huvudfokus utan stödinformation:

| Yta | Varför |
|---|---|
| `MatchLiveScreen` selvald-score-fönster (under match) | Redan LED via Stalvallen-systemet. Inte vår territorium. |
| `formUtils.ts`-baserade form-sträng-helpers | Backend-output. Renderingen är dock yta för migrering. |
| `seasonShareImage.ts` canvas | Generated image, ej DOM. Eget rendering-system. |
| `useCupFinalData` / `useSMFinalData` hooks | Backend, inte yta. |
| Score-mention i atmospheric scene-copy (kafferum etc.) | Diegetisk text. Score är en del av berättelsen, inte siffran själv. |
| Match-handlers home/awayScoreFlash | LED-territorium. |

---

## 🔴 RISKER UPPTÄCKTA UNDER AUDIT

### R.1 · Inkonsekvens i hur final-resultat renderas

`GranskaOversikt`, `MatchResultScreen`, `ChampionScreen`, `CupFinalVictoryScene`, `SMFinalVictoryScene` — alla visar samma typ av data (matchresultat) men på fem olika sätt. Inga delade primitiver.

**Risk:** När vi inför `ScoreBlock` kommer dessa fortsätta divergera om vi inte migrerar dem *tillsammans*. Föreslag: lägg till **"victory scenes"** som en egen prioritetsgrupp i migrationsplanen, migrera alla 5 i en sprint.

### R.2 · `homeScore/awayScore`-renderingar är 60+ ställen

Grep mot `homeScore|awayScore` ger 200+ träffar varav ~60 är rendering (resten är beräkning). Migrering tar längre tid än 13h som listades i handoffen. **Realistisk estimat: 20-25h spridda** för full migrering. Inkrementellt kan vi börja med 5 högvärdesytor i första vågen.

### R.3 · Mini-Sparkline i SquadScreen player-rows = density-risk

Squad-listan har 22 spelare. Mini-sparkline per spelare = 22 SVG på en skärm. På low-end Android kan det bli laggigt. **Föreslag:** rendera bara sparkline på *expanded* player-row, inte i listvy.

---

## REVIDERAD MIGRATIONSPLAN

Tre vågor istället för en kontinuerlig 10-yta-lista:

### Våg 1 · Quick wins (~3h)
- RoundSummary "andra matcher" (redan i plan)
- OpponentFormSecondary (redan i plan)
- WatchOthersSecondary (redan i plan)
- GranskaForlopp rivaler-listan **NY**
- SimSummaryScreen **NY**

### Våg 2 · Victory & milestone scenes (~4h, samlat)
- ChampionScreen **NY**
- CupFinalVictoryScene **NY**
- SMFinalVictoryScene **NY**
- MatchResultScreen **NY** (kräver designval LED vs Block)
- GranskaOversikt hero **NY** (kräver designval)

### Våg 3 · Trend-data (~6-8h, kräver data-pipeline)
- FormStatusMinimal → Mini-Sparkline (redan i plan)
- PlayerCard form-graph → Sparkline (redan i plan)
- EkonomiTab kassa-trend → Sparkline + data-pipeline (redan i plan)
- JournalistSecondary → Mini-Sparkline (redan i plan)
- AcademyTab CA-progression → Sparkline (redan i plan)
- TabellScreen senaste 5-Sparkline per rad **NY**
- R1 fatigue-meter → Sparkline över pressure **NY**
- BoardMeetingScene säsong-sparkline **NY**

### Våg 4 · Featured-content (~3h)
- Klubbminne (separat handoff §G)
- HistoryScreen historik **NY**
- SeasonSummaryScreen hero-trend (redan i plan)

**Total reviderad estimat:** ~18-22h spridda. Inkrementellt över 4-5 veckor.

---

## DESIGN-DECISIONS som behöver kompletteras

Förutom de 4 från handoffen:

5. **Final-result-rendering**: SM-Final/Cup-Final/Champion får alla **ScoreBlock gold**-variant. Spara magin men håll konsekvent.
6. **Live → Retrospekt-övergång**: När matchen är klar och spelaren landar i MatchResult/Granska, byter visningen från LED till Block. Klar regel, inga övergångar inom samma vy.
7. **Mini-sparkline density**: Max 12 mini-sparkliner per skärm. Annars rendera först vid expansion/scroll.

---

— Design-Claude, 2026-05-23
