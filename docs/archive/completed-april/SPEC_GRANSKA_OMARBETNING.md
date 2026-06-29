# SPEC_GRANSKA_OMARBETNING — Granska som post-match-paket per natur

**Datum:** 2026-04-30
**Författare:** Opus
**Status:** Spec-klar för Code
**Beroende:** SPEC_BESLUTSEKONOMI Steg 2 levererad (attentionRouter, eventQueueService, currentMatchday, prio-fält). Steg 3 (PortalEventSlot) levererad.

---

## VARFÖR

Playtest avslöjade: 9 val efter en match. Granska dumpar alla `pendingEvents` plus presskonferens, domarmöte, media, insändare, motståndare-quote i Översikt-fliken. Spelaren klickar igenom på måfå. Värdefull information drunknar.

**Diagnos:** Granska migrerades aldrig till SPEC_BESLUTSEKONOMI. Den läser `pendingEvents` direkt och respekterar inte uppmärksamhetskön. Plus: presskonferens/media/insändare/quote är genererade *direkt* i Granska och ligger utanför kön.

---

## TVÅ INVÄNDNINGAR JAG REDDE UT INNAN

**Invändning 1: Granska är inte Portal med rubrik.**

Tidigare rekommendation var att Granska följer Portal-modellen (ett event åt gången). Det är fel. Granska är *post-match-vyn* — spelaren har precis spelat en match, är i rätt mental position för att processa konsekvenser. Portal är *neutral-mode*. Att kapa Granska till "ett event åt gången" är att underutnyttja det enda fönster där spelaren genuint *vill* läsa.

**Invändning 2: Dela upp på *natur*, inte på *prioritet*.**

Tidigare förslag (critical inline / medium i Spelare / atmosfäriskt i inbox) blandar två axlar: vad eventet handlar om vs hur viktigt det är. En atmosfärisk media-quote om vinst är kopplad till matchen — den hör inte hemma i inboxen.

**Bättre uppdelning — efter natur, inom redan existerande tabs:**
- **Översikt:** resultat, konsekvenser (tabell, ekonomi, puls), max 2-3 *kritiska* events
- **Spelare:** allt om individuella spelare (stjärnprestation, skolkonflikt, betyg)
- **Förlopp:** match-händelser, andra matcher, scouting (oförändrat — ren historik)
- **Reaktioner** (NY): ETT samlat kort med media + insändare + motståndare-quote, auto-resolved
- **Analys:** assistenttränaren, formspelare, insikter (oförändrat)
- **Atmosfäriska events utan hem:** inboxen som notiser

---

## KONKRETA FRÅGOR JAG SVARAR PÅ

**Hur många events får Översikt visa?** Max 2-3 kritiska. Granska är post-match — spelaren vill processa. Men 9 är för mycket, 0 är för lite. 2-3 är gränsen där fokus fortfarande håller.

**Reaktioner — auto-resolved eller scrollbart?** Auto-resolved kort med 3-4 reaktioner i sekvens (kollapsbart). Inga val. Försvinner från pendingEvents direkt vid render. Spelaren har läst matchen — vill ha temperaturen, inte ett scrollbart pressmaterial.

---

## ARKITEKTUR — VAD BYGGS

### Ny fördelning per natur

`getEventsByNature(events, fixture)` — pure function som tar pendingEvents och fördelar dem per Granska-flik:

```typescript
type EventNature = 'critical' | 'player' | 'reactions' | 'inbox-only'

function classifyEventNature(event: PendingEvent): EventNature {
  // Kritiska som kräver beslut → Översikt
  if (CRITICAL_GRANSKA_TYPES.has(event.type)) return 'critical'

  // Spelar-relaterade → Spelare-fliken
  if (PLAYER_TYPES.has(event.type)) return 'player'

  // Match-reaktioner → Reaktioner-kort
  if (REACTION_TYPES.has(event.type)) return 'reactions'

  // Resten — atmosfäriska som inte hör hemma här → bara inbox
  return 'inbox-only'
}

const CRITICAL_GRANSKA_TYPES = new Set([
  'pressConference',     // har deadline efter match
  'patronEvent',         // patron-ultimatum
  'criticalEconomy',
  'transferBidReceived', // bud kom in under matchen
])

const PLAYER_TYPES = new Set([
  'starPerformance',
  'playerPraise',
  'playerMediaComment',
  'dayJobConflict',
  'hesitantPlayer',
  'captainSpeech',
  'playerArc',           // arc-events kopplade till matchprestation
])

const REACTION_TYPES = new Set([
  'mediaReaction',       // OBS — finns inte i pendingEvents idag, genereras i Granska
  'fanLetter',           // dito
  'opponentQuote',       // dito
])
```

**Notera:** REACTION_TYPES är events som idag inte ligger i `pendingEvents` utan genereras direkt i Granska (`generateInsandare`, `generatePostMatchOpponentQuote`, etc). Steg 1 av implementationen migrerar dem till kön så de följer samma mönster.

### Cap per flik

- **Översikt:** max 3 kritiska events. Resten ackumuleras i Portal-kön nästa runda.
- **Spelare:** alla player-events visas, men gömda i en "händelse"-sektion under spelarbetygen. Klick expanderar.
- **Reaktioner:** max 4 reaktioner i ett kort (auto-resolved). Resten droppas (fanns redan begränsade per natur).
- **Inbox-only:** visas ALDRIG i Granska. Bara i inboxen.

### Reaktioner-kortet (NY)

```tsx
function ReaktionerKort({ fixture, game }: { fixture: Fixture; game: SaveGame }) {
  const reactions = collectReactions(fixture, game)  // media + insändare + opponent + klacken

  if (reactions.length === 0) return null

  return (
    <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
      <SectionLabel style={{ marginBottom: 8 }}>📰 REAKTIONER</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {reactions.map((r, i) => (
          <div key={i} style={{
            paddingTop: i > 0 ? 8 : 0,
            borderTop: i > 0 ? '1px solid var(--border)' : 'none',
          }}>
            <p style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '1.5px',
              color: 'var(--text-muted)', textTransform: 'uppercase',
              marginBottom: 4,
            }}>
              {r.label}  {/* "🎙 LOKALTIDNINGEN", "📬 INSÄNDARE", "🛡 MOTSTÅNDET", "🔥 KLACKEN" */}
            </p>
            <p style={{
              fontSize: 12, fontStyle: 'italic',
              color: 'var(--text-secondary)', lineHeight: 1.5,
            }}>
              {r.quote}
            </p>
            {r.attribution && (
              <p style={{
                fontSize: 10, color: 'var(--text-muted)',
                marginTop: 2, textAlign: 'right',
              }}>
                — {r.attribution}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Auto-resolve:** När kortet renderas markeras motsvarande events som resolved direkt. Spelaren klickar inte. Det är *läsbar* atmosfär, inte handling.

### Översikt-fliken (omarbetad)

```tsx
function renderOversikt() {
  const criticalEvents = getCriticalEventsForGranska(game.pendingEvents).slice(0, 3)
  const playerCount = countPlayerEvents(game.pendingEvents)

  return (
    <>
      {/* 1. Resultat-hero (oförändrat) */}
      <ResultatHero fixture={fixture} />

      {/* 2. Statistik (oförändrat) */}
      <StatistikKort fixture={fixture} />

      {/* 3. Reaktioner-kort (NY, auto-resolved) */}
      <ReaktionerKort fixture={fixture} game={game} />

      {/* 4. Kritiska events (max 3, inline med val-knappar) */}
      {criticalEvents.map(event => (
        <InlineEventCard
          key={event.id}
          event={event}
          onResolve={(choice) => resolveEvent(event.id, choice)}
        />
      ))}

      {/* 5. Hänvisning till Spelare-flik om det finns events där */}
      {playerCount > 0 && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
          {playerCount} händelse{playerCount > 1 ? 'r' : ''} kring spelarna — se Spelare-fliken
        </p>
      )}

      {/* 6. Nyckelmoment (oförändrat) */}
      <NyckelmomentKort />

      {/* 7. Motståndartränare-citat (TAS BORT — flyttar till Reaktioner) */}
    </>
  )
}
```

### Spelare-fliken (utökad)

Befintlig spelar-betyg-lista plus en ny sektion längst ner: "📰 KRING SPELARNA". Listar player-events som mini-kort. Klick → expand → val.

### Förlopp-fliken (oförändrad)

Tidslinjen, andra matcher, scouting. Ren historik — ingen interaktion.

### Analys-fliken (oförändrad)

Assistenttränaren, konsekvenser, formspelare, insikter.

---

## CTA-LOGIKEN

Befintlig "KLAR — NÄSTA OMGÅNG"-knapp. Logik uppdaterad:

```typescript
const criticalUnresolved = getCriticalEventsForGranska(game.pendingEvents)
  .filter(e => !resolvedEventIds.has(e.id)).length

const ctaDisabled = criticalUnresolved > 0
const ctaLabel = criticalUnresolved > 0
  ? `${criticalUnresolved} att hantera först`
  : 'KLAR — NÄSTA OMGÅNG →'
```

**Ändring:** CTA blockeras BARA av kritiska events. Spelar-events och atmosfäriska påverkar inte. Atmosfäriska finns ändå i kön och visas i Portal nästa runda.

---

## MIGRATION AV EXISTERANDE EVENTS

Steg 1 av implementationen: migrera de tre "post-match-genererade" events till kön.

**Idag:**
```typescript
// I GranskaScreen.tsx
const insandare = generateInsandare(...)
const opponentQuote = generatePostMatchOpponentQuote(...)
const mediaReaction = generateSilentMatchReport(...)
```

**Efter:**
```typescript
// I roundProcessor.ts (eller post-match-hook)
if (managedFixturePlayed) {
  const insandareEvent = createInsandareEvent(...)
  const opponentQuoteEvent = createOpponentQuoteEvent(...)
  const mediaEvent = createMediaReactionEvent(...)
  // Alla med priority: 'low' (atmosfärisk) — auto-resolveras i Reaktioner-kortet
  pendingEvents.push(insandareEvent, opponentQuoteEvent, mediaEvent)
}
```

Granska konsumerar dem från `pendingEvents` istället för att generera dem inline.

**Fördel:** Reaktionerna följer samma kö-modell som resten. Och *om* spelaren inte ser Granska (försk till next round-skärmen?) sparas de i kön och visas i Portal nästa runda.

---

## VAD DETTA INTE ÄR

- **Inte ett event åt gången.** Granska är post-match — där har spelaren mental kapacitet.
- **Inte filtrering.** Atmosfäriska events försvinner inte. De flyttas till Reaktioner-kortet (synliga, auto-resolved) eller Portal-kön (visas senare).
- **Inte borttagning av flikar.** Översikt/Spelare/Förlopp/Analys finns kvar. Plus Reaktioner-kortet *inom* Översikt.
- **Inte en Portal-klon.** Granska har sin egen modell — flera events synliga, men sorterade per natur.

---

## IMPLEMENTATIONSORDNING

1. **Migrera media/insändare/quote till pendingEvents** (1 dag). Ny `generatePostMatchEvents` i roundProcessor. Granska konsumerar därifrån.
2. **Bygg Reaktioner-kortet** (4h). Auto-resolveras vid render.
3. **Klassificera events per natur** (`classifyEventNature`) (2h).
4. **Omarbeta `renderOversikt`** (4h). Cap på 3 kritiska. Reaktioner-kortet. Hänvisning till Spelare-flik.
5. **Utöka `renderSpelare`** med "Kring spelarna"-sektion (4h).
6. **CTA-logik** uppdaterad (1h).
7. **Tester** (2h). Cap fungerar, auto-resolve fungerar, inboxen får atmosfäriska som inte landar i flik.
8. **Browser-playtest** (1h). Spela en match, verifiera att Översikt har max 3 val + Reaktioner-kort.

Total: ~2 dagar.

---

## TEXTER

Reaktioner-kortets quotes genereras redan av befintliga services (`generateInsandare`, `generatePostMatchOpponentQuote`, etc). Inga nya texter behövs från Opus.

Inline event-kort i Översikt och Spelare använder befintliga event-mallar.

---

## VERIFIERINGSPROTOKOLL

Efter implementation, Code:

1. Spelar 1 cup-match + 1 ligamatch i webbläsare
2. Skärmdump av Översikt efter varje (max 3 kritiska + Reaktioner-kort + statistik + nyckelmoment)
3. Skärmdump av Spelare-fliken med events (om några)
4. Skärmdump av inboxen — atmosfäriska som inte landade i Granska ska finnas där
5. 2-3 meningar: känns det fokuserat efter match? Hittar spelaren rätt?

---

## EFTER IMPLEMENTATION

KVAR.md uppdateras:
- "Granska migrerad till SPEC_BESLUTSEKONOMI"
- "Reaktioner-kort introducerat"
- DESIGN_SYSTEM § 5 uppdaterad med ny Granska-layout

Slut.
