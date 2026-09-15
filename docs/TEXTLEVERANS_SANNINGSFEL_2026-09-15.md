# TEXTLEVERANS — två sanningsfel i spelvyn (Opus 2026-09-15)

Två textbyten där formuleringen påstår något som inte stämmer med tillståndet. Code wire:ar; Opus äger orden. Ingen mekanik rörs.

## 1. Cuptexten "Tills dess är det serien som räknas" (nytt fynd, Codex testgrind)

**Problem:** texten visas alltid, även när nästa cupmatch kommer FÖRE nästa seriematch — då är påståendet falskt (det är cupen som räknas härnäst, inte serien).

**Villkorsstyrning (Code):** jämför nästa cupmatchs matchday mot nästa seriematchs matchday för managed club. Tre fall:

- Nästa match är en SERIEMATCH (serien kommer först) → behåll:
  `Tills dess är det serien som räknas.`

- Nästa match är en CUPMATCH (cupen kommer först) →
  `Tills dess är det cupen som gäller.`

- Ingen kommande cupmatch alls (utslagen / cupen över) → texten om cupen ska inte visas i det sammanhanget; om raden ändå behöver ett värde:
  `Nu är det serien som gäller resten av vägen.`

Ordvalet "räknas" vs "gäller" är medvetet: serien "räknas" (poäng, tabell, långa loppet), cupen "gäller" (nästa hinder, här och nu). Bandysvensk understatement, ingen utropston.

Code: hitta strängen i cupvyn (grep "det är serien som räknas"), gör den till en funktion av matchday-jämförelsen. Om jämförelsedatan inte finns i scope där texten byggs, exponera den — samma mönster som väderfixen i UX-passet.

## 2. Klass H — "Krönikan" → karriärhistorik (domen redan fälld, här som färdig sträng)

`narrativePushCopyResolver.ts:264`:

- FRÅN: `Den siffran står kvar i Krönikan.`
- TILL: `Den siffran står kvar i din karriärhistorik.`

Gemener, possessiv — push talar till spelaren om hennes historik, inte om ett system vid namn. Matchar `HistoryScreen`s rubrik "Karriärhistorik" utan att låta som en menyhänvisning. Ingen kodändring utöver strängen. **När satt: stäng `begriplighet-klass-h-kartlaggning` (ARKIV).**

## Stående regel (bekräftad av båda fynden)

Ett sanningsfel i spelvyn = texten påstår något om tillståndet som inte stämmer. Samma klass som mecenatvälkomsten, "Krönikan", entré-buggen. Fjärde+ instansen nu. Om det återkommer är det värt en grind: en text som refererar ett tillstånd (nästa match, ett system, ett utfall) ska villkorsstyras mot det tillståndet, aldrig hårdkodas. Ännu inte en grind — men mönstret är noterat.
