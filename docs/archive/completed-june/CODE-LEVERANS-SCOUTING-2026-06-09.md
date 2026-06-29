# CODE-LEVERANS — Transfers Scouting-tabben (gruppering + struktur)

**Datum:** 2026-06-09
**Källa:** AUDIT-KLUBB-TRANSFERS Del 2 §4 (4.3/4.4/4.5). Stänger Transfers-sidan av auditen.
**Kodgrund (läst):** Scouting-tabben renderar `<ActiveBidsList>` (TransfersScreen.tsx). Komponenten har tre sektioner i denna ordning: (1) "Scouting — andra lag" = platt lista `scoutablePlayers.slice(0,30)`, sorterad oscoutade-först → CA; (2) "Scoutrapporter (N)"; (3) "Talangspaning" (info + form + senaste resultat) — längst ner. `handleScout` (TransfersScreen) beräknar `sameRegion`/`hasPlayedAgainst` → rapport direkt (0 omg) om någondera, annars 1 omg. **Marknad-tabben i samma fil grupperar redan** tillgängliga spelare (SectionLabel + desc + card per grupp, `.slice(0,10)`) — återanvänd det mönstret.

## Problemet
30 odifferentierade rader, alla "Styrka ?", alla "Utvärdera" = vägg. Talangspaningen (en *annan* handling) ligger begravd under listan + rapporterna. Två handlingar (utvärdera kända / sök okända) utan visuell jämvikt.

## Låsta beslut

### 1. Omordna sektionerna (fixar 4.5)
Talangspaningen ska inte ligga under 30 rader. Ny ordning i komponenten:
1. **Talangspaning** — "Sök nya talanger" (formuläret, kompakt) överst. Den fokuserade "hitta efter behov"-handlingen.
2. **Dina scoutrapporter** — det du redan utvärderat (kunskapsbasen).
3. **Spelare att utvärdera** — browse-listan, grupperad (nedan). Längst ner, där en lång lista hör hemma.

Ordningen mellan 1 och 3 är den tunbara knappen — om playtest visar att browse är primärhandlingen, flippa. Men sök ska aldrig ligga under 30 rader igen.

### 2. Gruppera browse-listan per position (fixar 4.3)
"Spelare att utvärdera" grupperas per position med Marknad-mönstret: SectionLabel + card per grupp. Grupper: Målvakt · Back · Ytterhalv · Mittfält · Anfallare (matcha talangspaningens position-options + `positionShort`). Inom grupp: behåll oscoutade-först → CA. Cappa per grupp (~8) som Marknad cappar 10, med "visa fler" om det behövs.

### 3. Synliggör scout-kostnaden per rad (fixar 4.4 + surfar dold mekanik)
`handleScout` vet redan att sameRegion || hasPlayedAgainst → rapport direkt. Surfa det på raden: liten tag "rapport direkt" på de rader där villkoret håller, annars "1 omgång". Beräkna samma villkor i listan som `handleScout` gör. Det gör den dolda närhets-kostnaden synlig (auditens "närmare = billigare") och ger oscoutade rader info istället för bara "?".

### 4. Mindre passiv oscoutad-state (fixar 4.4)
"Styrka ?" → "Styrka ej utvärderad" (muted) eller streckad placeholder. Frågetecknet signalerar tomt; det här signalerar "att upptäcka". Liten copy/visuell ändring.

## Hygien (rider med)
**Döp om `ActiveBidsList` → `ScoutingTab`.** Komponenten har inget med aktiva bud att göra — den ÄR scouting-tabben. Uppdatera importen i TransfersScreen. Ren rename, samma kod↔UI-paritet som KlubbTab→OrtenTab.

## INTE röra
Scout-mekaniken (scoutingService, talentScoutService, scoutProcessor) — bara UI/presentation. Marknad/Kontrakt/Fria/Sälj-tabbarna. BidModal/RenewContractModal (egen öppen fråga). scheduleGenerator, matchCore.

## Acceptans
- Talangspaning nås utan att scrolla förbi browse-listan.
- Browse-listan grupperad per position, inte 30 platta rader.
- Varje oscoutad rad visar scout-kostnad (direkt / 1 omg).
- Ingen ensam "Styrka ?".
- ScoutingTab-rename klar, import uppdaterad.
- `npx tsc --noEmit` + test rena.

**Rapportera per punkt.**

---

**Till Code (Sonnet, VS Code):**

Läs `docs/CODE-LEVERANS-SCOUTING-2026-06-09.md` och implementera. Bara UI i `ActiveBidsList.tsx` (→ `ScoutingTab.tsx`) + importen i `TransfersScreen.tsx`.

**Metod:** läs `ActiveBidsList` + Marknad-tabbens grupperings-block i `TransfersScreen` i kontext först — återanvänd grupperings-mönstret. Visa kod.

1. **Omordna:** Talangspaning överst → Scoutrapporter → grupperad browse-lista sist.
2. **Gruppera** browse-listan per position (Målvakt/Back/Ytterhalv/Mittfält/Anfallare), oscoutade-först → CA inom grupp, cappa ~8/grupp.
3. **Scout-kostnad per rad:** beräkna sameRegion/hasPlayedAgainst som `handleScout` gör, visa tag "rapport direkt" / "1 omgång".
4. **Oscoutad-state:** "Styrka ?" → "Styrka ej utvärderad" (muted).
5. **Rename:** `ActiveBidsList` → `ScoutingTab`, uppdatera import.

**Rör INTE:** scout-mekaniken (services/processor), övriga tabbar, modalerna, scheduleGenerator, matchCore.

**Klart =** sök nås utan scroll förbi listan · listan grupperad per position · kostnad per rad · ingen ensam "?" · ScoutingTab-rename · tsc + test rena.

**Rapportera per punkt.**
