# CODE-INSTRUKTION — VISUELL AUDIT, YTA 2 OCH 3 (+ BASELINE)

**Datum:** 2026-08-08 · **Av:** Opus (chat)
**Underlag:** `docs/incoming/Implementationsaudit - tre ytor.dc.html` (Design, läst mot repot) och `docs/incoming/github.md`
**Föregående order:** `CODE_INSTRUKTION_SLUTTEST_RUNDA4_2026-08-08.md` — **kör den först**, den här ligger efter.

Auditen täcker tre ytor. **Yta 1 (Portal) är UNDANTAGEN från den här ordern** — se sista avsnittet. Bygg ingenting i `PortalScreen.tsx`.

Auditen är skriven mot koden, men mot en tidigare tree. Sluttestets rundor 1–4 har ändrat cupkortet, styrelsemålen, uppställningen, istaggen och `cupService`. **Innan varje punkt: verifiera att auditens beskrivning stämmer mot nuvarande `main` och rapportera avvikelser i stället för att bygga över dem.**

---

## 1. Regressionsbaseline — BYGG DENNA FÖRST

Auditens fjärde slutsats är den viktigaste för oss just nu: Playwright-snapshot per tillstånd, inte bara hjälte-ögonblicket. `playwright.config.ts` finns redan.

Bygg en baseline vid **390 px och 375 px** för:

- **Trupp / Nu-vyn** i tre tillstånd: helt lugnt, blandat (en skada + ett utgående kontrakt, resten tomt), kris (alla fyra kategorier aktiva)
- **Uppställningen** med tomma slots — minst tre oplacerade, så etikettrenderingen syns
- **Uppställningen** fylld, med de längsta efternamnen i truppen
- **Tabell**, 12 lag med zonstreck synligt

De två sista löser en punkt som stått öppen sedan sluttestets början: varken du eller jag har kunnat verifiera tomma lineup-slots eller riktig telefonbredd. Med baselinen behöver ingen hålla en telefon för att fånga det.

Rapportera hur snapshotarna körs och var de ligger. De ska gå i CI.

---

## 2. Yta 3 · Tabell — liten, gör den klart

Auditens dom: ytan är redan kanon och ska inte ritas om. Två saker:

- **Statistikfliken** staplar fem `StatTable` (toppskytt, assist, hörnmål, betyg, utvisningsminuter) med lika vikt. Ge den första `defaultOpen` och lägg de fyra andra i `<details>` — eller bakom `.btn-segmented`, som redan finns. Välj det som ger minst diff och rapportera vilket.
- **Radhöjden** är 6 px padding. Testa 7 px mot baselinen från punkt 1 vid 375 px och behåll det som håller ihop med zonstrecket.

Ingen strukturell ändring i tabellfliken. Ingen ny copy.

---

## 3. Yta 2 · Trupp, "Nu"-vyn

**Auditens fynd, att verifiera först:** fyra sektioner renderas ovillkorligt med rubrik, även tomma. `allEmpty` visar `StillnessSection`, men bara när *alla* fyra är tomma — blandat läge ger tomma rubriker mellan de fyllda. Och `allChips.slice(0, 3)` döljer upp till sex chips utan att visa att det finns fler.

**Bygg:**

- Rendera bara sektioner där `list.length > 0`. Räkna de tomma.
- En `CalmRow` — grön dot plus en rad — ersätter de tomma sektionernas rubriker och `nuEmpty`-rader. Texten är skriven, se nedan.
- `PlayerRow`: när chipsen är fler än tre, visa tre plus en `+N`-pill med samma `chipStyle`.
- Behåll `StillnessSection` för det helt lugna läget. `CalmRow` är för blandat läge, inte i stället för stillheten.

**Återanvänd** `.card-sharp`, severity-stripe-mönstret (`stripeColor`) och `.h-label`. Ingen ny färg, inget nytt token.

**Text (färdig, placera den — skriv inte om den):**

Två lugna kategorier:
```
Inget om avstängningar eller moral.
```

Mönstret när antalet varierar — två kategorier med "eller", tre med komma och "eller" sist:
```
Inget om {A} eller {B}.
Inget om {A}, {B} eller {C}.
```
Kategorinamnen i den formen: `skador`, `utgående kontrakt`, `avstängningar`, `moral`.

---

## 4. Vad som INTE ingår

**Portal (yta 1).** Auditens diagnos stämmer — upp till tolv marks före primary-kortet — men lösningen kräver en regel för vilka en till två marks som får synas en given omgång, och den regeln är min att skriva. Auditen missar dessutom att ett viktlager redan finns (`PHASE_BIAS`, `PHASE_CARD_BIAS`, primärkortens vikter). Det som saknas är ett tak på atmosfärslagret, inte en prioritetsordning från noll. Rör inte `PortalScreen.tsx`.

**"Säsongens båge"-kortet** i auditens efter-bild för Trupp. Det är en ny narrativ yta, inte en omkomposition, och den ligger utanför den här rundan. Vill du ha platsen i markup, lämna den tom och märk `[Opus]` — bygg ingen textpool.

**"Denna vecka"-raden** hör till portalen och är undantagen med den.

---

## Ordning

RUNDA 4 → baseline (punkt 1) → Tabell (punkt 2) → Trupp (punkt 3).

Baselinen först är inte formalia: den är det som gör att Trupp-ändringen går att verifiera utan en telefon, och det som hindrar att de tomma rubrikerna kryper tillbaka.

## Innan något markeras klart

Browser-verifiering enligt CLAUDE.md, plus snapshotarna gröna. `npm run build && npm test`, `lint:design`, `lint:text-guard`. Audit i `docs/sprints/`.
