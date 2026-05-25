# Genomgång — spel-loopen och vad som bygger den

**Datum:** 2026-05-16 (lördag)
**Av:** Opus, efter läsning av KVAR + INLASTA_SYSTEM + THE_BOMB_STATUS + SPEC_KLUBBUTVECKLING + extern audit 2026-05-16
**Syfte:** Spel-loop-analys, inte feature-lista. Svar på: vart i sekvensen är friktion låg, val triviala, konsekvenser osynliga? Plus referensvärlds-fråga.

---

## STATUS-KALIBRERING (verkligheten innan analys)

Auditen 2026-05-16 hade rätt i ramen men missade tre saker som finns på disk:

### Vad redan är gjort (audit nämnde inte detta)

- **Sprint 26 — cross-system skandalreferenser** levererad 2026-04-26 (commit `11802e1`). 8 skandalarketyper refereras i kafferum (42 utbyten), klack (8 strängar), press (7 frågor), motståndartränare (8 quotes). Auditens "Förslag 4 — Korsreferenser" är delvis redan löst för skandaler. Resten kvar: presskonferens-CS, klack-reaktion-nästa-omgång, pension/legend.
- **THE_BOMB 65-75% klar** per kodverifikation 2026-04-26. Match-commentary refererar akademispelare/kapten/klackfavorit/dayJob redan. Klacken sjunger specifikt. Kafferummet reagerar på transferdrama.
- **State of the Club** (audit-förslag 6) är redan implementerad. PreSeasonScreen visar diff-jämförelse mot förra säsongen (tabellplats, kassa, ort, klack) med pilar, färgkodning, dynamisk narrativ-text. Verifierat i Sprint 27 audit.

### Vad väntar VERIFIERING (inte byggande)

10 inlåsta system är alla 🟠 (implementation klar) men ingen har bekräftats i playtest. Detta är spelets största "gjort men osynligt"-gap just nu:

| System | Yta |
|---|---|
| boardObjectiveService | Portal secondary + KlubbTab |
| opponentAnalysisService | Lineup context-strip + Tactic-flik |
| weeklyDecisionService | Portal secondary |
| leadershipService | PlayerCard knapp |
| rumorService | RoundSummary inbox-items |
| playerVoiceService | PlayerCard quote (20% chans) |
| mecenatDinnerService | Event-modal |
| hallDebateData | Event-modal (säsong 2+) |
| smallAbsurditiesData | Inbox-items |
| arcService | SeasonSummary + Portal secondary |

Plus FIX-47/48/49/50 från idag-igår: scoreboard V1, slutskärm inline, pre-choice timer, lineup default. Allt 🔄 KOD KLAR.

**Vad det betyder:** Innan vi bygger nytt finns en hel session playtest-arbete. Annars riskerar nya features att läggas ovanpå brister vi inte hittat.

### Vad är spec'at men obyggt

- **SPEC_KLUBBUTVECKLING.md** — facility-träd, säsongsplanering, löneeskalering, kontextuella sponsorer, halvårsrapport, annandagsplanering, halldebatten som flersäsongsprocess. Helt skriven, inget byggt.
- **THE_BOMB-rester** — 1.1 presskonferens-CS-villkoring, 2.1 klack-reaktion nästa omgång, 3.3 pensionsval-event.
- **Cup-fasens tonala identitet** — aktivt skrivproblem (min memory, inte i KVAR).
- **BATCH E press/media-separation** — parkerad, väntar beslut.

---

## SPEL-LOOPEN — SEKVENTIELL ANALYS

Spel-loopen är ENBART det här:

```
Portal → (scen/event) → Lineup → Taktik → Match → Granska → Portal
                                                              ↓
                                                  Säsongsslut → PreSeason → Portal (säsong N+1)
```

Per steg: vad ser spelaren, vad väljer hen, vad konsekvensen?

### Steg 1 — Portal (mellan matcher)

**Vad spelaren ser idag:** En primary (default `next_match`), 2-4 secondaries, eventuellt en event-card inline, inbox-räknare nedtill.

**Vad spelaren väljer:** Mest "läs och förstå". Beslut sker via events när de triggas (weeklyDecision, mecenatDinner, hallDebate) eller via flik-navigation (Trupp, Tabell, Ekonomi).

**Konsekvens:** Beror på event-typ. Många beslut har osynliga eller fördröjda konsekvenser.

**Friktion låg/val trivial/konsekvens osynlig:**
- Säsong 1 omg 1: Portal är gles eftersom inget hänt än. Audit påpekade detta.
- Default `next_match`-primary visas i 15-18 av 26 omgångar (icke-derby, icke-SM-final, ingen kritisk event). Upprepning.
- Inbox-räknare är ofta hög (10-20 items/runda från ~20 källor). Risk: spelaren slutar läsa.
- Secondaries varierar tonalt ok men trigger-frekvensen är oklar. Inlåsta systemen var länge gömda eftersom secondaries hade få triggers.

**Beräkna djupare värde:** Mid. Med F1 Beslutsekonomi UI-paketet (mock just klart) blir Portal mer hanterbar — max 2 active, queue-rail, cooldown-rad. Det adresserar overload-problemet direkt.

### Steg 2 — Scen/event (om triggad)

**Vad spelaren ser:** Kafeterian, journalist-möte, mecenat-middag, halldebatt, weekly decision, etc. Modal eller fullskärm.

**Vad spelaren väljer:** Ibland inget (kafeterian är passiv läs-scen). Ibland 2-4 svarsalternativ.

**Konsekvens:** Skift i moral, CS, mecenat-glädje, journalist-relation. Ofta osynligt utanför inbox.

**Friktion låg/val trivial/konsekvens osynlig:**
- **Kafeterian är värd.** Bra ton (Sture-Forsbacka), hög läsupplevelse. Få val att göra men det är OK eftersom det är atmosfär.
- **Presskonferens kan vara klick-igenom.** Auditen pekar på det. Tre svarsalternativ men oklar konsekvens. Mitt eget förslag tidigare: presskonferens-val ska CITERAS av kafeterian/klacken/journalist nästa omgång. Synlig reaktion > osynlig statistik.
- **WeeklyDecision** — implementation klar, väntar verifiering. Frågan är om triggers ger 10+ unika beslut per säsong eller bara samma 3-4 i loop.

**Beräkna djupare värde:** Hög per scen, men många scener är inte triggade i normalspel. Det är därför inlåsta systemen är inlåsta.

### Steg 3 — Lineup (Spela-flödet börjar)

**Vad spelaren ser:** Lineup-lista + Plan-flik. Efter FIX-50: förra matchens elva förinställd, skadade/avstängdas slots tomma.

**Vad spelaren väljer:** Bekräfta default, eller byt enskilda spelare, eller klicka "Fyll bästa elvan" om tomma slots.

**Konsekvens:** Spelarna spelar matchen. Skadade som lämnas i lineup ger varning.

**Friktion låg/val trivial/konsekvens osynlig:**
- Efter FIX-50: trivialt val i 80% av fallen. Default funkar.
- Realistiskt — en manager väljer inte ny elva varje match från noll.
- **Saknas:** Skäl att avvika från default. Idag är skälet bara skada/avstängning. Tänkbara skäl att lägga till: motståndaranalys ("De spelar med 5 anfallare — sätt extra back?"), kemi-explicit-trade-off ("Lindberg-Eriksson har 540 min ihop, högsta i truppen"), trötthet ("Andersson spelade 90 min senast, vill du vila honom?").
- **opponentAnalysisService är 🟠** — context-strip + tactic-step kanske redan ger detta. Behöver verifieras.

**Beräkna djupare värde:** Låg som-är. Mid om opponent-analysen syns tydligt och kemi-stats visualiseras.

### Steg 4 — Taktik (Spela-flödet fortsätter)

**Vad spelaren ser:** Mentalitet, tempo, press-dropdowns. Plus formation-rekommendation (Sprint 23).

**Vad spelaren väljer:** En av 3-5 varianter per dimension.

**Konsekvens:** Påverkar matchsimulation. Hur kännbart?

**Friktion låg/val trivial/konsekvens osynlig:**
- Auditen säger taktikvalen är stuprör. Min spel-känsla håller med — det är 3 dropdowns där alla val är "ok". Inga val känns DUMMA.
- Sprint 23 Del B gav formation-rekommendation med ★ COACH. Det är bra. Men selva taktik-dimensionerna är fortfarande "välj en av flera ok".
- **Saknas:** Taktisk konsekvens som syns SOM ATT VALET MATTRADE. Idag: byt mentality från "balanced" till "attacking" → match spelas → 3-2 istället för 2-1. Spelaren kan inte säga "det var taktiken som gjorde det".

**Beräkna djupare värde:** Mid. Mekaniken finns men feedback-loopen är svag. Auditens "korsreferenser" tar igen detta delvis genom att matchcommentary skulle referera taktiken ("De spelar attacking-mentality och det syns — fjärde anfallaren ständigt över halva planen").

### Steg 5 — Match

**Vad spelaren ser:** Stålvallen-scoreboard, commentary-feed, atmosfärisk ticker, tidslinje, stats. Interactions (corner, penalty, counter, freekick, last-minute press) med pre-choice timer (efter FIX-49: 4-6s).

**Vad spelaren väljer:** Interactions (val under tidspress), halftime-val.

**Konsekvens:** Direkt synlig i nästa step.

**Friktion låg/val trivial/konsekvens osynlig:**
- Detta är spelets högsta-kvalité-del. Interactions har hög impact. Halftime-val är mekaniskt synliga (Del 4 från tidigare). Atmosfärisk ticker fungerar. Stålvallen-mockarna är pixel-jämförda.
- **Saknas:** Inget kritiskt mid-match. Möjligen tydligare halftime-summary efter FIX-48-flytten.

**Beräkna djupare värde:** Hög. Detta är vad spelet är BRA på.

### Steg 6 — Granska (post-match)

**Vad spelaren ser:** Story, scoreboard, events-lista, spelarbetyg, shotmap, hörn-band, POTM. Plus presskonferens (om triggad). Plus eventuellt domarmöte, away-trip-microdecision.

**Vad spelaren väljer:** Presskonferens-svar, eventuellt awayTrip-val.

**Konsekvens:** Skift i moral/CS/relations. Mest osynligt utanför inbox.

**Friktion låg/val trivial/konsekvens osynlig:**
- Granska är RIK i innehåll efter FIX-48-flytten — alla detaljer som tidigare låg i overlay flyttades hit. Men frågan är: är det fortfarande klick-igenom?
- Presskonferens — auditen flaggar som potentiellt trist. Mitt förslag: värdet är inte i mekaniken (+5% fientlighet) utan i SYNLIG reaktion (kafeterian citerar dig nästa omgång).
- AwayTrip-microdecision (WEAK-019) — är beslutet kännbart? Eller klick-igenom?
- Domarmöte — om triggas ~20-30% av matcherna, hur ofta märks det?

**Beräkna djupare värde:** Mid-Hög. Kvalitén beror på om dolda systemen blir verkligen synliga.

### Steg 7 — Säsongsslut → PreSeason

**Vad spelaren ser:** SeasonSummary med årets match, signature-citat, narrativeLog, retirements, awards. Plus "State of the Club" diff vid PreSeason.

**Vad spelaren väljer:** Inget tvingande. Kan eventuellt välja styrelseuppdrag-respons.

**Konsekvens:** Nästa säsong börjar.

**Friktion låg/val trivial/konsekvens osynlig:**
- State of the Club är BRA — diff-jämförelse mot förra säsongen är konkret.
- **Saknas STORT:** Inga val mellan säsonger. SPEC_KLUBBUTVECKLING föreslår säsongsplanering ("Välj ETT bygge: konstis 200k 10 omg, eller akademi 120k, eller spara för inomhushallen") men ingen kod skriven.
- Pension/Legend-narrativ tunt: veteraner försvinner ur truppen men händer inget annat. THE_BOMB 3.3 spec'ad men inte byggd.

**Beräkna djupare värde:** Låg som-är. Hög med klubbutvecklings-paketet.

---

## VAR LOOPEN TUNNAS, DJUPNAR, SAKNAS

### Djupnar (behåll)
- **Match-flödet** (steg 5) — interactions, halftime, atmosphere. Spelets paradgren.
- **Kafeterian** (steg 2) — ton, Sture-Forsbacka, atmosfär.
- **State of the Club** (steg 7) — diff-jämförelse, konkret.

### Tunnas
- **Portal upprepning** (steg 1) — default `next_match` i 15-18 av 26 omgångar. Variants saknas.
- **Lineup default** (steg 3) — funkar men ger inget skäl att engagera. Saknar nudge-yta (kemi, motståndare, trötthet).
- **Taktikvalen** (steg 4) — finns men feedback-loopen svag.
- **Inbox-overload** (mellan) — 10-20 items/runda från ~20 källor. För mycket att läsa.

### Saknas
- **Mål att spara mot** — säsong 5 är ekonomiskt identisk med säsong 1. Inget byggprojekt-träd. SPEC_KLUBBUTVECKLING löser detta men obyggt.
- **Säsongsövergripande val** — inga beslut mellan säsonger som har långsiktiga konsekvenser. Säsongsplanering saknas.
- **Pension/legend-narrativ** — veteran slutar = försvinner. THE_BOMB 3.3.
- **Kedjereaktioner som spelaren ser** — auditens "stuprör"-problem. Kafferum citerar inte presskonferens. Klack reagerar inte på lineup-val. Det finns DELVIS för skandaler (Sprint 26) men inte bredare.
- **Cup-fasens tonala identitet** — saknas tydlig prägel separat från serien.

---

## REFERENSVÄRLDEN — SPORT-MANAGER vs TURN-BASED

Din fråga: ska vi vidga referensvärlden till turn-based-spel allmänt (Civ etc)?

**Mitt svar: Ja, för LOOPEN. Nej, för MEKANIKEN.**

### Vad Bandy Manager redan har från sport-manager-genren

Du har gjort matchsimulation-paradgrenen redan (Football Manager-arvet). Lineup, taktik, transfers, kontrakt, träning, scouting, ekonomi-grunder. Det är vad sport-manager-genren handlar om och du har det.

### Vad Civilization-genren ger som sport-manager saknar

Civ:s genialitet är inte tech-trädet. Det är att VARJE BESLUT du fattar idag skapar ett problem du måste lösa om 15 omgångar. Du bygger ett wonder → andra blir avundsjuka → de förklarar krig → du har inte armé → du måste prioritera militär → ekonomin lider → du tvingas sänka forskningen → tech-trädet sackar → andra leder. **Kedjereaktioner med konkret synliga konsekvenser.**

Crusader Kings tar samma princip men på karaktärsnivå. Du gifter dottern med rival-grevens son för att stabilisera gränsen → 20 år senare ärver hennes son DIN provins → arvtvist → inbördeskrig. Spelet GENERERAR berättelser ur sina egna system.

Stardew Valley använder daglig + säsongslig loop med NPC-relationer som ackumuleras. Du gav Caroline blåbär i april → hon nämner det i augusti → relations-mätaren öppnar nya scener.

**Vad alla tre delar:** Konsekvenser är SYNLIGA, FÖRDRÖJDA, och OUNDVIKLIGA. Du kan inte spela perfekt — bara välja vilka problem du tar.

### Vad Bandy Manager mest behöver från turn-based-genren

1. **Långsiktiga byggspår med dependencies** (Civ tech-tree) → SPEC_KLUBBUTVECKLING facility-träd är exakt detta.
2. **Karaktärsrelationer som ackumuleras synligt** (Crusader Kings, Stardew) → mecenat, journalist, ordförande, klack-ledare, supportergrupp.
3. **Beslut med fördröjda konsekvenser** (alla tre) → löneeskalering (säsong 1-beslut blir säsong 2-3-konsekvens), akademi-investering (3 säsonger tills payoff).
4. **Berättelser ur system, inte ur scripts** (Crusader Kings) → korsreferenser, men VIKTIGT: spelaren ska se det hända.

### Vad Bandy Manager INTE behöver från turn-based-genren

- Tech-tree-komplexitet på Civ-nivå. Bruksortsrealism kräver att spar-beslut är 2-3 alternativ, inte 30.
- Karaktärsdjup på Crusader Kings-nivå (intriger, mord, äktenskap-politik). Klubbledningen är 4 personer, inte 40.
- Ekonomisk djup på OOTP-baseball-nivå. Sponsoravtal är ~5 typer, inte 50.

### Konkret design-princip från turn-based-genren

**Varje beslut spelaren fattar ska skapa minst ETT framtida problem.**

- Du säljer Kronberg → kassan +200k → men: anfallsdjup −1, klack reagerar (CS −5), nästa lönerunda spelarna ifrågasätter ("varför sålde du honom om vi ska tävla?")
- Du bygger konstisen → kassa −200k under 10 omg → men: säsong 3 inga väderbortfall (+8 mål/säsong i hemmamatcher), publik +10%, kommunpolitikern "nu har vi gjort det här tillsammans" (relations +20)
- Du tackar ja till skummig sponsor → kassa +500k → men: granskning säsong 2 (40% chans), möjliga poängavdrag, presskonferens-frågor

Detta är samma sak audit-rapporten säger på slutet ("att sälja Lindqvist nu löser ett pengar-problem men skapar ett anfalls-problem nästa säsong"). Men auditen formulerar det inte som DESIGNPRINCIP — den nämner det som en målbild utan att säga vad som ska byggas FÖR att uppnå det.

**Designprincipen för Bandy Manager 2026-05+:** Varje system-input ska ha minst en system-output i ETT ANNAT system, fördröjd minst 3 omgångar.

---

## STRATEGISK PRIORITERING

Tre riktningar prioriterade efter ROI. Varje riktning är 1-3 sprints.

### 🥇 Riktning 1 — Klubbutvecklingspaketet (SPEC_KLUBBUTVECKLING)

**Varför först:** Spelets enskilt största gap är "inget att spara mot". Säsong 5 är ekonomiskt identisk med säsong 1. Specen finns redan — facility-träd, säsongsplanering, löneeskalering, kontextuella sponsorer, halldebatten som flersäsongsprocess. Allt välmotiverat, ingen design-osäkerhet kvar.

**Inkluderar:** Audit-förslag 1 (facility-träd), 2 (sponsortriggers), 3 (löneeskalering). Plus annandagsplanering (audit #8) som engångsevent i loopen.

**Effort:** Stor sprint, ~2-3 veckor. Code-tungt men spec'at.

**Konsekvenser i loopen:**
- Steg 7 (säsongsslut → PreSeason) får meningsfulla val.
- Steg 1 (Portal) får löneeskalering-events vid kontraktsförlängningar.
- Steg 6 (Granska) kan referera till bygge-progress ("Konstisen 60% klar — påverkar inte denna match men nästa säsong").
- Långsiktig retention från säsong 2+.

### 🥈 Riktning 2 — Verifiera och visualisera dolda system

**Varför:** 10 system är 🟠. Sprint 47-50 är 🔄 KOD KLAR. F1 Beslutsekonomi UI levereras nu från Design. Allt detta är gjort eller på väg — men inget har sett spelare. Risk: bygga mer ovanpå brister vi inte hittat.

**Inkluderar:** Playtest-pass av alla 10 inlåsta system + FIX 47-50 + F1 när Code implementerat. Plus mock+spec för 1-2 system vars synlighet kanske är otillräcklig.

**Effort:** En spel-session per Jacob (3-5h) + uppföljning på fynd. Inget nytt byggande.

**Konsekvenser i loopen:**
- Steg 2 (events) — många dolda system triggas här. Verifiering visar om triggers är rätt.
- Steg 6 (Granska) — domarmöte, awayTrip, presskonferens-volym verifieras.
- F1 Beslutsekonomi adresserar overload-problemet direkt.

### 🥉 Riktning 3 — Cup-tonen + korsreferenser-rester

**Varför:** Annandan + cupen är de DAGAR där spelet känns mest svenskt. Annandan är audit-flaggad och bygger på alla 12 klubbar (din egen poäng). Cup-fasen saknar tonal identitet (min memory). Plus THE_BOMB-rester (1.1 CS-villkorad pressfråga, 2.1 klack-reaktion-nästa-omgång, 3.3 pensionsval-event) är konkreta små luckor som tillsammans gör spelets karaktär tätare.

**Inkluderar:** Cup-anslag och cup-commentary-pass (Opus-skrivarbete direkt). Annandagsplanering som event om Riktning 1 inte byggs först. Tre THE_BOMB-rester som Code-jobb.

**Effort:** Mest Opus-text-arbete + några korta Code-specer. Kan göras i pauser mellan större sprints.

**Konsekvenser i loopen:**
- Cup-fasens steg 1/4/5 får egen prägel.
- Steg 7 (säsongsslut) får pensionsval-event.
- Steg 6 (Granska) får CS-villkorad presskonferens-fråga.

---

## VAD JAG MEDVETET INTE PRIORITERAR

- **Stora arkitektur-refactors (TS-2 till TS-10).** Skuld finns men ingen brand. roundProcessor 1369 rader är inte trasig — bara stor. Splittas opportunistiskt när nästa större sprint berör den. Auditens #1-tekniska-åtgärd (förkompilera playerIdMap) är värd när matchCore growth blir tunga.
- **Förslag 5 (presskonferensen påverkar något).** Bättre löst som korsreferens (kafeterian citerar dig) i Riktning 3, inte som separat osynlig mekanik.
- **Förslag 6 (State of the Club).** Redan klar.
- **Förslag 7 (spelarens livscykel-display).** Datan finns, audit-pekat. Men: emotionella investeringen kommer från löneeskalering-dilemmat (Riktning 1), inte från en karriär-flik. Karriär-fliken är polish som kommer billigt EFTER Riktning 1.
- **Audit-rapportens 5 tekniska åtgärder.** Performans-skuld men ingen blocker. Tas opportunistiskt.

---

## SAMMANFATTNING

Bandy Manager är ett kvalitetsmässigt rikt spel som har stuprör. Lösningen är inte fler features — det är att tegelsten varje feature mot minst ett annat system, fördröjt, synligt. Det är Civilization-arvet vi behöver, inte Civilization-mekaniken.

Konkret: Riktning 1 (klubbutvecklingspaketet) löser "vad sparar jag mot". Riktning 2 (verifiera dolda system) drar hem existerande arbete innan nytt staplas ovanpå. Riktning 3 (cup-ton + korsreferenser-rester) gör spelets karaktär tätare i de stunder som redan finns.

Tre riktningar tar tillsammans ~4-6 veckor effektiv tid. Det är inte 2026-Q3-plan utan kortsiktig-medellång prioritering.

Beslutspunkt nu: Vilken riktning ska köras först? Eller — om verifiering är obligatorisk innan något annat: vill du först köra playtest-session på de 10 inlåsta systemen + FIX 47-50, sedan välja?
