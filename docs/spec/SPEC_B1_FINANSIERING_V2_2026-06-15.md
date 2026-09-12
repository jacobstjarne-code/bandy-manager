# SPEC v2 — B1 Anläggningsfinansiering (omskriven mot faktisk arkitektur)

**Datum:** 2026-06-15 · **Av:** Opus · **Ersätter:** `SPEC_B1_FINANSIERING_2026-06-14.md` (v1 byggde på fel antagande om modell-relationen)
**Verifierat i källan 2026-06-15:** `facilityNodes.ts`, `facilityService.ts`, `FacilityScreen.tsx`.

---

## 0 · Vad som FAKTISKT är sant (rättar v1 + Codes paus-diagnos)

Code pausade B1 och rapporterade "nya FacilityNodeDef-trädet är display-only, gamla FacilityProject-flödet är det levande bygget". Det är inte riktigt rätt. Den verkliga bilden:

**Nya modellen (`FacilityNodeDef` + `facilityService` B1-delen) är BYGGKLAR men OFINANSIERAD.** Den har hela kedjan: `getFacilityNodeViews` (status), `canStartBuild`, `startFacilityBuild`, `advanceFacilityState` (bygger klart, returnerar facilities/capacity-bonus), `getPreSeasonChoices`. Den FUNGERAR. Två saker saknas:
1. **Finansiering** — `startFacilityBuild` säger i kommentar "Caller must verify canStartBuild first and deduct cost", men ingen caller drar kostnaden. Noderna har bara hårdkodad `consequences: ekonomi ned "Kassa −X tkr"`.
2. **En initierings-yta** — bara `mode="betrakta"` finns (FacilityScreen). Ingen välj-mode, ingen PreSeason Valet-caller. Därför kan inget byggas → "display-only" utifrån.

**Gamla modellen (`getAvailableProjects` + `FacilityProject`) är en PARALLELL KATALOG, inte samma system.** Andra noder (omklädningsrum, strålkastare, gym), annan gating (`facilities` 0–100-trösklar, inte `requires`-beroenden), OCH den enda som har `requiresKommun`/`kommunCostShare`. Den är fortfarande wirad i `communityProcessor` (`checkProjectCompletion` körs per omgång) — så den LEVER, men den är ett annat träd än det B1 ritade.

**Slutsats:** vi har två anläggningssystem. Rätt drag är INTE att bevara båda (v1:s spärr antog det). Rätt drag är: **nya modellen blir den enda, finansieringen flyttas IN i den, gamla fasas ut.** Finansieringskunskapen (kommun 0.3/0.6) ärvs från gamla till nya.

## 1 · Datamodell — `financing` på FacilityNodeDef

```ts
interface NodeFinancing {
  kommun?: { share: number; minRelation: number; minStanding?: number }
  mecenat?: { share: number }   // bara om aktiv mecenat finns & vill
  // egen kassa är alltid implicit tillgänglig (full cost)
}
// läggs på FacilityNodeDef bredvid cost/buildRounds
```

Tabell (ärver gamla kommunCostShare där den fanns, utvidgar resten — låg tröskel på små noder så svaga klubbar inte stängs ute, Jacobs beslut):

| Nod | cost | kommun share/minRel | mecenat share |
|-----|------|--------------------|---------------|
| kiosk | 80k | 0.3 / 40 | 0.4 |
| varmestuga | 120k | 0.3 / 40 | 0.4 |
| belysning | 240k | 0.4 / 45 (ungdom) | 0.4 |
| akademi_2 | 120k | 0.3 / 40 | 0.5 |
| laktare_ostra | 300k | 0.3 / 55 + standing 50 | 0.4 |
| traningshall | 380k | 0.4 / 50 (ungdom) | 0.5 |
| akademi_3 | 250k | 0.4 / 55 | 0.5 |
| matchhall | 1800k | prövningsspecen | patron-borgen |

Code kalibrerar belopp/trösklar mot ekonomimodellen, flaggar om de bryter balans. Princip fast: lägre tröskel ju mindre/mer ungdomsinriktad.

## 2 · Finansieringsval vid initiering (löser KARTFYND 14)

När spelaren initierar ett bygge (välj-mode/PreSeason): visa tillgängliga finansieringskällor givet nuläge:
- **Egen kassa** — alltid; drar full `cost`.
- **Kommun** — om `politician.relationship >= minRelation` (och ev. `communityStanding >= minStanding`); drar `cost × (1 − share)`, kommunen står för resten. Konsumerar politician-relationen som grind = pulsens sjunde konsument (kartfynd 13).
- **Mecenat** — om aktiv mecenat finns och villig (mecenat.happiness-tröskel); drar `cost × (1 − share)`.

`startFacilityBuild` får en `financingMode`-param och returnerar/signalerar kostnaden som callern drar ur `club.finances`. Caller (välj-mode + PreSeason) måste dra kostnaden — det är buggen i nuvarande kod (ingen drar den).

## 3 · Tillgänglighet LÖPANDE (Jacobs beslut)

Välj-mode i FacilityScreen ska kunna initiera bygge när som helst relation+kassa bär det, inte bara PreSeason. PreSeason Valet är EN initieringsyta (säsongsstartens naturliga stund), FacilityScreen välj-mode är den löpande. Relationen lever hela säsongen → finansieringsfönstret öppnas/stängs dynamiskt.

## 4 · Dynamisk konsekvensrad

Ersätt hårdkodad `ekonomi ned "Kassa −X tkr"` med rad som speglar vald finansiering:
- Egen: "Kassa −300 tkr"
- Kommun 30%: "Kassa −210 tkr · Kommunen står för 90 tkr"
- Mecenat 40%: "Kassa −180 tkr · {mecenat.namn} står för 120 tkr"

## 5 · Utfasning gamla modellen (ERSÄTTER v1:s "bevara"-spärr)

v1 sa "ta inte bort gamla förrän financing finns". Korrigering: gamla modellen är en PARALLELL katalog som ska BORT när nya är finansierad — men i rätt ordning:
1. Bygg §1–4 (nya modellen finansierad + initierbar).
2. Verifiera att nya täcker det gamla gav (publikkapacitet, facilitiesBonus, kommun-finansiering). Gamla hade gym (+15% träning) och omklädningsrum (+morale) — noder nya trädet SAKNAR. **Beslut behövs:** porta in dem som noder i nya trädet, eller släpp dem? (Opus-dom när vi når hit — gym/träningseffekt kan vara värt att behålla.)
3. När nya täcker allt: ta bort `getAvailableProjects`/`startFacilityProject`/`FacilityProject`-vägen ur communityProcessor, ersätt med `advanceFacilityState`.
4. Migration: befintliga saves med gamla `facilityProjects` → mappa completed till `builtNodeIds` (saveGameMigration, additiv som resten).

**Spärr (korrigerad):** ta inte bort gamla förrän §5.2-beslutet är taget OCH nya konsumeras av en caller som drar kostnad. Annars tappas både finansiering OCH gym/omklädningsrum-noderna.

## 6 · Textpooler (Opus, efter datamodell)
Kommunförhandling (ja/nej/villkor via politician-ton), mecenat-erbjudande (mecenat-systemets röster), konsekvensrader. Platshållare `{politician.name}`/`{mecenat.namn}` interpoleras, aldrig hårdkodat (F2 + prövningsmockens K1).

## 7 · Ordning
1. Opus: §5.2-domen (gym/omklädningsrum — porta eller släpp) — kräver att jag läser vad de gav.
2. Code: §1 financing-fält + §2 finansieringsval + §3 välj-mode/PreSeason-caller som drar kostnad.
3. Opus: §6 textpooler.
4. Code: §5 utfasning + migration.

## 8 · §5.2-DOMEN — gamla nodernas öde (Opus 2026-06-15, avgjord)

Gamla modellen hade fem noder, nya trädet har åtta. Överlapp + det unika:
- **omkladningsrum** (+5 morale hemma, 50k) — SLÄPP. Morale-vid-hemmamatch är en svag, osynlig effekt; nya trädets själ/publik-konsekvenser bär samma känsla tydligare. Ingen förlust värd en nod.
- **stralkastare** (+10% sponsor, 80k) — PORTA som liten nod i `verksamhet`-grenen. Sponsorkopplingen är en äkta ekonomisk spak och tematiskt fin (bättre ljus → bättre tv-bild → bättre avtal). Billig, låg-tröskel-nod. Namn: "Strålkastare" / id `stralkastare`, cost 80k, gren verksamhet, requires [], facilitiesBonus 5, consequence ekonomi upp "+10% sponsorintäkt".
- **gym** (+15% träningseffekt, 150k) — PORTA som nod i `verksamhet`. Träningseffekt är en konkret spelmekanisk spak nya trädet saknar helt, och den är meningsfull för en spelare som vill utveckla trupp. Namn: "Gym" / id `gym`, cost 150k, requires [], facilitiesBonus 8, consequence ungdom/trupp upp "+15% träningseffekt".
- **varmestuga_legacy / laktare_legacy / ny_arena** — SLÄPP, de är dubbletter av nya trädets varmestuga/laktare_ostra/matchhall.

**Netto:** porta in `stralkastare` + `gym` som två nya låg-tröskel-noder i verksamhet-grenen (båda med financing per §1-tabellen: kommun 0.3/40, mecenat 0.4). Släpp resten. Då täcker nya trädet allt gamla gav som var värt att behålla, och utfasningen (§5) kan ske utan funktionsförlust. Lagt till §1-tabellen för Code:

| stralkastare | 80k | 0.3 / 40 | 0.4 |
| gym | 150k | 0.3 / 40 | 0.4 |

→ §5.2-spärren UPPLÖST: ingen funktionsförlust eftersom de två värdefulla noderna portas. Code kan fasa ut gamla efter att stralkastare+gym finns i nya trädet.

— Opus, 2026-06-15
