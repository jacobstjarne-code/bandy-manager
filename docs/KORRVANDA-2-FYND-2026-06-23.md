# KORRVÄNDA 2 — fynd 2026-06-23

**Källa:** Jacobs genomspelning (intro → portal → Orten → Värvning → Bygget) + 5 skärmar.
**Av:** Fable / Design · **Status:** dokumentation. Kategori + ägare per rad så inget tappas. Mock-kandidater flaggade men ej byggda (kvothänsyn — säg till vilka du vill se som yta).

Skala: 🟢 ren Code-order · 🟡 design/innehåll · 🔵 design-mock värd en yta · ❔ verifiera först

---

## A · Intro / Ankomsten (skärm 1)

| # | Fynd | Kat | Beslut | Ägare |
|---|---|---|---|---|
| A1 | Intro ser bra ut men blir **lite för mörk när den landar** (sluttillståndet/vignetten för tung) | 🟡 | Lätta sluttillståndets overlay-opacity ett snäpp — behåll stämningen, lyft läsbarheten | Design→Code |
| A2 | Styrelsekorten får **klickhand (cursor:pointer) i introt** men går inte att klicka (rätt att de inte ska) | 🟢 | Ta bort pointer-cursor + hover-affordans när kortet renderas i intro-kontext | Code |
| A3 | Samma kort-komponent återanvänds på portal där de **är** klickbara → Orten. Korrekt. Intro = ingen destination, korrekt. | ✓ | Inget — bekräftar bara att A2 är en kontextflagga, inte att kortet ska bli oklickbart överallt | — |

## B · Portal → Orten (skärm 2)

| # | Fynd | Kat | Beslut | Ägare |
|---|---|---|---|---|
| B1 | Klick på styrelsekort på portal → **Orten, ser bra ut** | ✓ | — | — |
| B2 | **Topppill-navet scrollar fortfarande** (TRÄNING·EKONOMI·ORTEN·AKADEMI·MINNE… kapas i högerkant). Detta är Klubb-vyn — den kända scrollade-nav-frågan, ej åtgärdad. | 🔵 | Lös pill-nav-overflowen. Mock-kandidat — samma problem vi tidigare pekade ut i Klubb. | Design→Code |
| B3 | Intro-/hjälptexten på Orten **gäller ekonomi men visas på Orten** (fel innehåll på fel flik) | 🟡 | Del av C-normaliseringen nedan — rätt text på rätt flik | Design/innehåll |

## C · Värvning + tvärgående intro-texter (skärm — Värvning)

| # | Fynd | Kat | Beslut | Ägare |
|---|---|---|---|---|
| C1 | Värvning: **är knapparna rätt?** De är **märkligt radbrutna** (text wrap mitt i knapp, jfr "Uppgradera till Satsning (50\\ntkr)", "Välj mottagarklubb") | 🟡 | Knapp-min-bredd/`white-space`/kortare etiketter så de inte bryter illa | Design→Code |
| C2 | Värvning har en **liten konstig intro-text** | 🟡 | Del av normaliseringen | Design/innehåll |
| C3 | **Övergripande:** intro-texterna på **samtliga flikar bör normaliseras utseendemässigt** OCH innehållet styras upp så **rätt text ligger på rätt flik** | 🔵 | Mock-kandidat: en enhetlig intro-text-komponent (samma typografi/placering/ton) + innehållsaudit per flik. Detta löser B3 + C2 i ett. | Design→Code |

## D · Toppnav "?" — Hur funkar det? (skärm 4)

| # | Fynd | Kat | Beslut | Ägare |
|---|---|---|---|---|
| D1 | I hjälp-modalen ligger **"Visa introduktionen igen"** kvar. Trodde vi fixade att den skulle **leda till intro-overlay på portal** — verifiera att den faktiskt gör det | 🟢❔ | Verifiera wiring: knappen ska trigga portal-intro-overlayn, inte vara död/dubblerad. Fixa om bruten. | Code |

## E · Bygget / Anläggningen (skärm 5)

| # | Fynd | Kat | Beslut | Ägare |
|---|---|---|---|---|
| E1 | Bygget är på plats men ser **lite påvert ut — behöver mer förklaring** | 🔵 | Mock-kandidat: lyft förklaringsgraden (vad gör en nod, vad betyder Möjlig/Prövning/Kräver-X, hur läses beroendeträdet) | Design |
| E2 | Ser **väldigt blekt/urtvättat ut** (låg kontrast, dämpade dashed-kort på beige) | 🔵 | Höj kontrast — kortram, text, dimensions-pilar. Ingår i E1-mocken. | Design→Code |
| E3 | Ska **"FÖRBERED" vara markerat** i fas-navet (FÖRBERED·SPELA·GRANSKA) när man går in på Bygget? | ❔ | Designfråga: Bygget hör till förberedelsefasen → ja, FÖRBERED bör vara aktiv. Bekräfta avsikt med Jacob/Opus. | Design |

## F · Godkänt vid genomgång
- Övriga flikar genomgångna — **ser bra ut** (Akademi skärm 3 explicit ok).
- Portal, Orten-innehåll, intro-flödet i stort: ok.

---

## Mock-kandidater (om du vill se ytor — säg vilka)
1. **🔵 Pill-nav-overflow i Klubb** (B2) — den enda strukturella; återkommande.
2. **🔵 Normaliserad intro-text-komponent + flik-innehållsaudit** (C3, löser B3+C2).
3. **🔵 Bygget: förklaring + kontrastlyft** (E1+E2).

## Rena Code-ordrar (ingen mock)
- A2 cursor i intro · D1 verifiera "Visa introduktionen igen"-wiring · C1 knapp-radbrytning (kan delas med design).

## Designbeslut att bekräfta
- A1 hur mycket overlayn ska lättas · E3 FÖRBERED-markering på Bygget.

---

## G · Värvning, underflikar (skärm 6–8: Scouting / Marknad / Sälj)

| # | Fynd | Kat | Beslut | Ägare |
|---|---|---|---|---|
| G1 | **Scouting** ser ok ut, men **dropdownsen är för stora i grad** och typografin känns **off storleksmässigt** → vyn blir **onödigt lång** | 🔵 | Strama åt skala: mindre dropdown-höjd, tightare radhöjd + typografi på spelarrader. Kandidat för en typografi-/densitets-pass över hela Värvning. | Design→Code |
| G2 | **Marknad** har **notis-punkt på pillen** och texten "stärk truppen", MEN visar "**Inga spelare tillgängliga på marknaden just nu**" — **man förstår inte hur man kommer vidare** | 🔵 | Två fel: (a) notis-doten lovar handling som inte finns → ta bort när tomt; (b) tomt-state måste vägleda ("Marknaden fylls på omg X" / "Scouta för att hitta spelare →" som väg vidare). | Design→Code |
| G3 | **Sälj och Scouting har olika typografi på spelarraderna** — bör vara **enhetligt, och Scouting-stilen är kanon** (Jacob tycker den är snyggast) | 🟡 | Normalisera spelarrad-typografin → **Scouting-radens stil = sanningskälla**. Sälj rättas till den. | Design→Code |

**Nytt mönster ur G:** Värvning behöver en **densitets-/typografinormalisering** över sina fyra underflikar (Marknad·Scouting·Fria·Sälj) — samma spelarrad-stil, samma skala, kortare vy. Slås ihop med C3 (intro-text-normalisering) till ett "Värvning städ"-pass. Mock-kandidat #4.

---

## H · Portal (Hem) + Orten-bugg + Trupp (skärm 9–10)

| # | Fynd | Kat | Beslut | Ägare |
|---|---|---|---|---|
| H0 | **Portal som första vy — inga synpunkter** | ✓ | — | — |
| H1 | Klack-citatet "**Jag frågade Elin…**" (Bergskurvan) leder till **Orten, men där finns inget som knyter ihop med citatet** — payoffen uteblir | 🟡 | Antingen länka citatet till klack-/Bergskurvan-detalj som faktiskt visar Elin/fanan, eller ytlägg klack-kontexten på Orten. Destinationen ska betala av citatet. | Design→Code |
| H2 | **BUGG · Orten:** "**Bjud in**" går att klicka **om och om igen → relation stiger oändligt** | 🟢 | Cap/debounce: en inbjudan per period (omg/säsong), eller diminishing returns + tak. Ren logikfix. | Code |
| H3 | **Trupp — svårt att förstå vad man ska göra.** Ex: "bygg" — **små knappar, oklart vad de togglar** | 🔵 | Tydliggör Trupp-aktionerna: större/klarare toggle-affordans + vad varje läge gör. Mock-kandidat. | Design |
| H4 | **Vad hände med diagrammet under "NU" i Trupp?** | ✓ LÖST | **Inte borta.** Diagrammet = sparkline i **SeasonArcCard** (Trupp/SquadScreen) med nu-linje, projektion, topp-zon. Lever. Problem: svårt att hitta (= Trupp-otydlighet H3), inte borttaget. | — |
| H5 | **Knapparna under Säsongsbågen är fel/otydliga.** Två grupper: (a) läges-ratten Bygg·Håll·Toppa·Vila visar bara etikett, **telegraferar inte effekt** — du måste klicka runt och gissa; (b) per-spelare-undantag **"H" / "V" / "↩"** = enbokstäver, förklaring **bara via `title`-tooltip som inte finns på touch** → odekodbart på mobil | 🔵 | (a) varje läge ska visa sin effekt (mini-rad/ikon), inte bara namn. (b) **skriv ut** "Håll" / "Vila" / "Följ truppen" — aldrig enbokstav bakom hover. Del av Trupp-mocken (H3). | Design→Code |

**H4 stänger** "NU"-frågan: diagrammet finns, det är upptäckbarheten + kontrollerna runt det (H3+H5) som är problemet — inte data/yta.

---

## Mock-kandidater (uppdaterad lista)
1. 🔵 Pill-nav-overflow i Klubb (B2)
2. 🔵 Normaliserad intro-text + flik-innehållsaudit (C3 → B3+C2)
3. 🔵 Bygget: förklaring + kontrastlyft (E1+E2)
4. 🔵 Värvning städ: enhetlig spelarrad + skala + tomt-states (G1+G2+G3)
5. 🔵 Trupp: tydligare aktioner/toggles (H3)

## Rena Code-ordrar / buggar
- A2 cursor i intro · D1 "Visa introduktionen igen"-wiring · C1 knapp-radbrytning · **H2 Bjud-in oändlig relation (bugg)** · H5b skriv ut H/V/↩-knapparna (touch-blockerare).
