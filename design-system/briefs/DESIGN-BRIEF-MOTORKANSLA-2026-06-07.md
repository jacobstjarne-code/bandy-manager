# DESIGN-BRIEF: Gör motorn kännbar — motordynamikerna som upplevelse

**Datum:** 2026-06-07
**Från:** Opus (designspåret)
**Till:** Claude Design
**Källa:** `design-system/briefs/DESIGN-BRIEF-MOTOR-OVERFLYTTNING-2026-06-07.md` (dataspårets brief — vad som hänt i motorn). Läs den för motorkontexten; den här tar vid där den slutar och säger *hur det ska kännas och se ut*.
**Kanon:** ärlighetsprincipen nedan (§2) är icke förhandlingsbar och går före allt annat i den här briefen.

---

## 0 · Vad Design ska leverera

Mockar som gör fyra nya matchdynamiker **förnimbara och påverkbara** för spelaren. Motorn räknar redan fram dem korrekt mot verklig bandydata — men de är osynliga och opåverkbara, och då tillförde realismen ingenting till upplevelsen. Det är designgapet. Fyra dynamiker, tre befintliga ytor + en ny, en prioritetsordning.

De fyra dynamikerna (kort — källan har detaljerna):
1. **Post-paus-fönster** — det jagande laget får en transient skjuts tidigt i 2H (minut 45→60). Comebacks klustrar där.
2. **Momentum efter kvittering** — den som just kvitterat behåller fart, nollställs inte till jämnt.
3. **Sen decisiveness** — jämna sena lägen (minut 66→84) öppnar upp och avgörs i stället för att driva mot oavgjort.
4. **Dispositionell stil** — taktik (tempo, passingRisk, mentality) driver rytm och målklustring; cornerStrategy driver hörnberoende.

## 1 · Ryggraden — agens är motgiftet mot frustration

Det här är designlagen som håller ihop hela briefen.

Fler comebacks gör spelarens **egna** ledningar mindre säkra. Det kan kännas som *drama* eller som *frustration* — och skillnaden avgörs av en enda sak: **har spelaren en spak över variansen, eller inte?** Varians man kan styra känns som drama. Varians som bara händer en känns som tärning.

Så: **exponera aldrig en varianskälla som jobbar mot spelaren utan att para den med en spak spelaren styr.** En tappad ledning ska kunna läsas som "jag lugnade dem inte i pausen" eller "jag skulle ha stängt igen sent" — aldrig som "motorn tog den ifrån mig".

Det här är inte bara en känslofix. Källan slutar med att den sista motorrestposten (fullbordade comebacks ligger på ~9 % mot verkliga 13) ska stängas med *spelaragens*, inte mer motortuning. Designen är alltså mekanismen: en spelare som jagar ska kunna *driva* sin comeback via pausspaken och sen aggression. Spakarna är inte dekoration ovanpå motorn — de är hur den sista realismen faktiskt uppstår.

## 2 · Ärlighetsprincipen (HÅRD)

UI:t ska spegla **verkligt motortillstånd** — inte en dekorativ animation vid sidan om. Momentum, post-paus-urgency och lateFactor är riktiga variabler motorn räknar fram. Läs dem. Hitta inte på en parallell effekt som *ser* dramatisk ut men inte hänger ihop med vad som faktiskt avgör matchen.

Detta är den vanligaste fällan för en visuell yta: en snygg momentumbar som rör sig på känsla i stället för på motortillstånd. **En momentumbar som ljuger om motortillståndet är värre än ingen bar alls** — den lär spelaren läsa fel och bryter förtroendet när utfallet inte matchar vad baren visade. Samma disciplin som styrde kalibreringen (modellera orsaken, fitta inte kurvan) gäller presentationen. Visa det som händer, inte en tillrättalagd version.

Praktiskt för Design: när du mockar en rörelse, säg i noterna *vilken motorvariabel* den speglar. Kan du inte koppla rörelsen till en variabel är den dekoration och ska bort.

## 3 · Dynamik → spak (paren)

| Dynamik | Förnimbar var | Spak (agens) |
|---|---|---|
| Post-paus-tryck | MomentumBar, 2H-start | **Paussnacket** — tänd om du jagar, lugna om du leder |
| Sen decisiveness | MomentumBar, sent | **Sent matchnings-val** — gå på vinsten / stäng igen *(ny yta)* |
| Kvitterings-momentum | MomentumBar, vid kvittering | *Svagast — ingen ren spak mitt i halvlek. Håll den perceptuell.* |
| Dispositionell stil | TaktikScreen + matchrytm | **Taktikvalen** själva |

En ärlig markering: kvitterings-momentumet har ingen naturlig spak mitt i en pågående halvlek. **Tvinga inte fram en låtsasspak.** Den dynamiken ska vara *kännbar* (man ser svängningen), inte styrbar — det enda svaga handtaget är ett taktikskifte. Bättre en ärligt perceptuell dynamik än en knapp som låtsas påverka.

## 4 · Ytorna att mocka

### 4.1 MomentumBar (PRIO 1 — perception, och linchpin)

Tre av fyra dynamiker landar här. Faller baren, faller hela perceptionslagret — så det här är den viktigaste och svåraste mocken.

**Den centrala spänningen att lösa:** *ärlig mot motorn* och *läsbar* drar åt olika håll. Rå momentum-variabel är troligen skälvig; en bar som darrar för syns skull ljuger lika mycket som en som glättar. Lösningen jag vill se mockad: visa variabeln i **motorns egen kadens** (dess decay-takt, inte en pålagd jämn glidning) **plus diskreta, annoterade brytpunkter** så spelaren läser *struktur*, inte brus.

Baren måste visa exakt dessa tre saker ärligt:
- **2H-avspark:** baren glider mot det *jagande* laget och sväller mot minut 60. Det jagande trycket ska synas som en riktning, inte en blink.
- **Vid kvittering:** baren rycker till målskytten och **stannar där** — ingen återställning till 50/50, för motorn återställer inte. Det här är den vanligaste lögnen att undvika (de flesta momentumbarer nollar vid mål).
- **Sent i jämnt läge:** svängningarna **vidgas** (volatilitet upp) i stället för att plana mot mitten. Spelet öppnar sig — baren ska kännas nervösare sent, inte lugnare.

**Lär spelaren läsa baren.** Första gångerna en dynamik inträffar: en liten markör/etikett vid brytpunkten ("andra halvlek — [lag] trycker på", "kvitteringen vände momentumet", "det öppnar upp"). Målet är att baren går från ambient dekor till något spelaren *läser* och fattar beslut på. Designfrihet i hur dämpat/elegant detta görs — men det måste hända minst de första gångerna.

Mocka gärna ett par tillstånd sida vid sida: lugn 1H · post-paus-svällning · kvitterings-ryck-och-håll · nervöst sent läge.

### 4.2 HalftimeModal + pepTalk (PRIO 2 — agens, renaste vinsten)

Post-paus-urgencyn slår in *efter* pausen — så paussnacket är den naturliga spaken, och halvtiden är redan ett beslutsmoment i flödet. Det här är där agens-loopen sluts billigast.

- **I underläge:** ett vasst snack ("tänd dem") förstärker comeback-trycket — högre varians, du satsar på vändningen.
- **I ledning:** ett lugnande snack ("håll huvudet kallt") dämpar motståndarens post-paus-svällning, stabiliserar.
- **Loopen:** spelaren gör valet i pausen → ser konsekvensen i 2H-MomentumBaren. Perception och agens på samma båge. Det är också här en jagande spelare lyfter sin comeback-frekvens mot de verkliga 13.

Ärlighetskrav (§2): alternativen ska kännas som att de **modulerar den verkliga post-paus-urgency-variabeln**, inte som smaksättning. Mocka kopplingen tydligt — valet ska ha en synlig, förutsägbar riktning på baren efteråt, inte ett slumpartat "det kanske hjälpte". Designfrihet i ton, antal alternativ och hur snacket gestaltas (röst, tränarkaraktär, etc.) — men kopplingen val→motoreffekt→synlig bar måste bära.

### 4.3 Sent matchnings-val (PRIO 2b — NY yta, konceptmock)

**Detta finns inte i koden än och nämns inte i källan — det är mitt tillägg.** Sen decisiveness (§3) är förnimbar i baren men saknar annars en spak. Para den: ett **sent matchnings-val** i de avgörande slutminuterna — *gå på vinsten* vs *stäng igen* — som ger spelaren hävstång på det öppnande slutskedet i stället för att passivt åka med.

Mocka det som ett **koncept**, inte en färdig integration: hur och var dyker valet upp (en in-match-kontroll? en knapp som tänds när lateFactor stiger?), hur det känns att det bara är tillgängligt i rätt skede, och hur utfallet kopplas tillbaka till baren. Lågt detaljkrav — vi vill se idén innan Code bygger något.

### 4.4 TaktikScreen + tacticModifiers (PRIO 3 — stil-läsbarhet, efter Codes stilkalibrering)

När stilkalibreringen är inne får taktikvalen verklig hävstång på matchens rytm. Designuppgiften: gör det **läsbart**. Inte abstrakta reglage — beskrivna *rytm-konsekvenser*: "högt tempo → fler målskurar, högre varians", "lågt passingRisk → färre chanser, stadigare". Spelaren ska förstå att hög intensitet ger målskurar, inte bara dra i ett namnlöst spak.

Och en eftermatch-koppling: spelaren ska kunna *läsa* att hens stil gav rytmen hen såg. Mocka gärna hur taktikvalet och matchens faktiska rytm knyts ihop i återblicken.

## 5 · Balanssvaret (briefens specifika oro)

Den farligaste känslan: spelarens egna ledningar blir mindre säkra. Svaret är §1 i praktiken — en tappad ledning ska läsas som **ägarskap**, inte tärning. Varje yta ovan finns för att ge spelaren handen på ratten över precis den varians som annars skulle kännas orättvis. Designtest för varje mock: *om spelaren tappar en ledning här, pekar ytan tillbaka på ett val hen gjorde (eller inte gjorde)?* Gör den det är variansen drama. Gör den inte det, sänk den eller ge en spak.

Och: en dynamik utan trolig spak (kvitterings-momentumet) ska hållas **perceptuell och inte förstärkas** — känn den, men blås inte upp den till en orättvisa man inte kan möta.

## 6 · Fallgropar

- **Den dekorativa lögnen** (§2) — en bar/animation som rör sig på känsla, inte på motortillstånd. Värst av allt.
- **Skälvig bar** — rå variabel utan kadens-dämpning blir brus. Motorns egen decay + diskreta brytpunkter, inte konstgjord jämnhet och inte darr.
- **Smaksatt paussnack** — alternativ som låter olika men gör samma sak. Valet måste ha en synlig riktning på baren.
- **Låtsasspaken** — en knapp på kvitterings-momentumet som inte egentligen styr något. Hellre ingen.
- **Ceremoni-vokabulär på fel lager** — det här är innehålls-/interaktionslagret, inte ceremoni. Inget guld, ingen hjälte-typ, ingen fullbleed. Stillsam, läsbar, ärlig.

## 7 · Prioritet och frihet

**Ordning:** 1) MomentumBar (perception — spelaren måste se dramat först). 2) Paussnacks-spaken + det sena matchnings-valet (agens). 3) Taktik-läsbarheten (efter Codes stilkalibrering).

**Låst** (ändra inte): ärlighetsprincipen §2; de tre tvingande bar-beteendena §4.1; att kvitterings-momentumet hålls perceptuellt utan låtsasspak; innehållslager, inte ceremoni §6.

**Designfrihet** (din domän): all visuell gestaltning — barens form/rörelsespråk, hur brytpunkts-etiketterna ser ut och dämpas, paussnackets ton och tränarröst, var och hur det sena valet dyker upp, eftermatch-läsbarheten. Och säg ifrån om någon av de "låsta" punkterna gör en yta omöjlig att göra vacker — då har jag missat något och vi tar det.

---

## 8 · Opus-svar på de tre öppna frågorna + förutsättning (2026-06-07)

Design ställde tre frågor, alla om huruvida en variabel faktiskt finns att rita ärligt. Svar, grundade i `matchCore.ts` (läst):

**Förutsättning före allt (Code, steg 0):** motorvariablerna är **loop-lokala** i matchCore och emittas inte på `MatchStep` i dag (yield:en bär score/shots/commentary, inte motortillstånd). Innan den ärliga MomentumBaren kan kopplas måste Code **exponera per steg**: `homeInitiative` (nålens nuvärde — den reella initiativ-andelen `homeWeight/(homeWeight+awayWeight)`, som redan väger in alla multiplikatorer; **INTE** den skott-baserade `momentumDiff`, som är exakt proxy-lögnen vi dödar), `postBreakUrgency`, `postEqualizerMomentum` (+ vilket lag), `lateFactor`, `matchProfile`. Utan dem kan baren bara proxa. Detta är steg 0 i implementationen.

**Q1 · Volatilitetsbandet — behåll, men driv det från riktiga variabler.** Motorn exponerar INGEN dedikerad swing-range/varians-skalar. Men bandet kan ändå ritas ärligt: bredden härleds från `lateFactor` (det reella som vidgar utfallsvariansen sent — even_battle får `+0.60 × lateFactor` attack) + `matchProfile` (defensive_battle→standard→open_game→chaotic är matchens inneboende öppenhet, namngiven). Båda är riktiga. **Härled ALDRIG från senaste-N-ticks-skott** — det är exakt samma proxy-lögn som den gamla baren. Så: behåll bandet, bredd ur lateFactor (+profil), aldrig ur tick-historik.

**Q2 · Spak B — löst: feed-kort.** matchlive_helhet-mocken placerade Spak B som ett kort i commentary-feeden, gate:at på `lateFactor`, inte fristående knapp eller controls-snabbval. Jacob bekräftade. Det ersätter handoffens öppna framställning — feed-kort gäller.

**Q3 · Decay-takt — ingen enskild konstant; varje dynamik har sitt eget fönster** i matchCore:
- `postBreakUrgency`: steg 30→40, linjärt `(40−step)/10` (~15 min, minut 45→60)
- `postEqualizerMomentum`: 4 steg, linjärt (~6 min) — det är hur länge nålen "stannar" innan den klingar
- hot-hand: 2 steg (~3 min)
- `lateFactor`: RAMPAR upp steg 44→56, `min(1,(step−44)/12)` (avtar inte)
- 1 steg = `round(step × 1.5)` minuter
Nålens animation matchar varje dynamiks eget fönster, inte en global takt. (Förutsätter exponeringen ovan.)

— Opus (designspåret), 2026-06-07
