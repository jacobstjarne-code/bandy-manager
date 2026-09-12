# DOM (GRÄNS) — STORYLINES: aktiv state kontra kanon-händelse (prio-3, liggar-inventeringen)

**Datum:** 2026-09-02 · **Av:** Opus · **Utlöst av:** Codex liggar-inventering — storylines "fungerar samtidigt som aktiv spelbåge, historik, relationsärr och årsboksunderlag; roll efter liggaren otydlig." `storyline_resolution`-typen finns men INGEN skrivare. Prio-3 (rollkollision, kräver dom före wiring).

## Grundning — fältet `resolved` ritar gränsen
Kodläst (`Narrative.ts` `StorylineEntry`): en storyline har `resolved: boolean` — en LIVSCYKEL. Den skapas aktiv (`resolved: false`) och LÖSES (`resolved: true`). Codex "fyra saker samtidigt" är egentligen TVÅ tillstånd på en tidsaxel, båda lagrade i samma `storylines`-array — det är därför de ser samtidiga ut.

## Domen — en storyline är AKTIV STATE tills löst, KANON-HÄNDELSE när löst

**`resolved: false` = aktiv state.** Pågående bågen bor i `storylines`-arrayen, läses av event-motorn som driver den (arc-progression, nästa beat). Det är levande gameplay-state, INTE historia. **Rör inte — den stannar i arrayen, den migreras INTE.**

**`resolved: true` = kanon-händelse.** När en storyline löses, skriv en `storyline_resolution`-liggarpost (typen finns, saknar bara skrivare — Codex fynd). DET är historien: "den här bågen avslutades den säsongen." subject = storylinens playerId/clubId (polymorft, finns). significance efter storyline-typ. **Konsumenterna (årsbok, karriärhistorik, relationsärr) läser liggaren i stället för att skanna `storylines`-arrayen.**

Så de fyra "rollerna" Codex såg löses:
- **Aktiv båge** → `storylines`-arrayen (state, stannar).
- **Historik** → `storyline_resolution`-liggarpost vid resolution (kanon).
- **Relationsärr** (löst journalist_feud/derby_echo) → samma liggarpost. Ingen separat ärr-ficka. En löst fejd ÄR en historik-händelse.
- **Årsboksunderlag** → läser liggaren, inte arrayen.

## Skrivvägen (Code)
Vid `resolved: false → true` (där det än sker — arcStorylineService, seasonEnd-storylines, events), skriv EN `storyline_resolution`-post. Dual-write: `storylines`-arrayen behåller den lösta posten tills alla läsare flyttat till liggaren, retire-last. semanticKey per storyline-typ (så cooldown/dedup fungerar).

## SKYDDAT
- **Aktiva storylines migreras ALDRIG.** En pågående båge är gameplay-state event-motorn kör mot, inte historia. Bara RESOLUTION är kanon.
- **narrativeBeatLog-gränsen håller:** storyline-VISNINGS-cooldown (har vi visat den här beaten) stannar i cooldown-lagret. Bara HÄNDELSEN (bågen löstes) är kanon.
- **Ingen ny StorylineType behövs** — resolution-typerna finns redan i `StorylineType`-unionen (`contract_drama_resolved`, `veteran_farewell`, etc.). Det är `EventLedgerType.storyline_resolution` som får subtypen via semanticKey, inte en ny union.
- **En storyline som ALDRIG löses** (spelaren slutar mitt i) skriver ingen liggarpost — korrekt, en oavslutad båge är inte en historisk händelse.

## GODKÄNT NÄR
1. En löst storyline (journalist_feud, veteran_farewell, etc.) skriver en `storyline_resolution`-liggarpost.
2. Årsbok/karriärhistorik läser lösta storylines ur liggaren, inte ur `storylines`-arrayen.
3. Aktiva (oavslutade) storylines är orörda i arrayen, event-motorn driver dem som förr.
4. Ingen dubbelpost (om en storyline redan skriver ett Moment/annat vid resolution — koll mot dubbelpost-buggklassen vi just fixade).

## ÄGARSKAP
Code: skriv `storyline_resolution`-post vid `resolved: false→true`, subject + semanticKey per typ, dual-write, flytta årsbok/historik-läsning till liggaren, retire arrayskanning sist. Opus: ingen ny text (resolution-texten finns i storyline-posternas `displayText`; om en vy vill rendera ur liggaren i stället för `displayText` är det en vy-mall, flaggas då). Jacob: inget beslut — gränsen följer `resolved`-fältet, ingen designkall.
