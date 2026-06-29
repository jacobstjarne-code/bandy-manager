# CODE-UPPDRAG — Notis-dieten + expiresRound (Försoningssprinten §4, Opus-lott)

**Datum:** 2026-06-11
**Källa:** Design-audit Del 13 §2 + Del 14 §6 (A8 i försoningskartan), Del 11 §9, Del 13 §7. Arbetsorder: `RELA-FORSONINGSSPRINT-2026-06-11.md` §4.
**Princip:** Inkorgen är "det du kan ha missat" — inte en logg över allt som hänt. 36 olästa efter 7 omgångar (~5/omgång) och 59 vid säsong 2-start är gameplay-fel, inte designfel.

Detta är GAMEPLAY-regler (vad som skapas), inte pixlar. Designs token-dots och en-ikon-per-rad ligger i Codes vanliga svep — blanda inte ihop passen.

---

## DEL A — Notis-dieten: regler för vad som ALDRIG skapas

Lokalisera varje creation-site för inbox-items (sök på de funktioner som skapar items, t.ex. `createMatchResultItem`, tränings-titelbyggaren `Träning omg`, media/pressklipps-skapandet i mediaProcessor). Rapportera listan av creation-sites FÖRST, sedan ändringarna — per code review-regeln: visa flödet, inte bara slutsatsen.

### A1 — Egna matchresultat skapas aldrig
Resultatnotis för match som spelaren själv spelat (managed club, live ELLER snabbsim) skapas inte — spelaren har just upplevt den i Granska. AI-matchers resultat berörs inte av denna regel (de har eget värde som omvärldsbevakning, och visas redan grupperat).

### A2 — Träningsrapporter: bara avvikelser
Rutinrapporten ("Träning omg 3: Fysik" ×4 identiska) skapas inte alls. Träningsnotis skapas ENDAST vid:
- träningsskada
- fokusbyte (spelaren ändrade träningsinriktning — kvitto)
- träningsprojekt klart/avbrutet

**Avvikelse från relä-formuleringen, medvetet:** Fable föreslog aggregering ("Träning omg 3–6: Fysik, inga incidenter" som EN rad). Aggregering kräver mutering av befintliga inbox-items (append-only-brott) och raden bär ändå noll information. Veckans rytm i Trupp/NU visar redan träningsfokus löpande — rutinen har en hemvist. Avvikelser är det enda inkorgen ska bära.

### A3 — Pressklipp: max ett per omgång
Per omgång väljs det högst prioriterade pressklippet (befintlig prio/severity om sådan finns, annars: managed club-subjekt > rival > övrigt). Resten skapas inte. Pressen lever redan i Granska/Omvärlden och Efterklang — inkorgen är inte tredje kopian.

### A4 — Dedup vid skapande
Samma (kind + subjekt + omgång) får inte skapa två items ("Skutskär efter matchen" ×2 i Del 13-fyndet). Guard vid creation, inte filter vid render.

### A5 — Arkivering vid säsongsskifte
Vid säsongsrollover: alla olästa items från föregående säsong markeras lästa/arkiverade (behåll i historiken — radera inte, Klubbminnet kan referera). Undantag: decision-items med levande `expiresRound` (se Del B) följer med öppna.

---

## DEL B — `expiresRound` obligatorisk på beslut

**Fynd:** "Utse kapten — Leif Leifsson?" låg oläst 5 omgångar utan tryck. Hallgren-budet låg 3 matcher med "svar krävs" utan deadline. D2-principen (Fresh-eyes): noll konsekvens är inte mjukhet, det är frånvaro.

### B1 — Typkrav
Varje decision-bärande item (inbox-decision, transferbud, kaptensval, sponsor-erbjudande, mecenat-krav, lobby-decision när den byggs) får obligatoriskt `expiresRound: number`. TypeScript: gör fältet required på decision-typen så nya beslut inte KAN skapas utan deadline.

### B2 — Default-deadlines per typ (Opus-beslut, justerbara i playtest)
| Typ | expiresRound |
|---|---|
| Transferbud (inkommande) | skapande + 2 omgångar |
| Utse kapten | skapande + 3 |
| Sponsor-erbjudande (inkl. skum) | skapande + 3 |
| Mecenat-krav | befintlig 3-ignorerade-mekanik står — expiresRound sätts per krav till skapande + 4 så raden får synlig deadline |
| Kontraktsförfrågan från spelare | skapande + 4 |

### B3 — Utgång = resolution med konsekvens, aldrig tyst borttagning
Vid `currentRound > expiresRound` resolverar beslutet med en default som har en konsekvens och ett kvitto (inbox-notis, läst-status oläst):
- **Transferbud:** budet dras tillbaka. Notis: kort, torr ("Hallgren-budet drogs tillbaka. De tröttnade på att vänta."). Ingen relationsstraff v1.
- **Utse kapten:** truppen/styrelsen utser själv (högst leadership/CA bland kandidaterna). Notis säger VEM. Spelaren kan byta senare som vanligt — kostnaden är att valet gjordes åt honom.
- **Sponsor-erbjudande:** förfaller. Notis: "Erbjudandet från X gick ut."
- **Kontraktsförfrågan:** spelaren tolkar tystnaden — moral-hit (befintlig storlek för missnöje), notis.

Konsekvenstexterna: skriv placeholder-strängar märkta `[Opus]` — jag kurerar i copy-poolrundan. Max en mening, understatement.

### B4 — UI-minimum (ingen design-runda krävs)
Decision-kort och inbox-rader med `expiresRound` visar "svar senast omg N" i befintlig muted-stil. Severity per ratificerade skalan: ≤1 omgång kvar → nivå 2 (danger-dot). Ingen ny komponent.

### B5 — Migration
Befintliga saves: alla öppna decisions utan `expiresRound` får `currentRound + typdefault` vid load.

---

## DEL C — Kondition utan varning (Del 12-fyndet, liten)

Spelare med kondition 0 visade "Frisk · Tillgänglig". Fix: availability-presentationen tar hänsyn till fitness — under tröskel (förslag 15) renderas chip "SLUT — behöver vila" (befintlig chip-vokabulär, severity nivå 1/copper). Ingen ny mekanik, ingen ny knapp — bara att mätaren slutar ljuga i etiketten. (Frivillig-moral-spaken är PARKERAD och ingår INTE här.)

---

## Acceptans
- Creation-site-lista rapporterad före ändring.
- Stress-test/seeds: inbox-volym efter 7 omgångar ≤ ~2/omgång (från ~5).
- Inga egna matchresultat, inga rutinträningsrapporter, max 1 pressklipp/omgång i ny säsong.
- Decision-typ kompilerar inte utan `expiresRound`; alla fem utgångs-resolutions testade.
- Migration verifierad på save med öppna gamla beslut.
- `npx tsc --noEmit` + tester gröna.

## INTE röra
`scheduleGenerator`, `currentMatchday`, matchCore. Designs inbox-pixlar (token-dots, ikoner) — eget svep.

**Rapportera:** A-delarna var för sig, B-resolutions med teststöd, C som egen rad.

— Opus, 2026-06-11
