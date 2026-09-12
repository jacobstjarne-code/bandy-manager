# DOM (GRÄNS) — JOURNALIST.MEMORY + EFTERKLANG: löst av redan fattade domar

**Datum:** 2026-09-02 · **Av:** Opus · **Utlöst av:** Codex liggar-inventering, prio-3: journalist.memory ("cache OCH relationsminne, kan inte vara båda") + Efterklang ("gled från presentationsyta till minnesmäklare som avgör historisk sanning ur åtta fickor"). **Slutsats efter kodläsning: bägge är SAMMA gräns som storyline-domen redan ritade — ingen egen tung dom, de stängs mot befintliga beslut.**

## Kodläst: Efterklang ÄR en minnesmäklare, men det är källorna som är problemet
`pickEfterklang` läser ÅTTA fickor (anniversaries, klackEcho, `journalist.memory`, bandyLetters, boardObjectiveHistory, nemesisTracker, economicCrisisState, lastRivalSale), rankar, visar. **Det är rätt roll för en presentationsyta — LÄSA vad som hänt och visa det. Problemet är inte att den läser; det är att de åtta fickorna INTE är kanon (liggaren), så Efterklang blir en ad-hoc-aggregator av spridd state i stället för en projektion av EN sanning.**

**Dom: Efterklang behöver INGEN egen dom.** När dess källor migrerats till liggaren (prio 1-2 i `SPEC_LIGGARE_MIGRERING_PRIORITERAD`), blir Efterklang automatiskt en ren PROJEKTION: läser liggaren, filtrerar på recency, rankar, visar. Rollen (presentationsyta) är redan rätt; den fixas av att källorna blir kanon, inte av att röra Efterklang. → ingen åtgärd på Efterklang själv; följer med prio-1-2.

## journalist.memory: splitten är samma som storylines (fältet, inte systemet)
Kodläst (`Narrative.ts`):
- **`memory: []` (last 10)** = COOLDOWN-cache — vilka interaktioner visades nyligen (Efterklang-premissen). **STANNAR** — presentations-recency, inte historia (narrativeBeatLog-gränsen: "har vi visat X nyligen").
- **`relationship: number` (0-100)** = live-värde. **STANNAR** — numeriskt livevärde (gränsdomen: boardPatience/licensrisk/happiness migreras aldrig).
- **Relationens TRÖSKELKORSNING (feud/redemption)** = kanon-händelse. **REDAN LÖST:** pressbågen (`DOM_PRESSBAGEN_STEG23`) skriver en `journalist_feud`/`journalist_redemption`-storyline vid korsning, och `DOM_STORYLINES_GRANS` gör den storylinen till en `storyline_resolution`-liggarpost vid resolution. Så journalist-KANON-frågan är redan täckt av två domar.

**Dom: journalist.memory behöver ingen ny dom.** cache + relationship STANNAR (rätt lager), kanon-händelsen (tröskelkorsning) går redan till liggaren via press-storylinen. Det enda Code ska: bekräfta att cache/relationship INTE migreras (de är inte förliggare — de har rätt roll), och att `c-sy1-pilot2-journalistmemory`-radens "beständiga journalisthändelse saknar liggarspår" LÖSES av storyline-domens resolution-skrivning, inte en separat journalist-migrering.

## DEN SAMLANDE INSIKTEN
De tre prio-3-"rollkollisionerna" (storylines, journalist, Efterklang) är EN gräns tre gånger:
1. **Aktiv/cache-state STANNAR** (storyline `resolved:false`, journalist.memory-cache, relationship-livevärde).
2. **Kanon-HÄNDELSEN går till liggaren** (storyline-resolution, journalist-tröskelkorsning via press-storyline).
3. **Presentationsytan (Efterklang) blir en PROJEKTION av kanon** när källorna migrerats.
Ingen av dem kräver en egen tung dom. `DOM_STORYLINES_GRANS` + prio-1-2-migreringen löser alla tre. Codex såg tre problem; det var ett mönster.

## SKYDDAT
- **cache/relationship/live-värden migreras ALDRIG** — de har rätt roll (cooldown/numeriskt livevärde). Att "modernisera" dem till liggaren vore överreaktion, precis det gränsdomen varnar för.
- **Efterklang rörs inte direkt** — den blir ren projektion av att källorna migreras, inte av en egen ombyggnad.

## ÄGARSKAP
Code: (1) bekräfta journalist.memory-cache + relationship STANNAR (ej förliggare), (2) stäng `c-sy1-pilot2-journalistmemory` mot storyline-resolution-skrivningen (`DOM_STORYLINES_GRANS`), (3) Efterklang blir projektion automatiskt när prio-1-2-källor migrerats — ingen egen åtgärd. Opus: prio-3 är HÄRMED KLAR (storylines dömd, journalist+Efterklang stängda mot befintliga domar). Jacob: inget beslut — allt följer redan fattade gränser.

## Implementationsnot 2026-09-04

Den senare `SPEC_BERATTAREN` gjorde projektionen explicit som steg 6. `pickEfterklang` rankar nu canonical årsdagar, ekonomiska beslut, rivalförsäljningar och journalistens feud/redemption genom den gemensamma agendan och kvitterar faktisk visning. Domen ovan består: `journalist.memory` är fortsatt presentationscache och `relationship` fortsatt livevärde; de har inte flyttats till liggaren. Klack, brev och nemesisstate ligger av samma skäl kvar tills en säker kanonisk källa finns.
