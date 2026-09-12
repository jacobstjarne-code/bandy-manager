# SPEC — Beat-primitiven: severity-medveten, moment-ankrad PortalBeat

**Datum:** 2026-06-22 · **Av:** Opus · **Till:** Code (mekanik/rendering) + Opus (copy per konsument)
**Status:** Spec-klar. Detta är GRUNDEN som board-rewards-ultimatum, Callback, deadline-day-urgency och era-callback alla ärver. Bygg primitiven en gång — konsumenterna blir då copy + en trigger var, inte fyra beat-system.

---

## DIAGNOS — vad som finns, vad som saknas

`PortalBeat` (`portalBeats.ts` + `PortalBeat.tsx` + `portalBeatService`) är rätt grund och rörs inte i sin kärna. Den har redan: `text` som funktion (kan läsa historik), state-change-triggers, per-nod `keyFn`, navigerbarhet, dismiss-per-säsong/totalt.

Två luckor, båda delade av alla fyra konsumenter:

1. **Ingen severity.** Alla beats renderas i en av två vikter (plain eller copper-kicker). Severity-skalan (Förbättring 3, ratificerad: 0 lugn ingen markör · 1 uppmärksamhet copper · 2 brådska danger · 3 kris band på mörk yta) är byggd som tokens/CSS men ALDRIG bunden till beats. board-rewards-ultimatumet kan inte eskalera utan den.
2. **Ingen moment-ankrad trigger.** `first_derby` hand-rullar "nästa managed-fixture är derby". Callbacks behöver samma sak generaliserat (surfa FÖRE en relevant match, inte på en state-change).

Primitiven = lägg till dessa två. Inget mer.

---

## CODE-DEL 1 — severity på PortalBeat

Utöka interfacet:

```ts
export interface PortalBeat {
  // ...befintligt...
  /** Förbättring 3 severity-skalan. 0/undefined = plain (lugn), 1 = copper (= nuvarande kicker),
   *  2 = danger (brådska), 3 = kris (band på mörk yta). Funktion → kan eskalera på game-state. */
  severity?: (game: SaveGame) => 0 | 1 | 2 | 3
}
```

I `PortalBeat.tsx`, mappa severity → visuell behandling med BEFINTLIGA tokens (spegla severity-skalans dsCard + de redan byggda ytorna — uppfinn ingen färg):

| sev | Behandling | Spegla |
|-----|-----------|--------|
| 0 | `--bg-portal-surface`, ingen markör (= nuvarande plain) | nuvarande default |
| 1 | copper 8% bg + copper 25% border + copper kicker (= nuvarande kicker-variant) | nuvarande `beat.kicker`-gren |
| 2 | danger-mix bg + `--danger`-border + danger-dot/stripe | inkorgens severity-2-dot + EventPrimary danger-bård |
| 3 | mörk yta + kris-band | burnout-bandet (C-MK1, nivå 3-behandlingen) |

`kicker` behålls (sev≥1 visar kicker-rad). Bakåtkompatibelt: beats utan `severity` → 0 (eller 1 om de har `kicker` idag, så `facility_completed` m.fl. ser likadana ut — gör severity-default = `kicker ? 1 : 0`).

**Eskalerande beats re-fyrar per nivå.** Ett beat som ska gå notering→varning→ultimatum är `oncePerSeason: false` och bär severity i sin `keyFn`, så varje steg surfar en gång:
```ts
keyFn: (g) => `board_fail_${objectiveId}_sev${severityFn(g)}`
```

## CODE-DEL 2 — moment-ankrad trigger-helper

Generalisera `first_derby`-mönstret till en återanvändbar helper (i `portalBeats.ts` eller `situationFragments`):

```ts
/** True om nästa managed-fixture överhuvudtaget (cup ELLER liga) matchar predikatet.
 *  Garanterar att beatet surfar FÖRE matchen och inte medan en annan match ligger emellan. */
export function firesBeforeNextFixture(
  game: SaveGame,
  predicate: (fixture: Fixture, opponentId: string) => boolean,
): boolean
```

Callbacks använder den: "nästa motståndare är en nemesis jag har h2h-underläge mot" → `firesBeforeNextFixture(g, (fx, opp) => hasH2HDeficit(g, opp))`. `text`-funktionen läser historiken (coachRivalries, rivalryHistory, lastNationalSnub) och templatar meningen.

---

## WORKED EXAMPLE — board-rewards misslyckande-beaten (eskalerande)

Detta är den klaraste eskaleringen och bevisar primitiven end-to-end. Severity-källan bor i board-rewards-konsumenten (en `boardFailureStreak`-räknare knuten till patience/sack-logiken, ej i primitiven). Copy nedan är **Opus-satt, slutlig** — ägar-attribuerad, bandy-understatement, templatas med `{owner}` + `{mål}`.

```
sev 1 (notering)  — {owner}: "Vi nådde inte {mål}. Jag säger inget mer om det. Den här gången."
sev 2 (varning)   — {owner}: "Det är andra gången nu. Jag börjar få frågor jag inte vill ha på årsmötet."
sev 3 (ultimatum) — {owner}: "Jag har försvarat dig så länge jag kan. Nästa gång gör jag det inte."
```

- sev 1 = lugn notering (copper), sev 2 = skarpare (danger), sev 3 = sack-skuggan (kris-band). Tonen stiger, inte volymen — understatement bär hotet.
- Patience-träffen + `sponsorNetworkMood −4` (datalagret, batch-instruktionen) står kvar; beaten är RÖSTEN ovanpå siffran.
- `keyFn` bär severity → varje steg surfar en gång; en vänd säsong (mål uppfyllt) nollställer streaken → tillbaka till tystnad.

---

## KONSUMENTERNA (ärver primitiven — copy skrivs av Opus när var och en byggs)

| Konsument | severity | trigger | källa för text |
|-----------|----------|---------|----------------|
| **board-rewards-ultimatum** | 1→2→3 på failure-streak | check-in failed | ägar-röst (ovan) |
| **Callback** | 0–1 (lugnt minne) | `firesBeforeNextFixture` (nemesis/h2h/snubbe) | coachRivalries, rivalryHistory, lastNationalSnub |
| **deadline-day-urgency** | 2 (brådska) | bud förfaller nästa omg | TransferBid.expiresRound |
| **era-callback** | 0–1 | era-skifte (`currentEra` ändrad) | eraLabel + klubbhistorik |

**lastNationalSnub** landar här: en Callback-beat (`firesBeforeNextFixture` eller säsongsstart), sev 0–1, text läser fältet ("{spelare} förbigången i landslaget — andra året i rad"). Det är så snubben får sin konsument utan egen yta, precis som beslutat.

---

## HANDOFF

- **Code:** bygg DEL 1 (severity på interface + de fyra visuella nivåerna i `PortalBeat.tsx`, spegla severity-skalan/inkorg/burnout-band — uppfinn ingen färg) + DEL 2 (`firesBeforeNextFixture`-helper). Wira board-rewards-beaten som worked example: `severity`-resolver mot board-failure-streaken (board-rewards datalagret, batch-instruktionen #2), `keyFn` med sev-nivå, copy ovan. Rapportera mot källan — visa severity→token-mappningen i diffen.
- **Opus:** board-rewards-copyn är skriven (ovan). Callback / deadline-day / era-callback / lastNationalSnub-copyn skrivs när respektive konsument byggs — INTE nu (en konsument i taget, copy vid bygge).
- **Ordning efter detta:** Callback är nästa konsument (paketets #1, högsta hävstång). När primitiven står är Callback mest copy + triggers, inte nytt system.
