# O12 — veckobeslutens förhandsdelta i riktig browser

**Datum:** 2026-09-09  
**Kör:** Codex, riktig Vercel-preview i 390 × 844 px  
**Deploy-hash:** `65f91af5`  
**Preview:** `bandy-manager-ma8t1un3s-jacobstjarne-codes-projects.vercel.app`  
**Save:** Heros, `O12 Natur 1`

## Observerat

Efter onboarding, cupmatch och avancemang till serieomgång 1 visades veckobeslutet:

> J. Bäck vill öva hörnskott efter träningen. Extra pass?

Före valet visade A-alternativet `Tillåt` den exakta icke-ekonomiska effekten
`+3 hörnskicklighet`. Det strider mot O12:s övergripande produktregel —
kvalitativ riktning före valet, exakt faktiskt utfall efter — men fångas inte av
den nuvarande O12-grinden.

Det föregående naturliga `EventChoice`-valet (ett transferbud på David Ekberg)
följde däremot den byggda §2-modellen: exakt pengar före, kvalitativ
icke-penga-konsekvens.

## Rotorsak, kodläst

Det här är inte en kvarvarande `EventChoice.subtitle`-rad. Veckobesluten har ett
eget parallellt kontrakt:

- `WeeklyDecisionOption.effect` i
  `src/domain/services/weeklyDecisionService.ts` är ett enda presentationsfält.
- `WeeklyDecisionSecondary.tsx` visar samma `effect` både före klicket och i
  den två och en halv sekund långa efterbekräftelsen.
- `resolveWeeklyDecision` räknar redan fram strukturerade effekter och
  `gameFlowActions.ts` applicerar dem med clampning innan en liggarpost byggs.
- O12:s statiska grind granskar produktions-`EventChoice`, inte
  `WeeklyDecision`. Därför kan hela denna andra beslutstyp läcka exakta tal utan
  att bygget blir rött.

En strängändring från `+3 hörnskicklighet` till exempelvis `bättre
hörnskicklighet` vore en bryggfix: samma sträng används efter valet och då
försvinner det exakta kvittot. Att behålla strängen bevarar kvittot men läcker
facit före valet.

## Omfattning i den nuvarande katalogen

Exakta icke-penga-siffror förekommer bland annat i:

- `corner_extra_training`: `+3 hörnskicklighet`
- `player_weekend_off`: `−1 kondition · +5 moral` / `−3 moral`
- `away_trip_bus`: `−5 ...-stämning` (pengadelen `−3 tkr` är tillåten)
- `tifo_contribution`: `+supporterstämning` / `−5 supporterstämning`
- `reporter_klacken`: `+3 kommunstatus` / `−3 kommunstatus`
- `survival_emergency_lotto`: `+5 tkr` är ett tillåtet pengabelopp; den
  faktiska slumpade nedsidan kan inte beskrivas sant av samma statiska rad.

Detta är kodbevisad möjlighet, inte ett påstående om att samtliga varianter
visades under browserprovet. Endast `corner_extra_training` observerades live.

## Rekommenderad rotfix

1. Ge `WeeklyDecisionOption` ett separat kvalitativt förhandsfält.
2. Låt store-resolvern returnera ett strukturerat kvitto från faktisk
   före/efter-diff efter clampning och specialeffekter; återanvänd inte den
   deklarerade previewsträngen som utfall.
3. Låt `WeeklyDecisionSecondary` visa preview före klicket och det faktiska
   kvittot efter klicket.
4. Utöka bygggrinden så att även hela `WeeklyDecision`-katalogen kontrolleras.
5. Lägg regressionstest på minst attribut, moral+kondition, clampad
   supporter-/ortseffekt, pengar+annan resurs, slumpad lottoeffekt och noop.

## Behöver dom före bygge

`docs/dom/DOM_O12_FORHANDSTEXT_KONTRAKT_2026-09-09.md` namnger uttryckligen
`EventChoice` och låser vokabulär för flera resurser, men inte för kondition,
hörnskicklighet, hörnförsvar, scoutbudget eller skapad motståndaranalys.

Code kan mekaniskt bygga den delade datavägen och det exakta efterkvittot, men
bör inte hitta på de saknade förhandsformuleringarna. Opus behöver antingen:

- utvidga den befintliga O12-domen till `WeeklyDecision`, med de saknade
  resursernas vokabulär; eller
- uttryckligen döma veckobeslut som ett undantag från O12.

Tills dess är fyndet verifierat men inte en säker implementationsorder.
