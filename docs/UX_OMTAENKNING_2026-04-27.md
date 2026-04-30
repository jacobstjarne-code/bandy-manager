# UX-omtänkning V2 — Bryt enformigheten

**Datum:** 2026-04-27
**Författare:** Opus
**Föregångare:** PLAYTEST_OPUS_2026-04-27.md (inkrementellt), THE_BOMB_V2_2026-04-27.md (innehåll)
**Detta dokument:** UX-grepp baserade på research av andra spel — inte för att kopiera, för att lära.

---

## Vad jag lärt mig av research

### Football Manager 26 — vad de just har gjort

FM26 (släppt nov 2025) bytte ut "Inbox" mot "**Portal**". Deras egen formulering:

> "Modern football managers spend way more time on their phones than laptops. So, welcome to what we now call your Portal."

Portal-konceptet:
- En *hub* som kombinerar messages, tasks, fixtures, news, calendar i en strömlinjeformad vy
- Tile-and-card-system där tiles ger snapshots, cards ger djup
- Ny top-navigationsbar med Portal · Squad · Recruitment · Match Day · Club · Career
- "Manager's desk" — allt viktigt på ett ställe

**Men PC Gamer-recensionen är skarpt kritisk:**
> "The way to improve Football Manager might actually be to show the player less information, not more."

Recensenten beskriver redesignen som "någon som brutit sig in i hemmet du bott i 15 år, möblerat om allt och lämnat detaljerade lappar på alla skåpsdörrar." FM26 visar *mer* per skärm, inte mindre. Resultat: mer overväldigande.

**Lärdom för oss:** Portal-konceptet är rätt riktning, men man måste våga *visa mindre*. Curating, inte aggregating.

### Crusader Kings 3 — moments tar över skärmen

CK3-events är **fullskärms-modaler med tydlig visuell signatur**. Inte små kort i en feed. När en händelse triggas tar den över hela vyn:
- Karaktärsbild i förgrunden
- Bakgrundsbild som etablerar plats
- Beskrivande text
- 2-4 val som *gör skillnad*

PDX:s uttalade designmål: **"reduce the amount of noise and make each event you receive actually matter."**

Lifestyle-systemet styr vilka events som triggas — fokus är inte bara strategi utan också *innehållssignal*. Spelaren signalerar "jag vill ha intrigue-events", systemet levererar dem.

**Lärdom för oss:** Om allt är på dashboarden konkurrerar allt. Vissa moments förtjänar att *bryta loopen* med en helsidesvy.

### Suzerain — dialog som hela spelet

Suzerain har ingen dashboard alls. Spelet är **karaktärsdialoger som fyller skärmen** med codex/news/budget som backup. Du pratar med din rådgivare, du läser tidningen, du fattar beslut, scenen byter. Inget scrollas.

> "Powered by endless dialogue trees and choices, the game manages to tell a compelling, politically fraught story... fills your screen with interesting tidbits of information and important codex entries."

**Lärdom för oss:** Dialog som format är *helt* annorlunda än dashboard. Vissa interaktioner i Bandy Manager skulle kanske vara dialog: presskonferensen, kafferummet, klacken som karaktär. Inte text i kort — text i samtal.

### Reigns — bag-of-cards som styr vad spelaren ser

Reigns ger oss det starkaste greppet. Det är inte en linjär kortlek — det är en **bag** där sammansättningen ändras baserat på state:

> "If you start a war with your neighbor, the 10 or so cards related to that specific event are large and will take a lot of space in the bag... Once the war is over, the war cards are removed from the bag."

Varje swipe drar ett kort som är **kontextuellt relevant just nu**. Kortet kan vara helt slumpat eller djupt scriptat — och spelaren vet inte vilket. Resultat: även små kort får tyngd.

**Lärdom för oss:** Det är inte våra 8 sektioner som ska visas alla samtidigt. Det är en kontextuellt sammansatt presentation där dashboardens innehåll bestäms av *vad som faktiskt händer i världen just nu*.

---

## Tre principer omformulerade efter research

### Princip 1: PORTAL, INTE DASHBOARD

Inte FM26:s exakta lösning — för de gjorde det för komplext. Men *grundtanken*: spelets startsida är inte en katalog över allt klubben innehåller. Det är en kontextuell hub som visar vad som är relevant *idag*.

Vad detta betyder konkret:

```
GAMMAL DASHBOARD (alltid samma):
[Welcome] [NextMatch] [DailyBriefing] [2x2 grid] [Klack] [Trupp/Cup/Akademi] [Bracket] [CTA]

NY PORTAL (kontextuell):
[Det viktigaste idag — STORT KORT]
[Två-tre relevanta sekundära signaler]
[Status-rad: poäng, plats, kassa, träning — minimal]
[CTA-knapp]
```

Om derby imorgon → "Det viktigaste idag" är derbyt. Klacken är sekundär signal. Tabellen är minimal status. Allt annat finns bakom en knapp ("Mer info").

Om transferdeadline om 3 dagar → "Det viktigaste idag" är dödlinen. Tre öppna bud är sekundär signal. Match är minimal status.

**Detta är Reigns-tänkande tillämpat på dashboard.** En bag av möjliga "primary cards" där sammansättningen styrs av vad som händer.

### Princip 2: MOMENTS BRYTER LOOPEN

Vissa händelser ska *inte* visas som card på dashboarden. De ska ta över skärmen.

CK3-stil:
- **Pension för en klubblegend:** Helsidesvy med spelarens portrait, hans karriärsiffror, farewell-citatet, tre val (erbjud tränarpost / erbjud scoutroll / tacka farväl). Inte ett inbox-event.
- **Transferdeadline om 30 minuter:** Helsidesvy med klocka som tickar, lista av öppna bud, panik-knappar. Inte text i toppen av dashboarden.
- **SM-final:** Helsidesvy med Studenternas IP-illustration, motståndare, väder, lineup. Inte card med stakes-tagg.

Just nu finns delvis denna funktionalitet — `BoardMeetingScreen`, `ChampionScreen`, `PlayoffIntroScreen` är fullskärms-momenter. Men det är ceremonial-screens, inte *gameplay*-momenter.

**Förslag:** Inför en `MomentScreen`-pattern där spelet stannar och visar *en* sak. Inte event-overlays som finns nu — riktiga skärmbyten. Sparsamt — kanske 3-5 moments per säsong. När det händer ska det kännas.

### Princip 3: NÅGRA DELAR ÄR DIALOG, INTE DASHBOARD

Suzerain visar att vissa interaktioner *vill* vara dialog. Inte text i ett kort — ett samtal som fyller skärmen.

Kandidater i Bandy Manager:
- **Presskonferensen** är redan kvasi-dialog men presenteras som overlay-card. Gör det till fullskärm.
- **Kafferummet** är just nu en passiv text-ruta i CTA-sektionen. Tänk om det vore en *plats du kan besöka* — ett "trä in i kafferummet" där vaktmästaren och kassören står och pratar och du kan välja att lyssna eller säga något.
- **Klackens röst** kunde vara en *briefing från Birger* en gång i månaden, inte ett card med citat.
- **Patron-möten** är redan delvis dialog — utveckla det.

Inte nytt — stora delar av spelet skulle bli rikare i dialog-format. **Men inte allt.** Trupp-vyn ska vara lista. Tabellen ska vara tabell. Vissa saker tjänar på data-densitet, andra på samtal.

---

## Tre konkreta UX-omtänkningar (ersätter PLAYTEST QW-1)

### UX-1: Portal med "Veckans bag"

Dashboarden blir Portal. Innehållet bestäms av en `dashboardBag`-mekanik liknande Reigns:

```typescript
// Konceptuellt
interface DashboardCard {
  id: string
  priority: 'primary' | 'secondary' | 'minimal'
  triggers: GameStateCondition[]   // när är det relevant?
  weight: number                    // hur stort utrymme?
  content: CardContent
}

const cardBag: DashboardCard[] = [
  { id: 'next_match_derby', priority: 'primary', triggers: ['nextMatchIsDerby'], weight: 100, ... },
  { id: 'next_match_smfinal', priority: 'primary', triggers: ['nextMatchIsSMFinal'], weight: 100, ... },
  { id: 'transfer_deadline_close', priority: 'primary', triggers: ['transferDeadlineWithin3Rounds'], weight: 90, ... },
  { id: 'patron_demand_unmet', priority: 'primary', triggers: ['patronDemandUnmetOver3Rounds'], weight: 85, ... },
  // ...
  { id: 'next_match_routine', priority: 'secondary', triggers: ['default'], weight: 30, ... },
]

function buildDashboard(game: SaveGame): DashboardCard[] {
  // Filtrera kort vars triggers matchar nuvarande state
  const eligible = cardBag.filter(c => c.triggers.every(t => evaluateCondition(t, game)))
  // Sortera efter priority + weight
  // Returnera 1 primary + 2-3 secondary + minimal status
}
```

Detta gör att **dashboarden ser olika ut olika omgångar**. Om det är derby-vecka ser hela appen ut som derby-vecka. Om det är lugnt ser den lugn ut.

**Implementations-anmärkning för Code:** Detta kan byggas inkrementellt. Börja med tre primary-kort (derby, transfer-deadline, big-match) och låt befintlig dashboard vara fallback. Utvidga successivt.

### UX-2: Tre årssignaturer (visuell tonalitet)

Inte stora animationer eller partiklar — **tonal CSS-shift** över säsongen:

| Period | Tonalitet | Implementation |
|---|---|---|
| Aug-okt (cup + säsongsstart) | Varm, optimistisk — accent-färgen lite ljusare, mer kontrast | `--accent: hsl(oklch-shifted)` |
| Nov-jan (vinterkamp) | Mörkare, dämpad — bakgrund djupare, accent neddragen | `--bg: lite mörkare` |
| Feb-mars (slutspel) | Skarp, kontrastrik — accent vassare, fokus på siffror | `--accent: vassare` |

Detta är en CSS-variabel som ändras vid omgångsövergångar. **Inte en stor refactor** — en `seasonalTheme.ts` som returnerar vilka variabler som ska sättas.

Effekten: spelaren öppnar appen i januari och *känner* att det är vinter, även utan att läsa något.

### UX-3: Moments — fem fullskärms-händelser per säsong

Bygg `MomentScreen`-pattern. Inte overlay-card som blockerar — *route*-byte som ersätter dashboarden tillfälligt. Spelaren landar på Moment-skärmen, tar beslut, går vidare.

Fem kandidater för säsong 1 (utvidgar successivt):

1. **Pre-match-moment innan SM-finalen:** Helsida med arena, motståndare, prognosen. En enda CTA-knapp: "Spela finalen".
2. **Pension för klubblegend:** Helsida med portrait, karriärsiffror, farewell, tre val.
3. **Transferdeadline-stress (sista 24 timmar):** Helsida med klocka, öppna bud, panic-knappar.
4. **Patron-konflikt (när patron kräver något extremt):** Helsida med patrons portrait, hans krav, två val (acceptera / avvisa).
5. **Klack-protest (när du sålt klackens favorit):** Helsida med Birger på huvudläktaren, hans uttalande, tre val (besök klacken / vägra / ge intervju till lokaltidningen).

Var och en av dessa **finns delvis** i datamodellen men presenteras som inbox-events eller dashboard-cards. Det är bristen i synliggörandet vi pratat om.

---

## Två strukturella omtänkningar (ersätter PLAYTEST S-1, S-2, S-3)

### UX-4: Kafferummet som plats, inte text

Just nu är kafferummet en passiv text-ruta längst ner på dashboarden. Två röster, ett citat per omgång.

**Omtänkning:** Klick på kafferummet öppnar en **fullskärms-scen**:

```
[Helsida — bakgrund: lo-fi vektor av ett kafferum, ljus från fönster, persiennfix, kaffekanna]

[Vaktmästaren (porträtt)]
"Hörde att Lindberg försvann."

[Materialaren (porträtt)]
"Hoppas pengarna räcker till nya tröjor."

[Du står i dörren — tre val:]
> "Berätta mer om Lindberg"   (öppnar dialog)
> "Fortsätt lyssna"            (genererar nästa replik)
> "Lämna rummet"               (tillbaka till portal)
```

Inte realistisk illustration — *Etzlivet*-vibe. Lo-fi vektor med tonal CSS som matchar säsongssignaturen.

**Detta är där vi gör spelet märkligt.** Andra sportmanagers har inte detta. Det är vår styrka — att vara liten, taktil, lokal.

### UX-5: Klubbens minne som tidslinje, inte lista

PLAYTEST S-2 föreslog "klubbens resa-vy". Här är skillnaden i format:

**Inte:** En tidslinje där varje säsong är en kolumn med bullets.

**Utan:** En *scrollbar tidslinje* där spelaren scrollar längs en horisontell linje och varje säsong **fyller skärmen** med säsongens signatur:

```
[Scroll horisontellt genom säsongerna]

← SÄSONG 2026-27 — säsongssammanfattning fyller skärmen
   Slutplacering: 8:a
   Bästa match: 4-3 mot Söderfors (annandagen)
   Klubblegend som debuterade: Anders Henriksson, 17 år
   "Säsongens första kapitel — vi lärde oss att klara stormarna."
   [scroll →]

→ SÄSONG 2027-28 — annan signatur, annan färg
   Slutplacering: 5:a
   Cup-final på Sävstaås — förlorade 2-3
   Två klubblegender pensionerades
   "Året då vi nästan tog bucklan."
   [scroll →]
```

Varje säsong får sin egen vinjett. Datat finns redan. Det är *presentationen* som är ny.

---

## Hur detta förhåller sig till Jacobs ord

Du sa: "ganska enahanda som det är idag. både visuellt och gameplay."

Mitt första svar (PLAYTEST QW-1, 2, 3) handlade om *dashboard-justeringar*. Stakes-tagg, hierarki, navigation. Det är inkrementellt — flyttar runt det som finns.

Detta dokument är *radikalare*: spelets paradigm bör skifta från **dashboard-loop** till **portal + moments + dialog + minne**. Det är en strukturell förändring.

Realiteten: vi gör inte allt detta i nästa sprint. Men *riktningen* är värd att etablera.

---

## Sammanfattning — föreslagen prioritetsordning

### Fas 1 (~2 sprintar)
1. **UX-1 Portal med veckans bag** — utgångspunkt för allt annat. Bygger på befintlig dashboard, ersätter den successivt.
2. **PLAYTEST QW-2 Stakes-tagg** — del av Portal-implementation, bekräftad bra idé.
3. **UX-2 Tre årssignaturer** — kostar lite, ger mycket atmosfär.

### Fas 2 (~3 sprintar)
4. **UX-3 Moments** — börja med 1-2 fullskärms-momenter (SM-final, klubblegend-pension), utvidga.
5. **THE_BOMB Kapitel A — Manager-statements + journalist-relation synliggörs** — landar naturligt i Moment-format.

### Fas 3 (~3 sprintar)
6. **UX-4 Kafferummet som plats** — fullskärms-scen
7. **UX-5 Klubbens minne som horisontell tidslinje** — scroll-baserad
8. **THE_BOMB Kapitel B — clubMemoryService** — datakällan för UX-5

### Fas 4 (~2 sprintar)
9. **THE_BOMB Kapitel C — Säsongens signatur** — kopplar till UX-2 och UX-5

Totalt ~10 sprintar. Inte alla samtidigt — successivt över ~6 månader.

---

## Slut UX V2-omtänkning
