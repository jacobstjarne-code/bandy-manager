# SPEC — Klubb-fliken: engagemang-dubbel-UI + anläggnings-pekare

**Datum:** 2026-06-20
**Upphov:** incoming-genomgång fil 19–20 (`AUDIT-KLUBB-TRANSFERS` Del 1 + 2, Fable 06-09), verifierat mot källan 2026-06-20.
**Status:** TVÅ öppna fynd. Del A = bekräftad bugg + designbeslut (Jacob/Opus). Del B = stale pekare + modellfråga (Code-utredning).
**Avgränsning:** `EkonomiTab.tsx`, `OrtenTab.tsx`, `AkademiTab.tsx`, `economyService.ts`, `politicianService.ts`.

Auditens övriga Klubb-punkter är avförda mot källan: #1 masthead (`GameHeader` läser `seasonSpanLabel`), #2 delad TabBar (`shared/TabBar.tsx`), #3 Tränare-sparkline-fallback (`MIN_POINTS`-gate), #4 EkonomiTab-CSS (`economy.css` + `.eco-*` byggt), #7 gold-läckage (frivillig-moral = success/accent/danger), #8 akademi-stjärnlegend (`★ = potential · CA = nuläge` finns). De byggdes/löstes innan genomgången.

---

## DEL A — `communityActivities` aktiveras från TVÅ flikar med motstridiga etiketter

### Fyndet (verifierat mot källan)

Samma `communityActivities`-flaggor bär aktivera-knappar i BÅDE `EkonomiTab` ("🎪 Föreningsaktiviteter") OCH `OrtenTab` ("ENGAGEMANG"). Tre nycklar överlappar med olika namn/kostnad:

| Nyckel | EkonomiTab | OrtenTab |
|--------|-----------|----------|
| `functionaries` | "🏋️ Funktionärer" (~4 000 besparing/match, *Rekrytera — 2 tkr*) | "🤝 Matchvärdar (2 tkr)" |
| `bandySchool` | "🏫 Bandyskola" (~1 000/omg) | "🏫 Bandyskola avancerad (5 tkr)" |
| **`bandyplay`** | **"📺 Streamingavtal"** (~1 500/match) | **"⛸️ Bandyskola för barn (gratis)"** |

Eftersom det är samma flagga tänds posten i båda flikarna när du aktiverar den i en. För `bandyplay` betyder det att "Streamingavtal" och "Bandyskola för barn" är samma sak — vilket de inte är.

### Bekräftad bugg: `bandyplay` är felmärkt i EkonomiTab

Källan avgör vad `bandyplay` ÄR:
- `economyService.calcRoundIncome`: deltagaravgifter per match (`250 + rand*250`, minus `1000` driftskostnad) + per omgång (`250 + rand*500 − 1000`). Deltagar-ekonomi, inte sändningsrättigheter.
- `politicianService`: `bandyplay` ger `agendaBonus` för agendorna **youth** och **inclusion** — dvs systemet räknar det som ungdomsverksamhet.
- `OrtenTab` + den politiska logiken är konsekventa: `bandyplay` = basal bandyskola för barn.

→ **EkonomiTab:s "📺 Streamingavtal"-etikett är fel.** (Kod-kommentaren i economyService säger missvisande "per-round streaming cost" — samma sammanblandning.) `bandyplay` ska heta bandyskola för barn överallt. `bandySchool` är den avancerade varianten (separat flagga, korrekt i båda).

Notera även kostnads-inkonsekvens: OrtenTab säger `bandyplay` "(gratis)", EkonomiTab visar löpande driftskostnad. Samma flagga, två kostnadsbilder.

### Beslut (Jacob 2026-06-20) — LÅST

**Modell 1 vald: två linser, EN aktiverings-punkt. EkonomiTab äger aktivera-handlingen; Orten visar engagemangs-status read-only.** Ekonomi = "vad kostar/ger det" (där pengabeslutet hör hemma), Orten = "vad gör det för bygden" (läses, aktiveras inte). Samma mönster som AkademiTab nu visar anläggning read-only.

**Code-order (nu en ren bygguppgift, inget beslut kvar):**
1. **Aktivera-knapparna för `communityActivities` bor ENBART i EkonomiTab.** Ta bort aktivera-knapparna ur OrtenTab:s ENGAGEMANG-sektion; låt den visa status read-only (Aktiv/Ej startad + kort effektläsning) med en pil till Ekonomi-fliken (samma `onNavigateTab`-mönster som redan finns).
2. **Ena etiketterna** över båda ytorna: `bandyplay` = "Bandyskola för barn" (ej "Streamingavtal"), `functionaries` = ETT namn, `bandySchool` = ETT namn. EN kostnadsbild per nyckel (inte "gratis" i Orten + driftskostnad i Ekonomi).
3. **Relabela `bandyplay`** + byt 📺-ikonen (Del A1, byggbar oavsett — men görs nu i samma svep).
4. Rätta economyService-kommentaren "per-round streaming cost" → "per-round bandyskola-drift".

### Tidigare Opus-rekommendation (nu ratificerad)

Modell 1 med aktivera i EkonomiTab var Opus-rek; Jacob godtog 2026-06-20.

---

## DEL B — AkademiTab:s anläggnings-kort pekar fel efter Orten-rensningen

### Fyndet (verifierat)

`AkademiTab` har ett read-only "🏗️ Anläggning"-kort som visar `Nivå {club.facilities}/100` och säger *"Uppgraderas via Orten-fliken."* Men Orten-rensningen (`eb2cf013`) tog bort Anläggnings-sektionen ur OrtenTab och flyttade den till Bygget-fliken (arena-noden i Ortskartan deep-linkar nu till `/game/bygget`). **Pekaren är stale** — du kan inte längre uppgradera anläggningen via Orten.

### Modellfråga (Code-utredning, Steg 0)

Kortet visar `club.facilities` (gamla 0–100-modellen). Det riktiga byggandet sker nu i B1-trädet (`facilityState.builtNodeIds`, FacilityScreen). Två frågor måste besvaras mot källan innan kortet rättas:

1. **Skriver något fortfarande `club.facilities`?** Grep skrivningar. Om Orten-rensningen tog bort den enda uppgraderings-actionen är `club.facilities` nu ett fruset legacy-tal utan väg uppåt.
2. **Föder B1-trädet `club.facilities`?** `advanceFacilityState` returnerar `facilitiesBonus` — når den `club.facilities`, eller är de två frånkopplade system? (Jfr `facilityCapacityBonus`-raden i BACKLOG: capacity-bonusen wirades till `arenaCapacity`; gör `facilitiesBonus` motsvarande till `club.facilities`?)

`club.facilities` läses fortfarande live (EkonomiTab: VIP-tält kräver `club.facilities > 60`; AkademiTab academy-text), så talet betyder något — frågan är om det uppdateras.

### Åtgärd (beror på utredningen)
- Om `club.facilities` är frusen legacy och B1-trädet är enda anläggnings-systemet: AkademiTab-kortet ska läsa B1-tillståndet (eller utgå), och VIP-tält-gaten (`club.facilities > 60`) måste flytta till en B1-nod-koll.
- Om `club.facilities` fortfarande lever och uppdateras: **minst rätta den stale pekaren** "Uppgraderas via Orten-fliken." → "Uppgraderas via Bygget-fliken." och verifiera att det finns en väg dit.

---

## Sammanfattning

| # | Fynd | Typ | Nästa |
|---|------|-----|-------|
| A1 | `bandyplay` felmärkt "Streamingavtal" i EkonomiTab | Bekräftad bugg | Relabela (efter modellval) |
| A2 | `communityActivities` dubbel-aktivera-UI Ekonomi+Orten | Designbeslut | **Jacob väljer ägande-flik**, sen Code |
| B | AkademiTab anläggnings-pekare stale + legacy `club.facilities` vs B1-träd | Stale + modellfråga | Code Steg 0: trace `club.facilities`-skrivningar + `facilitiesBonus`-väg |
