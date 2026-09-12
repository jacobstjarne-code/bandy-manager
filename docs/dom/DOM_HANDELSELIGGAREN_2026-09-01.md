# DOM (FUNDAMENT) — HÄNDELSELIGGAREN: en kanonisk historik allt läser ur

**Datum:** 2026-09-01 · **Av:** Opus · **Typ:** fundamentdom (en strukturell sanning, inte en feature) · **Beslut:** Jacob (vi måste göra det) · **Utlöst av:** orsak/verkan-scopingen som avslöjade rotproblemet — Jacobs diagnos: "vi har bara haft en massa händelser, de har inte dokumenterats, då blir det hip som hap."

## Diagnosen (kodläst — värre än en scoping-fråga)

Spelet BETER sig som om det har en historik — årsbok, styrelseminne, pressåterkoppling, klubbkrönika — men under ytan finns ingen kanonisk sanning om vad som hänt. Det finns ~20 spridda, överlappande delminnen, och varje konsekvent-service läser sin egen delmängd:

- **`narrativeBeatLog`** — den ENDA append-only, tidsstämplade, en-skrivväg-loggen. Men TUNN: bär bara `semanticKey/season/round/systemhandelse?`. Svarar "vilken båge fyrade när", inte "vad hände, med vem, med vilka följder".
- **`clubMemory`** (`getClubMemory`) — LAGRAR ingenting. Den RE-HÄRLEDER händelser varje anrop genom att skanna fixtures + spelardagböcker + akademiuppflyttningar + landslagsuttagningar + skandaler + storylines + legender (sju källor).
- **`collectActiveMemories`** — aggregerar NIO till ad hoc: recentMoments, klackEcho, journalist.memory, nemesisTracker, lastRivalSaleMatchday, pendingFollowUps, bandyLetters, boardObjectiveHistory, economicCrisisState.
- **`seasonDecisionCandidates`** (årsbokens beslut), **ripple-kedjorna** (konsekvenserna som domino), **consequence-markörerna** (`consequenceLevel`/`costLabel`) — tre delminnen till.

Varje "minne"-mekanism vi byggt (och de vi lappat: årsbok som glömde valet, styrelse som glömde ett mål, press som repeterade) är en feature-specifik halva av samma saknade liggare. Ingen kanon → varje yta gör sin egen tolkning av sin egen delmängd → resultaten kan inte vara konsekventa. Det är roten under alla symptom.

## Fundamentet — EN append-only händelseliggare

En kanonisk, intern, append-only logg över vad som hänt i klubbens historia. **Spelaren ser den ALDRIG.** Varje service som gör något konsekventiellt skriver EN strukturerad post i det ögonblick det händer; varje konsument (årsbok, press, styrelse, klubbkrönika, orsak/verkan) LÄSER ur den — i stället för att re-härleda ur spridd state.

**Rå sanning i botten, all mening i ytorna** (Jacobs modell, och den löste "logg vs berättelse" åt sig själv: om liggaren är intern kanon MÅSTE den vara tolkningsfri — annars låses tonen vid skrivning och varje yta ärver fel ton).

### Postens form (grundad i vad de spridda minnena redan bär)
Strukturerat, ingen prosa:
- `type` — vad hände (försäljning/avsked/derby/missat mål/mecenat-lämnar/skada/...)
- `season`, `matchday` — när (kronologi, aldrig rond-identitet i UI)
- `subjectPlayerId?` / `subjectClubId?` — VEM (clubMemory bär redan detta)
- `outcome?` — won/lost/neutral
- `significance` — vikt (clubMemory + weights bär det)
- `consequences?` — fält-deltana (ripple-kedjans steg: Stämningen/Klacken/Orten/Styrelsen −N)
- `madeByPlayer?` — beslut vs systemhändelse (HIGH 6:s attributions-flagga bär redan skillnaden)
- **INGEN `text`/`emoji`** — de bor i konsumenten. `clubMemory`s nuvarande `text`+`emoji` blir en VY-generering ur den strukturerade posten, inte lagrad prosa.

## Det svåra — migreringen (inte designen)

Att designa liggaren är enkelt. Det svåra är att subsumera ~20 spridda minnen UTAN förlust och UTAN att bryta det som redan läser dem. Detta är INTE en big-bang-omskrivning — det vore livsfarligt över 20 fält. Det är en **strangler-migrering:**

1. **Bygg liggaren + skrivvägen** (utöka `narrativeBeatLog` till den rikare posten, eller en ny `eventLedger` bredvid — Code avgör vilket som bryter minst).
2. **Dual-write under migrering:** en källa skriver BÅDE sitt gamla minne OCH en liggarpost. Inget läsande går sönder.
3. **Flytta konsumenter en i taget** till att läsa liggaren i stället för att skanna.
4. **Retirera ett spritt fält först när dess SISTA läsare flyttat.** Aldrig radera ett minne med en kvarvarande läsare (bevarande-disciplinen, `d0d4d923`-läxan).

## SKYDDAT
- **Ingen prosa i liggaren.** Frestelsen att lagra `text` (clubMemory gör det idag) är exakt det som låser tonen. Vy:n genererar texten.
- **Ingen big-bang.** Strangler eller inget — 20 fält migrerade på en gång är den enda vägen att förlora spelad historik.
- **`narrativeBeatLog`s tre läsvägar** (cooldown/wasLoggedThisRound/systemhandelseBudget) måste överleva migreringen — de är i produktion och gatar riktig logik.
- **HIGH 6:s `madeByPlayer`-grind** — liggaren ÄRVER den skillnaden (beslut vs sim), tappar den aldrig; en sim-resolution får inte skrivas som ett spelarbeslut i kanon.

## FORKEN (Jacob) — migreringens ambition
- **Full:** bygg liggaren + migrera alla ~20 spridda minnen in i den. Stort, veckor av mekanisk migrering.
- **Strangler-inkrementell (Opus rek):** bygg liggaren + skrivvägen nu, allt NYTT konsekvens-skrivande går dit (orsak/verkan blir den FÖRSTA konsumenten som föds ren), och de befintliga spridda migreras opportunistiskt — när en feature ändå rörs flyttas den till liggaren, ett fält retireras när dess sista läsare gått. Aldrig ett stopp-allt-annat-pass.

**Opus rek: strangler.** Fundamentet finns då direkt (nya features föds konsekventa), risken sprids ut, och ingen spelad historik står på spel i ett enda stort pass. Full-migrering av allt gammalt är slöseri om det inte drivs av ett behov — låt behovet dra migreringen, inte en stor städning.

## ÄGARSKAP
Jacob: välj forken (full eller strangler). **Opus (jag):** denna dom är fundamentet; jag skriver postens exakta schema + migreringsordningen (vilken konsument flyttar först) när forken är vald, och orsak/verkan-domen skrivs om som liggarens FÖRSTA konsument i stället för en fristående feature. **Code + Codex (lanes):** själva migreringen är stor och mekanisk — en källa/konsument i taget, dual-write, retire-last — precis den sorts brett-och-mekaniskt arbete som ska malas i lanes, inte domas per steg. **Inget byggs före Jacobs fork-val.**

Detta är den enskilt viktigaste strukturella domen på länge: allt annat vi kallat "minne" har varit en halva av den här liggaren, byggd var för sig för att den inte fanns.
