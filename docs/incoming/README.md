# docs/incoming

Designs leveranser landar här. **Mappen ska vara kort.** Är den lång betyder det att något inte blivit avgjort.

## Regeln

En fil ligger i `incoming/` bara så länge den väntar på ett beslut eller ett bygge.

När den är dömd och byggd: flytta till `_arkiv-<år>-<månad>/`. Underlaget finns kvar, men det syns inte som öppet.

Synkfilerna (`github-synk-*.md`) arkiveras direkt när deras leverans är behandlad — `github.md` är den löpande sanningen.

## Vad som ligger här nu, och varför

| Fil | Status |
|---|---|
| `Illustrationer-stilbibel-2026-08-18.dc.html` | **Aktiv referens.** Används varje gång en bild beställs. Ska stå kvar |
| `github.md` | **Aktiv, men EFTERSATT.** Löpande synk mot repot — senaste `Last sync`-raden är 2026-08-09, nästan fyra veckor gammal mot en session som sedan dess levererat hela liggar-migreringen, licenspensioneringen, burnout-liggaren och mycket mer. Flaggat, inte åtgärdat — synken görs av en extern process/agent, inte Code på egen hand. |

**Arkiverat 2026-09-03** (svep/audit, `docs/sprints/OVERLAMNING2_STEG0_INVENTERING_2026-08-22.md`s sju återstående poster omverifierade mot dagens kod): `Överlämning 2/` → `_arkiv-2026-09/Överlämning 2/`. Design-substansen i alla elva HTML-filerna är nu fullt spårad till kod eller till ett namngivet öppet beslut — inget mer att extrahera ur dokumenten själva. Fyra av de sju från 2026-08-22-inventeringen har hunnit stängas sedan dess: entity-dedup-taggning på `PortalBeat.tsx` (`data-entity-id`/`data-entity-source` finns nu), D1 trait-emoji → `tag-trait-*`-familjen (`PlayerCard.tsx`, kommenterad "Jacobs dom 2026-08-22"), Portal-orientering punkt 1 kassörshälsning (`PortalScreen.tsx`, samma dom-datum), och transfer-bid-ripplens konsumentlösa gren (`pilotTransferBidRippleChain` retirerad 2026-09-03 efter parity-kontroll mot den nya liggarkonsumenten i `orsakVerkanService.ts` — inte en förlust, en sanktionerad ersättning). Ett `design-system/README.md`-dokfel (8px/2px → rätt 9px/2.5px) som samma inventering flaggade är rättat samma svep. **Tre poster kvarstår genuint öppna, flyttade till `MASTER_OPPET.md`** (id-prefix `overlamning2-`): Portal-orientering punkt 2 (statefull övergångsfönster-copy), `trainerArc.current`/`getArcMoodText`s placeringsbeslut, och weeklyDecision/boardMeeting-konsolideringen in i `resolveEvent`. Se MASTER_OPPET.md för aktuell status — den här filen är inte längre "enda sanningen" om vad som är öppet.
**Arkiverat 2026-09-01** (Code-verifieringspasset, MASTER_OPPET.md `inv-6a`–`inv-6j`): `BANDY_MANAGER_AUDIT_6_SASONGER_2026-08-26.md`, `bandy-manager-manniskoupplevelse-audit-7024f8a-2026-08-24.md`, `bandy-manager-skutskaer-audit-52009671-2026-08-20.md`, `bandy-manager-hela-auditsviten-5c9a7a8.pdf`, `github-synk-forutsattningsfasen-2026-08-25.md` (redan konsumerade, aldrig flyttade — README:n hade tappat bort dem, fanns inte ens i tabellen ovan). `INVESTIGATION_MATCH_REVENUE_ECONOMY_2026-08-26.md` — fyndet ÄR löst (kandidat 2, 2026-08-27: `sqrtAttendance` i `economyService.ts:585-596`), raden som stod här och sa "väntar på fix" var själv stale. `RAPPORT_OMMATNING_VAGB_ANSPRAK4_TRE_FYND_2026-08-30.md` — redan dömd "kan arkiveras", gjort nu. `Spår B - textnivåer...` + md — "status okänd" var stale: B3 (`NextOpponentHook.tsx`) och B4 (`StreakSecondary.tsx`) båda byggda 2026-07-20. `Ytkarta - hallprövning & landslag` + `Ytkarta - tre textpooler` — dömda beslut sedan 2026-08-20, ingen kvarvarande öppen fråga.

**Arkiverat 2026-09-01, andra svepet** (MASTER_OPPET.md `inv-1-incoming-readme-stale`, sjätte filen som saknades i tabellen ovan): `Forutsattningsfasen-styrelsen-talar-2026-08-25.dc.html` — steg 1 ("Styrelsen talar", variant 1b: ordförandeband + kvittensrad + kravband) är byggt (`SeasonTransitionScene.tsx`'s `BoardTalksSection`, låst av Jacobs dom 2026-08-25). Mocken konsumerad, arkiverad.

**Arkiverat 2026-08-20** (byggt, verifierat rad för rad mot koden): `A1-KAFFERUMMET-BLIR-EN-PLATS-2026-07-19.md` + html (alla fem domar i koden), `CODE_INSTRUKTION_SIDFOT_INTRORAM_2026-07-10.md` (T1–T5 byggda), `RELÄ-Code-DS-konformans-svep1-3.md` + html (C1/C2/C4/C5 byggda, C3 fixades i samma svep, V1 var strukturellt PASS men saknade gate-täckning — `HalfTimeSummaryScreen` tillagd i `sceneRegistry.ts`), `Överlämning/` (dubblett av `Überlämning 2/`), `_RADERAS/` (raderad, inte arkiverad — den enda instruktionsfilen i mappen var redan byggd, resten var redan lästa audits).

## Nästa steg

`Överlämning 2/` är arkiverad (se ovan) — dess tre återstående öppna poster lever nu i `MASTER_OPPET.md`, inte här. Mappen är annars tom på "status okänd"-poster; det som ligger kvar är antingen aktiv referens (`Illustrationer-stilbibel`, `github.md`) eller redan arkiverat (`_arkiv-2026-08/`, `_arkiv-2026-09/`).
