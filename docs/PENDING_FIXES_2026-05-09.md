# PENDING FIXES — väntar på BATCH A klar

**Datum:** 2026-05-09
**Författare:** Opus
**Status:** SAMLAD KORR-SPEC — skickas till Code EFTER BATCH A (Scoreboard + Commentary) är pushad. Inte under pågående grafikimplementation.

Detta dokument samlar små fixar som upptäcks under tiden Code arbetar med Match Live Bundle. Skickas som EN spec när BATCH A landat så vi inte stör pågående arbete med dubbla processer.

---

## FIX-01 · Disabla `season_signature_reveal` i intro-flödet

**Bug:** Efter BoardMeetingScene visas `season_signature_reveal` som klick-igenom-stegs-scen. Det är gammal artefakt från tidigare flöde och stör inkörningen. Avsedda intro-flödet är: ArrivalScene → BoardMeetingScene → Portal med cup_start-anslag → första cup-match.

**Fix:** I `src/domain/services/sceneTriggerService.ts`, `shouldTriggerSeasonSignature()` ska returnera `false` alltid.

**Behåll:** scen-fil (`seasonSignatureReveal.ts`) och `SIGNATURE_REVEAL_DATA` — datan är värd att behålla för framtida användning (KÖLDVINTERN, SKANDALSÄSONGEN, etc har tydligt designtema som kan kopplas till väder/säsongs-logik senare).

**Behåll också:** `shouldTriggerSundayTraining()` — sunday_training-scenen är OK och ska fortsatt triggas. Bara season_signature_reveal disablas.

**JSDoc-kommentar:**

```ts
/**
 * Disabled 2026-05-09 — gammal artefakt, scenen används inte längre i
 * intro-flödet. Datan i SIGNATURE_REVEAL_DATA är kvar för eventuell
 * framtida iteration (väder-koppling, mid-season-trigger, etc).
 */
export function shouldTriggerSeasonSignature(): boolean {
  return false
}
```

**Verifiering:** efter fix ska intro-flödet vara: ArrivalScene → BoardMeetingScene → Portal (med cup_start-anslag) → SundayTrainingScene (om det är säsong 1) → första cup-match. INGEN season_signature_reveal mellan boardmeeting och första matchen.

---

## FIX-02 · Textkorr i `cup_finalweekend_pre` Variant B

**Fil:** `src/domain/data/anslag/cupAnslag.ts`

**Två justeringar i samma variant (Variant B av `cup_finalweekend_pre`):**

### FIX-02a · "i lördag/söndag" → "på lördag/söndag"

**Nuvarande:**

```
Två semifinaler i lördag, finalen i söndag.
```

**Ska vara:**

```
Två semifinaler på lördag, finalen på söndag.
```

Idiomatisk svenska. "i lördag/söndag" funkar bara om man syftar på en specifik framtida helg ("vi ses i lördag"). Här är det generellt om finalhelgen — "på lördag, på söndag" är rätt preposition.

### FIX-02b · "Men ingen är där och tror något annat heller." → "Men ingen här tror något annat heller."

**Nuvarande:**

```
Det är inte SM. Men ingen är där och tror något annat heller.
```

**Ska vara:**

```
Det är inte SM. Men ingen här tror något annat heller.
```

Tightare formulering. "ingen är där och tror" är klumpigt — "ingen här tror" är direktare och bättre flyt.

### Implementation

Hela Variant B-bodyn ändras från:

```ts
body: `Bollnäs den här helgen. Sävstaås, fyrverkerier, glögg på läktaren. Det är så cup-finalhelgen brukar vara.<br><br>Två semifinaler i lördag, finalen i söndag. Fyra lag åker dit, ett åker hem som vinnare. Resten åker hem som vanligt.<br><br>Det är inte SM. Men ingen är där och tror något annat heller.`,
```

till:

```ts
body: `Bollnäs den här helgen. Sävstaås, fyrverkerier, glögg på läktaren. Det är så cup-finalhelgen brukar vara.<br><br>Två semifinaler på lördag, finalen på söndag. Fyra lag åker dit, ett åker hem som vinnare. Resten åker hem som vanligt.<br><br>Det är inte SM. Men ingen här tror något annat heller.`,
```

---

## (Ev. flaggning — inte krav)

### FLAG-01 · Dubbel "på" i Snålvinden Variant B

**Fil:** `src/domain/data/anslag/cupAnslag.ts`, `cup_between` Variant B

**Nuvarande:**

```
Mörkret kommer för tidigt nu, frosten ligger på på mornarna, och spelet är inte där det ska vara än.
```

"frosten ligger på på mornarna" — dubbel "på". Det är tekniskt grammatiskt korrekt ("ligger på" som uttryck + "på mornarna" som tidsangivelse) men ser fult ut visuellt. Ej bekräftad av Jacob — flaggat för översyn.

Möjliga formuleringar:
- "frosten ligger på morgonisen" (förskjuter fokus)
- "frosten är där på mornarna" (mindre dubblering)
- "morgonfrosten är där" (omformulering)

**Status:** ej beslutad. Lägg INTE in fix utan Jacobs godkännande.

---

## FIX-03 · Konvertera `cupFinalIntroScene` till anslag-modal

**Bug:** Inför cup-final triggas `cupFinalIntroScene.ts` — en gammal 3-beat klick-igenom-helsidesvy med eyebrow "CUPFINAL", rubrik "Det är inget träningsläger", body "Borta mot {motståndare}. Det här är inget träningstillfälle. En match. Sen är det över.", CTA "Vad är på spel?". Det är gammalt format.

Efter cup-finalen visas däremot `cup_done`-anslaget i modal-format (chapter "⬩ POKALEN ⬩", italic body, "TRYCK FÖR ATT FORTSÄTTA →"). Det är rätt format. Inkonsistens — det före ska se likadant ut som det efter.

**Fix:** Lägg till nytt anslag `cup_final_pre` i `cupAnslag.ts` (chapter "⬩ Cupfinalen ⬩") med tre varianter byggda på existerande scen-text. Disabla `shouldTriggerCupFinalIntro()` i `sceneTriggerService.ts`.

### Anslag-text (BESLUTAD — Variant A)

Jacob valde Variant A 2026-05-10 — direkt, innehållstroget mot den befintliga scenen.

```
Cupfinal.

Två lag kvar. Ingen omspelning. {vsLabel} {motståndare}.

Det här är inget träningstillfälle. En match. Sen är det över.
```

Mallvariabler:
- `{motståndare}` — motståndarklubbens shortName (ex. "Västanfors")
- `{vsLabel}` — `"Borta mot"` om managed-klubben är awayClub, annars `"Hemma mot"`

Ingen Variant B/C — bara EN variant av `cup_final_pre`. (Avviker från övriga anslag som har 3 varianter — motiverat eftersom cupfinal inträffar max en gång per säsong och inte kräver variation över tid.)

### Implementation

Ny key i `CupAnslagKey`-typen: `'cup_final_pre'`.

Ny entry i `CUP_ANSLAG`:

```ts
cup_final_pre: {
  chapter: '⬩ Cupfinalen ⬩',
  variants: [
    {
      body: `Cupfinal.<br><br>Två lag kvar. Ingen omspelning. {vsLabel} {motståndare}.<br><br>Det här är inget träningstillfälle. En match. Sen är det över.`,
    },
  ],
},
```

Kräver template-variable-stöd i `anslagService.ts` om `pickAnslagVariant` inte hanterar `{motståndare}`/`{vsLabel}` idag. Implementation-ansvar Code.

**Trigger-logik (BESLUTAD — behåll båda anslag):**

Jacob bekräftade 2026-05-10 att vi behåller BÅDE `cup_finalweekend_pre` (Helgen — bredare ramen, alla 4 lag) OCH `cup_final_pre` (Cupfinalen — vi-fokus, motståndaren). Rytm:

1. Före semifinalhelgen → `cup_finalweekend_pre` triggas (om vi är kvar i cupen)
2. Vi vinner semifinal
3. Före cup-finalen → `cup_final_pre` triggas

Det är två berättelse-lager. Helgen är ramen, Cupfinalen är vi-fokus.

Lägg till `cup_final_pre` som ny prio i `computeNextAnslag` i `anslagService.ts`. Triggas när:
- Managed-klubben har en cup-fixture med `roundNumber >= 4` (final) som scheduled
- Föregående cup-match (semifinal) är completed
- Inget annat anslag har högre prio

**Disable scen:**

```ts
/**
 * Disabled 2026-05-09 — gammalt 3-beat klick-igenom-format. Innehållet flyttat
 * till cup_final_pre-anslag i cupAnslag.ts som visas i modal-format.
 */
export function shouldTriggerCupFinalIntro(): boolean {
  return false
}
```

**Behåll:** scen-fil `cupFinalIntroScene.ts` (datan är värd att behålla för referens, men triggas inte längre).

---

## FIX-04 · TABELL #-fält i SpelaScreen för cup-matcher

**Bug:** I taktik-vyn före cup-final visas "#12 TABELL" i motståndare-kortet. Tabellplacering är ligabegrepp — irrelevant i cup-spel där det är elimineringsmatcher.

**Fix-alternativ:**

**A. Dölja TABELL-fältet** för cup-matcher (`fixture.isCup === true`).

**B. Byta TABELL-fältet** till cup-fas-info för cup-matcher:
- `roundNumber === 4` → "FINAL"
- `roundNumber === 3` → "SEMIFINAL"
- `roundNumber === 2` → "KVARTSFINAL"
- `roundNumber === 1` → "FÖRSTA RUNDAN"

**Min rekommendation: B.** Att helt dölja fältet skapar tomt utrymme. Att byta till cup-fas behåller informationsmängden och är meningsfull i kontexten.

### Implementation

Leta upp komponenten som renderar MOTSTÅNDAREN-kortet i SpelaScreen (sannolikt `MotstandareCard.tsx` eller motsvarande, inline i SpelaScreen, eller i en helper). Lägg till conditional rendering:

```tsx
{fixture.isCup ? (
  <span className="opponent-meta">
    {getCupRoundLabel(fixture.roundNumber)}
    <small>CUP</small>
  </span>
) : (
  <span className="opponent-meta">
    #{opponentStanding.position}
    <small>TABELL</small>
  </span>
)}
```

Ny helper i `cupService.ts` eller `formatters.ts`:

```ts
export function getCupRoundLabel(roundNumber: number): string {
  if (roundNumber === 4) return 'FINAL'
  if (roundNumber === 3) return 'SEMIFINAL'
  if (roundNumber === 2) return 'KVARTSFINAL'
  return 'FÖRSTA RUNDAN'
}
```

---

## Implementation-ordning

Code kan ta FIX-01, FIX-02, FIX-03 och FIX-04 i samma commit eller som separata commits — de är oberoende. Förslag:

1. **Snabba fixar först** (FIX-01, FIX-02) — disable + textkorr, ~20 min jobb
2. **FIX-03** — anslag-tillägg + scen-disable, kräver lite mer omsorg på texten ~1h
3. **FIX-04** — UI-conditional, ~30 min

FLAG-01 hanteras separat när Jacob beslutar.

---

## När skickas detta till Code

**Efter BATCH A (Scoreboard + Commentary) är pushad och bekräftad.** Inte tidigare — vi vill inte ha dubbla processer under pågående grafikimplementation.
