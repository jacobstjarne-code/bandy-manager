# Brief — spelarporträtt (omtag)

**Datum:** 2026-05-21
**Av:** Opus, för Jacob + Erik
**Status:** Underlag för nytt försök. Förra omgången hade rätt stil men fel
hantverk — den här briefen låser det som gick snett.

---

## 0 · Vad som gick fel förra gången (så vi inte upprepar det)

Stilen var rätt — varm, lätt illustrerad, FM-aktig, parchmentton som matchar
spelets palett. Behåll den. Problemen var tekniska:

- **Trasig beskärning:** vissa porträtt (t.ex. `vet_3`) hade avklippta färgfält
  överst och ansiktet nedtryckt i rutans underkant — som om en spritesheet eller
  felaktig export följde med. Ansiktet satt inte centrerat.
- **Inkonsekvent inramning:** vissa fyllde rutan, andra svävade i den. Ett galleri
  av spelare ser slarvigt ut även när enskilda ansikten är okej.
- **PNG-vägen kopplades aldrig in.** Koden gick tillbaka till procedurell SVG
  (`svgPortraitService`, 64×64 geometriska former) som fallback. Den är gratis men
  oundvikligen primitiv — byggklossar, inte porträtt. Målet nu är att ersätta den.

---

## 1 · Format och mått

- **Bildyta:** 256 × 256 px, kvadratisk. (Renderas nedskalad i UI men höga
  käll-pixlar ger skärpa på retina + utrymme för framtida större visning.)
- **Format:** PNG med transparent ELLER enfärgad parchmentbakgrund — se §3.
- **Filnamn:** behåll mönstret `portrait_{tier}_{n}.png` —
  tiers: `young` / `mid` / `exp` / `vet`, n = 1–8. 32 bilder totalt.
- **Plats:** `public/assets/portraits/` (befintlig mapp, skriv över).
- **Vikt:** sikta under ~40 kB/bild så 32 st inte tynger laddningen.

## 2 · Komposition — låst, detta är det som fick det att se trasigt ut

- **Beskärning:** huvud + axlar (byst), som ett ID-foto. Hjässan ~12 % från
  överkant, axlarna bryts av nederkanten. Samma snitt på ALLA 32.
- **Centrering:** ansiktets mittpunkt i bildens horisontella mitt, ögonlinjen
  ~40 % från överkant. Identiskt på alla — det är enhetligheten som gör galleriet
  proffsigt.
- **Inga ramar, inga färgfält, inga avdelare i bilden.** Bara byst mot bakgrund.
  UI:t lägger på sin egen ram. Allt extra i själva bilden blir det "trasiga" igen.
- **Blick:** rakt fram eller en aning vid sidan. Neutralt uttryck, inte leende,
  inte dramatiskt. De ska kunna sitta i ett lugnt galleri utan att skrika.

## 3 · Stil och palett

- **Stilen behålls:** varmt illustrerad, mjuk men inte tecknad, lätt målad yta.
  Tänk Football Manager-porträtt men i spelets jordnära ton.
- **Bakgrund:** enfärgad, lugn, i parchment/leather-paletten (samma som intro och
  design-tokens — varm beige/sandsten, ev. svag vinjett). Ingen miljö, inga
  detaljer bakom. Konsekvent bakgrund på alla 32, annars spretar galleriet.
- **Palett-ankare:** parchment `#F5F1EB`-aktig bakgrund, hud i varma toner,
  hår/skägg i den jordnära skalan SVG-tjänsten redan använder (`#2C2820` →
  `#D4C4A8`). Inga kalla eller mättade färger som bryter mot spelets ton.

## 4 · Åldersnivåerna — vad som skiljer dem

Detta är hela poängen med fyra tiers. Gör skillnaden tydlig men inte karikerad:

- **young** (~17–21): slätrakade eller lätt stubb, fylligare ansikten, mer hår,
  ungdomlig hy. Mössa förekommer (som `young_1` — den fungerade bra).
- **mid** (~22–27): vuxna drag, blandat skäggväxt, full hårväxt.
- **exp** (~28–32): markerade drag, vanligare med skägg, begynnande gråsprängt,
  någon med tunnare hår.
- **vet** (~33+): äldre drag, grått inslag, flintskallar förekommer, väderbitet.

Inom varje tier: 8 varianter som spänner hudton, hårfärg, skägg/inte, ansiktsform
— så åtta spelare i samma åldersgrupp inte ser likadana ut.

## 5 · Inkoppling (Code, separat och litet)

När bilderna finns: `portraitService.getPortraitPath` återupplivas och pekar på
`{tier}_{hash%8+1}` baserat på spelarens ålder och ID, med SVG-tjänsten kvar som
fallback om en bild saknas. Ren mappningslogik, ingen text, ~1–2h. Specas när
bilderna är godkända — inte före.

## 6 · AI-generering — konsekvens är hela jobbet (Erik genererar)

Med 32 bilder på en eftermiddag är risken inte fula enskilda ansikten — det är att
batchen inte hänger ihop. Förra omgången spretade just så. Det som håller en batch
konsekvent:

- **Lås prompt-basen ord för ord.** Samma bas på alla 32. Bara den varierande
  raden (ålder, hårfärg, skägg, hudton) byts ut per bild. Ändra aldrig
  bakgrunds-, ljus- eller beskärningsorden mellan bilder.
- **Lås seed/stil om verktyget tillåter.** Samma stilreferens eller seed-familj
  ger samma penselyta. Olika seeds = olika "konstnärer" = spretigt galleri.
- **Generera mot samma bakgrund varje gång** — enfärgad parchment, inte "en
  bakgrund som passar". Verktyg hittar annars på miljö.
- **Negativ-prompt, alltid med:** ramar, text, färgfält/spritesheet, flera
  personer, miljö bakom, dramatiskt ljus, glansiga highlights, leende.
- **Granska som grupp, inte en i taget.** Lägg alla 32 bredvid varandra och kasta
  de som sticker ut i ljus eller beskärning, regenerera dem mot basen. Det var
  grupp-konsekvensen som fattades, inte enskild kvalitet.

**Prompt-bas (lås denna, variera bara den sista raden):**
> Warm hand-painted character portrait, head and shoulders, centered, facing
> forward, neutral calm expression, plain warm parchment background (#F5F1EB),
> soft even painterly shading, earthy muted palette of sandstone, leather and
> slate. Swedish outdoor bandy player. Square 1:1 framing, ID-photo crop, head
> fills the upper two-thirds, eye-line at 40% from top.
> NEGATIVE: frame, border, text, color bars, spritesheet, multiple people,
> background scenery, dramatic lighting, glossy highlights, smiling.
>
> *Variabel rad per bild, t.ex.:* "Man in his late 30s, weathered features,
> greying short hair, light stubble." (vet) — "Young man around 19, smooth face,
> dark medium hair, wearing a knitted beanie." (young)

— Opus, 2026-05-21
