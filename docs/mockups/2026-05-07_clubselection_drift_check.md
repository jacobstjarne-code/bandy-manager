# ClubSelectionScreen — designsystem-drift-checklista

**Datum:** 2026-05-07
**Spec-typ:** Drift-inventering (snabb Code-uppgift, ingen design-revidering)

## Bakgrund

ClubSelectionScreen.tsx orchestrerar `OffersView` och `AllClubsView` via internal `view`-state. Båda children-komponenter ligger i `src/presentation/components/clubselection/`. Skärmen har inte verifierats mot designsystemet i denna session.

## Drift-inventering

Code skannar och rapporterar:

1. **`OffersView.tsx`:**
   - Använder `.h-label` för section-labels? Eller inline-styles?
   - `.btn-primary`/`.btn-cta`/`.btn-ghost` för knappar? Eller andra klasser (`btn-copper`-typ legacy)?
   - Använder `.card-sharp` eller `.card-round` för club-cards? Eller egen styling?
   - Färger via tokens (`--accent`, `--text-primary`) eller hardkodade hex?
   - Typography via `.h-card`/`.h-body` eller inline?

2. **`AllClubsView.tsx`:** samma checklista.

3. **`ClubSelectionScreen.tsx` wrapper:**
   - "STARTAR..."-loading-state använder inline-styles. Verifiera om text-token är korrekt (`--text-muted`) och om standard `.h-label`-format kunde användas.

4. **`OfferCard.tsx`** (om finns) — samma checklista.

## Förväntad output

Code rapporterar en kort drift-tabell:

| Komponent | Element | Existing | Förväntat | Diff |
|---|---|---|---|---|
| OffersView | section-label | inline | `.h-label` | drift |
| OffersView | club-card | inline | `.card-sharp` eller `.card-round` | OK/drift |
| ... |

## Åtgärd

Liten drift (< 5 ställen): Code fixar direkt med samma pattern som halvvägs-putsning (commit 77c4398). Ingen ny mock behövs.

Stor drift (> 5 ställen eller fundamentala layoutfrågor): Code rapporterar fynd, Opus skriver fix-spec eller mock vid behov.

## Tonal-anteckning

ClubSelectionScreen är funktionellt en gateway — tre offers + "se alla". Inga narrative repliker, ingen scenografi. Designsystem-konformitet är primärt om visuell konsekvens med övriga skärmar (Portal, Klubb-tab, Squad). Inget mer.

## Status

Drift-inventering är låg-prio men "billig" att göra parallellt med ArrivalScene-revideringen. Code kan ta båda i samma commit-runda om det passar.
