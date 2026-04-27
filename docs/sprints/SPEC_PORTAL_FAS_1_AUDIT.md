# SPEC_PORTAL_FAS_1 — audit

## Punkter i spec

- [x] **Steg 1 — Domänlager** (`portalBuilder.ts`, `seasonalTone.ts`, triggers)
  Verifierat via kod-simulation: `buildPortal()` returnerar 1 primary, ≤3 secondary, ≤4 minimal. `makeSeed(game)` = `season*100 + matchday`. Seasonal tone interpolerar korrekt (hex-format, vinter mörkare än höst).

- [x] **Steg 2 — PortalScreen + NextMatchPrimary + AppRouter-flagga**
  Verifierat via kod: `PortalScreen` renderar `Primary`, `PortalSecondarySection`, `PortalMinimalBar`. `DashboardOrPortal` i `AppRouter.tsx` väljer rätt skärm per `game.portalEnabled`. `initCardBag()` anropas på modul-nivå.

- [x] **Steg 3 — Secondary-tier (6 kort)**
  TabellSecondary, EkonomiSecondary, InjuryStatusSecondary, OpenBidsSecondary, OpponentFormSecondary, KlackenSecondary. Alla importerar `CardRenderProps` från `../portalTypes` (inte från domain). Grid 2-kolumner, `bg-surface` bakgrund.

- [x] **Steg 4 — Minimal-tier (4 kort)**
  SquadStatusMinimal, FormStatusMinimal, KlackenMoodMinimal, EconomyMinimal. `display: flex; justify-content: space-around`.

- [x] **Steg 5 — initCardBag.ts**
  16 kort registrerade med rätt tier/weight/triggers. `initialized`-flagga förhindrar dubbel-init. `resetCardBag()` tillagd för test-isolation.

- [x] **Steg 6 — Resterande primärkort**
  DerbyPrimary: `linear-gradient(135deg, var(--bg-elevated) 0%, rgba(160,72,72,0.15) 100%)`, `border: 1px solid var(--danger)`. SMFinalPrimary: `rgba(212,164,96,0.20)`, `var(--gold)`, `padding: 14px 16px`. TransferDeadlinePrimary, PatronDemandPrimary, EventPrimary — alla under 150 rader.

- [x] **Steg 7 — Integration-tester + verifiering**
  10 tester i `src/__tests__/PortalScreen.test.ts`:
  - Rutinmatch → `next_match` (NextMatchPrimary) ✓
  - Derbymatch (club_soderfors vs club_skutskar) → `next_match_derby` (DerbyPrimary) ✓
  - SM-final (isFinaldag = true) → `next_match_smfinal` (SMFinalPrimary) ✓
  - Kritisk händelse → `event_critical` (EventPrimary) ✓
  - Layout invarianter med riktiga kort ✓
  - Seasonal tone CSS-varnamn, vintermörker, determinism ✓

## Kod-verifiering

- 2455/2455 grönt (10 nya tester tillagda)
- Build: ren (npm run build)
- Stresstest: ej kört i denna sprint (ingen matchmotor-ändring)

## Arkitekturregler uppfyllda

- Inga hårdkodade hex-färger i portal/-komponenter: `grep '#[0-9a-fA-F]{3,8}' src/presentation/components/portal/` → 0 träffar
- Primary-komponenter importerar ej från dashboardCardBag/portalBuilder: `grep 'dashboardCardBag\|portalBuilder' src/presentation/components/portal/primary/` → 0 träffar
- Filstorlekar: max SMFinalPrimary (144 rader), alla övriga under 130

## Edge-cases verifierade

- **Ingen nästa match (tom fixtures-array):** `getNextManagedFixture()` returnerar null → `nextMatchIsDerby`, `nextMatchIsSMFinal`, `nextMatchIsHome` returnerar false → fallback `next_match` väljs via `alwaysTrue`
- **Eliminerat lag i slutspel:** `getNextManagedFixture` filtrerar bort matchday > 26 om `bracket.series[*].loserId === managedId`
- **Dubbel-init:** `initCardBag()` skyddas av `initialized`-flagga, idempotent
- **Derby + SM-final (båda triggers true):** SM-final (weight 100) slår derby (weight 80) — rätt prioritet

## Ej verifierat (kräver manuell playtest)

- Pixeljämförelse mot `docs/mockups/portal_bag_mockup.html` vid 430px bredd
- Seasonal tone CSS-vars syns visuellt i appen (bakgrundsfärg ändras med datum)
- `MoreInfoFold`-knappen (TODO kvar i PortalScreen — ej i spec)
- KlackenSecondary `gridColumn: 'span 2'` — behöver visuell verifiering

## Commits i denna sprint

```
ea82674 feat: SPEC_PORTAL_FAS_1 steg 1 — portalBuilder + triggers + tester
6634037 feat: SPEC_PORTAL_FAS_1 steg 2 — NextMatchPrimary + PortalScreen (feature flag)
79a42e5 feat: SPEC_PORTAL_FAS_1 steg 3 — secondary-tier
16eef2c feat: SPEC_PORTAL_FAS_1 steg 4 — minimal-tier
bd1c9bf feat: SPEC_PORTAL_FAS_1 steg 6 — DerbyPrimary + SMFinalPrimary + deadline/patron/event
01fc3dc feat: SPEC_PORTAL_FAS_1 steg 7 — integration-tester + verifiering
```

(Steg 5 — initCardBag — inkluderades i steg 6-commit.)

## Nya lärdomar till LESSONS.md

- **Circular import i bag-of-cards:** Domain-service (dashboardCardBag) definierar ComponentType-interface; presentation-komponenter definierar identisk `CardRenderProps` lokalt i `portalTypes.ts` och importerar därifrån. `initCardBag.ts` är det enda stället som korsar lagergränserna. Mönster fungerar och förhindrar import-loopar.
- **Fixture har inget `date`-fält:** Alltid beräkna via `getRoundDate(fixture.season, fixture.roundNumber)` från `scheduleGenerator`.
- **Player.currentAbility** (inte `rating`) — redan i LESSONS.md men upprepade sig här.
