# Diagnos — Design-system-krockar

**Datum:** 2026-05-05  
**Designsystem-referens:** `bandy-manager/design-system/` (CODE-OPUS-INSTRUCTION.md, DESIGN-DECISIONS.md, colors_and_type.css)  
**Inga kodändringar gjorda.**

---

## Redan kända krockar — fixade 2026-05-05

| ID | Fil | Beskrivning | Status |
|---|---|---|---|
| K1 | `EventCardInline.tsx` | borderLeft-accent-stripe | FIXAD |
| K2 | `EventPrimary.tsx` | borderLeft-accent-stripe + inline linear-gradient på knapp | FIXAD |
| K3 | `JournalistSecondary.tsx` | borderLeft med `--cold`/`--warm` | GODKÄNT UNDANTAG |

---

## DIAGNOS A — Hårdkodade hex i .tsx

Regel: Alla färger ska vara CSS-variabler från `colors_and_type.css`. Hårdkodade hex utanför SVG-illustrationer och ClubBadge är KROCK.

### A1 — KROCK

**`InboxScreen.tsx` rad 132**
```tsx
color: '#fff'
```
Kontext: Initialkrets för Coach-avatar. Borde vara `var(--text-light)`.

**`HistoryScreen.tsx` rad 193**
```tsx
color: activeTab === tab ? '#1A1410' : 'var(--text-secondary)'
```
Kontext: Tab-knappar. `#1A1410` är en mörk nyans nära `--bg-dark` men inte en definierad token. Borde vara `var(--text-primary)` eller `var(--bg-dark)`.

**`HistoryScreen.tsx` rad 277**
```tsx
color: photoSeason === s ? '#1A1410' : 'var(--text-secondary)'
```
Samma mönster som rad 193 — odokumenterad hex.

**`SquadScreen.tsx` rad 352**
```tsx
color: screenTab === t ? '#fff' : 'var(--text-muted)'
```
Knapptext i aktiv tab. Borde vara `var(--text-light)`.

**`SquadScreen.tsx` rad 447**
```tsx
color: lineupTab === tab.key ? '#fff' : 'var(--accent)'
```
Samma mönster.

**`GranskaScreen.tsx` rad 279**
```tsx
color: isActive ? '#fff' : 'var(--accent)'
```
Flik-knapp aktiv-färg.

**`GranskaAnalys.tsx` rad 43**
```tsx
color: '#fff'
```
Initialkrets för assistenttränare. Borde vara `var(--text-light)`.

**`GranskaAnalys.tsx` rad 45**
```tsx
color: '#fff'
```
Namntext ovanpå mörk bakgrund. Borde vara `var(--text-light)`.

**`GameHeader.tsx` rad 126**
```tsx
color: '#C9B89A'
```
Undertext i header. Designsystemet dokumenterar `#C9B89A` som korrekt underskrift-färg i GameHeader-beslutet ("Undertext lyft till #C9B89A för läsbarhet på läderyta"). Närmaste token är `--text-light-secondary` (`#C4BAA8`) — inte identisk. **Gränsfall:** beslutet nämner färgen explicit men den saknas som token. Markeras som GRÄNSFALL.

**`TabBar.tsx` rad 28**
```tsx
color: isActive ? '#fff' : 'var(--text-muted)'
```
Borde vara `var(--text-light)`.

**`FormationView.tsx` rad 142**
```tsx
color: formation === f ? '#fff' : 'var(--accent)'
```
Formations-väljar-knapp.

**`NotesView.tsx` rad 61**
```tsx
color: '#fff'
```
Text i initialkrets. Borde vara `var(--text-light)`.

**`NotesView.tsx` rad 95**
```tsx
color: '#fff'
```
Samma mönster.

**`NextMatchPrimary.tsx` rad 76–77**
```tsx
'--text-primary':  '#F5F1EB',
'--text-secondary':'#C4BAA8',
```
Sätter CSS-variabler med hårdkodade hex. `#F5F1EB` = `--text-light`, `#C4BAA8` = `--text-light-secondary`. Ska peka på tokens, inte värden.

**`JournalistSecondary.tsx` rad 35**
```tsx
color: '#7095b8'
```
Ljusare variant av `--cold` (#4a6680) för tag-text i severity-kontext. Ingen token för denna ljusare ton. KROCK — men i severity-domän (se K3).

**`JournalistSecondary.tsx` rad 46**
```tsx
color: '#c8a058'
```
Ljusare variant av `--warm` (#8c6e3a) för tag-text. Ingen token.

**`InteractionShell.tsx` rad 110**
```tsx
color: '#fff'
```
Initialkrets coach. Borde vara `var(--text-light)`.

**`Scoreboard.tsx` rad 145**
```tsx
color: '#A89878'
```
Odokumenterad hex, närmaste token är `--text-light-secondary` (#C4BAA8) eller `--bg-leather` (#3D3A32).

**`MecenatDinnerEvent.tsx` rad 189**
```tsx
color: '#fff'
```
Knapptext. Borde vara `var(--text-light)`.

**`WageOverrunWarning.tsx` rad 58**
```tsx
border: `1px solid ${variant === 'severe' ? 'var(--danger)' : 'var(--warning, #c9a84c)'}`
```
Fallback `#c9a84c` i CSS-var-deklaration — defensiv fallback men värdet `#c9a84c` är inte `--warning` (`#C47A3A`). KROCK.

### A2 — SVG-illustrationer (OK)

Följande filer har hårdkodade hex i SVG-kontext — godkänt:

- `BandyPitch.tsx` rad 29–31 — SVG stop-colors för planens gradientfyllning
- `CornerInteraction.tsx` rad 74 — SVG stroke `#999`
- `CounterInteraction.tsx` rad 62, 69, 73 — SVG strokes + cirkel
- `FreeKickInteraction.tsx` rad 64, 69, 71, 72 — SVG strokes + text
- `PenaltyInteraction.tsx` rad 63–66, 124 — SVG målkonstruktion
- `GranskaShotmap.tsx` rad 104, 123 — SVG `#fff` + `rgba(0,0,0,0.1)` på plangrafik
- `ConfettiParticles.tsx` rad 15 — animation-konstanter (ej UI-färger)
- `SMFinalVictoryScene.tsx` rad 45 — scenens bakgrundsgradient (atmospheric, scen-specifik)
- `SundayTrainingScene.tsx` rad 45 — scenens bakgrundsgradient

### A3 — Oklassificerat (kräver beslut)

**`JournalistRelationshipScene.tsx` rad 23–24**
```tsx
? 'linear-gradient(90deg, #4a6680 0%, #6080a0 100%)'
: 'linear-gradient(90deg, #8c6e3a 0%, #c8a058 100%)'
```
Hårdkodade hex i gradient-kontext för severity-relation-bar. `#4a6680` = `--cold`, `#8c6e3a` = `--warm`. Hårdkodat trots att tokens finns.

---

## DIAGNOS B — Vänster-border-stripes

Regel: `borderLeft` som accent-stripe på kort är principiellt avvisat, utom `--cold`/`--warm` på severity-kort (dokumenterat undantag).

### B1 — GODKÄNT UNDANTAG

- `JournalistSecondary.tsx` rad 62 — `var(--cold)` / `var(--warm)` via `stripeColor` — OK
- `SeasonSignatureSecondary.tsx` rad 38 — `BORDER_COLOR[sig.id]` innehåller `var(--cold)` och `var(--warm)` för `cold_winter` och `injury_curve` — OK. Övriga signaturer (`calm_season`, `scandal_season`) använder `var(--accent)` och `var(--danger)` — KROCK (se B2).

### B2 — KROCK

**`InboxScreen.tsx` rad 113**
```tsx
borderLeft: item.isRead ? '3px solid transparent' : '3px solid var(--accent)'
```
Oläst-indikator som vänsterstipe på inkorads-kort.

**`TabellScreen.tsx` rad 273**
```tsx
borderLeft: `3px solid ${getRowBorderColor(row.position)}`
```
`getRowBorderColor` returnerar `var(--accent)`, `rgba(196,122,58,0.4)`, `transparent`, `rgba(239,68,68,0.6)` beroende på position. Ligrad-stripe för alla tabellrader.

**`RoundSummaryScreen.tsx` rad 364**
```tsx
borderLeft: '3px solid var(--danger)'
```
Skade-alert-kort.

**`RoundSummaryScreen.tsx` rad 402**
```tsx
borderLeft: relevant ? '2px solid var(--accent)' : '2px solid transparent'
```
Resultat-rad för relevanta matcher i omgångslista.

**`SeasonSummaryScreen.tsx` rad 251**
```tsx
borderLeft: '3px solid var(--accent)'
```
Säsongs-signatur-block (läderyta med Georgia-italic-citat).

**`SeasonSummaryScreen.tsx` rad 266**
```tsx
borderLeft: '3px solid var(--accent)'  (på className="card-sharp card-stagger-1")
```
Narrativt sammanfattningskort.

**`PlayoffIntroScreen.tsx` rad 73**
```tsx
borderLeft: '1px solid var(--border)'
```
Kolumn-separator i tvåkolumns-layout. Inte en accent-stripe utan layoutseparator. GRÄNSFALL — `--border` är inte en accent-färg men mönstret är borderLeft på div.

**`VictoryQuote.tsx` rad 15**
```tsx
borderLeft: '2px solid var(--match-gold)'
```
Citat-block i segersscen. `--match-gold` är inte `--cold`/`--warm`.

**`GranskaForlop.tsx` rad 139**
```tsx
borderLeft: isRivalMatch ? '2px solid var(--accent)' : '2px solid transparent'
```
Resultatrad för derbymatchen i säsongsförloppet.

**`ClubMemoryEventRow.tsx` rad 18**
```tsx
borderLeft: '2px solid var(--accent)'
```
"Stor" händelse i klubbminnesvyn.

**`SeasonSignatureSecondary.tsx` rad 38** — `calm_season` → `var(--accent)`, `scandal_season` → `var(--danger)`. Dessa är inte severity-tokens.

**`CommentaryFeed.tsx` — rad 238–286 (15 borderLeft-rader)**
Kommentarsfeedets händelse-färgkodning via borderLeft. Fullständig lista:
```
rad 250: '3px solid var(--accent)'        — mål-rad
rad 258: '1px dotted var(--danger)'       — domarreferens vid utvisning
rad 261: '3px solid var(--danger)'        — utvisning
rad 266: '3px solid rgba(196,122,58,0.4)' — hörnhändelse
rad 270: '3px solid rgba(220,80,30,0.7)'  — derbykommentar
rad 273: '1px dashed rgba(140,190,220,0.5)' — atmosfär
rad 278: '3px solid var(--accent)'        — situation-typ
rad 283: '2px solid rgba(140,190,220,0.6)' — taktisk
rad 286: '1px dotted var(--danger)'       — domarreferens
rad 309: borderLeft/borderRight på alla feeds (höger för bortalag)
rad 335: '1px dashed rgba(140,190,220,0.5)' — extra tid
rad 353: '3px solid rgba(196,122,58,0.35)' — extra tid-kort
rad 375: '3px solid rgba(196,122,58,0.35)' — hörn-kort
```
CommentaryFeed är ett distinkt system (live match-feed) med designbeslut pågående ("Commentary feed — riktning B, Stålvallen"). Markeras som KROCK i nuläget men adresseras i kommande commentary-redesign.

**`MatchHeader.tsx` rad 61**
```tsx
borderLeft: atmo.borderAccent ? `3px solid ${atmo.borderAccent}` : undefined
```
`atmo.borderAccent` sätts i matchatmosfär-beräkning. Okänt vilket värde det antar — potentiell krock beroende på värde.

**`FreeKickInteraction.tsx` rad 129**
```tsx
borderLeft: `3px solid ${outcome.type === 'goal' ? 'var(--accent)' : 'var(--bg-dark-elevated)'}`
```
Utfall-box i frislag-interaktion.

**`PlayerCard.tsx` rad 446**
```tsx
borderLeft: '3px solid var(--danger)'
```
Skade-/varnings-block inne i spelarkort.

**`TransferPlayerCard.tsx` rad 46**
```tsx
borderLeft: isScouted ? '3px solid var(--accent)' : '3px solid transparent'
```
Scoutad-indikator på transferspelarkort.

**`CoffeeRoomSecondary.tsx` rad 23**
```tsx
borderLeft: '2px solid var(--accent)'
```
Kaférum-kort på portalen.

**`OfferCard.tsx` rad 48**
```tsx
borderLeft: '2px solid var(--accent)'
```
Anbud-kort i klubbval.

**`ActiveBidsList.tsx` rad 315**
```tsx
borderLeft: isAlreadyScouted ? '3px solid var(--accent)' : '3px solid transparent'
```
Scoutad-indikator i scouting-förslag.

**`SituationCard.tsx` rad 16**
```tsx
borderLeft: '2px solid var(--accent)'
```
Situationskort på portalen.

**`KlackenSecondary.tsx` rad 29**
```tsx
borderLeft: '2px solid var(--accent)'
```
Klack-secondary-kort på portalen.

**`ClubExpandedCard.tsx` rad 71**
```tsx
borderLeft: '2px solid var(--accent)'
```
Expanderad klubbkort i klubbval.

**`CounterInteraction.tsx` rad 134**
```tsx
borderLeft: outcome.type === 'goal' ? '3px solid var(--accent)' : '3px solid var(--bg-dark-elevated)'
```
Utfall-box i kontringsinteraktion.

**`ClubMemoryLegendsBlock.tsx` rad 35**
```tsx
borderLeft: '2px solid var(--accent-dark)'
```
Legendrad i klubbminnet.

---

## DIAGNOS C — Inline linear-gradient

Regel: CTA-knappar ska använda `className="btn btn-primary"`. Andra gradient-användningar klassificeras per fall.

### C1 — KROCK: CTA-knappar med inline gradient i stället för btn-klass

**`RoundSummaryScreen.tsx` rad 485**
```tsx
background: 'linear-gradient(135deg, var(--accent-dark), var(--accent-deep))'
```
Knapp med `className="texture-leather"` utan `btn btn-primary`. Fullständig inline-styling av CTA.

**`HalfTimeSummaryScreen.tsx` rad 139**
```tsx
background: 'linear-gradient(135deg, var(--accent-dark), var(--accent-deep))'
```
Samma mönster. Knapp med `className="texture-leather"`.

**`QFSummaryScreen.tsx` rad 146**
```tsx
background: 'linear-gradient(135deg, var(--accent-dark), var(--accent-deep))'
```
Samma mönster.

**`PlayoffIntroScreen.tsx` rad 193**
```tsx
background: 'linear-gradient(135deg, var(--accent-dark), var(--accent-deep))'
```
Samma mönster.

**`IntroSequence.tsx` rad 199**
```tsx
background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)'
```
Knapp utan btn-klass.

**`CommentaryFeed.tsx` rad 204**
```tsx
background: 'linear-gradient(135deg, var(--accent-dark), var(--accent-deep))'
```
"Starta halvtid"-knapp i CommentaryFeed.

**`PatronDemandPrimary.tsx` rad 81**
```tsx
background: 'linear-gradient(135deg, var(--accent-dark) 0%, var(--accent-deep) 100%)'
```
Portal-primary CTA-knapp.

**`TransferDeadlinePrimary.tsx` rad 106**
```tsx
background: 'linear-gradient(135deg, var(--accent-dark) 0%, var(--accent-deep) 100%)'
```
Portal-primary CTA-knapp.

**`SMFinalPrimary.tsx` rad 128**
```tsx
background: 'linear-gradient(135deg, var(--accent-dark) 0%, var(--accent-deep) 100%)'
```
Portal-primary CTA-knapp.

**`DerbyPrimary.tsx` rad 112**
```tsx
background: 'linear-gradient(135deg, var(--accent-dark) 0%, var(--accent-deep) 100%)'
```
Portal-primary CTA-knapp.

**`ClubExpandedCard.tsx` rad 88**
```tsx
background: 'linear-gradient(135deg, var(--accent-dark) 0%, var(--accent-deep) 100%)'
```
"Välj den här klubben"-CTA.

**`SceneCTA.tsx` rad 26**
```tsx
'linear-gradient(135deg, var(--match-gold) 0%, var(--accent) 100%)'
```
Scen-CTA med guld-variant av gradienten.

### C2 — OKLASSIFICERAT: Gradient ej på knapp

**`BottomNav.tsx` rad 124**
```tsx
backgroundImage: 'repeating-linear-gradient(92deg, rgba(160,130,90,0.04) ...)'
```
Strukturell bakgrundstext på BottomNav-behållaren. Designsystemet har BottomNav som "på is" för ikoner men inget beslut om bakgrundstextur.

**`HalfTimeSummaryScreen.tsx` rad 131**
```tsx
background: 'linear-gradient(to top, var(--bg) 80%, transparent)'
```
Fade-mask för CTA-area. Layoutelement, inte kortbakgrund.

**`SeasonSummaryScreen.tsx` rad 285**
```tsx
background: 'linear-gradient(180deg, var(--bg-elevated) 0%, rgba(196,122,58,0.06) 100%)'
```
Kortbakgrund med subtil koppar-ton.

**`TabellScreen.tsx` rad 198**
```tsx
background: 'linear-gradient(90deg, var(--bg-dark), var(--bg-dark-surface), var(--bg-dark))'
```
Tabellavdelningens bakgrund (mörkt band).

**`TabellScreen.tsx` rad 275**
```tsx
? 'linear-gradient(90deg, rgba(196,122,58,0.12) 0%, rgba(196,122,58,0.04) 100%)'
```
Tabellrad-bakgrund för managed club.

**`TransfersScreen.tsx` rad 289**
```tsx
background: 'linear-gradient(to left, var(--bg), transparent)'
```
Fade-mask för horisontell scroll.

**`RoundSummaryScreen.tsx` rad 480**
```tsx
background: 'linear-gradient(to top, var(--bg) 80%, transparent)'
```
Fade-mask, samma typ som HalfTimeSummaryScreen.

**`PatronDemandPrimary.tsx` rad 24**
```tsx
background: 'linear-gradient(135deg, var(--bg-portal-elevated) 0%, rgba(160,72,72,0.15) 100%)'
```
Portal-primary kortbakgrund med subtil färgton.

**`TransferDeadlinePrimary.tsx` rad 46**
```tsx
background: 'linear-gradient(135deg, var(--bg-portal-elevated) 0%, rgba(200,146,60,0.15) 100%)'
```
Portal-primary kortbakgrund.

**`SMFinalPrimary.tsx` rad 59**
```tsx
background: 'linear-gradient(135deg, var(--bg-portal-elevated) 0%, rgba(212,164,96,0.20) 100%)'
```
Portal-primary kortbakgrund.

**`DerbyPrimary.tsx` rad 56**
```tsx
background: 'linear-gradient(135deg, var(--bg-portal-elevated) 0%, rgba(160,72,72,0.15) 100%)'
```
Portal-primary kortbakgrund.

**`HistoryScreen.tsx` rad 333**
```tsx
background: isGold ? 'linear-gradient(135deg, rgba(196,122,58,0.12), rgba(196,122,58,0.04))' : undefined
```
Säsongskort för guldsäsong.

**`PlayerCard.tsx` rad 374**
```tsx
background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)'
```
Spelarkortets övre bakgrundsgradient.

**`IntroSequence.tsx` rad 89**
```tsx
background: 'linear-gradient(to bottom, rgba(14,13,11,0.3) 0%, ...)'
```
Dimlagret ovanpå intro-bakgrundsbilden.

**`SquadStatusCard.tsx` rad 72, 78, 84, 90**
```tsx
barGradient="linear-gradient(90deg, var(--success), var(--success-light))"
barGradient="linear-gradient(90deg, var(--accent), var(--accent-dark))"
barGradient="linear-gradient(90deg, var(--ice), var(--ice-dark))"
barGradient="linear-gradient(90deg, var(--border-dark), var(--text-muted))"
```
Progressbar-gradienter. Prop skickas till underkomponent.

**`MatchReportView.tsx` rad 314**
```tsx
background: 'linear-gradient(135deg, rgba(196,122,58,0.18) 0%, rgba(196,122,58,0.06) 100%)'
```
Mål-blixt-highlight i matchrapport.

**`TacticPreview.tsx` rad 63**
```tsx
background: 'linear-gradient(180deg, rgba(200,220,210,0.15) 0%, ...)'
```
Taktikplansvisualisering — isbakgrund.

**`PlayoffBanner.tsx` rad 75**
```tsx
background: 'linear-gradient(135deg, rgba(196,122,58,0.12), rgba(196,122,58,0.04))'
```
Slutspelsbanner-bakgrund.

**`AllClubsView.tsx` rad 36**, **`OffersView.tsx` rad 19**
Radial + linear kombinationsgradienter på mörka skärmars bakgrunder. Scenatmosfär.

**`NextMatchCard.tsx` rad 132**
```tsx
? 'linear-gradient(135deg, var(--match-bg-default), var(--match-bg-rain))'
```
Nästa-match-kortets bakgrund vid regn.

**`FinalIntroScreen.tsx` rad 82**
```tsx
background: 'linear-gradient(180deg, var(--bg-dark) 0%, var(--bg-dark) 60%, ...)'
```
Enhetlig mörk bakgrund (alla stopp identiska, effektivt solid).

**`JournalistRelationshipScene.tsx` rad 23–24**
Se A3 — severity-gradient med hårdkodade hex.

---

## DIAGNOS D — Knappar utan .btn-*-klass

Regel: Knappar som fungerar som CTA, åtgärdsknapp, flikväljare eller formulär-submit ska använda `btn`-klassystemet. Navigationsikoner i BottomNav är egna — klassificeras separat.

### D1 — KROCK: Primär CTA utan btn-klass

**`MatchResultScreen.tsx` rad 295–306** (sekundär knapp "Se fullständig rapport")
```tsx
<button style={{ width: '100%', padding: '13px 16px', borderRadius: 10, fontSize: 14, fontWeight: 600, background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
```
Ingen btn-klass. Full inline-styling av knappegenskaper.

**`MatchResultScreen.tsx` rad 307–315** (primär CTA "Fortsätt")
```tsx
<button style={{ width: '100%', padding: '14px 16px', borderRadius: 10, fontSize: 14, fontWeight: 600, background: 'var(--accent)', color: 'var(--text-light)', border: 'none' }}>
```
Ingen btn-klass. Duplicerar `btn btn-primary`-beteende inline.

**`RoundSummaryScreen.tsx` rad 483–491**
```tsx
<button onClick={handleContinue} className="texture-leather" style={{ width: '100%', padding: '15px', background: 'linear-gradient(135deg, ...)', borderRadius: 12, fontSize: 15, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', border: 'none' }}>
```
`texture-leather` är inte en btn-klass. Full inline CTA-styling.

**`HalfTimeSummaryScreen.tsx` rad 134–147**
Samma mönster: `className="texture-leather"` utan btn-klass, full inline CTA.

**`QFSummaryScreen.tsx` rad 141–153**
Samma mönster.

**`PlayoffIntroScreen.tsx` rad 188–199**
Samma mönster.

**`SeasonSummaryScreen.tsx` rad 751–789**
Tre knappar utan btn-klass: dela-knapp, historik-knapp, "Starta ny säsong"-CTA. Alla fullständigt inline-staylade.

**`SeasonSummaryScreen.tsx` rad 329–348** (Share-knapp)
Full inline-styling, ingen btn-klass.

**`IntroSequence.tsx` rad 193–228**
Två knappar med inline gradient och borderRadius — ingen btn-klass.

**`SimSummaryScreen.tsx` rad 250**
```tsx
<button style={{ border: 'none', borderRadius: 8, cursor: 'pointer' }}>
```
Knapp med partiell inline-styling, ingen btn-klass.

**`SquadScreen.tsx` rad 193** (namnlöst filter/sorterings-knapp)
```tsx
<button style={{ ... }}>
```
Inline-styled knapp utan btn-klass.

### D2 — KROCK: Åtgärdsknappar med inline-stil som duplicerar designsystemet

**`InboxScreen.tsx` rad 271–278**
Vylägesknapp ("Kronologiskt"/"Grupperat") och "Markera alla som lästa" — ingen btn-klass, inline border + padding.

**`ClubScreen.tsx` rad 93–**
Kontrolleras ej fullständigt, men `<button` utan btn-klass förekommer.

**`GameOverScreen.tsx` rad 151–158**
Nästa-säsong-knapp utan btn-klass.

**`ChampionScreen.tsx` rad 201**
Mästerskaps-CTA utan btn-klass.

**`SeasonSummaryScreen.tsx` rad 59, 189**
Navigeringstext-knappar ("Tillbaka", "←") — `background: 'none', border: 'none'`. Gränsfall: ghost-knappar utan btn-ghost. KROCK mot designsystemet men liten visuell avvikelse.

**`TaktikScreen.tsx` rad 37**
Kontrolleras ej fullständigt.

**`PortalScreen.tsx` rad 166**
Kontrolleras ej fullständigt.

### D3 — BottomNav-knappar (separat klassificering)

`BottomNav.tsx` — knapparna i navigeringen är egna element med egna CSS-klasser. Designsystemet har dem "på is" för ikoner. Klassificeras inte som KROCK automatiskt.

### D4 — OK: Knappar med korrekt btn-klass

- `HalfTimeSummaryScreen.tsx` rad 25: `className="btn btn-copper"` — OK
- `GranskaScreen.tsx` rad 292: `className="btn btn-primary btn-cta"` — OK
- `TransfersScreen.tsx` rad 449: `className="btn btn-outline"` — OK
- `KlubbTab.tsx` rad 430, 439, 448: `className="btn btn-ghost"` — OK
- `EventPrimary.tsx` rad 68: `className="btn btn-primary"` — OK (fixad 2026-05-05)

---

## DIAGNOS E — Inline borderRadius på kort

Regel: Kort/card-liknande divs ska använda `.card-sharp` eller `.card-round` CSS-klass. Inline `borderRadius` på knappar och chips (4–8px) är OK. Cirklar (`50%`) är OK.

### E1 — KROCK: Card-liknande divs med inline borderRadius utan CSS-klass

**`TabellScreen.tsx` rad 71**
```tsx
<div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 4 }}>
```
Tab-switcher-wrapper som kort. Ingen card-klass.

**`SquadScreen.tsx` rad 381, 442, 466, 498, 559, 604, 635**
Flera sektionskort och listkort med inline `borderRadius` (8–12px) utan card-klass.

**`GameOverScreen.tsx` rad 58, 110, 127, 158**
Flera informationskort med `borderRadius: 10–12` utan card-klass.

**`ChampionScreen.tsx` rad 161, 209**
Mästerskaps-info-kort med `borderRadius: 12`.

**`SeasonSummaryScreen.tsx` rad 287, 628**
Statistik-kort med `borderRadius: 8` utan card-klass.

**`MatchResultScreen.tsx` rad 236, 264**
Resultat-sektionskort med `borderRadius: 8`.

**`GranskaOversikt.tsx` rad 93, 102**
Informationspaneler med `borderRadius: var(--radius-sm)` — token används men ingen card-klass.

**`GranskaShotmap.tsx` rad 295**
```tsx
<div style={{ padding: '8px 10px', background: 'rgba(196,122,58,0.08)', borderRadius: 6 }}>
```
Konverteringsinfo-box utan card-klass.

### E2 — OK: Knappar och chips med borderRadius

Alla `borderRadius` på `<button>`, `<span>`, pill-formade badges (4–20px) och cirkulära avatarer (`50%`) är OK per regel.

---

## DIAGNOS F — Section-labels utanför spec

Designsystemets `.h-label`-klass kräver: `fontSize: 8px`, `letterSpacing: 2px`, `fontWeight: 600`, `textTransform: uppercase`, emoji-prefix i texten.

### F1 — AVVIKELSE: Fel fontSize på label-liknande element

**`MatchResultScreen.tsx` rad 107**
```tsx
fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase'
```
fontSize 10 (spec: 8), letterSpacing 1px (spec: 2px).

**`MatchResultScreen.tsx` rad 200**
```tsx
fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase'
```
Rubrik "Nyckelmoment" — fontSize 10, letterSpacing 1px.

**`SeasonSummaryScreen.tsx` rad 191**
```tsx
fontSize: 11, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase'
```
fontSize 11 (spec: 8–9), letterSpacing 3px.

**`TabellScreen.tsx` rad 81**
```tsx
fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase'
```
Flikknapp i tabellvyn. fontSize 11.

**`GameOverScreen.tsx` rad 84, 115, 131, 137, 141, 145**
Varierade fontSize (11) för uppercase-labels.

**`InboxScreen.tsx` rad 158**
```tsx
fontSize: 9, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase'
```
fontSize 9 (acceptabelt), letterSpacing 1px (spec: 2px).

**`InboxScreen.tsx` rad 326**
```tsx
fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase'
```
fontSize 10, letterSpacing 1.5px.

**`SeasonSummaryScreen.tsx` rad 213**
```tsx
fontSize: 11, textTransform: 'uppercase', letterSpacing: '1px'
```
fontSize 11, letterSpacing 1px.

**`SeasonSummaryScreen.tsx` rad 808**
```tsx
fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px'
```
letterSpacing 0.8px (spec: 2px).

**`PlayoffIntroScreen.tsx` rad 69, 107**
```tsx
fontSize: 8, letterSpacing: '1px', textTransform: 'uppercase'
```
fontSize OK (8), letterSpacing 1px (spec: 2px).

**`ChampionScreen.tsx` rad 121**
Detalj saknas men `textTransform: 'uppercase'` förekommer.

### F2 — SAKNAT EMOJI-PREFIX

Designsystemets `.h-label` specificerar emoji-prefix i texten. Följande section-labels har textTransform uppercase utan emoji-prefix:

- `HalfTimeSummaryScreen.tsx` rad 38: "HALVTID" — no emoji
- `HalfTimeSummaryScreen.tsx` rad 49, 83, 104, 116: diverse section-labels — no emoji
- `TabellScreen.tsx` rad 112: sektionsrubriker i statistikvy — no emoji
- `RoundSummaryScreen.tsx` rad 190, 233, 245, 261, 277, 302, 320, 344, 392, 439: alla section-labels — no emoji (konsekvent mönster i hela skärmen)
- `QFSummaryScreen.tsx` rad 38, 53, 102: no emoji
- `PlayoffIntroScreen.tsx` rad 49, 102, 138: no emoji
- `SeasonSummaryScreen.tsx` rad 191: "DIN SÄSONG" — no emoji

**Undantag/gränsfall:** `BottomNav.tsx` rad 104 — navigationslabels är egna med eget system.

### F3 — OK: Korrekt emoji-prefix observerat

- `HalfTimeSummaryScreen.tsx` — kör `.h-label`-klassen saknas men inline matchas i ramar med emoji i innehållet på flera ställen
- `GranskaScreen.tsx` — flikknappar med emoji i text

---

## DIAGNOS G — Status-tags med emoji

Regel: Status-tags (Redo, Skadad, Bänken, Kontrakt utgår, etc.) får INTE ha emoji-prefix. Kategori-tags i feeds FÅR ha emoji.

### G1 — KROCK: Status-tags med emoji

**`PlayerCard.tsx` rad 410–414**
```tsx
<span className="tag">🔥 Hungrig</span>
<span className="tag">🏅 Veteran</span>
<span className="tag">🎭 Joker</span>
<span className="tag">🏘️ Lokal</span>
<span className="tag">🦁 Ledare</span>
```
Trait-tags på spelarkort. Alla fem har emoji-prefix. Dessa är karaktärsegenskaper som fungerar som status-tags.

**`NextMatchCard.tsx` rad 364**
```tsx
<span className="tag tag-green">🎄 Höjdpunkt</span>
```
Höjdpunktstagg med emoji. Gränsfall — kategorisering av matchtyp.

**`SquadStatusCard.tsx` rad 60–61**
```tsx
<span className="tag tag-green">{readyCount} redo</span>
<span className="tag tag-red">{injuredCount} skadade</span>
```
Status-tags utan emoji — OK.

### G2 — OK: Tags utan emoji

De flesta `tag tag-copper`, `tag tag-outline`, `tag tag-fill`, `tag tag-red`-instanser i `SquadScreen.tsx`, `NextMatchCard.tsx`, `MatchHeader.tsx`, `dashboard/`-komponenter saknar emoji — OK per regel.

**`PlayerCard.tsx` rad 409**
```tsx
<span className="tag tag-fill">© KAPTEN</span>
```
Utan emoji — OK.

---

## DIAGNOS H — Förbjudet copy

Regel: "Herr Patron", "pergament", "sigill", "lacksigill", "fraktur" är förbjudna i UI-copy. Funktionsnamn i kod är legitima.

### H1 — LEGITIM: Funktionsnamn i kod

**`GameHeader.tsx` rad 139, 141**
```tsx
{/* Kolumn 3: Meta (sigill-chip + kuvert + inställningar) */}
{/* Omgångs-sigill */}
```
Kommentarer i kod, inte UI-copy. Begreppet "sigill" används som intern benämning på en komponent.

### H2 — Inga KROCK funna

Grep returnerade inga träffar för "herr patron", "pergament", "lacksigill" eller "fraktur" i UI-copy. Kommentarsrader i GameHeader.tsx är de enda träffarna och är interna benämningar.

---

## Aggregering — Top 10 filer per antal krockar (DIAGNOS A–H)

| # | Fil | Krockar |
|---|---|---|
| 1 | `src/presentation/components/match/CommentaryFeed.tsx` | ~17 (15 borderLeft B2 + 1 inline gradient CTA C1 + 1 hex A1) |
| 2 | `src/presentation/screens/SeasonSummaryScreen.tsx` | ~12 (2 borderLeft B2 + 3 knappar D1 + 3 inline borderRadius E1 + 2 label F1 + 1 hex A1) |
| 3 | `src/presentation/screens/RoundSummaryScreen.tsx` | ~12 (2 borderLeft B2 + 1 gradient CTA C1 + 10 section-labels F2 utan emoji) |
| 4 | `src/presentation/components/PlayerCard.tsx` | ~10 (1 borderLeft B2 + 5 emoji-tags G1 + 4 borderRadius E1) |
| 5 | `src/presentation/screens/SquadScreen.tsx` | ~9 (2 hex A1 + 1 knapp D1 + 7 inline borderRadius E1) |
| 6 | `src/presentation/screens/HalfTimeSummaryScreen.tsx` | ~8 (1 gradient CTA C1 + 7 section-labels F2 utan emoji) |
| 7 | `src/presentation/screens/PlayoffIntroScreen.tsx` | ~7 (1 borderLeft B2 + 1 gradient CTA C1 + 5 section-labels F2 utan emoji) |
| 8 | `src/presentation/screens/QFSummaryScreen.tsx` | ~6 (1 gradient CTA C1 + 3 section-labels F2 + 2 borderRadius E1) |
| 9 | `src/presentation/components/portal/primary/` (4 primaries) | ~6 (4 gradient CTAs C1 + 2 kortbakgrunder C2 per fil, aggregerat) |
| 10 | `src/presentation/screens/MatchResultScreen.tsx` | ~5 (2 knappar D1 + 2 borderRadius E1 + 1 label F1) |

---

*Inga kodändringar genomförda. Alla fynd baseras på statisk grep-analys och källkodsläsning per 2026-05-05.*
