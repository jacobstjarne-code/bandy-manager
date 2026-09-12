# O12 — browserprov av val-entropi och förhandsdelta

**Datum:** 2026-09-09  
**Live-build:** `b5f7653` (`b5f76531b809b21a8e034e80e389d0aef9225b1a`)  
**HEAD vid rapport:** `c8ad5eac`  
**Viewport:** 390 × 844  
**Underlag:** tre nytillverkade, exporterade browser-saves; analyserade med `npm run analyze:choice-entropy` från aktuell HEAD.

## Kort dom

O12 går att köra från riktiga browser-saves. Mätkedjan läser nya, explicit spelarattribuerade val och exkluderar auto-/legacy-poster. Men det här provet kan **inte** godkänna O12:s 80-procentsgrind: en testare varierade valen medvetet, och två rena kvittenser räknas i dag felaktigt som beslut. Provet är därför en pipeline- och sanningsrevision, inte spelartelemetri.

Det viktigaste fyndet är tvådelat:

1. Spelet visar fortfarande exakta icke-ekonomiska facit före flera val. På presskonferensen syntes exempelvis `+2`, `+4` och `+5 moral` samtidigt. Det strider direkt mot O12-domen, som bara tillåter exakt belopp före valet för pengar.
2. Entropirapporten blandar verkliga val med `Noterat`-kvittenser och tappar ett faktiskt steg i en transferförhandling genom för grov deduplicering. Instrumentet är användbart, men ännu inte sanningsrent nog för en releasegrind.

## Vad som faktiskt gjordes

Tre nya karriärer skapades i liveappen via startflödet och spelades i mobilbredd:

- Forsbacka, LÄTT: en cupmatch, transfermotbud följt av accepterat reviderat bud, bandyskola startad, pressvar, klack- och pressintroduktion kvitterade, sponsor accepterad.
- Skutskär, SVÅR: en derbymatch, ett annat pressvar, klack- och pressintroduktion kvitterade.
- Västanfors, LÄTT: en cupmatch, transferbud avslaget, bandyskola avstådd, ett tredje pressvar, klack- och pressintroduktion kvitterade, sponsor avslagen.

Alla tre sparades med appens **Exportera säkerhetskopia** och lästes av analysverktyget. De exporterade råfilerna ligger lokalt i `~/Downloads` och committas inte.

## Resultat från analysen

`15` spelarval från `3` saves. `0` auto och `0` äldre/okända poster inkluderades. En post klassades som dubblett.

| Eventtyp | n | största andel | verktygets dom | observerad fördelning |
|---|---:|---:|---|---|
| `journalistExclusive` | 3 | 100 % | dominant | `acknowledge` 3/3 |
| `supporterEvent` | 3 | 100 % | dominant | `acknowledge` 3/3 |
| `communityEvent` | 2 | 50 % | godkänd | `start` 1, `pass` 1 |
| `sponsorOffer` | 2 | 50 % | godkänd | `accept` 1, `reject` 1 |
| `transferBidReceived` | 2 | 50 % | godkänd | `counter` 1, `reject` 1 |
| `pressConference` | 3 | 33 % | godkänd | tre olika svar, 1 vardera |

**Varning:** de fyra "godkända" raderna visar bara att pipelinen kan skilja alternativ. De säger ingenting om naturlig dominans, eftersom valen varierades avsiktligt för att pröva registreringen.

## Fynd 1 — kvittenser förorenar entropin

### Såg

På varje ny karriär kom två rena introduktionsrader: lokaljournalisten och klackledaren. Båda hade bara knappen `Noterat`. Analysen rapporterade dem som 100 procent dominanta `journalistExclusive` respektive `supporterEvent`.

### Koden säger

`voiceIntroductionService.ts` skapar introduktionerna som vanliga `GameEvent`:

- pressintroduktionen får typen `journalistExclusive`;
- klackintroduktionen får typen `supporterEvent`;
- båda får exakt ett `acknowledge`-val med `noOp`.

Den gemensamma resolvern skriver klicket som `madeByPlayer: true`. `choiceEntropyService.ts` räknar sedan alla poster där `madeByPlayer === true` och `eventType` finns. Instrumentet vet alltså inte skillnaden mellan ett beslut och en manuell kvittens.

### Rotorsak

`ResolvedChoice` bär vem som klickade och vilken eventtyp det var, men inte om eventinstansen erbjöd ett verkligt val. Eventtypen räcker inte: samma `supporterEvent` och `journalistExclusive` används också för genuina flervalsdilemman.

### Rekommenderad fix

Spara en explicit, instansbaserad beslutsidentitet vid resolution — exempelvis `decisionKind: 'choice' | 'acknowledgement'` eller det faktiska antalet tillgängliga alternativ. Entropin ska bara räkna genuina val. Använd inte en blacklist på eventtyp eller `choiceId === acknowledge`; det skulle blanda ihop andra event av samma typ och bli en bryggfix.

## Fynd 2 — transferkedjan tappar ett verkligt steg

### Såg

I Forsbacka-saven valdes först `Kräv mer (65 tkr)` och därefter `Acceptera (65 tkr)`. Båda finns i `resolvedChoices`, med samma `eventId`. Analysen räknade motbudet och rapporterade den senare accepten som dubblett.

### Rotorsak

Entropin deduplicerar på `(save.id, eventId)`. Det skyddar mot att samma save exporteras flera gånger, men antagandet "ett event-id = ett spelarbeslut" håller inte för en förhandlingskedja där samma bud lever vidare genom flera mänskliga steg.

### Rekommenderad fix

Ge varje registrerat beslut ett stabilt `resolvedChoiceId`/stegnummer när det skrivs och deduplicera exporter på den identiteten. Att bara byta till `(eventId, choiceId)` är bättre än dagens kod men löser inte säkert två likadana handlingar i en framtida flerstegskedja.

## Fynd 3 — förhandsfacit är fortfarande synligt

### Såg

Presskonferensen efter Västanfors–Lesjöfors visade tre svar med exakta moraldeltan (`+3`, `+2`, `+5`) och vägran med `-3 moral`. Motsvarande exakta icke-ekonomiska deltan syntes även på andra beslutsytor under provet. Sponsor- och transferbeloppen var exakta, vilket O12 uttryckligen tillåter.

### Koden säger

`EventChoice.subtitle` är fortfarande beskrivet och använt som en exakt "Consequence preview". `DecisionChoices.tsx` renderar `choice.subtitle` ordagrant före klicket. En kodsökning på nuvarande HEAD hittar ett stort antal domänsubtitles med exakta moral-, relations-, rykte-, orts- och stämningsdeltan. O12 är alltså inte en isolerad presskonferensmiss utan ett delat datakontrakt.

### Rotorsak

Samma fält används som både förhandsinformation och utfallsbeskrivning. Presentationslagret kan därför inte visa riktning före valet och exakt facit efteråt utan att antingen läcka siffrorna före eller förlora dem efter.

### Rekommenderad fix

Dela kontraktet i två semantiska fält:

- en förhandsbeskrivning med riktning, berörd person/system och exakt pengakostnad;
- ett exakt utfallskvitto för efterläget/historiken.

Pengar ska fortsätta vara exakta. Övriga resurser ska uttryckas kvalitativt före valet och numeriskt efter. En generell regex som suddar siffror i renderingen rekommenderas inte: den skulle vara en bryggfix, riskera att dölja pengar och lämna otydliga meningar.

## Vad provet bevisar — och inte bevisar

### Bevisat genom observation

- Nya browser-saves bär `madeByPlayer` och `eventType` så O12 kan analyseras utan att gissa om äldre historik.
- Tre saves kan kombineras och samma save kan exporteras på nytt.
- Flervalsbeslut kan skiljas åt i rapporten.
- Exakta icke-pengadeltan syns fortfarande före val.
- Enknappskvittenser och flerstegsbud ger felaktig mätsemantik.

### Inte bevisat

- Att sponsor-, transfer-, community- eller pressval naturligt ligger under 80 procent. Den här testaren balanserade alternativen medvetet.
- Att någon eventtyp "kan inte" vara dominant i riktig releasepopulation.
- Att live och HEAD är helt identiska. Live var `b5f7653`; HEAD var `c8ad5eac`. Sedan livehashen har de relevanta filerna fått ledger-/proofändringar, men inget nytt O12-kontrakt eller ny entropimodell. Slutsatsen om den synliga förhandsdeltan och de två mätfelen gäller även i aktuell kod.

## Nästa ordning

1. Gör entropiloggen instanssann: skilj beslut från kvittens och ge varje beslutssteg egen identitet.
2. Dela förhandsbeskrivning från exakt utfall i `EventChoice`-kontraktet och migrera de gemensamma beslutsytorna mot det — med O12-domen som copyregel, inte med strängsanering.
3. Kör om samma tre-save-prov på en deploy som innehåller ändringen och bekräfta att `Noterat` inte längre blir dominansrad och att både transfermotbud och slutligt svar räknas.
4. Mät först därefter 80-procentsgrinden på naturliga val från flera oberoende spelare. Ett medvetet varierat testkonto kan verifiera rören, aldrig spelarnas preferens.

## Mekanisk uppföljning 2026-09-09

Punkt 1 ovan är byggd i `06336d37` (`fix: gör O12 beslutstelemetri instanssann`). Varje nytt `ResolvedChoice` får nu ett stabilt `resolutionId` och ett instanssant `decisionKind`. Entropianalysen:

- räknar bara verkliga flervalsbeslut;
- särredovisar enknappskvittenser;
- bevarar flera beslut i samma eventkedja;
- deduplicerar överlappande exporter på resolutionens identitet;
- behandlar gamla poster utan de nya fälten som okänd legacydata, inte som bevisade spelarval.

Detta är en rotfix i skrivkontraktet och analysen, inte en eventtyp-blacklist. Regressionstester täcker både `Noterat`-fallet och transferkedjan med två resolutioner under samma event-id.

Verifiering: fokusurvalet är grönt (14/14 tester), produktionsbygget är grönt och hela sviten är grön (539 testfiler, 4 931 tester).

## Mekanisk uppföljning §2 — före/efter-kontraktet

Punkt 2 är byggd i `b5e6dfad` (`feat: dela O12 förhandstext och efterkvitto`) mot den låsta domen `docs/dom/DOM_O12_FORHANDSTEXT_KONTRAKT_2026-09-09.md`:

- `EventChoice.subtitle` är nu en ren förhandskanal. Moral, rykte, ort, stämning och relationer beskrivs med domens kvalitativa vokabulär; exakta pengar är kvar.
- `resolveEvent` tar ett numeriskt före/efter-foto och sparar bara den faktiskt applicerade skillnaden i ett strukturerat `ResolvedChoice.outcomeDeltas`. Clampning och specialresolvers blir därmed sanna i kvittot; det deklarerade effektbeloppet eller förhandstexten återläses aldrig som facit.
- Det exakta kvittot visas först på det resolverade beslutskortet i Granska. Äldre saves saknar fältet och visar fortsatt valt svar utan fabricerade tal.
- De avsiktligt dolda motvikterna `developmentRateDelta` och `disciplineDelta` ingår inte i kvittoresurserna och förblir dolda.
- En statisk bygggrind inspekterar produktionskodens `EventChoice`-objekt och stoppar nya exakta icke-pengadeltan i `label`/`subtitle`. Det är en källkontroll, inte runtime-regex eller strängsanering.

Verifiering efter §2: produktionsbygget inklusive den nya O12-grinden är grönt. Riktade omprov: 111/111. Hela sviten: 541 testfiler och 4 936 tester, samtliga gröna.

O12:s implementation är därmed byggd. Själva 80-procentsgrinden är fortfarande **inte bedömd**: först krävs deployprov av före/efter-ytan och därefter naturliga val från flera oberoende spelare. Det tidigare medvetet varierade tre-save-provet verifierar rören, inte naturlig valdominans.
