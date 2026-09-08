# DOM — subject2Snapshot: akademi-liggarens schemablockerare

**Datum:** 2026-09-08 · **Av:** Opus · **Beställd av:** Jacob (kör) · **Grund:** `DOM_AKADEMI_LIGGARE_2026-09-04 §2` + §7 steg 1, `Narrative.ts` (`EventLedgerEntry`). Löser den öppna schemapunkt Code var blockerad på ("akademi-liggare-dom — schemaval för subjectSnapshot"). Detta kompletterar DOM_AKADEMI_LIGGARE, ersätter den inte.

## Diagnosen (kodläst)

`EventLedgerEntry` bär två separata polymorfa subjekt: `subject?: { kind; id }` och `subject2?: { kind; id }` (subject2 för genuina två-parts-händelser — transfer_story, rival_sale, och akademins `mentorship_*`/`loan_*`). Men schemat har bara ETT `subjectSnapshot?: { name; position?; age? }`, och §2-kommentaren säger att det ska fyllas "för alla spelar-subjekt (subject OCH subject2 om kind==='player')". Det är omöjligt med ett fält.

Konkret trasigt: `mentorship_started` bär junioren (subject, player) och mentorn (subject2, player) — båda kan lämna sina arrayer (junior åldras ut ur `youthTeam`, mentor säljs ur `players`), båda namn måste överleva, men det finns bara ett snapshot att fylla. Ett fält kan inte bära två namn.

## Domen — ett andra platt fält, speglar subject2

`EventLedgerEntry` får `subject2Snapshot?: { name: string; position?: string; age?: number }` — ett andra platt fält som speglar `subject2` exakt som `subjectSnapshot` speglar `subject`.

- `logEvent` fyller `subjectSnapshot` när `subject.kind === 'player'`, och `subject2Snapshot` när `subject2.kind === 'player'`. ENDAST spelare — `club`/`mecenat`/`patron`/`referee`/`voice` slås upp via id vid vy-tillfället och försvinner inte ur en array på samma sätt; bara spelare lämnar `game.players`/`youthTeam.players`. Håller fältets syfte smalt (§2: "bara namn/position/ålder, ingen duplicering av spelarschemat").
- `resolveSubjectName` läser `subjectSnapshot` först för subject-namnet, `subject2Snapshot` först för subject2-namnet, `game.players` som fallback för var och en (bakåtkompatibelt).

## Varför två platta fält, inte en nycklad/array-struktur

Schemat har redan bundit sig vid platt `subject` + `subject2` (inte en array av subjekt). Två platta snapshot-fält speglar den formen exakt och håller `resolveSubjectName` enkel (den resolvar redan subject och subject2 var för sig). En nycklad `snapshots: { subject?, subject2? }` eller array skulle divergera från schemats egen dual-flat-form och komplicera varje läsare utan vinst. By-the-book: spegla det som redan finns.

## SKYDDAT

- `subjectSnapshot`s befintliga form och §2-kontrakt står oförändrat — detta lägger bara till syskonet.
- Bägge fält optional, bakåtkompatibelt. Backfill: från `game.players` där spelaren finns, annars lämnas tomt och vyn visar "en spelare" i stället för att kasta posten (§2, oförändrat).
- Bara spelar-subjekt snapshotas. Icke-spelare rörs inte.
- Determinism/ren sanning: snapshotet är namn/position/ålder vid skrivtillfället, ingen härledning.

## Ägarskap

Code: lägg `subject2Snapshot` på `EventLedgerEntry`, låt `logEvent` fylla båda per regeln ovan, låt `resolveSubjectName` läsa båda med fallback, och rätta §2-kommentaren i `Narrative.ts` så den namnger `subject2Snapshot` (den påstår idag att ett fält täcker båda). Detta ÄR `DOM_AKADEMI_LIGGARE §7 steg 1` ("subjectSnapshot på schemat + logEvent fyller det — grunden, litet") — nu odblockerad. Avgejtar de åtta akademi-liggartyperna. Opus: denna dom. Jacob: mandatet givet.
