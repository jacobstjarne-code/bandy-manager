# AUDIT — Match-vyns event-ytor & modaler (Stålvallen-konsistens)

**Från:** Design-Claude · **Datum:** 2026-06-07

## Vad jag kollade

Alla in-match-händelser + de tre modalerna, mot Stålvallen-vokabulären (LED, copper/steel, mono-data, mörk panel).

## Resultat — tre lager

### ✅ REDAN KONSISTENTA — event-interaktioner
`CornerInteraction`, `PenaltyInteraction`, `FreeKickInteraction`, `CounterInteraction`, `LastMinutePress` bygger alla på **`InteractionShell`** (BATCH B/D). De har redan rätt språk:
- LED-tagg-ikon, mono-titel + minut, ring/tag-timer (amber→red)
- SVG-plan i LED-palett (amber egen, röd försvarare, steel-blå MV, grön vald zon)
- Mono-knappar (HÅRT/LÅGT/KORT), copper/danger CTA
- `riskRow`, `coachTip` med avatar

**Mekaniken orörd, designen klar.** Inget att göra här — de matchar den nya MatchLive-headern.

### 🟧 HALVTIDSMODAL — mid-vintage, behöver Spak A-wiring
`HalftimeModal` har redan halvtidsval (`calm/angry/tactical`) + taktik + byten + bästa spelare. Men:
- **Designen är äldre** än Stålvallen-eventytorna — bör anpassas till samma mörka panel-språk.
- **Spak A (paussnack → postBreakUrgency)** från motorkänsla-mocken ska wiras in här: valet ska visa **förväntad riktning på 2H-MomentumBaren** (mini-preview), inte bara sätta en flagga. Loopen val→konsekvens.
- Den är den naturligaste platsen för agens-spaken — den finns redan i flödet.

### 🟥 TVÅ MODALER PÅ GAMLA LJUSA SYSTEMET — sticker ut
**`TacticChangeModal`** (snabbändring under match) och **substitutions-flödet** använder fortfarande:
- `--bg-surface` (ljust papper), `.btn-ghost`, `--border` — **fel kontext.** Mitt i en mörk LED-matchvy poppar en ljus pappersmodal upp. Bryter immersionen helt.
- TacticChangeModal: 4 knappar i ljus grid. Ska vara mörk panel, mono-knappar, copper-accent — samma som InteractionShell-CTA:erna.

## Åtgärd

| Yta | Status | Åtgärd |
|---|---|---|
| Corner/Penalty/FreeKick/Counter/LastMinute | ✅ Klara | Inget |
| HalftimeModal | 🟧 | Anpassa till mörk panel + wira Spak A (bar-preview) |
| TacticChangeModal | 🟥 | Bygg om till mörk Stålvallen-panel, mono-knappar |
| SubstitutionModal | 🟥 | Samma — mörk kontext, ej ljust papper |

De två 🟥 är de viktigaste: en ljus modal mitt i den mörka matchvyn är det enda som faktiskt bryter helheten. Mock följer.

— Design-Claude, 2026-06-07
