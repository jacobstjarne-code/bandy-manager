/**
 * MEASUREMENT-ONLY. A-H2b RETENTION — VILLKOR 2 GATING (2026-08-29).
 *
 * Bakgrund (SLUTTEST_KO.md A-H2b-fyndet, dokumenterat 2026-08-28): den
 * shippade retention-domen (DOM_AH2B_RETENTION_2026-08-28.md, commit
 * a55d4139) implementerade bara villkor 1 (individuellt obemött
 * marknadskrav, salary < computeContractMinSalary). Villkor 2 — domens EGET
 * ord, ordagrant citerat i SLUTTEST_KO.md: "klubben ska ha gjort minst ETT
 * av tre — slutat topp tre, vunnit serien eller cupen, eller förbättrat sin
 * placering mot föregående säsong" — fanns bara i doktrintexten, aldrig i
 * contractDemandService.ts. Ett mittenlag såg därför 6-7 krav/säsong (varje
 * enskild överpresterare räckte, oavsett om KLUBBEN lyckats).
 *
 * Villkor 2 är nu byggt (contractDemandService.ts:
 * clubSatisfiesSeasonSuccessGate, AND:ad in i computeSeasonEndContractDemands
 * FÖRE per-spelar-loopen). Detta script mäter effekten.
 *
 * ── METODIK ─────────────────────────────────────────────────────────────
 * "EFTER" (skeppad kod, dörr a+b+c) är fullt reproducerbart: kör den
 * OFÖRÄNDRADE scripts/anspark1-retention-matning-2026-08-28.ts — den
 * anropar hela produktionspipen (seasonEndProcessor.ts →
 * computeSeasonEndContractDemands) oförändrad, så villkor 2 exercised
 * automatiskt. Ingen kod i DETTA script duplicerar den arm.
 *
 * "FÖRE" (ingen grind, ren villkor-1) och "DÖRR A+B ENDAST" (utan
 * positionsförbättring) kräver en tillfällig källkodspatch — INTE
 * reproducerbar utifrån, av en arkitektonisk anledning värd att notera:
 * `game.playoffBracket`/`game.cupBracket` nollställs/byts ut till NÄSTA
 * säsongs bracket SOM EN DEL av samma rollover-objekt seasonEndProcessor.ts
 * bygger (samma rader som sätter pendingContractDemands). Ett script som
 * läser `game` EFTER att advanceToNextEvent returnerat ser alltså aldrig
 * den avslutade säsongens mästare/cupvinnare — den informationen finns bara
 * levande INUTI seasonEndProcessor.ts, i samma ögonblick grinden prövas.
 * Detta är samma skäl som gör villkor 2 svårt att measurement-mocka utifrån
 * (ingen ren "läs game efteråt och räkna om"-väg finns för dörr b).
 *
 * Den tillfälliga patchen som gav FÖRE/DÖRR-A+B-siffrorna nedan (körd
 * 2026-08-29, reverterad direkt efter, `git diff` bekräftat rent innan
 * leverans):
 *
 *   // i clubSatisfiesSeasonSuccessGate, överst i funktionskroppen:
 *   if (process.env.AH2B_BYPASS_VILLKOR2 === '1') return true
 *   // ... och för dörr-c-isolering:
 *   const improvedPosition = process.env.AH2B_DISABLE_DOOR_C === '1'
 *     ? false
 *     : previousPosition !== undefined && finalPosition < previousPosition
 *
 * Körning: AH2B_BYPASS_VILLKOR2=1 node_modules/.bin/vite-node
 *   scripts/anspark1-retention-matning-2026-08-28.ts     (→ FÖRE, ingen grind)
 * Körning: AH2B_DISABLE_DOOR_C=1 node_modules/.bin/vite-node
 *   scripts/anspark1-retention-matning-2026-08-28.ts     (→ DÖRR A+B ENDAST)
 * Körning: node_modules/.bin/vite-node
 *   scripts/anspark1-retention-matning-2026-08-28.ts     (→ EFTER, skeppad kod)
 *
 * Samma seeds/policy-pooler i alla tre körningar (DOMINANT_SEEDS=[100..104]
 * club_vastanfors +10 CA, MIDTABLE_SEEDS=[2..6] club_malilla orörd, 8
 * säsonger). Trajektorierna DIVERGERAR mellan körningar (möt-alla-policyn
 * höjer löner, vilket ändrar nästa säsongs computeContractMinSalary-bas) —
 * jämförelsen är alltså poolade säsongsmedelvärden över samma seed-mängd,
 * inte en per-säsong parad diff. Det är samma metodik alla tidigare
 * anspark1-script i den här serien använder (policyjämförelse via poolade
 * snitt, inte parad trajektoriematchning).
 *
 * ── RESULTAT (2026-08-29, 5 seeds/klubbtyp, 8 säsonger, meet-all policy) ──
 *
 *  Krav/säsong (snitt, poolat):
 *                          FÖRE (ingen grind)   DÖRR A+B ENDAST   EFTER (skeppad, a+b+c)
 *  Dominant (club_vastanfors)     9.36               7.24               7.46–7.52
 *  Mittenlag (club_malilla)       6.85               1.88               3.61
 *
 *  Slutsats: villkor 2 SOM SPECAT (tre dörrar, ordagrant ur doktrinen)
 *  halverar mittenlagets kravfrekvens (6.85→3.61) men gör den INTE
 *  "sällsynt" i den mening SLUTTEST_KO-sammanfattningen förutspådde. Rotorsak,
 *  isolerad ovan: dörr (c) — "förbättrat sin placering mot föregående
 *  säsong" — slår in ~50 % av säsongerna för ett mittenlag av ren
 *  positionsbrus (ett lag utan dominans studsar upp och ner i tabellen
 *  slumpmässigt år för år; ingen "riktig" förbättring krävs, bara att
 *  ETT snäpp bättre än förra året). Med BARA dörr a+b (topp-3/titel/cup)
 *  landar mittenlaget på 1.88/säsong — det ÄR sällsynt, vilket bekräftar att
 *  dörr a+b gör allt det tunga arbetet och dörr c är den som luckrar upp
 *  grinden för ett lag som inte lyckats i någon meningsfull bemärkelse.
 *
 *  Dominant klubb rörs knappt av dörr c (9.36→7.24 med bara a+b, 7.46–7.52
 *  med alla tre) — väntat, eftersom en dominant klubb redan träffar dörr
 *  a/b nästan varje säsong; dörr c lägger inget extra ovanpå för den
 *  klubbtypen. Ordningen mellan klubbtyperna (dominant > mittenlag) håller
 *  i alla tre varianter.
 *
 *  IMPLEMENTERAT SOM SPECAT (doktrinens tre dörrar, ordagrant) — detta
 *  script ändrar INGET i produktionskoden. Fyndet ovan är en observation
 *  att rapportera till Jacob/Opus, inte en anledning att avvika från
 *  doktrinen på egen hand (uttrycklig instruktion: "follow the existing
 *  doctrine literally, don't redesign it").
 *
 * ── AVGÅNGSKALIBRERINGEN (anspråk 2, oförändrad kedja) — bekräftad kvar ──
 * Från den OFÖRÄNDRADE anspark1-retention-matning-2026-08-28.ts-körningen
 * (EFTER-arm, skeppad kod, se DOMSLUT-blocket i det scriptets egen output):
 *   - Dominant, möt alla:  ~0.88–0.96 avgångar/säsong (anspråk 2:s grundpris
 *     — betalar du allt förlorar du ändå ~1 spelare/säsong — KVARSTÅR)
 *   - Dominant, möt inga:  ~1.86–1.96 avgångar/säsong (klart mer än möt-alla
 *     — levern fungerar, JA)
 *   - Mittenlag, möt inga: ~0.95–1.00, möt alla: ~0.48 (mittenlaget rör
 *     mekaniken sällan jämfört med dominant möt-inga — JA)
 * Alla tre domslut håller EFTER villkor 2 lades till, identiskt med domens
 * egna kriterier i DOM_AH2B_RETENTION_2026-08-28.md.
 *
 * Kör detta script för att se metodiktexten ovan igen (ingen egen
 * simulering körs härifrån — se anspark1-retention-matning-2026-08-28.ts
 * för den körbara delen).
 */

console.log(`
A-H2b VILLKOR 2 — MÄTNING 2026-08-29 (se filhuvudet för fullständig metodik/resultat)

Kör:
  node_modules/.bin/vite-node scripts/anspark1-retention-matning-2026-08-28.ts
för EFTER-siffrorna (skeppad kod, dörr a+b+c) — fullt reproducerbart, ingen patch.

FÖRE/DÖRR-A+B-siffrorna i filhuvudet kräver den dokumenterade tillfälliga
patchen (se kommentaren ovan) — arkitektoniskt begränsat till en körning
INUTI seasonEndProcessor.ts eftersom playoffBracket/cupBracket för den
avslutade säsongen inte överlever till ett externt script.
`)
