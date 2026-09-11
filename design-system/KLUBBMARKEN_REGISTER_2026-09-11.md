# Klubbmärken — produktionsregister

## Status

Alla tolv spelbara klubbar har ett godkänt, frilagt produktionsmärke. Källoriginal och transparent master sparas per klubb under `design-system/assets/clubs/{slug}/`.

Den browsergranskade kontaktkartan finns i utvecklingsscenen:

`/dev/scenes?scene=club-badge-contact-sheet&inspect=1&width=390`

En fryst referensbild finns i `design-system/assets/clubs/klubbmarken-contact-sheet.png`.

## Storlekskontrakt

| Variant | Produktfil | Användning |
| --- | --- | --- |
| Mikro | `public/assets/clubs/{slug}/badge-16.svg` | Renderad storlek 10–24 px, exempelvis tabell och täta statusrader |
| Kompakt | `public/assets/clubs/{slug}/badge-32.svg` | Renderad storlek 25–40 px, exempelvis matchkort |
| Full | `public/assets/clubs/{slug}/badge-64.svg` | Renderad storlek över 40 px, exempelvis presentation och miljöheader |

`ClubBadge` väljer variant automatiskt efter begärd renderingsstorlek. Okända framtida klubb-id:n använder fortsatt den deterministiska legacy-fallbacken tills ett riktigt märke producerats.

## Källfiler per klubb

- `source-large.jpeg` — användarens stora original, oförändrat och lokalt bevarat.
- `badge-source.png` — frilagd RGBA-master med äkta transparens.
- Produkt-SVG:erna kapslar en optimerad rasterrepresentation i ett stabilt SVG-skal och ska inte behandlas som nyritad vektorheraldik.

## Visuell kontroll

Kontaktkartan ska visa alla tolv märken samtidigt i 64, 32 och 16 px. Kontrollera särskilt:

- att inga vita, svarta eller schackrutiga bakgrunder finns kvar,
- att hela skölden eller vimpeln ryms utan beskärning,
- att huvudmotivet fortfarande går att känna igen i mikroformat,
- att märkena förblir tydligt åtskilda som grupp.

## Produktionsytor

- **Mikro:** tabellen, matchflödets masthead och formrutor.
- **Kompakt:** nästa-match-kort, spelarkort och Granska-resultatet.
- **Full:** årsboken samt båda SM-finalernas lagpresentationer.
- **Direkt på illustration:** Tillträdet och `MiljoHeader` använder `ClubBadgeOnImage`, en gemensam lågmäld kontrastplatta. Den ersätter lokala speciallösningar och är provad mot alla tolv klubbarnas ljusa och mörka introbilder.

Äldre bokstavssköldar i Tillträdet, `MatchLaddningScene` och `FinalIntroScreen` är borttagna. Alla kända spelbara klubb-id:n går genom samma assetregister; fallbacken finns bara för okända framtida id:n.

## Verifiering

- Komponent-/assettestet kräver 16, 32 och 64 px för samtliga tolv klubbar.
- `tests/visual/imageWiring.visual.ts` laddar alla 36 produkt-SVG:er, provar alla tolv bildöverlägg samt klickar fram och verifierar bägge finalpresentationerna.
- Kontaktkartan är manuellt browsergranskad både upptill och nedtill vid 390 px mobilbredd.
