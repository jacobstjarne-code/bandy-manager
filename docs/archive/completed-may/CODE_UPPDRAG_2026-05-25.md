# CODE-UPPDRAG — C-SD1 (verify regular_done) + C-FT1 (b)/(c) motorutredning 2026-05-25

**Av:** Opus. **Surface:** spellogik + UI-wiring. **Prioritet:** C-SD1 först (snabb verify),
sedan C-FT1 (b)/(c) — utreda och rapportera, inte patcha, om inget är uppenbart fel.

**Regel för detta uppdrag:** Utreda → rapportera → invänta beslut. Inget av detta är
"fixa direkt" — C-FT1(b)/(c) rör motorbalansen och kräver Jacobs bedömning av vad som
är rätt kompromiss. C-SD1 är en verifiering och kräver bara fix om något faktiskt är trasigt.

═══════════════════════════════════════════════════════════════════════════
## DEL 1 — C-SD1: Verifiera att regular_done-anslaget triggas och visas
═══════════════════════════════════════════════════════════════════════════

**Bakgrund:** `regular_done`-anslaget skrevs av Opus i `leagueAnslag.ts` och triggern lades
till i `anslagService.ts` (commit `6596dc2`). Vercel-builden fallerade sedan `leagueAnslag.ts`
inte var committat — fixat i `3b8da26`. Anslaget är aldrig testat i levande spel.

**Tracera dessa tre led och rapportera:**

### 1.1 Trigger-villkoret i anslagService.ts

Leta upp blocket (ska finnas runt rad 285–292 i `src/domain/services/anslagService.ts`):
```ts
if (getSeasonEndPhase(game) === 'regular_done' && !seen.includes('regular_done')) {
  return 'regular_done'
}
```

Kontrollera:
- Ligger det EFTER marginaler-checken (`round >= 19`) men FÖRE `playoff_start`-checken?
- Importeras `getSeasonEndPhase` korrekt i filen?
- Är `'regular_done'` med i `LeagueAnslagKey`-unionen i `leagueAnslag.ts`? (Kolla att typen är `export type LeagueAnslagKey = ... | 'regular_done'`)
- Är `'regular_done'` med i `AnslagKey`-unionen (union av CupAnslagKey | LeagueAnslagKey | BoardAnslagKey | PlayoffAnslagKey) i `anslagService.ts`?

### 1.2 Villkoret för regular_done-fasen

`getSeasonEndPhase` i `src/domain/data/seasonEndPhase.ts` returnerar `'regular_done'` när:
- `game.playoffBracket` är null
- `getCurrentLeagueRound(game) >= 22`

Kontrollera att `getCurrentLeagueRound` räknar rätt: den ska räkna det högsta `roundNumber`
bland **completed** league-fixtures (ej cup). Kolla att det inte råkar räkna cup-fixtures.

### 1.3 AnslagOverlay-displayen

`AnslagOverlay` i `MatchLiveScreen.tsx` (eller var den nu renderas) läser `computeNextAnslag`.
Kontrollera att:
- `seenAnslag` på SaveGame är av typen `AnslagKey[]` (inte hårdkodad gammal typ som missar `regular_done`)
- AnslagOverlay renderas i rätt kontext — visas den på Dashboard/Portal-vy, eller bara i match-flödet?
  (Anslaget triggas UTANFÖR matchen — spelaren spelar omgång 22, sedan advance, sedan portalen visar anslaget.)

**Om allt ser korrekt ut:** skriv "C-SD1 verifierad — trigger + typ + display korrekt" och
notera var i flödet anslaget dyker upp (vilken vy/trigger-punkt). Ingen kodändring.

**Om något är fel:** rapportera exakt vad som är trasigt (radnummer + symptom) och föreslå fix.
Gör inte fixen utan bekräftelse — det kan påverka anslag-queuen.

═══════════════════════════════════════════════════════════════════════════
## DEL 2 — C-FT1 (b): Symmetri — tröttnar AI-lagen verkligen inte?
═══════════════════════════════════════════════════════════════════════════

**Bakgrund:** `computeLagstyrka` visar att managed-laget är X styrkepoäng under utvilat.
Men AI-lagen väljs via `generateAiLineup`. Frågan: väljer AI-lineup spelare baserat på
`currentAbility` och ignorerar `fitness` — och gör motorn samma sak för AI?

**Tracera och rapportera, rör ingenting:**

### 2.1 Hur väljer generateAiLineup sin elva?

Hitta `generateAiLineup` (troligen i `matchSimProcessor.ts` eller `aiLineup.ts`).
- Sorterar den på `currentAbility`? `form`? `fitness`? Kombination?
- Appliceras `fitness`-straff i urvalet, eller väljs bästa CA oavsett trötthetsnivå?
- Svar: "AI väljer på [X], fitness [ignoreras / används] i urval"

### 2.2 Vad händer med AI-spelarnas fitness i evaluateSquad?

`evaluateSquad` anropas med AI:s startspelare. `playerModifier` läser `player.fitness`.
Frågan: uppdateras AI-spelares `fitness` varje omgång (i `playerStateProcessor`) eller
ligger de alltid på startvärde?

Kolla `playerStateProcessor.ts` — filtrerar den på `managedClubId`? Dvs uppdateras ALLA
spelares fitness (också AI-spelarnas), eller bara managed-klubbens spelare?

- Svar A: "Alla spelares fitness uppdateras → AI tröttnar också → asymmetri begränsad"
- Svar B: "Bara managed-klubbens spelare uppdateras → AI är alltid utvilad → äkta asymmetri"

### 2.3 Kvantifiera asymmetrin om Svar B

Om AI-spelare alltid har fitness ≈ 100 (startvärde), och managed-spelare tappar 15–25/match:
- Vid match 3 av 4 (omgång 3, ingen vila): managed fitness ≈ 55–70, AI ≈ 100
- `playerModifier`: `base = (form/100)×0.4 + (fitness/100)×0.6`
- Med fitness 60 vs 100 (form lika, 75): managed `(0.75×0.4 + 0.60×0.6)` = 0.66, AI = 0.75
- chemMultiplier ×1.0 för AI, ×1.01 för managed (neutral kemi)
- → Asymmetri: ~0.66 vs 0.75 = ~12% styrkeförsämring. Det är signifikant.

Räkna ut det faktiska gapet om du hittar ett representativt fitness-värde via stresstest-loggen
(tittar i `season_stats.json` om det finns per-spelare-data), annars teoretisk beräkning.

**Rapportera:** Svar A eller B, och om B — ungefärlig magnitud (X% styrkeförsämring vid
normal trötthet). Ingen fix ännu.

═══════════════════════════════════════════════════════════════════════════
## DEL 3 — C-FT1 (c): Balans — är 25,5pp-effekten rätt kalibrerad?
═══════════════════════════════════════════════════════════════════════════

**Bakgrund:** Sekvens-testet (commit `a70a2b2`) mätte +25,5 procentenheters vinstchans för
en utvilad trupp vs en trött trupp. Det är stort. Frågan: är det rätt, för stort, eller
beroende av kontexten (tunn trupp vs djup trupp)?

**Utred utan att ändra:**

### 3.1 Vad styr recovery-hastigheten?

I `playerStateProcessor.ts`, hitta:
- Hur mycket fitness återhämtas per omgång utan match? (`+8`? `+10`? Beror på träning?)
- Hur mycket kostar en match? (`−15 till −25`? Konstant eller slumpat?)
- Vad är startvärdet på nyss skapad spelare (100? 80?)

Räkna: hur många omgångar utan match behöver en spelare med fitness 50 för att komma
tillbaka till 90? Det är spelarens "rotations-behov".

### 3.2 Hur bred är den normala fitness-spridningen?

Om du kan granska `season_stats.json` eller köra ett snabb-test: vad är median och
p10 (lägsta 10%) fitness i en normal trupp vid omgång 10–15 (mitten av säsongen)?
Det ger en känsla för om 25,5pp-effekten triggas ofta eller sällan i normalt spel.

### 3.3 Är 25,5pp stor givet `playerModifier`-formeln?

`base = (form/100)×0.4 + (fitness/100)×0.6`

Fitness väger 0.6 av base. En spelare med fitness 60 vs 100 (form=75 båda):
- Trött: `0.75×0.4 + 0.60×0.6 = 0.66`
- Utvilad: `0.75×0.4 + 1.00×0.6 = 0.90`
- Ratio: 0.66 / 0.90 = 73% av utvilad styrka. Det är en **27% styrkeförsämring per spelare**.

Med en hel elva i det läget är det enormt. Frågan är om fitness 60 är ett realistiskt
mittpunkts-scenario eller ett extremvärde som bara sker vid extrem rotering/tunn trupp.

**Rapportera:**
1. Recovery-hastighet + match-kostnad i siffror (från koden)
2. Typisk fitness-distribution i normalt spel om du kan hitta det
3. Din bedömning: är 25,5pp ett "normalt"-utfall (händer varje säsong) eller ett "worst case"
   (en tunn trupp som aldrig roterar)?

Ingen ändring. Jacob bestämmer om kurvan justeras efter rapporten.

═══════════════════════════════════════════════════════════════════════════
## DEL 4 — C-FT1 (a) plats 3: Portal fitness-sparkline (litet, bygg direkt)
═══════════════════════════════════════════════════════════════════════════

Design-handoffen (2026-05-23) specade tre platser för fitness-synlighet. Opus byggde
plats 1–2 i dag (lagstyrka-rad + trötthetsring + banner, batch `e656619..638abbf`).
Plats 3 saknas:

- Ersätt truppsiffran i Portal-baren med en mini-sparkline över team-avg-fitness
  senaste omgångarna. Klickbar → TaktikScreen.
- Datan finns redan: `teamFitnessHistory[].avgFitness` på SaveGame. Ingen ny pipeline.
- Återanvänd score-systemets `Sparkline`-primitiv. Ingen ny tier, ingen ny komponent.

Litet (~30 min). Detta är ren bygg, inte utred — stänger glappet mellan lagstyrka-modellen
(taktik/match) och Portal-översikten. Bygg, committa.

═══════════════════════════════════════════════════════════════════════════
## FORMAT FÖR RAPPORT
═══════════════════════════════════════════════════════════════════════════

Rapportera i chat. Kortformat:

```
C-SD1: [OK / TRASIGT — vad]
  Trigger: [rad + villkor korrekt/fel]
  Typ: ['regular_done' i AnslagKey: ja/nej]
  Display: [visas i X-vy, triggas vid Y]

C-FT1 (b):
  generateAiLineup sorterar på: [X]
  AI-fitness uppdateras: [ja (Svar A) / nej (Svar B)]
  Om Svar B — asymmetri: ~X% styrkeförsämring vid normal trötthet

C-FT1 (c):
  Fitness-återhämtning: +X/omg utan match
  Match-kostnad: −X till −Y/match
  Omgångar för fitness 50 → 90: N
  Typisk median-fitness omgång 12: X (om känt)
  Bedömning: [25,5pp = normalt / extremfall / okänt]
```

— Opus, 2026-05-25
