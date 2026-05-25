# Annandagsplanering — val-mekanik (B-spår)

**Datum:** 2026-05-17
**Av:** Opus, efter söka i kod
**Status:** Spec för byggande. Ej spec för text — annandagens briefing/commentary FINNS redan i `specialDateService.ts` + `specialDateStrings.ts`.
**Bakgrund:** Audit 2026-05-16 förslag #8. Jacobs poäng: annandan är största enskilda bandyhändelsen, berör ALLA 12 klubbar (medan SM-finalen bara berör 2).

---

## VAD SOM REDAN FINNS I KOD

Verifierat i `src/domain/services/specialDateService.ts`:

- `ANNANDAGSBANDY_BRIEFING` — pre-match-anslag, picker-funktion `annandagsbandyBriefing()`
- `ANNANDAGSBANDY_COMMENTARY` + `ANNANDAGSBANDY_COMMENTARY_LORE` — in-match-commentary, picker `pickSpecialDateCommentary('annandagen', ...)`
- Context-builder `buildSpecialDateContext()` skapar SpecialDateContext med arena, motståndare, derby-flagga, etc.

Texten är på plats. **Det som saknas är val-mekaniken.**

---

## VAD SOM SAKNAS — val-mekanik före annandags-rundan

Audit-förslag #8 formulerade tre alternativ:
1. **Standard** — sparar pengar, neutral
2. **Julmarknad** — +3x biljetter men kostar 25k
3. **Gratisentré** — minskar intäkt men +25 CS

Det räcker som start. Förfining nedan.

### Trigger-villkor

Annandags-rundan är (förmodligen) omgång 8-9 enligt audit. Verifiera i `Fixture.specialDate === 'annandagen'`-flagga eller motsvarande. När matchen som ligger på annandagen är 2-3 omgångar bort → trigga val-event på Portal.

Konkret:
```ts
const triggersAnnandagsPlanering = (game: SaveGame): boolean => {
  const annandagsFixture = game.fixtures.find(f => f.specialDate === 'annandagen' && f.homeClubId === game.managedClubId)
  if (!annandagsFixture) return false
  const roundsUntil = annandagsFixture.matchday - game.currentRound
  return roundsUntil === 2 && !game.annandagsValGjort
}
```

Bara hemmaklubben triggas. Bortalag spelar inte men kan eventuellt få bortaresa-microdecision (separat spår).

### Val-alternativ (3-4 stycken, era-anpassat)

Alla klubbar får alltid alternativ A (standard). Övriga alternativ är era-låsta.

**A. Standard arrangemang** — alla eras
- Kostnad: baseline (samma som vanlig hemmamatch)
- Biljetter: standard publik-formel
- CS: +0
- Risk: ingen
- Briefing-text: "Annandagen blir som annandagen brukar bli."

**B. Julmarknad** — fotfäste+ (kräver `era !== 'survival'`)
- Kostnad: +25 000 kr (planering, försäljningsstånd, kraftaggregat)
- Biljetter: ×2.5 (inte ×3 — kalibrerat mot realistisk uppåtgräns)
- CS: +10 (familjer kommer som inte annars skulle)
- Risk: 30% risk för "regn ruinerar julmarknaden"-event som halverar intäkten
- Briefing-text: "Vi sätter upp marknad. Det blir större än vanligt."

**C. Gratisentré** — alla eras
- Kostnad: baseline
- Biljetter: 0 kr intäkt (-100% mot baseline)
- CS: +25
- Klack-reaktion: "De släpper in oss för en gångs skull" (positivt)
- Risk: ingen direkt risk, men bortfall i biljett-intäkt kan kasta budgeten
- Briefing-text: "Idag är det gratis. Alla får komma."

**D. Mecenat-värd** — legacy + ha aktiv mecenat (kräver `clubEra === 'legacy' && mecenat.active`)
- Kostnad: 0 (mecenaten står för det)
- Biljetter: baseline
- CS: +15
- Mecenat-relation: +20 (de uppskattar att synas)
- Risk: mecenaten kommer att referera annandagen i framtida demands ("jag tog ju kostnaden då")
- Briefing-text: "{mecenatNamn} står för annandagen i år."

Era-låsningen gör att survivalklub har 2 val (A+C), fotfäste har 3 (A+B+C), establishment har 3 (A+B+C), legacy har upp till 4 (A+B+C+D).

### UI-mock kortspec

Triggas som event-modal eller weekly-decision-pattern. Pattern föreslår `EventCardInline` i Portal med 3-4 knappar (en per tillgängligt alternativ). Era-låsta alternativ visas inte (inte gråade — borta).

Inspiration: `MecenatDinnerEvent.tsx`-mönstret med val-grid. Men bör följa `EventCardInline`-paradigmet snarare än modal-overlay, eftersom annandagen är ETT val per säsong och inte ett återkommande mönster som mecenat-middag.

---

## KEDJEREAKTIONER (designprincipen från GENOMGANG_SPEL_LOOP)

Varje val ska ha minst en system-output i ETT ANNAT system, fördröjt minst 3 omgångar.

**A. Standard:**
- Output i `clubMemoryService`: inget noteras (annandan som annandan brukar)
- Output i `volunteerService`: +5 morale (frivilliga uppskattar förutsägbarhet)

**B. Julmarknad:**
- Output i `mediaService`: rubrik "X bygger upp annandagen som riktig folkfest" (omg+1, 70% chans)
- Output i `volunteerService`: -10 morale (frivilliga slet hela helgen)
- Output i `clubMemoryService`: noteras som "stor satsning på annandagen omg X" (kan refereras säsong+1)
- Output i `kommunService`: kommunen noterar (+5 till `localPolitician.relationship`)

**C. Gratisentré:**
- Output i `klackService`: bonusram "De släpper in oss" — refereras 2-3 omgångar senare i klack-citat
- Output i `mediaService`: rubrik "X öppnar portarna på annandan" (omg+1, 50% chans)
- Output i `clubMemoryService`: noteras som "gratisentré annandan omg X"
- Output i `sponsor` budget: tappar 50-80k intäkt direkt — eventuell sponsorinblandning om budgeten är ansträngd

**D. Mecenat-värd:**
- Output i `mecenatService`: +20 relation till värdande mecenat
- Output i `mediaService`: rubrik "X och Y firar annandag tillsammans" (omg+1, 80% chans)
- Output i `clubMemoryService`: noteras
- Output i framtida `mecenatService.demand`: mecenaten refererar det när de kräver något senare ("jag tog ju annandagen 2027")

### Klack-reaktion-rester (THE_BOMB 2.1)

Vid val B/C/D ska klacken reagera under annandags-matchen själv via existing `supporter_*`-pools eller ny `supporter_annandagen`-pool. Inte spec'at här — kan bli framtida pool-utökning.

---

## KALIBRERING — siffror att verifiera mot game balance

Baseline annandagsmatch:
- Publik: 2-3× normal hemmamatch (annandan = dragartavla)
- Intäkt: baseline × publik-multiplicator
- Driftkostnad: baseline × 1.2 (extra mat, värme, personal)

För val-alternativen:
- Julmarknad +25k kostnad — verifiera mot survival-klubs månadsbudget. Om månadsbudget är 50k är 25k för stort. Justera nedåt om så.
- Julmarknad ×2.5 biljetter — bör inte överstiga arena-kapacitet
- Gratisentré -100% intäkt — verifiera att klubben överlever omgången
- CS +25 — på en 0-100 skala är det signifikant. Verifiera mot andra CS-events att skalan är konsekvent

Code måste verifiera och justera mot existing balance-data.

---

## INTEGRATION I FLÖDET

1. **Trigger:** `roundProcessor` kontrollerar 2 omgångar innan annandagsmatch — om hemmaklubb och inget val gjort, lägg till `pendingAnnandagsVal: true` i save.

2. **Portal-rendering:** Ny EventCardInline-variant `AnnandagsValEvent` renderas i Portal när `pendingAnnandagsVal === true`. Använder 3-4 knappar baserat på era + mecenat-status.

3. **Val-handler:** Sätter `game.annandagsValGjort = 'A' | 'B' | 'C' | 'D'`, justerar `game.cashOnHand` (om kostnad), planterar pending event för matchdagen.

4. **Matchdagen:** `buildSpecialDateContext` läser `annandagsVal` och berikar context. `ANNANDAGSBANDY_BRIEFING` och `_COMMENTARY` plockar lämplig variant baserat på val (eventuellt utökas pools med val-specifika strängar — ny task).

5. **Efter-match:** Konsekvenser triggas i `roundProcessor` (mediarubrik omg+1, klack-reaktion omg+2-3, mecenat-memory omg+long-term).

6. **Reset:** Vid säsongsslut nollställs `annandagsValGjort` så nästa säsong får eget val.

---

## STORLEKSBEDÖMNING

**Implementation:** 2-3 dagar Code-arbete för full kedja (UI + state + konsekvens-kedja + balance-verifiering). Inte trivialt eftersom det berör 6+ services.

**Brytning för stegvis byggande:**
- **Steg 1 (1 dag):** Basal val-mekanik utan kedjereaktioner. Spelaren väljer A/B/C, ekonomisk effekt, CS-shift.
- **Steg 2 (1 dag):** D-alternativet (mecenat-värd) + era-låsning av alternativ.
- **Steg 3 (1 dag):** Kedjereaktioner — mediarubrik, klack, kommun, mecenat-memory. Får inte vara tystaste — annandan ska ekas i andra system efteråt.

---

## VAD JAG INTE GJORDE

- **Detaljkod för UI-rendering** — det är Designs jobb när vi kommer dit
- **Exakta sifferkalibreringar** — kräver Code att verifiera mot game balance
- **Nya text-pooler för val-specifika briefing/commentary-varianter** — fungerar med existing pools tills vidare. Pool-utökning kan komma som Nivå 4-uppgift.
- **THE_BOMB 2.1 (klack-reaktion-nästa-omgång) som SEPARAT system** — denna spec antar att klack-reaktion-kedjan finns att hooka in i. Om den inte finns: behöver byggas SAMTIDIGT, blir då en del av THE_BOMB-resterna.

---

## NÄSTA STEG

Detta är spec för Riktning 1-byggande (Klubbutvecklingspaketet). Ska INTE skickas till Code förrän:
1. Code rapporterat F1 backend-wiring + audit-fixar + cup-tonen integration klar
2. Jacob playtestat Riktning 2 (verifiera dolda system)
3. Klubbutvecklingspaketet får grönt ljus att starta

Då tas annandagen som första-eller-andra-subsystem i sprint-ordning. Specen ligger redo.
