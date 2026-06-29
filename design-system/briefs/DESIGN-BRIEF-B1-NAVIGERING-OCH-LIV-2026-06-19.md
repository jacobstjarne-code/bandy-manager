# DESIGN-BRIEF — B1 Klubbutveckling: navigering & liv

**Datum:** 2026-06-19
**Till:** Claude Design
**Källa:** Jacobs playtest 2026-06-19 — "jag stötte aldrig på trädet eller säsongsvalet." Spårat mot kod samma session.
**Status:** Fristående brief. Förutsätter att de tre B1-ytornas *utseende* redan är specat (se Råmaterial nedan) — denna brief gäller hur de NÅS och hur de LEVER, inte hur de ser ut.

## Det här är inte en yt-brief
Utseendet på de tre B1-ytorna är redan löst: `DESIGN-BRIEF-B1-KLUBBUTVECKLING-YTOR-2026-06-11.md` + den renderade mocken `docs/mockups/2026-06-11_design_b1_klubbutveckling.html` (träd · Valet · gaffel). Den här briefen rör en annan sak: **navigationsarkitektur och liv.** Var bygget bor, hur det nås, hur det gör sig påmint. Rita inte om ytorna — lös var de sitter i spelet.

## Problemet
Trädet är byggt och renderar, men det är begravt. Vägen dit idag, verifierad i kod (`OrtenTab.tsx`):

> Klubb → Orten-fliken → scrolla förbi Ortskartan, Bygdens puls, Lokaltidningen, Frivilliga, Mecenater, Kommun → "🏟️ Anläggning & faciliteter" (näst sista sektionen) → knappen "Visa trädet ›" → `/game/facility`.

Fyra-fem klick och en lång scroll till den sista sektionen i en flik. Och placeringsbeslutet från 06-11 ("trädet BOR i Orten, OrtenMap-noden deep-linkar dit") byggdes bara halvvägs: OrtenMap-nodklicket gör en `scrollIntoView` till samma begravda sektion — det leder *till* knappen, inte *in i* trädet.

Det djupare problemet, varför detta är värt en egen brief och inte en knapp-flytt: **bygget är den enda fleråriga bågen spelet har.** Allt annat — portal, granska, transfers, inkorg — kretsar kring nästa match. B1 (bygget, akademin, hallen) är det enda som lever *över* säsonger. Diagnosen finns redan (BACKLOG INT-1 "de stora bågarna saknas", B2 lång-loopen). Om den bågen bor som en undersektion eller ett portal-kort blir den alltid underordnad matchrytmen. Den saknar inte en bättre knapp — den saknar en plats att vara viktig på.

## Beslutet som är fattat (Jacob 2026-06-19)
**Bygget får en egen plats i huvudnavigationen.** Inte en lyft-sektion i Orten, inte enbart portal-kort — en egen post i bottennavet. Jacob tar trångheten medvetet, av exakt skälet ovan: den icke-matchrelaterade framdriften behöver en egen scen att hända på, annars äter matchrytmen alltid upp den.

Detta är låst. Briefen ber INTE Design väga egen-flik mot alternativen — det valet är gjort. Briefen ber Design lösa *hur* det görs väl.

## Vad Design ska tänka igenom (det är därför detta går till dig)
Detta är navigations- och IA-omdöme — din lott, inte Opus prosa. Förslag, inte bara utförande:

1. **Sex flikar i ett nav byggt för fem.** Bottennavet har idag Hem / Trupp / Match / Tabell / Klubb (+ Transfers kontextuellt). En sjätte post gör navet trångt på mobil. Hur löses det? Möjliga riktningar (dina att väga, inte mina att låsa): bygget ersätter Klubb och absorberar dess innehåll · Klubb och bygget slås ihop under en hierarki · navet bantas på annat sätt · någon post blir kontextuell. Jacob lutar åt en genuint egen flik även om det blir trångt — men *hur* trångheten hanteras är ditt förslag.

2. **Vad händer med Klubb/Orten när bygget flyttar ut?** Trädet bor idag i Ortens "Anläggning & faciliteter"-sektion. Flyttar bygget till egen flik — vad blir kvar i Orten, och tappar Orten sin tyngd, eller vinner den fokus? Anläggning/ungdom/faciliteter-raderna, OrtenMap-arena-noden, det aktiva byggets status — vart tar de vägen?

3. **Valet som scen, inte sektion.** PreSeason-"Valet" (mockens yta 2) är domän-utan-yta idag — `getPreSeasonChoices()` finns men ingen scen renderar den. Den ska triggas som ett ceremoniellt avbrott vid säsongsstart (den typografiska scenen är redan specad som tredje ceremoninivån). Hur haka in den i säsongsstartsflödet så spelaren *möter* den, inte letar upp den? Och hur förhåller den sig till den nya fliken — är fliken där valet sen lever?

4. **Hur bygget gör sig påmint utan att flytta dit.** Jacobs egen instinkt, och den är rätt: en egen flik ensam riskerar bli en plats man besöker en gång och glömmer. Portalen är där spelaren faktiskt är varje omgång. När något händer i bygget — en nod blir klar, en blir möjlig, hallen-prövningen tar ett steg — ska det yttra sig som ett lågmält beat på portalen som *pekar in i fliken*. Inte hela trädet på portalen; bara knuffen ("Östra läktaren står klar nästa omgång ›"). Hur ser det beatet ut, hur ofta, och hur undviker det att bli brus? (Korsa mot KF3/beslutsbudget — portalen får inte överlastas.)

## Råmaterial (finns redan — bygg på det, rita inte om)
- **Ytornas utseende:** `DESIGN-BRIEF-B1-KLUBBUTVECKLING-YTOR-2026-06-11.md` + mock `docs/mockups/2026-06-11_design_b1_klubbutveckling.html`. Träd (betrakta-läge), Valet (välj-läge, typografisk scen), gaffel (matchhall-prövning). Konsekvensraden (publik · ekonomi · ungdom · själ) är den bärande konventionen.
- **Strävan, låst 2026-06-10:** hålla det riktiga utomhusspelet vid liv — full läktare, akademi, klubben består som sig själv. Hallen = laddad gaffel, ALDRIG mål. Konstis = baseline. Inte FM:s jakt på glans.
- **Byggstatus i kod (vad som faktiskt finns):** trädet = byggt + renderar (`FacilityScreen` / `FacilityTree`). Valet = domän utan yta. Gaffeln = `hallDebateData.ts` halvbyggd, vägvals-dramat ej byggt. (Se BACKLOG "BYGGT MEN OSYNLIGT".)
- **Tidigare placeringsbeslut (06-11, delvis byggt):** "TVÅ ingångar, ETT träd" — Orten = betrakta, PreSeason = välj, samma komponent i två lägen. Det beslutet kan stå kvar, byggas vidare, eller revideras av den nya flik-riktningen — din bedömning.

## Två öppna frågor som hör ihop (ur 06-11-mockens not, obesvarade)
Inte navigeringsfrågor, men de bör lösas innan ytorna byggs klart, och de är dina att väga eller flagga:
- **"Själ" som dimensionsnamn i konsekvensraden** — rätt ord, eller "Orten"? Beror på vad datamodellen faktiskt mäter (klack-mood? Bygdens puls?). Opus kan avgöra mot datamodellen om du flaggar.
- **Gaffelns röster** — mocken har klackledaren + kassören. Ska patron/kommunen få röst i senare processteg (förankring → krav → kommun → bygge)?

## Vad detta INTE är
- Inte en omritning av de tre ytorna — de är specade. Detta är var de bor och hur de nås.
- Inte en låsning av navlösningen — Design föreslår hur sex flikar ryms, Jacob ratificerar.
- Inte en utbyggnad av portalen till en andra bygg-yta — portalen *pekar in*, den blir inte trädet.
- Inte en tutorial. Bygget ska göra sig påmint som klubbliv, inte som en feature-prompt.
