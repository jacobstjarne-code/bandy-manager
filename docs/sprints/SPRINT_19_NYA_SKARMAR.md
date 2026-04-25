# SPRINT 19 — NYA SKÄRMAR & FLÖDEN

**Typ:** UI-refaktor + nya features
**Uppskattad tid:** 10–14h
**Princip:** Stor sprint. Gör i ordning: auto-simulate → Omklädningsrummet → Taktiktavlan → Förväntan → Granska. Varje steg kan playtesas isolerat.

**Beroende:** Sprint 17 (komponentbibliotek) och Sprint 18 (AssistantCoach) ska vara körd först.

---

## 19A — Auto-simulate abandoned matches

**Problem:** Om spelaren refreshar webbläsaren mid-match eller lämnar till dashboarden utan att avsluta matchen, finns matchen i oklart state.

**Lösning:** Vid DashboardScreen mount, kontrollera om en match är markerad "in progress" men inte klar. Om ja — AI-simulera den till slutresultat med nuvarande lineup och taktik, spara resultatet, skapa ett inbox-meddelande från assistenttränaren.

**Implementation:**

```typescript
// I dashboardStore.ts eller gameStore.ts
async function simulateAbandonedMatch(fixtureId: string) {
  const fixture = state.fixtures.find(f => f.id === fixtureId)
  if (!fixture || fixture.done) return
  
  // Hämta nuvarande lineup + taktik från state
  const lineup = state.pendingMatchLineup ?? state.defaultLineup
  const tactic = state.pendingMatchTactic ?? state.defaultTactic
  
  // Kör silent match sim (silentMatchReportService.ts har redan det här)
  const result = runSilentMatch(fixture, lineup, tactic, ...)
  
  // Spara resultat som normalt
  saveLiveMatchResult(fixture.id, result)
  
  // Skapa inbox-meddelande från assistenttränaren
  const coach = state.game.assistantCoach
  const msg = createAbandonedMatchInboxMessage(coach, fixture, result.outcome, result.scoreString)
  addInboxMessage(msg)
  
  // Rensa pending-state
  clearPendingMatchState()
}

// I DashboardScreen mount:
useEffect(() => {
  const abandoned = findAbandonedMatch(state)
  if (abandoned) {
    simulateAbandonedMatch(abandoned.id)
  }
}, [])
```

**Kriterium för "abandoned match":**
- `fixture.status === 'in-progress'` (eller motsvarande flag)
- `fixture.done === false`
- Speltimer har startat (matchStartedAt sattes)

**UI:** Ingen overlay eller notifikation — bara inbox-meddelandet som dyker upp. Spelaren märker inget abrupt; det känns som att assistenten tog hand om det.

---

## 19B — Omklädningsrummet (list-vy)

**Nuläge:** Cirkeldiagram med spelarprickar som överlappar popup-bubblor.

**Åtgärd:** Ersätt helt med en list-baserad vy i tre sektioner.

**Layout (mobil 430px):**

```
👥 OMKLÄDNINGSRUMMET

INRE KRETS                                       2
Kapten och stjärnor. Röst i stora beslut.

┌─────────────────────────────────────────────┐
│ ⚪  ⭐ Per Ahlgren                        9  │
│     Kapten · B · 30 år                      │
├─────────────────────────────────────────────┤
│ ⚪  Nils Hedlund                          8  │
│     MF · 27 år · Elektriker                 │
└─────────────────────────────────────────────┘

STAMMEN                                          9
Basen i laget. Löser sin bit och håller tyst.

┌─────────────────────────────────────────────┐
│ ⚪  Tuomas Åberg                          7  │
│     MF · 27 år · Lärare                     │
├─────────────────────────────────────────────┤
│ ⚪  Viktor Fagerberg                      6  │
│     B · 19 år                               │
├─────────────────────────────────────────────┤
│             + 7 till →                      │
└─────────────────────────────────────────────┘

VID DÖRREN                                       2
Missnöjda. Kan sprida dåligt humör. Hantera aktivt.

┌─────────────────────────────────────────────┐
│ ⚪  Daniel Lindgren                       3  │  ← röd
│     Missnöjd med speltid                    │  ← röd text
├─────────────────────────────────────────────┤
│ ⚪  Mikael Lindberg                       2  │  ← röd
│     Vill bort till större klubb             │  ← röd text
└─────────────────────────────────────────────┘
```

**Per rad:**
- Porträtt-cirkel 22px (använd `generatePlayerPortrait` + cirkel-wrapper)
- Rad 1: spelarnamn (Georgia 13px). Kapten får ⭐-prefix.
- Rad 2: metadata (sans 10px muted) — format: `Position · Ålder · Yrke` eller `Kapten · Position · Ålder`
- Lojalitetssiffra längst till höger (Georgia 14px)
  - Inre krets: grön (--success)
  - Stammen: normal (--text-primary)
  - Vid dörren: röd (--danger)

**Sortering:**
- Inre krets: kapten först, sedan efter lojalitet desc
- Stammen: efter lojalitet desc
- Vid dörren: efter lojalitet asc (mest missnöjda först)

**"+ X till →"-rad:** Om stammen har fler än 3 spelare, visa 3 och sen en klickbar rad "+ X till →" som expanderar.

**Filen:** Skapa `src/presentation/components/club/LockerRoomCard.tsx`. Tidigare cirkeldiagram i samma fil kan tas bort.

---

## 19C — Taktiktavlan (3 flikar)

Helt ny komponent. Syftet: göra taktik-arbetet aktivt och rikt, inte bara dekorativt.

**Filen:** `src/presentation/components/tactic/TacticBoardCard.tsx`

**Flik 1 — FORMATION (default)**

Interaktiv plan där spelare kan dras mellan positioner och bänken.

- Högst upp: 4 formation-knappar (3-5-2, 3-4-3, 2-5-3, 4-4-2). Aktiv formation highlightad.
- Plan: 430×400px viewBox med 11 spelarprickar. Dragbara.
- Under plan: 13 bänkspelare som horisontell scroll-lista (små cirklar).
- Drag-and-drop:
  - Spelare från plan kan dras till annan position (byt)
  - Spelare från bänk kan dras till position (byt ut den som är där)
  - Swap-animation 200ms

**Färgkodning per position:**
- MV: copper (--accent)
- B: röd (--danger)
- MF: grön (--success)
- YH/YV: ice blue (--ice)
- A: copper

Använd `PositionTag`-komponenten från Sprint 17.

**Flik 2 — KEMI**

Samma plan-layout som Formation men read-only. Visar parbindningar som linjer mellan spelare.

- Grön linje: stark kemi (spelat länge ihop, delar yrke, samma uppväxtort, rivaler i ungdomen)
- Röd streckad linje: svag kemi (nya i laget, konflikt)
- Tjocklek = styrka (1.5px svag → 3px stark)

**Röd-zon-overlay:** Om formationen har "svaga zoner" (tunn täckning mellan spelare), rita en semi-transparent röd ellipse med förklarande text ("mittback-koppling", "bristande bredd").

**Under plan:** liten förklaringsruta:
```
KEMIN I LAGET
■ Grön linje — stark koppling
■ Röd linje — svag koppling
■ Röd zon — formationsbrist
```

**Beräkning av kemi:**
Skapa `src/domain/services/chemistryService.ts` som beräknar par-styrka mellan två spelare baserat på:
- Minuter spelade ihop
- Samma yrke (+0.3)
- Samma uppväxtort (+0.4)
- Rivaler sedan ungdomen (−0.5)
- Samma nationalitet/språk (+0.2)

Returnerar 0–1 värde. Rita linje om > 0.6 (grön) eller < 0.3 (röd).

**Flik 3 — ANTECKNINGAR**

Lista med assistenttränarens kommentarer per utvald spelare.

**Layout:**

```
📋 TAKTIKTAVLAN
    [ FORMATION ][ KEMI ][ ANTECKNINGAR← ]

┌─────────────────────────────────────────────┐
│ ⬜BE  BJÖRN EKMAN · ASSISTENT                │
│       "Sex spelare inför nästa match.        │
│        Kolla dom i tur och ordning."         │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ ⚪B   Per Ahlgren           [TRÖTT]          │
│       Kapten · 30 år · Lojalitet 9/10        │
│       "Var tungläst igår. Skulle behöva      │
│        vila, men han vill inte."             │
└─────────────────────────────────────────────┘

...
```

**Per spelar-not:**
- Position-cirkel (använd PositionTag-färgad border)
- Namn (Georgia 13px)
- Tag till höger om namn — en av:
  - TRÖTT (röd --danger)
  - GLÖDANDE (grön --success)
  - MISSNÖJD (koppar --accent)
  - SKOTTFORM (ice --ice)
  - VILL MER (koppar)
  - SVIKTANDE (röd)
- Metadata-rad (sans 10px muted): `Position · Ålder · Yrke · Trend`
- Citat (Georgia italic 11px muted) — indenterad under namn (vänsterkant x=86 från kortets vänsterkant)

**Logik för vilka spelare får notes:**
Generera automatiskt 5–7 spelare varje omgång baserat på:
- Form (högt/lågt)
- Lojalitet (under 4 → MISSNÖJD eller VILL MER)
- Speltid senaste 3 matcher (0 min + ung spelare → VILL MER)
- Condition/trötthet (< 50% → TRÖTT)
- Skottmål senaste matcher (hög → SKOTTFORM)
- MV-räddningar låg → SVIKTANDE

**Tränarens intro-meddelande:** högst upp, räknar antal kommentarer.

**Service:** `src/domain/services/playerNotesService.ts` som genererar noterna. Använder `generateCoachQuote` indirekt men med spelarspecifika quote-templates (utöka `assistantCoachService.ts` om nödvändigt).

---

## 19D — Förväntan & Profil-kort

Ersätt befintligt "Förväntan" eller "Klubbprofil"-kort med kombinerat kort som använder InfoRow.

**Filen:** `src/presentation/components/club/ExpectationsCard.tsx` (ny) eller uppdatera befintlig.

**Layout:**

```
🎯 FÖRVÄNTAN & PROFIL

KLUBBRENOMMÉ                     68 / 100
                                 Mittenklubb
[▓▓▓▓▓▓▓░░░]  ← progressbar

STYRELSENS FÖRVÄNTNING     Utmana toppen
SUPPORTRARNAS FÖRVÄNTNING  Utmana toppen
SPELSTIL                   Balanserad
KONSTIS                    Nej

──────────────────────────────

📋 STYRELSENS UPPDRAG

📌 SUPPORTERMOOD SKA NÅ 70        [AKTIV]
   Mikael Sandberg · modernist

📌 MAX 5 SKADOR                   [AKTIV]
   Lars Berglund · supporter
```

**Komponenter:**
- `InfoRow` för varje rad i första sektionen
- Progressbar 3px hög under klubbrenommé, koppar på grå bas
- Styrelsens uppdrag som små card-sharp kort med:
  - Label (9px uppercase, `📌 ...`)
  - Status-tag (använd PositionTag-stilen: AKTIV = grön, UPPFYLLD = grön fylld, FARA = röd)
  - Subtitle (Georgia italic 11px muted): `Namn · typ`

---

## 19E — Granska-skärmen (guided step flow)

**Ersätter helt:** nuvarande fördjupad matchvy (`MatchReportView.tsx` eller motsvarande). Efter match går spelaren till Granska, inte till gamla matchvyn.

**Filen:** `src/presentation/screens/GranskaScreen.tsx` (ny). Ta bort eller markera gamla fördjupad matchvy som deprecated.

**Struktur per steg:**

```
[innehåll för steget — fyller merparten av skärmen]

──────────────────────

FÖRDJUPA
[🎯]  [👥]  [📈]  [⚡]  [🎓]   ← 62×62px icon-buttons, space-between

┌─────────────────────────────────┐
│  KLAR — NÄSTA OMGÅNG            │  ← stor CTA
│  OMG 8 · KAGE (H)               │  ← destination
└─────────────────────────────────┘
```

**Ingen top-header.** Två navigationsnivåer:
1. Ikon-knapparna (gå till annat steg)
2. Stora CTA:n (avsluta Granska, gå till nästa omgång)

### Icon-buttons state

- **Aktivt steg:** Fylld kopparbakgrund, vit text/ikon (vilar på steget du tittar på)
- **Besökta steg:** 45% opacity + streck under (klickbara men visuellt dämpade)
- **Ej besökta:** copper-outline, tillgängliga att klicka

### Layout mobil (430px)

```tsx
<div style={{
  display: 'flex',
  justifyContent: 'space-between',
  gap: 0,
  marginTop: 12,
  marginBottom: 16,
}}>
  {/* 5 icon-buttons, varje 62×62px */}
</div>
```

`justify-content: space-between` fördelar knapparna jämnt över hela bredden.

### Sex steg

**Steg 1 — Översikt**
- Slutresultat (stora siffror, segerbadge, POTM)
- Media (journalist + rubrik)
- Statistik (InfoRow med skott, hörnor, bollinnehav, straffar, utvisningar)
- Viktigaste momenten (3–4 händelser)

**Steg 2 — Shot map**
- SVG plan som tar stor del av skärmen
- Prickar: grön=mål, kopparrust=räddat, grå=miss
- Större prick = högre xG
- Målskyttens namn som etiketter på målprickar
- Teckenförklaring under
- "Mönstret" — textruta som förklarar ("Målilla sköt främst centralt — hög chanskvalitet. Karlsborg sköt oftare men längre bort.")

**Steg 3 — Spelare**
- Alla 11 + avbytare i rating-ordning
- Per rad: position-cirkel, namn (kapten ⭐-prefix), individuell statistik (ex "4 mål · 1 assist" eller "14 räddn · 3 bakade"), rating 0–10
- POTM får speciell highlight

**Steg 4 — Förlopp**
- Momentumgraf över 90 min (två linjer, ett lag per färg)
- Tidslinje av alla händelser — mål, utvisningar, byten, taktikändringar
- Per händelse: tid + ikon + kort beskrivning

**Steg 5 — Beslut**
- Lista av alla interaktiva val spelaren gjorde
- Hörnor: "3 av 4 → mål"
- Straffar: "1 av 1"
- Kontringar: individuell
- "Bästa beslutet" — framhäv ett val som fick bäst utfall
- "Värsta beslutet" — om relevant

**Steg 6 — Analys**
- Tränarens sammanfattning (stort kort med assistenttränarens citat)
- Konsekvenser (tabellposition ±, form-förändringar per spelare, lojalitets-skift)
- CTA här blir 64px hög (större än i andra steg)

### Avsluta Granska

Spelaren måste trycka på "KLAR — NÄSTA OMGÅNG" för att gå vidare. Kan också lämna via vanliga BottomNav, men då är matchen inte "officiellt granskad" (matcha mot hur DashboardScreen hanterar ograsnkade matcher — kanske ska det fortfarande funka).

### Shot map data

Shot map kräver att varje skott har (x, y)-koordinat. Kolla nuvarande `matchEngine.ts` — om skottdata inte har koordinater, lägg till approximativa koordinater baserat på skott-typ (nära/mitten/distans) och slumpad variation. Inte exakt, men ger känsla.

### Passningsnätverk (endast om enkelt)

Om det är lätt att spåra passningar (vilken spelare passade till vilken), visa ett nätverk i Förlopp-steget. Om det är stor datamodelleringsuppgift, hoppa — det kan bli en senare sprint.

---

## Acceptanskriterier

- [ ] Abandoned matches simuleras automatiskt vid dashboard mount, inbox-meddelande skapas
- [ ] Omklädningsrummet är list-baserat med tre sektioner, cirkeldiagram borttaget
- [ ] Taktiktavlan har tre flikar som fungerar (Formation drag-and-drop, Kemi rita linjer, Anteckningar 5–7 spelare per omgång)
- [ ] Förväntan & Profil använder InfoRow från primitives
- [ ] Granska-skärmen har 6 steg med ikon-nav + stor CTA, utspridda med space-between
- [ ] Gamla fördjupade matchvyn är borttagen eller deprecated
- [ ] Shot map renderar med prickar och mönsterförklaring
- [ ] Spelare-steg visar alla 11 i rating-ordning
- [ ] CTA "KLAR — NÄSTA OMGÅNG" leder till nästa omgångs lobby
- [ ] Alla nya skärmar är 430px-kompatibla

---

## Filer som skapas/ändras

**Nya:**
- `src/presentation/components/club/LockerRoomCard.tsx`
- `src/presentation/components/tactic/TacticBoardCard.tsx`
- `src/presentation/components/club/ExpectationsCard.tsx`
- `src/presentation/screens/GranskaScreen.tsx`
- `src/domain/services/chemistryService.ts`
- `src/domain/services/playerNotesService.ts`

**Ändras:**
- `src/presentation/screens/DashboardScreen.tsx` (abandoned match useEffect)
- `src/presentation/store/gameStore.ts` (simulateAbandonedMatch action)
- `src/application/navigation/routes.ts` (lägg till Granska-route, ta bort gamla matchrapport-route om möjligt)
- `src/domain/services/matchEngine.ts` (lägg till skott-koordinater om saknas)
- Ev. `src/presentation/components/match/MatchReportView.tsx` → deprecated eller raderad
