# FEATURE SPEC — Ortens maktspel: Mecenater, Kommun & Anläggning

## Spelets själ

Bandy Manager handlar inte bara om 11 spelare på is. Det handlar
om en förening i ett litet samhälle. Mecenaten som betalar för
strålkastarna men vill bestämma vilka som spelar. Kommunalrådet
som skickar bidrag men kräver ungdomssatsning. Brukspatronen som
bjuder på älgjakt och förväntar sig att du tackar ja.

Det här systemet gör orten till en levande plats med människor
som har egna agendor, pengar, och förväntningar.

---

## DEL 1: MECENATER

### Bakgrund: Karl Hedin och IFK Leksand

Karl Hedin är arketypen. Skogsägare och industriman. Figurerar
i bakgrunden. Betalar för dyra värvningar. Täcker underskott.
Men har också ett "silent shout" — alla vet vem som bestämmer
egentligen, även om det aldrig sägs högt. Tränare ställer upp
på jaktresor. Förhandlingar sker i bastun, inte i styrelserummet.

### Koncept: Mecenat-pool istället för en patron

Nuvarande system: 1 patron, reaktivt.
Nytt system: 0-3 mecenater som kan dyka upp, gå, och krocka
med varandra.

### Mecenat-profiler

Varje mecenat genereras med:

```typescript
interface Mecenat {
  id: string
  name: string
  gender: 'male' | 'female'
  business: string          // "Hedins Sågverk", "Dalsjö IT Solutions"
  businessType: MecenatType
  wealth: number            // 1-5 (1=lokal handlare, 5=miljonär)
  personality: MecenatPersonality
  influence: number         // 0-100
  happiness: number         // 0-100
  patience: number          // 0-100
  contribution: number      // kr/säsong
  totalContributed: number
  demands: MecenatDemand[]
  socialExpectations: SocialEvent[]
  isActive: boolean
  arrivedSeason: number
  favoritePlayerId?: string
  wantsStyle?: string
  silentShout: number       // 0-100, hur mycket "osynligt" inflytande
}

type MecenatType = 
  | 'brukspatron'     // Sågverk, stålverk, pappersbruk
  | 'skogsägare'      // Skog och mark
  | 'lokal_handlare'  // Butik, järnhandel, bilhandlare
  | 'entrepreneur'    // Clas Ohlson-typ, lokal framgångssaga
  | 'it_miljonär'     // Sålde sitt techbolag, "privata projekt"
  | 'fastigheter'     // Äger halva centrum
  | 'jordbrukare'     // Storbönderna

type MecenatPersonality =
  | 'tyst_kraft'      // Karl Hedin. Betalar, kräver inte rampljus, men alla VET
  | 'showman'         // Vill synas. Namnskylt på arenan. Talar i media
  | 'kalkylator'      // Affärsmässig. Vill ha valuta för pengarna
  | 'nostalgiker'     // Spelade själv som ung. Känslomässig koppling
  | 'kontrollfreak'   // Vill bestämma taktik, transfers, allt
  | 'filantropen'     // Ger utan krav. Sällsynt och fantastisk
```

### Generering per klubbregion

Mecenater kopplas till regionens näringsliv:

```typescript
const REGION_BUSINESSES: Record<string, MecenatTemplate[]> = {
  'Dalarna': [
    { type: 'brukspatron', businesses: ['Hedins Sågverk', 'Dalslipsten AB', 'Borlänge Stål'] },
    { type: 'entrepreneur', businesses: ['Dahlströms Sporthandel', 'Mora Knivfabrik'] },
    { type: 'it_miljonär', businesses: ['Dalsjö Digital', 'SkiStar Ventures'] },
    { type: 'skogsägare', businesses: ['Siljansfors Skog', 'Orsa Skogsbruk'] },
  ],
  'Norrland': [
    { type: 'skogsägare', businesses: ['Ångermanlands Skog', 'Norrskog'] },
    { type: 'brukspatron', businesses: ['Kubal Aluminium', 'SCA Timmer'] },
    { type: 'fastigheter', businesses: ['Nordfastigheter', 'Bostads-AB Mimer'] },
  ],
  'Mälardalen': [
    { type: 'it_miljonär', businesses: ['Voltiq Systems (såldes 2019)', 'DataNode AB'] },
    { type: 'fastigheter', businesses: ['Västeråshus', 'Eskilstuna Fastigheter'] },
    { type: 'entrepreneur', businesses: ['Lindströms Bil', 'Kjells Markiser'] },
  ],
  // etc per region...
}
```

### Kön och namn

Inte bara gubbar. Slumpa 30% kvinnliga mecenater:

```typescript
const FEMALE_MECENAT_NAMES = [
  'Margareta', 'Karin', 'Elisabeth', 'Birgitta', 'Ingrid',
  'Christina', 'Eva', 'Gunilla', 'Lena', 'Annika',
]
const MALE_MECENAT_NAMES = [
  'Karl-Erik', 'Bengt', 'Stig', 'Lars-Göran', 'Rolf',
  'Per-Olof', 'Arne', 'Göran', 'Tord', 'Lennart',
]
```

Younger IT-miljonärer kan ha modernare namn:
```typescript
const YOUNG_NAMES_M = ['Martin', 'Daniel', 'Fredrik', 'Johan', 'Niklas']
const YOUNG_NAMES_F = ['Sara', 'Emma', 'Malin', 'Anna', 'Elin']
```

### Sociala förpliktelser — Jaktresor och middagar

Mecenater bjuder in tränaren till sociala sammanhang.
Att tacka nej har konsekvenser. Att tacka ja kostar tid.

```typescript
interface SocialEvent {
  type: 'jakt' | 'middag' | 'golfrunda' | 'bastu_affärssamtal' |
        'vinkväll' | 'segelbåt' | 'hockeymatch' | 'vernissage'
  mecenatId: string
  season: number
  matchday: number
}
```

**Event-exempel: Jaktresa**

> **Karl-Erik Hedin** har bjudit in dig på älgjakt i helgen.
> Tre dagar i skogen med några lokala företagare.
>
> "Det är ingen business, bara jakt. Men det vore trevligt
> om du kom."
>
> (Alla vet att det ÄR business.)
>
> **Tacka ja** → 🤝 +15 relation · ⏰ -5 fitness (truppen missar
> en träningsdag) · 💰 Mecenat nöjd, ökar bidrag
>
> **Tacka nej artigt** → 🤝 -5 relation · "Jag förstår.
> Nästa gång kanske."
>
> **Tacka nej rakt** → 🤝 -15 relation · "Jaha. Då vet jag."

**Brukspatronen** bjuder på jakt och bastu.
**IT-miljonären** bjuder på middag och vinprovning.
**Skogsägaren** bjuder på skoterkörning och korvgrillning vid sjön.
**Entreprenören** bjuder på hockeymatch och affärslunch.

### Silent shout — Det osynliga inflytandet

`silentShout` (0-100) ökar med:
- Total contribution (ju mer pengar, desto mer anspråk)
- Accepterade sociala events
- Tid (ökar 5/säsong om aktiv)

Minskar med:
- Avvisade krav
- Nya mecenater som balanserar makten

Effekter vid hög silentShout:

**30+:** Media refererar till mecenaten: *"Enligt uppgifter nära
klubben ska Karl-Erik Hedin vara nöjd med den nya forwarden."*

**50+:** Mecenaten har åsikter om transfers: *"Jag hörde att
Sandviken har en forward. Jag kan tänka mig att bidra."*
(Event med "Köp spelaren mecenaten föreslår" som val)

**70+:** Mecenaten vill påverka taktiken: *"Vi spelar för
defensivt. Jag vill se anfall."*

**90+:** Mecenaten hotar styrelsen: *"Om det inte blir ändringar
överväger jag att dra mig tillbaka."* Styrelsen pressas att
agera — spelaren måste välja sida.

### Mecenat-dynamik: Konflikter och allianser

Med 2+ mecenater uppstår dynamik:

**Allians:** Två mecenater med liknande intressen stödjer varandra.
*"Både Karl-Erik och Margareta har uttryckt intresse för att
finansiera en ny värmestuga vid planen."*

**Konflikt:** Mecenater med olika visioner krockar.
*"Karl-Erik vill ha en utländsk forward. Margareta tycker vi
ska satsa på ungdomar. Du måste välja vems pengar du tar."*

**Rivalitet:** En ny mecenat dyker upp och den gamla känner sig
hotad.

---

## DEL 2: KOMMUN OCH POLITIK

### Från reaktivt till proaktivt

Nuvarande system: Politikern skickar events, spelaren reagerar.
Nytt system: Spelaren kan INITIERA kontakt med kommunen.

### Politisk profil

Utöka den befintliga `LocalPolitician` med mer karaktär:

```typescript
interface LocalPolitician {
  // befintliga fält...
  
  // NYTT: Personlighet
  campaignPromise?: string    // "Bygg en ishall senast 2028"
  personalInterest?: 'bandy' | 'fotboll' | 'kultur' | 'ingenting'
  mediaProfile: 'tystlåten' | 'utåtriktad' | 'populist'
  
  // NYTT: Politisk dynamik
  oppositionStrength: number  // 0-100, hur stark opposition
  electionYear: number        // År för nästa val
  popularitet: number         // 0-100
}
```

### Proaktiva åtgärder (nytt!)

Spelaren kan initiera kontakt med kommunen via Orten-tabben:

**📋 Bjud in till match** → Politikern kommer, ser laget spela.
Relation +10 om vinst, +3 om förlust. Kostar inget.
Cooldown: 1 gång per 5 omgångar.

**📊 Presentera budgetplan** → Visa kommunen att ni hanterar
pengar ansvarsfullt. Kräver att ekonomin är positiv.
Relation +5, chans till ökat kommunbidrag.
Cooldown: 1 gång per säsong.

**📝 Ansök om extra bidrag** → Formell ansökan. Utfall beror
på relation, agenda-match, och politikerns generositet.
Kan ge 20k-80k extra. Kan också avslås offentligt (media).
Cooldown: 1 gång per säsong.

**🏗️ Föreslå anläggningsprojekt** → Se Del 3 (Anläggning).

### Nyval

Var 4:e säsong är det kommunalval. Ny politiker kan ta över.
Den nya kanske har en helt annan agenda.

Event: *"Nytt kommunalval. Din kontakt Anna Lindgren (S) ställde
inte upp för omval. Nya kommunalrådet är Per Svensson (M) med
agenda 'savings'. Han vill se över alla bidrag."*

Relationen nollställs. Du börjar om.

### Politisk färg

Koppla agenda till parti:

| Parti | Typisk agenda | Stil |
|-------|--------------|------|
| S | inclusion, youth | Stödjande, vill ha breddidrott |
| M | savings, prestige | Affärsmässig, vill ha valuta |
| C | youth, infrastructure | Landsbygdsvänlig, gillar bredd |
| L | infrastructure, prestige | Rationell, vill effektivisera |
| KD | youth, inclusion | Familjefokus, låga bidrag |
| Lokalt | * | Oförutsägbar, persondriven |

---

## DEL 3: ANLÄGGNING

### Problem

`club.facilities` finns (0-100) men spelaren kan inte göra
något åt det. Ingen investering, ingen uppgradering.

### Koncept: Anläggningsprojekt

Flytta till Orten-tabben som "🏗️ Anläggning" med investeringsbeslut.

```typescript
interface FacilityProject {
  id: string
  name: string
  description: string
  cost: number
  duration: number          // omgångar
  facilitiesBonus: number   // +X till club.facilities
  otherEffects: string[]    // "+500 publikkapacitet", "+10% träningskvalitet"
  requiresKommun: boolean   // behöver kommunens hjälp?
  kommunCostShare: number   // 0-1, hur mycket kommunen betalar
  status: 'available' | 'in_progress' | 'completed'
  startedMatchday?: number
}
```

### Tillgängliga projekt (progressiv lista)

Vilka projekt som syns beror på nuvarande `facilities`-nivå:

**Nivå 0-30 (Grundläggande):**
- 🏗️ **Förbättra omklädningsrum** — 50k, 4 omg, +10 facilities
  *"Duscharna läcker och bänkarna är från 80-talet."*
- 💡 **Uppgradera strålkastare** — 80k, 6 omg, +8 facilities
  *"Bättre ljus = bättre TV-bilder = bättre sponsoravtal."*

**Nivå 30-60 (Standard):**
- 🧊 **Installera konstfrusen is** — 200k, 10 omg, +15 facilities
  Kräver kommunstöd (50%). Politikerns infrastructure-agenda hjälper.
  *"Konstis förlänger säsongen och höjer kvaliteten."*
- 🏠 **Bygg värmestuga** — 120k, 8 omg, +1000 publikkapacitet
  *"Kaffe, korv och värme. Folk stannar längre."*

**Nivå 60-80 (Toppklass):**
- 🏟️ **Renovera läktare** — 300k, 12 omg, +2000 publikkapacitet
  *"Sittplatser med tak. Som en riktig arena."*
- 🏋️ **Bygga gym** — 150k, 8 omg, +15% träningseffekt
  *"Spelarna behöver inte längre träna hemma."*

**Nivå 80+ (Premium):**
- 🏢 **Inomhushall** — 2M kr, 20 omg, +30 facilities, hus=true
  Kräver kommunstöd (60%) + mecenat (20%). Enormt projekt.
  *"En ishall förändrar allt. Träning året om. Matcher i alla väder."*

### Finansiering

Anläggningsprojekt kan finansieras genom:
1. **Klubbkassan** — du betalar allt
2. **Kommunstöd** — politikern betalar X% (kräver bra relation)
3. **Mecenat-bidrag** — mecenaten sponsrar (ökar silentShout)
4. **Kombination** — alla tre bidrar

Event vid projektstart:
> **Du föreslår: Installera konstfrusen is (200 000 kr)**
>
> Kommunen kan bidra med 50% om kommunalrådet godkänner.
> Karl-Erik Hedin erbjuder 30%.
>
> **Acceptera kommunens erbjudande** → Klubben betalar 100k,
> kommunen 100k. Relation +10.
>
> **Acceptera Hedins erbjudande** → Klubben betalar 40k,
> kommunen 100k, Hedin 60k. Silent shout +10.
>
> **Betala allt själv** → 200k ur kassan. Oberoende.

---

## DEL 4: ORTEN-TABBEN (UI)

### Ny struktur

KlubbTab/Orten omstruktureras:

```
🏟️ ANLÄGGNING
  Faciliteter: 45/100  [████░░░░░░]
  Pågående: Förbättra omklädningsrum (3 omg kvar)
  [Starta nytt projekt →]

👥 MECENATER
  Karl-Erik Hedin (Hedins Sågverk)
  Bidrag: 80 000 kr/säsong · Inflytande: 45
  🤝 Nöjd · 💬 "Bra jobbat med Sandviken-matchen"
  
  Margareta Lindqvist (DalaFastigheter)
  Bidrag: 40 000 kr/säsong · Inflytande: 20
  😐 Neutral · 💬 "Vi får se hur det går"
  
  [Mecenat-historik →]

🏛️ KOMMUN
  Kommunalråd: Anna Lindgren (S)
  Agenda: Ungdom · Relation: 62/100
  Kommunbidrag: 45 000 kr/säsong
  Nästa val: 2028
  
  [Bjud in till match]  [Presentera budget]  [Ansök om bidrag]

📋 STYRELSENS UPPDRAG (om implementerat)
  Ekonomi i balans ✅  |  Egenfostrade ⚠️ (2.1 snitt)
```

---

## SAMMANKOPPLING: Allt hänger ihop

### Anläggning ↔ Kommun
Stora projekt kräver kommunstöd. Politikerns infrastructure-
agenda gör det billigare. Dålig relation = avslag.

### Anläggning ↔ Mecenat
Mecenaten kan sponsra projekt (ökar silentShout).
"Karl-Erik vill sätta sitt namn på den nya värmestugan."

### Mecenat ↔ Kommun
Kan krocka. Kommunen vill ha ungdomssatsning, mecenaten vill
ha dyra värvningar. Du måste navigera.

### Allt ↔ Styrelsemål
"Förbättra anläggningen" kan vara ett sekundärt mål.
Kassören vill att mecenaten betalar. Traditionalisten vill
att kommunen hjälper. Modernisten vill ha en inomhushall.

### Allt ↔ Transfers
Mecenatens pengar kan finansiera värvningar. Men till priset
av inflytande. "Jag betalar forwarden. Men jag vill att han
startar."

---

## IMPLEMENTATIONSPLAN

Stort system. Minst 3 separata implementation-sprints.

**Sprint A: Mecenat-systemet**
1. Datastrukturer (Mecenat, MecenatType, generering)
2. Mecenat-pool i newGameSetup (0-1 vid start, fler dyker upp)
3. Event-kedja: intro → sociala events → krav → silent shout
4. UI i Orten-tabben (mecenat-kort med relation/bidrag)

**Sprint B: Kommun proaktivt + Anläggning**
5. Proaktiva kommun-åtgärder (3 knappar i Orten-tabben)
6. FacilityProject-system + UI
7. Finansieringsflöde (klubb/kommun/mecenat-kombination)
8. Nyval-event var 4:e säsong

**Sprint C: Sammankoppling + Polish**
9. Mecenat-dynamik (konflikter, allianser)
10. Silent shout → taktik/transfer-påverkan
11. Koppling till styrelsemål
12. Sociala events med rika texter (jakt, middag, bastu)

Varje sprint berör > 10 filer. **Specar för Code.**
