# Code-uppdrag 2026-05-22 — playtest-buggar + simulera-knapp slutförande

**Av:** Opus. **Status:** Redo för Code. Ingen Design behövs för något här —
detta är de fynd från dagens playtest som är RAKA BUGGAR eller småfixar, skilda
från det som genuint väntar på Design (C-SD1/C-SD2/C-FT1).

Princip (DECISIONS 2026-05-03): allt nedan är iteration-fritt eller
lokaliserbart — Code tar direkt, ingen sprint-overhead. Per Jacobs
granskningsregel: läs förälder-skärmen, spåra render-flödet, verifiera i
kontext — aldrig isolerat. Visa kod, inte bara "✅ finns".

---

## 0 · Slutför C-SD3 (simulera-knappen) — TVÅ saker kvar

Knappen är återställd i PortalScreen och fungerar (1001 gröna). Två krav återstår
innan den är helt stängd:

1. **Logga i DECISIONS.md.** Kort post, format som filens övriga:
   - Problem: `⏩ Simulera resterande säsong` försvann 3 maj 2026 när
     `DashboardScreen.tsx` (1208 rader) raderades som dead code. Handlern
     `simulateRemainingStep` levde kvar i storen; bara UI-ytan föll bort.
     Upptäckt av Jacob 2026-05-22 ("den har funnits i spelets tre första
     månader").
   - Beslut: Knappen återställd till PortalScreen som ghost ovanför spela-CTA,
     villkorad av `canSimulateRemaining`. Den hör hemma i entry-point-skärmen,
     inte i en separat dashboard.
   - Konsekvens / lärdom: när en skärm raderas som dead code, inventera dess
     unika CTA:er/funktioner mot den nya entry pointen INNAN radering. En
     funktion kan dö tyst även när dess handler lever kvar. Lägg motsvarande
     rad i LESSONS.md.

2. **Verifiera `canSimulateRemaining` mot den gamla knappen.** Kör
   `git show <3-maj-commit>` på borttagningen av DashboardScreen. Jämför det
   villkor den gamla knappen använde mot det nya (≥12 ligarundor, inget
   slutspel, nästa managed ej cup, ingen HalfTimeSummary). Om de matchar:
   bekräfta i commit-meddelandet. Om de skiljer sig: säg till Jacob vad
   skillnaden är — avgör inte själv om avvikelsen är OK.

---

## 1 · Raka buggar — lokalisera, fixa, verifiera i kontext

### 1.1 — C-SP3: `heavySnow` råsträng i SM-final-uppspelet
Bild 3 i slutspels-playtesten visar `❄ heavySnow` som rå enum istället för
"Snöväder". Väder-labeln i final/intro-uppspelsscenen körs inte genom
`getConditionLabel` (samma klass som nedsläpp→avslag-fixarna i B7 TIER 3.1).
Hitta var weather.condition renderas i den scenen, kör genom getConditionLabel.
Sök övriga scener efter samma läcka medan du är där.

### 1.2 — C-SP2: opponent-fältet "Västanfors · · Uppsala"
Finalhelg-portalen (kortet med "Sätt lineup för finalen") visar fel i
underrubriken: "Västanfors · · Uppsala" — dubbel-punkt = tomt template-segment,
OCH Västanfors står där motståndaren ska stå fast managed club (Karlsborg) MÖTER
Västanfors. VERIFIERAT REN: NextMatchPrimary + PlayoffBanner (Opus läste båda —
de skickar opponent korrekt). Buggen är i den finalhelg-specifika
portal/scen-varianten (`isFinaldag`-grenad vy). Lokalisera, läs hela render-
flödet, fastställ om det är (a) fel lag plockas som motståndare eller (b)
template blandar hemma/borta/plats. Visa koden som bygger raden.

### 1.3 — C-SP4: förlängnings-overlay fel utseende
Bild 5: FÖRLÄNGNING-overlay ligger över matchpanelen med text som krockar bakom
den. Matchar inte behandlingen av resten av match-overlays. I MatchLiveScreens
overtime/förlängnings-overlay. Layout/z-index/bakgrund.

### 1.4 — C-SP1: "SLUTFÖR PÅGÅENDE FLÖDE"-CTA efter vunnen serie
Vann KvF match 3 → semi, men granska-vyn visar bottom-CTA "slutför pågående
flöde" som om matchen inte var klar, leder sedan till semi-portal. Borde vara en
serie-avgjord-övergång. Hitta var den CTA-texten sätts i granska/review-flödet
(trolig: review-flödets CTA-logik + playoffTransition). Detta är samma klass som
C-SD1 men CTA-texten specifikt är en bugg, inte ett designval — texten ljuger om
tillståndet. Fixa texten/tillståndet; den bredare scen-sekvensen (C-SD1) är
fortfarande Design.

### 1.5 — C-T11.1: "Hantera bud → inga öppna bud" återvändsgränd
Transferfönster-kortet visar CTA "Hantera bud →" även när det inte finns några
öppna bud → leder till tom vy. Dölj CTA:n när antal öppna bud = 0 (eller, om det
är enkelt, led den till marknad/scouting istället). Trerads-fix, ingen Design.
(C-T11 punkt 2 + 3 — nudges på portal, marknad-vid-passivitet — är kvar som
Design, de rör synlighet/innehåll.)

### 1.6 — C-FT2: UI-skip efter livematch
Efter `saveLiveMatchResult` är `managedClubPendingLineup = undefined`. Om Jacob
klickar advance utan att gå in i lineupen för nästa managed-match SKIPPAS den
matchen (fixture stannar Scheduled) medan AI-matcher vid nästa matchdag körs —
han hamnar på fel matchdag med matchen fortfarande väntande. Ingen odds-nackdel
men känns trasigt och är trolig förklaring till "match 2 känns fel". Verifiera
flödet i PortalScreen advance-handler + matchSimProcessor skip-logik. Överväg:
advance-CTA ska inte tyst hoppa över en schemalagd managed-match som saknar
lineup — antingen tvinga in i lineup-skärmen, eller visa det tydligt.

---

## 2 · MÄT, fixa inte än

### 2.1 — C-FT1: trötthets-axeln (Fråga B)
Din `live-vs-sim.ts` avgjorde live=sim (ingen skillnad, bra). Men den mäter INTE
trött-vs-utvilad — båda sidor i den jämförelsen går in med samma nedtröttade
trupp. Bygg ett sekvens-test: managed match 2 med trött trupp (efter spelad
match 1) vs match 2 med utvilad baslinje, samma seeds. Är vinstandelen
systematiskt lägre med trött trupp? Rapportera siffrorna. RÖR INGA PARAMETRAR —
detta är en mätning som avgör om C-FT1 är en verklig balansfråga eller om
match-2-känslan helt förklaras av UI-skippen (1.6). Mät, rapportera, stanna.

### 2.2 — C-SP6: interrupt-spik
6 dash-händelser inför andra semin mot normalt 1–3. Kör B8:s
`countPendingInterrupts` mot en sparfil i det läget. Är det legit anhopning
(slutspel + transferefterdyning) eller dubbel-trigger? Rapportera, fixa bara om
dubbel-trigger.

---

## Vad som INTE är här (genuint Design, lördag)
C-SD1 (säsongsslutets scen-sekvens — vem äger ordningen, arkitekturval),
C-SD2 (slutspels-portalernas visuella eskalering), C-SD3-inget-mer (klart efter
§0), C-FT1-beslut (efter mätning 2.1), C-T11.2/3 (nudges + marknadsliv på
portal), C-SP5 (final-uppspelets skarv — CSS/Design), C-N1 (kommun/NU-kort).

— Opus, 2026-05-22
