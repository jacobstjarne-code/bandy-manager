# Sprint 27 — Narrativ djup-paket

**Status:** READY TO START (med fas-gates)
**Estimat:** 5-8h totalt om alla fyra delar går till impl. ~30 min om audits visar att inget behöver byggas.
**Förutsätter:** Sprint 26 stängd (klar). THE_BOMB_STATUS_2026-04-26.md som karta.
**Risk:** Låg-Medel — två faser är audit (kan inte gå fel), två är text+impl med små ytor.

---

## SYFTE

Sprint 26 stängde cross-system-skandalreferenserna. THE_BOMB_STATUS-revisionen
listade fyra kvarvarande luckor som spelaren skulle märka:

1. **Säsongens-match-redundans** — möjlig dubbel implementation av "årets match"
2. **State of the Club** — okänt om implementerat i PreSeasonScreen
3. **Pension/Legend-system** — veteran med 100+ matcher försvinner narrativt-tyst
4. **Spelarens livscykel-UI** — datan finns, UI saknas i PlayerCard

Två är audits (1, 2). Två är implementation (3, 4). Audits avgör om
implementation behövs eller om punkten kan strykas.

**Princip:** Verifiera först, bygg sedan. Inte tvärtom.

---

## FAS A — SÄSONGENS-MATCH-REDUNDANS-AUDIT (Opus)

**Mål:** Avgör om `pickSeasonHighlight()` och `summary.matchOfTheSeason`
är två mekanismer för samma sak, och i så fall om det är ett problem.

**Tid:** ~30 min Opus.

**Steg:**
1. Läs `seasonSummaryService.ts` — leta efter var `summary.matchOfTheSeason`
   sätts. Är det `pickSeasonHighlight()` som anropas, eller en separat
   beräkning?
2. Läs `SeasonSummaryScreen.tsx` — verifiera att UI:t bara renderar
   `summary.matchOfTheSeason` och inte också anropar `pickSeasonHighlight()`
   direkt.
3. Jämför kriterierna. Är de identiska eller har de drifted isär?

**Tre möjliga utfall:**

- **A1: Identisk implementation.** Den ena är wrapper för den andra.
  Ingen redundans. Dokumentera i auditen, inget mer behövs.
- **A2: Redundans, men identiskt utfall.** Två funktioner gör samma sak.
  Mark som teknisk skuld i KVAR.md "TEKNISK SKULD". Inte akut.
- **A3: Redundans med drift.** Två funktioner gör *olika* val. Spelaren
  kan se inkonsekvent "årets match" beroende på var det renderas. Akut.
  Lägg som fix i Sprint 27 fas C eller D.

**Output:** Sektion i `SPRINT_27_AUDIT.md` under "Fas A — Audit utfall:".

**Gate:** Om A3, lägg fixen som extra del i sprinten innan vi går vidare.

---

## FAS B — STATE OF THE CLUB-VERIFIERING (Opus)

**Mål:** Avgör om "State of the Club"-vyn (THE_BOMB 3.1) är implementerad
i PreSeasonScreen eller saknas helt.

**Tid:** ~30 min Opus.

**Steg:**
1. Läs `src/presentation/screens/PreSeasonScreen.tsx`.
2. Sök efter referenser till `seasonStartSnapshot`, jämförelser mot
   förra säsongen, "tabellplats X → Y"-formatering.
3. Kontrollera om `SaveGame`-entity har fältet `seasonStartSnapshot` eller
   liknande som sparas vid säsongsstart.

**Tre möjliga utfall:**

- **B1: Helt implementerad.** PreSeasonScreen visar förändringar mot
  förra säsongen enligt THE_BOMB 3.1-spec. Stryk från KVAR.
- **B2: Delvis implementerad.** Snapshot sparas men UI saknas, eller UI
  finns men jämförelse görs inte. Sjuk-half-state. Lägg som fas C-impl.
- **B3: Inte alls implementerad.** Varken snapshot eller UI. Skriv ny
  spec som del av Sprint 27 fas C.

**Output:** Sektion i `SPRINT_27_AUDIT.md` under "Fas B — Audit utfall:".

**Gate:** Om B1, fortsätt till fas D. Om B2/B3, gör fas C före fas D.

---

## FAS C — STATE OF THE CLUB-IMPLEMENTATION (Code) — UTGÅR

**Status: UTGÅR 2026-04-26.** Fas B-audit visade utfall B1: State of the Club är fullt implementerad i PreSeasonScreen som "LÄGET I KLUBBEN"-card med diff-jämförelse, pilar, färgkodning, akademirad och dynamisk narrativ-text. Se SPRINT_27_AUDIT.md § Fas B.

Ingen implementation krävs. Hoppa direkt till fas D.

<details>
<summary>Tidigare spec (bevarat för referens)</summary>

**Aktiveras endast om fas B utfall är B2 eller B3.**

**Mål:** Lägga in eller komplettera "State of the Club"-vyn i PreSeasonScreen.

**Estimat:** 2-3h Code + ~30 min Opus-text-pass.

**Vid B2 (delvis):** Komplettera det som saknas. Spec skrivs av Opus
efter audit-resultat, baserat på vad som faktiskt fanns.

**Vid B3 (helt saknas):** Implementera enligt THE_BOMB 3.1-spec:

```typescript
// I SaveGame:
seasonStartSnapshot?: {
  season: number
  position: number      // tabellplats (förra säsongen)
  finances: number      // klubbkassa vid säsongsstart
  communityStanding: number
  playerCount: number
  promotedFromAcademy: number  // antal promovade detta år
  supporterMembers: number
}
```

Sparas vid säsongsstart i `seasonEndProcessor.ts` (nästa säsong börjar).
Renderas i PreSeasonScreen som ett kort med diff-jämförelse mot förra
snapshot:

```
📊 LÄGET I KLUBBEN

Tabellplats: 8:a → 3:a  ↑
Klubbkassa: 320 → 440 tkr ↑
Orten: 45 → 72 ↑
Trupp: 3 nya, 2 sålda
Akademi: 1 uppflyttad
Klacken: 25 → 41 medlemmar ↑

"Förra säsongen överträffade förväntningarna.
Nu väntar styrelsen mer."
```

Sista raden är dynamisk text — Opus skriver 4-6 varianter beroende på
hur säsongen gick (uppåt/nedåt/stillastående). Cure-pattern från
Sprint 22-styrelsecitat.

**Output:**
- Kod implementerad
- `SPRINT_27_AUDIT.md` Fas C med kod-verifierad simulation enligt
  CLAUDE.md § SJÄLVAUDIT > ALTERNATIV: KOD-VERIFIERAD SIMULATION

</details>

---

## FAS D — PENSION/LEGEND-SYSTEM (Code + Opus)

**Mål:** När en veteran med 100+ matcher pensioneras ska det märkas
narrativt. THE_BOMB 3.3.

**Estimat:** 3-4h Code + ~1h Opus-text.

**Förutsättning:** `retirementService.ts` finns redan. `clubLegends`-array
refereras i coffeeRoomService. Vi bygger ovanpå.

### D.1 — Pensions-event med val

När `retirementService` triggar pension för spelare med:
- `totalGames >= 100` ELLER
- `trait === 'veteran' && totalSeasons >= 3` ELLER
- `trait === 'ledare' && wasCaptainSeasons >= 2`

…så genereras ett pensions-event i inbox med tre val:

```
📋 PENSIONERING

[Spelarnamn], [ålder] år
[matcher] matcher · [mål] mål · [säsonger] säsonger

"[citat — Opus skriver 3 varianter beroende på trait]"

→ Erbjud roll som ungdomstränare (+akademi, +500/v lön)
→ Erbjud roll som scout (+scoutbudget +30%, +500/v lön)
→ Tack och lycka till (ingen bestående effekt)
```

Vid val 1 eller 2: spelaren läggs till som `clubLegend` med ny `role`-prop.
Vid val 3: spelaren läggs till som `clubLegend` utan roll.

**Mekaniska effekter:**
- Ungdomstränare: `youthQualityModifier += 0.1` (10% bättre nya prospekt)
- Scout: `scoutBudget += 30%`, `scoutSpeed += 1 omgång`
- Båda: `+500/v` extra utgift i economyService
- "Tack och lycka till": ingen mekanisk effekt, men spelaren kan refereras
  i kafferum

### D.2 — Coffee-room-referenser

Befintliga `legendRef`-pool i coffeeRoomService (3 utbyten) utökas. Vid
pensions-event där rollen är "ungdomstränare" eller "scout", lägger vi
till nya quote-utbyten som refererar specifik roll:

**För ungdomstränare-legend:**
- "[Legend] var nere på akademiträningen igår. Grabbarna lyssnade."
- "Hörde att [Legend] tar in dem en och en. Personliga samtal."

**För scout-legend:**
- "[Legend] kom hem från Boltic-matchen. Hade hittat något."
- "[Legend] hade fyra namn på pappret. Tre av dem är värda att titta på."

**För farväl-legend (utan roll):**
- "[Legend] köpte korv på matchen i lördags. Sa knappt hej. Men han var här."
- "[Legend] satt på samma plats som vanligt. Som om han aldrig slutat."

Opus skriver 4-6 utbyten per kategori (totalt ~12-18 nya).

### D.3 — Match-commentary för legend-spelarens karriär

Inte i denna sprint. Det är fas D.3 i ett framtida paket. Notera i KVAR.

**Output:**
- `retirementService.ts` utökad med pensions-event
- `coffeeRoomService.ts` utökad med roll-specifika legend-quotes
- `clubLegends`-array har ny `role: 'youth_coach' | 'scout' | 'farewell'`
- `economyService.ts` hanterar legend-löner
- `SPRINT_27_AUDIT.md` Fas D med kod-verifierad simulation

---

## FAS E — SPELARENS LIVSCYKEL-UI (Code + Opus)

**Mål:** Visa narrativeLog + careerMilestones som tidslinje i PlayerCard
för spelare med 2+ säsonger.

**Estimat:** 2h Code + ~30 min Opus-text-format.

**Förutsättning:** `narrativeLog` finns på Player-entity och genereras via
`narrativeService.ts`. `careerMilestones` finns och visas i SeasonSummary.
Datan finns. UI saknas.

### E.1 — Designval LAGT 2026-04-26: **E1a (vertikal tidslinje)**

Jacob valde E1a. Code implementerar enligt nedan.

<details>
<summary>Alternativ som övervagts (bevarat för referens)</summary>

Tre layoutalternativ. Innan Code börjar — Jacob väljer:

**E1a: Vertikal tidslinje med år-grupperingar**
```
🏒 KARRIÄRRESA

2026
  • Debut mot Gagnef (17 år). Kallade in från P19.
  • Första målet mot Lesjöfors. Klacken adopterade honom.

2027
  • 14 mål. Första hela säsongen.
  • Sa upp sig som lärare. Heltidsproffs.

2028
  • Kapten. "Han ÄR Forsbacka nu." — Birger
```

**E1b: Karriär-statistik + viktigaste milestones**
```
🏒 KARRIÄRRESA
3 säsonger · 47 mål · 84 matcher

Höjdpunkter:
⭐ Hattrick mot Sandviken (2027)
⭐ Klackfavorit-status (2027)
©  Kapten sedan 2028
```

**E1c: Kombination — kort statistik + scrollbar tidslinje**

**Min rekommendation:** E1a. Det är vad THE_BOMB.md specade och det är
den variant som ger spelaren känsla av tidsförlopp. E1b är platt.

</details>

### E.2 — Implementation

Efter Jacob valt layout, skriv komponent `<CareerJourney player={p} />`
som renderas i PlayerCard om `player.narrativeLog.length > 0` ELLER
`player.totalSeasons >= 2`.

**Output:**
- Ny komponent `src/presentation/components/player/CareerJourney.tsx`
- Inkluderad i PlayerCard
- `SPRINT_27_AUDIT.md` Fas E

---

## SAMMANFATTNING & ORDNING

| Fas | Vad | Vem | Estimat | Aktiveras |
|-----|-----|-----|---------|-----------|
| A | Säsongens-match-redundans-audit | Opus | 30 min | Alltid |
| B | State of the Club-verifiering | Opus | 30 min | Alltid |
| C | State of the Club-impl | Code+Opus | 2-3h | Om B = B2/B3 |
| D | Pension/Legend-system | Code+Opus | 3-4h | Alltid |
| E | Spelarens livscykel-UI | Code+Opus | 2h | Alltid |

**Total estimat:**
- Bästa fall (B = B1): ~5-6h (A + B + D + E)
- Sämsta fall (B = B3): ~7-8h (A + B + C + D + E)

**Ordning:**
1. Fas A + B parallellt (Opus). Snabba audits.
2. Fas C *om* fas B kräver det.
3. Fas D + E parallellt eller sekventiellt (Code).

---

## EFTER LEVERANS

`docs/sprints/SPRINT_27_AUDIT.md` med separata sektioner per fas.

KVAR.md uppdateras:
- Sprint 27 stängd
- THE_BOMB_STATUS uppdateras med vad som nu är "klart" vs vad som
  återstår från originallistan

---

## VAD SOM INTE INGÅR

- **Match-commentary för legend-spelarens karriär** (D.3 framtid). Det
  kräver att man tracker vilka spelare som *kommer bli* legends, vilket
  är en framtida arkitektur-fråga.
- **Visuell pension-ceremoni i match.** Skulle kunna vara en mini-overlay
  vid spelarens sista match. Inte i denna sprint — kräver designval och
  en helt egen implementation.
- **Pension-impact på morale i andra spelare.** Att en kapten slutar
  borde påverka kvarvarande spelare. Inte i denna sprint — kräver
  morale-modell-utvidgning.
- **Vidare cross-system-narrativ.** THE_BOMB har fler subprojekt
  (vädret märks visuellt, matchdagens känsla, ljudeffekter, share-images
  etc.) som inte är i scope. De är polish och kommer i framtida sprintar.

---

## PRINCIPER SOM TILLÄMPAS

Sprint 27 följer **alla tre designprinciper** från CLAUDE.md:

**Princip 1 (Inbox-principen):** Pension-event är *inte* bara en
inbox-rad — det manifesteras i kafferum-quotes (legend-rollen syns), i
ekonomi (lön), i akademi/scout-mekanik. Spelaren ser legend-spelaren i
flera vyer.

**Princip 2 (Pre-spec cross-check):** Specen kräver explicit audit (fas A
och B) *innan* ny kod skrivs. Vi söker efter befintlig implementation
istället för att anta att det inte finns.

**Princip 3 (Integration-completeness):** Pension-systemet listar fyra
vyer det ska synas i: pension-event (inbox), kafferum, ekonomi, akademi/scout-
mekanik. Spelarens livscykel listar PlayerCard som primär, framtida
match-commentary noterad som ej-i-scope.
