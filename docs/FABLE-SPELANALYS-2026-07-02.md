# FABLE-SPELANALYS 2026-07-02 — flöde, gameplay, spelbarhet

**Vad detta är:** Fable-genomlysning av Bandy Manager som SPEL — inte som kodbas.
Benchmarkad mot genrens bästa (Football Manager, Out of the Park, Motorsport Manager,
Crusader Kings 3, Wildermyth, Blood Bowl, Slay the Spire, Persona) och mot vad vi vet
om hur människor spelar. Grundad i källkod läst 2026-06-29→07-02 (matchCore,
portalBuilder, decisionBudget, interaktionstjänsterna, ripple/callbacks, BACKLOG).

**Läsanvisning:** §1–3 är diagnos av det som redan är byggt. §4–9 är riktning och
fantasi. §10 är antimönster. §11 är prioriterad körorder. Allt per regel 6: varje
tråd slutar i vem som gör vad — eller markeras uttryckligen som samtal, inte ticket.

---

## 1. Utgångsläget: tre saker spelet redan gör bättre än genren

**Beslutsekonomin.** Football Managers djupaste designfel är att det dränker spelaren
i beslut där 95 % inte spelar roll — spelaren lär sig ignorera spelet, och när något
VIKTIGT händer ser det ut som allt annat. Bandy Managers beslutsbudget (max 3 aktiva,
FIFO-kö, informationshändelser passerar oräknade) är strukturellt före FM. Slay the
Spire-lärdomen är internaliserad: få val, alla läsbara, alla med vikt. Slinga 1
(grindad CTA tills veckans beslut hanterats) fullbordar det — spelet vägrar låta dig
autopilota förbi det enda som betyder något denna vecka.

**Legibiliteten.** Ripple-kedjorna ("Därför hände det": skada → stämning → klack →
styrelse), manager-kvittot (dina val loggade mot utfallet), trötthetsringen,
konsekvensraden på taktik×motståndare. Detta är spelets svar på management-genrens
kärnproblem: en förlust utan läsbarhet är en enarmad bandit; en förlust där du ser
"du startade tre trötta" är en lektion. FM har aldrig löst detta — "my team just
doesn't perform" är deras mest citerade frustration. BM bygger systematiskt bort den.

**Minnet.** FM minns ingenting; OOTP minns statistik; Wildermyth minns BERÄTTELSER.
BM bygger berättelseminne: moments, klubbminne, eror, callbacks, Stafetten,
avskedsceremonier, årsdagar som ekar i kafferum och klack. Killer-app-serien är
korrekt identifierad som spelets differentierare. Risken är arkiv-fällan (§6).

**Körorder:** ingen — detta är fundamentet. Vakta det mot feature-tryck som
underminerar det (se §10).

---

## 2. Matchen: spänningsägarskap, en läcka, och hörnan som mästerskapsuttryck

Matchen är hjärtslaget. Steg-baserad feed, fem interaktionstyper (hörna, straff,
kontring, frislag, sen press), tre taktikbyten, pausvalet, spak B. Mot FM — vars
matchagens är "shouts" ingen tror på — är BM:s in-match-agens ÄRLIGARE: hörn-valet
visar zon×leverans mot motståndarens penalty-kill, kontringsvalet visar odds i
procent. Det är roguelike-transparens i en managementmatch, och det är rätt: på
mobil, i 90 sekunder av matchtid, ska spelaren känna att valet var DERAS.

**Läckan (verifierad i källan):** `handleToggleFastForward` auto-resolvar aktiva
interaktioner med `Math.random()`-val, och commentary-mode gör samma sak för hörnor.
En spelare som snabbspolar förlorar tyst sin edge — spelet fattar hens viktigaste
beslut åt hen, slumpmässigt, utan att säga det. Motorsport Manager satte genrestandarden
här: tidskompression MED avbrott-vid-beslut. Snabbspolning ska pausa på interaktioner
(eller åtminstone låta assistenten välja med coach-logik, inte slump, och SÄGA det:
"Assistenten tog hörnan: nära zon, hårt inspel").
**Körorder:** Jacob avgör modell (pausa vs assistent-val); Code implementerar;
copy för assistent-valet = Opus.

**Hörnan som mästerskap.** 22,2 % av bandymål är hörnmål — sportens signatur, och
spelets mest utbyggda interaktion. Detta är BM:s "vad betyder det att bli BRA på
spelet": rotationsdisciplin (AI:n roterar inte proaktivt — spelarens edge är medveten),
kalenderhushållning, och hörnhantverk. Men mästerskap måste SYNAS för att kännas:
en säsongsrad "Hörnor: 12 mål på 47 — ligasnittet 9" gör hantverket till identitet.
**Körorder:** liten Code-yta (säsongsstats-rad i Granska/SeasonSummary ur befintlig
event-data); Opus-copy en rad. Tas när playtest-kön är tom.

**Ensidig dramatik (design-observation, samtal):** interaktionerna är managed-only.
Motståndarens hörna i minut 89 vid 3–3 är idag en feedrad, inte ett ögonblick. Ett
enda defensivt interaktionsmoment (välj penalty-kill-uppställning mot DERAS hörna,
max 1/match, samma scarcity-logik) skulle ge matchens sista minuter dubbelriktad
puls. Rör motorn — Jacob avgör om det tas, egen spec i så fall.

---

## 3. Förlustarkitekturen: att förlora ska vara information, inte straff

Kalibreringen skyddar redan mot förnedring (målskillnadstak 6, 50,2 % hemmavinst).
Men en manager förlorar ~40 % av matcherna — spelets långsiktiga retention avgörs av
vad en förlust GÖR. Kedjan finns: Granska → manager-kvitto → press → klack → styrelse.
Det som saknas är förlustens NARRATIVA värde: Blood Bowl-spelare berättar om sina
katastrofer med kärlek, för katastrofen blev en historia. BM:s ripple-kedja gör
konsekvensen läsbar; nästa steg är att göra den ÅTERBERÄTTELSEBAR — förlusten mot
Västanfors ska kunna bli "matchen då Lindström missade straffen och Birger inte sa
ett ord på tre veckor". Callbacks-maskineriet är byggt för exakt detta; det behöver
mata från förluster lika rikt som från triumfer (kolla vikterna: minnes-beats får
inte vara vinnar-biased).
**Körorder:** Opus auditar moment-/callback-poolerna för förlust-täckning (ren
läsning + ev. copy); fynd → Code om trigger-luckor.

---

## 4. Kalendern är en superkraft ingen konkurrent har

Annandagsbandy. Nyårsbandy. Cupfinalhelgen. SM-final på Studenternas i mars.
Riktiga kulturella ankare med riktig laddning — FM:s kalender är en platt lista,
Persona byggde ett helt genrespråk på att en kalender med emotsedda fixpunkter
skapar LÄNGTAN. Flaggorna finns i koden (isAnnandagen, isNyarsbandy,
isCupFinalhelgen, final på Studenternas låst). Det som kan växa: förväntans-rampen.
Klacken och kafferummet ska börja prata om annandagsderbyt två veckor i förväg;
väderprognosen ska skapa bävan inför bortaresan i februari; säsongen ska ANDAS —
oktobercupens ljus, midvinterns mörker, marsfinalens vårljus (seasonalTone bär
redan tidsbasen). Annandagen är för svensk bandy vad nyår är för Persona: spelaren
ska planera sin trupp MOT den.
**Körorder:** Opus skriver förväntans-pooler (kafferum/klack, gated på
veckor-till-ankare — datat finns i seasonCalendar); Code wirar triggern. Liten,
hög känsloavkastning.

---

## 5. Orten är vallgraven

Inget managementspel gör PLATSEN till karaktär. FM:s klubbar är utbytbara skal;
BM:s bruksort har politiker, mecenat, klackledare, kioskvakt, pensionärskaffe,
julmarknad, kommunalt stöd, en hall-fråga som splittrar byn. Själ-priset i
matchhall-gaffeln är spelets modigaste design: en UPPGRADERING som kostar identitet.
Det är Crusader Kings-klass — mekanik som tvingar spelaren att välja vem klubben ÄR,
inte bara hur bra den är. Benchmark-lärdomen från CK3: sådana val fungerar när
konsekvensen är LÅNG och SYNLIG (hallens atmosfärstext ska skava i åratal, klacken
ska aldrig riktigt förlåta). Verifiera att Själ-priset ekar långt — inte bara vid
bygget.
**Körorder:** Opus läser HALL_ATMOSPHERE-konsumtionen + klack-poolernas
hall-medvetenhet; om ekot dör efter en säsong → copy-utbyggnad (Opus) + ev.
trigger (Code). Samtal med Jacob om hur LÄNGE såret ska synas.

---

## 6. Minnesmaskineriet: arkiv-fällan och ögonblicks-lösningen

BYGGT-MEN-OSYNLIGT har en speldesign-tvilling: SPARAT-MEN-ALDRIG-KÄNT. Ett minne
som ligger i en flik spelaren kan besöka är ett arkiv; ett minne som dyker upp
OKALLAT i rätt ögonblick är en känsla. Callbacks-systemet (mot klubben som köpte
din stjärna; nemesis-tränaren; legendens adept debuterar) är rätt lösning — det är
skillnaden mellan OOTP:s almanacka och Wildermyths berättelser. Regeln att hålla
fast vid: **varje minnessystem behöver minst en OKALLAD yta** (beat/kommentar/
kafferum), inte bara sin flik. Moments-fliken utan callback-tvilling hade varit
arkiv; nu har den en. Stafetten/blodslinjen behöver samma: när adepten gör sitt
första mål ska matchkommentaren veta vems klubba han ärvde (matchCore har redan
legend-commentary-maskineriet — mentorskapet ska in i samma kanal).
**Körorder:** Opus specar mentor-eko i matchcommentary (liten pool + villkor);
Code wirar. Efter killer-apps-verifieringen.

---

## 7. Managerfantasin: du bor här

FM:s manager är ett spöke. BM:s har burnout, nemesis, narrativ logg, kontrakt —
redan före genren. Fantasin att sträcka sig mot: managern BOR i orten. Kafferummet
vet redan; kioskvakten kommenterar redan. Det som skulle fördjupa utan ny mekanik:
managerns egen relation till kalenderns ankare (din första annandag; din femte),
och tenure-språket — "tredje säsongen, folk hälsar på ICA nu". Narrativa loggen
har skrivställena; det är copy-djup, inte systembygge. Managern som karaktär är
också svaret på "vem är jag när jag förlorar" (§3) — burnout-zonen ska kännas i
texternas ton, inte bara i en mätare.
**Körorder:** samtal Jacob+Opus (kreativ riktning, ej ticket). Burnout-tonad
textvariation = Opus-pass när det klubbas.

---

## 8. Sessionens form: mobilen bestämmer loopen

PWA på 430px = sessioner om 10–30 minuter. En matchdag är den naturliga
sessionsenheten, och loopen har redan rätt skelett: portal (läge) → beslut →
förbered → match (peak) → granska (utandning) → advance (krok). Det som avgör
"one more round" är vad ADVANCE visar: nästa-match-kortet + beats är kroken.
Persona-lärdomen: sluta aldrig en session på noll — om annandagen är nästa, om
ett beslut väntar, om nemesis står på tur, ska portalen VISA det innan spelaren
stänger. Det gör den till stor del (beats, eskalering). Finslipningen är att
granska-skärmens SLUT pekar framåt: en rad efter kvittot — "Nästa: Västanfors
borta. De har inte förlorat hemma sedan oktober." Utandning + krok i samma andetag.
**Körorder:** Opus-copy (en pool) + Code-yta (en rad i GranskaOversikt ur befintlig
fixture/form-data). Liten.

---

## 9. Vad LLM-bygget kan som FM aldrig kan — och en ärlig gräns

Spelets textmaskineri (personlighetsnycklade pooler, seedad anti-repetition,
tonkanon) är redan vallgrav nummer två: FM:s text känns genererad för att den är
mallad; BM:s känns SKRIVEN för att den är det. Den ärliga gränsen: statiska pooler
repeterar till slut, och anti-repetitions-hantverket (commentaryHistory, seededPick,
stale-tracking) är det som skjuter upp det — vakta det som kalibrering, mät det i
stresstest (repetitionsfrekvens per pool över en säsong går att mäta headless).

**Fantasin som är genuint möjlig:** ÅRSBOKEN. En gång per säsong, vid säsongsslut,
genereras en unik krönika i Stures röst över DENNA säsongs faktiska båge — skriven
av Claude via API (infrastrukturen finns; Jacob kör redan Claude-API i jobbagent),
ur seasonSummary + moments + narrativeLog som prompt-data. En engångstext per säsong
är körbar offline-tolerant (genereras när nät finns, cachas i saven), kostar ören,
och ger något inget spel i genren har: en bok om just din säsong, i husets röst.
Detta är också Bury Fen-broexemplaret: årsboken är delbar. Svensk bandy är en liten
tät gemenskap — en delbar säsongskrönika/säsongskort är den naturliga virala loopen
för exakt den publiken.
**Körorder:** samtal Jacob+Opus (scope, kostnad, offline-policy). Om ja: Opus
skriver prompt-kanon + few-shots ur WRITING_GUIDELINES; Code bygger
generera-vid-säsongsslut + cache + fallback till statisk pool.

**Ljud-riktningen (fantasi, aesthetik):** svensk bandy är kulturellt en RADIOSPORT.
Feedens röst är redan radiokommentatorns. Ett ljudlager med P4-lokalradio-estetik
(brus, publikdis, målvrål på distans) skulle förstärka identiteten mer än någon
grafisk investering. Parkeras som riktning — ljuddesign är dyrt och playSound-lagret
är tunt idag.

---

## 10. Antimönster att vakta (genrens kända gravar)

**Presskonferens-tröttheten.** FM:s mest hatade feature: frekvent, repetitiv,
konsekvenslös. BM har presskonferenser — håll dem SÄLLSYNTA och KONSEKVENTA
(journalist-minnet finns; en presskonferens utan minne är en quiz).

**Inkorgen som soptipp.** Redan bekämpad (notisdiet, severity-grupper, aggregering).
Vakta: varje ny feature vill skriva inbox-rader; inbox-principen (dokumenterar,
driver inte) är försvaret.

**Statbump-beslutet.** "+3 hörnskicklighet / Ingen effekt" är beslutsdesignens
svagaste form — ett facit, inte ett val. De bästa besluten har (a) spänning mellan
två goda ting, (b) fördröjd/osäker utdelning, (c) en person fäst vid sig. Lindström
som VILL öva är rätt instinkt (en person frågar); nästa nivå är att utfallet ekar
("Lindström satte hörnan i minut 88"). Audit av weeklyDecision-poolen mot de tre
kriterierna = Opus-pass.

**Tutorialväggen.** S1-rampen (Valet-fri, trädet som aspiration, ankomstscen) är
rätt — första halvtimmen avgör retention. D4 (orienterings-rampen) ligger rätt i
design-kön.

**Komplexitetsdriften.** Varje system frestar mot fler mätare. Beslutsbudgeten och
kurationen är spelets identitet — en feature som kringgår dem (egen notiskanal,
eget krav på uppmärksamhet) är en regression per definition, oavsett hur bra den är.

---

## 11. Prioriterad körorder (kondenserad)

1. **Snabbspolnings-läckan** (§2) — Jacob väljer modell, Code bygger, Opus copy.
   Enda fyndet som aktivt SKADAR spelaren idag.
2. **Förväntans-ramp mot kalenderankare** (§4) — Opus-pooler + Code-trigger. Liten,
   hög avkastning.
3. **Granska-slutets framåtpekare** (§8) — Opus-copy + Code-rad. Liten.
4. **Förlust-täckningsaudit i minnes-beats** (§3) + **weeklyDecision-audit mot
   trekriterierna** (§10) — Opus-läspass, fynd → Code.
5. **Hörnmästerskap synligt** (§2) — Code-yta + Opus-rad. Efter playtest-kön.
6. **Mentor-eko i matchcommentary** (§6) — Opus-spec + Code. Efter
   killer-apps-verifiering.
7. **Samtal, ej tickets:** defensiv interaktion (§2), Själ-prisets längd (§5),
   managern-bor-här (§7), Årsboken + delbart säsongskort (§9), radio-estetiken (§9).

Benchmark-summering i en mening: **Bandy Manager konkurrerar inte med FM på bredd —
det vinner på att vara det enda managementspel där platsen minns, kalendern längtar
och förlusten blir en historia. Allt i körordern ovan tjänar den meningen.**

---

## 12. Tre fantasier (tillägg 2026-07-02, på Jacobs fråga; Årsboken struken — driver uppkoppling/kostnad)

### 12a. Minsta insats, största reward: STRECKET LIVE ("Som det står nu")

Bandykultur tänker i strecket. Under match, vid rätt ögonblick (halvtid, mål i andra
matcher, sista tio minuterna i jämnt läge), räknas den hypotetiska tabellen med
liveresultaten inräknade och läggs som atmosfärsrad i feeden: *"Som det står: ni
sjua, en poäng över strecket. Ludvika leder borta — då är ni åtta."* Det är
radiosportens instinkt — tabellen som livedramatik i uppmärksamhetens maximum,
inte en flik man kollar efteråt. All data finns: standings, andra resultat samma
omgång (renderas REDAN som atmosfärsrader i MatchLiveScreen), livescore. Insatsen
är en hypotetisk-tabell-beräkning + triggervillkor + en Opus-pool. Avkastningen:
VARJE match sent i säsongen får sina insatser synliggjorda i stället för abstrakta.
**Körorder:** Opus specar triggervillkor + skriver poolen; Code bygger
beräkningen (återanvänd calculateStandings på hypotetiskt fixture-set).

### 12b. Högsta innovationsgrad: VECKANS SEED ("Utmaningen")

Motorn är deterministiskt seedad (mulberry32, fixtureSeed). Det betyder att en
SÄSONG är reproducerbar: samma seed-sträng → samma värld, samma spelscheman, samma
väder, samma truppgenerering. Skeppa ett utmaningsläge: skriv in en delad kod
("ANNANDAG26"), alla får identisk värld, spelar samma säsong med sina egna val,
jämför via ett delbart resultatkort (textsträng — ingen server, inget konto).
Det är Slay the Spire-dagsrundans kultur transplanterad till managementgenren, där
den ALDRIG gjorts — och den är skräddarsydd för en liten tät gemenskap: svensk
bandy + Bury Fen som distributionskanal. Ärlig insatsnot: live-vägen seedar idag
med Date.now() på flera ställen — full determinism kräver att de härleds ur
game-seed, vilket är det verkliga jobbet. Men även "samma startvärld, dina val,
dina tärningar" bär utmaningsformatet.
**Körorder:** samtal Jacob+Opus om scope (full determinism vs samma-värld);
sen Opus-spec.

### 12c. Bäst, utan hänsyn till insats: LIVSVERKET ("Trettio år i Forsbacka")

Destinationen som killer-apparna redan seglar mot, namngiven: ett karriärläge där
tiden SYNS och spelet har ett SLUT. Tre organ saknas. (1) Tränarlinjen — dina
adepter blir tränare: pojken Stafetten följde står tjugo år senare i båset hos
rivalen, och nemesis-systemet får sin andra generation. (2) Ortens decennieskala —
hallen byggd eller inte, Birgers son tar över kafferummet, klackens generationsväxling;
platsen åldras med dig. (3) Slutet som DESIGNAD upplevelse — sista säsongen
annonseras, avskedsturnén, sista matchen, och en epilog som läser HELA narrativeLog
+ moments + eror som ett livssammandrag: statyn, läktaren som får ditt namn, eller
den tysta flytten till stugan. Ingen managementsim har ett slut värt att spela MOT —
FM slutar inte, det bara upphör. Ett designat slut är det som gör trettio säsonger
till en BERÄTTELSE i stället för en oändlighet. Allt som byggs nu (Stafetten, eror,
ceremonier, narrativeLog, nemesis, ortens system) är organ i den här varelsen.
**Körorder:** ingen — detta är nordstjärnan, inte en ticket. Använd den som
prioriteringstest: en feature som för Livsverket närmare väger tyngre än en som inte gör det.
