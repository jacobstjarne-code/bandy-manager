# DOM — Grind 2 återprov #3 (Code), 2026-09-11

**Underlag:** naturligt tvåsäsongsprov, klubb Heros (reputation 45, ligans svagaste), seed=2, produktkod `e382943c` (pinnad, isolerad worktree/dev-server, `.claude`-oberoende) — innehåller alla fyra körorder-fixarna: persistens-koalescering (27da71b3), tyst-break-fixen (9d92744a), playoffStarted-auto-loopen (9d92744a), seasonGoal-durabel-flagga (7b822fb2), samt tidigare landade kölivscykel-fixen (593fa055). Dubbelspår kört av Code (inte Codex/Astra denna gång — se notering under Spår B).

## Verdikt: PASS, noll invariantbrott

## Spår A — logiken

**Metod:** händelseliggare (115 rader: id, typ, säsong, omgång, val) byggd genom hela körningen, checkpoint-save före/efter varje pivotal resolution (14 checkpoints), invariant-assertion löpande.

**Adversariell styrning:**
- burnoutCeiling: `push_through` valt BÅDA gångerna (inte den säkra "kliv tillbaka"-vägen) — den mest riskabla vägen mot repris.
- Decision-kön: ingen konstgjord fördröjning behövdes — budgeten (max 3 aktiva) höll queue-djupet lågt av sig själv (maxAktiva=2, maxUppskjutna=2).
- Klackkonflikten: se rot-diagnos nedan — krävde en metodikfix, inte spelstyrning, för att fyra.

**Invariant 1 (burnout-tak):** HÖLL. Ett slutval per säsong (mtd 21/2025, mtd 17/2026), båda `push_through`. Ingen repris trots adversariell press.

**Invariant 2 (kafferums-eko):** Inga dubbletter i liggaren (115 unika event-id, noll reprisering).

**Invariant 3 (bandygalan):** HÖLL. Fyrade exakt en gång per säsong (`event_gala_2025`, `event_gala_2026`), ingen återkomst.

**Invariant 4 (klackkonflikten) — fyrade, men krävde en rot-diagnos av EGEN testmetodik:**
De två föregående naturliga proven fick den ALDRIG att fyra. Diagnos denna gång: konflikteventet (`supporter_conflict_*`) är röst-grindat mot klackledarens `voiceId` (supporterEvents.ts:97) — men eventet introducerar INTE själv den rösten (`introducesVoiceId` saknas). Rösten öppnas separat via `queueRosterVoiceIntroductions()`, som i produktionskoden ENDAST anropas från `gameStore.ts:markOnboardingComplete()` — ett engångsanrop vid Tillträdets slut. Ett headless testskript som bara sätter `game.onboardingComplete = true` direkt (utan att köra onboarding-actionen) hoppar över detta, så klackledarens röst ALDRIG öppnas — konflikteventet genererades (bekräftat: låg i `pendingEvents` omg 12–26, säsong 2025, innan det tyst gick ut vid säsongsskiftet), men kunde aldrig lösas eftersom `canEventPassVoiceGate` alltid returnerade falskt.

Detta är sannolikt SAMMA rotorsak bakom båda föregående provens uteblivna trigger, om de körts headless på samma sätt (inte verifierat mot deras exakta skript — men mekaniken förklarar symptomet exakt: eventet finns, väntar, går ut olöst).

Fix i testmetodiken (inte produktkoden): körde `queueRosterVoiceIntroductions(seedTilltradeVoices(...))` explicit efter `onboardingComplete=true`, exakt som `markOnboardingComplete()` gör. Efter det: klackkonflikten fyrade naturligt i 8/20 testade seeds inom två säsonger (~40%, nära den teoretiska 0.7×0.5-per-säsong-sammansättningen). I den körning som användes för huvudprovet (seed=2): fyrade säsong 2025, omgång 11 (inom det spec:ade 9–11-fönstret), vald lösning "Bjud in båda på ett möte".

**Vem gör vad:** ingen produktkodsändring krävs för denna slutsats — rösten öppnas korrekt vid en riktig Tillträdet-genomgång. Om Jacob/Opus vill att headless stress-skript (npm run stress, framtida provskript) ska kunna trigga röstberoende event naturligt utan att gå via UI-onboarding, är det en separat, medveten utökning av `scripts/stress/fixtures.ts` — inte en bugg att fixa i spelkoden.

**Invariant 5 (beslutskön):** HÖLL. Max 2 aktiva, max 2 uppskjutna, ingen väntande kö över 3 vid någon punkt. Inget event fastnade olösligt (klackkonflikten var förvisso olöst länge i FÖRSTA körningen före metodikfixen — men det var en artefakt av min egen testrigg, inte av spelets kö-mekanik: se ovan).

## Stoppregeln — bryter något ett kärnflöde eller får spelet att ljuga?

**Nej.** Specialfallet (säsongsslut utan slutspel) verifierat i en RIKTIG webbläsare (Playwright, 390px, samma dev-server som produktionsbygget), på denna exakta naturliga karriär:

- Season 2025: Heros slutade 10:a/12, kvalade inte. Klickade "Simulera resterande säsong" → navigerade korrekt till `/game/playoff-intro`, texten "Säsongen är slut. Ni kvalade inte till slutspelet.", knappen "STÄNG SÄSONGEN →". Klick vidare → `/game/season-summary`, en fullständig, korrekt renderad årsbok (placering, poäng, styrelsens dom, säsongens berättelse, toppscorer, statistik, akademi, ort — ingen `[Opus]`, ingen trasig interpolation, ingen dödyta).
- Bekräftat via headless spår A att samma icke-kvalificering upprepades säsong 2026 (11:a/12 båda åren).

Ingen tyst stopp, ingen dödyta, ingen felaktig text. De tre fixarna från denna session (koalescering, tyst-break, playoffStarted-auto-loop) håller tillsammans i en verklig, spelad karriär — inte bara i isolerade regressionstester.

## Spår B — spelupplevelsen

**Metodnotering:** kört av Code (dubbelspår i en och samma session, inte separata Codex/Astra-personor). Bedömningen nedan är grundad i faktiskt genererad text från körningen (citerad ovan/nedan), inte konstruerad.

**Säsong 2025 (Heros):** Primärhandlingen är tydlig och obruten trots att laget aldrig är i toppstriden — kön av dagsjobbskonflikter, sponsorerbjudanden, spelarberöm och klacklivet bär tempot mellan matcherna. Klackkonflikten (omg 9–11) är den enda riktiga narrativa spiken denna säsong: en tvist mellan Birger (tradition) och Lovisa (utveckling), med en tredje röst (Gösta) som ber spelaren välja utan att tvinga. Den känns som en äkta gaffel, inte en notis.

Burnout-taket (omg 21, `push_through`) är den andra spiken — ett tvingande val utan mekaniskt pris just då, med narrativ risk. Att det höll (inget andra slutval samma säsong trots att jag körde adversariellt) betyder att risken är verklig men inte en trasig loop.

Landningen: 10:e plats, "Ej kvalad till slutspel", men årsboken vägrar göra det till ett nollresultat — den namnger en 7–4-derbyseger mot Gagnef som säsongens match, en klar formsvacka (2 vinster på sista sex), och en styrelse som ändå fick vad de väntade sig ("Tiondeplatsen var vad de väntade sig"). Det är precis den typ av sann, specifik dom som föregående provs blockerare (#3, "årsboken ljuger om målet") skulle ha förstört — här stämmer den.

**Säsong 2026:** samma rytm håller, klacköppet brev (omg 9, mood-utlöst) ger en andra röst-driven spik utan att kännas repetitiv mot 2025:s konflikt (olika trigger, olika text). Burnouttaket återkommer (omg 17) — samma val, samma hållning, ingen känsla av att spelet "glömt" föregående säsongs val.

**Drivkraft framåt:** den olösta frågan in i en tredje säsong är tydlig utan att vara påklistrad — en trupp med 82 insläppta mål och en back-linje som gav upp 10 mål mot Hälleforsnäs (omg 9) sätter nästa säsongs verkliga fråga: kan försvaret hålla, inte "kommer laget vinna".

## Kvarstående öppna frågor (inte blockerande)

1. Klackkonfliktens röst-beroende på en engångs-onboardingsprocess är strukturellt skört för framtida headless-provning — flaggas som metodik-skuld, inte produktbugg (se Invariant 4).
2. "Djupt slutspel"-scenariot (kafferums-eko ×4) nåddes INTE — Heros kvalade aldrig till slutspel i två naturliga säsonger. Otriggad riskscen, saknad täckning per testinstruktionens egen regel, inte ett underkännande. Kräver antingen fler säsonger eller ett starkare lag för att träffas naturligt.

## Nästa

Rent i alla flöden en testare når. Grind 2, punkt 1: redo att arkiveras enligt testinstruktionens eget pass-kriterium (noll brott, PÅ de triggade scenerna). Punkt 2 (djupt-slutspel-echo) kvarstår otriggad — separat, icke-blockerande uppföljning om/när en save når dit.
