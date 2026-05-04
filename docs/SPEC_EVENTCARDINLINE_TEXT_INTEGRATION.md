# SPEC — EventCardInline text-pool integration

**Datum:** 2026-05-03
**Författare:** Opus
**Mottagare:** Code
**Estimat:** ~30 min
**Beroende:** `docs/textgranskning/TEXT_REVIEW_eventcardinline_2026-05-03.md` (texterna är redan skrivna)

---

## VARFÖR

Tre event-typer har idag hårdkodade placeholder-texter i factory-funktionerna. Opus har skrivit kuraterade pooler i bandy-Sverige-ton i textgranskningsdokumentet. Du ska importera poolerna och byta de hårdkodade strängarna mot deterministisk seed-baserad variantval.

Inga av de andra tre KVAR-listade typerna (`bandyLetter`, `supporterEvent`, `communityEvent`) ska röras — de är redan kurerade i sina respektive services.

---

## VAD

### Steg 1: Skapa pool-fil

Ny fil: `src/domain/data/eventCardInlineStrings.ts`

Kopiera de tre `*_VARIANTS`-arrayerna ordagrant från `docs/textgranskning/TEXT_REVIEW_eventcardinline_2026-05-03.md`:

```ts
export const STAR_PERFORMANCE_VARIANTS: readonly string[] = [...]
export const PLAYER_PRAISE_VARIANTS: readonly string[] = [...]
export const CAPTAIN_SPEECH_VARIANTS: readonly string[] = [...]
```

Varianttexterna är ordagrant från text-reviewn. Ändra inget — inga "förbättringar", ingen citat-städning. Spec-lydnad enligt CLAUDE.md regel 1.

### Steg 2: Lägg till deterministisk variantväljare

I samma fil, en hjälpfunktion:

```ts
function pickVariant<T extends string>(
  variants: readonly T[],
  seedString: string,
): T {
  let hash = 0
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash * 31 + seedString.charCodeAt(i)) | 0
  }
  return variants[Math.abs(hash) % variants.length]
}
```

Exportera tre wrapper-funktioner som tar relevanta input-parametrar och returnerar färdig text:

```ts
export function pickStarPerformanceText(
  player: { id: string; firstName: string; lastName: string },
  rating: number,
  roundNumber: number,
): string {
  const variant = pickVariant(STAR_PERFORMANCE_VARIANTS, `${player.id}_${roundNumber}`)
  return variant
    .replace(/\{NAME\}/g, `${player.firstName} ${player.lastName}`)
    .replace(/\{RATING\}/g, rating.toFixed(1))
}

export function pickPlayerPraiseText(
  praiser: { id: string; firstName: string; lastName: string },
  praised: { id: string; firstName: string; lastName: string },
): string {
  const variant = pickVariant(PLAYER_PRAISE_VARIANTS, `${praiser.id}_${praised.id}`)
  return variant
    .replace(/\{A\}/g, `${praiser.firstName} ${praiser.lastName}`)
    .replace(/\{B\}/g, `${praised.firstName} ${praised.lastName}`)
    .replace(/\{LASTNAME_B\}/g, praised.lastName)
}

export function pickCaptainSpeechText(
  captain: { id: string; firstName: string; lastName: string },
  season: number,
): string {
  const variant = pickVariant(CAPTAIN_SPEECH_VARIANTS, `${captain.id}_s${season}`)
  return variant.replace(/\{CAPTAIN\}/g, `${captain.firstName} ${captain.lastName}`)
}
```

### Steg 3: Integrera i `eventFactories.ts`

**3a. `generatePlayerPraiseEvent`** (cirka rad 221-232):

```ts
import { pickPlayerPraiseText } from '../../data/eventCardInlineStrings'

// ...inuti funktionen, byt body-raden:
body: pickPlayerPraiseText(praiser, praised),
```

Ta bort de gamla `name1`/`name2`-variablerna om de bara används för body. Behåll dem om de används för title.

**3b. `generateCaptainSpeechEvent`** (cirka rad 244-262):

```ts
import { pickCaptainSpeechText } from '../../data/eventCardInlineStrings'

// ...inuti funktionen, byt body-raden:
body: pickCaptainSpeechText(captain, season),
```

OBS: De nya texterna har inte `"Laget har förlorat tre raka."` som suffix-rad. Det ingår nu i variantens egen text — varje variant slutar med den raden. Ta bort eventuell separat suffix-konkatenering.

### Steg 4: Integrera i `postAdvanceEvents.ts`

**4a. `starPerformance`-blocket** (cirka rad 155-173):

```ts
import { pickStarPerformanceText } from '../../data/eventCardInlineStrings'

// ...inuti for-loopen där eventet byggs, byt body-raden:
body: pickStarPerformanceText(player, rating, roundPlayed),
```

---

## VERIFIERING

1. `npm run build` — ska gå igenom utan TS-fel.
2. `npm test` — alla tester ska passera. Inga befintliga tester refererar till de hårdkodade strängarna (verifiera med `grep -rn "Laget hyllar insatsen\|hälften så svårt\|Det är dags att vi tar tag" src/ --include="*.test.*"`).
3. Manuell verifiering vid playtest:
   - Vid två separata stjärnprestationer (samma spelare, olika omgångar): texten ska variera mellan de två events.
   - Vid två separata kapten-tal (olika säsonger, samma kapten): texten ska variera.
   - Vid playerPraise: olika praiser+praised-kombinationer ska ge olika varianter.

---

## INTE I SCOPE

- Inga texter för `bandyLetter`, `supporterEvent`, `communityEvent` — redan kurerade.
- Inga ändringar i `EventCardInline.tsx` — komponenten renderar `event.body` direkt, ingen UI-ändring krävs.
- Ingen pool-fil för varianter på andra event-typer (`playerMediaComment`, `refereeMeeting`, etc.) — inte begärt nu.

---

## EFTER LEVERANS

- Commit-meddelande: `feat: kuraterade textpooler för 3 EventCardInline-typer (starPerformance, playerPraise, captainSpeech)`
- Uppdatera KVAR.md: `EventCardInline-texter` raden från "⚠️ Awaiting Code-integration" till "✅ Integrerad commit `<hash>`".
- Inget audit-dokument behövs — det är ren text-substitution, inget logikflöde att verifiera.
