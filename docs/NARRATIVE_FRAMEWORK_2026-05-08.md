# Narrative Framework — säsongens båge i Bandy Manager

**Datum:** 2026-05-08
**Författare:** Opus
**Status:** STRATEGI — inte spec. Vägledning för var vi lägger anslag, scener och episoder.
**Beroende:** `docs/SPEC_CUP_ANSLAG_2026-05-08.md` (cup-anslagen)

---

## Syfte

Säsongen i Bandy Manager pågår från sommarens slut till tidiga våren. Utan narrativ struktur kan den kännas som en oändlig rad omgångar med likadana Portal-ytor.

Vi har tre olika narrative lager redan i koden eller specifierade. Detta dokument:
1. **Definierar de tre lagrena** så Code och Design vet skillnaden
2. **Mappar hela säsongens båge** mot de tre lagrena
3. **Identifierar krockar** och hur de löses
4. **Pekar ut openings** — var lager saknas eller dubblar varandra
5. **Föreslår prioritetsordning** för fortsatt arbete

---

## De tre lagrena

### Lager 1: ANSLAG
**Var:** Portal-overlay
**När:** Vid Portal-rendering vid säsongs-fas-byten
**Vad:** Säsongs-narrativ — "vart är vi i bågen"
**Tonen:** Lugn, kapitel-blad, italic Georgia, ingen interaktion utöver klick-stäng
**Format:** Frameat kort på dimmad Portal (alpha 0.2, blur 8px)
**Längd:** En kort scen att läsa, 5-10 sekunder

### Lager 2: SCENER
**Var:** Fullskärm (egen route eller modal)
**När:** Vid match-start eller specifik narrativ-händelse
**Vad:** Match-narrativ eller dramatisk händelse — "denna match betyder något" eller "detta hände precis"
**Tonen:** Intensifierad, beats med klick-progression, motståndare och stakes
**Format:** Helskärm, ofta sekvensiell beat-progression
**Längd:** Några sekunder per beat, 3-4 beats vanligt

### Lager 3: EPISODER
**Var:** Portal som secondary card eller modal-overlay
**När:** Recurring under säsongen
**Vad:** Vardagsröster — kafferummet, journalisten, klacken
**Tonen:** Konversationell, klubb-specifik, Sture-Forsbacka-känsla
**Format:** Card-stil eller event-modal
**Längd:** Snabba, stannar inte spelflödet

---

## Vad som finns i koden (oktober 2025–maj 2026)

### Scener (Lager 2)
| SceneId | Trigger | Roll |
|---|---|---|
| `board_meeting` | One-shot, första gången spela | Etablera klubb |
| `sunday_training` | One-shot, säsong 1 matchday 1 | Etablera trupp |
| `season_signature_reveal` | One-shot per säsong, matchday 1 | Avtäcka säsongstema |
| `cup_intro` | One-shot per säsong, innan första cup-match | Pre-första-match-fokus |
| `cup_final_intro` | One-shot per säsong, innan cup-final | Pre-cup-final-fokus |
| `sm_final_victory` | Efter cup-final-vinst | Match-celebration |
| `coffee_room` | Recurring, cooldown 3 omgångar | Vardagsröst |

### Episoder (Lager 3)
- `JournalistRelationshipScene` — relationsmoment med journalist
- `coffeeRoomService` (utöver scen) — pratmaterial i secondary-card
- Diverse one-off events i `eventQueueService`

### Anslag (Lager 1)
**Inga implementerade än.** Cup-anslagen specade i `docs/SPEC_CUP_ANSLAG_2026-05-08.md`.

---

## Hela säsongens båge — målbild

| Tid | Lager | Element | Status |
|---|---|---|---|
| **Säsong 1, allra första gången** | Scen | `ArrivalScene` (intro) | ✅ Implementerad (reboot 2026-05-08) |
| **Säsong 2+, säsongsstart** | Anslag (NY) | `season_start` — kort återkomst-anslag | ❌ Saknas |
| **Säsongsstart, alla år** | Scen | `season_signature_reveal` | ✅ Implementerad |
| **Säsongsstart, alla år** | Scen | `board_meeting` (säsong 1) eller motsv. | ✅ Implementerad |
| **Säsongsstart, alla år** | Scen | `sunday_training` (säsong 1) | ✅ Implementerad |
| **Innan första cup-match (Portal)** | Anslag | `cup_start` (Anslaget) | 📝 Specad |
| **Innan första cup-match (matchday)** | Scen | `cup_intro` | ✅ Implementerad |
| **Mellan cup-runda 2 och 3 (Portal)** | Anslag | `cup_between` (Snålvinden) | 📝 Specad |
| **Innan finalhelgen (Portal)** | Anslag | `cup_finalweekend_pre` (Helgen) | 📝 Specad |
| **Innan cup-final (matchday)** | Scen | `cup_final_intro` | ✅ Implementerad |
| **Efter cup-final-vinst (efter match)** | Scen | `sm_final_victory` | ✅ Implementerad |
| **Efter cupens sista match (Portal)** | Anslag | `cup_done` / `cup_done_winner` (Pokalen) | 📝 Specad |
| **Inför ligan (Portal)** | Anslag (NY) | `league_start` | ❌ Saknas |
| **Liga-premiär match (matchday)** | Scen (NY) | `league_opener_intro` | ❌ Saknas (kanske onödigt) |
| **Mid-januari (Portal)** | Anslag (NY) | `league_midwinter` (vintermörker) | ❌ Saknas |
| **Halvvägs i ligan (Portal)** | Anslag (NY) | `league_halfway` (vändpunkt) | ❌ Saknas |
| **Inför slutspels-kval (Portal)** | Anslag (NY) | `playoff_qualification` | ❌ Saknas |
| **Slutspel börjar (Portal)** | Anslag (NY) | `playoff_start` | ❌ Saknas |
| **Innan slutspels-final (matchday)** | Scen (NY) | `playoff_final_intro` | ❌ Saknas |
| **Efter slutspels-final-vinst** | Scen (NY?) | `championship_victory` | ❌ Kanske `sm_final_victory` redan? |
| **Säsongs-slut (Portal)** | Anslag (NY) | `season_done` | ❌ Saknas |
| **Årlig recap före nästa säsong** | Scen (NY) | `season_recap` | ❌ Saknas |

**Totalt målbild:** 5 implementerade scener, 4 specade anslag, **8 nya anslag att skriva**, **~3 nya scener att överväga**.

---

## Krockar och samverkan

### Krock 1: `cup_start` (Anslag) ↔ `cup_intro` (Scen)

Båda triggas vid första cup-match. Olika lager men nära varandra tidsmässigt.

**Lösning:** olika tidsfönster och format
- `cup_start` triggas vid Portal-rendering när bracket nyss genererats — *innan* matchday 1 ens börjar
- `cup_intro` triggas när spelaren klickar på första cup-match — *vid* match-start

I sekvens:
```
Portal renderas → cup_start anslag (overlay)
spelaren agerar i Portal
spelaren klickar match → cup_intro scen (fullskärm)
match spelas
```

**Justering nödvändig:** beat 1 i `cup_intro` säger *"Förstarunda i cupen. Innan serien drar igång."* — det är fas-info som `cup_start`-anslaget täcker bättre. Beat 1 kan kortas eller tas bort, så scenen fokuserar på motståndare och stakes (beat 2-3 är redan rätt).

### Krock 2: `cup_finalweekend_pre` (Anslag) ↔ `cup_final_intro` (Scen)

Anslaget triggas innan finalhelgen (innan semi). Scenen triggas innan finalmatchen specifikt (söndag i finalhelgen).

**Lösning:** olika moment, ingen verklig krock
- Anslaget vid *kvart-spelad-Portal* (innan semi)
- Scenen vid *final-match-start* (innan final-match)

Mellan dem spelar spelaren semi-matchen. Tidsmässigt separerade.

### Krock 3: `cup_done_winner` (Anslag) ↔ `sm_final_victory` (Scen)

Båda triggas efter cup-final-vinst.

**Lösning:** olika lager, olika tidsfönster
- `sm_final_victory` triggas direkt efter match-resultat — fullskärm celebration ("VI VANN!")
- `cup_done_winner` triggas vid nästa Portal-rendering — säsongs-reflektion ("Pokalen är vår. Den är inte den finaste pokalen i bandy. Men den är den första vi vunnit på länge.")

I sekvens:
```
cup-final spelas
match-resultat → sm_final_victory scen (fullskärm, dramatisk)
spelaren klickar vidare → tillbaka till Portal
Portal renderas → cup_done_winner anslag (overlay, lugn)
```

Detta är som filmer som har slutsekvens + epilog. Match-celebration först, säsongs-reflektion sedan.

**Justering nödvändig:** ingen — de kompletterar varandra perfekt.

### Sammanfattning av krockar

Av tre potentiella krockar:
- **1 verklig** (`cup_start` ↔ `cup_intro`) — kräver justering av scen-beat
- **2 falska** (olika moment eller olika lager) — bara klargörande behövs

---

## Saknade narrativa moment

Listan ovan visar 8 nya anslag och ~3 nya scener.

### Mest kritiska saknade

**Liga-anslagen (5 nya):** `league_start`, `league_midwinter`, `league_halfway`, `playoff_qualification`, `playoff_start`. Liga är 22 omgångar — utan kapitel-markörer blir det monotont. Detta är direkt fortsättning på cup-anslagen.

**Säsongs-slut-anslag:** `season_done`. Speciellt viktigt för spelare som inte kvalat till slutspel — annars känns säsongen som att den bara *slutar*. Anslaget gör avslutet till ett moment.

### Mindre kritiska

**`league_opener_intro` scen:** behöver kanske inte. Anslaget för liga-start räcker.

**`playoff_final_intro` scen:** vore fint med cup_final_intro-mönster, men inte blockerande.

**`championship_victory` scen:** förmodligen redan täckt av `sm_final_victory` (den triggar på all cup-final-vinst, inte bara cup specifikt). Värt verifiera.

**`season_recap` scen:** förmodligen mer än vad v1 behöver.

---

## Föreslagen prioritetsordning

### Steg 1 (NU): Cup-anslag-implementation
Specat. Code arbetar. När klart har vi första hela narrativa fas (cup) som case-study.

### Steg 2 (NÄSTA): Liga-anslag-spec + texter
Du skriver texter för de 5 liga-anslagen i samma rytm som cup-texterna. Jag mockar bågen och speccar. Code implementerar samma mekanik som cup-anslag — bara nya AnslagKey och nya texter, ingen ny komponent.

**Texter du behöver skriva:**
1. `league_start` — efter cupen, ligans premiär närmar sig
2. `league_midwinter` — januari-mörker, vinterns lägsta punkt
3. `league_halfway` — halvvägs, säsongen vänder
4. `playoff_qualification` — sista omgångarna avgör vilka som går vidare
5. `playoff_start` — slutspelet börjar (för kvalade)

Plus: `season_done` (alla får, oavsett om kvalad)

### Steg 3: Krock-justering av befintliga scener
- `cup_intro` — kort beat 1 så fas-info inte dubblerar `cup_start`-anslaget
- Verifiera att `sm_final_victory` triggar korrekt för cup-final-vinst (kontroll)

### Steg 4: Episode-systemet (R3 + Phase Bias)
Hur Portal *själv* tonsätts beroende på fas. Specat som `docs/SPEC_SEASON_PHASE_BIAS.md`. Kombineras med anslagen — anslag är övergångar, phase-bias är "vad spelaren ser de andra 95% av tiden".

### Steg 5: Övriga öppna moment
`season_recap`, eventuella nya scener för slutspels-final, etc. Senare iteration.

---

## Designprinciper för fortsatt arbete

**Anslag är säsongens puls.** En per fas. Korta, läsbara på 10 sekunder. Säsongens röst, inte spelarens situation.

**Scener är match-rituals och emotionella moments.** En per faktisk match-händelse av betydelse, inte en per Portal-fas. Spelaren är aktiv läsare, inte passiv mottagare.

**Episoder är vardagspuls.** Många, recurring, kontextuella. Pacing-fråga, inte momentum-fråga.

**Krockar löses genom layer-separation, inte genom borttagning.** Anslag och scen kan triggas nära varandra om de säger olika saker. De talar inte över varandra — de bygger på varandra.

**Texten bär stämningen.** Inga ljud, inga komplexa animationer i v1. Italic Georgia + en blygsam visuell variation per fas.

---

## Vad detta dokument INTE löser

- **Triggning-edge-cases:** vad händer om spelaren råkar starta nytt save mitt i en säsong, om bracket-data är korrupt, om fixture-rader saknas. Det är implementations-detalj.
- **Lokalisering:** alla texter på svenska, framtida engelsk version är inte specad.
- **Performance:** anslag-overlay vid varje Portal-mount kan bli kostsamt om logik är slö. Code får verifiera.
- **Tonal kvalitet på ny text:** Jacob skriver liga-anslagen själv. Detta dokument säger var de ska ligga, inte vad de ska säga.
