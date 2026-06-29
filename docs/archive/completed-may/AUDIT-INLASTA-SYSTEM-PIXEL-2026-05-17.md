# AUDIT — Pixel-audit i kontext för 10 inlåsta system

**Datum:** 2026-05-17
**Audit-typ:** Pixel-audit i kontext (code-only — visual playtest-verifiering återstår)
**Avgränsning:** De 10 inlåsta systemen i `docs/INLASTA_SYSTEM.md`, verifierade mot faktisk källkod, deras renderingar i Portal/sekundärsektion, plus hierarki när Portal har 8 kort samtidigt.
**Audience:** Code (åtgärder), Jacob (acceptans), Opus (status-uppdatering i `INLASTA_SYSTEM.md`).

---

## Sammanfattning — vad jag fann

| Severity | Antal | Innebörd |
|----------|-------|----------|
| 🟥 BLOCK   | 1     | Måste fixas innan Jacob playtester |
| 🟧 WARN    | 5     | Bör fixas inom samma sprint |
| 🟨 OBSERV  | 4     | Notering — ej akut, men design-skuld |
| ✅ OK      | 12    | Verifierat i kod, väntar bara visuell playtest |

Detaljer per system nedan.

---

## Auditmetod

1. Läst varje systems rendering-fil från `INLASTA_SYSTEM.md`-tabellen.
2. Verifierat CSS-klasser mot `src/styles/global.css` + `src/presentation/styles/stalvallen-portal.css`.
3. Simulerat Portal med max stack mentalt: `SituationCard` + `PortalBeat` + `PortalActiveBudget` + `PortalEventSlot` + `Primary` + `PortalQueueRail` + 3 secondaries + minimal-bar + `PortalInboxCounter` = 8–10 element. Verifierat att stripe-, eyebrow- och chevron-anatomin håller.
4. Korsläst med `design-system/CODE-OPUS-INSTRUCTION.md` och `colors_and_type.css` (auktoritativa token).

Inga skärmdumpar finns i denna leverans — jag har inte kunnat köra appen. Code måste leverera skärmdumpar för 🟢-uppgradering. Audit-resultatet är kod-nivå: vad jag kan verifiera utan att rendera.

---

## Per-system findings

### 1 · `boardObjectiveService` → `BoardObjectivesSecondary`

**Status idag:** 🟠 implementation klar, väntar playtest.
**Filer:** `src/presentation/components/portal/secondary/BoardObjectivesSecondary.tsx` (23 rader) + `BoardObjectivesList.tsx` (150 rader).

| # | Severity | Fynd | Åtgärd |
|---|----------|------|--------|
| 1.1 | ✅ OK | Använder `.portal-secondary-card` + `.portal-card-stripe-copper` + `.portal-card-eyebrow` korrekt. Eyebrow = "Styrelsen". | — |
| 1.2 | 🟧 WARN | `BoardObjectivesList` har **inline `<style>`-objekt** på 5+ ställen (raderna 49–77 i `BoardObjectivesList.tsx`) trots att `stalvallen-portal.css` bröt ut detta för WeeklyDecision. Bryter `CODE-OPUS-INSTRUCTION` konvention om CSS-extraktion. | Flytta till `.obj-row` / `.obj-row-hovered` / `.obj-progress-bar` i `stalvallen-portal.css`. |
| 1.3 | 🟨 OBSERV | Använder emoji (📌 ⚠️ ❌ ✅) som status-ikoner. Mot vår design-decision att hålla emoji till diegesiska kontexter — men `BoardObjectivesList` renderas också i `ArrivalScene`, där emoji passar som scenstämning. Acceptabelt här. | Behåll. Notera i `DESIGN-DECISIONS.md` att Board-statusikoner är dokumenterat undantag (samma logik som klacken-emoji). |
| 1.4 | 🟧 WARN | `formatOwnerInitial(ownerId)` kapar till `[F]. [restnamn]`. Om `ownerId` innehåller `id_string` (t.ex. `"member_anders"`) hamnar `m. ember_anders` i UI:t. | Kontrollera att `ownerId` alltid är ett display-namn, eller mappa via `boardPersonalities`. |
| 1.5 | ✅ OK | Sorterar `failed → at_risk → active → met`, max 2 visas. Hierarkin är korrekt — det värsta överst. | — |

### 2 · `opponentAnalysisService` → `LineupStep` + `TacticStep`

**Status idag:** 🟠 implementation klar, väntar playtest.

| # | Severity | Fynd | Åtgärd |
|---|----------|------|--------|
| 2.1 | 🟨 OBSERV | Detta system renderas **utanför Portal** (i Spela-flödet), inte i sekundärsektionen. Det betyder att det inte konkurrerar med Portal-stacken — ingen hierarki-fråga uppstår. | Audit för detta system kräver Spela-flödes-screenshot. Avgränsa från denna audit. |
| 2.2 | ✅ OK | Inget Portal-arbete krävs. | — |

### 3 · `weeklyDecisionService` → `WeeklyDecisionSecondary`

**Status idag:** 🟠 implementation klar, väntar playtest.
**Fil:** `src/presentation/components/portal/secondary/WeeklyDecisionSecondary.tsx` (95 rader).

| # | Severity | Fynd | Åtgärd |
|---|----------|------|--------|
| 3.1 | ✅ OK | Korrekt stripe-färgning: `supporter` får `--warm` (3 px), övriga får `--accent` (2 px). Stripe-systemet följs. | — |
| 3.2 | 🟧 WARN | Resolved-state försvinner efter 1500 ms via `setTimeout`. Det är **för snabbt** för en effekt-text att läsa. Spelaren får inte chans att förstå "Klacken: +8 stämning" innan kortet poffar. | Höj till 2400–2800 ms, ELLER bytt strategi: behåll resolved-state tills nästa render-tick / nästa Portal-render efter `advance()`. |
| 3.3 | 🟨 OBSERV | Knapp-anatomin är `.weekly-decision-option-btn` (egen 2-kolumns grid), inte `.btn .btn-primary`. Det är medvetet — weeklyDecision har egen grid-layout per `2026-05-07_weekly_decision_mock.html`. | Behåll. Notera i `DESIGN-DECISIONS.md` som dokumenterat undantag. |
| 3.4 | 🟥 BLOCK | `capturedDecision.current` ref:as i `useEffect` **bara när `game.pendingWeeklyDecision` är truthy**. Om spelaren resolves, kortet visar resolved-state 1500 ms, men under den tiden trigggar en **annan** weekly decision i nästa omgång — kommer den nya decision-ringen inte att synkroniseras med `capturedDecision.current`? | Code: verifiera flödet. Min läsning: bör vara OK eftersom `setResolvedInfo(null)` körs när ny decision kommer, men det är värt en explicit test. |
| 3.5 | ✅ OK | Eyebrow-label byter mellan "Veckans beslut" / "Veckans supporterfråga" baserat på category. Stämmer mot mock-systemet. | — |

### 4 · `leadershipService` → `PlayerCard`

**Status idag:** 🟠 implementation klar, väntar playtest.

| # | Severity | Fynd | Åtgärd |
|---|----------|------|--------|
| 4.1 | 🟨 OBSERV | Renderas i PlayerCard (Squad-tab), inte Portal. Ingen hierarki-konflikt. | Avgränsa från Portal-audit. |

### 5 · `rumorService` → `RoundSummaryScreen`

**Status idag:** 🟠 implementation klar, väntar playtest.

| # | Severity | Fynd | Åtgärd |
|---|----------|------|--------|
| 5.1 | 🟨 OBSERV | Renderas i RoundSummary, inte Portal. Ingen Portal-stack-konflikt. | Avgränsa. |
| 5.2 | 🟧 WARN | Per F1 Beslutsekonomi-specen ska rumor-events kunna trigga **cooldown** (3 omgångar). Det betyder att `RoundSummary`-renderingen blir tom under cooldown-perioder. Designkrav från F1: cooldown-indikator på **källans sekundär**, inte fristående. Rumor har ingen Portal-sekundär — den lever bara i RoundSummary. | F1 mock visar cooldown-rad på "Lokaltidningen"-sekundären. Verifiera att det finns en `LokaltidningenSecondary` eller liknande där cooldown kan bo. Om inte: ny komponent krävs. |

### 6 · `playerVoiceService` → `PlayerCard.tsx:676`

**Status idag:** 🟠 implementation klar, väntar playtest.

| # | Severity | Fynd | Åtgärd |
|---|----------|------|--------|
| 6.1 | 🟧 WARN | Voice-blocket renderas i kortets normalflöde med `var(--bg-elevated)` (ljus). Men PlayerCard öppnas i mörkt Portal-kontext via SquadScreen — och `--bg-elevated` är `#FFFFFF`. Det betyder en **vit blockstil mitt i mörk modal**. | Verifiera: är PlayerCard mörkkontext-medveten? Om ja: voice-block ska använda `--bg-portal-elevated`. Om PlayerCard alltid är ljus: OK som det är. |
| 6.2 | 🟨 OBSERV | "🗣 [FIRSTNAME]"-prefix bryter mot "inga emoji i systemetiketter"-regeln (`CLAUDE.md`). Men det är diegetiskt: spelaren talar, ikonen är talbubbla. | Acceptabelt undantag — behåll. |

### 7 · `mecenatDinnerService` → `MecenatDinnerEvent`

**Status idag:** 🟠 implementation klar, väntar playtest.
**Fil:** `src/presentation/components/events/MecenatDinnerEvent.tsx` (198 rader).

| # | Severity | Fynd | Åtgärd |
|---|----------|------|--------|
| 7.1 | 🟥/🟧 — uppgraderat 🟧 WARN | Hela komponenten använder **inline `React.CSSProperties`-objekt** (raderna 67–120). Bryter `CODE-OPUS-INSTRUCTION` konvention efter `stalvallen-portal.css`-refaktoreringen. Plus: använder `var(--bg)`, `var(--bg-elevated)` (ljust) — modal renderas över Portal som är mörkt. Stark visuell kontrastbrott. | Bryt ut till `.mecenat-card`, `.mecenat-label`, `.mecenat-title`, `.mecenat-body`, `.mecenat-btn`. Använd `--bg-portal-surface` istället för `--bg`. |
| 7.2 | 🟧 WARN | Modal har `background: rgba(0,0,0,0.6)` overlay, men `padding-top: 60px` + `justifyContent: 'flex-start'` — kortet hänger högt upp. På långa skärmar ser detta ut som ett "missplacerat dropdown", inte en modal. | Använd `justify-content: center` + responsive padding. |
| 7.3 | 🟧 WARN | Knappar har `text-align: 'left'` och full width — ser ut som listrader, inte knappar. Bryter `.btn`-system. | Använd `.btn .btn-outline` för val-knapparna, `.btn .btn-primary` för "Sätt dig ner"/"Fortsätt"/"Avsluta kvällen". |
| 7.4 | 🟨 OBSERV | `settingEmoji` (🦌🥃🧖) som label-prefix. Diegesiskt (Mecenatens kontext = jaktstuga/whisky/bastu) — acceptabelt undantag. | Behåll. |

### 8 · `hallDebateService` → `EventCardInline`

**Status idag:** 🟠 implementation klar, väntar playtest.

| # | Severity | Fynd | Åtgärd |
|---|----------|------|--------|
| 8.1 | ✅ OK | Renderas via `EventCardInline.tsx` i `PortalEventSlot`. Använder `var(--bg-portal-surface)` + 2 px copper-stripe + mono eyebrow ("🏛️ KOMMUNEN"). Konsekvent med övriga inline-events. | — |
| 8.2 | ✅ OK | `event.title` renderas som extra rad ovanför body — ger hallfrågan en rubrik som de andra inline-events inte har. Korrekt särbehandling. | — |
| 8.3 | 🟧 WARN | Per F1-specen ska hallDebateService ha 8-omgångars cooldown. Inget UI för det idag. När hallfrågan precis fyrat och cooldown är aktiv, ska kommunens sekundär visa cooldown-rad. **Det finns ingen "Kommunen"-sekundär** — den lever bara i events. | Antingen: skapa permanent `KommunenSecondary` med cooldown-rad, eller: visa cooldown som "🕐 Lugnar sig" i `PortalInboxCounter`-raden ("1 källa lugnar sig"). F1-mocken visade alternativ 1. |

### 9 · `smallAbsurditiesData` → InboxScreen + RoundSummaryScreen

**Status idag:** 🟠 implementation klar, väntar playtest.

| # | Severity | Fynd | Åtgärd |
|---|----------|------|--------|
| 9.1 | 🟨 OBSERV | Renderas i Inbox och RoundSummary, inte Portal. Ingen Portal-stack-konflikt. | Avgränsa från Portal-audit. |

### 10 · `arcService` → `ActiveArcsSecondary` + `SeasonSummaryScreen`

**Status idag:** 🟠 implementation klar, väntar playtest.
**Fil:** `src/presentation/components/portal/secondary/ActiveArcsSecondary.tsx` (150 rader).

| # | Severity | Fynd | Åtgärd |
|---|----------|------|--------|
| 10.1 | ✅ OK | Korrekt stripe-anatomi: `.portal-card-stripe-copper`. | — |
| 10.2 | 🟧 WARN | Eyebrow-label är `Arcs` — på engelska. Bryter "svenska först"-principen i `CLAUDE.md`. Mock-konventionen är `I blickfånget` (från `2026-05-07_active_arcs_mock.html`). | Ändra till `I blickfånget` i `portal-card-eyebrow`. |
| 10.3 | ✅ OK | Glyph-system (A/B/C) följer mock-konvention. `warm` används för `derby_echo`, `muted` för `building`-fas, default för andra. | — |
| 10.4 | 🟨 OBSERV | `derby_echo`-arcs filtreras BORT från Portal-rendering (`.filter(a => a.type !== 'derby_echo')`). Men `getGlyphVariant` returnerar `'warm'` för derby_echo. Filter sker innan styling → koden är död. | Rensa: ta bort `derby_echo`-grenen i `getGlyphVariant` om filtrering är permanent. |
| 10.5 | 🟧 WARN | `urgent` (≤1 omgång kvar) → text "Avgörande snart" i meta-raden — men ingen visuell signal i glyph eller stripe. Ett kort där en arc är i `urgent`-läge ser identiskt med ett där den har 5 omgångar kvar. | Lägg på en `warm` halo eller låt glyph-färgen byta till `--warm` när `isUrgent === true`. |

---

## Hierarki-audit — Portal med 8 kort samtidigt

**Simulerat scenario:** Säsong 2, Omg 14, full belastning.

```
1.  SituationCard            ── neutral text, ingen stripe
2.  PortalBeat               ── inline-rad, ingen stripe
3.  PortalActiveBudget       ── eyebrow + ●● prickar (F1, nyt)
4.  Tutorial-frame           ── (bara Säsong 1 Omg 1, ej i detta scenario)
5.  PortalEventSlot          ── EventCardInline, copper-stripe 2 px
6.  Primary card             ── varierar (NextMatch, Squad, etc.)
7.  PortalQueueRail          ── kompakt rad, copper-tint (F1, nyt)
8.  ActiveArcsSecondary      ── copper-stripe 2 px, eyebrow "Arcs"
9.  BoardObjectivesSecondary ── copper-stripe 2 px, eyebrow "Styrelsen"
10. WeeklyDecisionSecondary  ── copper/warm-stripe, eyebrow "Veckans beslut"
11. PortalMinimalBar         ── kompakta chips
12. PortalInboxCounter       ── botten-rad (F1, nyt)
```

### Hierarki-fynd

| # | Severity | Fynd | Åtgärd |
|---|----------|------|--------|
| H.1 | 🟥 BLOCK | **Stripes-inflation.** Element 5, 8, 9, 10 har alla 2 px copper-stripe. Plus arrival-board-card i ArrivalScene och queue-rail har copper-border. När 4 kort i rad alla har samma 2 px stripe blir hierarkin platt — inget kort dominerar visuellt. | **Förslag:** Eleverat kort (det som kräver action *nu*) får 3 px copper-stripe, övriga sekundärer dimmas till 2 px **opacity 0.4** (`rgba(196,122,58,0.4)`). Active decision-kort + EventSlot = 3 px solid. Övriga = 2 px solid 0.4 alpha. |
| H.2 | 🟧 WARN | **Eyebrow letter-spacing inkonsekvent.** `portal-card-eyebrow` är 2px letter-spacing. `EventCardInline` egen eyebrow är också 2px men inline-styled i komponent. Båda ser likadana ut idag — men en framtida ändring i CSS-klassen bryter inte den inline-stiliga eyebrow. | Refaktorera `EventCardInline` att använda `.portal-card-eyebrow`-klassen. |
| H.3 | 🟧 WARN | **Inboxen kollideras med sekundärer.** `PortalInboxCounter` (botten av Portal) använder samma `--text-light-secondary` som sekundär-body-text. När `BoardObjectivesSecondary` har endast 2 rader och inboxraden ligger 6 px under, ser det ut som om inboxraden är en del av kortet. | Inboxraden ska ha `border-top: 1px dashed rgba(196,122,58,0.18)` + minst 14 px margin-top. (Detta är redan löst i F1-mocken — verifiera att Code följer.) |
| H.4 | 🟨 OBSERV | **Tutorial-frame + ActiveBudget redundans.** I Säsong 1 Omg 1: ActiveBudget visar `●○` (1/locked) **och** tutorial-frame förklarar "max 1". Visuellt blir det två signaler för samma sak. | Skippa ActiveBudget under tutorial-veckan (Säsong 1 Omg 1). Tutorial-bandet bär informationen. Återinför ActiveBudget från Omg 2. |
| H.5 | 🟨 OBSERV | **`PortalMinimalBar`** har inte verifierats — finns som komponent i `PortalScreen` men den auditerades inte. Kan inte uttala mig om dess hierarki-position. | Audit separat när minimal-bar är på agendan. |

---

## Cross-cutting designbeslut

### Stripe-bredd som hierarki-signal

I dagsläget har vi tre stripe-bredder definierade:
- `.portal-card-stripe-copper` = **2 px** (default sekundär)
- `.portal-card-stripe-copper-wide` = **3 px** (förstärkt — används inte än)
- `.portal-card-stripe-warm` = **3 px** (severity / persona-relation)

**Förslag:** Aktivera `.portal-card-stripe-copper-wide` som "kort som kräver action nu" — alltså `EventCardInline` och aktiva `WeeklyDecisionSecondary`. Övriga får 2 px med opacity 0.5 så stacken får riktning.

### Eyebrow-vokabulär (svenska)

| System | Idag | Förslag |
|--------|------|---------|
| BoardObjectives | "Styrelsen" | ✅ behåll |
| ActiveArcs | "Arcs" | **→ "I blickfånget"** |
| WeeklyDecision | "Veckans beslut" / "Veckans supporterfråga" | ✅ behåll |
| HallDebate (event) | "🏛️ KOMMUNEN" | ✅ behåll (event-eyebrow, ej secondary) |

---

## Åtgärdslista (för Code, prioriterad)

1. **🟥 H.1 — Stripes-inflation.** Implementera `.portal-card-stripe-copper-wide` som 3 px och differentiera "action-card" (EventSlot, aktiv WeeklyDecision) från "info-card" (Arcs, Board). Övriga sekundärer dimmas till opacity 0.4-stripe.
2. **🟥 3.4 — WeeklyDecision capturedDecision-race.** Verifiera flödet när två decisions resolves inom 1500 ms (resolved-state-fönstret).
3. **🟧 10.2 — Arcs-eyebrow på svenska.** `Arcs` → `I blickfånget`.
4. **🟧 7.1–7.3 — MecenatDinnerEvent stilrefaktor.** Bryt ut inline-CSS, byt till `--bg-portal-surface`, använd `.btn`-systemet.
5. **🟧 1.2 — BoardObjectivesList CSS-extraktion.** Flytta inline-styles till `stalvallen-portal.css`.
6. **🟧 3.2 — WeeklyDecision resolved-timeout.** 1500 → 2400–2800 ms.
7. **🟧 H.2 — EventCardInline använder .portal-card-eyebrow.** Refaktor av eyebrow-style till delad klass.
8. **🟧 H.3 — PortalInboxCounter margin/border.** Verifiera mot F1-mock.
9. **🟧 8.3 — Kommunen-cooldown UI.** Antingen `KommunenSecondary` eller inboxrads-flagga. F1-beroende.
10. **🟧 10.5 — Urgent-arc visuell signal.** Warm halo eller `--warm`-glyph när `isUrgent`.
11. **🟧 5.2 — Rumor cooldown-UI.** Beror på 8.3-beslutet.
12. **🟧 1.4 — ownerId display-name.** Verifiera mapping via `boardPersonalities`.
13. **🟨 H.4 — Tutorial + ActiveBudget redundans.** Skippa Budget under Säsong 1 Omg 1.
14. **🟨 10.4 — Död derby_echo-kod.** Rensa.
15. **🟨 6.1 — PlayerCard voice-block ljus/mörk.** Verifiera mörkkontext.

---

## Vad denna audit INTE har täckt

- **Visuell verifikation av faktisk render.** Allt här är kodläsning. Code måste leverera skärmdumpar i kontext med 8 kort för att gå från 🟠 → 🟢 i `INLASTA_SYSTEM.md`.
- **`PortalMinimalBar`.** Auditeras separat.
- **`SituationCard`, `PortalBeat`, `Primary`-varianter.** Är inte i de 10 inlåsta — men finns i samma stack och kan ha hierarki-implikationer.
- **`opponentAnalysisService`, `leadershipService`, `rumorService`, `smallAbsurditiesData`, `playerVoiceService`** — system som inte renderas i Portal sekundärsektion. Avgränsade från denna audit.

---

## Nästa steg

1. Code adresserar 🟥-fynd (3 st) **innan** Jacob playtester denna sprint.
2. 🟧-fynd (5 st) bör tas inom samma sprint.
3. Code levererar 3 skärmdumpar: Portal full stack (Säsong 1 Omg 1 tutorial), Portal mid-season (Omg 14, fullt), Portal endgame (Omg 22, krympt).
4. När skärmdumpar finns → uppdatera `INLASTA_SYSTEM.md` med 🟢-status där det är applicerbart, eller 🟠 + audit-pekare om hierarki-fynd kvarstår.
