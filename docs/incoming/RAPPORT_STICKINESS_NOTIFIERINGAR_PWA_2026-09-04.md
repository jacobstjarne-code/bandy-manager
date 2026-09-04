# Bandy Manager — Stickiness utanför spelet

## Produktstrategi för notifieringar, PWA och framtida systemintegration

**Status:** Beslutad riktning  
**Fas 1:** PWA, Web Push, badges och responsiv Attention Engine som yta i Berättaren  
**Fas 2:** Native Apple-integration med widgets, Live Activities och Dynamic Island  
**Grundprincip:** Bandy Manager ska kunna fortsätta vara närvarande när spelet är stängt, utan att låtsas att spelvärlden fortsätter simulera sådant som egentligen inte har hänt.

### Beslutsaddendum 2026-09-04 — Berättaren är redaktionen

Efter rapporten låstes `SPEC_BERATTAREN_2026-09-04.md` och raderna `stickiness-attention-ar-en-yta` samt `stickiness-notification-history` i `MASTER_OPPET.md`. De besluten preciserar rapporten:

- Push är en **yta i Berättaren**, inte en fristående narrativ redaktion.
- Matchförberedelse får härledas direkt som en ren state-open-loop.
- Kalenderankare, säsongsläge, narrativ återkomst och senare celebration måste komma från `redaktoren()` och dela `ledgerTold` med Portal, press och övriga berättarytor.
- Ett skickat narrativt ämne markeras som berättat på ytan `push`; samma post ska därför inte upprepas oförändrad i Portalens `memory_card`.
- Notification history är Portalens story-slot/`memory_card`. Ingen separat pushhistorik eller parallell inkorg ska byggas.
- Berättarens steg 1–2 (`ledgerTold`, `currentChronology`, `redaktoren`) måste finnas innan de narrativa Etapp 1B-kandidaterna aktiveras.

Detta addendum har företräde där den ursprungliga rapporten talar om en separat historikyta eller självständig narrativ kandidatgenerering.

## 1. Sammanfattning

Bandy Managers notifieringssystem ska inte vara ett konventionellt retentionlager ovanpå spelet. Det ska vara en extern förlängning av spelets state-, narrativ- och beslutssystem.

Syftet är inte primärt att påminna spelaren om att Bandy Manager existerar. Syftet är att låta relevanta delar av klubben fortsätta existera i spelarens medvetande mellan sessionerna.

Fem beslut styr arbetet:

1. Bandy Manager byggs först som en fullvärdig PWA. På iPhone och iPad kräver Web Push att webbappen har lagts till på hemskärmen.
2. Notifieringsmotorn ska vara responsiv. Den ska bedöma nuvarande state, tidigare respons och om en bättre anledning att återvända har uppstått.
3. Notifieringar ska kunna vara roliga, oväntade, dramatiska, torra och mänskliga. Systemytorna ska bära produktens personlighet, inte bara utility.
4. Push är en knapp resurs. Ett ignorerat meddelande är input och ska göra systemet mer selektivt, inte mer högljutt.
5. Apple-native skjuts upp men designas in. Attention Engine ska producera kanaloberoende state som senare kan användas av widgets och Live Activities.

Visionen är:

> Bandy Manager ska ibland kännas som att klubben fortsätter existera på telefonen även när spelet är stängt.

Det ska ske genom att rätt delar av spelarens redan existerande klubbhistoria återkommer vid rätt tillfälle — inte genom artificiella realtidstimers.

## 2. Varför detta passar Bandy Manager

I många mobilspel kan en notis rapportera att resurser fyllts på, en byggnad blivit klar eller en annan spelare gjort något. Bandy Managers värld står i huvudsak still när spelaren inte spelar. Vi ska inte simulera händelser enbart för att skapa pushmaterial.

Spelets naturliga retentionmaterial finns redan:

- nästa match, derby, cup och slutspel,
- tabellposition och formkurva,
- spelare som utvecklas eller återkommer,
- taktiska problem och laguttagningsbeslut,
- tidigare möten, revansch och rivalitet,
- säsongsberättelser,
- egna beslut vars konsekvenser ännu inte är kända.

Notifieringssystemets uppgift är alltså inte att skapa en anledning att komma tillbaka, utan att identifiera vilken sann, redan existerande anledning som just nu är mest levande.

## 3. Researchens viktigaste lärdomar

Researchen pekade på tre återkommande mönster:

- Relevans är viktigare än volym.
- Spelarens faktiska beteende och state ska påverka vad som väljs.
- En bra notifiering har eget informations- eller upplevelsevärde.

Studier och produktfall från bland annat Top Eleven visar att state-baserad individualisering och exakta deep links kan vara väsentligt starkare än generiska återkomstmeddelanden. Exemplen från Pokémon GO, Clash of Clans, OSM och andra spel visar samtidigt att felaktiga eller försenade notifieringar snabbt förbrukar förtroendet för hela kanalen.

Duolingos viktigaste lärdom är inte streaken. Det är kombinationen utility och personlighet: samma relevanta state kan uttryckas på olika sätt och systemytan kan bli en liten återkommande produktupplevelse. Bandy Manager behöver ingen motsvarighet till Duo-ugglan, men klubben behöver en röst.

## 4. Attention Engine

Kärnan ska konceptuellt vara ett kanallager för uppmärksamhet, inte en `pushEngine` och inte en sjätte redaktion. Den läser Berättarens agenda för narrativa ämnen och kompletterar den med kanalunik urgency, fatigue/backoff och responsaffinitet.

Den tar emot game state och besvarar frågan:

> Vad är det mest intressanta, sanna och relevanta vi skulle kunna säga till just den här spelaren just nu?

Outputen kan vara ingenting, Portal/inbox, app badge, push eller — i den framtida native-etappen — widget-state och Live Activity.

```text
GAME STATE
    │
    ├── match state
    ├── player state
    ├── season state
    ├── tactical state
    ├── event ledger / narrative state
    ├── unresolved decisions
    └── historical context
          │
          ▼
    ATTENTION ENGINE
          │
    ┌─────┼──────────┐
    │ relevance      │
    │ urgency        │
    │ novelty        │
    │ user affinity  │
    │ cooldown       │
    │ voice          │
    │ fatigue        │
    └─────┼──────────┘
          │
          ▼
    ATTENTION ITEM
          │
    ┌─────┼────────┬─────────┬────────────┐
    ▼     ▼        ▼         ▼            ▼
  Inbox  Push    Badge    Widget*    Live Activity*

                         * framtida native-etapp
```

Produktlogik och distributionskanal ska vara separerade. Motorn producerar kanaloberoende kandidater; respektive kanal avgör om och hur de presenteras.

## 5. Open loops som grundobjekt

Systemet ska inte spara framtida notifieringar som färdig text. Det ska spara eller härleda ett strukturerat open loop med källor tillbaka till verifierbart game state.

```text
openLoop
  type: upcoming_match
  subjectId: fixture-4711
  unresolved:
    - lineup_not_confirmed
  context:
    rivalry: true
    previousResult: loss
    tableImportance: medium
  createdAt
  lastEvaluatedAt
  lastNotificationAt
  notificationAttempts
  stateVersion
```

När Attention Engine körs skapas budskapet från det senaste tillgängliga statet. Om spelaren redan har löst laguppställningen ska kandidaten försvinna. Om matchkontexten ändrats ska kandidaten dö eller renderas om.

## 6. Responsiv sekvens och backoff

Grundregeln är:

> När en spelare inte svarar ska systemet bli smartare, inte högre.

Första bedömningen kan vara praktisk och lågintensiv. En senare bedömning får inte upprepa samma argument; den måste hitta ny, starkare kontext. Efter två ignorerade försök ska kraftig backoff gälla. En ny större säsongshändelse kan senare skapa en ny legitim anledning.

Systemet ska skilja mellan:

- explicit positiv respons: spelaren öppnar via notifieringen,
- implicit positiv respons: spelaren öppnar kort efter den,
- negativ respons: notifieringen ignoreras,
- stark negativ respons: kategorin eller push stängs av.

V1 kan använda deterministiska vikter per kategori och röst. Ingen maskininlärning krävs för att börja lära av respons.

## 7. Tonalitet och röster

Notifieringssystemet ska inte bara kommunicera problem. Det ska också kunna observera, gratulera, reta, skapa förväntan, minnas och överraska.

Exempel:

> **Ingen taktisk analys i dag.**  
> 7–1 räcker.

> **Någon vill in i laget.**  
> Nilsson har varit bäst på träning tre pass i rad.

> **Det börjar närma sig.**  
> Västerås hemma i morgon.

> **Match i morgon.**  
> Laget är ännu inte klart.

Ett begränsat bibliotek av röster räcker i början:

- assisterande tränaren: praktisk, kunnig, ibland med egen uppfattning,
- ordföranden: kort, organisatorisk, försiktigt pressande,
- lokalpressen: rubrikmässig och utifrån,
- klubben/systemet: torr och lakonisk,
- supporter-/omvärldsröst: sparsam och bara när faktiskt supporterstate finns.

Rösten får aldrig hitta på fakta som simulationen inte känner till.

## 8. Mallstyrd copy

V1 ska använda ett redaktionellt bibliotek av godkända copy-patterns, exempelvis:

```text
assistant.practical
assistant.opinionated
press.preview
press.pressure
club.deadpan
club.celebration
club.warning
season.context
rivalry.memory
player.return
player.form
```

Varje mall fylls med verifierat game state. En språkmodell kan senare skapa variation inom hårda state- och copyramar, men får aldrig själv skapa fakta.

> Ingen text utan deklarerat state-underlag.

## 9. Kandidatfamiljer för V1

V1 ska börja litet:

1. **Oavslutad matchförberedelse** — ett verkligt beslut återstår inför nästa match; får härledas direkt ur state.
2. **Kalenderankare** — derby, cup, slutspel, final, annandag eller annat ovanligt viktigt möte närmar sig; måste komma ur Berättarens agenda.
3. **Säsongsläge** — tabellposition, slutspelskamp, serieseger eller nedflyttningsrisk har naturlig betydelse; måste komma ur Berättarens agenda.
4. **Narrativ återkomst** — en tidigare historia blir relevant igen, exempelvis revansch eller ett återkommande taktiskt misslyckande; måste komma ur Berättarens agenda.
5. **Relevant stateförändring** — exempelvis en spelare blir tillgänglig och förändrar nästa val.
6. **Celebration/observation** — ingen handling krävs; klubben säger något eftersom det är betydelsefullt eller roligt.

De fyra första är MVP. Stateförändring och celebration kopplas på när deras källstate och livscykel är tillräckligt tydliga.

Följande generiska budskap är förbjudna:

- ”Dags att spela Bandy Manager!”
- ”Din klubb behöver dig!”
- ”Du har inte spelat på 24 timmar!”
- ”Kom tillbaka och få en bonus!”

## 10. Prioritering och frekvens

Varje kandidat får ett begripligt, testbart score:

```text
relevance
+ urgency
+ narrativeStrength
+ personalAffinity
+ novelty
+ importance
- notificationFatigue
- recentSimilarMessages
```

Startpolicy:

- första återkomstbedömning cirka 18–24 timmar efter relevant exit,
- normalt högst en push per dygn och 2–3 per vecka,
- ingen vanlig push under 21.30–08.00 lokal tid,
- första ignorerade pushen följs tidigast av en ny bedömning nästa dygn,
- andra ignorerade försöket ger kraftig backoff,
- därefter krävs ett starkt nytt state eller flera dagars paus,
- ett självmant återbesök släcker irrelevanta pending reminders,
- identiska argument upprepas aldrig,
- stora säsongshändelser kan bryta vanlig cooldown men inte quiet hours.

## 11. Permission design

Pushbehörighet ska inte begäras vid första besöket. Produkten ska först etablera ett begripligt värde och fråga i samband med en användarhandling.

Föreslagen pre-prompt:

> **Vill du att klubben hör av sig när något faktiskt är värt att veta?**  
> Matcher, beslut och klubbhändelser. Inga dagliga bonuspåminnelser.

På iPhone/iPad ska flödet först förklara att Bandy Manager måste läggas till på hemskärmen. Därefter kan webbappen begära pushbehörighet.

## 12. PWA- och Web Push-arkitektur

MVP:n består av:

- manifest och installerbar PWA,
- service worker med Push API, badge och notification click,
- VAPID-konfigurerad serverleverans,
- subscriptions per installation/enhet,
- en state-snapshot med open loops och candidates,
- schemalagd utvärdering på servern,
- revalidering mot senaste snapshot innan utskick,
- exakta, allowlistade deep links,
- samma narrativa post tillgänglig genom Berättarens `ledgerTold` och Portalens story-slot/`memory_card`,
- instrumentering av eligibility, leverans, visning, klick, öppning och meningsfull handling,
- en permanent holdout-grupp när volymen räcker för effektmätning.

Servern ska skicka. Browser-timers är inte ett schemaläggningssystem. En kandidatkö får aldrig blint leverera gammal copy; aktuell kandidat och state-version måste verifieras vid utskick.

## 13. Mätning

`notification_clicked` räcker inte. Vi behöver kunna följa kedjan:

```text
eligible
→ candidate_selected
→ delivery_attempted
→ delivered/displayed
→ clicked eller ignored
→ app_opened
→ meaningful_action
→ fortsatt säsong / D7 / D30
```

En kontrollgrupp, exempelvis 10 procent av push-eligible installationer, behövs för att skilja verklig retention från sessioner som bara flyttats några timmar framåt.

Minimera data: använd installations-id, save-id, kandidattyp, state-version och tidsstämplar. Skicka inte hela sparfilen eller fritext från spelet till leveransbackend.

## 14. Implementation i etapper

### Etapp 1A — teknisk grund

- verifiera och komplettera PWA-manifest/service worker,
- modellera open loops, candidates, score och policy som ren domänlogik,
- synka en minimal attention-snapshot från klienten,
- registrera/avregistrera Web Push-subscriptions,
- lägg till badge och säkra deep links,
- instrumentera hela leveranskedjan,
- håll permission-UI bakom ett senare, värdebaserat produktögonblick.

### Etapp 1B — produktkoppling

- bygg först Berättarens `ledgerTold`, `currentChronology` och `redaktoren()`,
- gör push till en konsumentyta i samma agenda och skriv skickade narrativa poster som `surface: push`,
- aktivera de narrativa MVP-familjerna stegvis först därefter,
- bygg kategoriinställningar, quiet hours, affinity och backoff,
- anslut en verklig scheduler och hållbar datalagring,
- etablera holdout och retentionanalys.

### Etapp 2 — framtida Apple-native epic, inte nu

Denna epic ska finnas i backloggen men ingen native kod ska implementeras i etapp 1.

Omfattning:

- Home Screen-widgets med klubbens viktigaste aktuella state,
- små Lock Screen-widgets,
- Live Activities för verkligt pågående/tidsbundet matchstate,
- Dynamic Island som presentation av samma Live Activity,
- App Groups och delat, signerat attention state mellan webb/backend och native extension,
- WidgetKit/ActivityKit-specifika layouts, refresh-budgetar och privacy-bedömning,
- samma kanaloberoende `AttentionItem`; ingen separat native sanningskälla.

Native-ytorna ska bära utility och personlighet, men bara visa state som Bandy Manager faktiskt kan belägga. De ska inte påverka Fas 1:s leveransdatum.

## 15. Beslutade icke-mål

- Ingen streak-ekonomi.
- Ingen daglig bonusretention.
- Ingen påhittad realtidssimulering medan spelet är stängt.
- Ingen generativ copy utan verifierat källstate.
- Ingen omedelbar permission-prompt.
- Ingen Apple-native implementation i Fas 1.
- Ingen push-only information: narrativa ämnen måste vara kanoniska liggarposter som kan återkomma via Portalens story-slot/`memory_card`.

## 16. Samlad slutsats

Bandy Manager ska bygga en notifieringsmotor som en del av simulationens narrativa arkitektur:

```text
game state
→ open loops
→ relevance engine
→ wait
→ revalidate
→ ett meningsfullt budskap
→ exakt deep link
```

Förväntan är starkare än en artificiell belöning. Annandagen som närmar sig, spelaren som är tillbaka, motståndaren som knäckte pressen och poängen som saknas till slutspel är saker spelaren kan fortsätta tänka på när appen är stängd.

Notiserna är distributionskanalen för dessa open loops. Det är riktig stickiness.
