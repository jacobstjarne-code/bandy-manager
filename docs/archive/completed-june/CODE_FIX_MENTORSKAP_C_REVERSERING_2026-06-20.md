# CODE-FIX — Mentorskap (C) REVERSERING: vidga, inte begränsa — 2026-06-20

**Reverserar:** `5e80c9ed` (mentorskap C-passet), som begränsade `youthForMentor` till P19.
**Källa:** `docs/BESLUT_MENTORSKAP_KANON_2026-06-20.md` (C) + Jacobs ratificerade kanon.
**En fil/steg i taget, verifiera per steg. Typecheck + tester gröna.**

---

## Varför detta är en reversering, inte en ny fix

Det ratificerade beslutet (Jacob 2026-06-20): mentorskap = system 2, och **veteran→ung A-spelare BEVARAS genom att VIDGA adept-behörigheten till A-trupps-U22.** Code byggde i stället den *gamla* (a)-rekommendationen — begränsade `youthForMentor` till P19, tog bort A-lags-grenen. Resultatet: veteran→ung A-spelare är borttagen, tvärtemot beslutet. Detta återställer det, åt rätt håll.

Verifierat as-built nu: `youthForMentor = (youthTeam?.players ?? []).map(...)` — bara P19, A-lags-grenen borta.

---

## Steg 1 — `youthForMentor`: återställ A-trupps-gren, ålder-baserad

**Fil:** `src/presentation/components/club/AkademiTab.tsx`

Återställ A-trupps-grenen — men **ålder-baserad U22**, inte den gamla `promotedFromAcademy`-flaggan (behörigheten är ålder per beslutet, vilken ung A-spelare som helst):

```ts
const youthForMentor = [
  ...(youthTeam?.players ?? []).map(p => ({ id: p.id, name: `${p.firstName} ${p.lastName} (P19)` })),
  ...managedPlayers
    .filter(p => p.age <= 21 && !activeMentorships.some(m => m.youthPlayerId === p.id))
    .map(p => ({ id: p.id, name: `${p.firstName} ${p.lastName} (A-lag)` })),
]
```
(`p.age <= 21` = U22. Uteslut redan tilldelade adepter. Den valda mentorn kan ändå inte väljas som sin egen adept — `assignMentor` bör redan vägra senior=adept; bekräfta, lägg annars en guard.)

---

## Steg 2 — Effekten för A-trupps-adepter (knuten Code rundade förra gången)

**Mekaniken är bekräftad — ingen ny behövs.** `developmentRate` konsumeras för unga A-spelare i `calculateRoundDevelopment` (`playerDevelopmentService.ts`, anropad av `applyRoundDevelopment`): ålder≤20 → `baseDelta += devRate/500`, ålder≤23 → `+= devRate/800`. Så att höja en A-trupps-U22-adepts `developmentRate` ger verklig CA-växt.

**Knuten:** `youthProcessor`:s mentor-loop uppdaterar bara `youthTeam.players`, inte `game.players`. Därför kan A-trupps-adeptens bump INTE ske där. Den ska ske i **players-uppdateringsvägen** — round-processorn som anropar `applyRoundDevelopment` och äger `game.players`-uppdateringen (grep `applyRoundDevelopment` för call-siten).

Applicera per omgång, spegla P19-logiken exakt:
```ts
// För varje aktivt mentorskap där adepten är en A-trupps-spelare (inte i youthTeam):
//   mentor = game.players.find(p => p.id === m.seniorPlayerId)
//   adept  = game.players.find(p => p.id === m.youthPlayerId)
//   if (mentor && adept && mentor.form >= MENTOR_FORM_THRESHOLD) {
//     const devBoost = mentor.discipline / 20
//     adept.developmentRate = Math.min(100, adept.developmentRate + devBoost * 0.1)
//   }
```
- **P19-adepter fortsätter via `youthProcessor` oförändrat** — rör inte den loopen. Detta steg täcker BARA A-trupps-adepter (de `youthProcessor` missar).
- **Tröskeln:** använd `MENTOR_FORM_THRESHOLD` (läsbarhetsordern Steg 0 extraherar den ur youthProcessors `40`). Är den inte extraherad än — extrahera den nu (`src/domain/services/mentorshipConstants.ts`) och låt både youthProcessor, detta steg och UI:t importera den. Ingen literal `40` på två ställen.
- Undvik dubbelapplicering: om en adept råkar finnas i båda vägarna (ska inte hända — youthTeam vs game.players är disjunkta), applicera bara en gång.

---

## Gate
- `youthForMentor` listar åter A-trupps-U22-spelare (label "(A-lag)") + P19. En veteran (≥25, disp >60) kan tilldelas en ung A-spelare.
- Testsave: tilldela veteran→ung A-spelare. Med mentor.form ≥ tröskeln stiger adeptens `developmentRate` per omgång → syns som snabbare CA-växt över några omgångar. Sänk mentorns form under tröskeln → bumpen uteblir (vilande).
- P19-mentorskap oförändrat (regressionskoll: youthProcessor-loopen orörd).
- Typecheck + tester gröna. En literal form-tröskel finns bara på ETT ställe (`MENTOR_FORM_THRESHOLD`).

**Lås upp:** när detta sitter funkar läsbarhetsordern (`CODE_MENTORSKAP_LASBARHET`) fullt ut — dess enhetliga `mentorships.find(youthPlayerId)`-uppslag täcker då både P19- och A-trupps-adepter med verklig effekt bakom.
