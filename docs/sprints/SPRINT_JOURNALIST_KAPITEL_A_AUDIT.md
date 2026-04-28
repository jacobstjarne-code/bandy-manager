# Sprint Journalist Kapitel A — audit

**Commit:** 2b41a8f  
**Datum:** 2026-04-28

---

## Punkter i spec

- [x] **A1 journalistVisibilityService** — Pure functions: `getJournalistCardSeverity`, `shouldShowJournalistCard`, `detectRelationshipEvent`, `getJournalistAttendanceModifier`, `getJournalistCommunityModifier`. Verifierat via 27 unit-tester (alla gröna).
- [x] **A2 journalistRelationshipScene.ts** — `EVENT_TO_SUMMARY` med 3 strängar (`refused_press`, `good_answer`, `bad_answer`), `buildJournalistSceneData` returnerar name/outlet/relationship/severity/statusText/memories/outlookText. Verifierat: bygger korrekt data från `game.journalist`.
- [x] **A3 JournalistSecondary.tsx** — Portal-kort med cold/warm variant. Pixel-jämförelse (se nedan): 3 avvikelser hittades och fixades.
- [x] **A4 JournalistRelationshipScene.tsx** — Fullskärmsscen med genre-tag, namn+outlet, 6px relationsbar (gradient), minneslista, outlook-block, SceneCTA. Pixel-jämförelse: 1 avvikelse fixad.
- [x] **A5 Narrative.ts utökning** — `lastTriggeredRelationship?: number` lagt till på `Journalist`-interfacet.
- [x] **A6 Scene.ts utökning** — `'journalist_relationship'` lagt till i `SceneId`-union.
- [x] **A7 SceneScreen.tsx** — Nytt case för `journalist_relationship` → `JournalistRelationshipScene`.
- [x] **A8 gameFlowActions.ts** — `triggerJournalistScene()` action som sätter `pendingScene`.
- [x] **A9 initCardBag.ts** — `journalist_card` (tier: secondary, weight: 65) med trigger `shouldShowJournalistCard`.
- [x] **A10 roundProcessor.ts** — Inbox-events vid gräns 20 (`broken_under_20`) och 75 (`recovered_above_75`), uppdaterar `lastTriggeredRelationship`.
- [x] **A11 economyService.ts** — `getJournalistAttendanceModifier` applicerat i `calcAttendance()` och `calcRoundIncome()`.
- [x] **A12 communityProcessor.ts** — `getJournalistCommunityModifier` applicerat till `csBoost`.
- [x] **A13 global.css** — Tokens `--cold: #4a6680` och `--warm: #8c6e3a` tillagda.

---

## Pixel-jämförelse: JournalistSecondary.tsx

**Avvikelser mot `journalist_card_mockup.html`:**

| Del | Mock | Impl (före fix) | Fix |
|---|---|---|---|
| Border | `1px solid var(--border)` | `1px solid var(--bg-leather)` | Fixat → `var(--border)` |
| Tag-position | Egen rad under name-row | I samma rad som namn+emoji | Fixat → separat `<span>` |
| Name-row layout | `justify-content: space-between` | Saknade space-between | Fixat → tillagt |

**Korrekt efter fix:**
- Background: `var(--bg-portal-surface)` (portal-kontextual, ersätter `var(--bg-surface)` från mock — medvetet val)
- Border: `1px solid var(--border)` + `2px solid var(--cold|--warm)` vänsterstipe ✓
- Name: Georgia 12px 600, `var(--text-light)` ✓
- Emoji: 11px, höger i raden ✓
- Tag: 8px 700 uppercase, letter-spacing 1.5px, cold/warm-bakgrund ✓ (separat rad)
- Recent text: 10px italic `var(--text-muted)` ✓
- Relationsbar: 3px track, `var(--bg-dark)`, fill `var(--cold|--warm)` ✓
- Nummer: Georgia 9px `var(--text-muted)` ✓

---

## Pixel-jämförelse: JournalistRelationshipScene.tsx

**Avvikelser mot mock `.scene-frame`:**

| Del | Mock | Impl (före fix) | Fix |
|---|---|---|---|
| Gap genre→namn | Scene-header top-padding 6px | Saknades (0px) | Fixat → `<div style={{ padding: '6px 24px 0' }}>` |

**Korrekt efter fix:**
- Background: `var(--bg-scene-deep)` (#08060a = mock:s `--bg-deepdark`) ✓
- Genre-tag: 18px 0 8px padding, 9px 600, letter-spacing 4, accent 0.7 opacity ✓
- Scene-header: 6px top-gap + 24px sidor ✓
- Namn: Georgia 28px 700 `var(--text-light)` lineHeight 1.1 ✓
- Outlet: Georgia 13px italic `var(--text-light-secondary)` ✓
- Relationsbar: 6px höjd, gradient cold/warm, transitions ✓
- Memory-dot: 8×8 rund, success/danger/muted ✓
- Memory-text: Georgia 13px `var(--text-light)` ✓
- Outlook-block: `var(--bg-scene)` (#1a1612) — medvetet val; mock:s `var(--bg-leather)` = #1f1a14 i mock men #3D3A32 i appen (för ljus för scen-kontext)
- SceneCTA: återanvänd komponent ✓

---

## Notering: EVENT_TO_SUMMARY täckning

Spec nämnde fler event-strängar (t.ex. `big_win_interview`). Implementationen täcker de 3 strängar som faktiskt loggas i presskonferens-systemet: `refused_press`, `good_answer`, `bad_answer`. Övriga är inte implementerade i mekaniker. Utökning behövs om/när fler presskonferens-utfall läggs till.

---

## Kod-verifiering

- Build: ✅ 2.06s clean
- Tester: ✅ 2567/2567 (inkl 27 nya unit-tester för journalistVisibilityService)
- Hårdkodade hex: Inga i nya filer (gradient i JournalistRelationshipScene — direkta hexvärden i gradient-string, accepterat som kommenterat i spec)

## Kvarstående

- EVENT_TO_SUMMARY utökning: väntar på fler presskonferens-utfall
- Playtest av journalist-scen: ännu inte verifierat i live-spel
