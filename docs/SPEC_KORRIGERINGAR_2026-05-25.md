# SPEC — Korrigeringar 2026-05-25 (chatt-genomgång + audit-skuld)

Genomgång av hela sessionen avslöjade synliga buggar och process-skuld som hoppats över. Ordnade. Varje punkt: symptom → var/rotorsak → åtgärd → verifiering.

**INNAN DU BÖRJAR:** grep-disciplin (CLAUDE.md Princip 2 + LESSONS #33/#35). Läs kodläget innan du agerar på ett statuspåstående. Bygg + test efter varje punkt.

Redan fixat av Opus (bara bygg + commit):
- **Fan mood → svenska.** `boardObjectiveService.ts`, `growFanbase`: label `'Fan mood ska nå 70'` → `'Klackens humör ska nå 70'`, beskrivning `"Fan mood 70"` → `"Humöret uppe i 70"`. Engelska mitt i STYRELSEN-kortet.
- **Cup-vinst-text** (tidigare): `cupAnslag.ts` `cup_done_winner` v2 omskriven. Ligger redan, bara bygg.

(Inte med här: "Sdaa" var Jacobs spelarnamn, inte bugg.)

---

## 1. Vinstscenens poängordning kastad

**Symptom:** Cup-final-granska (`SLUTRESULTAT`) visar Västanfors 5 – Målilla 6 (hemma–borta, Målilla vann borta). Cup-vinst-scenen (CUPMÄSTARE 2026) visar `6−5` med "Västanfors — Målilla" under — läses som Västanfors 6, alltså omvänt mot granska och mot vem som vann.

**Var:** Cup-vinst-scenen (CUPMÄSTARE-vyn, C-SP5-scenen). Grep efter "CUPMÄSTARE" / scenen som renderar pokal + score.

**Rotorsak (att bekräfta):** Scenen renderar score-siffrorna i annan ordning än sina lagetiketter — antingen vinnare-först mot hemma–borta-etiketter, eller hämtar home/away-score omvänt.

**Åtgärd:** Rendera score i samma hemma–borta-ordning som lagetiketterna, konsekvent med granska (`5−6 / Västanfors — Målilla`). Läs scenens datakälla (fixture/report) och bekräfta vilket fält som är home resp. away innan du vänder något.

**Verifiering:** Scenen och granska visar samma score i samma ordning.

---

## 2. gold-tokens + SMFinalPrimary — verifiera status

**Symptom/skuld:** Tidigare flaggat som 🟥 BLOCK ur resterande-tickets, men aldrig stängt. ScoreBlock gold-varianten fungerar i produktion nu, så tokens kan ha landat — oklart.

**Åtgärd:** Verifiera mot `design-system/colors_and_type.css` att `--gold-deep` + `--shadow-gold` finns. Verifiera att `SMFinalPrimary.tsx` använder `--gold` (inte `--match-gold`). Är båda redan rätt → stäng punkten, rapportera "redan klart". Är något fel → fixa enligt resterande-tickets-handoffen.

**Verifiering:** Tokens finns; SMFinalPrimary använder rätt guld-token. Rapportera vilketdera.

---

## 3. Score-migration — rapportera faktiskt läge

**Skuld:** OPEN THREADS säger "Våg 2–4 per DESIGN-DECISIONS.md" men ingen har läst den och bekräftat vad som faktiskt är migrerat vs kvar. Auditen från 2026-05-23 är stale (tre ytor visade sig redan gjorda).

**Åtgärd:** Läs `design-system/DESIGN-DECISIONS.md` + grep ScoreBlock/Sparkline-användning. Rapportera en färsk lista: vilka ytor är migrerade, vilka återstår (Våg 2 victory scenes, Våg 3 trend-data, Våg 4 featured). Det är en statusrapport, inte ett bygge — så vi slutar speca mot stale audit.

**Verifiering:** Färsk migrations-status levererad till Opus/Jacob.

---

## 4. BACKLOG-korrigering

**Skuld:** BACKLOG har felaktiga "spec-ready/ej byggt"-rader som Opus skrev tidigare i sessionen för saker som sedan byggdes. Code stängde C-K1 + D1 men inte resten.

**Åtgärd (Code, ni vet vad som shippats):** Markera levererat / ta bort stale rader för: C-MK1 (Fas 1 + Fas 2 byggda), C-SY1#4 manager-kvitto (byggt), score-primitiver + Våg-1-migreringarna (byggda), C-U1 (byggt). BACKLOG ska spegla faktiskt kodläge, inte Opus tidigare gissningar.

**Verifiering:** BACKLOG:s "specat men ej byggt"-sektion innehåller bara saker som faktiskt inte är byggda.

---

## 5. C-SY1#1 Efterklang — bygg

**Status:** Text klar (`efterklangText.ts`). Primitiverna (ScoreBlock/Sparkline) finns nu, så blockeringen är borta.

**Åtgärd:** Bygg `EfterklangSecondary` per `HANDOFF-C-SY1-EFTERKLANG-2026-05-23`: `--cold` Portal-secondary, max 2 minnen, ↻-eko-rad per minnestyp (8 typer i `EFTERKLANG_ECHO`), picker över minneskällorna (klackEcho, journalist, followUp, boardObjective, nemesis, economicScar, rivalSale, anniversary).

**Verifiering:** Renderar i Portal-kontext med faktiska minnen, inte bara att filen finns (CLAUDE.md verifieringsprotokoll).

---

## 6. D-fact för AI fitness-golvet

**Skuld:** AI fitness-golvet (`f688117`) införde `AI_FITNESS_FLOOR=40`, `AI_ROTATION_CA_TOLERANCE=8`, `AI_REPLACEMENT_MIN_FITNESS=60` utan D-fact. CLAUDE.md kräver D-fact-uppdatering vid magnitudändring.

**Åtgärd:** Skapa/uppdatera D-fact för dessa konstanter i Bandy-Brain-kunskapsbasen. Kör `python3 scripts/validate_brain.py` och bekräfta rent.

**Verifiering:** D-fact finns, validatorn grön.

---

## 7. C-V1 OpponentForm — verifiera vid nästa playtest

OpponentForm-kortet kändes tomt/ihoppressat i tidigare playtest. Det har nu fem ScoreBlock compact (migrerat). Sannolikt mootat. Ingen åtgärd nu — bekräfta visuellt vid nästa playtest att kortet känns fyllt. Om det fortfarande är tomt → designrunda.

---

## 8. HANDOVER

**Skuld:** Sessionsslut-plikt (CLAUDE.md). Inte skriven.

**Åtgärd:** Skriv `docs/HANDOVER_2026-05-25.md`: leveranser + commits denna session, aktiva jobb, nyckelbeslut (C-FM1 avförd big version, score-audit stale, manager-som-karaktär stängt), kvarstående frågor, föreslagen ordning nästa session (playtest av kalenderflytt + manager-burnout + landslag först).

---

## Ordning

1 (synlig bugg) först. 2 + 4 är snabba (verifiera/städa). 3 är en läsning. 5 (Efterklang) är ett riktigt bygge. 6 + 8 är process-doc, kan göras sist. 7 väntar på playtest.
