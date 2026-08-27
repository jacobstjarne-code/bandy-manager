# DOM — DELNINGSKORTETS BERÄTTELSELÄGE

**Datum:** 2026-08-17 · **Av:** Opus · **Post:** O9 i `SLUTTEST_KO.md`
**Underlag:** delbarhetsauditen (High 4), best-in-class-strategin.

---

## Fyndet

Slottsbrons andra säsong: en klubb märkt SVÅR, styrelsen krävde bara överlevnad, laget gick från nia till sexa och kvartsfinal, och vann ett derby med 7–6.

Delningskortet sade: **6., 21 poäng.**

För någon som inte spelar ser det mediokert ut. All kontext som gör resultatet imponerande — svårighetsgraden, styrelsens låga krav, förändringen mot förra året, derbyt — finns i `SeasonSummary` och används inte.

Auditens formulering: bilden reducerar allt detta till en placering. Och eftersom kortet är den enda artefakt som lämnar appen är det också den enda gång någon utomstående möter spelet.

---

## Domen — förtjänad kontrast, inte statistik

Kortets huvudbudskap ska vara **skillnaden mellan vad som väntades och vad som hände.** Statistiken är beviset, inte budskapet.

En utomstående ska på fem sekunder förstå: vem, vad hände, varför var det svårt, och vad kan jag göra.

---

## De tre artefakterna

Auditen konstaterar att tre knappar producerar samma kort. Tre olika artefakter med tre olika syften:

### Årets berättelse
Säsongens båge. Vad som väntades, vad som blev, och det ögonblick som vände.

### Årets match
Ett matchobjekt: derby, sen vändning, cupdrama eller slutspel. `matchHighlightService` hittar dem redan — den sätter bara `shareImageReady: false` permanent (`4.14`).

### Karriären hittills
Startklubb, antal säsonger, högsta och lägsta punkt, största legend, nästa olösta mål. Denna kräver `O18`.

**Bygg en i taget.** Årets berättelse först — det är den som har trasig layout (`4.12`) och som lämnar appen i dag.

---

## Texten — Årets berättelse

Tre rader plus statistik plus en fråga.

**Rad 1, kontrasten.** Formen är alltid *förväntan → utfall*:

- *Tippade för kval. Slutade sexa.*
- *Skulle vinna ligan. Slutade trea.*
- *Nykomling. Kvartsfinal.*
- *Skulle överleva. Vann cupen.*

Kontrasten härleds ur styrelsens mål mot faktiskt utfall — samma källa som `4.5` använder för årsbokens styrelsemening. **Finns ingen kontrast** — laget gjorde ungefär vad som väntades — används i stället säsongens tydligaste enskilda fakta: *Nionde plats. Fyra raka segrar i mars.*

**Rad 2, ögonblicket.** En sak som hände, från `matchHighlightService`:

- *Derbyt 7–6 blev vinterns vändpunkt.*
- *Fyra mål bakom i semifinalen. Kom aldrig tillbaka.*
- *{Namn} gjorde 28 mål på 22 matcher.*

**Rad 3, statistiken som bevis.** Placering, poäng, målskillnad, cup och slutspel. Liten typografi. Det är belägget, inte rubriken.

**Fjärde raden, frågan:**

- *Kan du ta {Klubb} längre?*
- *Kan du göra det med {Klubb}?* — när säsongen var stark
- *Kan du göra det bättre?* — när den var svag

---

## Vad som aldrig får stå på kortet

**Ingen siffra som inte kommer ur samma state som mekaniken.** Best-in-class-strategins kvalitetskontrakt, och skälet till att `K1` var blockerande: med dubblerad karriärstatistik publicerade vi fel måltal utanför spelet.

**Inget managernamn utan opt-in.** Klubbnamn är default. Personuppgifter är ett val.

**Ingen genererad prosa.** Fasta radformer med interpolerade värden. En AI-skriven sammanfattning kan inte garanteras stämma mot state, och kortet är den enda ytan där ett fel möter någon som inte kan bedöma det.

---

## Beroenden

**`4.12`** — layouten kapas i produktion. Ett kort med tre rader plus statistik plus fråga är mer innehåll än dagens, alltså måste den regionsbaserade layouten finnas först.

**`4.13`** — status och URL. Utan `url` i Web Share-payloaden är kortet en återvändsgränd oavsett hur bra texten är. Frågan *"Kan du ta Slottsbron längre?"* utan länk är ett löfte utan väg.

**`4.14`** — knappen som lovar Årets match men levererar Årets berättelse. Byt texten tills matchartefakten finns.

**`K1`** var blockerande och är klar. Talen är sanna nu.

**Ordning:** `4.12` → `4.13` → den här texten → `4.14`.

---

## Godkänd när

En person som inte spelar Bandy Manager kan titta på kortet och säga varför resultatet var svårt.

I dag kan hen läsa en placering.
