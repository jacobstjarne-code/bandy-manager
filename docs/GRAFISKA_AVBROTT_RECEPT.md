# Grafiska avbrott — recept + två första situationer

**Datum:** 2026-05-21
**Av:** Opus, efter Jacobs idé om fler visuella toppar utöver intro
**Status:** Designunderlag för Jacob + Erik. Inte spec till Code än — bildbehovet
styr takten, och bilderna är Eriks insats.
**Uppdaterat 2026-05-21:** Annandagsbilden godkänd. Perspektiv-principen satt (§0.5).

---

## 0.5 · Perspektiv som grammatik (satt 2026-05-21)

Eriks annandagsbild gick en annan väg än briefens läktarnära kamera — och den
vägen är starkare. Fågelperspektiv: hela orten med bandyplanen som självklart
centrum, husen och skogen och sjön runt om, folk som strömmar till från alla håll.
Den säger spelets kärna i en bild: klubben är orten, planen är dit bygden samlas.
“Bygdens puls” som motiv.

**Principen:** perspektivet bär berättarläge.

- **Fågelvy = världens röst.** Orten, säsongen, de stora gemensamma stunderna
  ovanifrån. Matcher och stora händelser. Spelaren är del av något större. **Detta
  är den satta riktningen för grafiska avbrott nu.**
- **Närbild = klubbens/individens röst.** Spelaren, ett porträtt, ett beslut, på
  ögonhöjd. **Noterat som ALTERNATIV, ej beslutat.** Om en hel scen ska gå nära är
  det ett större identitetsval — ska spelet vara klubbens berättelse eller också
  individens? Hör ihop med GPT:s fråga om manager-som-karaktär. Beslutas senare.

Detta rimmar med synlighetsprincipen: världen reagerar (fågelvy) kontra dina val
och spelare (närbild). Avbrotten blir visuell grammatik, inte dekoration — när
bilden zoomar ut talar säsongen, när den går nära talar din klubb.

**Textplacering:** fågelvy-bilderna är ljusa och detaljrika i mitten och nedåt
där scen-text annars ligger. Utnyttja den lugna mörkblå himlen UPPTILL som
textplatta, eller en kraftigare gradient-overlay än introns (som går till 0.7 —
dessa kan behöva mer). Justering i `SceneBackdrop`, inte i bilden.

---

## 0 · Principen bakom valet

Intro-illustrationen sätter en ton spelet sedan tappar. Fler grafiska avbrott
ger säsongen visuell rytm — men bara om de markerar ögonblick som *redan betyder
något i spelvärlden*. En vacker bild på en godtycklig match lär spelaren
ingenting. En bild på annandagsbandy förstärker en struktur spelaren ska känna.

Knapphet är poängen. Får varje derby helsides-grafik slits effekten ut. Bilderna
är dessutom den knappa resursen — kod-receptet är nästan gratis att återanvända,
illustrationen är Eriks arbete. Det är en hälsosam broms: antalet avbrott styrs
av hur många bilder Erik hinner, inte av kod.

---

## 1 · Receptet (återanvänt från IntroSequence)

Intro fungerar så här, och mönstret kan lyftas rakt av till scenerna (som idag
är text-på-färgbakgrund, `var(--bg-scene)`, utan bild):

**Lager underifrån:**
1. **Helskärmsbild** — `background-size: cover`, `background-position: center top`.
2. **Mörk gradient-overlay** — uppifrån mörkare nedåt, så texten blir läsbar.
   Intro: `rgba(14,13,11, 0.3 → 0.5 → 0.7)`.
3. **Stämningslager (valfritt, lågmält)** — snöpartiklar, strålkastar-glow via
   radial-gradient. Får aldrig konkurrera med texten.
4. **Text i Georgia-kursiv**, staggad in med opacity-transitions. Befintlig
   scen-text återanvänds — bilden ersätter inte orden, den bär dem.

**Kontextmedvetet:** scenerna får redan `game`. Bilden kan därförväljas efter
läge — rival i final ≠ neutral final, ditt lags arena ≠ motståndarens. Bilden ska
*veta* sin situation, precis som åskådar-finalen vet om din rival spelar.

**Teknisk återanvändning:** IntroSequence-bildlagret (bild + overlay + glow) bryts
ut till en delad `SceneBackdrop`-komponent som scenerna wrappar sin text i. Lågrisk,
rör inte texten eller beats-logiken.

---

## 2 · Situation A — SM-finalen (prestationens topp)

**När:** tredje lördagen i mars, alltid Studenternas IP, Uppsala. Säsongens
slutpunkt. Befintlig scen: `FinalIntroScreen` / `PlayoffIntroScreen` (text finns).

**Varför den:** spelets absoluta tak. Laddas extra av kontext — din rival, eller
laget som slog ut dig förra året, på andra sidan.

**Bildmotiv:** Studenternas IP i marsljus. Sen eftermiddag, ljuset lågt och skarpt,
is som börjat bli blank av vårsol. Fullsatt, två färgsjok på läktarna. Klar, kall,
högtidlig — inte dramatisk. Stillhet före, inte jubel.

**Promptutkast (för AI-generering eller som Erik-brief):**
> Wide cinematic illustration of a Swedish bandy stadium (Studenternas IP, Uppsala)
> on a late March afternoon. Large outdoor ice rink, low golden-blue late-winter
> sun casting long shadows across glossy ice. Packed grandstands with two blocks of
> supporter colours. Floodlight pylons against a pale cold sky. Muted, dignified,
> hand-painted feel — earthy palette, parchment and slate, soft grain. Quiet
> anticipation, not celebration. No text, no logos, no faces in focus.

**Kontextvarianter (om Erik orkar fler än en):** neutral final / din rival i final
(deras färger framträder) / hemmakänsla om ditt lag spelar.

---

## 3 · Situation B — Annandagsbandyn (traditionens värme)

**När:** 26/12, fast. Mitt i mörkaste vintern. Den enda fasta julpunkten i
kalendern. Befintlig hook: `isAnnandagen` på Fixture (annandags-val-mekaniken P1
landar samtidigt — bra synergi).

**Varför den:** motpolen till finalen. Inte prestation utan kultur — frost, packad
läktare i halvmörker, glögg, andedräkt i luften. Lär oss receptets varma register.

**Bildmotiv:** liten bruksklubbs arena på annandagseftermiddag, redan skymning.
Strålkastare tända mot blålila himmel, frost i luften, andedräkt och ånga från
publiken. Termosar, mössor, en kiosk som lyser. Intim, sliten, varm trots kylan.
Mindre arena än finalen — bygd, inte katedral.

**Promptutkast:**
> Cozy hand-painted illustration of a small Swedish town bandy ground on Boxing
> Day afternoon, early dusk. Floodlights glowing against a deep blue-violet winter
> sky, frost in the air, breath and steam rising from a modest crowd in hats and
> scarves. A small lit kiosk to the side. Snow banked along the boards. Warm amber
> light against cold blue, intimate and worn, parchment-and-leather palette, soft
> grain, hand-painted feel. No text, no logos, no faces in focus.

---

## 4 · Vad som händer härnäst

- Erik tar motiv A + B (en bild var, ev. finalens rival-variant om lust finns).
- När en bild finns: Code bygger `SceneBackdrop` och wrappar motsvarande scen.
  Litet, lågrisk, text orörd. Ett halvdagsjobb, inte en sprint.
- Cup-finalen (Bollnäs/Sävstaås) är självklar trea senare — samma recept.
- Öppen fråga till Erik: handmålat som intron, eller AI-genererat i hans regi?
  Avgör hur många avbrott som är realistiska.

— Opus, 2026-05-21
