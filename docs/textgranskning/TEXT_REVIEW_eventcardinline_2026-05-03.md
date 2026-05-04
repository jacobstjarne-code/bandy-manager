# TEXT_REVIEW — EventCardInline-pooler

**Datum:** 2026-05-03
**Författare:** Opus
**Scope:** Atmosfäriska event-typer som visas i `PortalEventSlot` via `EventCardInline.tsx`

---

## SAMMANFATTNING

KVAR.md listade 6 event-typer som "placeholder-texter nu" och Opus-jobb. Vid genomgång visade det sig att 3 av dem redan är kurerade och INTE bör röras:

| Typ | Status | Källa |
|---|---|---|
| `bandyLetter` | ✅ Redan kurerad | `bandyLetterService.ts` — 3 templates med konkret detalj (filten över barnet, frislaget från 40 m, änkan med tröjan) |
| `supporterEvent` | ✅ Redan kurerad | `supporterEvents.ts` — 4 detaljerade triggers (tifo, klack-konflikt, öppet brev, bortaresa) |
| `communityEvent` | ✅ Redan kurerad | `eventFactories.ts` `generateCoworkerBondEvent` — kort men konkret. Tas inte upp här. |
| `starPerformance` | ⚠️ Placeholder | `postAdvanceEvents.ts` — "X fick betyget Y senaste matchen. Laget hyllar insatsen." |
| `playerPraise` | ⚠️ Generic | `eventFactories.ts` `generatePlayerPraiseEvent` — en hårdkodad replik utan variation |
| `captainSpeech` | ⚠️ Generic | `eventFactories.ts` `generateCaptainSpeechEvent` — en hårdkodad replik utan variation |

Pooler levereras nedan för de tre senare. Code integrerar via deterministisk seed (player.id + roundNumber, eller season+captainId).

---

## TON-KOMPASS — PÅMINNELSE

- Enrader när det går. Tystnad mellan meningar.
- Konkreta detaljer (klubban i stället, vattenflaskan, kepsen, tvättkorgen, kaffekoppen vid fönstret).
- INGA "Det är inte X, det är Y"-konstruktioner.
- INGA LLM-meningspar (rad 2 förklarar rad 1).
- INGA TV-panel-fraser ("spelarna gav allt", "det är det som gör skillnad").
- Karaktärer i klubben (Sture, Materialaren, kioskvakten) får dyka upp men är inte alltid med — undvik att alla varianter handlar om samma observation.
- Ingen attribution behövs när texten själv bär rösten. Behåll attribution när den faktiskt ger något (vem talar, var, när).

---

## 1. starPerformance

**Trigger:** Spelare fick rating ≥ 8.5 i senaste matchen. Auto-resolved event med +5 moral och en "Bra jobbat!"-knapp.

**Original (placeholder):**
> "${player.firstName} ${player.lastName} fick betyget ${rating.toFixed(1)} senaste matchen. Laget hyllar insatsen."

**Pool — 6 varianter. {NAME} = `${player.firstName} ${player.lastName}`. {RATING} = `rating.toFixed(1)`:**

```ts
const STAR_PERFORMANCE_VARIANTS = [
  `{NAME} ställde fram klubban i stället, lade tröjan i tvättkorgen. Nickade till Sture på vägen ut. Rating: {RATING}.`,
  `Materialaren bad {NAME} om hjälp att bära ut näten. Han var en av få som var kvar i hallen. Rating: {RATING}.`,
  `{NAME} var med på allt som hade betydelse. Det är inte vanligt. Rating: {RATING}.`,
  `Sture klappade {NAME} på axeln på väg in i omklädningsrummet. Mer blev det inte sagt. Rating: {RATING}.`,
  `{NAME} gick i baracker tre, tog en kaffe, satte sig vid fönstret. Ingen störde. Rating: {RATING}.`,
  `{NAME} satte sig sist på bussen. Det blev tyst där bak — på det bra sättet. Rating: {RATING}.`,
]
```

**Code-integration:**

I `postAdvanceEvents.ts` rad ~155-173 där `event_star_*` byggs. Byt ut hårdkodad `body`-sträng mot:

```ts
const variant = STAR_PERFORMANCE_VARIANTS[seed % STAR_PERFORMANCE_VARIANTS.length]
const body = variant
  .replace('{NAME}', `${player.firstName} ${player.lastName}`)
  .replace('{RATING}', rating.toFixed(1))
```

Seed: `(player.id.charCodeAt(0) + roundPlayed) % VARIANTS.length` eller liknande deterministisk funktion.

---

## 2. playerPraise

**Trigger:** Spelare A med morale > 75 i samma lag som målskytt B. A prisar B till media.

**Original (en variant):**
> `${name1} berättade för Bandypuls om sitt samarbete med ${name2}.\n\n"Vi har en förståelse på planen som inte kräver ord. ${name2} vet alltid var jag vill ha bollen."`

**Pool — 6 varianter. {A} = praiser, {B} = praised, {LASTNAME_B} = praised efternamn:**

```ts
const PLAYER_PRAISE_VARIANTS = [
  `{A} till Bandypuls om {B}:\n\n"Han ser det innan jag ser det. Sen är bollen där."`,
  `{A} efter morgonträningen, om {B}:\n\n"Han gör mitt jobb hälften så svårt."`,
  `{A} när någon frågade om kemin med {B}:\n\n"Vi spelade inte ihop som juniorer. Synd."`,
  `Sture i kafferummet:\n\n"{A} och {B} hittar varandra på planen. Konstigt nog."`,
  `{A} i bussen hem, om {B}:\n\n"{LASTNAME_B} måste sluta. Han får mig att se bra ut."`,
  `{A} till lokaltidningen om {B}:\n\n"Han vinner brytningar jag inte ens visste fanns."`,
]
```

**Code-integration:**

I `eventFactories.ts` `generatePlayerPraiseEvent` (rad ~221-232). Byt hårdkodad body. Seed på `praiser.id + praised.id`.

```ts
const seed = (praiser.id + praised.id).split('').reduce((s, c) => s + c.charCodeAt(0), 0)
const variant = PLAYER_PRAISE_VARIANTS[seed % PLAYER_PRAISE_VARIANTS.length]
const body = variant
  .replace(/\{A\}/g, name1)
  .replace(/\{B\}/g, name2)
  .replace(/\{LASTNAME_B\}/g, praised.lastName)
```

---

## 3. captainSpeech

**Trigger:** 3+ förluster i rad, kapten har morale > 50, max 1 per säsong.

**Original (en variant):**
> `${captainName} knackar på dörren till ditt kontor.\n\n"Jag tänkte tala till laget idag. Det är dags att vi tar tag i det här. Okej med dig?"\n\nKaptenen ser sammanbiten ut. Laget har förlorat tre raka.`

**Pool — 5 varianter. {CAPTAIN} = `${captain.firstName} ${captain.lastName}`. Behåller bakgrundsraden om förluster i slutet:**

```ts
const CAPTAIN_SPEECH_VARIANTS = [
  `{CAPTAIN} knackar på dörren. Vattenflaska i handen.\n\n"Är det okej om jag säger något till killarna före matchen? Inget längre."\n\nLaget har förlorat tre raka.`,
  `{CAPTAIN} ställer sig vid dörrposten. Tar av sig kepsen.\n\n"Jag har funderat. Det är dags."\n\nLaget har förlorat tre raka.`,
  `{CAPTAIN} sätter sig i stolen mittemot. Sitter tyst en stund.\n\n"Vi behöver vända det här. Jag tänkte säga något i omklädningsrummet. Du får säga ifrån om det är fel."\n\nLaget har förlorat tre raka.`,
  `{CAPTAIN} kommer förbi efter morgonträningen.\n\n"Grabbarna behöver höra det från någon i laget. Är det okej om det blir jag?"\n\nLaget har förlorat tre raka.`,
  `{CAPTAIN} står kvar när alla andra gått hem. Klubban i handen.\n\n"Jag tar några ord på fredag. Bara så du vet."\n\nLaget har förlorat tre raka.`,
]
```

**Code-integration:**

I `eventFactories.ts` `generateCaptainSpeechEvent` (rad ~244-262). Byt hårdkodad body. Seed på `captain.id + season`.

```ts
const seed = captain.id.charCodeAt(0) + season
const variant = CAPTAIN_SPEECH_VARIANTS[seed % CAPTAIN_SPEECH_VARIANTS.length]
const body = variant.replace(/\{CAPTAIN\}/g, captainName)
```

---

## VAD SOM INTE INGÅR

- **`communityEvent`** — sprids över flera factories med olika kontext (varsel, befordran, schemakrock, arbetskamrater). Ingen enskild placeholder. Lämnas tills någon konkret rad upptäcks som dålig i playtest.
- **`supporterEvent`** — `supporterEvents.ts` har 4 långa kurerade triggers. Tonen är genomarbetad. Inte rört.
- **`bandyLetter`** — `bandyLetterService.ts` har 3 detaljerade templates med personliga minnen. Inte rört.
- **`playerMediaComment`** — finns en variant, generic. Lägs till i nästa runda om playtest visar att den hörs ofta.
- **`refereeMeeting`** — finns separat service med kurerade tonalfraser. Inte rört.

---

## VERIFIERING EFTER CODE-INTEGRATION

1. Spela igenom säsongen tills tre raka förluster → captainSpeech triggas → kontrollera att texten varieras mellan säsongerna (olika seeds).
2. Vid match med spelare som får rating 8.5+ → starPerformance triggas → kontrollera att texten varierar mellan spelare och omgångar.
3. Vid mål av spelare där annan spelare har morale > 75 → playerPraise triggas → kontrollera att kombinationen praiser+praised ger varierande output.

Varje variant ska gå att läsa upprepat utan att bli irriterande. Om någon känns fel i playtest — flagga och Opus skriver om.
