# Rapport: Survive-fixet verifierat, och svaret på Rögle-tierfrågan

2026-08-25. Femte 12-klubbars-mätningen (20 seeds × 4 säsonger), körd direkt efter Survive-avskedsundantaget byggdes. Två fynd, det andra oväntat.

## Fixet fungerar — men avslöjade ett nytt, ärligare problem

Första omkörningen visade Heros fortfarande på 100% avsked, "orsak boardPatience<=15" — som om fixet inte gjort något. **Det var mätfelet, inte fixet.** Stresskriptets `classifyFiredReason` gissade orsak genom uteslutning (kollar boardPatience-SIFFRAN, inte varför avsked faktiskt hände) — och boardPatience fortsätter räknas som tal för alla tiers, bara dess TRIGGER-verkan är avstängd för Survive. En Survive-klubb som sparkas av licensnekan kunde alltså fortfarande visa boardPatience<=15 av en helt annan anledning och bli felklassad. Fixat: klassificeraren kollar nu `game.licenseStatus === 'license_denied'` direkt (facit) före boardPatience-gissningen. Omkört:

| Klubb | Tier | Rep | Avsked | Orsaker (efter fix) | Säsong |
|---|---|---|---|---|---|
| Heros | Survive | 45 | 100% (20/20) | **licenseDenial=20** | S4=20 |
| Rögle | AvoidBottom | 50 | 100% (20/20) | licenseDenial=15, boardPatience=5 | S4=15 |
| Slottsbron | AvoidBottom | 48 | 95% (19/20) | licenseDenial=15, boardPatience=4 | S4=15 |
| Skutskär | AvoidBottom | 52 | 85% (17/20) | licenseDenial=14, boardPatience=3 | S4=14 |

**Fixet gör exakt vad det skulle: Heros noll sportsligt drivna avsked (boardPatience-orsaken är 0/20, mot 20/20 innan).** Och tidsprofilen ändrades genuint — innan låg Heros-avskeden mest i säsong 2-3, nu ALLA i säsong 4 (licensmekanikens 4-säsongers-nedräkning: varning år 2, poängavdrag år 3, nekad år 4, om nettoresultatet är negativt varje år).

**Den ärliga nyheten: Heros är fortfarande 100% avskedad, bara ett år senare och av en annan anledning.** "Hålla ut"-premissen håller inte ännu — Heros ekonomi är strukturellt lika dömd som dess sportsliga utfall var. Det är inte ett fel i fixet (som gjorde exakt vad ordern bad om: stäng av den sportsliga triggern), det är ett fynd fixet AVSLÖJADE snarare än löste. Om Jacob vill att Heros faktiskt ska KUNNA överleva en karriär krävs en till åtgärd — troligen i `economyService.ts`s intäkts-/lönebudgetsformler för låg-rykte-klubbar, inte i avskedsmekaniken (som nu gör exakt vad den ska).

## Rögle-frågan — svaret är NEJ, men av en anledning som pekar på ett tredje, oupptäckt problem

**Kanon säger nej direkt:** `W012_heros.yaml` — Heros är "**den enda klubb som canoniskt vinner under 25% av matcherna**", "svagast i ligan". `W009_rogle.yaml` — Rögle är "**svagaste SÖDRA laget**", inte ligans svagaste. Två olika, avsiktliga karaktärer. Att göra Rögle till Survive vore att skriva om kanon, inte fixa en bugg.

**Men den empiriska likheten är äkta — och den beror inte på sport.** Rögle/Slottsbron/Skutskär (rep 48-52, alla AvoidBottom, alla FORTFARANDE utsatta för sportsligt drivet avsked eftersom bara Survive undantogs) visar SAMMA mönster som Heros efter fixet: dominerande orsak licenseDenial, koncentrerat till säsong 4. Det är inte boardPatience som håller dem kvar på 85-100% — boardPatience-andelen sjönk kraftigt för alla tre också (Rögle 19→5, Slottsbron 16→4, Skutskär 8→3) samtidigt som licenseDenial tog över som huvudorsak. **De fyra svagaste klubbarna (rep 45-52) delar en gemensam, ren FINANSIELL skörhet som är oberoende av vilken tier de har eller om de är "canoniskt värst i ligan" eller bara "svagast i sin region".**

**Slutsats: frågan "borde Rögle vara Survive" har fel premiss.** Det är inte tiern som är fel och inte kanon som är fel — det är att den sportsliga avskedsvägen aldrig var den verkliga gemensamma nämnaren för dessa fyra klubbar. Den gemensamma nämnaren är att `economyService.ts`s intäkts-/lönebudgetsformler (`weeklyBase: 3000 + reputation*50`, kapacitet `reputation*7+150`) ger alla klubbar under ~rep 55 en strukturellt svår ekonomi, oavsett sportsligt tier. Att flytta Rögle till Survive hade dolt symptomet för EN klubb utan att röra orsaken för de tre andra som delar det.

**Rekommendation:** inte en tier-ändring. En ny, avgränsad utredning av `economyService.ts`s intäktsformler för klubbar under rep ~55 — om Jacob vill att den utredningen ska köras. Inget byggt här, bara mätt och rapporterat.

## offerSelectionService — uppdaterad rekommendation efter denna mätning

Föregående rapport (`RAPPORT_FORLUSTDRIVARE_OCH_FORMELNS_TAK_2026-08-25.md`) föreslog att difficulty-etiketten borde härledas ur samma underlag som avskedsrisken. Den här mätningen visar att "avskedsrisken" för de fyra svagaste klubbarna nu domineras av EKONOMI, inte sportsligt utfall eller ens tier. Fixen för offerSelectionService bör alltså vika ett öga mot finansiell marginal (redan en av de tre faktorerna i `computeDifficultyScore` — fin/wage-kvoten) snarare än mot ett nytt sportsligt mått. Detaljerad fix i nästa steg.
