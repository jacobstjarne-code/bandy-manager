# SPEC_BESLUTSEKONOMI — Event-kö och scen-markörer

**Datum:** 2026-04-30
**Författare:** Opus
**Status:** Spec-klar för Code, levereras iterativt i 5 steg
**Beroende:** Portal-Fas-2 levererad. Scene-systemet levererat (men triggar inte — diagnos behövs).

---

## VARFÖR

Två separata observationer från playtest 2026-04-30 som visar sig vara samma problem:

**Observation 1:** "11 events efter förlorad cupmatch, sen 3 till. Jag bara klickade igenom på måfå för att stänga."

Diagnos: Spelaren får 14 saker att ta ställning till samtidigt. Mental kapacitet räcker inte. Resultat: alla events behandlas som lika oviktiga, för att de kommer i klump. Den värdefulla informationen drunknar i bruset.

**Observation 2:** "Jag har inte sett söndagsträning-scenen någonstans, trots att vi specade den till säsong 1."

Diagnos: Antingen triggar inte scen-systemet, eller så *triggar det men event-overlay-flödet tar över* innan scenen hinner renderas. Sceniska markörer som ska bryta tempo och signalera viktiga ögonblick försvinner i bakgrunden av allt annat.

**Sammanvävt:** Spelet har inte en *beslutsekonomi*. Allt är lika viktigt. Allt visas samtidigt. Spelaren kan inte fokusera, kan inte minnas vad som hände, kan inte känna att en händelse "betyder" något — för nästa kommer direkt efter.

---

## GRUNDPRINCIPER (i prioritetsordning)

### 1. Spelets själ är bredd, inte fokus

**Detta är ej-förhandlingsbart.** Bandy Manager är inte CK3, inte Reigns, inte Football Manager. De spelen har en tydlig central handling — krig, kungafamilj, tabellplacering. Bandy Manager är *ortens* spel. Det betyder att händelser på orten (klacken, kafferummet, lokaltidningen, mecenater, derby-stämning) är **lika viktiga** som händelser på fitness-spåret (skador, form, taktik).

Andra managementspel skulle prioritera ner kafferumsskvaller som "atmosfär". Vi gör tvärtom: kafferumsskvaller *är* spelet. Att en mecenat varit nere på träning igår *betyder* något. Att klacken förbereder en koreografi för derbymatchen *är* en händelse.

**Konkret för designen:**
- Atmosfäriska events får inte filtreras bort som "okritiska". De *visas*, bara på ett sätt som inte konkurrerar med beslutsfrågor.
- En spelare som spelar en hel säsong ska minnas både *att Henriksson skadades i mars* och *att kioskvakten alltid hade slut på kaffe i januari*. Båda. Inte en av dem.
- Designprincipen är inte "minimera events" utan "ge varje event sin rätta plats".

### 2. En sak åt gången, men allt ska få sin tur

Spelaren har kapacitet — men inte att hantera allt simultant. Modellen är **kö**, inte filter:

- Allt som händer går in i kön
- Spelaren ser ETT event åt gången
- När spelaren tagit ställning (eller bara kvitterat) — nästa visas, *om det finns utrymme*
- Inget tappas. Allt får sin tur.

**Det är skillnaden från min första instinkt.** Jag föreslog tidigare att bara kritiska events ska visas och resten gå till inboxen som notiser. Det är fel — för det betyder att atmosfärs-events försvinner från spelflödet. Och då försvinner spelets själ.

**Den bättre modellen:** Allt är events. Alla events visas. Men *en åt gången*, och prioriteten styr ordningen.

### 3. "Utrymme" är en explicit modell, inte tur

När visas nästa event? Inte "när som helst". Specifikt:
- Efter spelaren tagit ställning till föregående event
- Efter en match avslutats (nya events kan ha tillkommit)
- När spelaren navigerar tillbaka till Portal från en annan vy
- Aldrig direkt efter ett annat event — det måste finnas en visuell paus

Tekniskt: PortalScreen frågar `eventQueueService.getNextEvent(game)` när den renderas eller när ett event löses. Service returnerar antingen ett event eller null. Om null — Portal är "lugn", spelaren ser bara situationscard, beats, secondary-cards.

### 4. Scenes är för vändpunkter, inte ströhändelser

Scen-systemet (söndagsträning, SM-final, kafferum, säsongssignatur) ska *byggas ut* för att inkludera fas-skiften och kritiska enskilda händelser:
- Cup-introduktion (innan första cup-rundan)
- Säsongspremiär (innan första ligamatch)
- Halvtid (omg 11)
- Slutspurt (omg 19)
- Slutspels-intro (om man kvalat)
- Säsongsfinal (efter sista matchen)
- Patron-konflikt (när relationen kraschar)
- Transferdödline (sista 24h)
- Skandal (om klubben själv drabbas)

Scenes är *inte* events i kön. De är *avbrott* från kön. När en scen är aktiv pausas event-flödet — scenens vikt får ta hela uppmärksamheten.

### 5. Inboxen är dokumentation, inte spel

Allt som händer hamnar parallellt i inboxen som loggpost. Inboxen är spelarens arkiv — där man går tillbaka för att kolla "vad hände i mars?". Den driver inte spelet, den minns det.

---

## DE 5 STEGEN

### STEG 1 — Diagnos (innan vi bygger)

Code rapporterar tre saker. **Inga kodändringar i detta steg.**

**Diagnos A: Varför triggar inte söndagsträning-scenen?**

Kontrollera i ordning:
1. Är `game.scenesEnabled` satt till `true` på nya saves? Kolla `createNewGame.ts` och eventuella migrations.
2. Om ja — anropas `detectSceneTrigger(game)` i `roundProcessor` eller motsvarande?
3. Returnerar den `'sunday_training'` när vi är i säsong 1, omgång 1-2 utan tidigare visning?
4. Sätts `game.pendingScene` korrekt baserat på returnvärdet?
5. Plockar AppRouter (eller var `pendingScene` läses) upp värdet och renderar SceneScreen?

Skriv en rapport: vilka steg fungerar, vilket bryter. Inga ändringar.

**Diagnos B: Vad händer mellan match-slut och Portal-rendering?**

Rita upp händelsekedjan i kod:
- MatchLiveScreen avslutas → vad anropas?
- Vilka events genereras? (lista filer/services)
- Hur visas de? (overlay-stack? sekventiella popups? lista i en vy?)
- Vad är gränssnittet mot inboxen idag?
- Var stoppar flödet och Portal renderas?

Skriv en rapport. Inga ändringar.

**Diagnos C: Vilka event-typer finns idag?**

Lista alla services/datafiler som genererar events idag:
- skadeevents
- transferaktivitet (rykten, bud)
- patron-events
- klacken-events
- kafferum-events
- journalist-events
- akademievents
- skandalevents
- andra klubbars resultat
- ortens händelser
- ...

Skriv en lista med ungefärlig frekvens (per omgång) per typ. Inga ändringar.

**Slut Steg 1:** Tre rapporter. Opus läser och specar Steg 2 baserat på fakta.

---

### STEG 2 — Event-kö-arkitektur

Datastruktur och logik. **Ingen UI-ändring än.**

**Ny entitet:** `QueuedEvent` på SaveGame.

```typescript
interface QueuedEvent {
  id: string                     // unik
  type: EventType                // 'injury' | 'transfer_bid' | 'press_question' | 'patron_conflict' | 'cafe_gossip' | ...
  priority: EventPriority        // 'critical' | 'medium' | 'atmospheric'
  enqueuedRound: number          // när det lades i kön
  payload: unknown               // event-specifik data
  requiresDecision: boolean      // måste spelaren välja, eller bara kvittera?
}

interface SaveGame {
  // existerande...
  eventQueue: QueuedEvent[]
}
```

**Ny service:** `eventQueueService.ts`

```typescript
// Lägger till event i kön (sorteras automatiskt på prioritet)
export function enqueue(game: SaveGame, event: QueuedEvent): SaveGame

// Returnerar nästa event att visa, eller null
export function getNextEvent(game: SaveGame): QueuedEvent | null

// Markerar event som löst (tas bort från kön)
export function resolveEvent(game: SaveGame, eventId: string): SaveGame

// Statistik för Portal-visning
export function getQueueStats(game: SaveGame): {
  total: number
  critical: number
  medium: number
  atmospheric: number
}
```

**Migration:** Befintliga event-genererande services (skadeservice, transferservice, kafferum, patron, klacken, journalist, etc) ska *istället för att direkt visa overlay* anropa `enqueue(game, ...)` med rätt prioritet.

**Prioritetslogik:**
- `critical`: events som blockerar (presskonferens med deadline, transferbud som löper ut, patron-ultimatum, skada på startspelare nästa match)
- `medium`: events som kräver beslut men inte tidskritiskt (akademispelare redo, mindre transferrykte, klacken vill prata)
- `atmospheric`: events som är notiser för stämning (kafferumsskvaller, andra klubbars resultat, ortens röster, lokaltidnings-rubriker)

**Sortering i kön:** primärt på prioritet (critical → medium → atmospheric), sekundärt på enqueuedRound (äldre först inom samma prioritet).

**Tester:** Pure logic-tester för enqueue/resolve/getNext, inkl. edge cases (tom kö, full kö, samma prioritet).

**Slut Steg 2:** Kö-systemet finns men inget syns ännu i UI. Code playtestar och verifierar att events från befintliga services hamnar i kön korrekt.

---

### STEG 3 — Portal visar EN event åt gången

Ny komponent: `EventSlot.tsx` i Portal, mellan SituationCard och Primary card.

```tsx
function EventSlot({ game }: { game: SaveGame }) {
  const next = getNextEvent(game)
  if (!next) return null

  return (
    <EventCard
      event={next}
      onResolve={(choice) => {
        // event-specifik logik
        resolveEvent(game, next.id)
      }}
      onDismiss={() => {
        // bara kvittera (för atmospheric events)
        resolveEvent(game, next.id)
      }}
    />
  )
}
```

**EventCard-anatomin** beror på event-typ:

- **Atmosfärisk:** Bara text + kvittera-knapp. Visuellt subtilt, ingen drama. ("Kioskvakten på Slagghögen säger att han haft slut på kaffe tre gånger i januari. Det är inte normalt.")
- **Medium:** Text + 2-3 val. Visuellt tydligt men inte blockerande. ("Anders Henriksson, P19, är redo för uppflyttning. Vad vill du?")
- **Kritisk:** Stort kort, accent-färg, ofta deadline. ("Karin Bergström, Lokaltidningen: Vägrar ni svara om transfern? Hon publicerar imorgon.")

**Designprincip:** Visuell vikt = matchar prioritet. Atmosfäriska events ska kännas som *du fick reda på det* — inte som *du måste agera*.

**När visas nästa event?**
- Så snart spelaren löst nuvarande
- När spelaren navigerar tillbaka till Portal (om det finns något i kön)
- Aldrig flera samtidigt

**Inboxen parallellt:** Allt som händer hamnar också i inboxen som loggpost. När spelaren går till inboxen ser hen alla events som hänt — även de som redan lösts.

**Tester:** Snapshot-tester per event-typ. Pixel-jämförelse mot mock (Opus producerar mock i Steg 3 om Code begär).

---

### STEG 4 — Scen-markörer för fas-skiften

Sex nya scener via Scene-infrastrukturen:

| Scen | Trigger | Tonen |
|---|---|---|
| `cup_intro` | Säsong 1, omg 1, om cup R1 är managed | "Innan säsongen — cupen. Tre rundor till final. Inget mer." |
| `season_premiere` | Innan första ligamatch (omg 1 i serien) | "Ispremiär. 22 omgångar framför oss." |
| `mid_season` | Omg 11, efter slutförd match | "Halvtid. Det ni gjort är gjort." |
| `final_stretch` | Omg 19, innan match | "Tre omgångar kvar. Mätningens tid." |
| `playoff_intro` | Innan kvartsfinal, om man kvalat | "Slutspel. En match avgör allt — varje gång." |
| `season_end_recap` | Efter sista matchen, oavsett placering | (varierar baserat på säsongens utfall) |

**Datafiler:** En per scen i `src/domain/data/scenes/`. Texten skrivs av Opus efter Code byggt arkitekturen.

**Triggers:** I `sceneTriggerService.ts`. Pure functions som tidigare.

**Förstegspriotitet:** Scen-triggers går *före* event-kö. Om en scen ska visas pausas event-flödet. Spelaren får scenen, sen rensas pendingScene, sen plockas nästa event från kön.

**Tester:** Pure logic-tester per trigger. Edge cases: scen visas inte två gånger samma säsong, korrekt prioritering om flera scen-villkor uppfylls.

---

### STEG 5 — Kritiska enskilda händelse-scener

Tre nya scener för stora individuella ögonblick:

| Scen | Trigger | Användning |
|---|---|---|
| `patron_conflict` | När patron-relation kraschar (<20) | "Lars Berglund: 'Då säger jag det rakt ut. Jag tror inte längre på riktningen.'" |
| `transfer_deadline` | Sista 24h av transferfönstret om aktiva bud finns | "Sista dygnet. Telefonen har inte slutat ringa." |
| `club_scandal` | Om klubben själv drabbas av skandal | (varierar baserat på skandaltyp) |

Dessa triggas från event-kön när events når extremvärden — inte från generiska state-checks. T.ex. patron-konflikt sker inte automatiskt vid relation < 20, utan när relations-event "patron_breaking_point" faktiskt poppar i kön.

**Anti-pattern att undvika:** Inte alla viktiga events ska bli scener. Endast de som *bryter tempo* och förtjänar fullskärm. Skadefall, mindre transferrykten, akademiprospekt — de stannar som event-kort i Portal.

---

## SAMMANSTÄLLD MODELL — så här ska spelet kännas

**Spelaren öppnar appen efter en match:**
1. SceneScreen kanske visas (om en fas-scen triggat: "Halvtid")
2. Sen Portal renderas. SituationCard säger något kontextuellt.
3. Eventuell PortalBeat över: "Första segern."
4. EventSlot visar EN event: "Karin Bergström vill ha en kommentar om transferryktet" (kritisk, deadline imorgon)
5. Spelaren tar ställning. Eventet löses.
6. Nästa event poppar: "Kioskvakten har slut på kaffe igen — tredje gången i januari." (atmosfärisk, kvittera)
7. Spelaren kvitterar. Nästa event: "Akademispelare Henriksson redo för uppflyttning" (medium, val)
8. Spelaren tar ställning eller säger "ej nu" (eventet flyttas till slutet av kön).
9. När alla events är hanterade — Portal är *lugn*. Bara situationscard och primary visas.

**Mellan matcher genereras nya events.** Skador, rykten, ortens röster, kafferumsskvaller. Allt går i kön. Spelaren ser dem en åt gången, i prioritetsordning, när det finns utrymme.

**En hel säsong = kanske 100-150 events totalt.** Spelade över 22 omgångar = 5-7 events per omgång. *En åt gången*. Inte 14 i klump.

---

## VAD DETTA INTE ÄR

- **Inte ett filter.** Inga events tas bort. Allt finns kvar, bara visas i ordning.
- **Inte en simplifiering.** Spelaren får MER information över tid, inte mindre — för hen kan faktiskt ta in det.
- **Inte en filtrering bort av atmosfär.** Tvärtom: atmosfäriska events har *garanterat plats* i flödet, eftersom de inte behöver "konkurrera" med kritiska events utan kommer i sin tur.
- **Inte en ersättning för inboxen.** Inboxen finns parallellt som dokumentation.
- **Inte en ny scen-typ.** Event-kort är *Portal-element*, inte scener. Scener är för vändpunkter.

---

## VERIFIERINGSPROTOKOLL

Efter varje steg — Code spelar i webbläsare och rapporterar:

**Efter Steg 1 (diagnos):** Tre rapporter. Inga ändringar att verifiera.

**Efter Steg 2 (kö-arkitektur):** Tester gröna, console.log visar att events landar i kön när de genereras. Inga UI-ändringar synliga.

**Efter Steg 3 (Portal-slot):** Spela 3 omgångar. Skärmdump på event-slot vid kritiskt, medium, atmosfäriskt event. 2-3 meningar om hur det känns — är ett event åt gången hanterbart?

**Efter Steg 4 (fas-scenes):** Spela genom säsongspremiär, halvtid, slutspurt. Skärmdumpar. 2-3 meningar om om scenerna bryter tempo som tänkt.

**Efter Steg 5 (kritiska scenes):** Trigga patron-konflikt manuellt (testverktyg eller specifika game state). Skärmdump.

---

## TEXTÅTAGANDE FRÅN OPUS

Code lämnar svenska texter tomma i:
- EventCard-mallar (per event-typ)
- Scen-data för fas-scenes (cup_intro, season_premiere, mid_season, final_stretch, playoff_intro, season_end_recap)
- Scen-data för kritiska scenes (patron_conflict, transfer_deadline, club_scandal)

Opus fyller dem mellan stegen. Bandysverige-ton. Korta meningar. Konkreta bilder.

---

## LEVERANSORDNING

1. **Steg 1** (diagnos) — 1 dag. Tre rapporter. Opus läser och bekräftar.
2. **Steg 2** (kö-arkitektur) — 2-3 dagar. Datatyper, service, tester, migration av befintliga services.
3. **Steg 3** (Portal-slot) — 2 dagar. UI för att visa ett event åt gången. Opus skriver event-mallarna.
4. **Steg 4** (fas-scenes) — 2 dagar. Sex nya scen-typer. Opus skriver texterna.
5. **Steg 5** (kritiska scenes) — 1-2 dagar. Tre scen-typer. Opus skriver texterna.

Mellan varje steg: stopp för Jacob att säga fortsätt, pivot, eller stopp.

Opus kommer skriva alla svenska texter i Opus-tur, inte specera dem. Code lämnar tomma slots.

---

## SLUTNOTERING TILL CODE

Detta är en stor spec. Den ska INTE drivas till slutet utan paus. Mellan varje steg — playtest. Den enda mätaren som spelar roll är: **känns det rikare och mer hanterbart efter steget än innan?**

Om svaret är nej — stopp och pivot. Specen är inte helig.

Slut.
