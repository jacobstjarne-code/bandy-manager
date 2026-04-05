# Textgranskning: Playtest-fixspec 2 — Komplett
Datum: 2026-04-05
Granskare: Erik

Alla nya svenska texter från PLAYTEST-FIXSPEC 5 APRIL (spec 2).

---

## Instruktion till Erik

Fyll i "Eriks kommentar"-kolumnen med:
- ✅ (ok)
- ❌ {föreslagen ändring}
- ⚠️ {fråga/tveksamt}

---

## A. BUGGAR

### TabellScreen.tsx (A1+A2)

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 1 | "Säsongen har inte börjat" | |
| 2 | "I slutspelszonen" (plats 1-8) | |
| 3 | "Utanför slutspel" (plats 9-10) | |
| 4 | "I nedflyttningszonen" (plats 11-12) | |
| 5 | "Serieledare" (plats 1, matcher spelade) | |

---

## B. ONBOARDING

### NewGameScreen.tsx (B1 introtext)

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 6 | "Bandyn behöver folk som dig. Tränare som ställer sig på kalla rinkar i november, som håller ihop en trupp där hälften jobbar dagtid." | |

### NewGameScreen.tsx (B4 onboarding-shell)

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 7 | "BANDY MANAGER" (header-text) | |
| 8 | "BURY FEN" (footer-text) | |

### BoardMeetingScreen.tsx (B5 styrelsemål)

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 9 | "Styrelsen förväntar sig slutspel. Annat vore en besvikelse." (winLeague) | |
| 10 | "Styrelsen hoppas på övre halvan. Nedflyttning vore oacceptabelt." (challengeTop) | |
| 11 | "Styrelsen vill se framsteg. Håll oss kvar i serien." (midTable) | |
| 12 | "Styrelsen följer utvecklingen och utvärderar efter säsongen." (default) | |

---

## C. MATCHFLÖDE

### MatchHeader.tsx (C1 progressiv header)

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 13 | "⚠️ Tungt snöfall — kort passningsspel. Direktspel straffas hårt." | |
| 14 | "⚠️ Snö straffar bollkontroll. Säkra passningar rekommenderas." | |
| 15 | "⚠️ Dimma — spela centralt. Bredd fungerar dåligt i dålig sikt." | |
| 16 | "⚠️ Töväder — sänk tempot. Högt tempo ökar skaderisken." | |
| 17 | "❄️ Bitande kyla. Isen är hård och snabb." | |
| 18 | "Vi kör från start. Press, press, press." | |
| 19 | "Tålamod. Säkra bollar. Låt dem göra misstagen." | |
| 20 | "Vi vill ha bollen. Sök djupled." | |
| 21 | "Kompakt. Inga luckor. Vi slår till på kontringar." | |
| 22 | "Sprid spelet. Utnyttja ytorna." | |
| 23 | "Vi kör vår grej. Fokus och disciplin." | |

### OpponentAnalysisCard.tsx (C2)

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 24 | "📋 VAD VET VI?" (rubrik, ersätter "🔍 Matchanalys") | |
| 25 | "Fördjupa →" (knapptext, ersätter "Scouta →") | |

---

## D. TRUPPVY / PLANVY

### PitchLineupView.tsx (D5)

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 26 | "{X}/11 — saknas: VB, CH" (tomma positioner) | |
| 27 | "11/11 startande ✅" | |

---

## E. SPELARKORT

### PlayerCard.tsx (E1 bakgrund-sektion)

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 28 | "BAKGRUND" (sektionsrubrik) | |
| 29 | "🏟️ Fostrad i {klubb}" | |
| 30 | "📋 {jobbtitel} (flex {X}%)" | |
| 31 | "⭐ Heltidsproffs" | |
| 32 | "📅 Kontrakt t.o.m. {år}" | |
| 33 | "📖 {storyline-text}" (om spelaren har storyline) | |

---

## F. BANDYDOKTORN

### BandyDoktorScreen.tsx (F1 intro)

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 34 | "Bandydoktorn" (intro-rubrik) | |
| 35 | "Din personliga rådgivare. Ställ frågor om truppen, taktik, transfermarknaden, eller spelets mekanik." | |
| 36 | "{X} frågor kvar denna omgång." | |

### BandyDoktorScreen.tsx (F2 FAQ)

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 37 | "Scouting" — "Tre system, en budget (10/säsong). Talangspaning hittar nya spelare. Utvärdering ger attribut. Motståndaranalys inför match." | |
| 38 | "Väder" — "Snö straffar bollkontroll. Dimma försvårar bredd. Töväder ökar skaderisk. Kyla ger hård, snabb is." | |
| 39 | "Dubbelliv" — "De flesta spelare jobbar. Flexibilitet påverkar träning. Heltidsproffs kostar mer men tränar bättre." | |
| 40 | "Transfers" — "Marknaden visar tillgängliga spelare. Scouta först för att hitta fynd. Bud baseras på marknadsvärde." | |
| 41 | "Styrelsen" — "Styrelsen sätter säsongsmål. Resultat under förväntan sänker tålamodet. SM-guld ger legendstatus." | |
| 42 | "Träning" — "Välj typ och intensitet. Hård träning ger snabbare utveckling men högre skaderisk." | |

---

## Att tänka på vid granskning

- Stämmer bandyterminologin? (skridskoåkning, inte löpning; plan, inte rink)
- Låter tränarcitaten (C1) som en verklig bandytränare?
- Är vädervarningarna rimliga gameplay-tips?
- Är FAQ-texterna korrekta och begripliga?
- "rinkar" i B1 — borde det vara "planer"?

Returnera filen till Jacob.
