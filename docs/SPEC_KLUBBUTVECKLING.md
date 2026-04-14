# Klubbutveckling — säsong 2 och framåt

Kärnproblem: säsong 1 och säsong 5 känns likadana ekonomiskt. Du tjänar samma pengar, har samma möjligheter, fattar samma typ av beslut. Klubben UTVECKLAS inte.

Kompletterar `docs/THE_BOMB.md` som täcker narrativ, atmosfär, korsreferenser och känslomässiga höjdpunkter. Tillsammans definierar de två dokumenten vad som gör spelet värt att spela i 5+ säsonger.

---

## DESIGNPRINCIPER

1. **Varje säsong ska erbjuda nya beslut.** Inte bara "vinna fler matcher". Investera i akademin? Bygga värmestuga? Satsa på kommersiellt?
2. **Trade-offs, inte bara mer.** Bygger du gym förlorar du pengar till transfers. Uppgraderar du akademin tar det tre säsonger innan det syns.
3. **Inomhushallen är slutmålet.** Den kostar 2M, kräver kommunens stöd, tar 20 omgångar att bygga. Det är en 4-5 säsongers resa.
4. **Bruksortsrealism.** Du har inte obegränsade pengar. Varje investering märks. ICA Maxi-avtalet kan vara skillnaden.

---

## 1. EKONOMISK PROGRESSION

### Nuläge
- Intäkter: reputation × 120/omg + sponsorer + biljetter + community-aktiviteter + volontärer
- Kostnader: löner (månadslön/4) + community-driftskostnader
- Netto: typiskt ±2-10 tkr/omg
- Ingen tillväxtmekanism förutom att vinna → högre reputation → marginellt mer pengar

### Nya tillväxtspakar

**A) Sponsortillväxt kopplad till framgång**

Nuvarande: sponsorer dyker upp slumpmässigt, 40% chans. Ingen koppling till prestation.

Nytt: sponsormarknaden reagerar på klubbens tillstånd:

```
Trigger → Sponsor-event
────────────────────────────────────
Topp 4 efter 12 omg    → Regionalsponsor (2500-4000/omg, 12 omg)
SM-slutspel             → Nationell sponsor approach ("Vi vill synas i slutspelet")
CS > 70                 → Kommunalt näringslivsstöd (engångsbelopp 30-50 tkr)
Inomhushall byggd       → Arena-namnsponsor (10 000/omg, 22 omg) ← SPELFÖRÄNDRANDE
Publik > 1000 snitt     → Cateringavtal (1500/hemmamatch)
Akademispelare i A-lag  → Utbildningssponsor (1000/omg, "Vi stödjer ungdomssatsningen")
```

Implementation: `sponsorService.ts` → `generateContextualSponsor(game)` som kollar triggers. Max 1 kontextuell sponsor per säsong. Genereras vid omgång 12 (halvvägs), vid slutspelskval, eller vid säsongsslut.

**B) Publikutveckling**

Nuvarande: publik beräknas per match baserat på capacity × attendanceRate. Ingen trend.

Nytt: `averageAttendance` redan finns i SaveGame. Använd det:

```typescript
// Vid säsongsslut:
nextSeasonBaseAttendance = currentAverageAttendance * 0.7 + reputation * 3

// Triggers som påverkar TRENDEN (inte bara enstaka matcher):
// - 3+ hemmasegrar i rad → +5% trend
// - CS > 70 → +8% (orten pratar om klubben)
// - Värmestuga byggd → +10% permanent (folk stannar)
// - Läktare renoverad → +15% permanent (fler platser, bättre upplevelse)
// - Inomhushall → +40% permanent + inga väderbortfall
```

**C) Löneeskalering**

Nuvarande: löner är fasta vid spelargenering. Ingen inflation.

Nytt: vid kontraktsförnyelse → spelare kräver löneökning:
```
Nuvarande lön × (1.0 + spelaren s ålder/100 + form/200)
Ung talang (< 22): +5-15%
Etablerad (23-28): +10-25%
Veteran (29+): +0-10% eller accepterar sänkning om lojal
```

Skapar lönedilemma: behålla din 28-åriga toppscorer som vill ha +25%, eller låta honom gå och satsa på 19-åringen från akademin? DET är management.

---

## 2. UTBYGGNADSTRÄD (ersätter platt lista)

Nuvarande facilityService har 6 projekt i en platt lista gated på `facilities`-nivå. Byt till ett träd med tre grenar:

```
                    KLUBBUTVECKLING
                         │
          ┌──────────────┼──────────────┐
          │              │              │
      ANLÄGGNING     VERKSAMHET     AKADEMI
          │              │              │
    Omklädnings-    Kiosk basic    Ungdoms-
    rum (50k)       (gratis)       lag (40k)
          │              │              │
    Strålkastare    Kiosk          Akademi
    (80k)           uppgrad.       developing
          │         (25k)          (120k)
          │              │              │
    ┌─────┤         Värmestuga     Akademi
    │     │         (120k)         elite
  Konstis Gym            │         (250k)
  (200k)  (150k)    VIP-tält           │
    │                (80k)         Scout-
    │                    │         nätverk
  Läktare          Lotteri         (100k)
  (300k)           intensivt
    │              (15k)
    │                   │
  ┌─┘              Bandyskola
  │                (60k)
INOMHUSHALL             │
(2M, 20 omg)      Sociala
                   medier
                   (20k)
```

### Gren 1: ANLÄGGNING

Fysiska byggnader. Kräver ofta kommun-medfinansiering. Påverkar matchupplevelse och kapacitet.

| Projekt | Kostnad | Tid | Krav | Effekt |
|---------|---------|-----|------|--------|
| Omklädningsrum | 50 000 | 4 omg | — | +10 facilities, +5 moral hemma |
| Strålkastare | 80 000 | 6 omg | Omklädningsrum | +8 facilities, +10% sponsorintäkt |
| Konstfrusen is | 200 000 | 10 omg | Strålkastare, kommun | +15 facilities, inga väderbortfall |
| Gym | 150 000 | 8 omg | Omklädningsrum | +8 facilities, +15% träningseffekt |
| Läktare | 300 000 | 12 omg | Konstis, kommun 30% | +10 facilities, +2000 kapacitet |
| **Inomhushall** | **2 000 000** | **20 omg** | Läktare, CS>75, kommun 60%, styrelse ja | **+30 facilities, året-runt-träning, +5000 kapacitet, arena-namnsponsor** |

### Gren 2: VERKSAMHET

Inkomstkällor och community-aktiviteter. Billigare, snabbare payoff, bygger orten.

| Projekt | Kostnad | Tid | Effekt |
|---------|---------|-----|--------|
| Kiosk basic | Gratis (start) | — | ~1250/hemmamatch |
| Kiosk uppgradering | 25 000 | 3 omg | 2500/hemmamatch, driftskostnad +1000 |
| Värmestuga | 120 000 | 8 omg | +1000 kapacitet, +10% publik permanent, kaffeintäkt |
| VIP-tält | 80 000 | 4 omg | 1250-3750/hemmamatch, kräver reputation > 55 |
| Lotteri intensivt | 15 000 | 2 omg | 700-2500/omg, driftskostnad 800 |
| Bandyskola | 60 000 | 6 omg | +1000/omg, +CS, ungdomsspelare (kopplar till akademi) |
| Sociala medier | 20 000 | 2 omg | +500 sponsorattraktivitet, −500 driftskostnad |

### Gren 3: AKADEMI

Långsam investering, stor payoff. Producerar spelare du inte behöver köpa.

| Projekt | Kostnad | Tid | Krav | Effekt |
|---------|---------|-----|------|--------|
| Ungdomslag (P19) | 40 000 | Säsong 1 start | — | Grundläggande ungdomsutveckling |
| Akademi developing | 120 000 | Tar effekt nästa säsong | Ungdomslag | Bättre talanger, +10% PA |
| Akademi elite | 250 000 | Tar effekt nästa säsong | Developing, facilities > 60 | Topptalanger, +20% PA, scout-event |
| Scoutnätverk | 100 000 | 6 omg | Developing | Bredare rekrytering, fler positioner |

---

## 3. BESLUTSRYTM PER SÄSONG

Säsongsstart (PreSeason):
```
📋 SÄSONGSPLANERING

Budget: 440 000 kr
Löner: ~180 000/säsong (22 spelare × snitt 8k × 22 omg / 4)
Tillgängligt: ~260 000 kr

Vad vill du prioritera?

□ Anläggning — Konstfrusen is (200 000 kr, 10 omg)
□ Verksamhet — Värmestuga (120 000 kr, 8 omg)  
□ Akademi — Uppgradera till developing (120 000 kr)
□ Transfers — Behåll kassan för värvningar
□ Spara — Bygg buffert inför inomhushall
```

Spelaren väljer EN sak (max 1 bygge åt gången för bruksort-realism — det finns inte folk nog att driva flera projekt). Det är ett VERKLIGT val. Konstis löser väderproblemen men kostar nästan allt. Akademin ger ingenting i år men producerar gratisspelare om 2-3 säsonger.

Mid-season (omgång 12):
```
📋 HALVÅRSRAPPORT

Ekonomi: +45 000 kr hittills (budget: +12%)
Publik: 680 snitt (+8% mot förra säsongen)
Bygge: Konstfrusen is — 60% klart
Akademi: 2 lovande P19-spelare (Holm, Eriksson)

→ Vill du starta ett MINDRE projekt? (max 80 000 kr)
  □ Sociala medier (20 000)
  □ Lotteri intensivt (15 000)
  □ Inget, spara pengarna
```

Säsongsslut:
```
📊 EKONOMISK SAMMANFATTNING

Intäkter totalt: 385 000 kr
  Biljetter: 145 000
  Sponsorer: 98 000
  Community: 52 000
  Övrigt: 90 000

Kostnader totalt: 340 000 kr
  Löner: 195 000
  Driftskostnader: 45 000
  Konstfrusen is: 100 000 (betalat hittills)

Netto: +45 000 kr
Kassa: 485 000 kr

Nästa säsong:
  Konstisen klar omgång 4! Inga fler avlysta matcher.
  Tre kontrakt löper ut — förhandla eller släpp?
```

---

## 4. INOMHUSHALLEN — DEN STORA DRÖMMEN

Kostar 2M. Klubben har ~400k. Det tar 4-5 säsonger av sparande och planering. DET ÄR POÄNGEN. Det ska kännas som en resa.

### Steg-för-steg:

**Säsong 1-2:** Bygg grunderna. Omklädningsrum, strålkastare, kiosk. Överlev ekonomiskt.

**Säsong 2-3:** Konstfrusen is (200k). Först nu kan du spela alla matcher utan väderbortfall. Publik ökar. Sponsors notice.

**Säsong 3-4:** Läktare (300k, kräver konstis). Nu ryms 3000+. Värmestugan gör att folk stannar. Ekonomin börjar generera överskott.

**Säsong 4-5:** Inomhushall-kampanjen startar.
```
📋 HALLDEBATT

Ordföranden: "Det är dags att prata om hallen."
Kassören: "Vi har 600 000 kr. Hallen kostar 2 miljoner."
Kommunpolitikern: "Kommunen kan gå in med 60% — om ni visar att det finns underlag."

KRAV FÖR HALLBESLUT:
✓ Läktare renoverad
✓ Kassa > 500 000 kr
✓ CS > 75
✓ Publik snitt > 1200
□ Styrelseomröstning (behöver 3 av 4 ja)
□ Kommunbeslut (kommunpolitiker-relation > 60)
```

Halldebatten är inte ETT beslut. Det är en process:
1. **Förankring** (säsong 3-4) — prata med styrelsen, bygg stöd
2. **Kravuppfyllnad** — systematiskt bygga upp CS, publik, ekonomi
3. **Kommunförhandling** — politikern har en egen agenda (youth? prestige? savings?)
4. **Bygge** (20 omgångar, över säsongsgräns) — störningar under bygget (lägre hemmaplansfördel, tillfällig flytt)
5. **Invigning** — ett av spelets STORA ögonblick. Ny match-backdrop. Arena-namnsponsor. "Det här ändrade allt."

Redan delvis implementerat i `hallDebateData.ts` + `hallDebateEvents.ts`. Behöver kopplas till den bredare facility-kedjan.

---

## 5. VERKSAMHETSBESLUT MED KONSEKVENSER

Inte bara "köp uppgradering". Beslut som har trade-offs:

### Kiosk-dilemmat
```
Kioskvakten: "Vi säljer slut varje match. Men korvarna kostar 15 kr och vi säljer för 25.
Om vi höjer till 35 kr tjänar vi mer — men folk kanske klagar."

→ Behåll 25 kr (säker intäkt, CS stabil)
→ Höj till 35 kr (+40% intäkt, −5 CS under 3 omg)
→ Sänk till 20 kr (−20% intäkt, +3 CS "alla har råd")
```

### Julmarknad
```
📅 ANNANDAGSPLANERING (omgång 8-9)

Annandagen är säsongens största dag. Hela orten samlas.

Hur satsar vi?
→ Standard (5000 kr) — korv, kaffe, match. Som vanligt.
→ Julmarknad (25 000 kr) — korvstånd, lotteri, barnaktiviteter, tomte.
   +3x biljettintäkt annandagen, +15 CS, +klack-stämning
→ Bjud på entré (−all biljettintäkt) — goodwill-gest.
   +25 CS, +10 klack-stämning, −biljettintäkt den matchen
```

### Bandyskola → Akademikoppling
```
Bandyskolan har producerat 3 barn som vill börja i P19.

→ Ta in alla tre (+akademi, −8000 kr/säsong)
→ Ta in de två bästa (+akademi, kostnadseffektivt)
→ Skicka dem till grannklubben (−CS, +8000 kr engångsersättning)
```

---

## 6. SÄSONGSKARAKTÄR

| Säsong | Fokus | Nytt som händer |
|--------|-------|-----------------|
| 1 | Överlev | Lär dig systemen. Kiosk, volontärer, trupp. Första styrelsemöte. |
| 2 | Investera | Första bygget. Akademi-uppgradering. Sponsortillväxt. Kapten. |
| 3 | Etablera | Konstis. Publik ökar. Akademins första produkter. Transferdödline-drama. |
| 4 | Expandera | Läktare. Rykte utanför orten. Veteranpension. Halldebatten börjar. |
| 5 | Drömmen | Inomhushall-kampanj. Kommunförhandling. SM-utmaning? |
| 6+ | Dynasti | Hallen klar. Arena-namnsponsor. Akademin producerar konstant. Legender i kafferummet. Nya rivaler. |

---

## IMPLEMENTATION

### Vad som redan finns
- `facilityService.ts` — 6 projekt, platt lista → byt till trädstruktur
- `economyService.ts` — intäktsberäkning → lägg till tillväxttriggers
- `sponsorService.ts` — slumpmässig sponsor → lägg till kontextuella
- `academyService.ts` — 3 nivåer → koppla till investeringsbeslut
- `hallDebateData.ts` — halldebatt → koppla till facility-kedjan
- `communityActivities` i SaveGame — kiosk/lotteri/etc → utöka med prisnivåer

### Vad som behöver byggas
- `ClubDevelopmentScreen.tsx` — ny skärm i BottomNav (eller som flik i befintlig)
- Säsongsplaneringsbeslut i PreSeasonScreen
- Halvårsrapport vid omgång 12
- Ekonomisk säsongssammanfattning
- Löneeskalering vid kontraktsförnyelse
- Sponsortriggers baserade på prestation
- Facility-trädlogik med dependencies
- Annandagsplanering som event
- Bandyskola → akademi pipeline

### Prioritering
1. **Facility-träd med dependencies** (ersätt platt lista)
2. **Säsongsplanering i PreSeason** (välj ETT bygge)
3. **Kontextuella sponsorer** (6 triggers)
4. **Löneeskalering** vid kontraktsförnyelse
5. **Halvårsrapport** (omgång 12)
6. **Annandagsplanering** (event omgång 8)
7. **Kiosk-prisdilemma** + andra verksamhetsbeslut
8. **Hallkampanj** som flersäsongsprocess
