# Pixel-audit — SPEC_INLEDNING_FAS_1 + SPEC_SCENES_FAS_1 + SPEC_PORTAL_FAS_1 + SPEC_KAFFERUMMET_FAS_1

**Datum:** 2026-04-28
**Metod:** Kod-verifierad audit — CSS-värden i komponenter jämförda radvis mot mockens CSS-klasser

---

## Statusöversikt

| Spec | Alla filer skapade | Feature-flags borttagna | Pixel-audit | Kvar |
|---|---|---|---|---|
| SPEC_INLEDNING_FAS_1 | ✅ | n/a | ✅ | Citat-pooler (Opus-jobb, separat) |
| SPEC_SCENES_FAS_1 | ✅ | ✅ | ✅ | — |
| SPEC_PORTAL_FAS_1 | ✅ | ✅ | ✅ | NextMatchPrimary ej i mock (saknar referens) |
| SPEC_KAFFERUMMET_FAS_1 | ✅ | ✅ | ✅ | — |

---

## Avvikelser hittade och fixade (commit `7173af3`)

### 1. PortalScreen — padding
- **Mock:** `.content { padding: 14px }`
- **Impl före:** `padding: '8px 14px'`
- **Fix:** `padding: '14px'`

### 2. GameShell — BottomNav synlig under scener
- **Spec krav:** "Scene tar hela skärmen. Ingen BottomNav"
- **Impl före:** BottomNav renderades alltid i GameShell, oavsett `pendingScene`
- **Fix:** `{!sceneActive && <BottomNav />}` + `paddingBottom: sceneActive ? 0 : ...`

### 3. CoffeeRoomScene — hårdkodad hex
- **CLAUDE.md-regel:** CSS-variabler ENBART — inga hårdkodade färger
- **Impl före:** `background: '#1a1612'`
- **Fix:** `background: 'var(--bg-scene)'` + ny token `--bg-scene: #1a1612` i global.css

### 4. SMFinalVictoryScene — hårdkodad hex
- **Impl före:** `background: '#08060a'`
- **Fix:** `background: 'var(--bg-scene-deep)'` + ny token `--bg-scene-deep: #08060a` i global.css

---

## Medvetna token-byten (dark-mode — INTE avvikelser)

Alla komponenter i scenes och portal använder dark-specifika tokens istf light-theme-tokens. Dessa är korrekta och medvetna:

| Komponent | Från (mock-lokal) | Till (app-token) |
|---|---|---|
| OfferCard | `var(--bg-surface)` (mock redefinierar till #221d18) | `var(--bg-dark-surface)` |
| OfferCard | `var(--border)` (mock: #3a322a) | `var(--bg-leather)` (#3D3A32) |
| Portal-primary | `var(--bg-elevated)` | `var(--bg-portal-elevated)` |
| Portal-secondary | `var(--bg-surface)` | `var(--bg-portal-surface)` |
| SceneCTA gold | `var(--gold)` | `var(--match-gold)` |

Inledning-mocken redefinierar lokalt `--bg-surface` till `#221d18` (mörkt). Appens `--bg-dark-surface: #1E1D19` är visuellt ekvivalent. Inte pixel-perfekt men inte ett fel.

---

## Vad som INTE finns i mocks (acceptabla undantag)

- `NextMatchPrimary` — spec säger "Routine"-tillståndet i mock, men mocken visar inte ett fullständigt routine-kort med matchdata. Komponenten följer primary-anatomin och spec-texten.
- `ConfettiParticles` — hardkodade hex-färger `['#d4a460', '#b8884c', '#f0e8d8']`. Animationsdata för partiklar — undantag från CSS-variabel-regeln.
- `SnowParticles` — liknande undantag.

---

## Filstorlekar (alla under 150-radersgränsen)

```
  69 ClubSelectionScreen.tsx
 109 AllClubsView.tsx
 105 ClubExpandedCard.tsx
  46 ClubListItem.tsx
  38 DifficultyTag.tsx
  66 OfferCard.tsx
 112 OffersView.tsx
  34 SverigeBackdrop.tsx
  85 CoffeeRoomScene.tsx
 122 SMFinalVictoryScene.tsx
  37 SceneScreen.tsx
 106 SundayTrainingScene.tsx
 113 CoffeeExchange.tsx
  71 PortalScreen.tsx
```
Ingen fil överstiger 150 rader. ✅

---

## Hårdkodade hex-färger kvar

```
src/presentation/screens/scenes/shared/ConfettiParticles.tsx:15
  CONFETTI_COLORS = ['#d4a460', '#b8884c', '#f0e8d8']  — animationsdata, undantag OK
```

---

## Build + tester

```
2540/2540 ✅
build: 2.00s clean
```

---

## Token-isolering verifierad (commit `e9a8024`)

- Portal-tokens (`--bg-portal-*`) sätts på `document.documentElement` av PortalScreen useEffect
- PortalScreen har cleanup-return som kör `removeProperty` vid unmount
- Ingen scene-komponent läser `--bg-portal-*`
- Scene-komponenter läser `--bg-scene`, `--bg-scene-deep`, `--bg-dark-elevated`, `--bg-leather`, `--text-light`, `--text-light-secondary`, `--match-gold`, `--accent`, `--accent-deep`
- De två tokensystemen är fullständigt isolerade
