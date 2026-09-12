# DOM — PATRON/MECENAT: låst system, öppna rader är städning (inte design)

**Datum:** 2026-09-02 · **Av:** Opus · **Utlöst av:** MASTER-inventeringens `mecenatrapport-tre-designfragor` / `mecenat-patron-modellform` / `cs-patron-sannolikhetsrullning` — som SÅG ut som ett öppet arkitekturval (två parallella system, konsolidera?). Kanonläsning visar: det är det inte.

## Kanon (läst, inte gissad)

`docs/archive/completed-june/CODE-LEVERANS-PATRON-MECENAT-2026-06-09.md` + `-FAS2-2026-06-09.md`:

**Beslut LÅST med Jacob 2026-06-09: differentiera, INTE konsolidera.** Patronen = den dolda grundpelaren (Karl-Hedin-för-Leksand-arketypen), knuten till era-bågen — survival har ingen, storhetstid har sin Hedin. Mecenaterna = de synliga lokala välgörarna. Det finns grundliga karaktärsbeskrivningar (Jacob: "IT-entreprenören som vänt hem, proffset som gillar bandy men inte skyltar").

**Bägge faserna är IMPLEMENTERADE** (Fas 1: commit `b74f8d5`; Fas 2: commit `8b2beed`). De fem mekaniska skiljelinjerna (insats som dvärgar mecenaterna / dold från OrtenMap / tunga personliga krav / kris vid uttåg / en patron vs flera mecenater) är byggda. Anskaffnings-bågen (`PATRON_EMERGE_CS=60`, förtjänad ej köpt), den dolda gestaltningen (av kartan, surfas via events/ekonomi/styrelse), uttågs-krisen (`patronWithdrawalService`) — allt finns.

## Domen — INGET designbeslut väntar

Patron är INTE gammal skuld att retirera (mitt felaktiga första förslag — hade raderat en låst, byggd karaktär). Patron är INTE ett halvfärdigt system att fullfölja. Det är ett **färdigbyggt, differentierat, låst system.** De tre MASTER-raderna som såg ut som "designfrågor" är i själva verket ÖPPEN STÄDNING + KALIBRERING, uttryckligen flaggade i leveransdokumenten:

1. **`patron-data bäddas som `sponsorData`-JSON i emergence-eventet`** (Fas 2-dokumentets egen "ÖPPEN STÄDNING"-not): cross-system-namn, döp om payload-fältet till neutralt. Ren teknisk skuld, ingen design. → **Code.**
2. **`cs-patron-sannolikhetsrullning`**: anskaffnings-checkens sannolikhet kring `PATRON_EMERGE_CS`-tröskeln. Kalibrering (hur ofta en patron kliver fram vid CS ≥ 60), inte ett vägval. → mätning + ev. Jacob-tuning, inte en dom.
3. **`mecenat-patron-cs-happiness`**: hur patron-happiness kopplas till CS. Verifiera mot Fas 1:s plumbing-separation (en mecenat-interaktion får aldrig röra patron-state) — sannolikt en verifieringsrad, inte design. → **Code verifierar.**

## PATRON → LIGGAREN (Jacob 2026-09-02: systemet finns men når inte kanon)

Jacob fångade det domen först missade: patron-systemet är byggt (2026-06-09, före händelseliggaren) — så dess HÄNDELSER skrivs till patron-state + egna events, ALDRIG till `eventLedger`. Patron kliver fram (anskaffnings-bågen), ställer sina tunga krav, drar sig ur i kris — allt är händelser i klubbens historia som årsboken och karriärhistoriken aldrig får se. Samma trestegs-brist som burnout: lagras (ja, i patron-state), men når inte de ytor som borde minnas. Patron-bågen — den dolda makten som håller klubben, en av de mest laddade — lever i sin egen ficka.

**Det är Fas 4+-mönstret (recentMoments/ripple-chains), en yta till.** Wira patron-händelserna till liggaren som `EventLedgerEntry`-poster:
- **`patron_emerge`** — grundpelaren kliver fram (CS ≥ 60, era-omräkning). En stor, positiv händelse. Ny `EventLedgerType`-medlem (om ingen passar — stanna, flagga). subject = patronen. significance HÖG.
- **`mecenat_withdrawal` finns redan** (ripple-migreringen) — men patronens UTTÅG är en egen, tyngre sak (`patronWithdrawal`-krisevent). Egen `patron_withdrawal`-liggarpost, subject = patronen, significance mycket hög (fundamentet knakar).
- **Patron-kraven** (nepotism/styrelseplats) — om de bär substans värd att minnas, egen post; annars låt vara. Bedöm per krav.

Då kan årsbokens managersektion + karriärhistoriken berätta grundpelarens båge: "Den säsongen klev {namn} fram" / "Grundpelaren drog sig ur — klubben stod ensam." Ingen ny per-instans-text krävs först (posterna är strukturella); vy-mallar om en yta ska rendera dem → Opus, samma som Moment-mallarna.

**Detta ÄR en öppen punkt, till skillnad från städraderna** — och den missades för att domen svarade på ARKITEKTURfrågan (finns patron?) och inte KONSUMTIONSfrågan (når patron liggaren?). Två olika frågor.

## SKYDDAT
- **Radera INGENTING i patron-systemet.** Det är byggt mot en låst designavsikt med karaktärsbeskrivningar. Att "konsolidera bort" patron vore `d0d4d923`-läxan på en hel karaktär. Differentieringen ÄR poängen.
- **De två leveransdokumenten är kanon.** Framtida frågor om patron-vs-mecenat besvaras DÄR, inte genom att läsa koden framåt och gissa avsikt.

## Lärdomen (egen, skriven rakt)
Jag föreslog först A (retirera patron), sedan "fullfölj planen", innan kanonläsningen visade att systemet är LÅST och BYGGT. Tre fel i rad, samma rot: jag läste koden framåt (vad finns nu) i stället för kanon bakåt (vad beslutades och byggdes). Koden visar vad som ÄR, aldrig vad som var MENAT. En modell som ser ut som "två system som gör samma sak" kan vara en medveten differentiering man inte förstår förrän man läst designbeslutet. **Läs kanon före du dömer arkitektur — särskilt när något ser ut som skuld.** Jacobs "vi skrev en massa dokument om det i början" var räddningen; den borde varit min första fråga, inte hans påminnelse.

## ÄGARSKAP
Code: (1) döp om `sponsorData`-payloaden i emergence-eventet till ett neutralt fält, (2) verifiera Fas 1:s plumbing-separation håller (mecenat-interaktion rör aldrig patron-state), (3) `cs-patron-happiness`-kopplingen mot CS. Alla tre är städning/verifiering mot de låsta leveransdokumenten. Jacob: INGET beslut väntar — differentieringen är låst sedan 2026-06-09. Sannolikhets-kalibreringen (hur ofta patron kliver fram) kan tunas efter mätning om den känns fel, men det är en känslo-kall, inte ett arkitekturval.
