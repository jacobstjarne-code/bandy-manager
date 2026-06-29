# CODE — Mentorskaps-läsbarhet (implementering av Fable-briefen) — 2026-06-20

**Källa:** `docs/incoming/DESIGN-BRIEF-MENTORSKAP-LASBARHET-2026-06-20.md` (Fable, kod-verifierad) + `docs/BESLUT_MENTORSKAP_KANON_2026-06-20.md` (kanon: system 2, veteran→ung via vidgad adept-behörighet).
**Detta är en LÄSBARHETS-order, inte en mekanik-order.** Effekt/grind/tilldelning står orörda. Det enda som byggs är att den befintliga relationen *syns* där spelaren möter spelaren.
**Bygg EFTER:** (A) klipp system 1 + (C) vidga adept till A-trupps-U22 (samma mentorskaps-pass i `BESLUT_MENTORSKAP_KANON`). Yta E-texten (B) wiras i samma veva — den och denna order delar AkademiTab-raden.

Allt läses ur befintliga fält: `Mentorship { seniorPlayerId, youthPlayerId, startRound, isActive }` + `YouthPlayer.mentorId`. Ingen ny domänmodell.

---

## Tre ärlighetsregler (Fable, gäller överallt)
1. **`startRound`, inte nedräkning.** Mentorship bär `startRound`, inte `expiresRound`. Rendera ALLTID "sedan omg {startRound}", ALDRIG "N omg kvar". Det är ett pågående band, inte en timer.
2. **Vilan ska synas.** Effekten är grindad på mentorns `form ≥ 40` (motorn pausar utan att ta bort). Gör vilan till ett tydligt tillstånd, inte en tyst paus av en tyst effekt.
3. **Effekt kvalitativt, aldrig rått tal.** "Växer snabbare", aldrig "+0,06 CA" / "+devRate". Appens röst (samma princip som puls/fanMood-läsningarna).

---

## Steg 0 — extrahera form-tröskeln (så UI och motor inte driftar)
`youthProcessor.ts` har `mentor.form >= 40` som literal. UI läser samma tröskel → den får inte hårdkodas på två ställen.

- Ny: `src/domain/services/mentorshipConstants.ts` → `export const MENTOR_FORM_THRESHOLD = 40`.
- `youthProcessor.ts`: byt literalen `40` mot importen.
- All UI nedan importerar `MENTOR_FORM_THRESHOLD` — aldrig en egen `40`.

---

## Enhetlig uppslagning (löser Fables öppna item)
A-trupps-U22-adept har ingen `mentorId` (den finns bara på `YouthPlayer`). Men `mentorships` keyar på `youthPlayerId` oavsett adept-typ. Därför, **en enda säker väg för båda adept-typerna:**

```ts
// Är denna spelare adept? (P19 ELLER A-trupps-U22 — samma lookup)
const asAdept = (game.mentorships ?? []).find(m => m.youthPlayerId === player.id && m.isActive)
// Är denna spelare mentor?
const asMentor = (game.mentorships ?? []).filter(m => m.seniorPlayerId === player.id && m.isActive)
```
`mentorId` blir en P19-bekvämlighet vi inte behöver — `asAdept` täcker allt. Namnuppslagning som AkademiTab redan gör: mentor finns i `game.players`; adept i `game.youthTeam?.players ?? game.players`.

---

## Yta 1 — PlayerCard: mentor-band överst i RELATIONER

**Plats:** sektion ⑥ RELATIONER (`isOwned && showKarriar`), `🤝 RELATIONER`-blocket. Mentor-banden läggs **först** i flex-kolumnen, FÖRE samtal/kontrakt/lön-raderna.

**Adept-raden** (om `asAdept`):
```
🎓  Mentoreras av {mentorName} · sedan omg {asAdept.startRound}   [Aktiv|Vilar-pill]
    {mentor.form >= MENTOR_FORM_THRESHOLD ? mentorshipBondAdeptInForm() : mentorshipBondAdeptResting(mentorName)}
```
- `mentorName` = `game.players.find(p => p.id === asAdept.seniorPlayerId)`.
- Bond-raden i kursiv MB-stil (`font-display`, italic, `text-secondary`, ~10px), samma som övriga kvalitativa rader.
- Strängarna finns i `src/domain/data/mentorshipStrings.ts` (`mentorshipBondAdeptInForm` / `mentorshipBondAdeptResting`) — importera, skriv ingen text.

**Mentor-raden** (om `asMentor.length > 0`):
```
🎓  Mentor åt {adeptName(s)}   [Aktiv|Vilar-pill per band]
```
- Adeptnamn: `game.youthTeam?.players.find(...) ?? game.players.find(...)` på `m.youthPlayerId`. Flera band → lista namnen.
- En spelare kan vara både mentor och adept (teoretiskt) — rendera båda raderna om så.

**Tillstånds-pill (Aktiv/Vilar):**
- `form >= MENTOR_FORM_THRESHOLD` → **Aktiv**, `--success` (grön).
- `form < MENTOR_FORM_THRESHOLD` → **Vilar**, cold/ice-token (`--ice` — samma "långsam/stabil"-ton som fanMood-grundtonen och 🏘️ Lokal-traiten; **ingen ny färg**).
- Adept-raden läser MENTORNS form (det är mentorns svacka som pausar). Mentor-raden läser mentorns egen form (= player.form).
- Använd `.tag`-mönstret i global.css (chip-familjen), inte en bespoke pill.

---

## Yta 2 — PlayerCard: 🎓 Mentor-trait i trait-raden

**Plats:** hjälteblockets trait-tag-rad (där 🔥 Hungrig / 🏅 Veteran m.fl. ligger, `isOwned`-grenen).

```tsx
{asMentor.length > 0 && <span className="tag" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>🎓 Mentor</span>}
```
(`asMentor` måste då beräknas i hjälteblockets scope, inte bara i RELATIONER — lyft uppslagningen till komponenttoppen.)

> Emoji-not: 🎓 matchar de befintliga emoji-traitsen (🔥🏅🎭🏘️🦁). Den viks in i emoji→Lucide-svepen tillsammans med dem (GraduationCap) — bygg med 🎓 nu för konsekvens, inte en ensam Lucide bland emoji.

---

## Yta 3 — AkademiTab: berika paringsraderna

**Plats:** Mentorskap-kortet, `activeMentorships.map(...)` — idag naken `{mentor} → {youth}` + Ta bort.

Lägg till per par (samma bond-vokabulär som spelarkortet):
- **Tillstånds-pill** Aktiv/Vilar (samma `MENTOR_FORM_THRESHOLD`-läsning av mentorns form).
- **"sedan omg {m.startRound}"** efter paret (aldrig nedräkning).
- **Konsekvensrad (= yta E / B):** `mentor.form >= MENTOR_FORM_THRESHOLD ? mentorshipActiveInForm(mentorName, mentor.discipline, adeptName) : mentorshipActiveOutOfForm(mentorName, adeptName)` — kursiv MB-rad under paret. (Detta ÄR (B):s aktiv-rad; bygg den här, så (B) och (D) är samma wiring.)
- **Preview-raden** (B): när båda dropdownsen är satta före Tilldela → `mentorshipPreview(seniorName, senior.discipline, juniorName)`.

`youthForMentor`-vidgningen till A-trupps-U22 hör till (C) — bekräfta bara att den är inne innan denna yta testas.

---

## Gate
- Typecheck + tester gröna.
- En adept du satt under mentorskap visar bandet överst i RELATIONER (Karriär-läget) + bond-rad. Mentorn visar "Mentor åt X" + 🎓-trait.
- Sänk mentorns form under tröskeln (testsave) → pill slår om till **Vilar** på BÅDA korten + AkademiTab, och bond-raden byter till vilande-texten. Höj formen → tillbaka till Aktiv. UI och motor läser samma `MENTOR_FORM_THRESHOLD`.
- Inget rått tal någonstans. Ingen "N omg kvar".
- **Design-Fable efterkontroll:** att vilan läser som ett ärligt tillstånd (inte som en bugg/avstängning), och att pill-färgen sitter i fanMood-tonen.
