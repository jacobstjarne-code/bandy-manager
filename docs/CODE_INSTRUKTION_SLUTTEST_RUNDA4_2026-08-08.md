# CODE-INSTRUKTION — SLUTTEST, RUNDA 4

**Datum:** 2026-08-08 · **Av:** Opus (chat) · **Föregående:** RUNDA 3 (alla fem punkter stängda, `eaf8cdfd` / `ef225005` / `fecc4e90`)

Tre domar som låg hos mig. All text nedan är färdig — skriv inte om den, placera den.

---

## 1. Neutral plans publik (2a) — CUP_FINAL_VENUE får egen data

**Rotorsak (din spårning):** `calcAttendance` och `hallInomhus` läser alltid bracket-klubbens arenadata. På finalhelgen spelas matchen i Bollnäs, men publiksiffran räknas som om den spelades hemma hos det lag som råkar stå som `homeClubId`.

**Dom:** ge `CUP_FINAL_VENUE` egen arenadata i `specialDateStrings.ts` — `capacity: 7000` och `hallInomhus: false`. Talet är ett spelvärde, inte ett påstående om den verkliga arenan; det ska vara märkbart större än seriens småstadsarenor så finalhelgen känns som en större scen.

**Regel för publiken på finalhelgen:** båda lagens dragningskraft räknas, inte bara det ena. Summera de två klubbarnas publikunderlag, lägg på en neutral-evenemangsfaktor (finalhelgen drar folk som inte följer något av lagen), och kapa mot `CUP_FINAL_VENUE.capacity`. Klackeffekten ska halveras för båda lagen i stället för att ges full till "hemmalaget" — ingen har sin läktare i Bollnäs.

Samma villkor som punkt 1 i RUNDA 3: läs `isNeutralVenue`, inte `isCupFinalhelgen`. Publiken är mekanik.

**Rapportera** vilken faktor du landar på för neutral-evenemangsdelen innan commit — jag vill se att en cupfinal mellan två små klubbar inte fyller 7 000, och att den mellan två stora inte stannar på 900.

---

## 2. Arenaraden i Granska (2b)

Efter punkt 1:s fix visar Granska ingen arenarad alls för semi och final. Regeln: läs `fixture.arenaName` när den finns, annars hemmaklubbens arena. När både `arenaName` och `venueCity` finns är raden:

```
Spelades på Sävstaås IP i Bollnäs
```

Alltså mönstret `Spelades på {arenaName} i {venueCity}` när staden finns, och det befintliga `Spelades på {arenaName}` när den inte gör det.

---

## 3. Vädret syns inte i snabbläget — det här är den viktiga

Dina tre tal svarade på frågan: mekaniken biter (naturis 30,8 % matcher över noll, 52 % av dem Poor/Moderate) och texten finns (9,3 is-rader per match i live-läge). Men `mode: 'fast'` ger ingen kommentartext alls.

Det är inte en väderbugg, det är ett releaseproblem. Snabbläget är vad en testare når efter första matchen — jag valde det själv två gånger utan att tänka på det. All matchtext vi har skrivit är osynlig för den som spelar så, och vädret är bara det som råkade avslöja det.

**Bygg:** Granskas sammanfattning får en förhållanderad när vädereffekterna var aktiva, oavsett simuleringsläge. En rad, efter den befintliga resultatsammanfattningen. Texten är skriven, välj på `weather.condition`:

- `Thaw`: **Det regnade. Isen var knottrig hela matchen.**
- `HeavySnow`: **Ymnigt snöfall. Bollen dog i drivorna.**
- `LightSnow`: **Lätt snöfall över isen. Bollen gick trögare än den brukar.**
- `Fog`: **Dimman låg tät. Långt spel var ingen idé.**
- temperatur under −15 (oavsett condition): **Sträng kyla. Bollen studsade hårt och händerna domnade.**

Ingen rad när inget av detta gäller — tystnad är också information. Om två villkor är sanna samtidigt (kyla plus snöfall) vinner nederbörden.

**Rapportera efteråt** om det finns andra textlager som bara existerar i live-läget. Om svaret är ja är det en egen runda, och den ska tas före release.

---

## 4. Istaggen ljuger inte, men den tiger

Dashboardens tagg visar "Bra is" för konstfrusna klubbar även när regnet är aktivt och knotter-mekaniken biter. Kvalitetsetiketten är korrekt — anläggningen håller isen — men spelaren läser den som "inget händer".

**Ändra:** när `condition === Thaw` visar taggen ytans tillstånd i stället för anläggningens kvalitet, oavsett underlag:

```
BLÖT IS
```

Övriga conditions behåller `getIceQualityLabel` som i dag (Utmärkt is / Bra is / Godkänd is / Dålig is / Inställd). Funktionen ligger i samma modul som `getWeatherEmoji` och `getConditionLabel` — grep på `Utmärkt is`.

---

## Kvar

Tomma lineup-slots och riktig 390 px-viewport. Jacobs telefon, sista grinden.
