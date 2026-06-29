# SPEC — Matchhall-prövningen (B1 §5 mekanik-låsning)

> ⚠️ **ÖVERSPELAD 2026-06-19.** Denna spec skrevs utan kännedom om att en KOMPLETT design redan fanns från 06-12: `SPEC_MATCHHALL_PROVNING_2026-06-12.md` (mekanik, `HallTrial`-stages, EN stödmätare med grundad formel, Själ-priset i §5) + `TEXTPOOLER_PROVNING_2026-06-12.md` (färdig text, "integrera ordagrant") + Design-mock (`docs/incoming/2026-06-12_design_provning_processteg (1).html`). Denna 06-19-spec byggde en PARALLELL, sämre modell (tre stöd-axlar ist. f. en, diskreta event ist. f. hub, påhittad kravMultiplikator ist. f. finansieringsvägar) — ingen supersede, bara att jag inte läste källan. **Den gällande designen är 06-12-triaden.** Code-omarbetet böjer maskinen tillbaka dit (`docs/CODE_UPPDRAG_HALLPROVNING_OMARBETE_2026-06-19.md`). Behåll denna fil som historik över felet, bygg INTE mot den.

**Datum:** 2026-06-19
**Från:** Opus (mekanik-spec; Code implementerar; Opus skriver scentext EFTER att mekaniken är låst här)
**Status:** Mekaniken låst i denna spec. Scentext/röster = separat Opus-runda när Code byggt tillståndsmaskinen. Mock = Design EFTER båda.
**Källor lästa 2026-06-19:** `hallDebateData.ts`, `hallDebateService.ts`, `hallDebateEvents.ts`, `politicianService.ts`/`politicianData.ts`, `facilityNodes.ts` (matchhall-noden), `Community.ts` (FacilityState, LocalPolitician, NodeFinancing).

---

## Problemet (verifierat mot kod)
Matchhallen finns som nod (`facilityNodes.ts`: `id: 'matchhall'`, `cost: 1_800_000`, `buildRounds: 20`, `requires: ['laktare_ostra']`, `isHall: true`, ingen `financing`). `canStartBuild` returnerar `hall_kräver_prövning` för den — så noden KAN inte byggas direkt. Det är meningen: prövningen är grinden.

Men prövningen finns inte som process. Det som finns är **två konkurrerande debattgeneratorer som inte vet om varandra:**
- `hallDebateService.ts` — pool-väljare på politiker-agenda/boardPatience, cooldown 8, max 3/säsong. **Alla val mappar till `noOp` — konsekvensfria.**
- `hallDebateEvents.ts` — en ANNAN generator, fasta rundor 3/9/15, triggar på `hasIndoorRival`, mappar faktiska effekter (politicianRelationship/fanMood/finances/facilitiesUpgrade).

Båda producerar lösa engångsevent utan minne av varandra. Ingen av dem är en väg fram till bygget. Det finns inget tillstånd i `FacilityState` som vet "vi är i förankringsfasen". Specens gaffel (06-11 §5) — förankring → krav → kommun → bygge, varje steg ett vägval med pris — existerar inte.

## Vad detta ersätter (städning, inte tillägg)
De två debattgeneratorerna konsolideras till EN process med tillstånd. Den rika textdatan i `hallDebateData.ts` (HALL_DEBATE_EVENTS, BOARD_HALL_QUOTES, HALL_NEWS_*) ÅTERANVÄNDS — den är bra och redan skriven. Det som ersätts är de två generatorerna (`hallDebateService.ts` + hall-delen av `hallDebateEvents.ts`), inte datan. Annandagsbandyn i `hallDebateEvents.ts` är orelaterad — rör den inte.

---

## Mekaniken (det Code bygger)

### Nytt tillstånd: `FacilityState.hallProcess`
Lägg på `FacilityState` i `Community.ts` (optional — undefined = prövningen ej påbörjad, ingen migration):

```ts
hallProcess?: {
  phase: 'forankring' | 'krav' | 'kommun' | 'godkand' | 'nekad'
  startedSeason: number
  // ackumulerat stöd per kraftblock — varje fas läser/skriver dessa
  klackStotta: number       // klackens/Västra Sidans stöd, 0-100, börjar ~50
  styrelseStotta: number    // styrelsens stöd, 0-100
  kommunStotta: number      // kommunens vilja, 0-100, gated på politiker
  // finansieringslöfte som byggts upp genom processen (krävs för att nå 'godkand')
  kommunAndel: number       // 0-1, kommunens utlovade andel av 1,8 mkr
  patronBorgen: boolean     // har en patron gått i borgen?
  lastStepRound: number     // cooldown mellan steg
}
```

Faserna är en **sekvens med en gaffel i varje** — inte en linjär trappa. Man kan fastna, backa, eller nekas.

### Fas 1 — Förankring (klacken + styrelsen)
**Trigger:** `laktare_ostra` byggd (hallens `requires`) + `hasIndoorRival` (en rival har hall — finns i `hallDebateEvents`-logiken) + ingen `hallProcess` än + säsong ≥ 2. Då kan första förankrings-eventet dyka upp (cooldown-styrt, som dagens debatter).

**Vägvalet:** spelaren möter klacken och styrelsen (texten finns: `HALL_DEBATE_EVENTS.styrelseSplittrad`, `BOARD_HALL_QUOTES.supporter/traditionalist`). Valen flyttar `klackStotta` och `styrelseStotta` mot varandra — stötta klacken (utomhusidentiteten) höjer `klackStotta`, sänker processens framdrift; stötta moderniseringen tvärtom. **Priset är reellt:** att driva hallen mot klackens vilja sänker `klackStotta` permanent, vilket är förladdningen till hallnodens `sjal: ned` ("Västra Sidan i öppet brott"). Konsekvensen byggs här, inte vid bygget.

**Utgång:** när `styrelseStotta` ≥ tröskel (förslag 60) OCH spelaren aktivt valt att gå vidare → `phase: 'krav'`. Klacken kan vara emot — det stoppar inte processen, det laddar själ-kostnaden.

### Fas 2 — Krav (förbundet)
**Vägvalet:** förbundet ställer krav för att en hall ska godkännas för seriespel (publikkapacitet, is-standard, säkerhet). Detta är mest informativt + en kostnadsförankring: kraven kostar pengar att möta och höjer den effektiva prislappen. Spelaren väljer ambitionsnivå (minsta godkända / framtidssäkrad), vilket sätter en multiplikator på `matchhall.cost` senare.

**Utgång:** krav accepterade → `phase: 'kommun'`.

### Fas 3 — Kommunförhandling (politiker)
**Det tyngsta steget, gated på `game.localPolitician`.** Använd de fält som finns: `agenda` (`infrastructure`/`prestige` = naturligt välvillig; `savings` = motståndare; `youth`/`inclusion` = ljummen), `relationship`, `generosity`, `corruption`, `mandatExpires`. Mönstret för hur kommunen bidrar med pengar finns i `calculateKommunBidrag` — återanvänd dess logik-form (agenda-bonus, relations-bonus, generosity-mod) men för en ANDEL av hallkostnaden, inte ett årsbidrag.

**Vägvalet:** spelaren förhandlar. `kommunStotta` byggs av relationship + agenda-match + ev. eftergifter (namnrättigheter, ungdomsplatser, kommunalt inflytande). Eftergifter höjer `kommunAndel` men kan kosta själ/självständighet. En `savings`-politiker kräver mer; en `infrastructure`-politiker med hög relation kan erbjuda upp mot halva kostnaden. **Patron som joker:** om en aktiv villig patron finns (`game.patron`, `isActive`, jfr mecenat-villkoret i NodeFinancing) kan spelaren be patronen gå i borgen — `patronBorgen: true` — vilket täcker glappet om kommunen inte räcker, men binder patronen (patience-kostnad, demand).

**Utgång — gaffeln stänger:**
- `kommunAndel` + ev. `patronBorgen` täcker glappet mellan klubbens kassa och (kostnad × kravmultiplikator) → `phase: 'godkand'`. Hallnoden låses upp: `canStartBuild('matchhall')` ska nu returnera `ok` (lägg `hallProcess?.phase === 'godkand'` som villkor i `canStartBuild`-grenen för `isHall`). Spelaren bygger via vanliga bygg-flödet (`startFacilityBuild`), kostnaden dras netto efter kommunandel.
- Kommunen säger nej och ingen patron-borgen → `phase: 'nekad'`. Processen kan återupptas nästa säsong (ny politiker efter `mandatExpires`, eller förbättrad relation). `nekad` är inte permanent — det är "inte i år".

### Gaten i `canStartBuild`
Idag: `if (def.isHall) return { ok: false, reason: 'hall_kräver_prövning' }`. Ändra till: `if (def.isHall && state.hallProcess?.phase !== 'godkand') return { ok: false, reason: 'hall_kräver_prövning' }`. När prövningen är godkänd faller hallen tillbaka på vanliga bygg-reglerna (kräver `laktare_ostra`, ingen aktiv build, etc).

---

## Vad Code bygger (sammanfattat)
1. `FacilityState.hallProcess` på `Community.ts` (optional, ingen migration).
2. EN `hallProcessService.ts` som ersätter `hallDebateService.ts` + hall-delen av `hallDebateEvents.ts` (behåll annandagsbandyn). Fas-maskin med trigger/cooldown/utgångar enligt ovan. Återanvänder `HALL_DEBATE_EVENTS`-texten + `BOARD_HALL_QUOTES` + politiker-fälten + `calculateKommunBidrag`-logikformen.
3. Gate i `canStartBuild` (`isHall` + `hallProcess.phase === 'godkand'`).
4. Ta bort de två gamla generatorerna ur sina anropssiter (verifiera anropare först — `eventProcessor`/`roundProcessor`).

## Vad Code INTE bygger (Opus/Design efter)
- **Scentexten för de tre faserna** — vägvalens repliker, kommunförhandlingens dialog, patron-borgen-scenen, nekad/godkänd-utfallen. Opus skriver när tillståndsmaskinen finns att skriva mot (samma princip som Valet: text mot verklig struktur, ej gissad). Befintlig `hallDebateData`-text är råmaterial men täcker inte de nya fas-utgångarna.
- **Mock för prövnings-UI** — Design, efter att mekanik + text finns. Gaffeln har en egen yta i B1-ytbriefen (06-11) men den mockas sist.

## Öppna avvägningar (Code flaggar om de skaver, annars Opus-beslut vid texten)
- Trösklarna (styrelseStotta 60, kommunStotta-formel, kravmultiplikator-spann) är förslag — balanseras mot ekonomimodellen, troligen efter Eriks playtest. Spec-värden, ej låsta.
- `kravmultiplikator` på 1,8 mkr: håll spannet snävt (förslag 1,0–1,4) så hallen förblir en flerårig sträckning men inte omöjlig. Verifiera mot vad en etablerad klubbs kassa+kommunandel realistiskt når.
