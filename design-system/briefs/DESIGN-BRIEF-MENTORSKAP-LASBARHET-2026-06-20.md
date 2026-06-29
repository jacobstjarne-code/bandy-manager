# DESIGN-BRIEF — Mentorskap: läsbarhet

**Datum:** 2026-06-20
**Till:** Claude Design / Code
**Källa:** Opus mentorskaps-audit 2026-06-19 (två överlappande system) + Jacobs kanon-beslut 2026-06-20. Spårat mot kod samma session.
**Status:** Fristående brief. Kanon är **satt** (se nedan) — denna brief gäller hur det kanoniska mentorskapet ska **synas**, inte vilket system som vinner. Renderad mock: `docs/mockups/2026-06-20_mentorskap_lasbarhet.html`.

## Det här är inte en mekanik-brief
Vilket mentorskap som är kanon är avgjort. Effekten, grindarna och tilldelningen finns redan i motorn och ska inte byggas om. Den här briefen rör en annan sak: **läsbarhet.** Mentorskapet är byggt och konsekvensen tickar — men på spelarkortet, där spelaren faktiskt möter människan, finns inget spår. Lös att relationen *syns*; rör inte mekaniken.

## Kanon (Jacob 2026-06-20)
Det fanns två överlappande "mentorskap" i koden — olika fält, olika mål, olika effekt, olika synlighet:

| | System 1 (leadership) | System 2 (akademi) |
|---|---|---|
| Fält | `leadershipActions` | `mentorships` |
| Mentor | du väljer | ≥25 år, disciplin >60 |
| Adept | **auto** (yngsta U22) | **du väljer** (P19/uppflyttad) |
| Effekt | CA-bonus 0,06 (PC-6) | devRate + confidence/omg |
| Synlig | nej (bara feedback-rad) | ja (AkademiTab `X → Y`) |

**Beslut:**
1. **System 2 (`game.mentorships`) är mentorskapet.** Ett fält, en yta, en sanning. Agens i båda ändar, redan synligt, rikare grindar, knapphet (max 3) = beslutsekonomi.
2. **Veteran→ung A-spelare bevaras** genom att **vidga adept-behörigheten** till A-trupps-U22, inte bara P19/akademiprodukter. Fantasin "kaptenen tar den unge under sina vingar" lever — routad genom system 2.
3. **`'mentor'` lyfts ut ur Ledarskap-panelen** (`leadershipService.ts`). Ett långt strukturellt åtagande (8 omgångar, utveckling) hör inte hemma bland transienta moral-tryck — den tonala missmatchen är *varför* den blev osynlig. Panelen behåller `lower_tempo` · `private_talk` · `public_praise`.

Detta är låst. Briefen ber inte väga system mot system — det valet är gjort.

## Problemet (verifierat i kod)
Du tilldelar ett mentorskap i Akademi-fliken (`AkademiTab.tsx`), får en bekräftelserad, och sen lever konsekvensen i det tysta: `playerDevelopmentService` läser `mentorships` och adderar devRate + confidence varje omgång, grindat på mentorns `form ≥ 40`. Men:

> Öppnar du adeptens spelarkort (`PlayerCard.tsx`) — där du faktiskt undrar "hur går det för grabben?" — finns inget spår alls. Ingen mentor nämnd, ingen effekt, ingenting. RELATIONER-sektionen visar kontrakt/lön/samtal men inte den enda relation som formar hans utveckling just nu.

Klassisk löfte↔konsekvens-lucka (Lesson #41): bandet finns i motorn, men inte för ögat. Och kroken finns redan oanvänd — `YouthPlayer.mentorId` pekar på mentorn; `Mentorship` bär `startRound` och `isActive`.

## Vad varje yta ska läsa (allt ur befintliga fält)

### Spelarkortet — `PlayerCard.tsx`
Mentor-bandet hör hemma **överst i RELATIONER**, på båda sidor av relationen:
- **Adept:** `youthPlayer.mentorId === mentor.id` → rad "**Mentoreras av** Erik Lundqvist · sedan omg {`startRound`}", med rutinarens ansikte och en kvalitativ effektläsning ("Växer snabbare med en rutinare bredvid sig").
- **Mentor:** `mentorships.find(m => m.seniorPlayerId === player.id)` → rad "**Mentor åt** Henriksson, 17" + en **🎓 Mentor**-trait-tagg i trait-raden.
- **Effekt kvalitativt, aldrig rått tal.** "Växer snabbare" — inte "+0,06 CA". I appens röst (samma princip som puls/fanMood-läsningarna: värde i känsla).

### Det vilande tillståndet (den bärande insikten)
Effekten är grindad på mentorns `form ≥ 40`. Faller formen under tröskeln **pausas** mentorskapet utan att tas bort. Idag är det en tyst paus av en tyst konsekvens. Gör vilan till ett **tydligt, ärligt tillstånd:**
- Tillstånds-pill **Aktiv** (grön) / **Vilar** (cold/blå — samma "långsam/stabil"-signal som fanMood-grundtonen, ingen ny färg).
- Vilande bond-rad: "Sedan omg 6 · pausad" + "Lundqvist är i svacka — formen för låg för att leda. Växten pausar tills han hittar tillbaka."
- **Designvinsten:** rutinarens formsvacka får en *andra tyngd* — den stallar grabben. Det gör valet "vem ska mentorera" till ett riktigt vad-om: en skör veteran är en opålitlig mentor. UI:t läser samma `form ≥ 40`-tröskel som motorn — hittar inte på en egen.

### Akademi-fliken — `AkademiTab.tsx`
Tilldelnings-ytan finns och fungerar; paret visas idag som naken text (`{mentor} → {youth}` + Ta bort). Berika med samma bond-vokabulär som spelarkortet:
- Varje par får **tillstånds-pill** (Aktiv/Vilar) + "sedan omg {`startRound`}" + kort effektläsning.
- "Välj ung"-listan (`youthForMentor`) **vidgas till A-trupps-U22** så veteran→ung A-spelare tilldelas på samma yta.
- Inget nytt API — samma `assignMentor` / `removeMentor`, bara rikare läsning av fält som redan finns.

## Ett öppet item — Codes att reda ut
**Adeptens back-ref för A-trupps-U22.** `YouthPlayer.mentorId` finns bara på ungdomsspelare. Vidgas adept-behörigheten till A-trupps-U22 har en A-spelare (`Player`) ingen `mentorId` — adept-sidan måste då härledas ur `mentorships.find(m => m.youthPlayerId === player.id)` i stället för back-ref:en. (Fältnamnet `youthPlayerId` blir då något missvisande men funktionellt korrekt.) Designen bryr sig inte vilket — bara att **båda adept-typerna läser likadant på kortet.** Kanon-beslutet är Jacobs; den här reda-ut-frågan är Codes.

## Råmaterial (finns redan — konsumera, bygg inte om)
- **Datamodell:** `domain/entities/Academy.ts` — `Mentorship { seniorPlayerId, youthPlayerId, startRound, isActive }`; `YouthPlayer.mentorId`.
- **Effekt + grind:** `domain/services/playerDevelopmentService.ts` — devRate + confidence, grindat på mentorns form. **Läs tröskeln därifrån, hårdkoda inte.**
- **Tilldelnings-yta:** `presentation/components/club/AkademiTab.tsx` — `activeMentorships`, `assignMentor`, `removeMentor`, `mentorCandidates` (≥25 år, disp >60), `youthForMentor`.
- **Spelarkort:** `presentation/components/PlayerCard.tsx` — RELATIONER-sektionen + trait-raden är platserna.
- **Mock:** `docs/mockups/2026-06-20_mentorskap_lasbarhet.html` — gap, adept-kort, mentor-kort, vilande-tillstånd, berikad akademi-lista, fält-för-fält-spec.

## Vad detta INTE är
- Inte en mekanik-ändring — effekt/grind/tilldelning står orörda.
- Inte ny domänmodell — all läsbarhet härleds ur `mentorships`, `mentorId`, `startRound` och formgrinden.
- Inte rått tal på kortet — effekten läses kvalitativt, i appens röst.
- Inte en återupplivning av system 1 — `'mentor'` lämnar Ledarskap-panelen; veteran→ung lever vidare *enbart* genom system 2:s vidgade behörighet.
