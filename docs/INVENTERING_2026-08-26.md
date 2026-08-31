# ⛔ ERSATT AV `INVENTERING_2026-08-31.md` — BYGG INTE PÅ DENNA

Fem dagars arbete (HIGH 5-12, MEDIUM 13-16, anspråk 4/väg C, väg B-ommätning
m.m.) har landat sedan denna skrevs. Ett sex-agents källsvep 2026-08-31
verifierade varje rad i den här filen mot faktisk kod: av 7 "BLOCKERAR
AUDITEN"-poster var 5 redan byggda, alla 13 påstående-sweep-poster stängda,
och "åskådarekonomin" (påstådd obyggd här) visade sig redan levererad
2026-08-27. Läs `INVENTERING_2026-08-31.md` istället.

---

# INVENTERING 2026-08-26 — läst ur källorna, inte ur minnet (HISTORISK)

**Av:** Opus. Ersätter `INVENTERING_2026-08-25.md`, som skrevs ur konversationsminnet och missade minst en post (åskådarekonomin) som stod i en order jag själv skrivit.

**Läst:** `KVAR.md` (dödmarkerad, ägs av `BACKLOG`), auditsviten `5c9a7a8` M1–M13 + L1–L4, `pastaende_sweep_2026-08-24/MASTER.md`, `BACKLOG.md`.

**Regel:** varje post har ägare och nästa steg. Ingen rad slutar i "senare".

---

## 1 · BLOCKERAR AUDITEN

| Post | Ägare | Nästa steg |
|---|---|---|
| `EkonomiTab` visar "Godkänd" grönt medan spelaren är ett år från avsked — läser `licenseReview`, aldrig `checkLicenseStatus` | Code | Fixa först av allt i licensspåret |
| Licensvarningen generisk — nämner ingen räddande handling | Code | Bygg efter `EkonomiTab` |
| `licenseReview`-kaskaden — tre spelare, −15 rykte, 60 % av sponsorerna vid −200 tkr, triggar sig själv | Code | Ersätt med kontinuerlig konsekvens. Spelare tas aldrig av systemet |
| Licensräknarens minneslöshet — en positiv säsong nollställer allt | Code | Ackumulator, magnituder föreslås |
| **Åskådarekonomin** — beslutad 25 aug, aldrig byggd. Vi ändrade vem som kommer, inte vad de ger | Code | Rapportera: finns kiosk/lotteri/loppis/medlemsavgift som poster, eller bara en biljettsumma? |
| Avstängningsmekaniken — specad, obyggd, `SUSPENSION_INCIDENT_MULTI_LINES` död sedan 25 maj | Code | Bygg enligt spec |
| `H5` renommé klampar vid 100, taket nås säsong 5–6 | Code | Rapportera vad som händer efter taket |

---

## 2 · AUDITSVITENS MEDIUM — status läst ur PDF:en

| # | Post | Läge |
|---|---|---|
| M1 | Onboarding återupptas inte i exakt avbruten fas | **EJ** |
| M2 | Två flikar skriver tyst över varandra | **EJ** — `saveRevision`/compare-and-swap saknas |
| M3 | Juniorlandslaget uppdaterar alla ungdomar >50 potential, inte de utvalda | **EJ** |
| M4 | Dialoger utan `role="dialog"`, fokusfälla eller Escape | **EJ** — gemensam Modal/Sheet-primitiv saknas |
| M5 | 8–10 px text, 24 px headerkontroller, kontrast 2,0–3,5 | **DELVIS** — `tapTargetGate` och kontrastgrinden finns men täcker inte allt |
| M6 | 2,21 MB JS / 4,28 MB precache, ingen routesplit | **EJ** = `U8` |
| M7 | Kall återkomst utan sammanhang, 32 inboxnotiser i långsave | **EJ** |
| M8 | Historik visar migrerade falska narrativ som sanning | **EJ** |
| M9 | Stressharnesset grönt och falskt | **KLAR** |
| M10 | 600 ms-racet — rotorsaken fortfarande öppen | **EJ** |
| M11 | Inget jobb efter avsked | Jacobs beslut (`O13`) |
| M12 | Delning för sällsynt, ingen jämförelseloop | **EJ** — hör ihop med `O10` |
| M13 | 12 lag/22 omgångar mot verklighetens 14/26 | Jacobs beslut |

**L1** taktikrekommendationen för subtil (delvis löst av `O15`) · **L2 kassörens replik låter som tutorial-copy — min text, mitt fel** · **L3** scoutinglistan lång på mobil · **L4** `DecisionCards` likriktning (delvis `D1`)

---

## 3 · PÅSTÅENDESVEPET — 13 av 25 kvar

Byggda: #2, 6, 7, 8, 10, 12, 14, 15, 17, 19, 22, 23.

| # | Kvar | Ägare |
|---|---|---|
| 1 | `HalftimeModal` "förra året" i säsong 1 | Opus, skriv om |
| 3, 5 | `allTimeRecords` och `narrativeSummary` — ej fullt spårade | Code, verifiera |
| 4 | `verdictText` mot portalens `boardPatience` — möjlig sammanblandning | Opus, döm |
| 9, 11 | `arcService` — villkor re-verifieras aldrig mellan trigger och avfyrning | **BYGGD** enligt Codes rapport, verifiera |
| 13 | `generateSeasonVerdict` läser position, aldrig `boardPatience` | Code |
| 16 | `rivalTenureLine` — låst Jacob-text utan underlag | Opus, skriv om |
| 18 | `matchMoodService` — noll produktionsanrop | Code, wira eller dödmarkera |
| 20 | `generateSemiFinalEvent` "första gången" utan historikkoll | Code |
| 21 | `summarizeSignature` ogated fallback | Code |
| 24 | `getSituation` — svitfönster satt före strecket räknas | Code |
| 25 | Ismaskinens "tre vintrar" | Opus, skriv om |

Plus: `trainerArcService` sorterar på `roundNumber` — fungerar av en schemakoincidens, men är den förbjudna genvägen. Och tre owired-men-korrekta funktioner: wira eller dödmarkera, radera inte.

---

## 4 · BACKLOG — öppna rader

| Post | Ägare | Nästa steg |
|---|---|---|
| `wageBudget` räknas aldrig om, spärrar ändå kontraktsbeslut | Code | Rapportera vad den gatar |
| `Club.fanExpectation` — noll skrivställen | Code | Radera eller wira |
| Sex okontrollerade `*Round`-fält | Code | Kontrollera skalan |
| `generateAttributes` mot `generateYouthAttributes` — akademispelare startar ~30 % under klubbens egen seniornivå | Jacob | Hinner utvecklingskurvan kompensera? Kräver flersäsongssim |
| `C-O1SP1` kontextuella sponsorer som rival | Code | Bygg när sponsorkoden ändå rörs |
| Förutsättningsfasen steg 2 — ligarörelserna | Code | Blockerad tills `aiTransferLog` + standings-trend finns. Den ordern är given |
| Kvittensraden i förutsättningsfasen | Opus | Skriv texten |

---

## 5 · OBYGGDA DOMAR

`O1` kandidat 3–6 · `O10` tillväxtslingan (`worldSeed` väntar fortfarande på sin första konsument) · `U9` telemetri (behövs för `O2`:s val-entropi) · `mostImproved` (Opus skriver om raden)

---

## 6 · JACOBS BESLUT

**Auditen före eller efter licensfixen?** Körs den före rapporteras `H4` igen.
**M13** formatet · **M11/O13** jobb efter avsked · **Illustrationerna** — tre bilder klara men aldrig lagda i `public/assets/`, och `cup`/`premiar` visar fortfarande "illustration på väg" i produktion.

---

**Om något saknas här är det för att det är stängt — eller för att jag missat det. Det senare har hänt fem gånger den här veckan, och det är därför den här filen är läst fram och inte skriven ur minnet.**
