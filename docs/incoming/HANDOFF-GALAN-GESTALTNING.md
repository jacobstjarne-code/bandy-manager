# HANDOFF — Galans gestaltning (Bandygalan)

**Från:** Design
**Till:** Opus (copy-pooler + tonvarianter), Code (renderar gestaltningen)
**Pairas med mock:** `Galan-gestaltning.dc.html`
**Kodgrundad mot:** `src/domain/services/bandyGalaService.ts`, `src/application/useCases/__tests__/seasonEndGalaStoryline.test.ts`, DerbyRepliken storyline #8
**Rör:** `event_gala_{season}` vid säsongsslut. **Ingen ny mekanik** — minnet ytat i beslutsögonblicket.

---

## 0 · TL;DR

Bandygalan finns redan (`bandyGalaService.ts`): ett `communityEvent` (`event_gala_{season}`) med fem liga-priser, en `hasWinner`-gren, och de verkliga valen *Gå på galan / Skippa*. Idag renderas allt som en textklump i ett beslutskort. Gestaltningen ger det vikt i tre delar — **hållen scen → liggarlandning → verkligt val** — utan att uppfinna en parallell gala.

---

## 1 · ⚠ Avvikelse att äga (Jacob)

Galan i koden är en **liga**-gala, inte klubbkväll. De fem priserna är liga-omfattande spelarpriser:

| GalaAward | Urval (kod) |
|---|---|
| `arets_spelare` | Högst CA i ligan |
| `arets_forward` | Flest mål (≥3) |
| `arets_malvakt` | Bäst snittbetyg, GK |
| `arets_nykomling` | Störst CA-ökning, ålder ≤22 (≥+3) |
| `arets_veteran` | Bäst snittbetyg, ålder ≥32 |

**Ortens hjärta / Blodslinje-milstolpe / tränarbetyg finns INTE som priser.** Att bygga dem vore den parallella gala du varnade för — jag byggde dem inte. Vill du att registret ska bli klubbkväll på riktigt är det **nya priser i koden** (nya `GalaAward`-varianter + urvalslogik i `generateNominations`), ett eget beslut för dig + Code, inte en mock-ändring.

**Försoningen i mocken:** liga-data, men **klubb-ankrad gestaltning**. Du upplever kvällen genom ortens lins — dina nominerade lyfts, `hasWinner` är känslокärnan, rivalernas vinster står kvar men tystare.

---

## 2 · Formen, tredelad

1. **Hållen scen** (nedsläckning-registret) — *ett* pris bär känslan. Genre-eyebrow ⬩ Bandygalan ⬩, Georgia-setting, guld-medalj. Väljs som det mest känslobärande av klubbens vinnare (nykomling/veteran > övriga; vid ingen egen vinnare, se ton "grå" nedan). Guld-medaljen är den **enda fyllda guldytan**.
2. **Liggarlandning** — resten bokförs i protokollform (perforering, Georgia, guld-accent). Era egna får **guldprick** i marginalen (samma prick som Triumf i Klubbminnet); rivalernas vinster i klartext, tystare. Guld som accent, **noll fyllning**.
3. **Det verkliga valet** — `Gå på galan — visa upp klubben` (primär) / `Skippa — fokusera på träning` (outline). Verbatim från `generateGalaEvent`:s choices + subtitles. En primär.

---

## 3 · "Alltid, men tonen skiftar" (Opus)

Galan faller varje säsong; tonen skiftar med `hasWinner` + kontext. Tre lägen, Opus copy-pool per läge:

| Ton | Villkor | Scen |
|---|---|---|
| **Triumf** | `hasWinner` (egna pristagare) | Guld-medalj tänds, orten reser sig. *(visad i mock)* |
| **Grå vardag** | Noll egna vinnare | Medaljen tänds ej; scenen håller en rivals namn. Du är gäst, inte hjälte. |
| **Bittersöt** | Egen vinnare du säljer/pensionerar i sommar | Guld och saknad i samma bild. |

Bara-vid-titel avvisat (dödar avskedsårets beat); alltid-men-platt är dagens tamhet.

---

## 4 · Minnet bokförs redan (kodfakta)

`generateGalaInbox` skriver redan en `player_milestone`-ledgerpost (`significance: 75`) för Årets spelare + en `gala_winner`-storyline per egen vinnare. Den posten flödar till ClubMemory → **Klubbminnet**. Så "priserna bokförs i liggaren" är bokstavligen sant i koden — liggarlandningen i mocken speglar den datavägen, inte en ny.

- `gala_winner`-storyline matar också DerbyRepliken storyline #8 ("{spelare} vann galan. Hur viktigt är det?").
- DOM_GRIND_2_3 flaggade "Bandygalan återkom efter resolution" — nu fixat. Gestaltningen måste respektera: **galan fyrar en gång, `resolved` sticker.**

---

## 5 · Token-not (löser en stående tension)

DS-guiden har inget `--gold`-token; ceremonimockarna (SM-final-skarv, endgame, denna) använder lokala kopior. **Promota ceremoni-guldet till ett dokumenterat token** i `colors_and_type.css`:

```
--gold-scene: #D4B860;   /* medalj/accent-guld */
--gold-deep:  #b8893a;   /* gradient-botten */
--gold-soft:  #E8C97A;   /* highlight */
```

Då delar SM-final, gala och endgame ETT definierat guld i stället för lokala kopior per mock — och "DS saknar --gold" är ingen lucka längre. Under **gold-disciplinen** (R3+): en fylld guldyta eller ingen, aldrig två.

---

## 6 · Implementation

- Rendera `event_gala_{season}` genom en `GalaScene`-yta i stället för rå `DecisionCard`-textklump. Samma event-data, samma choices, samma id.
- Scen-pris = `pickHeldAward(managedWinners)`; ledger-rader = resten av `nominations`. Egna vinnare (`player.clubId === managedClubId`) → guldprick.
- Ingen egen vinnare → scenen håller topp-liga-priset (grå ton), inga guldprickar.
- Behåll `hasWinner`-grenens effekter (reputation/fanMood) orörda — de sitter på choice-effekten redan.
- Estimat: ~2h (GalaScene-komponent + held/ledger-split + ton-gren; ingen ny domänlogik).

---

— Design
