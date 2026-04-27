# SMHI Stations-mappning för klimatdata-pipeline

**Skapad:** 2026-04-27
**Författare:** Bandy-Brain (Opus)
**Mottagare:** Erik (Python-skript)
**Status:** Föreslagen mappning — Erik verifierar tillgänglighet vid skriptkörning

---

## Syfte

Lista föreslagna SMHI-stationer per klubb för insamling av väderdata 2015-2025. Detta är en **startpunkt** — Erik verifierar tillgänglighet och datakvalitet vid första körning.

---

## Datakällor

**PTHBV (griddade dygnsvärden):**
- Endast koordinater behövs (ingen station-ID)
- Tillgängligt för temperatur (parameter 1) och nederbörd (parameter 5)
- Data från 1961
- API: `https://opendata-download-metobs.smhi.se/api/version/1.0/parameter/1/station/{id}/period/corrected-archive/data.csv`

**Punktstationer (för icke-PTHBV-parametrar):**
- Vind (parameter 4) — m/s
- Sikt (parameter 12) — meter
- Snödjup (parameter 8) — cm
- Molnighet (parameter 16) — oktal
- Fuktighet (parameter 6) — %

För dessa behövs faktisk station-ID från SMHI:s katalog.

---

## Klubbar och föreslagna stationer

Koordinaterna är från `worldGenerator.ts` CLUB_TEMPLATES (klubbarnas hemorter).

### Forsbacka (Gävleborg)
- **Lat/Lng:** 60.5894, 16.7456
- **Geografi:** Bruksort vid Storsjön, ~10 km väster om Gävle
- **Föreslagen primärstation:** Sandviken A (närmaste större ort, ~5 km)
- **Backup-stationer:** Gävle/Bromma flygplats, Hofors
- **Klimatarketyp:** `bruk_lakeside`

### Söderfors (Uppland)
- **Lat/Lng:** 60.3933, 17.2367
- **Geografi:** Ö i Dalälven, Tierps kommun
- **Föreslagen primärstation:** Tierp eller Älvkarleby
- **Backup-stationer:** Uppsala Flygplats, Forsmark
- **Klimatarketyp:** `bruk_river_island`
- **Specialnotering:** Söderfors ligger på en ö — mikroklimat påverkat av vatten runt om. PTHBV bör fungera väl här.

### Västanfors / Fagersta (Västmanland)
- **Lat/Lng:** 59.9744, 15.7972
- **Geografi:** Bergslagen, Västmanland
- **Föreslagen primärstation:** Fagersta
- **Backup-stationer:** Avesta, Sala, Borlänge
- **Klimatarketyp:** `bruk_lakeside`

### Karlsborg (Norrbotten — INTE Karlsborg/Vättern)
- **Lat/Lng:** 65.7944, 23.2667
- **Geografi:** Karlsborgsverken vid Kalixälvens mynning, Bottenviken
- **Föreslagen primärstation:** Kalix eller Haparanda (Lapland)
- **Backup-stationer:** Luleå Flygplats, Övertorneå
- **Klimatarketyp:** `arctic_coast`
- **Specialnotering:** Detta är **inte** Karlsborg vid Vättern. Klubben är i Norrbotten — extrem köld, snödjup 50+ cm vanligt.

### Målilla (Småland)
- **Lat/Lng:** 57.3856, 15.7956
- **Geografi:** Småländska höglandet, "temperaturhuvudstaden"
- **Föreslagen primärstation:** Vimmerby eller Hultsfred
- **Backup-stationer:** Oskarshamn, Kalmar Flygplats
- **Klimatarketyp:** `sm_highland_extreme`
- **Specialnotering:** Målilla är dokumenterat ortsamhälle med mycket extrema temperaturutsving (rekord +38°C 1947 och -33.8°C). 15 m termometer på torget. Vi vill ha **stor variation** i datan här.

### Gagnef (Dalarna)
- **Lat/Lng:** 60.5739, 15.0428
- **Geografi:** Älvdalsens sammanlöp i Dalarna
- **Föreslagen primärstation:** Borlänge eller Mora
- **Backup-stationer:** Falun, Vansbro
- **Klimatarketyp:** `valley_inland`

### Hälleforsnäs (Södermanland)
- **Lat/Lng:** 59.1517, 16.5256
- **Geografi:** Bruksort i Flens kommun
- **Föreslagen primärstation:** Eskilstuna eller Katrineholm
- **Backup-stationer:** Nyköping, Strängnäs
- **Klimatarketyp:** `bruk_lakeside`

### Lesjöfors (Värmland)
- **Lat/Lng:** 59.9944, 14.1817
- **Geografi:** Filipstads kommun, dokumenterat **köldhål**
- **Föreslagen primärstation:** Filipstad
- **Backup-stationer:** Karlskoga, Kristinehamn, Hagfors
- **Klimatarketyp:** `valley_coldpit`
- **Specialnotering:** "Köldhål" är dokumenterat ortsamhälle. Klassisk inversionsgeografi i dalgång. Datan **bör** visa kallare värden än omgivande stationer — verifiera detta som sanity check.

### Rögle (Skåne)
- **Lat/Lng:** 56.2400, 12.8800
- **Geografi:** Ängelholm-trakten, Skånes nordvästkust
- **Föreslagen primärstation:** Ängelholm/Helsingborg Flygplats
- **Backup-stationer:** Helsingborg, Halmstad
- **Klimatarketyp:** `scanian_coast`
- **Specialnotering:** Mildast i ligan. Januari-medel ~+1°C. Få snödagar.

### Slottsbron (Värmland)
- **Lat/Lng:** 59.3217, 13.1136
- **Geografi:** Vid Vänern, Grums kommun
- **Föreslagen primärstation:** Karlstad Flygplats eller Säffle
- **Backup-stationer:** Lidköping, Kil
- **Klimatarketyp:** `vanern_effect`
- **Specialnotering:** Vänern-effekten gör att istäcket kommer sent. Dimma vanlig på sensommaren och tidig vinter. Vi vill se hög `fogProb` här.

### Skutskär (Uppland)
- **Lat/Lng:** 60.6219, 17.4111
- **Geografi:** Bottenhavet, Älvkarleby kommun
- **Föreslagen primärstation:** Gävle/Bromma eller Älvkarleby
- **Backup-stationer:** Forsmark, Tierp
- **Klimatarketyp:** `gulf_coast`

### Heros (Dalarna)
- **Lat/Lng:** 60.1392, 15.4111
- **Geografi:** Smedjebacken
- **Föreslagen primärstation:** Borlänge eller Ludvika
- **Backup-stationer:** Falun, Avesta
- **Klimatarketyp:** `bruk_lakeside`
- **Notering:** Smedjebacken har själv en SMHI-station (om data tillgänglig). Använd den i första hand om så.

---

## Fallback-strategi

Om primärstationen inte har komplett data 2015-2025 för en parameter:

1. **PTHBV-fallback:** För temperatur och nederbörd, använd alltid PTHBV på klubbens koordinat — punktstationer behövs bara för vind/sikt/snödjup
2. **Närmaste backup-station:** Om primär saknar vind-data, ta från backup #1
3. **Regional snitt:** Om alla stationer i regionen saknar en parameter, beräkna regionalt medel från KLUBBFAKTA-koordinater

Ingen klubb ska ha "data saknas" i slutprodukten. Alla 12 klubbar ska ha kompletta `matchDayClimate`-statistikfält.

---

## Verifierings-checklista (för Erik)

Innan slutkörning, verifiera att datan är **statistiskt rimlig**:

- [ ] **Karlsborg ska vara kallare än Rögle** (jan-medel ~−10°C vs ~+1°C)
- [ ] **Lesjöfors ska vara kallare än Filipstad** (köldhål-effekt — kanske 1-2°C lägre på kalla nätter)
- [ ] **Slottsbron ska ha högre `fogProb` än Forsbacka** (Vänern-effekten)
- [ ] **Målilla ska ha högre `tempStdDev` än andra klubbar** (extremitet)
- [ ] **Snödjup ska öka norrut** (Karlsborg > Forsbacka > Rögle)
- [ ] **Inga klubbar har `tempMean` < −20°C för någon matchday** (om så, fel i pollning)
- [ ] **Inga klubbar har `snowfallProb` > 0.6** (för hög, sannolikt fel)

Om någon av dessa fallerar — verifiera datakällan och stationsval innan vi accepterar output.

---

## Output-format

Levereras till `data/climateProfiles.json` enligt struktur i SPEC_VADER §6.1 och §7 (Output-fil-sektionen).

Plus en separat `data/climateProfiles_raw.json` med raw dygnsvärden om vi vill kunna omberäkna aggregeringar i framtiden utan att köra om SMHI-pollningen.

---

## Frågor till Erik

1. Har du tillgång till SMHI:s API utan rate limiting? (12 klubbar × 5-7 parametrar × 10 år är ganska mycket data)
2. Föredrar du att leverera precomputed aggregeringar (mindre fil) eller raw dygnsvärden (mer flexibilitet)?
3. Kan du köra sanity-checklistan ovan och flagga avvikelser innan vi accepterar output?

---

## Referenser

- KLUBBFAKTA.md — full geografisk + historisk kontext per klubb
- SPEC_VADER.md §3.1 — pollningsmönster och aggregerings-strategi
- SPEC_VADER.md §7 — datainsamling-arkitektur
- SMHI Open Data: https://opendata-download-metobs.smhi.se/api/
- SMHI parameterlista: https://opendata.smhi.se/apidocs/metobs/parameter.html

---

## Slut SMHI_STATIONS.md
