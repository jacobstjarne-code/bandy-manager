# SPEC — LIGGAR-MIGRERINGEN, PRIORITERAD (Codex producent-svep × Opus konsument-analys)

**Datum:** 2026-09-02 · **Av:** Opus · **Grund:** `DOM_LIGGARE_INVENTERING_METOD_2026-09-02` (metoden) + Codex producent-svep (kodläst katalog). Detta är RESULTATET korsat: förliggare-system → prioriterad byggkö. Codex svep B (producenter) × Opus svep A (konsument-lidande) = ordningen nedan. **Buggarna (dubbelpost + Efterklang-skala) ligger i egen order, ej här.**

## PRINCIPEN (från metoddomen, upprepad så Code inte överreagerar)
Migrera HÄNDELSER som en historie-konsument vill läsa månader senare. Migrera INTE cooldown/dedup/mätloggar/financeLog/numeriska livevärden — de har egen roll (Codex bekräftade gränsen håller). Dual-write-invarianten: skriv liggaren, behåll fickan tills sista läsaren flyttat, retire-last.

## PRIO 1 — förliggare vars konsument LIDER NU

### 1a. `clubMemory` re-härleder hela klubbhistorien vid läsning (STÖRSTA skulden)
`clubMemoryService.ts:263` återskapar historiken varje anrop ur ÅTTA fickor (matcher, dagböcker, storylines, hallstate, skandalloggar, m.fl.). Konsumenten (klubbkrönika/historik) lider mest: historien är inte kanon, den räknas om varje gång. **Migrera de källor som redan har deklarerade `EventLedgerType`-medlemmar** (Codex: akademi, landslag, pensionering, skandaler — "utan ny dom"). När en källa skriver liggaren, låt `getClubMemory` läsa DEN i stället för att re-härleda. Retire re-härledningen per källa när den flyttat.

### 1b. `Player.diary` kapad till 20 men matar PERMANENTA milstolpar (glömske-bugg i förklädnad)
`Player.diary` är `.slice`:ad till 20 poster men läses som källa till PERMANENTA milstolpar. Samma sjuka som `recentMoments.slice(0,5)` hade — en permanent milstolpe läst ur en 20-cappad ficka kan FÖRSVINNA. **Migrera milstolparna (`player_milestone` finns som typ) till liggaren, durabelt.** `Player.diary` kan förbli den cappade presentationsfickan; det är MILSTOLPS-läsningen som ska flytta till kanon.

## PRIO 2 — deklarerad liggartyp finns, INGEN dom, ren wiring (Code direkt)
Alla har `EventLedgerType`-medlemmar redan — skriv liggarposten vid händelsen, dual-write:
- **`facility_built`** (hallbygge) — `builtSeasons`-visningen finns, liggarskrivningen saknas.
- **akademiuppflyttning** — typ finns.
- **landslagsdebut** (`national_team_callup`) — typ finns. (Obs: landslags-FEATUREN är köad sist, men själva UTTAGNINGS-händelsen kan skrivas till liggaren nu — det är prio-2-wiring, inte featuren.)
- **pensionering** (`retirement`) — typ finns.
- **skandal** (`scandal`) — typ finns.
Stanna+flagga bara om en typ INTE passar (osannolikt — de är deklarerade).

## PRIO 3 — ROLLKOLLISION, kräver DOM först (Opus, en i taget, EJ Code än)
Dessa får INTE migreras blint — de gör flera saker och behöver en gränsdragning innan wiring:
- **storylines** — aktiv båge + historik + relationsärr + årsboksunderlag samtidigt. `storyline_resolution`-typen finns men ingen skrivare. Behöver dom: vilken del är kanon-händelse (→ liggaren) vs aktiv-state (→ stannar)?
- **journalist.memory** — både kapad närminnescache OCH permanent relationsminne. Kan inte vara båda tillförlitligt. Behöver dom: dela cache (cooldown-lagret) från relationshändelse (kanon).
- **Efterklang** (`pickEfterklang.ts:64`) — gled från presentationsyta till minnesmäklare som avgör historisk sanning ur åtta fickor. Behöver dom: den ska vara en PROJEKTION av kanon (läser liggaren), inte en egen sanningskälla.
Dessa tre är gränsdragnings-domar i samma familj som `DOM_LIGGARE_COOLDOWN_GRANS`. Opus skriver dem en i taget; INTE byggbara förrän dömda.

## PRIO 4 — döda/övergångssvansar (verifiera → retire, ej migrera)
Codex: `collectActiveMemories`, `seasonDecisionCandidates`, `pilotTransferBidRippleChain`, `pastSeasonSignatures` är döda eller övergångsmässiga, inte rollösa levande system. **`pilotTransferBidRippleChain`** specifikt: samma beslut fångas nu av liggaren → parity-kontroll → RETIRE, inte vänta på ny placering (`inv-2-21a`). De andra: verifiera ingen läsare → retire per fall (kanon-koll först, aldrig blind radering).

## SKA INTE MIGRERAS (Codex bekräftade, gränsen håller)
narrativeBeatLog (cooldown), resolvedEventIds/cursors/seen-flaggor (dedup), tränings-/taktik-/fitness-/resultatloggar (mätserier), financeLog (redovisning), boardPatience/licensrisk/patron-happiness (numeriska livevärden). Betydelsefulla ÖVERGÅNGAR kan höra i liggaren, inte varje numerisk ändring.

## MASTER-korrigeringar Codex flaggade (Code, dokhygien)
- `int-2-integrationsinventering` — inte klar på liggaraxeln (sponsor-specialresolvern lämnar tidigt, `eventResolver.ts:200`/`:284`, skriver ej liggaren). Åter-öppna.
- `c-sy1-pilot2-journalistmemory` — funktionellt klar, men beständig journalisthändelse saknar liggarspår. Hör till prio-3 journalist-domen.
- `clubmemory-facility-built-sasong` — visning klar, liggarskrivning ej (= prio 2 facility_built).

## ÄGARSKAP & ORDNING
1. **Code NU:** prio 2 (ren wiring, deklarerade typer) — snabbast, ingen dom.
2. **Code sen:** prio 1 (clubMemory-källmigrering + Player.diary-milstolpar) — större men grundat, ingen dom.
3. **Opus:** prio-3-domarna (storylines/journalist/Efterklang), en i taget, INNAN Code rör dem.
4. **Code opportunistiskt:** prio 4 (verifiera+retire).
Strangler hela vägen: inget massmigreras, prio-ordningen är "vilken konsument lider mest". clubMemory är roten; prio-2 är de billiga vinsterna; prio-3 väntar domar.
