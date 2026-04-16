# SPRINT 08 — MECENATER + KLUBB-ID NORMALISERING

**Berör ID:** NARR-001, DREAM-017, BUG-012, BUG-013  
**Kostnad:** ~1-2 sessioner  
**Typ:** Feature + städning  
**Förutsätter:** Sprint 2 klar

---

## SYFTE

Mecenaten är idag en statisk karaktär med `happiness`-värde som decayar. Hen åldras inte, går inte i pension, ger inga middagsbjudningar. Samtidigt är klubb-ID:n ärvda från verkliga klubbar (`club_sirius` heter "Söderfors") — vilket gör att Forsbacka får Sandvikens Stålförädling som mecenat-business. Två besläktade problem, en sprint.

---

## ID 1: BUG-012 — Normalisera klubb-ID:n

**Källa:** Opus  
**Plats:** Alla filer som refererar `club_sirius`, `club_sandviken`, `club_edsbyn`, `club_vasteras`, `club_broberg`, `club_falun`, `club_ljusdal`, `club_tillberga`, `club_kungalv`, `club_skutskar`, `club_soderhamns`, `club_villa`

### Mapping

```
club_sandviken  → club_forsbacka
club_sirius     → club_soderfors
club_vasteras   → club_vastanfors
club_broberg    → club_karlsborg
club_villa      → club_malilla
club_falun      → club_gagnef
club_ljusdal    → club_halleforsnas
club_edsbyn     → club_lesjofors
club_tillberga  → club_rogle
club_kungalv    → club_slottsbron
club_skutskar   → club_skutskar  (behålls — namn matchar)
club_soderhamns → club_heros
```

### Strategi

**Steg 1:** Gör en global sök-och-ersätt över hela `src/` för varje mapping ovan. Använd grep för att hitta förekomster:

```bash
grep -r "club_sandviken\|club_sirius\|club_vasteras\|club_broberg\|club_villa\|club_falun\|club_ljusdal\|club_edsbyn\|club_tillberga\|club_kungalv\|club_soderhamns" src/
```

**Filer som troligen är berörda:**
- `src/domain/data/rivalries.ts`
- `src/domain/services/worldGenerator.ts` (CLUB_TEMPLATES)
- `src/domain/services/mecenatService.ts` (REGION_BUSINESSES nycklar)
- Eventuella tester med hårdkodade klubb-ID

**Steg 2:** Kör `npm test` — tester som hårdkodar ID kommer failar. Uppdatera dem.

**Steg 3:** Kör `npx ts-node scripts/calibrate.ts` — verifiera att kalibreringen är intakt.

**Steg 4:** Migrationsoro — gamla sparfiler har gamla ID. Lägg till i `saveGameStorage.ts`:

```typescript
const CLUB_ID_MIGRATION: Record<string, string> = {
  club_sandviken: 'club_forsbacka',
  club_sirius: 'club_soderfors',
  club_vasteras: 'club_vastanfors',
  club_broberg: 'club_karlsborg',
  club_villa: 'club_malilla',
  club_falun: 'club_gagnef',
  club_ljusdal: 'club_halleforsnas',
  club_edsbyn: 'club_lesjofors',
  club_tillberga: 'club_rogle',
  club_kungalv: 'club_slottsbron',
  club_soderhamns: 'club_heros',
}

function migrateClubIds(save: SaveGame): SaveGame {
  const mapId = (id: string) => CLUB_ID_MIGRATION[id] ?? id
  
  return {
    ...save,
    managedClubId: mapId(save.managedClubId),
    clubs: save.clubs.map(c => ({ ...c, id: mapId(c.id) })),
    players: save.players.map(p => ({ 
      ...p, 
      clubId: mapId(p.clubId),
      academyClubId: p.academyClubId ? mapId(p.academyClubId) : undefined,
    })),
    fixtures: save.fixtures.map(f => ({
      ...f,
      homeClubId: mapId(f.homeClubId),
      awayClubId: mapId(f.awayClubId),
    })),
    standings: save.standings.map(s => ({ ...s, clubId: mapId(s.clubId) })),
    // ... övriga fält som refererar clubId
  }
}
```

Kör migrationen vid load om `save.version < '1.4.0'`.

---

## ID 2: BUG-013 — Forsbacka får Sandviken-mecenater

**Källa:** Opus  
**Plats:** `src/domain/services/mecenatService.ts`  
**Beror på:** BUG-012 klar

### Fix

Eftersom klubb-ID efter BUG-012 heter `club_forsbacka`, uppdatera `REGION_BUSINESSES`:

```typescript
const REGION_BUSINESSES: Record<string, MecenatTemplate[]> = {
  forsbacka: [
    { type: 'brukspatron', businesses: ['Forsbacka Järnbruk', 'Bergslagens Stålförädling'] },
    { type: 'entrepreneur', businesses: ['Forsbacka Entreprenad', 'Gästrike Bil'] },
  ],
  soderfors: [
    { type: 'brukspatron', businesses: ['Söderfors Stålverk', 'Uppland-Gävle Järn'] },
    { type: 'entrepreneur', businesses: ['Söderfors Bygg', 'Uppsala Logistik'] },
  ],
  vastanfors: [
    { type: 'brukspatron', businesses: ['Västanfors Mekaniska', 'Bergslagens Smide'] },
    { type: 'it_miljonär', businesses: ['VoltaSystem AB', 'Västerås Tech'] },
  ],
  karlsborg: [
    { type: 'brukspatron', businesses: ['Karlsborgs Järnbruk', 'Lapplands Trä'] },
    { type: 'skogsägare', businesses: ['Norrbottensskog', 'Övre Norrlands Skogs-AB'] },
  ],
  malilla: [
    { type: 'entrepreneur', businesses: ['Målilla Glasbruk', 'Smålandsindustri'] },
    { type: 'brukspatron', businesses: ['Målilla Mekaniska', 'Hultsfreds Smide'] },
  ],
  gagnef: [
    { type: 'brukspatron', businesses: ['Gagnefs Sågverk', 'Dalarnas Trävaror'] },
    { type: 'skogsägare', businesses: ['Dalfalls Skog', 'Mora Timmer'] },
  ],
  halleforsnas: [
    { type: 'brukspatron', businesses: ['Hälleforsnäs Järnbruk', 'Södermanlands Gjuteri'] },
    { type: 'entrepreneur', businesses: ['Flens Bygg', 'Eskilstunas Mekaniska'] },
  ],
  lesjofors: [
    { type: 'brukspatron', businesses: ['Lesjöfors Fjäderfabrik', 'Värmlandsstål'] },
    { type: 'skogsägare', businesses: ['Värmlandsskog', 'Filipstadsbolagen'] },
  ],
  rogle: [
    { type: 'entrepreneur', businesses: ['Skåne Bygg', 'Öresunds Logistik'] },
    { type: 'fastigheter', businesses: ['Malmö Fastigheter', 'Skånekapital'] },
  ],
  slottsbron: [
    { type: 'brukspatron', businesses: ['Slottsbrons Pappersbruk', 'Värmlands Skog'] },
    { type: 'entrepreneur', businesses: ['Grums Entreprenad', 'Karlstads Bygg'] },
  ],
  skutskar: [
    { type: 'brukspatron', businesses: ['Skutskärs Massafabrik', 'StoraEnso Norra'] },
    { type: 'entrepreneur', businesses: ['Älvkarleby Bygg', 'Gävle Logistik'] },
  ],
  heros: [
    { type: 'brukspatron', businesses: ['Heros Bruk', 'Dalarna-Hälsinges Mekan'] },
    { type: 'skogsägare', businesses: ['Dalbergs Skog', 'Leksands Trä'] },
  ],
  default: [
    { type: 'entrepreneur', businesses: ['Lokala Bygg AB', 'Ortens Bil'] },
    { type: 'lokal_handlare', businesses: ['Handlarn', 'ICA-Kungen'] },
  ],
}
```

Nyckel-lookup ska fungera genom att strippa `club_`-prefixet: `const regionKey = clubId.replace('club_', '')`.

---

## ID 3: NARR-001 — Mecenaten kan åldras och gå i pension

**Källa:** Opus  
**Plats:** `src/domain/entities/Mecenat.ts`, `src/domain/services/mecenatService.ts`, `src/domain/services/eventService.ts`

### Datamodell

Utvidga `Mecenat`-interfacet:

```typescript
export interface Mecenat {
  // befintliga fält...
  age: number              // 45-72 vid skapande
  yearsActive: number      // startar på 0, ökar varje säsongsslut
  retirementThreshold: number  // 5-8 år beroende på personlighet
  hasAnnouncedRetirement: boolean  // flag för att inte trigga flera gånger
}
```

### Åldersgeneration

I `generateMecenat`:

```typescript
const age = 45 + Math.floor(rand() * 28)  // 45-72
const retirementThreshold = (() => {
  if (personality === 'nostalgiker') return 7 + Math.floor(rand() * 2)  // 7-8
  if (personality === 'kontrollfreak') return 6 + Math.floor(rand() * 2)  // 6-7
  if (personality === 'filantropen') return 5 + Math.floor(rand() * 2)  // 5-6
  return 5 + Math.floor(rand() * 3)  // 5-7 default
})()

return {
  // ...
  age,
  yearsActive: 0,
  retirementThreshold,
  hasAnnouncedRetirement: false,
}
```

### Säsongsslut-tick

I `seasonEndProcessor.ts`:

```typescript
if (game.mecenater) {
  game.mecenater = game.mecenater.map(m => ({
    ...m,
    age: m.age + 1,
    yearsActive: m.yearsActive + 1,
  }))
}
```

### Pensionsevent-trigger

I `eventService.ts` eller ny `mecenatRetirementService.ts`:

```typescript
export function checkMecenatRetirement(game: SaveGame): GameEvent | null {
  const eligible = (game.mecenater ?? []).filter(m =>
    m.isActive &&
    !m.hasAnnouncedRetirement &&
    (m.yearsActive >= m.retirementThreshold || m.age >= 70)
  )
  if (eligible.length === 0) return null
  
  const mecenat = eligible[0]
  return {
    id: `event_mecenat_retire_${mecenat.id}_${game.currentSeason}`,
    type: 'mecenatEvent',
    date: game.currentDate,
    subject: `${mecenat.name} funderar på sin framtid`,
    body: generateRetirementBody(mecenat),
    choices: [
      { id: 'listen', label: 'Lyssna på henne/honom', /* no cost */ },
      { id: 'plan_succession', label: 'Föreslå succession', /* +2 community */ },
      { id: 'offer_tribute', label: 'Erbjud jubileumsmatch', /* cost 25k, +5 happiness */ },
    ],
  }
}
```

### Body-generation

Baserat på personality + persona:

```typescript
function generateRetirementBody(m: Mecenat): string {
  if (m.personality === 'nostalgiker') {
    return `${m.name} ringer en torsdag kväll. "Jag har suttit här i ${m.yearsActive} år. Sett barnbarnen växa upp medan jag varit på matcher. Jag har börjat fundera." Rösten är mjuk. "Jag tänker inte sluta bråttom. Men jag ville att du skulle veta."`
  }
  if (m.personality === 'kontrollfreak') {
    return `${m.name} kallar till möte i styrelselokalen. "Efter ${m.yearsActive} år är det dags att säkerställa kontinuitet. Jag vill ha en succession-plan på bordet inom ett år." Inte sentimentalt. Operativt.`
  }
  if (m.personality === 'filantropen') {
    return `"Jag har alltid sagt att det här inte handlar om mig", säger ${m.name}. "Men jag måste vara ärlig. Åldern har tagit ut sin rätt. Kan vi prata om vad som händer efter mig?"`
  }
  return `${m.name}, ${m.age} år, ber om ett möte. "Jag har varit stödjande i ${m.yearsActive} år. Jag tänker på att trappa ner. Jag vill prata om hur vi gör det här bra."`
}
```

### Resolve-logik

Efter val:
- **listen:** Mecenat stannar en säsong till. `retirementThreshold += 1`.
- **plan_succession:** Generera `succession_mecenat`-event nästa säsong (ny mecenat introduceras som "protegé"). +2 community.
- **offer_tribute:** Jubileumsmatch-event under säsongen. Kostar 25k. +5 happiness, +3 community.

---

## ID 4: DREAM-017 — Mecenatens middag

**Källa:** THE_BOMB + Opus  
**Status:** Valbar för denna sprint — kan skjutas till Sprint 14 om tid tryter  
**Kostnad:** 6-8h

### Koncept

En gång per säsong (slumpmässigt mellan omgång 8-20): mecenaten bjuder på middag. Spelaren väljer scen baserat på mecenatens personlighet. Sekvens av 3-4 beslut med relationseffekt.

### Event-struktur

Nytt event-type: `mecenatDinner` med special-rendering (inte bara text).

```typescript
interface MecenatDinnerScene {
  sceneType: 'jakt' | 'bastu' | 'whisky' | 'middag_hemma'
  steps: Array<{
    prompt: string
    choices: Array<{ label: string; effect: { happiness: number; community?: number }; response: string }>
  }>
}
```

### Exempel-scen (jakt, kontrollfreak)

```typescript
{
  sceneType: 'jakt',
  steps: [
    {
      prompt: `"Det är andra fredagen i november. Karl-Erik Hedin står vid grinden till sina marker. Bössan är skött, hundarna på plats. Han räcker dig en termos. 'Kaffe. Vi börjar vid gryningen.'"`,
      choices: [
        { label: "Tacka för inbjudan, uttryck respekt för traditionen", effect: { happiness: 3 }, response: `Karl-Erik nickar kort. "Det är bra att du förstår vad det här är."` },
        { label: "Fråga om något är speciellt just i dag", effect: { happiness: 1 }, response: `"Det är alltid speciellt", svarar han. "Det är inte jakten. Det är skogen."` },
        { label: "Prata om klubben — är det därför vi är här?", effect: { happiness: -2 }, response: `Han tittar på dig länge. "Nej. Inte i dag."` },
      ],
    },
    {
      prompt: `"Tre timmar in. Ni sitter på en stubbe. En älg har passerat — ingen har skjutit. Karl-Erik säger ingenting. Tystnaden är lång."`,
      choices: [
        { label: "Låt tystnaden bära", effect: { happiness: 4 }, response: `Efter sju minuter nickar han. "Du lyssnar. Det är sällsynt."` },
        { label: "Fråga om hans far", effect: { happiness: 2 }, response: `Han berättar. Länge. Ögonen är på horisonten.` },
        { label: "Påpeka att vi borde hem snart", effect: { happiness: -4 }, response: `"Har du annat för dig?" Han ställer inte frågan hotfullt. Men den sätter sig.` },
      ],
    },
    {
      prompt: `"Ni är tillbaka vid köksbordet. Han häller upp snaps. 'Nu, då', säger han. 'Klubben.'"`,
      choices: [
        { label: "Presentera en strategi för säsongen", effect: { happiness: 2, community: 2 }, response: `Han lyssnar utan att avbryta. Ställer tre frågor. Nickar.` },
        { label: "Fråga vad han oroar sig för", effect: { happiness: 5 }, response: `"Jag oroar mig för att ni inte förstår vad bygden har investerat. Inte i kronor. I tid."` },
        { label: "Ta upp konkret ekonomisk fråga", effect: { happiness: -2 }, response: `"Inte i kväll", säger han milt. Men möjligheten är borta.` },
      ],
    },
  ],
}
```

### UI-rendering

Ny komponent `MecenatDinnerScene.tsx` som:
- Visas som full-screen modal (inte vanlig EventOverlay)
- En prompt åt gången med fade-in
- Mecenaten har bakgrundsbild/siluett (generisk tills assets finns — enklaste: mörk gradient + initialer)
- Efter val: respons visas, sedan nästa prompt
- Sista prompten: sammanfattning + cumulativ happiness-effekt

### Nedprioritering

Om tid tryter i denna sprint: implementera BARA scenstruktur + EN scentyp (`middag_hemma`, enklaste). De andra scenerna läggs till i Sprint 14 eller post-beta.

---

## ORDNING

1. BUG-012 klubb-ID normalisering (~2h)
2. BUG-013 REGION_BUSINESSES uppdatering (~30min, beror på BUG-012)
3. NARR-001 mecenat-åldrande + pension-event (~3h)
4. DREAM-017 middag (valbar, ~6h om den görs)

**Verifiering per ID:**
- BUG-012: `grep -r "club_sandviken\|club_sirius\|club_vasteras" src/` ger 0 träffar. `npm test` passerar.
- BUG-013: Starta nytt spel med Forsbacka → gå till orten → mecenat-intro-event visar "Forsbacka Järnbruk" eller "Bergslagens Stålförädling", inte "Sandvikens Stålförädling".
- NARR-001: I DevTools, sätt `mecenat.yearsActive = 7` manuellt → nästa säsongsslut ska trigga retirement-event.
- DREAM-017 (om gjord): Event triggas mellan omgång 8-20, scen renderas, val har effekt.

## SLUTRAPPORT

Code rapporterar:
```
BUG-012: ✅/⚠️/❌ – kort mening
BUG-013: ✅/⚠️/❌ – kort mening
NARR-001: ✅/⚠️/❌ – kort mening
DREAM-017: ✅/⚠️/❌/skippad – kort mening
```
