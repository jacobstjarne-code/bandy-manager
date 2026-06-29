# CODE-ORDER — CRITICAL: soft-lock vid <11 spelklara (nödtrupp)

**Datum:** 2026-06-15 · **Av:** Opus · **Rotorsakad i källan.** RC-BLOCKERANDE — total soft-lock, en extern testare träffar den garanterat (Jacob träffade den omg 2: tre skador → 10 spelklara → kan inte spela vidare, ingen escape).
**Modell:** Sonnet för 1–2 (mekanik mot tydlig spec), Opus skriver copy (3).

## Symptom
Tre spelare skadade omg 2 → 10 spelklara. `setLineup` kräver exakt 11 icke-skadade/icke-avstängda; `LineupStep` `canPlay` blir aldrig sant; "Nästa: Taktik →" är permanent disabled. Ingen väg vidare. Säsongen död.

## Rotorsak (verifierad)
- `setLineup.ts`: hård gate — `startingPlayerIds.length !== 11` → fel, och varje `isInjured`/`suspensionGamesRemaining > 0` → fel. Inget golv, ingen nödväg.
- `LineupStep.tsx`: `canPlay` styr enda CTA:n. Färre än 11 tillgängliga → CTA disabled för evigt.
- Ingen mekanism fyller upp en managed trupp som faller under 11 spelklara mitt i säsong. (seasonEndProcessor har `squad replenishment` safety-net 14, men det körs bara vid säsongsslut — skador mitt i säsong fångas inte.)

## Lösning — tre lager (Jacobs prioritetsordning: akademi primärt, nödvärvning, walkover som sista utväg)

### Lager 1 (primärt) — kalla upp akademispelare
När managed klubb har < 11 spelklara inför en match: erbjud spelaren att promota YouthPlayer(s) ur `game.youthTeam.players` till tillfälliga/permanenta seniorspelare tills truppen når minst 11 spelklara (helst 13–14 för byten).
- Återanvänd den BEFINTLIGA youth→senior-konverteringen (`promotedFromAcademy`-vägen i seasonEndProcessor — extrahera till en delad `promoteYouthPlayer(youthPlayer): Player` om den inte redan är delbar).
- Prioritera position som matchar bristen (saknas en back → promota en YouthPlayer-back).
- Detta är dessutom NARRATIVT rätt: "Tre skadade — vi får kasta in en junior" är precis brukssamhälls-bandy. En 16-åring som debuterar i nöd är en bättre historia än en walkover.

### Lager 2 (om akademin är tom/otillräcklig) — nödvärvning fri agent
Om youthTeam inte räcker till 11: erbjud en nödvärvning ur `transferState.freeAgents` (en gammal räv som går att ringa in på matchdagen). Lägre CA, men spelbar. Speglar verkligheten — en klubb i kris ringer en pensionerad lokalprofil.

### Lager 3 (extremfall — ingen akademi, inga fria agenter) — walkover
Bara om Lager 1+2 inte kan nå 11: matchen spelas som walkover-förlust (0–3 eller bandykanonisk siffra), med en inkorgsrad som förklarar. Detta ska vara EXTREMT sällsynt — Lager 1+2 ska nästan alltid räcka. Walkover är inte en spelmekanik vi vill ha som default; den finns bara så att spelet aldrig kan låsa sig.

## Trigger & UI
- Detektera < 11 spelklara (icke-skadade, icke-avstängda, i managed squad) INNAN LineupStep renderar sin disabled-vägg.
- Visa ett **nödtrupp-kort/scen** före lineup: "Du har bara {n} spelklara. [Kalla upp junior] / [Nödvärva fri agent] / (walkover om inget annat går)". Decision-card-mallen.
- Efter promotering: spelaren hamnar i squad, LineupStep fungerar normalt, canPlay kan bli sant.
- **Viktigt:** detta får INTE bli en tyst auto-promotering — spelaren ska se valet (vem kallas upp?), det är ett betydelsefullt ögonblick. Men det får heller aldrig blockera: om spelaren inte väljer, defaulta till bästa tillgängliga junior så vägen alltid finns.

## Verifiering
1. Skada 3 spelare (dev-verktyg) → gå till match → nödtrupp-kortet ska visas, inte den disablade väggen.
2. Promota junior → tillbaka till lineup → canPlay blir sant → matchen spelbar.
3. Tom akademi + tom free-agent-pool → walkover-vägen ska finnas (konstruera testfallet).

## Commit
`fix: nödtrupp vid <11 spelklara — akademi/fri agent/walkover (critical soft-lock)`

---

## SEPARAT (samma fil, passa på) — emoji på knappar i LineupStep
`LineupStep.tsx` har emoji C-svepet missade: **⚙ Formation** (label), **✨/SPARKLE** (fyll-knapp har redan SVG men ✓-fallback ok), **⚠️** i varningsrutorna. ⚙ och ⚠️ på funktionsytor strider mot B3 (Lucide, inte emoji). Byt ⚙→Lucide Settings/Sliders, ⚠️→Lucide AlertTriangle eller danger-dot. Egen liten commit, lint:design.

— Opus, 2026-06-15
