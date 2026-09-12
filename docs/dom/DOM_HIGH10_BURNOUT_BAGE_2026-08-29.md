# DOM — HIGH 10: burnout som båge, inte permanent brus

**Datum:** 2026-08-29 · **Av:** Opus · **Utlöst av:** audit 2026-08-29 HIGH 10. Bygger PÅ det befintliga O4-systemet (DOM_BURNOUT_2026-08-17), river det inte.

## Fyndet (kodläst)

O4 byggde redan det mesta: en zon (`getBurnoutZone` → frisk/markbar/hög), en mekanisk kostnad (`getBurnoutTacticSuppression` — taktikrekommendationen uteblir 25/50 %), och tre återhämtningshandlingar med verkliga priser (`generateBurnoutReliefEvent`: delegera −12/journalist −10, träning −15/utvecklingsbroms, styrelse −25/tålamod −10). Texten är låst i O4-domen. Ändå fann auditen burnout som permanent bakgrundsbrus i tre säsonger. Två rotorsaker:

**1. Poängen fastnar högt (A3-klass).** `updateManagerBurnout` (managerProfileService.ts): förlust +10 var (senaste 3), inkorg +min(oläst×0,3, 6)/omg, beslutströtthet +fatigue×0,3, seger −5. Den naturliga återhämtningen `BURNOUT_NATURAL_DECAY = 3` gäller BARA `if (delta === 0)` — men vilken oläst inkorgspost som helst ger delta > 0, så decayen fyrar nästan aldrig. En kämpande klubb (förluster + inkorgshög) ratchetar upp och kommer inte ner; `applyBurnoutRecoveryAtTransition` drar halvvägs mot 30 varje sommar men den klättrar upp igen. Bågen kan alltså aldrig SLUTA inom en säsong. Samma felklass som A3: en återhämtning som är strukturellt oåtkomlig.

**2. Bågen är osynlig.** Zonen visas (BURNOUT_ZONE_LABELS + citat), men INTE orsaken, ingen återhämtningsprogression, inget slut. Och `shouldShowBurnoutMark` re-triggar på oförändrat tillstånd — samma "trött"-citat återkommer säsong efter säsong (cooldown nollställs varje säsong, minSeasonsApart=1). Auditen: "Om tillståndet inte förändras under en hel säsong ska texten inte fortsätta presenteras som en ny händelse."

## Domen

Burnout ska vara en BÅGE med synlig nivå, orsak, återhämtning och slut. O4:s kostnad och tre handlingar står kvar — det som byggs är återhämtningsdynamiken + läsbarhetslagret.

### Mekanik (Code)

**Fixa återhämtningen.** Den naturliga decayen ska gälla när burnout inte AKTIVT pressas upp — inte bara vid `delta === 0` exakt. Modell: skilj press-delta (förluster + fatigue + inkorg) från återhämtnings-delta (seger + decay), och låt decayen verka som baslinje när pressen är låg, oavsett en enstaka oläst inkorgspost. Relief-handlingarna + segrar + vila ska kunna föra burnout tillbaka till 'frisk' INOM en säsong — bågen måste kunna sluta. En manager som svarar ska se den lätta; en som inte svarar eskalerar. Exakt rekalibrering via mätning + D-fact (samma mönster som A3:s X=25 %, D036).

### Läsbarhet (Opus-text + Code)

1. **Synlig orsak.** Visa varför nivån är där den är — "hög efter fem raka förluster", "efter fem pressveckor i rad", "inkorgen har svämmat över". Code härleder den dominerande källan ur delta-komponenterna (förlust/inkorg/fatigue); Opus skriver orsaksmallarna, en per källa.
2. **Återpresentera inte ett oförändrat tillstånd.** `shouldShowBurnoutMark` ska bara fyra när zonen ÄNDRATS sedan sist visad — inte varje omgång den råkar ligga kvar över tröskeln. (Code.)
3. **Återhämtningsprogression.** När zonen sjunker (hög→markbar→frisk) efter en relief-handling, seger eller vila: en beat som visar att det lättar. Opus skriver lättnadstexten; Code fyrar den på zon-sänkning.
4. **Slutbeat.** När burnout återgår till 'frisk' efter att ha varit hög: en kort avslutande beat ("Du hittade tillbaka."). Opus skriver den; Code fyrar den på arc-close.

## SKYDDAT — rör inte
O4:s taktiksuppression, de tre relief-handlingarna och deras låsta text står kvar. `applyBurnoutRecoveryAtTransition` (sommaråterhämtningen) står kvar. Fixen är decay-dynamiken + de fyra läsbarhetsbeatsen, inte en ombyggnad av O4.

## GODKÄNT NÄR (mät burnout-trajektoria över 3–5 säsonger)
1. En manager som SVARAR (vinner, vilar, använder relief-handlingar) ser burnout sjunka och bågen sluta inom en säsong — ingen stuck-high över tre säsonger.
2. En manager som inte svarar eskalerar (bågen ska ha tänder).
3. Zonen re-triggar aldrig på oförändrat tillstånd.
4. Orsak, lättnad och slut är synliga och specifika, inte generiskt brus.

Rekalibreringen (decay-modellen, tröskeln för "aktivt pressad") = utfallet av 1–2. **D-fact krävs.**

## Ägarskap
Opus: denna dom + orsaksmallarna (per källa) + lättnadsbeaten + slutbeaten (fyra små texter, skrivs när Code:s härledning finns). Code: fixa decay-gaten (den strukturellt döda `delta === 0`-återhämtningen), suppression på oförändrad zon, orsakshärledning, progressionsbeats → mät 1–4 → D-fact → commit.

---

## ── MÄTNING 2026-08-30 ──

**Av:** Code · **Skript:** `scripts/high10-burnout-arc-matning-2026-08-30.ts`
**Kör:** `node_modules/.bin/vite-node scripts/high10-burnout-arc-matning-2026-08-30.ts --seasons=3 --seeds=2,3,4,5,6`
**D-fact:** D026 (`docs/findings/facts/design_principles/D026_burnout_formula.yaml`), reviderad samma dag.

### Metod

Riktig produktkodväg: spelet körs headless via `advanceToNextEvent()`, och burnout
uppdateras av roundProcessorns eget anrop till `updateManagerBurnout()`. Skriptet
styr bara regimen runt managern — vilken klubb, vilka matchutfall som skrivs om i
efterhand, och om relief-erbjudandena tas eller ignoreras. Inkorgen städas aldrig,
eftersom en oläst inkorgspost var precis det som gjorde den gamla gaten död; en
mätning med tom inkorg hade mätt bort själva buggen.

Fyra regimer × fem frön × tre säsonger:

| regim | klubb | matchutfall | relief |
|---|---|---|---|
| `svarar` | Forsbacka (85) | alla omskrivna till seger, burnout injicerad till 85 vid omg 6 | tas ('train', −15) |
| `svarar_utan_relief` | Forsbacka | samma | ignoreras |
| `passiv` | Heros (45) | alla omskrivna till förlust | ignoreras |
| `naturlig` | Målilla (65) | inga påtvingade resultat | tas |

Känd lagg i metoden: `advanceToNextEvent` spelar matchen och uppdaterar burnout i
samma anrop, så den nyss spelade matchen räknas med sitt verkliga utfall — bara de
två föregående är omskrivna. Därför bär både klubbvalet och omskrivningen regimens
riktning.

### Fyndet som kom före kalibreringen: gaten var blockerad i 100,0 % av omgångarna

Skriptet räknar per omgång en skuggbana med samma press-värden genom den GAMLA
gaten (`if (delta === 0)`). Resultat: i **varje** körning, i **varje** regim, var
gaten blockerad i samtliga omgångar — 87/87, 92/92, 96/96, 99/99, 103/103, 110/110.
Ingen enda omgång i hela mätningen hade en exakt nollsumma. Skuggbanan når 100 och
stannar där i alla fyra regimer, även den där managern vinner varje match och tar
varje relief-handling. Domens formulering "decayen fyrar nästan aldrig" var för
generös: den fyrade aldrig.

### Andra fyndet: matchresultaten räknades aldrig

Press-fixturefiltret var `homeScore !== undefined`, men `scheduleGenerator` sätter
`homeScore`/`awayScore` till 0 redan när en fixture SKAPAS (status `scheduled`).
Sorteringen på fallande matchday plockade därför de tre högsta matchdagarna i hela
säsongsprogrammet — nästan alltid ospelade 0–0-platshållare, som lästes som tre
oavgjorda. `lossDelta` var permanent 0 och `lastWon` permanent false hela säsongen
utom de allra sista omgångarna. Burnout drevs alltså aldrig av matchresultat, tvärt
emot D026:s egen beskrivning. Fixat med `status === FixtureStatus.Completed`.
Utan den fixen hade decay-kalibreringen mätts mot en formel där segrar och
förluster inte existerade.

### Kalibreringen: BURNOUT_NATURAL_DECAY 3 → 14

Sweep över 3/4/5/6/8/10/12/14/16, fem frön, tre säsonger:

| decay | svarande når 'frisk' inom säsong 1 | passiv i 'hög' |
|---|---|---|
| 3 | 0/5 frön | ~91 % |
| 5 | 0/5 | ~91 % |
| 8 | 0/5 | ~90 % |
| 10 | 1/5 | ~90 % |
| 12 | 4/5 | ~88 % |
| **14** | **5/5, vid omgång 13–22** | **87–91 %** |
| 16 | 5/5, vid omgång 11–13 | 86–89 % |

14 är den lägsta nivån där alla frön klarar krav 1, och den gör det mitt i säsongen
snarare än på ett par veckor. 16 klarar också kravet men gör återhämtningen så
billig att managern som ignorerar varje relief-erbjudande ändå tar sig ner (5–25
omgångar i 'hög' mot 12–54 vid 14) — då hade O4:s tre handlingar tappat sin poäng.

Baslinjen decayen måste överstiga är inte noll: en manager som gör allt rätt bär
ändå ~12–15 press per omgång från inkorg (taket +6 nås vid 20 olästa; mätningen ser
34–51) och beslutsbörda (fatigue 20–40 → +6–12). Under ~12 finns ingen väg ner för
någon.

### GODKÄNT NÄR — utfall vid decay 14

**1. Manager som svarar ser bågen sluta inom en säsong: JA, 5/5 frön.**

Regim `svarar`, alla fem frön: topp 85,0 (injektionen), 'frisk' nådd inom säsong 1
vid omgång 13/22/15/15/13, 2 av ~107 omgångar i 'hög' över tre säsonger. Ingen
stuck-high. Skuggbanan för samma körningar: topp 100, slut 100.

Omgång för omgång, frö 2 säsong 1 (poäng · zon · beat):

```
omg  6  85.0 hog     ← injektion
omg  7  77.1 hog      mark
omg  8  55.1 markbar  relief
omg  9  51.1 markbar
omg 10  62.1 markbar
omg 11  55.1 markbar
omg 12  45.1 markbar
omg 13  32.1 frisk    close
omg 14  40.1 markbar            (ingen ny beat)
omg 17  36.1 frisk
omg 20  30.1 frisk
omg 23  23.1 frisk
omg 26  25.1 frisk
omg 28  10.1 frisk
```

Tre beats, i ordning, och sedan tyst — trots att zonen därefter pendlar
markbar↔frisk elva gånger.

Den strängare läsningen (`svarar_utan_relief` — vinner varje match men tar inte en
enda relief-handling) klarar det INTE: 12–54 av ~107 omgångar i 'hög', ett frö av
fem når 'frisk'. Det är avsiktligt. Domens krav 1 säger "vinner, vilar, **använder
relief-handlingar**"; om segrar ensamma räckte hade O4:s tre priser varit gratis.

**2. Manager som inte svarar eskalerar: JA, 5/5 frön.**

Regim `passiv`: topp 100,0 i alla fem, 'hög' nådd vid omgång 6–7, 87,4–90,8 % av
alla omgångar i 'hög' över tre säsonger. Sommaråterhämtningen (`applyBurnoutRecovery
AtTransition`, SKYDDAT) drar till 65 varje sommar och den klättrar tillbaka till 100
inom ett par omgångar. Bågen har tänder.

Referensbanan `naturlig` (Målilla, verkliga resultat, relief tas): toppar 100 varje
säsong men bottnar allt lägre — frö 3 går 0→100 i säsong 1, botten 47,4 i säsong 2,
botten 4,0 och slut 23,0 (frisk) i säsong 3. Alltså: en medelmåttig klubb pressar
fortfarande upp managern hårt, men bågen kan numera sluta.

**3. Zonen re-triggar aldrig på oförändrat tillstånd: JA.**

Över samtliga 20 körningar (fyra regimer × fem frön × tre säsonger): **0** beats
fyrade på oförändrad visad zon. `lastShownBurnoutZone` stämplas i samma
profiluppdatering som beaten och är den enda invarianten som bär det.

**4. Orsak, lättnad och slut är synliga och specifika: härledningen JA, texten
väntar på Opus.**

1101 av 1101 omgångar i förhöjd zon hade en härledd orsak (100,0 %). Fördelning över
alla regimer: `losses` 781, `fatigue` 220, `inbox` 100. Orsaken flimrar inte bort på
en lugn omgång (den behålls när pressen är 0).

Texten är däremot inte levererad: `BURNOUT_CAUSE_LINES`, `BURNOUT_RELIEF_LINES` och
`BURNOUT_CLOSE_LINES` (`src/domain/data/managerKaraktarText.ts`) ligger TOMMA per
CLAUDE.md:s hårda regel att Code aldrig skriver svensk speltext. Mekaniken är fullt
wirad: `BurnoutReliefMark.tsx` returnerar `null` så länge poolen är tom och tänds
automatiskt i samma stund arrayen fylls, utan någon ytterligare kodändring. Krav 4
är alltså halvt uppfyllt — härledningen finns och är mätt, ytan väntar på fyra små
texter.

### Öppet fynd som inte åtgärdats

**Zon-pendling kring tröskeln kan ge mark→relief→mark på tre omgångar.** Vid decay 10
sågs frö 3 fyra `mark@m7 · relief@m8 · mark@m10 · relief@m13 · mark@m15` när poängen
studsade runt 70. Formellt är varje beat en äkta zonändring, så regeln är inte
bruten — men för spelaren kan det läsas som samma tillstånd återpresenterat. Vid
decay 14 är det ovanligt i `svarar` (tre beats totalt) men syns i `naturlig` (frö 2:
elva beats över tre säsonger). Åtgärden vore hysteres på zongränsen (t.ex. kräva
5 poängs marginal för att sänka en visad zon), vilket är en designändring utanför
den här domens ram.

**Körorder:** Opus skriver de fyra texterna (tre orsaksrader, en lättnadsrad, en
slutrad) och tar ställning till om hysteres ska specas som eget ärende. Code har
levererat mekanik + mätning + D-fact. Jacob verifierar bågen i playtest när texten
finns.

### Följdfix 2026-08-30 (granskning innan commit) — korten hade aldrig kunnat visas

Byggets egen radlagerkod (BurnoutMark.tsx, BurnoutReliefMark.tsx, initCardBag.ts:s
triggers) läste `shouldShowBurnoutMark`/`shouldShowBurnoutRelief`/`shouldShowBurnoutClose`
en ANDRA gång, mot det redan LAGRADE profil-tillståndet — samma predikat
roundProcessor precis använt för att FATTA beslutet och sedan stämplat
`lastShownBurnoutZone` till nuvarande zon i. En omkörning mot ett tillstånd där
"före" och "efter" redan är samma värde ger alltid nej. Verifierat empiriskt
(reproduktionsskript, inte bara läsning): beslutet var `true`, men allt som läste
samma predikat EFTER stämplingen fick `false` — permanent, för alla tre beats,
retroaktivt även för den redan skeppade eskaleringskortet (BurnoutMark, i drift
sedan C-MK1). Ovanstående krav 3/4-redovisning ("0 beats fyrade på oförändrad zon",
"mekaniken tänds automatiskt") beskriver alltså roundProcessor-sidans bokföring
korrekt, men var skriven innan detta fanns verifierat på render-sidan — utan fixen
nedan hade INGET av de tre korten någonsin synts för spelaren, oavsett textpool.

Fix: en tredje läsväg i narrativeBeatLog (`wasLoggedThisRound`,
narrativeLogService.ts) plus tre fasta semanticKey:s (`BURNOUT_MARK_FIRED_KEY` m.fl.,
managerProfileService.ts) som roundProcessor loggar NÄR ett beat fyrar. Render-lagret
läser loggen istället för att återköra predikaten. TranareTab.tsx (som visar ett
persistent statuscitat, inte en flashande händelse) fick en egen, oförändrad
`isSustainedHighBurnout` — den skulle annars fått samma permanenta tystnad.
tsc/vitest (3327/3327, +4 mot föregående)/build gröna. Ingen ny mätning krävdes —
bara vilket LAGER som läser beslutet ändrades, inte beslutslogiken själv.
