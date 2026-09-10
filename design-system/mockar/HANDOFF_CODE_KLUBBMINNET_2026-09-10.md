# CODE-HANDOFF — Klubbminnet som protokollblock (bygg)

**Av:** Opus · **Till:** Code · **Datum:** 2026-09-10 · **Rör:** `ClubMemoryView.tsx` (Klubb → Minne-fliken). Byggbar rakt av. Konsoliderar Design-handoffen + Opus A.1-dom + den exakta familj-mappningen (som Design-handoffen sköt upp) på ett ställe.

## Referenser

- **Visuell mock:** `design-system/mockar/Klubbminnet-protokollblock.dc.html`
- **Design-handoff (anatomi, CSS-intention):** `design-system/mockar/HANDOFF-KLUBBMINNET-PROTOKOLLBLOCK.md`
- **Förutsättning:** enad minnesläsare + vymallar är REDAN byggda (verifierat 2026-09-07, se raden `redesign-klubbminnet-omdesign`). Inget Code-förarbete kvar.

## Scope — byt FORM, inte innehåll

Bara säsongssektionernas form byts i `ClubMemoryView`. **Oförändrat:** all datalogik (`getClubMemory` + `getRecentMomentsFromLedger`), och blocken blodslinje, legender, rekord (bara paper-tokens i stället för portal-mörka). Ingen ny data, inga nya komponenter — perforering, kopparprick och räls är ren CSS.

## Opus-dom A.1 — LJUST PAPPER

Renderas i ljust papper (`--bg` / `--bg-surface`), inte mörk portal. Liggaren ÄR papper; minnet är ett dokument, inte en skärm — att Minne skiljer sig från portalen är avsikten. Mörk tokens-flip (`--bg-portal-surface`/`--text-light`) är bara fallback om Klubb-skalet krockar hårt vid implementation; default är papper.

## Bygg-steg

1. **Kind-axeln (färg)** — återanvänd severity→kind-mappningen (`club-memory.css` / audit-handoffen): `scar`→Ärr, `legendary`/medalj→Triumf, `derby`/politik→Laddat, default→Noterat. Klasser `k-triumf / k-arr / k-laddat / k-noterat`. Kind ligger som 3px vänsterstripe + rubrikton.

2. **Familj-axeln (kategoristämpel) — NY, exakt mappning här** (Design-handoffen sköt upp den). Mappa `MemoryEventType`/`EventLedgerType` → en av fem familjer, emoji som stämpel inline före posttexten:
   - **⚔️ match:** `season_finish`, `cup_final`, `sm_final`, `derby_result`, `derby_win`, `big_win`, `big_loss`, `season_highlight`
   - **🏟️ anläggning:** `facility_built`
   - **👤 personer:** `player_milestone`, `academy_promotion`, `retirement`, `transfer_signed`, `transfer_sold`, `transfer_story`, `star_injury`, `captain_crisis`, `national_team_callup`
   - **🤝 relationer & pengar:** `patron_emerge`, `patron_withdrawal`, `mecenat_withdrawal`, `mecenat_costshare`, `sponsor_positive`, `sponsor_negative`, `referee_feud`, `referee_trust`
   - **📋 beslut & epok:** `decision`, `storyline_resolution`, `scandal`, `manager_burnout`, `era_shift`, `nemesis_signed`, `rival_sale`

   Fem stämplar, inte trettiofem. Familj och kind är oberoende axlar (en ⚔️ kan vara Triumf ELLER Ärr).

3. **Ortens minne (hero per säsong)** — `max(events, by significance)` per säsong, ur befintlig `getClubMemory()`. Rubrik i stor Georgia, familjestämpel + datum i eyebrow, kind-färgad stripe, kopparprick om Triumf.

4. **Protokollblock-CSS** — perforeringsräls (hålslag `radial-gradient` + streckad rivlinje), kopparprick (9–11px `--accent`-cirkel på rälsen i höjd med Triumf-poster), Georgia dag+versal månad per post-rad (grid `[38px datum | 1fr text]`), säsongen läses uppåt (nyast överst). Ingen versal kind-etikett, ingen omg-tagg i raden — stripen + datumet räcker (städat efter granskning).

5. **Nyckel överst** — familj- + kind-nyckel som nedtonad avdelarremsa (inte konkurrerande kort). Semantisk färg kräver nyckel (DS-regel 13).

6. **Byggdetalj-fix:** säsongstiteln radbryter i mocken ("Säsong"/"3" på skilda rader) — fixa vid implementation.

## Verifiering

Full build + tsc gröna. Bekräfta att blodslinje, legender och rekord är oförändrade i innehåll (bara paper-tokens). Visuell grind på 390 px om en scen finns. Ingen datalogik rörd — diffen ska vara isolerad till `ClubMemoryView` + dess CSS.

## Ägarskap

Code bygger. Opus: denna handoff + A.1-domen + familj-mappningen. Design: mocken. Ingen ny svensk text krävs (mallarna för de tysta typerna finns redan låsta, `momentViewTemplates.ts` §k3).
