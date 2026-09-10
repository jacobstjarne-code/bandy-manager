# HANDOFF — Beslutskorten: domen fälld (en regel, två register)

**Från:** Design
**Till:** Code (implementerar), Jacob (godkänner domen)
**Pairas med mock:** `Beslutskort-domen.dc.html`
**Ersätter:** `Beslutskort-brief.dc.html` (de tre öppna trådarna — nu domda)
**Rör:** `DecisionCard` / `DecisionChoices` (vardag) + `EventOverlay`-scenen (brytpunkt). Ingen ny mekanik.

---

## 0 · TL;DR

Briefen samlade tre rader (likriktning · brytpunkt-knappar · primär-utspädd) till **en** primär-fråga. Domen:

> **Kopparn syns bara vid asymmetri.** När ett val är den tyngre/rekommenderade vägen får det exakt en fylld `.btn-primary`. Likvärdiga svar förblir alla `.btn-outline`. Aldrig mer än en koppar per kort, aldrig mer än en primär per skärm — samma regel som Taktik-domen.

Och: **två register, inte tre primärstilar.** Vardagskorten talar `.btn`-vokabulären; brytpunktsscenen behåller sin Georgia-pilknapp som ett *dokumenterat ceremoni-register* — legitimt eftersom det bara lever i scen-overlayn, precis som `.btn-cta`.

---

## 1 · Rad 1 — "symmetriska val ljuger inte" (redan låst, nu ritad)

| Fall | Regel | Mock |
|---|---|---|
| **Symmetriskt** — likvärdiga svar | `primaryChoiceId` osatt → alla val `.btn-outline`. Ingen falsk rekommendation. | Presskonferensen (1a, övre) |
| **Asymmetriskt** — en tydlig uppsida | `primaryChoiceId` satt → det valet `.btn-primary` (flat koppar `--accent-dark`), resten outline. | Spelarfrågan (1a, nedre) |

`primaryChoiceId` är ett fält på `DecisionCard`-datan. Sätts av copy/design när ett val har mätbar uppsida; lämnas osatt annars. **Regeln syns bara om båda korten renderas i samma vy** — därför visar mocken två.

---

## 2 · Rad 2 — brytpunkt-knapparna = ceremoni-register (inte en tredje primär)

Brytpunkten är systemets tyngsta vikt, men den renderas **inte** via `DecisionChoices`. Den är en scen (`EventOverlay`, genre `breakpoint`):

- Georgia på läder, koppar-pil `→`, ljuskägla uppifrån (radial-gradient, "lampan över bordet").
- **Ingen** fylld `.btn-primary`. Valen är `.scene-choice`.
- Det tyngre valet får en subtil koppar-tint (`.scene-choice.weight`) + en konsekvens-underrad — men aldrig full koppar-fyllning. Vikt utan att bryta "en primär".

Legitimt av samma skäl som `.btn-cta`, `PressConferenceScene`, `CeremonyRetirement`: det är **ceremoni**, det lever bara i overlayn, det når aldrig en vardagsyta. Gränsen är nu skriven — den driver inte tyst längre.

---

## 3 · Rad 3 — "primär-utspädd" upplöst

Klagomålet var att kopparn dök upp på för många ställen och tappade betydelse. Domen löser det på källan: kopparn är nu **villkorad** (rad 1) och **registeruppdelad** (rad 2). När den syns betyder den något.

---

## 4 · Diff-scenen där de möts

`072-event-overlay-breakpoint` (R2-baseline) är där vardagskortet och scenen möts i samma flöde. Mocken ritar båda sidor av gränsen. Efter godkänd dom kan den baselinen omvärderas mot den skrivna regeln i stället för att bara "se annorlunda ut".

---

## 5 · Blod (varför mocken ser ut som den gör)

Domen är strukturell, men mocken bär också systemets temperatur — det är avsiktligt, så regeln inte läses som kall spec:

- **PortalBeat**-rad ovanför korten (väder + dag), ice-stripe — systemets puls.
- **Källrad** i Georgia-kursiv under varje fråga (`Målilla-Kuriren, sportsidan…`) — lokaltidnings-rösten.
- **Konsekvens-underrader** på scenvalen — vad valet *kostar*, inte bara vad det gör.
- Papperskorn på panelen, ljuskägla på scenen.

Detta är atmosfär, inte mekanik — Opus äger den slutliga copyn. Design låser bara formen.

---

## 6 · Implementation (efter dom)

- Lägg `primaryChoiceId?: string` på `DecisionCard`-datan; `DecisionChoices` renderar det valet `.btn-primary`, resten `.btn-outline`. Osatt → alla outline.
- Scenvalen (`breakpoint`-genre): behåll `.scene-choice`; lägg `weight`-varianten för det tyngre valet (tint + subrad), aldrig `.btn-primary`.
- Ingen ändring av budget-prickarna (de styr antalet *kort*, inte kopparn *inom* kortet).
- Ingen visuell baseline rörs innan domen fallit.

---

— Design
