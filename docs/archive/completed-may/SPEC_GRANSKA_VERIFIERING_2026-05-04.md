# SPEC_GRANSKA_VERIFIERING_2026-05-04 (REVIDERAD)

**Datum:** 2026-05-04 (revidering kväll efter Code:s diagnos)
**Författare:** Opus
**Status:** Spec-klar för Code
**Beroende:** SPEC_GRANSKA_OMARBETNING (formellt levererad — i praktiken EJ levererad enligt `docs/diagnos/2026-05-04_kvar_audit.md`). SPEC_SHOTMAP_OMARBETNING (samma situation).

**Bakgrund:** Code:s diagnos 2026-05-04 visade att SPEC_GRANSKA_OMARBETNING aldrig integrerades i UI — `granskaEventClassifier.ts` finns men importeras aldrig, `ReaktionerKort` finns inte ens som fil. SPEC_SHOTMAP_OMARBETNING visade samma mönster — halvcirkel-paths aldrig levererade, original-rektangulär kod kvar. Denna spec är en **full implementation från noll**, inte en komplettering.

---

## Princip för denna spec

Inget fusk. Inget skjuts på. Specerna SPEC_GRANSKA_OMARBETNING och SPEC_SHOTMAP_OMARBETNING ska **faktiskt levereras**, vilket de inte gjorts trots ✅-statusen.

Faserat upplägg är OK — men varje fas innebär verklig leverans, inte placeholder.

---

## Faser

### FAS 0 — Process-fix (Opus + Code, 0 dagars Code-arbete)

Innan kod skrivs:

1. Opus skickar `docs/diagnos/2026-05-04_kvar_audit.md` till Code för läsning
2. Code bekräftar att hen läst auditen och förstår process-fix A/B/C/D
3. Code lovar att inte rapportera "klart" på spec-nivå utan UI-verifiering med skärmdump

Detta är inget kodsteg. Det är ett kontraktssteg.

---

### FAS 1 — SPEC_SHOTMAP_OMARBETNING (full implementation från noll)

**Mål:** Shotmap implementeras enligt `docs/mockups/shotmap_mockup.html` bokstavligen.

**Steg:**

1. **Reverta Opus symptomfix från 2026-05-04** i `GranskaShotmap.tsx`:
   - Streckad mittlinje borttagen
   - "MOTSTÅNDARMÅL"/"VÅRT MÅL"-etiketter borttagna
   
2. **Implementera enligt mock:**
   - viewBox: `0 0 280 230` (inte 210)
   - Halvcirkel-paths för målgård (radie 22): `<path d="M 118 4 A 22 22 0 0 1 162 4" fill="none" stroke="rgba(0,0,0,0.28)" stroke-width="1"/>` för topzon, motsvarande spegelvänd för bottenzon
   - Halvcirkel-paths för straffområde (radie 75): `<path d="M 65 4 A 75 75 0 0 1 215 4" ... />` för topzon, motsvarande för bottenzon
   - Mittseparator: grå rect `<rect x="0" y="100" width="280" height="30" fill="rgba(0,0,0,0.07)"/>`
   - Riktningspilar i separator-rect: `<text x="14" y="119" font-size="8" fill="rgba(0,0,0,0.65)" font-weight="700" letter-spacing="0.8">↑ VI ANFALLER</text>` + motsvarande höger för "DE ANFALLER ↓"
   - Straffpunkt: `<circle cx="140" cy="57" r="1.5" fill="rgba(0,0,0,0.3)"/>` — 12m från mål, 53px ner i zonen
   - Behåll prick-rendering (mål gröna, räddade copper, miss grå) men kalibrera y-värden mot ny zon-geometri

3. **Verifiering:** Pixel-jämförelse app vs mock i 430px. Skärmdumpar i `docs/sprints/SPRINT_FAS_1_SHOTMAP_AUDIT.md`. Eventuella avvikelser dokumenteras med skäl.

4. **Stats clarity (Fix D från ursprungsspec):**
   - "Säsongen (3 matcher)" → tydliggör vilka matcher räknas. Förslag: "Hittills i serien (X matcher)" om bara liga, "Hittills (X matcher)" om alla.
   - "44% ▼" → ta bort pilen om jämförelsetalet är otydligt. Visa bara "44%". Om jämförelse är tydlig (t.ex. förra match), skriv ut: "44% (förra: 52%)".
   - "75% konv." för motståndaren → byt etikett till "skotteff." eller "träffsäkerhet". Eller: ändra beräkningen till mål/totala skott (43% i exemplet) och behåll "konv.".

**Estimat:** 1 dag Code + 0.5 dag verifiering = **1.5 dagar**.

**Stop-punkt:** Jacob playtestar shotmap i webbläsaren. Bekräftar att implementationen matchar mocken. Först då går vi till Fas 2.

---

### FAS 2 — SPEC_GRANSKA_OMARBETNING (full implementation från noll)

**Mål:** Granska följer specens uppmärksamhetsekonomi-modell. Övre cap på events. Reaktioner-kort. "KRING SPELARNA" i Spelare-flik. Migration av media/insändare/quote till `pendingEvents`.

**Förarbete:** Code läser SPEC_GRANSKA_OMARBETNING.md från originalet. Behandlar den som *aldrig levererad*.

**Steg:**

1. **Verifiera classifier-implementationen:**
   - `granskaEventClassifier.ts` finns. Verifiera att den klassificerar enligt specens tre kategorier (CRITICAL, PLAYER, REACTION).
   - Lägg till saknade event-typer baserat på playtest-fynd:
     - `pressConference` → CRITICAL
     - `contractRequest` → CRITICAL
     - `recruitmentEvent` (Rekrytera funktionärer) → REACTION eller INBOX
     - `tifoEvent` (Sara och tifon) → REACTION
     - `refereeMeeting` (Domarens locker room) → REACTION

2. **Bygg `ReaktionerKort.tsx`:**
   - Plats: `src/presentation/components/granska/ReaktionerKort.tsx`
   - Visar `REACTION`-events från `pendingEvents` filtered för aktuell match
   - Auto-resolved vid render — events markeras `resolved: true` när kortet mountas
   - Stil: card-sharp, sektionslabel "💬 KRING MATCHEN", lista av reactions med kort body + källa
   - Max 5 reactions visas (om fler finns: "+ 2 till" expanderbart)
   - Inga klickbara val — det är read-only reaktioner

3. **Bygg "KRING SPELARNA"-sektion:**
   - I `GranskaSpelare.tsx`, lägg till sektion överst
   - Visar `PLAYER`-events från `pendingEvents` filtered för aktuell match
   - Card-sharp per spelar-event, klickbara om det finns val (kontraktsförfrågan, etc), annars read-only

4. **Migration av media/insändare/quote:**
   - `generateInsandare`, `generatePostMatchOpponentQuote`, `generateSilentMatchReport` *anropas redan i Granska direkt*
   - Migrera så att de istället genereras via `postMatchEventService.ts` → läggs i `pendingEvents` → renderas av `ReaktionerKort` (för insändare/quote) eller behåller sin nuvarande plats (silent match report)
   - Verifiera att `postMatchEventService.ts` faktiskt anropas i `roundProcessor`

5. **Cap på kritiska events i Översikt:**
   - I `GranskaOversikt.tsx`, importera `granskaEventClassifier`
   - Filtrera `pendingEvents` på `classifyEventNature(event) === 'critical'`
   - Applicera `.slice(0, 3)` — max 3 kritiska visas inline
   - Resterande critical events stannar i `pendingEvents` och plockas upp i Portal nästa runda
   - Hänvisning till Spelare-flik om PLAYER-events finns: "X spelar-händelser i Spelare-fliken"
   - Hänvisning till Inboxen om INBOX-events finns: "X notiser i Inboxen"

6. **Dubbel presskonferens-fix (Fix A från ursprungsspec):**
   - Code:s diagnos identifierade rotorsaken: `generatePressConference` anropas i två filer
   - Fix: ta bort anropet från `postAdvanceEvents.ts`. Behåll i `matchSimProcessor`.
   - Verifiera att presskonferens fortfarande genereras (men bara en gång per match per journalist).

7. **Knappstil i händelse-kort på Portal (Fix B):**
   - I `EventCardInline.tsx`, justera knapp-stil:
     - `border-radius: 999px` (pill) eller `16px`
     - `padding: 8px 16px`
     - `font-size: 13px`
     - Bakgrund `var(--bg-elevated)` istället för rent vit
     - `display: inline-flex` med `flex-wrap: wrap` på containern, eller fullbredd med tonad bakgrund
     - Aktiv val: `var(--accent)` bakgrund, `var(--text-light)` text
   - Mock vid behov: `docs/mockups/event_card_buttons_mockup.html` — Opus producerar om Code är osäker

8. **"2 saker till att kolla"-länk (Fix C):**
   - Code dokumenterar i diagnos vad länken faktiskt gör idag
   - Default-fix: ändra texten till "X notiser i inboxen" så det inte impliserar action
   - Alternativt: länka till annan plats där spelaren kan agera (om det finns sådan)

9. **CTA-blockering enligt spec:**
   - Granska CTA "Klar — nästa omgång" får bara blockeras av `critical`-events (+ presskonferens + domarmöte enligt original-spec)
   - Reaktioner-kort blockerar aldrig
   - Spelar-events blockerar bara om de är `critical` (kontraktsdeadline etc)

**Estimat:** 4 dagar Code + 0.5 dag verifiering = **4.5 dagar**.

**Stop-punkt:** Jacob playtestar Granska efter både cup-match och seriematch. Verifierar:
- Max 3 kritiska events i Översikt
- Reaktioner-kort syns med media/insändare/quote
- Spelare-flik har "KRING SPELARNA"-sektion
- Inga dubbla presskonferenser
- Knappstil i händelse-kort matchar förslag
- CTA blockeras bara av kritiska events
- Skottbild-stats är begripliga

---

### FAS 3 — SPEC_BESLUTSEKONOMI Steg 1-3 audit (parallellt med Fas 2 om Code har bandbredd)

**Mål:** Bekräfta att Steg 1-3 fungerar i playtest innan Steg 4 påbörjas.

**Steg:**

1. Code skriver `docs/diagnos/2026-05-04_beslutsekonomi_steg_1_3_audit.md` med:
   - Är `currentMatchday`-fältet faktiskt satt? (Sätt brytpunkt eller logga)
   - Är `attentionRouter.getCurrentAttention()` anropad i Portal? Vad returnerar den i en typisk omgång?
   - Är `eventQueueService.getNextEvent()` anropad? Vad är `getQueueStats()` i en typisk save?
   - Är `EventCardInline` faktiskt renderat i Portal för normal-events?
   - Är `MAX_ATMOSPHERIC_PER_ROUND = 2` faktiskt applicerat? Eller släpper den genom alla låg-prio events?
   - Är `low`-prio events som överskrider cap faktiskt routade till inbox?

2. Om något inte fungerar enligt spec: rapportera, sen Opus avgör om fix krävs eller om Steg 4 kan börja ändå.

**Estimat:** 0.5 dag Code-audit. Eventuella fixar separat.

**Stop-punkt:** Audit-rapport till Opus. Beslut om Steg 4 kan starta.

---

## Process-fixar (parallellt)

Dessa är inte kod, men måste vara på plats innan vidare arbete:

### A) "✅ LEVERERAD" får inte sättas utan UI-verifiering

KVAR.md får två separata statusar:
- `🔄 KOD KLAR` — Code rapporterar klart, ej playtestat
- `✅ LEVERERAD` — Jacob har playtestat och bekräftat

Opus uppdaterar KVAR.md vid nästa sessionsstart med denna distinktion.

### B) Pixel-audit-rapport per UI-spec

För varje spec som rör visuell yta, Code skapar `docs/sprints/SPRINT_XX_PIXEL_AUDIT.md` med skärmdumpar app + mock sida vid sida. Inget ✅ utan rapport.

### C) Audit av tidigare ⚠️-rader vid sessionsstart

Vid varje sessionsstart, gå genom KVAR.md och plocka `⚠️ Awaiting browser-playtest`. Jacob playtestar dessa specifikt.

### D) "Importerad i renderad komponent"-check

För varje ny service i `src/domain/services/`, Code visar i leveransrapport: "Importerad i: `[komponentnamn].tsx`". Om "ingenstans" → specen är inte levererad.

---

## Vad detta INTE är

- **Inte cap-shortcut.** Reaktioner-kort, classifier, "KRING SPELARNA"-sektion ska byggas på riktigt — inte ersättas av en enkel `slice(0, 3)`.
- **Inte ny arkitektur.** SPEC_GRANSKA_OMARBETNING är giltig. Vi implementerar den, inte ersätter den.
- **Inte fas-skjut.** Allt levereras. I rätt ordning.
- **Inte sista chansen.** Process-fixar A-D ska förhindra att samma sak händer igen.

---

## Verifieringsprotokoll

### Per fas

1. `npm run build && npm test` — alla tester gröna
2. Skärmdump app vs mock i 430px (om visuell ändring) → SPRINT_FAS_X_PIXEL_AUDIT.md
3. Code visar "Importerad i: X.tsx" för varje ny service
4. Jacob playtestar i webbläsaren
5. SPRINT_AUDIT.md med "Verifierat i UI"-noteringar
6. Opus klassar som ✅ LEVERERAD eller 🔄 KOD KLAR baserat på playtest-utfall

### Vid sessions-slut

KVAR.md uppdateras med:
- Nya `🔄 KOD KLAR`-rader för det Code levererat
- `✅ LEVERERAD`-rader bara för det Jacob bekräftat i playtest
- `⚠️ Awaiting browser-playtest` strykning för det som verifierats

---

## Slut SPEC_GRANSKA_VERIFIERING_2026-05-04 (reviderad)
