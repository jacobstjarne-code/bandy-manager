# ⛔ ERSATT AV V2 — BYGG INTE PÅ DENNA

> **Denna v1 är OBSOLET. Använd `SPEC_B1_FINANSIERING_V2_2026-06-15.md`.**
> v1 byggde på fel antagande: att gamla modellen ska BEVARAS parallellt (§0-spärren nedan). Code:s utredning visade att den nya `FacilityNodeDef`-modellen är byggklar men ofinansierad, och den gamla är en parallell katalog som ska FASAS UT, inte bevaras. V2 vänder spärren och innehåller §5.2-domen (gym + strålkastare portas, resten släpps). Läs V2. Denna fil behålls bara för historik.

---

# SPEC — B1 Sprint 1 del 2: Anläggningsfinansiering som Orten-mekanik (v1, OBSOLET)

**Datum:** 2026-06-14 · **Av:** Opus · **För:** Code (bygge efter NU 2-blocket) + Opus (textpooler)
**Status:** specar den saknade finansieringsdimensionen som föll bort när `FacilityNodeDef` skrevs. Verifierat i `facilityNodes.ts`: varje nod har idag en hårdkodad `{ dim: 'ekonomi', dir: 'ned', label: 'Kassa −X tkr' }` — ingen kommun, ingen mecenat. Den gamla modellens `requiresKommun` / `kommunCostShare` (0.3 läktare, 0.6 arena) lever kvar i `getAvailableProjects` men är frånkopplad.

---

## 0 · Ramning (läs först — undviker hall-drift)

Detta är INTE "de små noderna ärver hallens mönster". Det är: **Orten finansierar anläggning som funktion av din relation med Orten — och hallen är den största och svåraste sådana förhandlingen, inte förebilden.** Navet är communityStanding + politician.relationship + mecenat-systemet (genomlysningens kartfynd 13: pulsen driver sex system — detta blir det sjunde). Hallen blev specad först (prövningsspecen); de övriga noderna tappade bara finansieringen i översättningen från gammal modell. Vi återställer den, förankrad i relationerna.

**Spärr till Code (bindande):** gamla `getAvailableProjects` + `requiresKommun`/`kommunCostShare` får INTE tas bort förrän `financing` finns i nya `FacilityNodeDef` OCH konsumeras av byggflödet. Annars permanentas funktionsförlusten. Verifiera med en grep att inget annat läser de gamla fälten innan radering.

## 1 · Datamodell — `financing` på FacilityNodeDef

Lägg ett finansieringsfält. Tre källor, speglar Orten:

```ts
interface NodeFinancing {
  egenKassa: number          // alltid tillgänglig — full kostnad ur kassan
  kommun?: {
    share: number            // 0.3 läktartyp, 0.6 arena/hall (ärv gamla kommunCostShare)
    minRelation: number      // politician.relationship-tröskel, t.ex. 55
    minStanding?: number      // ev. communityStanding-tröskel för de större
  }
  mecenat?: {
    share: number            // hur stor andel en villig mecenat tar
    requiresActiveMecenat: true  // bara om en mecenat finns OCH vill (mecenat.happiness/influence)
  }
}
```

Varje nod deklarerar vilka källor som är möjliga. **Tröskelfri default för små noder** (per Jacobs beslut 2026-06-14): under ~150 tkr (kiosk, värmestuga, belysning, akademi_2) erbjuds kommun/mecenat MED LÅG tröskel — inte ingen tröskel, men låg — eftersom en svag klubb annars aldrig har råd och Orten-stödet då blir regressivt (bara rika klubbar som inte behöver det får bygga). Det är hela poängen: en svag klubb i en bygd som tror på den ska kunna få en kiosk medfinansierad.

## 2 · Tröskel- och andelstabell (per nod)

| Nod | Kostnad | Egen kassa | Kommun (share / minRel) | Mecenat (share) |
|-----|---------|-----------|-------------------------|-----------------|
| kiosk | 80k | ✓ | 0.3 / rel ≥ 40 | 0.4 |
| värmestuga | 120k | ✓ | 0.3 / rel ≥ 40 | 0.4 |
| belysning | 240k | ✓ | 0.4 / rel ≥ 45 (ungdomsargument) | 0.4 |
| akademi_2 | 120k | ✓ | 0.3 / rel ≥ 40 | 0.5 (mecenater gillar ungdom) |
| läktare östra | 300k | ✓ | 0.3 / rel ≥ 55 + standing ≥ 50 | 0.4 |
| träningshall | 380k | ✓ | 0.4 / rel ≥ 50 (ungdom) | 0.5 |
| akademi_3 | 250k | ✓ | 0.4 / rel ≥ 55 | 0.5 |
| **matchhall** | 1800k | (för stor för ren kassa) | prövningsspecen styr — se SPEC_MATCHHALL_PROVNING | patron-borgen |

Belopp/trösklar är förslag — Code kalibrerar mot ekonomimodellen och flaggar om de bryter balansen. Principen är fast: **lägre tröskel ju mindre/mer ungdomsinriktad noden är; högre ju större/mer prestige.**

## 3 · Tillgänglighet — LÖPANDE, inte bara PreSeason (Jacobs beslut)

Finansieringsförhandling sker NÄR SOM HELST relationen + kassan bär den, inte bara vid säsongsstart. Skälet: relationen med kommunen lever hela tiden — vinner du ett derby, stiger pulsen, omväljs kommunalrådet, så ska finansieringsfönstret kunna öppnas/stängas mitt i säsongen. Att låsa det till PreSeason vore att reducera en levande Orten-mekanik till ett årligt menyval (samma drift vi just stoppade).

PreSeason Valet-scenen är då EN initieringsyta (den naturliga "vad bygger vi i år"-stunden), men FacilityScreen i välj-mode ska också kunna initiera ett bygge löpande, med samma finansieringsval. Bygget självt löper på byggsloten enligt befintlig `buildRounds`-kanon.

## 4 · Konsekvensraden blir dynamisk

Idag: hårdkodad `Kassa −X tkr`. Efter fix: konsekvensraden reflekterar VALD finansiering vid initiering.
- Egen kassa: "Kassa −300 tkr"
- Kommun 30%: "Kassa −210 tkr · Kommunen står för 90 tkr"
- Mecenat 40%: "Kassa −180 tkr · {mecenat.namn} står för 120 tkr"

Det gör varje bygge till ett litet eko av prövningens stora förhandling utan att hallen är navet — och det löser samtidigt KARTFYND 14 (ekonomi-passivitet): kassan får ett syfte, och finansieringsvalet är ett återkommande litet beslut förankrat i hur Orten ser på dig.

## 5 · Textpooler (Opus skriver separat)

När datamodellen är byggd skriver Opus finansieringsförhandlingens copy — kommunalrådets ja/nej/villkor (via politicianData-ton), mecenatens erbjudande (via mecenat-systemets tre röster), och konsekvensradernas formuleringar. Ska INTE hårdkodas av Code (F2-fällan); platshållare `{politician.name}`, `{mecenat.namn}` interpoleras. Spärr som i prövningsmocken K1.

## 6 · Ordning
1. Code: `financing` på FacilityNodeDef + tabellen §2 (data). Behåll gamla modellen parallellt (spärren §0).
2. Code: byggflödet konsumerar `financing` — välj-mode i FacilityScreen + PreSeason Valet, löpande initiering, dynamisk konsekvensrad §4.
3. Opus: textpoolerna §5.
4. Code: när allt grönt och `financing` konsumeras — ta bort gamla `getAvailableProjects`/`requiresKommun` (grep-verifierat att inget annat läser dem).

— Opus, 2026-06-14
