# SPRINT 22.14 — Taktiktavlan

**Datum:** 2026-04-20
**Trigger:** Playtest-feedback. "Här kommer svart in från ingenstans? Ganska svårt att förstå taktikvyerna all in all."
**Kontext:** Sprint 22.13 fixade en palette-drift (ChemistryView-legenden). Playtest visade att problemet är bredare — hela taktiktavlan har samma drift plus oförklarade val.

---

## IDENTIFIERADE PROBLEM

### 1. Palette-drift i FormationView och NotesView

Samma typ som ChemistryView i 22.13. Legacy från när taktiktavlan var mörk overlay, missades när den blev inline-card.

**FormationView.tsx** (bänk-kort):
- `var(--bg-dark-surface)` — bakgrund
- `var(--text-light)` — spelarnamn
- `var(--text-light-secondary)` — CA-siffra

**NotesView.tsx** (coach-intro + spelar-anteckningar):
- `var(--text-light)` — coach-quote, spelarnamn (2 ställen)
- `var(--text-light-secondary)` — spelar-quote

### 2. Formationsknapparna är bara siffror

Sex alternativ — `5-3-2`, `3-3-4`, `4-3-3`, `3-4-3`, `2-3-2-3`, `4-2-4` — utan förklaring. Vad de betyder, vad som är bra mot vad, varför man skulle välja det ena över det andra — helt osynligt.

### 3. Inga konsekvens-taggar

DESIGN_SYSTEM.md §6 specificerar konsekvens-taggar under taktikval ("+10% försvar", "-15% skottchanser"). Inget finns i FormationView. Formation-byte är en blackbox-händelse.

### 4. Taktiktavlan äger inte alla taktik-inställningar

`Tactic`-typen har 8 fält: `formation`, `mentality`, `tempo`, `press`, `passingRisk`, `width`, `attackingFocus`, `cornerStrategy`, `penaltyKillStyle`. Taktiktavlan exponerar 1 (formation). De andra sätts i MatchScreen/LineupStep. En "taktiktavla" som bara är formation + kemi + notes är inte riktigt en taktiktavla — det är en formations-tavla med bonus-flikar.

---

## DEL A — PALETTE-FIX (KLAR ATT KÖRA)

Kirurgisk, samma typ som 22.13.

**FormationView.tsx**:
- `var(--bg-dark-surface)` → `var(--bg-elevated)`
- `var(--text-light)` → `var(--text-primary)`
- `var(--text-light-secondary)` → `var(--text-secondary)`

**NotesView.tsx**:
- `var(--text-light)` → `var(--text-primary)` (coach-quote + spelarnamn)
- `var(--text-light-secondary)` → `var(--text-secondary)` (spelar-quote)

Opus kan fixa direkt via workspace:edit_file. Ca 15 minuter inkl. verifiering.

**Rot:** Samma som 22.13 — dark-palette-variabler lämnades kvar när komponenterna migrerades från overlay-design. Hela taktiktavlan drabbad.

**Bredare grep efter drift:** Kör `grep -rn "bg-dark-surface\|text-light\|text-light-secondary" src/ --include="*.tsx"` för att se om fler komponenter har samma problem. Troligt att några coach-marks, overlays eller lineup-komponenter också drabbade.

---

## DEL B — UX-OMARBETNING (KRÄVER DIN INPUT)

Fyra frågor. Välj för varje, så spec:ar jag implementation och skickar till Code.

### B1. Formation-förklaringar

"5-3-2" betyder inget för spelaren.

- **(a)** Tooltip på klick: "5 backar + 3 halvor + 2 forwards. Defensivt."
- **(b)** Permanent undertext under varje knapp: "Defensiv" / "Balanserad" / "Offensiv"
- **(c)** Rekommenderad formation framhävd ("Mest använd i ligan" / "Coach rekommenderar")

**Mitt förslag:** (b). Lågrisk, alltid synligt, tar lite plats. (a) kräver interaktion för att se info. (c) kräver extra logik + risk för "cargo cult"-beteende.

### B2. Konsekvens-taggar

Formation-byte händer utan synlig effekt.

- **(a)** Mini-tags under formation-knappraden: `+15% bollkontroll · -10% försvar`
- **(b)** Coach-quote som uppdateras vid byte: "Med 4-3-3 blir vi mer offensiva men öppna bakåt."
- **(c)** Både och

**Mitt förslag:** (b). Matchar bandy-Sverige-ton bättre — någon som pratar, inte siffror. Återanvänder assistenttränar-karaktären. Siffror i (a) är osanna — konsekvenserna är stokastiska, inte "+15%".

### B3. Taktiktavlans scope

`Tactic` har 8 inställningar, taktiktavlan exponerar 1.

- **(a)** Expandera taktiktavlan att äga ALLA taktik-inställningar (flytta från MatchScreen/LineupStep)
- **(b)** Behåll scope, gör explicit: "Matchtaktik (mentalitet, tempo, press) sätts i Lineup-steget"
- **(c)** Lägg till kort översikt överst med länk: "Mentalitet: Balanserad · Tempo: Normal · Press: Medel → ändras i nästa match"

**Mitt förslag:** (c). Synlighet utan att bryta befintligt flöde. Kräver ingen stor refactor. (a) är en vecka Code-arbete.

### B4. Kemi-vyn ger ingen handling

Kemi visar vad som ÄR men föreslår inte vad man ska GÖRA. "Andersson × Berg = svag koppling" — och sen? Flytta isär? Träna ihop? Oklart.

- **(a)** Lägg till "Förslag"-rad under topp-paren: "Stark: sätt i samma sida. Svag: undvik pass mellan."
- **(b)** Gör kemin interaktiv — klicka på ett par → föreslagen formation-justering
- **(c)** Låt bli. Kemi är information, inte beslut.

**Mitt förslag:** (a). Lågrisk, hög-upplysning. (b) är stor refactor. (c) är status quo och därmed inte en fix.

---

## ORDNING

1. **Nu:** Kör Del A (palette). Kirurgisk, gör appen visuellt konsekvent.
2. **Ditt svar:** B1–B4, en bokstav per fråga. Eller "skjut upp allt — del A räcker tills vidare".
3. **När svar finns:** Jag spec:ar Del B som SPRINT_23_TAKTIK_UX_PART2.md och skickar till Code.

---

## ÖPPNA FRÅGOR (även om B1–B4 skjuts upp)

- Finns fler komponenter med palette-drift? Bör kollas med grep innan vi säger att det är klart.
- Ska fliken "ANTECKNINGAR" vara alltid-synlig eller endast när det finns notes? Nu visas den alltid, även med "Inga särskilda anteckningar just nu".
- Formation-valet påverkar nästa match — bör det finnas "spara som standard"-knapp eller är det automatiskt? (Läs `autoAssignFormation` i Formation-entiteten innan vi ändrar något här.)
