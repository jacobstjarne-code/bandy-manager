# Textgranskning — klackEcho cause-prefix (C-SY1 #2 Pilot 1)

**Datum:** 2026-06-01
**Källa:** Opus-levererade strängar i spec (SKISS_SYNLIGHETSSPRINT §2, pilot 1)
**Fil:** `src/domain/data/klackEchoText.ts` → `KLACK_ECHO_CAUSE_PREFIXED`
**Antal:** 24 strängar (2 per voice per 6 event-types)

## Princip
Cause-prefixade varianter plockas i 35% av visningarna när orsaken är färsk
(1–4 omg sedan eventet). Naturlig prosa per variant — inte mekanisk
"Sedan X. [text]"-ihopklistring. Samma persongalleri som KLACK_ECHO
(Birger/Birgitta/Magnus/pojken/min granne/min farbror).

## Tongranskning
- ✅ Bandysvensk understatement, ingen AI-prosa
- ✅ Cause-referensen invävd i meningen ("Tre veckor sen derbyt — och min Birgitta...")
  inte påklistrad som etikett
- ✅ Inga corporate-floskler, inga triple-parallels, sparsamt med tankstreck
- ✅ Persongalleriet konsekvent med befintlig pool
- ✅ Varje variant står som egen naturlig replik

## Dosering verifierad
Enhetstest `klackEchoCausePrefix.test.ts`: 35%-tak respekteras (mätt 32–38% över
1000 körningar med färsk cause), 0% vid irrelevant cause.

## Playtest-flagga
Per spec: om 35% känns för mycket → justera `KLACK_ECHO_CAUSE_PREFIX_THRESHOLD`
ner mot 0.25. Om osynligt → upp mot 0.45. Avvakta minst en playtest-runda före
skalning till fler pools (csPress, RIVAL_SALE, pendingFollowUps).
