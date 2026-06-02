# CODE-uppdrag: Verifiera minute-konventionen i Bandygrytan

**Skapad:** 2026-05-31
**Beställare:** Jacob (Opus)
**Sekretess:** Intern verifiering, output kan delas internt.
**Tidsbudget:** 30–60 minuter. Fail-fast om något oväntat.

---

## Bakgrund

Vi har upptäckt att tolkningen av "fönster 51–55" i `analyze_comeback.py` är oklar. Code:s egen docstring säger "rådata 51–55 = finding 96–100" men sedan att "rådata 46–90+ = 2:a halvlek", vilket är två inkompatibla påståenden. Inget i ANALYS_MATCHMONSTER.md har "96–100"-buckets.

Innan finding 051 publiceras eller används vidare behöver vi veta exakt vad minute betyder i datan.

---

## Vad som ska verifieras

**Hur hanterar Bandygrytan halvlek-gränsen i minute-fältet?**

Hypotes A: Minut 1–45 = 1H (eventuell tilläggstid loggas separat). Minut 46–90 = 2H. Minute 90+ = förlängning. Tröskeln vid 45/46 är skarp.

Hypotes B: Minute räknas kontinuerligt på matchklockan inklusive 1H-tilläggstid. Halvtidsbrytpunkten kan inträffa vid minut 45, 46, 47 beroende på matchens flöde. Events mellan minut 45 och halvtid är tilläggstid 1H, inte tidig 2H.

Hypotes C: Något annat — t.ex. att Bandygrytan loggar tilläggstid med en separat flagga som finns i rådatan men inte i bandygrytan_detailed.json.

---

## Konkret att göra

**Steg 1 — Hämta rå-events för ett urval matcher**

Använd Firebase-anrop mot `preCache/getFixtureEvents/{matchId}` (eller motsvarande path där events ligger — se befintliga scrapers för rätt path). Plocka 50–100 matcher fördelat över alla säsonger.

För varje match, hämta alla events och titta specifikt på:
- Event type 13 (Halvtid) — vid vilken minute inträffar den?
- Event type 14 (Andra halvlek start) — vid vilken minute inträffar den?
- Event type 12 (Matchstart) — vid vilken minute? (Bör vara 0 eller 1.)
- Event type 16 (Matchslut) — vid vilken minute?

**Steg 2 — Distribution-rapport**

Beräkna och redovisa:
- Distribution av minute för event 13 över alla samplade matcher (median, IQR, min, max)
- Distribution av minute för event 14
- Skillnad mellan event 13 och event 14 (är de alltid samma minute, eller skiljer det sig?)
- Antal events typ 1, 2, 3 (hörna, mål, utvisning) som har minute ∈ [46, 50] men som ligger FÖRE event 13 i tidsstämpel-ordning i raw-strömmen. Dessa är 1H-tilläggstid felklassificerade som 2H.

**Steg 3 — Slutsats om Code:s nuvarande klassificering**

Baserat på distributionerna, avgör:
- Är `minute >= 46 ⇒ 2H` en korrekt regel? (Hypotes A.)
- Eller behöver vi använda relativ position till event 13/14 för att bestämma halvlek? (Hypotes B eller C.)
- Hur många events i den befintliga `goals[]`/`fouls[]`-arrayen i bandygrytan_detailed.json är felklassificerade om Hypotes A inte håller?

**Steg 4 — Om finding 051 är påverkad**

Om Hypotes A håller (minute 46+ är alltid 2H), så är finding 051 korrekt som "post-paus-reset" och behöver bara omtitlas och omformuleras.

Om Hypotes B eller C håller, kör om analyze_comeback.py med korrekt halvlek-klassificering. Rapportera hur fyndet ändras:
- Är 27.5%-rate fortfarande över baseline?
- Är +1-HT-margin fortfarande utlösaren?
- Står 39.5%-talet för "+1 + reducering i fönstret" kvar?

Om fyndet faller bort eller försvagas dramatiskt — säg det rakt. Tystnad är bättre än att tvinga ett fynd som inte håller.

---

## Output

`docs/data/INTERNAL_MINUTE_CONVENTION.md` med:

1. Sammanfattning på 5 rader: vilken hypotes håller, vad det betyder för Finding 051
2. Distribution av event 13 och event 14 minute-värden
3. Antal felklassificerade events i nuvarande bandygrytan_detailed.json (om någon)
4. Justerad version av Finding 051:s siffror (om fyndet hålls)
5. Rekommendation: behöver bandygrytan_detailed.json re-scrapas med half-flaggor?

Också: uppdatera docstring i `analyze_comeback.py` så den inte längre refererar till "96–100" om den inte är korrekt.

---

## Vad Code INTE ska göra

- Inte börja om analyser i bredare omfattning innan vi har resultatet av verifieringen
- Inte uppdatera finding 051 i Bandy Brain förrän vi vet vad fyndet faktiskt är
- Inte gå tillbaka och re-scrape hela datasettet utan att fråga Jacob först

---

## Rapporteringsrytm

Rapportera så snart Steg 1–2 är klara, även om Steg 3–4 tar längre tid. Vi behöver veta hypotes-svaret snabbt, finding-justeringen kan komma efter.

Stoppa direkt om något oväntat dyker upp — typ att events typ 13/14 inte finns i den path Code försöker, eller om en stor andel matcher saknar halvtidsmarkör i rådatan.
