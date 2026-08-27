# DOM — ILLUSTRATIONERNA

**Datum:** 2026-08-18 · **Av:** Opus
**Bakgrund:** ett tidigare försök gjorde en illustration per ort (tolv stycken). Resultatet blev hockeyrinkar, och alla tolv såg likadana ut. Spåret har legat i dvala sedan dess.

---

## Vad som gick fel — två separata fel

**Hockeyrinkarna är ett datafel, inte ett promptfel.** Bildmodeller har sett hundratusentals hockeyrinkar och nästan inga bandyplaner. Ber man om "bandy" får man hockey med fel utrustning. Det går inte att adjektivera bort — bara att beskriva geometriskt, eller att undvika planen helt.

**Att allt såg likadant ut är ett uppdragsfel.** Tolv orter beskrivna som "bandyort i Sverige" är samma prompt tolv gånger. Skillnaden mellan Slagghögen och Norra Barkens strand finns inte i ordet bandy.

---

## Domen: tre ögonblick, inte tolv orter

`IllustrationScene`s egen kommentar säger redan vad ytan är till för: **ögonblick** — ankomst, säsongsstart, ceremoni, final, seger, kris. Aldrig bakom vardagsflöde; korten äger vardagen.

Orten är fel enhet. Ett ögonblick har en känsla som går att rita; en ort har bara ett namn.

**Tre bilder:**

| Namn | Läge | Ögonblick |
|---|---|---|
| `intro` | `fullbleed` | Ankomsten. Kvällen du kommer till klubben första gången |
| `annandagen` | `band` | Annandagsbandy. Årets mest folkliga match |
| `final` | `header` | Finalhelgen. Det stora |

Tre är en mängd som går att få rätt. Tolv var det inte.

---

## Kompositionsregeln — den viktigaste tekniska begränsningen

Bilderna ligger under scrims som är kraftigare än man tror.

**`fullbleed`:** 390×720 (`aspectRatio: '390 / 720'`). Övre 22 % ligger under `rgba(12,14,20,0.55)`. **Nedre 62 % går från transparent till 0,92 svart.** Text ligger nederst.

Alltså: **motivet måste sitta i den övre halvans mitt, ungefär 25–50 % ned.** Det som hamnar i nedre tredjedelen försvinner helt. En bild komponerad med horisonten i mitten och något viktigt i förgrunden blir en svart yta med en ljus rand.

**`band`:** 50 % höjd, `objectPosition: center 30%` — bilden beskärs runt sin övre tredjedel. Komponera för det.

**`header`:** 200 px, `center 40%`, fade uppifrån och nedifrån. Nästan en remsa. Ett stämningsutsnitt, inte en scen.

**Praktiskt:** be om bilder i **9:16 stående** för `fullbleed`, och komponera så att nedre tredjedelen är mörk, tom eller oviktig. Det är inte en begränsning — det är en gratis gradient som gör texten läsbar.

---

## Undvik planen

Klubbtexterna handlar nästan aldrig om isen. Marianne talar om två kaffekoppar på bordet. Kjell om att banan varit konstfrusen sedan trettiofem. Gagnef om en farmor som knypplade spetsar.

**Bandyn finns i texten. Bilden kan vara platsen runt omkring.** En värmestuga i mörker, en kiosk med korvrök i strålkastarsken, ett klubbhus med lampan tänd mot snö.

Det löser hockeyrink-problemet vid roten: modellen får aldrig chansen.

**Undantag:** `annandagen` mår sannolikt bra av folk och läktare. Även då — publiken bakifrån, planen som ett suddigt ljus bortom. Inte planen som motiv.

**Om en plan ändå måste synas:** en bandyplan är 65×110 meter, alltså större än en fotbollsplan. Ingen sarg — låga stakethinder. Målen är låga och breda. Skriv det, annars får du en rink.

---

## Stilsträngen

Återanvänds **oförändrad** i alla tre. Konsekvens kommer av identisk stilsträng och fast seed, inte av bättre beskrivningar.

> Muted painterly illustration, limited palette: deep navy-black, cold pale ice blue, warm copper light sources. Heavy atmosphere, visible grain, soft edges. No text, no logos, no people's faces in focus. Nordic winter dusk. Editorial poster feel, not photorealism.

Skälet till att den inte är fotorealistisk: spelet har Georgia, mörk koppar och en typografisk identitet. Fotorealism skulle se ut som en främmande komponent — och tolv fotorealistiska bilder är dessutom omöjliga att hålla konsekventa.

---

## De tre prompterna

Kör i **Gemini** (Nano Banana). Bäst av de tillgängliga på stilkonsekvens mellan bilder, vilket är precis det som fallerade. **Fast seed, samma seed för alla tre.**

### `intro` — fullbleed, 9:16

> A small wooden clubhouse at the edge of a frozen field on a winter evening in rural Sweden. One warm lamp lit above the door, light spilling onto packed snow. Bare birch trees at the left. Distant floodlight poles, unlit. The lower third of the image is empty snow in deep shadow. Nobody visible. [STILSTRÄNG]

Bottenskuggan är avsiktlig — där ligger texten.

### `annandagen` — band, 16:9 eller 3:2

> Spectators seen from behind, standing along a low fence in winter clothing, breath visible in cold air. Warm light from a kiosk at the right edge, steam rising. Beyond the crowd, a bright blur of floodlit ice, out of focus. Late afternoon, blue hour. [STILSTRÄNG]

Publiken bakifrån gör två saker: inga ansikten att få fel, och planen förblir en ljusfläck.

### `final` — header, mycket vid beskärning

> An arena roof structure seen from below against a dark winter sky, floodlights burning through falling snow. Cold blue light, warm copper flare at the edges. Architectural, almost abstract. No crowd, no ice visible. [STILSTRÄNG]

Nästan abstrakt, eftersom ytan bara är 200 px hög. Ett stämningsutsnitt.

---

## Arbetsordning

**En bild först, inte tre.** Ta `intro`. Tolv dåliga bilder var inte mer information än en — det var samma fel dokumenterat tolv gånger.

Kör `intro` med och utan synlig plan om du vill pröva min tes. Min gissning är att den utan är tydligt bättre; blir den inte det är det värt att veta.

När `intro` är rätt: **spara seed och stilsträng oförändrade**, kör de andra två. Ändra bara motivbeskrivningen.

**Lägg bilden i `public/assets/illustrations/intro.jpg` och titta på den i appen.** Scrimen ändrar allt — en bild som är fin i en filvisare kan vara oläslig under 62 % gradient, och tvärtom.

---

## Kvar att bestämma efter första bilden

Om `intro` fortfarande blir generisk trots allt detta är nästa steg inte en bättre prompt utan en annan metod: en illustratör för tre bilder, eller att `IllustrationPlaceholder` blir den permanenta lösningen.

**Platshållaren är inte ett misslyckande.** Den är byggd med avsikt — is-antydan, plan-båge, scen-palett — och Designs egen kommentar säger att den ska läsa som "scenen är riggad, bilden kommer". Raden `illustration på väg` är däremot en intern platshållartext som inte ska nå en extern testare (`Å`-listans post om samma sak). Tas den bort fungerar fonden som den är.

**Ingen audit har efterlyst illustrationer.** Tolv dygns granskning, fyra testare, och ingen skrev att spelet kändes fattigt utan bilder. Det som lyftes som stämningsbärande var texten, årsboken, personerna och den mörka kopparidentiteten.

Det gör illustrationerna till ett plus, inte en brist — och betyder att de kan ta den tid de behöver.
