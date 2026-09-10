# HANDOFF — Polish 3/5: Opponentform

**Från:** Design
**Till:** Code
**Pairas med mock:** `Polish-opponentform.dc.html`
**Rör:** NextMatchCard, motståndarens form-indikator. **Ingen ny data** — allt i `opponent.form[]`.

---

## 0 · TL;DR

Motståndarens form ligger i NextMatchCard som fem färgprickar utan legend — man ser grönt/rött men inte *vad*, i *vilken ordning*, eller *åt vilket håll* det lutar (DS §13: semantisk färg kräver nyckel på samma yta). Polishen byter prickar mot **FormSquares** (V/O/F med bokstav), lägger inline-legend, ringar in senaste matchen, skriver ut trenden, och lägger en hot-rad. Samma FormSquares-komponent som Trupp — en form, två ytor.

---

## 1 · De fyra fixarna

| Problem idag | Fix |
|---|---|
| Ingen legend — grön = vad? | Inline-legend (Vinst/Oavgjort/Förlust) på samma yta (§13) |
| Ingen läsordning — vilken är senast? | Äldst → nyast vänster-till-höger, **senaste inringad i koppar** (`--match-copper`) |
| Ingen riktning — stiger/faller? | Pil `↗` + ord ("stigande") — text-redundant med färg |
| "V3 O1 F1" upprepar prickarna | Ersätts av bokstäver i rutorna + en **hot-rad** (scouting, inte status) |

---

## 2 · Tokens & regler

- FormSquares: `--success` (V) · `--danger` (F) · `--accent` (O) — samma som Trupp FormSquares/FormDots. **Aldrig** LED-paletten (reserverad för tavlan).
- Ruta: 22×22, radius 3, Georgia-bokstav, `#15120E`-text på färgbotten. Senaste ruta får `--match-copper` 1.5px ring.
- Kortet: NextMatchCard, weather-tinted leather (`--match-bg-*` per väder). Is-blå (`--ice`) för bortamarkör/väder — kall info, aldrig signal.
- Hot-raden: Georgia-kursiv, `--match-warn` på nyckelspelaren. Drar ur samma data som portal-nudgen ("Holmgren — 3 mål senaste 4").

---

## 3 · Frusna parametrar (mock)

Skutskär borta · snöväder (`--match-bg-snow`) · form V V O F V (stigande). **Variation:** byt väder → lädertonen skiftar; byt motståndare → form + hot-rad byter innehåll. Formspråket (rutor + legend + ring + trend) är konstant.

---

## 4 · Implementation

- Återanvänd Trupp:s `FormSquares` med `showLetters` + `highlightLast`-props; mata `opponent.form.slice(-5)`.
- Trend: `deriveTrend(form)` (redan trivialt ur form[]) → pil + ord.
- Hot-rad: `opponent.topScorer` + senaste-mål-räckan; dölj om ingen tydlig hot-spelare (empty-structure §12 — kortet talar eller renderar inte raden).
- Estimat: ~40 min (props på befintlig komponent + hot-rad).

---

— Design
