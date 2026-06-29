# SPEC — Promise↔consequence-audit

Körs som EGEN färsk session (läs-tung). Detta är den runda handovern 2026-06-18 pekar på.
Bakgrund: lärdom #41 (LESSONS.md), beslut 2026-06-18 (DECISIONS.md).

## Vad
Systematisk genomgång av VARJE spelar-vänd yta som lovar eller antyder en effekt/relation,
och kontroll att löftet backas av en riktig, läsbar konsekvens.

## Varför
Spelkänsle-playtesten 2026-06-18 ytade fyra fall av samma klass på en session — efterklang i
rématch-röst utan rématch, veckans-beslut "+taktikinsikt"/"+positionering" som stub, Frida-tifo som
förfrågan utan svarsknapp, "Fönstret öppet" utan referent. De kommer en i taget i playtest och kostar
tid. En systematisk audit fångar hela klassen på en gång.

## Metod
För varje yta:
1. Läs koden som GENERERAR texten OCH koden som APPLICERAR effekten/hanterar handlingen.
2. Jämför löftet (vad ytan säger eller antyder) mot vad systemet faktiskt gör.
3. Klassa: BACKAS (ok) / STUB (lovar mekanik som inte finns) / FEL KONTEXT (antyder förhållande som
   inte råder) / DÖD (ber om handling utan handlingsyta) / OSYNLIG (effekt finns men spelaren ser den aldrig).
4. För varje icke-ok: fix-riktning + ägare (Code mekanik / Opus copy).

Verifiera mot KÄLLAN, inte minne (lärdom #33, #42). Notera build vs HEAD.

## Ytor att gå igenom (checklista)
- **Veckans beslut** — alla optioner i `weeklyDecisionService.ts` (resolveWeeklyDecision): etikett vs
  returnerad effekt. KÄNT: scout_opponent_corners + matchprep-positionering är stubs (= order #11, byggs klart).
  Audita RESTEN för fler stubs/osynliga effekter.
- **Efterklang** — eko-typerna i `pickEfterklang.ts` + `efterklangText.ts`: surfar de i rätt kontext?
  KÄNT: nemesis fel motståndare (= order #9).
- **Inkorg** — `InboxScreen.tsx` + item-genereringen: vilka poster är förfrågningar/beslut utan action?
  KÄNT: Frida-tifo, Helena (= order #12).
- **PortalBeats** — `portalBeats.ts`: varje beat, är referenten tydlig, lovar den handling den inte kan ge?
  KÄNT: fönster-beaten copy-fixad, länkfrågan = öppet beslut #14.
- **Kafferum** — spectator/kafferum-text: citat som antyder mekanik som inte finns?
- **Klack** — `klackEchoText.ts` + supporterGroup: antyder reaktion som inte sker?
- **Journalist** — `journalistHeadlineStrings.ts`: rubriker som lovar innehåll/konsekvens?
- **"Så spelar det"-raden** (taktik B): läser den sant mot faktisk kemi + spelstil?
- **Ledarskapsåtgärder** — `leadershipService` + PlayerCard: feedback vs faktisk effekt + cooldown.
- **Spelarsamtal** (talkToPlayer): feedback vs faktisk moral/form-ändring.
- **Anslag / managerKvitto / smallAbsurditeter** — lovar de något de inte håller?
- **Skade-/avstängningstexter** — stämmer veckor/matcher mot faktiskt tillstånd?

## Output
Rapport `docs/AUDIT_PROMISE_CONSEQUENCE_<datum>.md`: per yta en rad
(BACKAS/STUB/FEL KONTEXT/DÖD/OSYNLIG + fix + ägare). Mata de icke-ok in i KVAR/ordern.
Copy-fixar (Opus) görs direkt i data-filerna; mekanik-fixar specas till Code.

## Omfång
Läs-tung — börja i en färsk session med tom kontext. Blir det >30 ytor, dela i två pass.
Hoppa inte över redan kända (#9/#11/#12) — bekräfta dem i rapporten men lägg ingen ny tid på dem.
