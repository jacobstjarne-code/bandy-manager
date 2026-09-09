# DESIGN-BRIEF — Klubbminnet, omdesign (70-tals protokollblock)

**Datum:** 2026-09-08 · **Av:** Opus · **Kör:** Design · **Bygger:** Code efter ritning · **Grund:** `redesign-klubbminnet-omdesign` (MASTER), Redesign-granskningen 2026-09-03 skärm 02, `ClubMemoryView.tsx`, `Narrative.ts`.

## Vad

Rita om **Klubbminnet** — den befintliga fliken `minne` i Klubb (`ClubMemoryView`). Det är en OMDESIGN av en yta som redan finns och redan läser liggaren, INTE en ny flik. Estetiken: liggaren läst uppåt som ett 70-tals protokollblock.

## Förutsättningen är KLAR — Design väntar bara på ritningen

Code-steget som raden en gång väntade på (enad minnesläsare över alla liggartyper + vymallar för de tysta typerna) är redan byggt, verifierat 2026-09-07 — ackumulerat genom flera sessioner utan att någon stämde av. Så det finns inget Code-steg kvar före ritningen. Design ritar, sedan bygger Code omdesignen. Inget att invänta.

## Rita mot dessa fakta (allt har data bakom sig)

- **Sex flikar**, inte fyra. Klubb har idag: Träning · Ekonomi · Orten · Akademi · Minne · Tränare. Mocka mot den riktiga fliklistan (den gamla mocken visade fyra).
- **Fem familjer** (kategoristämpel = TYP→FAMILJ, aldrig typ→egen emoji, det blir 35 stämplar annars): ⚔️ match · 🏟️ anläggning · 👤 personer · 🤝 relationer & pengar · 📋 beslut & epok.
- **Fyra kinds** (färgaxeln, "kopparpricken"): Triumf · Ärr · Laddat · Noterat (`momentKind` klassar redan varje post).
- **"Ortens minne"-hero per säsong** = säsongens post med högst `significance` (fältet finns, 0–100).
- **Säsongstagg** = `season_finish`-postens placering/guld.

## Formspråk (ur granskningen)

Perforeringsräls, Georgia-datum, emoji som kategoristämpel (familjen), kopparprick för guld/Triumf, "Ortens minne"-hero överst per säsong, säsongstagg (placering/guld). Protokollblock läst uppåt.

## Behåll / byt

Behåll: legender, blodslinje, rekord (de fungerar). Byt: säsongssektionernas FORM till protokollblocket ovan.

## Ägarskap

Design: ritar skärm 02 mot sex flikar / fem familjer / fyra kinds. Code: bygger omdesignen av `ClubMemoryView` efter ritningen — behåll legender/blodslinje/rekord, byt säsongssektionernas form. Opus: mallarna finns redan låsta. Jacob: gav go 2026-09-08.
