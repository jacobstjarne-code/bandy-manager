# FIDELITY-CHECKLISTA — Design → Code verifiering

**Från:** Design-Claude · **Datum:** 2026-06-07
**Parar med:** `CODE-OVERLAMNING-DESIGNPAKET-2026-06-05.md`
**Syfte:** Göra "implementera just så här" mätbart. Per beslut: grep-villkor (maskin) + screenshot-villkor (öga). Code bockar av, Design verifierar i pixel-audit.

**Notation:** `▣ grep` = kommando ska returnera tomt (eller bara godkända träffar). `◉ syn` = Design granskar screenshot mot mock.

---

## DEL 1 · KONSEKVENS-MEKANIK

### DB-1 · Alpha/tint-system (master)
```
▣ grep  rgba\([0-9] i src/presentation/ → endast godkända (scrim, glow-flaggade)
▣ grep  34,197,94 | 239,68,68  → tomt (Tailwind-rgb borta)
▣ grep  color-mix\(in srgb  → finns på tint/border/fill-ställen
◉ syn   tint-bg 6% · divider 18% · border 30% · fill 55% — jämför mot db1-9-mock
⚑ flagg  varje box-shadow med 35% glow → Design-review INNAN auto-konvert
```

### DB-2 · Guld-domän
```
▣ grep  var\(--gold i src/ → endast seger/landslag/final-filer
◉ syn   SM-final + vardagsportal sida vid sida → guld bara i finalen
□       kontrakt-stripe = --warm (ej guld), B-läge/stretch = accent
```

### DB-3 · Score-representation
```
□       ScoreBlock i alla UI-resultatflöden (RoundSummary, Granska, OpponentForm)
□       ceremoniell Georgia-siffra ENDAST i segerscen
◉ syn   ingen naken score-text där ScoreBlock ska vara
```

### DB-4 · Numerisk semantik
```
□       pengar=Georgia · score=ScoreBlock/mono · statistik=mono · placering=Georgia
▣ grep  BoardMeeting/EkonomiTab → ingen mono där Georgia ska vara (manuell läs)
◉ syn   kassa-tal i Georgia, inte sans-bold
```

### DB-5 · Squad-stripe (en state)
```
□       stripe = prioriterad state: skada/avstängd > moral/lobby > kontrakt > ålder
□       guld aldrig i squad-stripe; övriga states → chips
◉ syn   spelare med 3+ states → EN stripe-färg, resten chips
```

### DB-6 · Portal-kort-modifier
```
▣ grep  inline token-override i NextMatchPrimary → ersatt med .card--portal
◉ syn   portal-kort identiskt före/efter refaktor
```

### DB-7 · Scen-typografi + tokens
```
▣ grep  inline reimpl av h-scene-* → tomt (använder kanon-klasser)
□       --bg-scene-deep / --bg-scene tokeniserade
⚑ flagg  colors_and_type.css-spegel SYNKAD mot global.css (governance)
```

### DB-8 · Gradient-disciplin
```
□       tabell-header + managed-rad + "Årets match" → solid + stripe (ej gradient)
□       scrim/fade = sanktionerat (illustration, scen-atmosfär)
◉ syn   inga dekorativa yt-gradienter på datakort
```

### DB-9 · Radie-skala
```
▣ grep  border-radius:\s*6px → 0 träffar (→ --radius-md/8)
▣ grep  border-radius:\s*12px → endast .btn--hero (annars 8 eller 14)
◉ syn   portal-kort + tabell-tabbar = 8px
```

### R2-1 · Rubrik-kalibrering
```
□       .h-display-hero (Georgia 52/900, fallback 800+ls−1px) finns
□       .h-eyebrow (11/3px) skild från .h-label (8/2px)
□       SeasonSummary h1 → .h-display-hero; BoardMeeting 23→28, 12.5→13
◉ syn   seger-rubrik tung men ej off-scale
```

### R2-2 · Hjälte-CTA
```
□       .btn--hero (radius 14, padding 17×22, 16/800, glow) + .gold-variant
▣ grep  .btn--hero användning → endast säsongsslut/seger/cup-filer
□       Dela/Historik → .btn-outline (accent, ej grå)
◉ syn   hero-CTA bara på höjdpunkt-skärmar
```

### R2-3 · Åldersband
```
□       en chip-form: radius 99, color-mix 6% fyll / 30% kant
□       Utvecklas=cold · Peak=success · Avtar=muted
▣ grep  --ice i squad → tomt (→ --cold)
◉ syn   tre band, en form
```

### DB-Q1 · Sparkline-disciplin
```
◉ syn   max 1 sparkline/kort, ~4/skärm
□       squad-rad CA = tal+delta (sparkline ENDAST i PlayerCard-modal)
□       behållna: burnout, journalist-relation, CA-modal, form, squad-pulse
◉ syn   ingen sparkline på enstaka-värde/nuläge
```

### DB-Q2 · Warm-domän
```
▣ grep  --warm på åldersband "avtar" → tomt (→ --text-muted)
□       vardagskafferum → --cold; warm = severity/lobby/burnout/upptakt/kontrakt
◉ syn   warm betyder "stigande tryck" överallt det förekommer
```

### DB-Q3 · Emoji vs Lucide
```
▣ grep  ▾|●|🌱 i src/presentation → konverterade till Lucide (💔 INTE)
□       Lucide: TrendingDown/Circle/Sprout, stroke 1.8
□       💔 STANNAR emoji (diegetiskt+känsla); 🔥 stannar när det markerar burnout/känsla
□       behållna emoji: 🏒📣☕🩺🇸🇪💔 + kategori-set + ★ rating
◉ syn   inga clipart-emoji som data-symboler
```

---

## DEL 2 · ILLUSTRATIONSSYSTEM

### Komponent
```
□       <IllustrationScene mode src alt> med 3 lägen (fullbleed/band/header)
□       scrim inbyggd per läge (DB-8 sanktionerad gradient)
□       text aldrig naken på bild
```

### Placeholder
```
□       saknad/404 src → IllustrationPlaceholder (ej trasig img-ikon)
□       placeholder = --bg-portal-surface + color-mix(--accent 30%)-ram + mono-label
□       exakt samma dimensioner som slutbild (inget hopp när bild landar)
◉ syn   placeholder + riktig bild ger identisk layout
```

### Tre platser
```
□       ArrivalScene → fullbleed, intro.jpg
□       Annandagen-anslag → band, annandagen.jpg
□       Finalhelg-portal (gated round===Final) → header, final.jpg
□       5 kommande (nyarsbandy/varsol/kafferummet/derby/nedflyttning) → placeholder nu
```

### Domänregel
```
▣ grep  IllustrationScene i trupp/transfers/portal-vardag → tomt
◉ syn   illustration ENDAST vid ögonblick
```

---

## DEL 3 · FEATURE-SPÅR

Per spår: acceptanskriterierna i respektive handoff GÄLLER. Denna checklista lägger till tvärgående verifiering:

```
□       Score-system byggt FÖRST (ScoreBlock + Sparkline) — DB-3/Q1 beror på det
□       varje feature använder konsekvens-tokens (ingen egen rgba/radie)
◉ syn   nytt feature-kort ser ut som systemet, inte som en ö
```

Spår + handoff (acceptans i respektive fil):
- Spectator · `HANDOFF-SPECTATOR-SASONGEN`
- Klubbminne/R5 · `HANDOFF-KLUBBMINNE-ANNIVERSARY`
- R1 fatigue · `HANDOFF-R1-DECISION-FATIGUE` v3
- Manager · `HANDOFF-MANAGER-KARAKTAR` v2
- Skade · `HANDOFF-SKADE-NARRATIV` v2
- Landslag · `HANDOFF-C-K1-LANDSLAG` v2
- Koreografi · `HANDOFF-C-SD1-KOREOGRAFI`
- Portal-kurering · `HANDOFF-PORTAL-KURERING-SVAR`
- Efterklang · `2026-06-03_design_efterklang_flode`
- Trupp · `HANDOFF-TRUPP-*`

---

## VERIFIERINGS-LOOP (per block)

```
1. Code bygger block → bockar ▣ grep + □ själv
2. Code levererar screenshots för ◉ syn-raderna
3. Design pixel-audit: jämför mot mock, ✅/⚠️ per ◉
4. ⚑ flaggor → Design-beslut innan stängning
5. Block STÄNGS först när alla ▣ + ◉ gröna
```

Inget block är "klart" på känsla. Grön checklista = klart.

— Design-Claude, 2026-06-07
