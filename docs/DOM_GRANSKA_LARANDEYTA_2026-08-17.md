# DOM — GRANSKA SOM LÄRANDEYTA

**Datum:** 2026-08-17 · **Av:** Opus · **Post:** O16 i `SLUTTEST_KO.md`
**Underlag:** framgångsauditen, stickiness-auditen (`condition_0`-inversionen), tvåsäsongsauditen.

---

## Fyndet

Granska svarar på **vad** som hände. Den svarar inte på **vilket av mina val som bidrog**.

Framgångsauditens formulering: Granska ska svara på varför matchen blev som den blev, vilket av mina val som faktiskt bidrog, vem som förändrades, och vad det betyder inför nästa match. I dag svarar den på det första och det tredje.

Konsekvensen är att taktik och rotation är **olärbara**. Spelaren sätter åtta dimensioner, spelar en match, får ett resultat — och kan omöjligt veta om planen fungerade eller om laget vann trots den. Efter tjugo matcher har spelaren ingen mer förståelse för systemet än efter den första.

Stickiness-auditen hittade ett belägg som gör det värre: `condition_0` visades med etiketten "trötthet", alltså noll kondition presenterad som noll trötthet (`4.8`, fixat). Och snabblägets automatiska laguttag presenterades som spelarens eget "Vilad"-beslut. **Ytan tillskrev spelaren val hen inte gjort.** Att lära sig av felaktig återkoppling är sämre än att inte lära sig alls.

---

## Domen

Granska får en sektion som kopplar **ett** av spelarens val till ett utfall i matchen. En, inte en analys.

**Ett val, inte alla åtta.** En lista över vad varje dimension bidrog med är en rapport ingen läser. En rad som säger att en sak du valde spelade roll är något spelaren tar med sig.

**Bara när kopplingen är verklig.** Kan matchmotorn inte peka på ett samband ska sektionen inte renderas. Ett påhittat orsakssamband är samma klass som "Ge honom vila" — en yta som lovar mer än domänen bär, och den här gången om spelarens egen skicklighet.

**Aldrig beröm eller tillrättavisning.** Sektionen konstaterar vad som hände, inte om valet var bra. `Högt press gav sex återvinningar på motståndarhalva` är information. `Ditt höga press fungerade` är en dom spelet inte har underlag för — laget kan ha vunnit av andra skäl.

---

## Vad som kan kopplas i dag

`getTacticModifiers` producerar redan namngivna modifierare som matar offense, defense, corner, discipline, fatigue och press genom hela `matchCore`. Kopplingen finns alltså — den räknas fram varje match och kastas.

Fyra kandidater, i ordning efter hur säker kopplingen är:

**1 · Press mot återvinningar.** `press` påverkar var bollen vinns. Räkna återvinningar på motståndarhalva och jämför mot lagets snitt.

**2 · Hörnstrategi mot hörnmål.** `cornerStrategy` går direkt in i hörnberäkningen (`matchCore:462, 675, 1195`). Ett hörnmål med den valda strategin är en ren koppling.

**3 · Tempo mot kondition sista tjugo.** `tempo` påverkar `fatigue`. Föll laget ihop i slutet, eller höll det?

**4 · Formation mot var målen kom.** `formation` går via `tacticModifiers`. Grövst av de fyra, ta den sist.

**Rapportera först:** vilka av de fyra har matchmotorn faktiskt siffror för i `MatchResult`, och vilka skulle kräva ny instrumentering? Bygg bara de som redan mäts. Ny instrumentering i matchmotorn är en egen fråga och ska inte klämmas in här.

---

## Texten

Formen är alltid densamma: **vad du valde, vad som hände.** Ingen bindestreckad slutsats.

- *Du körde högt press. Bollen vanns nio gånger på deras planhalva — sex fler än ni brukar.*
- *Du valde nära hörnor. Det gav ett mål i första halvlek.*
- *Du körde högt tempo. Laget tappade i sista tjugo — två insläppta efter minut sjuttio.*
- *Du körde lågt tempo. Laget höll ihop hela vägen.*

**När valet inte gick vägen** — samma sakliga ton:

- *Du körde högt press. Det gav ingenting den här gången, och de kom bakom er tre gånger.*
- *Du valde bortre hörnor. Ingen av de fem gick in.*

**Rubrik:** `DITT VAL`

Ingen sektion när ingen koppling finns. Tystnad är ärligare än en formulering som fyller platsen.

---

## Vad domen inte är

**Inte en taktikanalys.** Åtta dimensioner betygsatta efter varje match är en rapport, och auditerna säger redan att spelaren slutar läsa. En rad.

**Inte en rekommendation inför nästa match.** Den frågan hör till `O15`:s standardläge — vad analysen vill att du ändrar. Granska tittar bakåt.

**Inte "matchens vändpunkt".** Nyckelmoment finns redan. Detta är specifikt kopplingen mellan ett val spelaren gjorde och något som mättes.

**Inte i snabbläget utan varning.** Om `mode: 'fast'` valde laget automatiskt ska sektionen säga det, inte tillskriva spelaren uttagningen. Det är `4.8`:s andra halva, och de två hör ihop.

---

## Beroenden

**`4.8` andra halvan** — skilj spelarens val från autouttagningens. Utan den kan sektionen tillskriva spelaren beslut assistenten fattade, vilket gör den aktivt skadlig.

**`granskaSectionRegistry`** — en rad, som `KapitelPunkt`. Sektionen visas i liga, cup och slutspel; **inte** i avskedsmatchen, där ytan handlar om något annat.

**Kräver inte `O5` eller `U1`.** Kan byggas efter `4.8`.

---

## Godkänd när

En spelare kan säga en sak hen lärt sig om hur laget spelar — och peka på var i spelet hen lärde sig det.

I dag finns ingen sådan plats.
