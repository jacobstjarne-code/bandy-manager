# OPUS-RULING — Stjärnskadan: ja till kaskad, men skalad och utan dubbelstraff

**Datum:** 2026-06-22 · **Av:** Opus (mekanik/balans) · **Till:** Code
**Svar på:** `incoming/downloads 3/NOT-OPUS-STJARNSKADA-KASKAD-2026-06-22.md`
**Källverifierat:** `rippleEffectService.ts` — `applyStarInjuryRipples` gör idag enbart `fanMood −5` (gate: managed-stjärna CA≥60). Jämförelse-skala: `big_derby_win` = fanMood+8/klack+10/cs+5/sponsor+5; `mecenat_left` = cs−8/patience−10/klack−5. Fälten finns alla i `RIPPLE_AFFECTED_FIELDS`.

## Beslut: JA — utvidga till kaskad. Men med två vakter.

Fables instinkt är rätt: en skadad nyckelspelare är en av de mest kaskaderande händelserna i genren, och spelaren väntar sig att världen reagerar. Men två balansfel måste undvikas:

### Vakt 1 — skala bredden på SKADANS ALLVAR, inte bara spelarens CA
En knäskada med en veckas frånvaro är ingen styrelsekris. En säsongsavslutande skada på kaptenen är det. Bredden ska vara en funktion av `injuryDaysRemaining`, inte en platt kaskad för varje CA≥60-spelare som nyper en muskel. Annars fyrar kaskaden för ofta och tappar tyngd.

### Vakt 2 — håll kaskaden i PERCEPTIONS-/RELATIONSLAGRET, aldrig i prestationslagret
Spelaren är redan borta ur laguppställningen — lagstyrkan sjunker mekaniskt av frånvaron själv. Lägg INTE en lagbred form-/moraldebuff ovanpå. Det dubbelstraffar spelaren för RNG hen inte rår över (skadan slår två gånger: en gång på isen, en gång på moralen). Kaskaden ska beskriva att *världen oroas* (klack, styrelse) — inte göra laget mätbart sämre utöver frånvaron.

## Vikter (under `mecenat_left`-allvar — en skada läker, en mecenat som lämnar gör det inte)

I `applyStarInjuryRipples`, efter befintlig gate (managed-klubb + CA≥60):

```ts
const weeksOut = Math.ceil((player.injuryDaysRemaining ?? 0) / 7)
const isFranchise = player.id === game.captainPlayerId || player.currentAbility >= 78

// Bas — varje stjärnskada (oavsett längd): oro i leden
let updated = {
  ...game,
  fanMood: Math.max(0, (game.fanMood ?? 50) - 4),
}
if (updated.supporterGroup) {
  updated = { ...updated, supporterGroup: {
    ...updated.supporterGroup,
    mood: Math.max(0, (updated.supporterGroup.mood ?? 50) - 3),
  }}
}

// Eskalering — endast långtidsskada (≥4 v) PÅ en franchise-spelare rör styrelsen
if (weeksOut >= 4 && isFranchise) {
  updated = { ...updated, boardPatience: Math.max(0, (updated.boardPatience ?? 70) - 4) }
}

return updated
```

- **Aldrig** `form`/`morale`/lagbred effekt (vakt 2).
- `boardPatience`-träffen fyrar bara i det sällsynta fallet (långtidsskada × franchise), så injury-tur eroderar inte tålamodet över en säsong (vakt 1).
- Bas-kaskaden (fanMood −4, klack −3) = 2 system → faller automatiskt in i killer-app #3:s trace (regel ≥2 system). Långtidsfallet = 3 system.

## Handoff
Code: utvidga `applyStarInjuryRipples` enligt ovan. Inga nya fält (alla finns i `RIPPLE_AFFECTED_FIELDS`). Kräver `player.injuryDaysRemaining` (finns) + `game.captainPlayerId` (finns). Killer-app #3:s konsekvens-trace plockar upp den utan ny design så snart den är ≥2 system.
