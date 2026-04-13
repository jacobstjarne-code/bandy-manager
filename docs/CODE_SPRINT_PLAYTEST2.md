# CODE-INSTRUKTIONER — Sprint Playtest 2+3 (13 april 2026)

`npm run build && npm test` efter VARJE fix.

## Spec-filer (läs INNAN du börjar)

- `docs/FIXSPEC_PLAYTEST2.md` — 21 buggar + 1 balansändring (HUVUDDOKUMENT)
- `docs/FIXSPEC_COACHMARKS_REWRITE.md` — Coach marks OMSKRIVNING med exakt komponentkod
- `docs/FIXSPEC_NYA_FEATURES.md` — Arenanamn, klacknamn, straffar, kapten, hörn-SVG
- `docs/trainerArcService_patch.ts` — Roterande arc mood-texter
- `docs/mockups/onboarding_mockup.html` — Visuell referens

## Prioritering (se FIXSPEC_PLAYTEST2.md för detaljer)

### KRITISKT
1. BUG-1: showHalfTimeSummary i advance()-navigation
2. BUG-2: managedIsHome saknas → inga hörnor
3. BUG-13: Coach marks — SKRIV OM HELT, se FIXSPEC_COACHMARKS_REWRITE.md

### ALLVARLIGT
4. BUG-7: Kontraktsförnyelse fastnar
5. BUG-4: Mecenater spawnar aldrig
6. BUG-3: cupRun objective aldrig 'failed'
7. BUG-14: Corner taker = rusher
8. BUG-15: Veckans beslut "–journalist-rel" (råa variabelnamn)

### VISUELLT
9. BUG-8: NextMatchCard ojämn höjd + saknad coach
10. BUG-9: CornerInteraction SVG (ta bort SVG-knappar, bara HTML-knappar under)
11. BUG-10: Troféer lösa → flytta in i CareerStatsCard
12. BUG-11: Form-prickar .reverse() i PlayoffIntroScreen
13. BUG-20: DiamondDivider har flyttat — ska ligga direkt före CTA
14. BUG-21: Presskonferens "bästa matchen" vid omgång 2 — minRound-filter

### KOSMETISKT
15. BUG-12: Styrelsemöte dubbelcitat ordförande
16. BUG-16: Presskonferens "Neutral · Neutral" 
17. BUG-17: Presskonferens alla val har 😊
18. BUG-18: Kafferummet upprepar quote
19. BUG-19: ?-knapp koppar → ska vara dämpad (border/text-muted)

### UX + BALANS
20. BUG-6: paddingBottom på 7 skärmar
21. BUG-5: TransfersScreen flikar
22. BALANS-1: CS diminishing returns
23. trainerArcService patch (roterande quotes)

## KVALITETSGATES
- build+test efter VARJE steg
- grep-verifiera imports
- ALDRIG verifiera komponenter i isolation — läs parent screen FÖRST
- trace full renderflöde
