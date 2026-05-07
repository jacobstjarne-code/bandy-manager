# Scen-typografi — designsystem-utvidgning

**Datum:** 2026-05-07
**Spec-typ:** Designsystem-utvidgning (nya klasser)
**Bakgrund:** ClubSelection drift-sweep visade systemiskt gap — befintliga `.h-*` och `.btn-*` är optimerade för ljus dagsljusvy. Scen-skärmar (mörk bakgrund) saknar formella tokens. Resultat: inline-styling överallt i scen-mappen, drift mot designsystemet, inkonsistens mellan scener.

## Varför nu

ArrivalScene + BoardMeetingScene + ClubSelectionScreen + alla scener i `src/presentation/screens/scenes/` (CoffeeRoomScene, JournalistRelationshipScene, SeasonSignatureRevealScene, SundayTrainingScene, CupIntroScene, CupFinalIntroScene, SMFinalVictoryScene) delar visuellt språk:

- Mörk bakgrund (`var(--bg-portal)` eller `var(--bg-scene)`)
- Genre-label överst (copper letter-spaced)
- Speaker-label (copper letter-spaced, mindre än genre)
- Quote/body (Georgia, ljus text)
- Outline-CTA (transparent + accent border + ljus text)
- Helper/setting-text (Georgia italic, dimmade tokens)

Inget av detta är formaliserat. Varje scen har eget inline-styling. Drift är garanterad över tid.

## Scen-tokens att etablera

### Scen-bakgrund

```css
:root {
  --bg-scene: var(--bg-portal);  /* alias för tydlighet i scen-kontext */
}
```

### Scen-typografi

```css
/* Genre-label — överst på scenen, persistent */
.h-scene-genre {
  font-family: var(--font-body);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: var(--accent);
  opacity: 0.7;
}

/* Speaker-label — identifierar talande karaktär */
.h-scene-speaker {
  font-family: var(--font-body);
  font-size: 9px;        /* eller 10px — synka med BoardMeetingScene-existing */
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--accent);
  opacity: 0.85;
}

/* Citat / dialog-body */
.h-scene-quote {
  font-family: Georgia, serif;
  font-size: 14px;       /* eller 16px för längre repliker — välj en grund-storlek */
  color: var(--text-light);
  line-height: 1.6;
}

/* Setting-prolog / scen-introduktion */
.h-scene-setting {
  font-family: Georgia, serif;
  font-style: italic;
  font-size: 13px;
  color: var(--text-light-secondary);
  line-height: 1.6;
}
.h-scene-setting strong {
  font-style: normal;
  color: var(--text-light);
  font-weight: 600;
  font-size: 14px;
  display: block;
  margin-bottom: 6px;
}

/* Helper-text — små italic på mörk bg (klubbval helper, scen-anvisning, etc.) */
.h-scene-helper {
  font-family: Georgia, serif;
  font-style: italic;
  font-size: 10px;        /* mindre än .h-body */
  color: var(--text-light-secondary);
  opacity: 0.7;
  line-height: 1.5;
}

/* Scen-titel — för scener med distinkt rubrik (t.ex. "Välj din klubb") */
.h-scene-title {
  font-family: Georgia, serif;
  font-size: 16px;       /* mindre än .h-display 22px+ */
  font-weight: 400;
  color: var(--text-light);
  letter-spacing: 0.5px;
}
```

### Scen-knappar

```css
/* Outline-CTA — primär scen-knapp */
.btn-scene-cta {
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: 1.5px solid var(--accent);
  color: var(--text-light);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: var(--shadow-btn);
  transition: filter 0.15s;
}
.btn-scene-cta:hover { filter: brightness(1.1); }

/* Ghost-knapp på mörk bg — för "tillbaka", "visa alla", sekundära länkar */
.btn-scene-ghost {
  background: transparent;
  border: 0;
  color: var(--accent);
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 6px 10px;
  text-decoration: none;
}
.btn-scene-ghost:hover { color: var(--accent-light); }
```

### Modifier

```css
/* Dimmed-state — för "scenens minne"-mönster (ArrivalScene ackumulativ, etc.) */
.scene-dimmed {
  opacity: 0.4;
  transition: opacity 0.5s ease;
}
```

## Implementationsplan

### Steg 1 — etablera tokens i `colors_and_type.css`

Code lägger till alla `.h-scene-*` + `.btn-scene-*` + `.scene-dimmed` i:
1. `design-system/colors_and_type.css` (källan)
2. `src/styles/global.css` (runtime — porta över) eller alternativt importera `colors_and_type.css` om arkitekturen tillåter

### Steg 2 — synka existerande scen-komponenter

För varje scen-komponent, ersätt inline-styling med scen-klasserna:

- `ArrivalScene.tsx` (efter stegvis-ackumulativ-revidering)
- `BoardMeetingScene.tsx`
- `CoffeeRoomScene.tsx`
- `JournalistRelationshipScene.tsx`
- `SeasonSignatureRevealScene.tsx`
- `SundayTrainingScene.tsx`
- `CupIntroScene.tsx`
- `CupFinalIntroScene.tsx`
- `SMFinalVictoryScene.tsx`
- `ClubSelectionScreen.tsx` + `OffersView.tsx` + `AllClubsView.tsx` (5 mismatch-punkter blir då fixade)

### Steg 3 — verifiera att existing rendering inte förändras

Snapshot-tester per scen. Inga visuella regressioner. Om en scen råkar ha **avvikande typografi** (t.ex. SMFinalVictoryScene har större text), behåll avvikelse som scen-specifik override istället för att tvinga den i scen-tokenen.

## Inte i scope

- Layout-ramverk för scener (panel-system, grid, etc.) — tokens är typografi+knappar, inte layout
- Animation/transition-protokoll mellan scener
- Backdrop-bilder eller miljö-illustrationer
- Audio-trigger per scen-typ

## Konsekvens för ClubSelection-rapporten

5 mismatch-punkterna blir lösta:
- "Visa alla" / "← Tillbaka" → `.btn-scene-ghost`
- "Välj din klubb"-titel → `.h-scene-title`
- helper-text → `.h-scene-helper`
- italic-underrubrik → `.h-scene-helper` (eller egen variant om för olika)

## Status efter landning

Designsystemet får ett scen-typografi-system parallellt med befintligt dagsljus-system. Alla 9+ scen-komponenter migrerar till klasserna. ClubSelection-driften 100% adresserad. Framtida scener (när de byggs) följer mönstret automatiskt.

Detta är **städning av teknisk skuld från designsystem-introduktionen** — samma kategori som `.h-label`-fyndet (commit 77c4398). Designsystemet definierades initialt för dagsljusvyer; scenern-systemet utvecklades separat utan formell tokenisering. Nu konvergerar de.
