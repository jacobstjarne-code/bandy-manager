# CODE — NÄSTA SESSION

**Workflow:** Du arbetar genom 14 sprints mot public beta. Ett sprint i taget.

---

## SÅ HÄR FUNGERAR DET

1. Jacob pekar dig på en sprint (t.ex. `docs/sprints/SPRINT_01_STADNING.md`)
2. Du läser hela sprinten
3. Du läser upp varje ID:s originalbeskrivning i `docs/ATGARDSBANK.md` (slå upp på ID — `BUG-001`, `WEAK-015` osv)
4. Du implementerar punkterna i sprinten i uppgiven ordning
5. För varje ID: commit-meddelande innehåller ID-referensen
6. I slutrapporten: markera varje ID som `✅` / `⚠️` / `❌` + en mening om vad du gjorde (eller inte gjorde)

### Commit-exempel

```
BUG-001 + WEAK-001: trainer arc grind-exit + UI feedback

- Lade till auto-exit-logik i trainerArcService efter 3 raka vinster
- Ny komponent TrainerArcBanner.tsx visar aktuell fas
- DailyBriefing får grind-hint när fas = 'grind'
```

### Slutrapport-format (obligatoriskt)

I slutet av varje session, skriv:

```
Sprint XX slutrapport:

BUG-001: ✅ auto-exit implementerad efter 3 raka vinster, testad
WEAK-001: ✅ DailyBriefing får grind-text
DEV-005: ⚠️ delvis — grind-hint finns men CTA till åtgärd saknas (tog tid över budget)
DEV-003: ✅ arc exit genererar inbox-event
BUG-009: ❌ kunde inte reproducera, hoppas över till playtest
```

Jacob uppdaterar sen `ATGARDSBANK.md` manuellt med `✅`.

---

## VIKTIGA REGLER

### Verifiera i kontext, inte isolerat

När du "verifierar" att något fungerar:
- Läs parent-screen/parent-service FÖRST
- Trace hela render-flödet eller anropskedjan
- Aldrig skriv "✅ komponenten finns" — skriv "✅ komponenten renderas korrekt i X-skärmen"

För game logic: trace en hel flöde (t.ex. press conference från trigger → render → resolve), visa kod, inte bara slutsatser.

### Håll dig inom sprintens omfång

Om du hittar andra saker som verkar vara buggar när du arbetar:
- Skapa en anteckning i din slutrapport: `Hittade potentiellt nytt: BUG-FOUND-001 — beskriv kort`
- **Jobba INTE på dem i denna sprint** — de läggs till ATGARDSBANK.md av Jacob och kommer i en senare sprint

### Scope-glidning = problem

Om en punkt visar sig vara mycket större än sprinten anger:
- Implementera det minimala som funkar
- Markera `⚠️` i rapporten
- Förklara varför i en mening

---

## SPRINT-ORDNING

Rekommenderad ordning (se `SPRINT_INDEX.md`):

1. **SPRINT_01_STADNING** — städsession, lättvunnet momentum
2. **SPRINT_02_KALIBRERING** — Tre fixar, verifierade via calibrate.ts
3. **SPRINT_03_ARCS** — trainer arc + arc-system
4. **SPRINT_04_EKONOMI** — ekonomi + transfer-historia
5. **SPRINT_05_PRESSKONFERENS** — press + journalist + opponent manager (kan behöva 2 sessioner)
6. **SPRINT_06_KLACK_ORTEN** — klack + arenanamn + ortens röst
7. **SPRINT_07_SPELARLIV** — spelarkort 2.5 + kapten + nemesis + veteran (kan behöva 2-3 sessioner)
8. **SPRINT_08_MECENAT_KLUBBID** — klubb-ID normalisering + mecenat-åldrande
9. **SPRINT_09_VARLDEN** — bortamatch + ishall + årsrytm + skadelista
10. **SPRINT_10_SASONGSRYTM** — akademi + State of the Club + slutspel
11. **SPRINT_11_TAKTIK** — momentum-bar + scoutrekommendationer + truppledarskap
12. **SPRINT_12_DASHBOARD_ROSTEN** — dashboard-prioritet + röstenhet
13. **SPRINT_13_ARKITEKTUR** — teknisk skuld, kan skjutas till post-beta
14. **SPRINT_14_DROMMAR** — bonusfeatures, helt valbara

## MINIMUM VIABLE BETA

Om vi pressas mot beta snabbt: prioritera 01, 02, 03, 06, 07 (core), 09, 12 — resten kan vänta.

---

## NÄR ALLA SPRINTS ÄR KLARA

Jacob kör playtest (2-3 dagar). Buggar dokumenteras som nya IDs i ATGARDSBANK.md. En mini-sprint `SPRINT_15_BUGFIX_BETA` skapas från fynden. Sen släpps public beta till Erik + 5-10 bekanta.

---

## REFERENSDOKUMENT

- `docs/ATGARDSBANK.md` — master-bank med alla 76 punkter (originalen)
- `docs/sprints/SPRINT_INDEX.md` — sprintöversikt
- `docs/sprints/SPRINT_XX_*.md` — individuella sprintar
- `docs/mockups/*.html` — visuella referenser där relevant
- `docs/DESIGN_SYSTEM.md` — kopparstilen, färger, fonts
- `docs/PLAYTEST_CHECKLISTA.md` — post-sprint manual QA

---

## FRÅGA OM DU ÄR OSÄKER

Om sprinten säger "X ska hända" och du inte vet hur: sluta implementera, skriv en fråga till Jacob i slutet av sessionen. Gissa INTE.

Om du inte hittar en fil som sprinten refererar: lista faktiska filnamn i slutrapporten, fråga om mapping.
