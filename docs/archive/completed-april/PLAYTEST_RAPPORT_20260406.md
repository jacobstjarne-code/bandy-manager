# PLAYTEST-RAPPORT — 6 april 2026 (Jacobs genomspelning)

## Fixat av Opus direkt

| # | Bugg | Fix |
|---|------|-----|
| ✅ | Bygdens puls-klick → ekonomi-tabben | Ändrat till `/game/club?tab=orten` |
| ✅ | Youth-nudge "A-laget" → träning | Ändrat till `/game/club?tab=akademi` |

---

## 🔴 KRITISKA BUGGAR (Code)

### B1. Cup-lottningen: lag spelar mot sig själva
**Bild 3.** Forsbacka vs Forsbacka, Västanfors vs Västanfors, etc.
**Problem:** `cupService.ts` genererar bracket med duplicate homeClubId/awayClubId.
**Fil:** `src/domain/services/cupService.ts` — `generateCupBracket()`
**Fix:** Verifiera att shuffled-array aldrig parar lag med sig själv. Troligen off-by-one i pairing-loopen.

### B2. Cup visar "Utslagen" + "Nästa cupmatch" samtidigt
**Bild 3.** "✗ Utslagen" i DINA CUPMATCHER men under det "NÄSTA CUPMATCH: Rögle vs Skutskär"
**Problem:** `getManagedClubCupStatus()` rapporterar eliminated baserat på `winnerId` som sätts felaktigt vid 0-0 (aldrig spelade matcher).
**Fil:** `src/domain/services/cupService.ts` — bracket-match har winnerId satt innan match spelats
**Fix:** `winnerId` ska vara `null` tills match faktiskt spelats (fixture.status === 'completed')

### B3. Cup-matcher alla 0-0
Alla bracket-matcher visar 0-0 trots "Utslagen".
**Problem:** Bracket-matcher refererar fixturer som aldrig simulerats, eller score lagras inte korrekt.

### B4. Match bakgrundssimuleras plötsligt efter omgång 10
**Problem:** En match som spelaren borde styra simuleras av sig själv.
**Orsak trolig:** `canSimulateRemaining` triggar efter `playedRounds >= 10`, eller `advance()` kör managed match utan lineup i ett edge case.
**Fil:** `roundProcessor.ts` — skippar managed match om lineup saknas, men cupmatch kan slinka igenom

### B5. "44 omgångar kvar" vid säsongssim
**Problem:** Räknar ALLA scheduled fixtures (inklusive AI-matcher) inte bara managed.
**Fil:** `DashboardScreen.tsx` — `remainingOtherFixtures` räknar alla, borde visa omgångar kvar
**Fix:** Visa antal omgångar (unique matchdays) eller bara "X omgångar" istf "X matcher"

---

## 🟡 UI/DESIGN-BUGGAR (Code)

### B6. Cup: lag i bracket borde visa "Lottning — Förstarunda"
Rubriken borde vara tydligare. Just nu ser det ut som att alla matcher är spelade (0-0) istf att de är ospelad lottning.
**Fix:** Om match ej spelad → visa "vs" istf "0-0". Rubrik: "LOTTNING — FÖRSTARUNDA"

### B7. Spelarkort (PlayerCard) — "inte många rätt"
**Bild 6.** Problem:
- ×-knappen är UTANFÖR kortet (flytande i grått, svår att se)
- Spelarsamtal-knappar (Uppmuntra/Kräv/Framtid) UTANFÖR kortet
- Feedback-text hamnar under kortet (man ser den ej)
- Porträttet bör centreras bättre
**Fix:** Stängknapp INUTI kortet (övre höger). Knappar INUTI kortet. Hela overlayen scrollbar.
**Spec:** `docs/SPEC-matchresultat-konsolidering.md` punkt D

### B8. Utvisningar centrerat på resultattavlan (FJÄRDE gången)
**Problem:** Utvisningar visas fortfarande centrerade istf under rätt lag.
**Fil:** `src/presentation/screens/MatchLiveScreen.tsx` — utvisningsraden
**Fix:** Hemmautvisning vänsterställd, bortautvisning högerställd. Samma side-logic som mål.

### B9. Byten under match vs halvtid — olika utseende
Halvtidsmodalen (HalftimeModal) har bättre design än SubstitutionModal under match.
**Fix:** Använd SAMMA modal-komponent för båda. HalftimeModal-designen är target.

### B10. Board meeting — alltid samma mål, repetitiva citat
**Bild 1.** Styrelsemötet känns identiskt varje säsong.
**Fix:**
- Variation i styrelsemål (koppla till faktisk tabellposition, ekonomi, mecenatpress)
- Fler citat i `boardData.ts` (minst 8 per personlighet)
- Referera förra säsongens resultat i citaten
- "Det parkeras varje gång" → citatens relevans bör kopplas till season context

### B11. Onboarding-hint saknar rubrik, "1/3" förvirrande
**Bild 2.** "Sätt din startelva" utan rubrik + "Steg 1/3" ser ut som en flerstegsprocess.
**Fix:** Lägg till rubrik "👋 VÄLKOMMEN" eller "🏒 KOMMA IGÅNG". Byt "Steg 1/3" till "Tips 1 av 3" för tydlighet.

### B12. Ekonomi-tab: mecenat/kommun hårdkodat
**Bild 4.** "Mecenat — Kjell Pettersson +70 000 kr/sä" + "Kommunbidrag +67 620 kr/sä"
**Problem:** Dessa bör spegla exakt data från Orten-tabben, inte vara separat beräknade.
**Fix:** Hämta mecenat.name + mecenat.contribution och localPolitician.kommunBidrag direkt. Länka till Orten-tabben ("Se Orten-fliken →").

### B13. Scouting-köp under Ekonomi-tabben
Hör det hemma under Ekonomi? Eller under Scouting/Transfers?
**Rekommendation:** Behåll under Ekonomi som budgetpost, men lägg till en scouting-nudge på dashboard + Transfers-skärm.

### B14. RoundSummaryScreen — för tunn
Visar bara matchresultat + tabell + form + orten + ekonomi.
**Borde visa:**
- Press-konferens-highlight (om den hände)
- Händelser som inträffade (events)
- Andra matcher (konkurrenternas resultat)
- Transfernyheter
- Akademi-resultat (redan finns, bra)
**Spec:** Ny sektion behövs — `SPEC-roundsummary-enrichment.md`

### B15. Inkorg saknar rubrik
Bör ha en section-label högst upp: "📬 INKORG" eller integrerat i headern.

---

## 🟢 DESIGNFEEDBACK (ej bugg)

### F1. Mecenater bör kallas "Brukspatron" eller ha mer bakgrund
"Mecenat" är korrekt men kliniskt. "Brukspatron" passar kulturen bättre.
**Villkor:** Om personen har mer bakgrundstext (business, personlighet, agenda) i UI:t.
**Beslut:** Behåll "Mecenater" som sektionsrubrik men visa mer per person. Eller byt till "Ortens stöd" som bredare koncept.

### F2. Mecenat-aktiviteter saknas
Jaktresa, middag, bastu — specade i FEATURE_ORTENS_MAKTSPEL.md men ej implementerade.
Ref: `docs/FEATURE_ORTENS_MAKTSPEL.md` DEL 1 "Sociala förpliktelser"

### F3. Publik i match (redan specad)
Ref: `docs/SPEC-publik-attendance.md` — inte implementerat ännu.

---

## META: Process-feedback från Jacob

> "Det är för övrigt just sånt här jag vill du ska flagga för när du gör genomgångar. Att det finns flera ställen som gör samma sak."

**Åtgärd:** Alla framtida granskningar ska inkludera en sektion "DUPLICERINGSKONTROLL" som listar:
- Samma information visad med olika design
- Samma beräkning gjord på flera ställen
- Samma modal/overlay med olika implementationer
- Samma data som inte synkas mellan vyer

---

## PRIORITERING FÖR CODE

```
1. B1 + B2 + B3 — Cup-lottning + bracket-buggar (KRITISKT)
2. B4 — Match bakgrundssimuleras (KRITISKT)
3. B5 — "44 matcher" → visa omgångar
4. B8 — Utvisningar centrerade (ÅTERKOMMANDE)
5. B7 — Spelarkort overlay
6. B9 — Byten under match → samma modal som halvtid
7. B10 — Board meeting variation
8. B11 — Onboarding-rubrik
9. B12 — Ekonomi mecenat/kommun spegla Orten
10. B14 — RoundSummary berikad
11. B15 — Inkorg rubrik
```
