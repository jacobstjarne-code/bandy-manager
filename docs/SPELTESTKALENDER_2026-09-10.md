# Speltestkalender — pre-release

**Datum:** 2026-09-10
**Beslut:** Jacob 2026-09-10. Tre spår parallellt: Codex strukturerat, Jacob "ny spelare", Jacob kurerad (Codex förbereder situationerna).

## Spår 1 — Codex, strukturerat (löpande)

Codex kör den långa karriären och de kvalitativa grindarna på schema och dokumenterar i `docs/playtest/`. Absorberar dessa MASTER-rader:

- **Grind 2/3** (pågående, 8 säsonger) — den enda dokumenterbara långkörningen. Codex lämnar domunderlaget till Opus efter full körning; testaren arkiverar inte själv.
- **`sluttest-validering-journal`** — följ-en-karriär-journalen ÄR Grind 2/3-journalen. Ingen separat körning; raden stängs mot journalen när grinden är klar.
- **`sluttest-regressionsvit-22-24`** (Skutskär, kvalitativa punkter) — Codex kör dem som en checklista i grinden och flaggar avvikelser vidare till Jacobs kurerade spår.
  - Punkt 22 → `sluttest-kvalitativ-uppfoljning`: minst två människor spelar samma svåra klubb med olika filosofi och markerar när rollspel övergår i mekaniskt val.
  - Punkt 23 → `sluttest-validering-journal`: efter minst 24 timmar, återberätta tre händelser, ett dyrt beslut och varför styrelsen var nöjd/orolig utan att först läsa spelets historik.
  - Punkt 24 → Grind 2/3-checklistan: varje ny storylinereplik som faktiskt möts ska kunna knytas till exakt state och ett relevant test; avvikelse blir en egen konkret post.

Kadens: en säsong per pass — landning + öppna frågor (Grind 3-kriteriet), plus den öppna Grind 2-frågan (köpartitionering: återkommer burnout-brytpunkten/klackkonflikten/patronkortet efter den centrala dedup-fixen?).

## Spår 2 — Jacob, "som ny spelare"

Färska ögon, ingen meta-kunskap. Onboarding → första säsong, spelad som någon som aldrig sett spelet. Frågorna: förstår jag vad jag ska göra, andas loopen, bär årsboken säsongen? Detta är den mänskliga halvan av `sluttest-kvalitativ-uppfoljning` — en riktig spelare (du). Full 6–8-spelarrunda är post-launch.

## Spår 3 — Jacob, kurerad (Codex förbereder)

Codex plockar situationer ur sin grind — beslutsögonblick, edge-cases, ställen där en dom behövs — och lägger dem som en kö för Jacob att bedöma. Codex förbereder, Jacob dömer. Hit landar de subjektiva kalibreringsfrågorna för mänskligt omdöme: fanMood, framgångskurvan, avskedskänslan, och kiosk-dubbletten om utredningen bekräftar den som produktfråga.

## Vad kalendern inte gör

Ersätter inte Opus grind-dom (kommer efter full körning) eller Design-polishen. Detta är QA-strukturen, inte releasekön.

## Öppna QA-rader som absorberas

| Rad | Spår | Not |
|---|---|---|
| `sluttest-validering-journal` | 1 | = Grind 2/3-journalen, ingen separat körning |
| `sluttest-regressionsvit-22-24` | 1 → 3 | Codex checklistar, flaggar till Jacobs kurerade kö |
| `sluttest-kvalitativ-uppfoljning` | 2 | Jacobs ny-spelare-run = partiell; full 6–8 post-launch |
| `sluttest-412-bildsnapshot` | — | Rent visuell QA, låg prio, post-launch eller Code på begäran |
