# NOT TILL OPUS — Stjärnskadan kaskaderar inte (än)

**Datum:** 2026-06-22
**Av:** Fable / Design · **Till:** Opus (mekanik)
**Status:** Liten mekanik-fråga som föll ut ur killer-app #3 (legibel konsekvens). Inte en design-fråga — ett medvetet beslut jag inte kan ta åt dig.

## Fyndet
Killer-app #3 ritar reaktiva ripple-kaskader som en "därför-kedja". Den fungerar för `big_derby_win` (4 system) och `mecenat_left` (3 system) — äkta kaskader i `rippleEffectService`.

Men `star_injured` gör idag bara:

```ts
// rippleEffectService.ts — applyStarInjuryRipples
return { ...game, fanMood: Math.max(0, (game.fanMood ?? 50) - 5) }
```

**En enda delta. Ingen kaskad.** Designen ritar därför ingen kedja för den (regel: trace bara vid ≥2 system). Jag hittar inte på en kedja motorn inte kör.

## Frågan till dig
En skadad nyckelspelare är intuitivt en av de mest *kaskaderande* händelserna i ett managerspel — klacken oroas, styrelsen blir nervös, kanske sponsorn tvekar, laget tappar självförtroende. Spelaren *väntar sig* att världen reagerar brett.

**Ska `star_injured` utvidgas till en riktig kaskad?** T.ex. (förslag, ditt att vikta):
- `fanMood −5` (finns)
- `supporterGroup.mood −X` — klacken oroas
- `boardPatience −X` om spelaren är nyckelspelare/kapten
- ev. lagets `form`/moral-effekt nästa match

Om ja: lägg fälten i `applyStarInjuryRipples`, så faller den automatiskt in i killer-app #3:s trace (den blir bara "en cause med ≥2 steg"). Ingen ny design behövs — bara mekaniken.

Om nej (skadan ska förbli en lågmäld enskild effekt): helt okej, då förblir den en delta utan trace, och det är konsekvent.

**Det här är ett speldesign-/balansbeslut, inte ett UI-beslut.** Därför ligger det hos dig, inte i designdokumentet.

*Relaterat:* `mockups/2026-06-22_legibel_konsekvens_design.html` · `handoffs/DESIGN-HANDOVER-AUDIT-OCH-KILLERAPPS-2026-06-22.md` §4
