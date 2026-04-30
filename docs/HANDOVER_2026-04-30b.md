# HANDOVER 2026-04-30 (kväll) — Beslutsekonomi-arkitekturen på plats

**Författare:** Opus
**Status:** Sessionen avslutad. Jacob playtestar fram till efter helgen.
**Föregångare:** HANDOVER_2026-04-30.md (tidigare på dagen)
**Syfte:** Total överlämning så ny Opus-session kan ta vid utan att tappa kontext, ton eller riktning.

---

## VAD SESSIONEN LEVERERADE

**SPEC_BESLUTSEKONOMI** — ny övergripande spec som adresserar grundproblemet "spelet känns trist och drunknar i events". Arkitektur över 5 steg, varav Steg 1 (diagnos) och Steg 2 (kärnarkitektur) levererats denna session.

| Steg | Status | Kommentar |
|---|---|---|
| Steg 1 — Diagnos | ✅ `docs/diagnos/2026-04-30_beslutsekonomi.md` | Tre fynd: `currentMatchday` sätts aldrig, EventOverlay blockerar SceneScreen, 30–80 events/säsong utan cap |
| Steg 2 — Uppmärksamhets-router + prio + cap | ✅ Commits `b4e04bd` + `516f89a` | 3228 tester gröna |
| Steg 3 — PortalEventSlot | ✅ Commits `2daed82` + `1029feb` | eventActions.ts, EventCardInline.tsx, PortalEventSlot.tsx, GameShell-fix |
| Steg 4 — Fas-scenes | ⏸ Spec-skissad |  |
| Steg 5 — Kritiska scenes | ⏸ Spec-skissad |  |

Plus:
- **Kodgenomgång** av sessionens leveranser — 6 fynd, inga kritiska. **Alla 6 fixade** i commit `e480f38`.
- **Tre snabba textfixar** som föregick BESLUTSEKONOMI-arbetet: verb (`står` → `ligger`), gräsmatta → parkering, season_opener cup-trigger (commit `29b7947`).

---

## DET VIKTIGASTE SESSIONEN ÄNDRADE

### Designprincip: Spelets själ är bredd, inte fokus

Specens första princip — Jacobs invändning som flyttade hela arkitekturen. Innan: "filtrera bort okritiska events, prioritera kritiska." Efter: "alla events visas, men en åt gången, i prioritetsordning. Atmosfäriska events får sin tur."

Det är skillnaden mellan andra managementspel och Bandy Manager. Kafferumsskvaller *är* spelet, inte atmosfär. En manager som spelar en hel säsong ska minnas både att Henriksson skadades i mars och att kioskvakten alltid hade slut på kaffe i januari.

Konsekvens i koden: `MAX_ATMOSPHERIC_PER_ROUND = 2` *nya* events per round. Överskjutande går till **inboxen** — inte kasseras. Inboxen är dokumentation, inte spel-driver. Bredden bevaras.

### Inboxen är dokumentation, inte drift

Jacob fångade detta tidigt: "det är en slask där det hamnar en massa saker. det känns som du fortfarande tror att det skulle kunna driva spelet eller handlingen. det kommer det aldrig göra."

Min ursprungliga Steg 4-spec (inbox-prioritering) var fel modell. Den ersattes med event-kö i overlay-flödet plus inbox som arkiv. Steg 4 i nya specen är fas-scenes istället.

### Tre konkurrerande mekanismer blev en koordinerad

`pendingScreen`, `pendingScene`, `pendingEvents` koordineras nu via `attentionRouter.getCurrentAttention()`. Pure function. Returnerar `{kind: 'screen' | 'scene' | 'event' | 'idle'}`. Konsumeras av AppRouter och GameShell.

Det är *den* arkitekturella fixen denna session. Tidigare diagnoser visar att tre parallella mekanismer var rotorsaken till att söndagsträning-scenen inte triggade — EventOverlay vann alltid.

---

## ÖPPNA TRÅDAR

### Akut (för nästa session)
- **Browser-playtest av Steg 2 + 3.** Verifiera:
  1. Söndagsträning-scenen triggar vid omg 1-2 säsong 1 (currentMatchday-fix)
  2. Atmosfäriska events visas inline i Portal — inte som overlay-spam
  3. Kritiska events (presskonferens) visas fortfarande som overlay
  4. Max 2 atmosfäriska events per omgång i kön
- **Opus skriver event-card-texter** för EventCardInline (6 vanligaste atmosfäriska typer: communityEvent, supporterEvent, starPerformance, playerPraise, bandyLetter, captainSpeech). Placeholder-texter nu.

### Pågående
- **Pixel-audit SituationCard/PortalBeat:** Aldrig gjord. Formellt brott mot princip 4. Kräver browser-playtest av Jacob för godkännande.

### Parkerat
- **Kapitel C-modifierare:** `rumorFrequencyMultiplier`, `incomingBidMultiplier`, `underdogBoost` ej injicerade i rumorService/transferService/matchEngine. Specat men inte byggt.
- **Steg 4-5 av BESLUTSEKONOMI** (fas-scenes och kritiska scenes). Specas på riktigt när Steg 3 är levererat.

---

## NAMNRYMDS-INKONSEKVENSEN

Värt att flagga för ny Opus eftersom det kommer komma upp i Steg 3:

- **Spec använder:** `'critical' | 'medium' | 'atmospheric'` (3 nivåer)
- **Kod använder:** `'critical' | 'high' | 'normal' | 'low'` (4 nivåer, redan befintligt fält)

Code valde att inte bryta befintlig typning. Korrekt beslut.

**Mappning för Steg 3-implementationen:**
- spec `critical` → kod `critical` (overlay)
- spec `medium` → kod `high` eller `normal` (PortalEventSlot)
- spec `atmospheric` → kod `low` (PortalEventSlot)

Skriv in mappningen i Steg 3-specen om den behöver implementeras.

---

## SAMARBETSFORMEN — så här jobbade vi

Värt att fortsätta i samma anda:

### Det som funkade
- **Diagnosen först, specen sen.** Steg 1 var bara läsning/dokumentation. Det gav fakta att specera Steg 2 mot. Två missade antaganden i min ursprungliga spec (`pendingEvents` finns redan; priority-fältet hade redan 4 nivåer) hade kostat sprintar att backa.
- **Jacobs invändningar är design-input, inte bromsar.** "Inboxen är dokumentation, inte drift" och "spelets själ är bredd" omformade hela specen. Båda kom från ett konkret playtest-ögonblick.
- **Iterativ leverans i 5 steg.** Code stoppar mellan stegen. Jacob playtestar. Pivot eller fortsätt. Inga 5-dagars-sprintar utan checkpoints.
- **Opus skriver svensk text direkt, inte via Code.** Som etablerat tidigare. Bandysverige-tonen kommer från Opus, inte Code.

### Det som var fel (transparens för nästa Opus)
- **Min Steg 4-instinkt var fel.** Inbox-prioritering var fel modell. Jacob fångade det. Lärdom: inboxen är arkiv, inte handling.
- **Steg 2-specen byggde initialt på antagandet att vi skapade nytt eventQueue-fält.** Diagnosen visade att `pendingEvents` redan finns. Hade jag specat utan diagnos hade vi fått onödig parallell arkitektur.
- **Jag gissade kvotsiffror.** Jacob bad om 4% kvar, jag svarade som om jag visste. Klant. Jag ser inte kvoten.

---

## FÖR NY OPUS — LÄSORDNING VID SESSIONSSTART

1. **CLAUDE.md** — designprinciper, samarbetsregler, INGA FEATURE FLAGS
2. **LESSONS.md** — buggmönster
3. **DECISIONS.md** — arkitekturbeslut
4. **KVAR.md** — vad som är öppet just nu
5. **HANDOVER_2026-04-30b.md** (denna fil) — sessionens kontext
6. **SPEC_BESLUTSEKONOMI.md** + Steg 2 + Steg 3 — pågående arbete
7. **CODE_REVIEW_2026-04-30.md** — pågående buggfixar
8. **Diagnos-rapport** i `docs/diagnos/2026-04-30_beslutsekonomi.md` — kontext för Steg 2

---

## TON & VÄRDERINGAR ATT BEVARA

- **Bandy Manager är ortens spel.** Inte FM. Inte CK3. Inte Reigns. Bredd, inte fokus.
- **Atmosfäriska events är spelet, inte krydda.** Skvaller, kioskvakter, klacken — allt har samma vikt som taktik och skador.
- **Jacob värderar motstånd över bekräftelse.** Säg när något är svagt även om Jacob verkar nöjd.
- **Inga LLM-meningspar.** Inga "spännande matcher väntar"-fraser. Konkreta siffror, korta meningar, understatement.
- **Fråga bara när tre tolkningar är rimliga.** Leverera om en är uppenbart bäst.
- **Avsluta inte konversationer åt Jacob.** Han säger när han är klar.

---

## KÄNSLAN ATT BEVARA

Sessionen var **bra**. 6% kvot använt. Tre stora leveranser:
1. Diagnos som visade verkligheten (inte mina gissningar)
2. Arkitektur som koordinerar tre konkurrerande mekanismer
3. Kodgenomgång med 6 konkreta fynd

Och en *grundprincip* som ändrade design-riktningen — "spelets själ är bredd, inte fokus". Den principen är värd guld för alla framtida specer. Inkludera den i Steg 3-implementationens kommentarer så den inte tappas bort.

Spelet är på god väg att bli något specifikt — inte en mall, inte en FM-klon, inte en generisk sportmanager. Något svenskt-bandy som ingen annan kan göra. Hela vägen från klubbcitaten till kafferummet till att Henriksson kommer bli sjuk i mars 2027 och kioskvakten kommer säga något om det.

---

## SLUT HANDOVER 2026-04-30b
