# KVAR-audit 2026-05-04

**Trigger:** Codes diagnos av SPEC_GRANSKA_VERIFIERING_2026-05-04 visade att `granskaEventClassifier.ts` finns som fil men aldrig importeras i produktionskod, och att `ReaktionerKort` inte ens finns som fil — trots att SPEC_GRANSKA_OMARBETNING är markerad ✅ LEVERERAD i `docs/KVAR.md`.

Plus: SPEC_SHOTMAP_OMARBETNING markerad ✅ LEVERERAD i samma datum, men playtest 2026-05-04 visade att shotmap fortfarande är rektangulär — och Codes diagnos bekräftade att halvcirkel-paths aldrig levererades.

**Slutsats:** ✅ LEVERERAD-statusen i KVAR.md är inte att lita på. Auditerar systematiskt.

---

## Princip för auditen

För varje rad i KVAR.md som markerats ✅ LEVERERAD med `⚠️ Awaiting browser-playtest`:

1. Lokalisera de filer specen säger ska finnas/uppdateras
2. Verifiera att kod faktiskt nås från produktionsväg (importerad i komponent som renderas)
3. Kontrollera att specens beteende faktiskt produceras (inte bara att filer finns)
4. Klassa: `LEVERERAD` (verifierad), `DELVIS` (filer finns, integration saknas), `EJ LEVERERAD` (kod saknas eller är original)

Auditen täcker bara specer markerade ✅ från 2026-04-27 och framåt — det är tidsperioden där playtest-uppföljning saknas systematiskt.

---

## Verifierade specer

### SPEC_GRANSKA_OMARBETNING — **EJ LEVERERAD**

**KVAR säger:**
> generateInsandare + generatePostMatchOpponentQuote migrerade till pendingEvents via postMatchEventService.ts. granskaEventClassifier.ts: classifyEventNature, CRITICAL/PLAYER/REACTION_TYPES. ReaktionerKort (auto-resolved vid render), max 3 kritiska i Översikt, "KRING SPELARNA"-sektion i Spelare-flik. CTA blockeras bara av kritiska events.

**Verifikation:**
- `src/domain/services/granskaEventClassifier.ts` — FINNS som fil
- `src/domain/services/postMatchEventService.ts` — FINNS som fil
- `ReaktionerKort` — **FINNS INTE som fil** (sökt i `src/presentation/components/`)
- `GranskaOversikt.tsx` — importerar **inte** `granskaEventClassifier`. Importerar fortfarande `generateInsandare`, `generatePostMatchOpponentQuote`, `generateSilentMatchReport` direkt — vilket är gamla pre-spec-vägen
- Cap 3 — inte applicerad någonstans
- Migration av insändare/quote till `pendingEvents` — gjord på service-nivå men `GranskaOversikt` använder fortfarande direkt-anropen istället för `pendingEvents`-flödet

**Symptom i playtest:** 6 events visas i Översikt efter första seriematch (skärmdump 17:21). Specens cap (3) inte tillämpad. Reaktioner-kort syns aldrig.

**Slutsats:** Specen är skissad i kod men aldrig integrerad i UI. `GranskaOversikt.tsx` är opåverkad av specen.

---

### SPEC_SHOTMAP_OMARBETNING — **EJ LEVERERAD**

**KVAR säger:**
> Halvcirkel-geometri (målgård 22px, straffområde 75px) ersätter rektangulära boxar. "↑ VI ANFALLER" / "DE ANFALLER ↓" i separator-strecket. Label-klamring fixad. viewBox 210→230.

**Verifikation:**
- `src/presentation/screens/granska/GranskaShotmap.tsx` — viewBox `0 0 ${W} ${H}` med W=280, H=210 (mocken har H=230). **Avviker.**
- Halvcirkel-paths (`<path d="M 118 4 A 22 22 0 0 1 162 4">`) — **finns inte**. Koden använder `<rect>` för zoner.
- Riktningspilar (`↑ VI ANFALLER` / `DE ANFALLER ↓`) — **finns inte**. Kommentar i koden: `// No center line or full-pitch illusion — shows only what matters`. Det är original-implementationen, inte spec-implementationen.
- Mockfil: `docs/mockups/shotmap_mockup.html` finns och visar specens målbild.

**Plus:** Opus gjorde en symptomfix samma dag (2026-05-04) som lade till streckad mittlinje + flyttade etiketter — vilket *fjärmade* implementationen från mocken ytterligare. Den fixen ska revertas (dokumenterat i SPEC_GRANSKA_VERIFIERING_2026-05-04 Fix E + LESSONS #28).

**Slutsats:** Original-koden från före specen. Halvcirkel-implementationen aldrig påbörjad. Mock + spec finns och är giltiga referenser för ny implementation.

---

### SPEC_PLAYTEST_FIXES_2026-05-03 — **DELVIS LEVERERAD (ej fullt verifierad)**

**KVAR säger:**
> P5: Frågetecken-border. P2: shotsHome/Away vid hörn-/straffmål. P3: seenLabels-Set. P1.A: MATCH_GOAL_DIFFERENCE_CAP i interaktiva paths. P1.C: chaotic 1.55→1.35. P1.B: per-spelare ceiling. P4: hasCriticalEvent + EventPrimary priority='critical'-filter.

**Verifikation:** Inte fullt auditerat — symtomen från denna spec syntes inte i dagens playtest (annat än indirekt). LESSONS #26 och #27 är skrivna baserat på diagnoserna, vilket talar för att fixarna implementerades.

**Status:** Bekräftas vid nästa playtest. Lägg `⚠️ Bör verifieras vid nästa playtest` på raden i KVAR. Men tre av fixarna (P1.B, P1.C, P4) refereras i LESSONS som faktiskt implementerade — de är förmodligen levererade.

---

### SPEC_INLEDNING_FAS_2 — **TROLIGEN LEVERERAD**

**KVAR säger:**
> BoardMember/ClubBoard-interfaces på Club. Alla 12 CLUB_TEMPLATES patchade. Migration. BoardMeetingScene med 4 beats. 15 tester.

**Verifikation:**
- `src/domain/data/scenes/boardMeetingScene.ts` — finns och är aktiv (Opus fixade trigger-bugg samma session 2026-05-04)
- Scene triggar i playtest (Jacob bekräftade tidigare i sessionen)
- Texterna städades samma session (regi-språk borttaget)

**Status:** Skenbart levererad. Behöver final playtest-verifiering. Men trigger-buggen som Opus fixade idag (`currentSeason !== 1`-checken) avslöjar att specens implementation hade en uppenbar bug som fanns kvar i flera dagar utan att upptäckas — vilket är ett separat process-problem.

**Notering:** Ska Reaktioner-kort/granskaEventClassifier-typen falskdeklarerades, kan andra ⚠️-rader också vara falska. SPEC_INLEDNING_FAS_2 verifieras vid nästa playtest.

---

### SPEC_BESLUTSEKONOMI Steg 1-3 — **EJ AUDITERAT**

**KVAR säger:**
> Steg 1 diagnos. Steg 2: attentionRouter, eventQueueService, MAX_ATMOSPHERIC_PER_ROUND=2. Steg 3: eventActions, EventCardInline, PortalEventSlot. Overlay bara för critical, allt annat inline.

**Inget auditerat ännu.** Men relevant för Steg 4 — Steg 4 förutsätter att Steg 1-3 fungerar i playtest. Om något i Steg 1-3 också är falskdeklarerat blir Steg 4 ostadigt.

**Rekommendation:** Code auditerar Steg 1-3 *innan* Steg 4 påbörjas. Det är en del av läsningen av denna audit.

---

### SPEC_PORTAL_FAS_2_DRAMATURGI — **TROLIGEN LEVERERAD**

**KVAR säger:**
> SituationCard, PortalBeat, rikare secondary-kort. Slutliga Opus-texter inbakade. Tre logikfixar.

**Verifikation:** Portal/Dashboard fungerar i playtest 2026-05-04 (skärmdump 17:19) och Jacob noterade det positivt. Komponenter finns.

**Status:** Skenbart levererad.

**Notering KVAR säger:** "Pixel-audit SituationCard/PortalBeat: ⚠️ Ingen HTML-mock gjordes inför dessa. Formellt brott mot princip 4." Det är en separat fråga.

---

### EventCardInline-texter — **DELVIS LEVERERAD**

**KVAR säger två rader:**
1. "✅ Pooler levererade i `docs/textgranskning/...`. ⚠️ Awaiting Code-integration"
2. "✅ Integrerad commit `a075d8e` — pooler aktiva för starPerformance, playerPraise, captainSpeech."

**Verifikation:** Inte auditerat. Två motstridiga rader (en säger "Awaiting", en säger "Integrerad"). Behöver bekräftas.

---

## Sammanfattning per kategori

| Spec | Status |
|---|---|
| SPEC_GRANSKA_OMARBETNING | EJ LEVERERAD — ny implementation behövs |
| SPEC_SHOTMAP_OMARBETNING | EJ LEVERERAD — ny implementation behövs |
| SPEC_INLEDNING_FAS_2 | TROLIGEN LEVERERAD — verifieras vid playtest |
| SPEC_PLAYTEST_FIXES_2026-05-03 | DELVIS — verifieras vid nästa playtest |
| SPEC_BESLUTSEKONOMI Steg 1-3 | EJ AUDITERAT — kräver verifikation före Steg 4 |
| SPEC_PORTAL_FAS_2_DRAMATURGI | TROLIGEN LEVERERAD |
| EventCardInline-texter | DELVIS — motstridig info i KVAR |

---

## Process-insikt — varför händer det?

**Tre orsaker, samtidigt verksamma:**

1. **Code rapporterar "klart" innan UI-integration.** Att services + entitetsförändringar + tester finns räknas som "spec klar". Men om `granskaEventClassifier` inte importeras i en renderad komponent, så finns specen *inte i applikationen*. Detta är samma fenomen som LESSONS #4 ("klart" utan UI-verifiering missar luckor) — men på spec-nivå snarare än sprint-nivå.

2. **`⚠️ Awaiting browser-playtest` blir en parkering, inte en verifiering.** När en rad får ⚠️ i KVAR markeras den som "klar men obekräftad". Sen kommer en ny session, fokus på nästa spec, gamla ⚠️-rader kollas aldrig av. Sex dagar passerar. Specens fynd avslöjas först när Jacob playtestar i en helt annan kontext.

3. **Mock-driven design är skriven men inte verifierad i flödet.** Princip 4 i CLAUDE.md säger pixel-jämförelse är commit-blocker. Men det blockerar bara *om någon kollar*. När Code rapporterar klart och Opus inte själv pixel-jämför, är blockern teoretisk.

---

## Förslag — process-fixar

Inte ny dokumentation. Ändringar i existerande process:

### A) "✅ LEVERERAD" får inte sättas utan UI-verifiering

KVAR.md får två separata statusar:
- **`🔄 KOD KLAR`** — Code rapporterar klart, ej playtestat
- **`✅ LEVERERAD`** — Jacob har playtestat och bekräftat

`✅` får aldrig sättas utan playtest-bekräftelse. `🔄` är default när Code rapporterar.

### B) Pixel-audit-rapport per spec som påverkar UI

För varje spec som rör en visuell yta (shotmap, scen, kort, etc), Code skapar `docs/sprints/SPRINT_XX_PIXEL_AUDIT.md` med skärmdumpar app + mock i 430px sida vid sida. Inget ✅ utan rapport.

### C) Audit av tidigare ⚠️-rader vid sessionsstart

Vid varje sessionsstart, gå genom KVAR.md och plocka ut alla `⚠️ Awaiting browser-playtest`. Jacob playtestar dessa specifikt innan nya specer påbörjas. Ackumulering förhindras.

### D) "Importerad i renderad komponent"-check som del av leverans

För varje ny service i `src/domain/services/`, Code visar i sin leveransrapport: "Importerad i: `[komponentnamn].tsx`". Om svaret är "ingenstans än" → specen är inte levererad, oavsett vad service-filen innehåller.

---

## Vad detta INTE är

- Inte en omskrivning av process-filer (CLAUDE.md, KVAR.md). Förslag på ändring, men implementeras separat.
- Inte en kritik av enskilda Code-leveranser. Pattern-problem, inte personligt problem.
- Inte komplett audit. SPEC_BESLUTSEKONOMI Steg 1-3, EventCardInline, SPEC_PORTAL_FAS_2_DRAMATURGI behöver också verifieras innan vidare arbete.

---

## Konsekvens för aktuella specer

**SPEC_GRANSKA_VERIFIERING_2026-05-04** behöver omarbetas:
- Inte "diagnos + scenario-fix". Det är **full implementation av SPEC_GRANSKA_OMARBETNING från noll**.
- Plus shotmap-implementation från noll enligt mock.
- Plus Steg 1-3-audit av SPEC_BESLUTSEKONOMI innan Steg 4 påbörjas.

**SPEC_BESLUTSEKONOMI_STEG_4** kan inte börja förrän:
1. Granska + Shotmap är faktiskt levererade och playtestade
2. Steg 1-3 är auditerade och bekräftade
3. Process-fix A/B/C/D är på plats (eller åtminstone diskuterad)

Annars riskerar Steg 4 samma falsk-leveransstatus.

---

**Slut KVAR-audit 2026-05-04**
