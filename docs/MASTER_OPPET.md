# MASTER_ÖPPET — den enda levande statuskällan för öppna poster

**Etablerad:** 2026-08-31. Ersätter docs/archive/historiska-statuskallor/BACKLOG.md och docs/archive/historiska-statuskallor/SLUTTEST_KO.md som "enda sanning" om vad som är öppet — de degraderas till changelog + parkerad-idé-katalog och pekar hit (se deras nya filhuvuden). Ingen annan fil får längre påstå att den är den kanoniska statuslistan.

## Regler för den här filen

**Tillstånds-maskinen (regel 8):** `rapporterad → verifierad → in_progress → klar` (eller `stale`, om posten visar sig redan vara löst/överspelad vid verifiering — se INVENTERING_2026-08-31.md:s "prövad och friad"-mönster för exempel).
- **Varenda post föds `rapporterad`.** Ingen post ärver `verifierad` för att en källa (BACKLOG, SLUTTEST_KO, en audit, en agent) påstod ett faktum om den. Det gäller även när tre olika källor råkar säga samma sak — konsensus mellan rapporter är inte verifiering.
- En post får inte flyttas till `in_progress` förrän den är `verifierad` — det betyder: kodläst mot arbetsträdet OCH mot `git log`, av en människa eller Code, med resultatet skrivet i posten.
- **Code kör bara mot `verifierad`-rader.** En `rapporterad`-rad är inte en arbetsorder.
- En post som verifieras och visar sig redan vara löst (som fyra av sju stickprov i INVENTERING_2026-08-31.md var) sätts till `stale` med en rad om vad som faktiskt hände, inte raderas tyst.

**`in_progress`-claim (2026-09-08) — kollisionsskyddets claimsteg i tillstånds-maskinen.** Filen delas av flera agenter samtidigt (Code, Codex) som kan plocka samma rad utan att veta om varandra. Regeln:
- **Innan arbetet påbörjas:** agenten sätter `status = in_progress`, befintligt `ägare`-fält till `<agent>` och inleder `nästa-åtgärd` med `CLAIM <ISO-8601-timestamp> — <agent>.` Den tidigare åtgärdstexten bevaras efter claimen. Agenten PUSHAR claimen som en EGEN commit — INNAN själva arbetet, inte efteråt. En claim som bara finns i arbetsträdet skyddar ingen.
- **Andra agenter hoppar `in_progress`-rader.** En rad med en aktiv claim är inte ledig, oavsett hur länge sedan agenten senast syntes.
- **Vid klar:** flytta till `MASTER_ARKIV.md` samma pass (befintlig regel ovan) — `in_progress` går aldrig direkt till `klar`/`stale` på plats, precis som ingen annan terminal status gör.
- **Vid avbrott/krasch:** en claim äldre än ETT PASS räknas som övergiven och får övertas av en annan agent (som då sätter en ny claim, samma protokoll).
- **Ingen claim = fritt fram.** En rad utan `in_progress` är öppen för vem som helst att plocka, som vanligt.

**Ägarfält:** Opus (design/text/omdömesfråga) · Code (implementation/verifiering) · Jacob (ett beslut bara han kan fatta).

**Detta är en RÅ SKÖRD, inte en färdig lista.** Extraherad ur `docs/INVENTERING_2026-08-31.md`, `docs/archive/historiska-statuskallor/SLUTTEST_KO.md` och `docs/archive/historiska-statuskallor/BACKLOG.md`:s öppna tabeller, var för sig, utan sinsemellan-deduplicering — tre källor beskriver ibland samma underliggande fakta (t.ex. `wageBudget`-buggen, H4-klippans rotorsak, flera `[Opus]`-textgap) som separata rader här. Att slå ihop dem kräver samma sannings-bedömning som verifieringspasset gör — att göra det nu, i skördepasset, hade varit precis den "ärvd verifierad"-genväg regel 8 förbjuder. Dubbletter är alltså EN FÖRVÄNTAD DEL av verifieringsarbetet, inte ett skördefel.

## AKTUELL STATUS

**7 aktiva poster:** `stickiness-drift-backend` plus fem `begriplighet-klass-*`-rader (BEGRIPLIGHETSREVISION_2026-09-12-passet, claimade och pushade 2026-09-15, 1→7). `begriplighet-klass-a-verifiering` stängdes samma dag efter ett verkligt fynd + fix (economicCrisisService.ts, se ARKIV), 7→6. `begriplighet-b-flerommgangshopp-financelog` lades till 6→7 — en NY bugg som klass B:s egen invariant (checkFinanceLogGap) hittade under verifiering, inte en av de två ursprungligen namngivna. Räkna endast faktiska datarader med status `rapporterad`, `verifierad` eller `in_progress`; historiska räknarändringar och stängda poster finns i `docs/MASTER_ARKIV.md`.

**Stående regel (2026-09-08):** att stänga en rad = FLYTTA den till `MASTER_ARKIV.md`, aldrig bara stämpla om den `klar`/`stale` på plats. En rad som blir terminal och inte flyttas samma pass är en läckt regel, inte en genväg.

`docs/MASTER_ARKIV.md` läses ALDRIG rutinmässigt vid sessionsstart — bara vid explicit behov av historik (Jacob frågar "var det redan löst?", en gammal dom behöver återfinnas). Auto-load-pekaren (CLAUDE.md, sessionsstart-checklistan) pekar på DEN HÄR filen, inte arkivet.

## Checkpoint 2026-09-13 — release-playalong mot `2bd333e4`

Playalong pausades efter omgång 2 och samtliga hittills reproducerade fynd
åtgärdades i ett isolerat pass. Det omfattar klubbvalets scroll/fokus,
nutida konstis- och klubbcopy, onboardingkontrast, första veckans fokus och
låsta CTA, Drömrundans evidensgolv, headergruppering, cupscenens ordning och
bredd, matchslutets CTA, kaptensmarkeringen, tifots röst-/efterklangskedja,
patronens introduktionsgate samt lokalpressens regionala källa och
save-migrering. Efter återstarten rättades även klubbvyns falska
CTA-liknande flikrad till en kompakt pillnavigation. Detaljer och rotorsaker:
`docs/playtest/PLAYALONG_RELEASE_2BD333E4_2026-09-13.md`.

Uppföljningen 2026-09-14 stängde introduktionsluckan som Carina Sundqvist
avslöjade. Relationer följer nu en gemensam båge: institution först,
namngiven kontakt, möte, villkor/svar och först därefter beständig relation
och ekonomi. Kommun, klack, lokalpress, patron och mecenat går genom samma
röstliggare; okända namn kan inte läcka via Portal, Inkorg, Orten, Ekonomi,
Bygget, Granska eller Attention-notiser. En berättelsepost får finnas i
liggaren före entrén, men notismotorn filtrerar den med samma kanoniska
röstidentitet innan den kan bli push. De operativa systemen får i stället en
kort förstagångsintroduktion av en redan känd funktionär: assisterande tränaren
för Träning, Taktik, Kontrakt, Akademi, Marknad och Scouting samt kassören
för Ekonomi. Trupp/startelva dubbleras inte eftersom Tillträdet redan lär ut
dem. Bygget behåller sin kanoniska start i säsong två genom Valet; säsong ett
visar bara ordförandens förklaring om varför funktionen väntar. Punkten är
stängd i samma pass och registrerad som `playalong-systemintroduktioner` i
`MASTER_ARKIV.md`.

Ingen ny öppen rad skapades: felen reproducerades, rotorsakerna åtgärdades
och verifierades i samma pass. Det pinnade tvåsäsongsprovet på `f5bfd2f9`
nådde sex naturliga entréer, stoppade 21 för tidiga rösthändelser och höll
besluts- och portaltaken utan ett enda invariantbrott. Full kontroll efter
introduktionspasset: 585 testfiler / 5 250 tester, TypeScript,
produktionsbygge samt design-/innehållsgrindar gröna. Rapport:
`docs/playtest/PLAYTEST_ENTREER_TVASASONGER_2026-09-14.md`. Den enda aktiva
MASTER-posten förblir därför `stickiness-drift-backend`.

## HISTORISK RÅSKÖRD

**474 ursprungligen skördade rader.** (58 ur INVENTERING_2026-08-31.md + 185 ur docs/archive/historiska-statuskallor/BACKLOG.md + 231 ur docs/archive/historiska-statuskallor/SLUTTEST_KO.md.) Antalet är den historiska råskördens utdata, inte dagens totala kö och inte ett mål — se Jacobs egen instruktion om varför.

Redan kända, inte separat skördade här (löstes eller stängdes SAMMA DAG av Code, före detta skördepass, med commits): FormationView.tsx:s tredje golv-blinda "Fyll bästa elvan" (`ea63b02c`), fyra räddade textpooler i `hallProvningData.ts`, två DOM-supersede-markeringar, två BACKLOG-headerkorrigeringar (203-filer-risken, TEXT-AUDITEN). De är `klar`, inte `rapporterad` — de hör inte hemma i en öppen-lista.

---

## Fynd EFTER skörden — Jacobs egen verifiering, kör genom hela tillstånds-maskinen

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
Andra exemplet på tillstånds-maskinens fulla cykel, samma mönster som raden ovan. Två av auditens tre criticals nu `klar` (attribution + pensionsgolv). Kvar: framgångskurve-domen (väg C:s −45 tkr mot 1,7 mkr) — Jacobs egen, kräver hans spelbevis-beslut innan Code kan bygga mot den.

## Checkpoint 2026-09-01 — Codex +100-rundan mot `55b2aa9d`

**Checkpointstatus (historisk, nu stängd):** checkpointen landade i `c1588c02`; de efterföljande kontrollgolvs- och browsergrindsdelarna landade i `4dbc2cba`/`bd109109`. Full Vitest var grön (**346 filer / 3611 tester**), produktionsbygget liksom TypeScript-, design- och innehållsgrindarna var gröna. Den dåvarande visuella snapshot-sviten kördes inte; dagens separata baselineskuld spåras i `ci-visuella-baselines-rod`.

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: docs/INVENTERING_2026-08-31.md (58 rader)

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: docs/archive/historiska-statuskallor/BACKLOG.md (185 rader)

*(Harvested av en dedikerad agent, 2026-08-31, mot docs/archive/historiska-statuskallor/BACKLOG.md:s sektioner A–E + "BYGGT MEN OSYNLIGT" + "TVÅ LÄSARE, EN SANNING" + "DATAFÄLT SOM SAKNAS" + relevanta playtest-/KF-rader. Sektion F, CHANGELOG, "PRÖVAT OCH AVFÄRDAT", och alla ~~genomstrukna~~/STÄNGD/KLAR-rader uteslutna som redan stängda.)*

## Toppnoter

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

## H4 Heros

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

## BYGGT MEN OSYNLIGT / ONÅBART

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

## TVÅ LÄSARE, EN SANNING + fältfamiljer

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

## DATAFÄLT SOM SAKNAS + påståendekartan

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

## PLAYTEST-RUNDA 2026-07-10

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

## A. AKTIVA SPRINTAR

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

## B. SPECCAT KLART, VÄNTAR BYGGE

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

## C. IDÉER UTAN SPEC

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

## KF. SYSTEMKARTANS FYND

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

## KF2. ÖVERLÄMNING 2 — TRE ÅTERSTÅENDE POSTER (2026-09-03 incoming-svep)

`docs/sprints/OVERLAMNING2_STEG0_INVENTERING_2026-08-22.md` inventerade 16 poster ur `docs/incoming/Överlämning 2/` (nu arkiverad, `_arkiv-2026-09/`). Omverifierat mot kod 2026-09-03: fyra av de sju då-öppna posterna är sedan dess byggda/stängda (entity-dedup-taggning på `PortalBeat.tsx`, D1 trait-emoji, Portal-orientering punkt 1, transfer-bid-ripplens konsument — retirerad, inte byggd, se `orsakVerkanService.ts`). Tre kvarstår genuint.

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

## D. PARKERADE

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

## E. TEKNISK SKULD

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: docs/archive/historiska-statuskallor/SLUTTEST_KO.md (231 rader)

*(Harvested av en dedikerad agent, 2026-08-31, ur hela filen — 1272 rader, lästa i 30 sekventiella chunkar. Fyra rader nedan är interna statusmotsägelser i källdokumentet självt — samma sak påstås både klar och öppen på olika ställen; skördade som öppna eftersom ingen post ärver `verifierad` av att en rapport påstod det.)*

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

## Metodnoteringar för verifieringspasset

- **Förväntade dubbletter mellan källorna** (icke uttömmande — verifieringspasset avgör och slår ihop): `wageBudget`-buggen (backlog: `wagebudget-aldrig-omraknad`, sluttest: `sluttest-wagebudget-omrakning`); `Club.fanExpectation` (backlog: `fanexpectation-dott-falt`, sluttest: `sluttest-fanexpectation-dott`); H4-klippans rotorsak (inv: `inv-2-9-aterkopplingsslingan`, backlog: `h4-klippan-rotorsak-okand`, sluttest: `sluttest-klippan-rotorsak`); `careerBreakText`/O13 (backlog: `careerbreak-text`, sluttest: `sluttest-am8-avsked-karriar` + `sluttest-o13-jobbmarknad`) — OBS denna sista är särskilt viktig: INVENTERING_2026-08-31.md:s egen stickprovsverifiering visade att `careerBreakText.ts` FAKTISKT ÄR FÄRDIGSKRIVEN nu (Jacobs egna edits landade under skördesessionen) — dessa rader är extremt sannolikt `stale` vid verifiering, inte `rapporterad`→`bygger`; B12:s konsumentlöshet (backlog: fyra `b12-*-utan-konsument`-rader, sluttest: `sluttest-b12-konsument-b5/b4/o16`, sluttest: `sluttest-b5-referat-vokabular`); O1-kandidaterna (sluttest: fyra `sluttest-o1-*`-rader, motsvarar delvis samma spår som redan känd "fyra kvar" i SLUTTEST_KO).
- **Fyra interna statusmotsägelser** i docs/archive/historiska-statuskallor/SLUTTEST_KO.md självt (samma sak KLAR på ett ställe, EJ på ett annat): `sluttest-tio-scener-registrering`, `sluttest-a2-tacticboardcard`, `sluttest-64-statusmotsagelse`, `sluttest-am9-finaluppladdning`.
- **De 32 `sluttest-onadd-*`-raderna** kommer ur docs/archive/historiska-statuskallor/SLUTTEST_KO.md:s "Skydd eller illusion?"-lista (55 granskade ytor, 35 helt onåbara i `/dev/scenes`). `MatchLiveScreen`, `FacilityScreen`, `GameOverScreen` uteslutna — dokumentet rättar dem själv som registrerade.

---

# KÄLLA: `Designgranskning Bandy Manager.dc.html` (Claude Design, 2026-09-03 — 111 states ur dev-scen-dumpen)

**Läs detta först.** Granskningen är gjord på `/dev/scenes`-dumpen, inte på spelet. Fixturerna är deterministiska och delvis handskrivna — en del av det som ser ut som produktfel kan vara fixtur-artefakter (samma `narrativeSummary` i tre säsongsscener säger inget om narrativmotorn om fixturen aldrig varierade den). Alla rader föds `rapporterad`; Code verifierar mot working tree och avgör PRODUKT eller FIXTUR före något bygge. Fixtur-fynd rättas i fixturen (så dumpen blir sann) och stängs som stale mot produkten. Opus triage per rad står i nästa-åtgärd. Granskningens egen ordning: läckor → Portal-krocken → berättelse↔utfall → tre standardiseringar → tysta ytor.

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: Playtest Taktik + laguttagning (GPT, 2026-09-03 — Målilla MEDEL, 35 matcher, live-build 74c9fe5)

**Sammanfattning av rapporten:** "Matchkärnan kan vara rolig, men spelet lär mig inte tillräckligt väl varför den är rolig." Cup och slutspel roliga; serien blev upprepning av ett offensivt paket. Codex funktionella svep (d7303c82, EJ PUSHAT) tog fem saker direkt — se raden nedan. Resten är dömande och kalibrering. Opus läsning: tre av fynden är ETT fynd (B12 saknar konsument, se `sluttest-b12-konsument-b5` ovan), och ett fynd är formationsaxelns öppna fråga som nu syns i spel.

**Separat verifierad mätrapport för C2:** [Kalibrering av 5-2-3:s konditionskostnad](matningar/C2_523_KONDITIONSKOSTNAD_2026-09-07.md). Rapporten skiljer uttryckligen den bevarade resultatsammanställningen från den råa JSON-utskrift som inte sparades.

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: `Flödet - känsla och rytm.dc.html` + `Redesign - resultatet & klubbminnet.dc.html` (Claude Design, 2026-09-03, docs/incoming/)

**Flödesgranskningens tes:** "Flödet håller. Det som saknas är att säsongen minns vad som hände dig." Fyra resor lästa ur 111 states: Ankomsten (starkast, men klubbpärmen bromsar), Veckans hjärtslag (Granska tonlös, loopen andas inte), Säsongens svällning (bågen finns i struktur, inte i ord), Sluten (levererar; triumfen saknar årtal). **Opus läsning:** tesen är exakt vad händelseliggaren byggdes för, och hälften av dragen är redan rader (d1, d2, d3, p1). Redesignens två skärmar: skärm 01 är mocken till d1 (inskriven där); skärm 02 "Klubbminnet" är en OMDESIGN av en befintlig yta, inte en ny — se raden. Designs två frågor besvaras i `redesign-klubbminnet-omdesign` (nu arkiverad, klar — MASTER_ARKIV.md).

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: `docs/rapport/RAPPORT_LIGGARE_KONSUMENTKARTA_2026-09-03.md` (Opus, tung körning 2026-09-03 — vilka liggartyper når spelaren, i vilket steg)

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: Playtest Transfer, kontrakt och truppbygge (GPT, 2026-09-04 — Heros SVÅR, två säsonger, 390×844, live 7dd33ca/f01f9275)

**Rapportens dom:** "En intressant spelarlista med ofärdiga affärsflöden" — behovet går att läsa, scouting lovande, men budkedjan tappade kontinuitet, fria agenter kringgick förhandlingen, kontraktsgolvet visades exakt, budgeten räknades för tidigt. **Codex fixade fem av sju samma natt (9bbe3cb9, lokal, EJ PUSHAD)** — se första raden. Kvar: tre verifieringar av att fixen täcker hela fyndet, en designfråga, och två liggarfynd som redan bor i konsumentkartan (k9, k12). Notering för kalibreringsrundan: GPT spelade Heros SVÅR två säsonger utan avsked — EN datapunkt, inte statistik, men den första riktiga karriären i rundans underlag.

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: Playtest Minne, berättelser och stickiness (GPT, 2026-09-04 — SLUTPROVET för liggaren; Hälleforsnäs 2 säsonger → sparkad → år utan klubb → Slottsbron 1,3 säsonger; 390×844; a948959 → d03d9a68)

**GPT:s dom:** "Spelet har nu ett minne, men ännu ingen helt pålitlig berättare." Burnout-återfallet är det tydligaste beviset på att liggaren fungerar; året utan klubb är "en av spelets bästa fleråriga mekanismer"; GPT kunde berätta sin karriär utan tabeller. Men: minnen läckte mellan klubbar, avslutade beats återkom, årsboken valde mätbar systempåverkan före relationer, och "flera av de bästa sambanden skapades i mitt huvud genom att jag kände igen personer, inte genom att spelet knöt ihop dem." **Codex åtgärdade rotorsakerna samma förmiddag (ej committat, se `karriarbyte-managed-club-switch`).** Det som återstår är BERÄTTARNIVÅN — urval, avgränsning, redaktionell sammanfogning — och den är konsumentkartans andra halva. Sex rekommendationer från GPT: fyra är redan rader (k1 urval/significance, k8 Portal, k11 press, k12 callbacks), två är nya (beats-idempotens/avslut, en kronologi).

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: `RAPPORT_STICKINESS_NOTIFIERINGAR_PWA_2026-09-04.md` (GPT, beslutad riktning) + `IMPLEMENTATION_STICKINESS_NOTIFIERINGAR_2026-09-04.md` (Codex, Etapp 1A)

**Vad det är:** PWA + Web Push + en Attention Engine som härleder "open loops" ur game state och väljer det mest sanna, relevanta att säga när spelet är stängt. Icke-mål: ingen streak, ingen bonus, ingen påhittad simulering, ingen generativ copy utan källstate, ingen omedelbar permission-prompt, ingen Apple-native i fas 1. **Opus läsning:** rapporten är i linje med allt spelet står för — textsanning, liggaren som källa, redaktören som urval. Etapp 1A är tekniskt grundad och avgränsad rätt. Det som inte står någonstans: att Attention Engine är en SJÄTTE redaktion bredvid de fem Berättaren just konsoliderade (se `stickiness-attention-ar-en-yta`). Filat 2026-09-04.

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| stickiness-drift-backend | Repots hosting är statisk (Vercel/Render publicerar SPA); de nya API-rutterna lever i `server.js` och körs bara lokalt. Ingen hållbar lagring (`InMemoryAttentionStore` tappar allt vid omstart), ingen scheduler, inga VAPID-secrets i drift | verifierad | Codex→Jacob | Implementation "Återstår" 1–3 | DELLEVERANS `aaccb764`: hållbar Postgres-adapter och asynkront store-kontrakt byggda men avsiktligt INTE produktionsaktiverade. Adaptern lagrar installation, subscription, minimal attention-snapshot, aktiva kandidater, skickad dedupe, leveranser, kvitton, preferenser och telemetri; installationstoken lagras bara som SHA-256. Omstarts-, första-förfallo-, dedupe- och avregistreringskontrakten verifierade i riktig SQL mot lokal Postgres-emulator; 24/24 backendfokustester, syntax och TypeScript gröna. CLAIM 2026-09-09T20:40:00+02:00 — Codex. JACOBS INFRABESLUT: Render Web Service + Postgres + timvis scheduler, hemligheter endast i Render; push förblir produktmässigt avstängd tills Etapp 1B ger sanna kandidater. Underlag: `BESLUTSUNDERLAG_BACKEND_PUSH_2026-09-06.md`. **DELLEVERANS 2026-09-10 (Codex):** `server.js` väljer nu Postgres via `DATABASE_URL` och vägrar produktionsfallback till minne; klienten har separat `VITE_ATTENTION_API_BASE`; `render.yaml` beskriver statisk app + Node-API + Postgres 18 + autentiserad timcron; VAPID/origins lämnas som Render-secrets och `ATTENTION_PUSH_ENABLED=false` håller UI och leverans avstängda även med giltiga nycklar. Test: full build grön, 549/549 testfiler och 4 983/4 983 tester gröna; lokal process gav health 200, släckt push 503 och osignerad cron 401. **DRIFTPROV GRÖN 2026-09-10 (Codex, `ab667ccd` byggfix + `2c724f14` rapport):** Blueprint-synk, secrets och HTTPS/CORS/scheduler-säkerhetsprov klara; V1-driften verifierad på Render Free, push fortsatt släckt (`ATTENTION_PUSH_ENABLED=false`). Bring-up-delen (Återstår 1–3) är därmed KLAR. Full redovisning: `docs/rapport/RAPPORT_RENDER_BLUEPRINT_DRIFTPROV_2026-09-10.md`. **DATASKYDD KLART 2026-09-10 (Codex):** automatisk 90-dygnsgallring av hela inaktiva installationer körs nu i samma autentiserade timjobb; FK-cascade raderar snapshot, kandidater, dedupe, leveranser, kvitton, händelser och telemetri. **Kvar på raden (ägare Codex→Jacob):** gratis-Postgres upphör **2026-10-10 UTAN backup** — flytt/uppgradering måste planeras före dess; publikt repo stänger GH-workflowen efter 60 dagars inaktivitet (driftnotis). Raden öppen enbart på migreringsdeadlinen. |

---

# KÄLLA: Speltest akademi och spelarutveckling, två säsonger (GPT, 2026-09-04 — Hälleforsnäs, build 9238404e) + `FIXRAPPORT_AKADEMI_2026-09-04.md` (Codex)

**GPT:s dom:** "Akademin fungerar som simuleringssystem, men ännu inte som spelberättelse. […] Den är för dåligt attribuerad och för dåligt ihågkommen för att kännas som något jag byggt." Två reproducerbara lånefel + akademin skriver INGENTING till liggaren. **Codex fixade det funktionella samma dag** (ej committat — arbetskopian delas med design/illustrations/formationer). Resten är en dom: `docs/dom/DOM_AKADEMI_LIGGARE_2026-09-04.md`. Samma tes som konsumentkartan och slutprovet: skriv-utan-läs, nu i akademin.

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: Speltest styrelse, licens och karriärkonsekvenser (GPT, 2026-09-04 — Slottsbron SVÅR, två säsonger + sommar, 390×844, HEAD 5db04f75 + ocommittat träd)

**GODKÄND AV JACOB 2026-09-04 (via Opus):** rapportens fynd och prioritetsordning står. Alla rader föds `rapporterad` — GPT gav fil:rad-rotorsaker, men Code stämmer av mot trädet före bygge (regel 8), särskilt eftersom trädet laddades om under testet. **GPT:s dom:** "Det största problemet är inte avskedsformeln utan att flera system fortfarande presenterar parallella sanningar utan en gemensam redaktör." Det är Berättarens tes, tredje rapporten i rad. Tre av nio fynd är redan rader (kronologi, managersektionens kuratering, burnout-dubblett i ny form); sex är nya. Kalibreringsnot: Slottsbron SVÅR överlevde två säsonger och överträffade kravet. **RÄTTAT 2026-09-04 kväll efter systemauditen:** detta är INTE en datapunkt mot "100 % avsked" — `Survive`-tier gjorde sportsligt avsked omöjligt i koden (`survive-avsked-undantag`), så ingen SVÅR-karriär kunde få sparken annat än via licens/konkurs. Datapunkterna bevisar gaten, inte balansen.

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: `docs/rapport/RAPPORT_OMSPARNING_SYSTEM_2026-09-04.md` (Opus — systemen mot liggaren, v2 per båge)

**Resultat:** de system som skriver till liggaren är nu synliga (burnout, press, patron, domare, transfer, matcher, skador); de fem som ALDRIG skriver — styrelse, licens, orten/CS, hallprövning, brev (+ akademin, redan dömd) — är exakt där GPT:s tre rapporter hittade luckor. F-vägarna (egna projektioner/fickor) är där buggarna bor. Steg 2 (minns) är punktvis; redaktören har verktyget (`semanticKeyStem`) men producenterna använder det inte. Sex nya typer föreslagna, alla med konsumenter (§3). RAW-grep beställd (§5).

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# CHECKPOINT 2026-09-06 — röstintroduktioner

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: Systemaudit akademi, ekonomi, styrelse och minne (GPT, 2026-09-04 — Rögle SVÅR, tre säsonger, 390×844, live 6c72267) + Codex åtgärdspass samma dag

**Läst av Opus 2026-09-04 kväll (låg oläst i incoming sedan morgonen).** GPT:s dom: "Stickiness kräver inte fler system nu. Den kräver att de personer och löften som redan finns aldrig tappas mellan modellerna." Codex åtgärdade BLOCKER + de mekaniska HIGH/MEDIUM (se första raden) och lämnade tre produktfrågor — alla tre är redan rader (junior-20, board_verdict, dedup). **Det viktigaste fyndet är Survive-undantaget** — det ritar om kalibreringsrundans förutsättning.

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: `CODE_INSTRUKTION_GENOMGANG_2026-09-11.md` (Opus helhetsgenomgång 2026-09-11 kväll)

**Räknarnot:** femton rader nedan föds `rapporterad`; aktiva poster 3→18. Opus fixade dessutom femton saker DIREKT på disk (MatchLiveScreen-kontexten för alla fyra generatoranrop + onTarget-räknarna, simulateRemainingStep via pickBestEleven, trust proxy, timingSafeEqual, snapshot-rotation per orsak, precache utan bilder, viewport-zoom, SectionLabel aria-hidden, Node 22 i CI/Render, CLAUDE.md-rättelse, README, signFreeAgent-dubbelpost + uniquePlayerIds-invariant, wentToOvertime i matchEngine, kapten vid kontraktsutgång, utvisningstavlans 5/10-längd) — de ligger OCOMMITTADE i arbetsträdet och är raden `genomgang-opus-edits-commit` nedan. Ingen av raderna är releaseblockerande enligt RELEASE_DEFINITION_MJUKLANSERING; de första två bör ändå tas före soft-launch eftersom de påverkar första installationen på mobil.

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: `docs/BEGRIPLIGHETSREVISION_2026-09-12.md` (Opus, ambitiöst pass — entré-fyndet som metod)

**Vad det är:** en systematisk jakt på hela klassen av fel entré-fyndet tillhörde — mekaniskt fungerande men obegripligt för en människa som möter det första gången. Åtta begriplighetsklasser (A–H); A (aktör utan entré) redan löst via röstregistret. Sex tas här som kartläggningspass — rena grep/läs-uppgifter, inga kodändringar, varje pass producerar en kandidatlista som Opus sedan dömer (grind / text / playalong-lins). Klass G (tystnad utan förklaring) är helt playalong, ingen rad. Ägare Code för alla sex; claim pushad som egen commit 2026-09-15 innan arbetet.

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| begriplighet-klass-b-kartlaggning | Följd utan orsak — en mätare (fanMood, communityStanding, supporterGroup.mood, finances) ändras > tröskel utan tillhörande liggarpost/synlig rad | in_progress | Code | §Klass B | **KARTLAGT 2026-09-15 (Code).** Tre redan fungerande generiska förklaringsmekanismer (`captureResolvedChoiceOutcome`, `captureDecisionRipple`/`orsakVerkanService.ts`, `describeRippleChain`) täcker det mesta av event-choice-driven mutation — kandidaterna nedan ligger UTANFÖR dessa. Prioritetsordning: (1) **`communityProcessor.ts:172-183`** (`applyCommunityConsequences`, `pendingAnnandagsKlack`) — Annandagsvalets klackreaktion (+5/+8/+6 mood, 2 omgångar fördröjt) saknar HELT den inbox-text syskonmekanismen `pendingAnnandagsMediaRubrik` (rad 124-161) redan har för samma val; `AnnandagsValEvent.tsx` visar bara pengar/publik/CS i förhandsvyn, aldrig klackutfallet. (2) **`sponsorProcessor.ts:280-349`** — risky sponsor-clawback: `applyFinanceChange` anropas utan `appendFinanceLog`-post (financeLog kan aldrig förklara beloppet i efterhand), och communityStanding −4 nämns bara i 1 av 3 slumpade inboxtextvarianter. (3) **`gameStore.ts:1191-1203`** (`decommissionFacilityNode`) — CS −8 förklaras i stundens UI (`FacilityTab.tsx:292`) men skriver varken eventLedger eller inbox, så kafferum/klack/Granska kan aldrig referera det retrospektivt. Svagare: (4) `seasonEndProcessor.ts:2414-2416` (licensavslag → fanMood −15, kausalitet syns men inte just detta utfall), (5) `seasonEndProcessor.ts:1734-1752` (funktionärsdöd → CS +3, medvetet kontraintuitiv designregel som aldrig når texten), (6) `narrativeProcessor.ts:36-66`/`communityProcessor.ts:211-237` (rutinmässiga matchresultat-deltan, redan implicit förklarade av resultatet — Opus avgör om det räcker). Referenslista över REDAN korrekt förklarade mutationer (finances/economyProcessor, transfer_sold, ripple-kedjorna, alla generiska event-choice-effekter) finns i full detalj hos Code, ej upprepad här. **OPUS DÖMER:** grind (kräver kod), text (förklarande rad) eller playalong-lins per kandidat. --- **OPUS-DOM 2026-09-15, per kandidat:** (1) Annandagens klackreaktion — **TEXT.** Syskonmekanismen (`pendingAnnandagsMediaRubrik`) har redan formen; klackutfallet ska få samma inbox-rad. Opus skriver den i maner när Code exponerat vilka tre utfall (+5/+8/+6) som svarar mot vilka val. Förhandsvyn i `AnnandagsValEvent.tsx` ska också antyda klackriktningen (inte siffran) — samma klass som C. (2) Sponsor-clawback — **GRIND + TEXT.** `applyFinanceChange` utan `appendFinanceLog` är en ren bugg (financeLog ska ALLTID förklara ett belopp; det är klass B:s kärna) — Code lägger loggposten. CS −4 i 1 av 3 varianter: Opus skriver så alla tre nämner den. (3) Facility-decommission CS −8 — **GRIND.** Förklaras i stunden men skriver ingen liggarpost, så inget kan referera det retroaktivt — exakt "följd utan spår". Code skriver en `community_shift`- eller `facility_trial_outcome`-liggarpost. (4) Licensavslag fanMood −15 — **ACCEPTERA.** Kausaliteten syns (licensbrevet förklarar), just utfallet behöver ingen egen rad; låg risk. (5) Funktionärsdöd CS +3 — **TEXT, låg prio.** Medvetet kontraintuitiv (orten sluter sig i sorg) — just därför behöver den en rad, annars läser +3 som en bugg. Opus skriver en kort förklarande rad. (6) Matchresultat-deltan — **ACCEPTERA.** Resultatet är självförklarande orsak; ingen extra rad. **GRIND-KLASSEN som helhet (egen rad, Code):** en invariant — ett `applyFinanceChange`/mood-mutation över X utan `appendFinanceLog`/liggarpost samma matchdag är ett brott. Det är sponsor-buggen generaliserad; den gör klass B omöjlig i stället för lagad per instans. **Ordning:** grindarna (2,3 + invarianten) före texterna. Texterna (1,2-CS,5) levereras av Opus när Code exponerat utfallsmappningen. **CLAIM 2026-09-15T00:00:00+02:00 — Code (implementation efter Opus-dom).** --- **CODE-STATUS 2026-09-15 — två buggar lagade, invarianten byggd OCH bevisad genom att hitta en TREDJE, tidigare okänd bugg.** (2) `sponsorProcessor.ts`s risky-sponsor-clawback skriver nu en `appendFinanceLog`-post (reason `sponsorship`) vid samma anrop som `applyFinanceChange`. (3) `gameStore.ts`s `decommissionFacilityNode` skriver nu en `community_shift`-liggarpost (återanvänder `detectCommunityShiftDirection`/`buildCommunityShiftLedgerEntry`, roundProcessor.ts:s redan etablerade tröskelmönster 30/50/70 — INTE en ny facility_trial_outcome-typ, den var fel form för en enkel CS-delta) — bara vid faktisk tröskelkorsning, samma disciplin som alla andra CS-rörelser. **Invarianten:** `checkFinanceLogGap(before, after, round)` i `gameInvariants.ts` (avsiktligt UTANFÖR `checkInvariants()`s single-state-kontrakt — en logglucka är en ÖVERGÅNG, går inte att se ur ett enda tillstånd) wirad in i `scripts/stress-test.ts`s rond-loop, severity `'warn'`. **BEVISAD:** en 3-seed/2-säsongers stresskörning gav 6 financeLogGap-varningar — grävde med den redan existerande `financelog-gap-diagnos-2026-09-01.ts` och isolerade en TREDJE, tidigare okänd bugg: när `advanceToNextEvent` hoppar över FLERA omgångar i ett enda anrop (bekräftat: omgång 29→37 i ett svep, sannolikt en sen säsongs auto-simulerade icke-hanterade omgångar), skrivs financeLog bara för DEN SISTA omgången i hoppet — mellanliggande omgångars löner/intäkter försvinner ur loggen helt (mätt: ~258 000 kr i ett enda hopp, 28,29,30,31,32,33,34,35,37 loggade men 36 helt saknad). **INTE fixad i detta pass** — rotorsaken ligger sannolikt i roundProcessor.ts:s flerommgångs-hoppningslogik, ett annat system än de två namngivna buggarna, och kräver egen utredning innan fix (var exakt tappas loggningen för mellanliggande omgångar — se ny rad `begriplighet-b-flerommgangshopp-financelog`). 27/27 nya + fulla svit gröna, TypeScript och build/fem grindar gröna. |

| begriplighet-klass-c-kandidatlista | Val utan begripliga konsekvenser — ett besluts `choices[].effect` rör en mätare korttexten inte nämner | in_progress | Code | §Klass C | **KARTLAGT 2026-09-15 (Code).** Systemgeneratorerna i `domain/services/events/*.ts` (patron/politician/supporter/community/hall) är genomgående disciplinerade — de verkliga hålen ligger i "sekundära" kortbyggare UTANFÖR den mappen, mönster: en väl textad PRIMÄR effekt döljer en helt otextad SEKUNDÄR bieffekt av en annan mätarklass. Starkast: **`csPressEventService.ts:152-156`** — alla fyra val (`individual`/`team`/`system`/`silent`) saknar `subtitle` HELT (bara dialogtext), men styr i verkligheten moral/journalistrelation/en dold 18%-risk att en SLUMPAD namnlös lagkamrat tappar 4 moral (`eventResolver.ts:2506-2581`) — spelaren kan inte ens gissa VILKEN SORTS sak som händer. Näst: **`arcService.ts:628-646`** (`hungrig_peak_event`/`back_him`, subtitle "lyfter spelaren" döljer permanent `developmentRateDelta −4`) och **`arcService.ts:761-778`** (`joker_peak_event`/`back_joker`, samma mönster, döljer `disciplineDelta −4` som ökar avstängningsrisk i matchmotorn). **`eventFactories.ts:774`** (economicStress "vänta"-valet, inget subtitle, sänker HELA truppens moral −2 osynligt). **`patronEvents.ts:292-297`** (`apologize`, subtitle lovar "gläder patronen" men rör i praktiken `goodwill` inte `happiness` — fel mätare). Svagare/avsiktligt dom-låst: `burnoutReliefService.ts:327-366` (medveten vaghet enligt kommentar i koden, sekundäreffekt ändå ogissbar — Opus avgör om undantaget står). **OPUS DÖMER** per rad: grind (kräver textändring, ingen kod), text, eller acceptera som avsiktligt vagt. --- **OPUS-DOM 2026-09-15, per kandidat. Princip: ett val får dölja UTFALLET men aldrig KONSEKVENSKLASSEN — spelaren ska veta vilken SORTS sak som står på spel, inte exakt hur mycket.** (1) csPress fyra val — **TEXT, högst prio i hela klassen.** En dold 18%-risk mot en namnlös lagkamrat är inte ett val, det är en fälla. Opus skriver subtitle till alla fyra (`individual`/`team`/`system`/`silent`) som antyder konsekvensklassen (moral/pressrelation/lagkamrat-risk) utan att lova siffror. Opus läser `csPressEventService` + `eventResolver.ts:2506-2581` och skriver mot de VERKLIGA effekterna. Den namnlösa lagkamraten är ett eget delfynd: en risk mot någon spelaren inte kan identifiera — subtitlen ska säga att NÅGON i truppen kan ta illa upp, inte låtsas namnge. (2) arc peak-events (`back_him`/`back_joker`) — **TEXT.** "Lyfter spelaren" döljer en permanent negativ delta (developmentRate/discipline). Opus skriver om subtitlarna så baksidan syns: att backa honom nu KOSTAR något senare. (3) economicStress "vänta" — **TEXT.** Truppmoral −2 osynligt; subtitle ska antyda att passivitet inte är gratis. (4) patron `apologize` — **GRIND (fel mätare), inte text.** Subtiteln lovar `happiness` men koden rör `goodwill` — det är en BUGG, inte en textlucka. Code rättar så effekten träffar mätaren texten lovar (eller Opus skriver om texten till rätt mätare — Code avgör vilken som är avsedd; en av dem är fel). (5) `burnoutReliefService` — **ACCEPTERA MED VILLKOR.** Vagheten är medveten (kodkommentaren säger det) och burnout SKA vara ogenomsiktlig — men bara om vagheten gäller GRADEN, inte KLASSEN. Opus läser de sekundära effekterna; rör de en HELT annan mätarklass än spelaren kan ana faller undantaget och det blir text. Annars står det. **Ordning:** (4) är en bugg, tas med grindarna. Texterna (1,2,3, ev. 5) levereras av Opus i ett svep när Code exponerat effekterna — en `TEXTLEVERANS_CSUBTITLES`-fil, samma mönster som entré-rösterna. (1) först. **CLAIM 2026-09-15T00:00:00+02:00 — Code (implementation efter Opus-dom).** --- **CODE-UTREDNING 2026-09-15 (4) patron apologize — INGEN kodändring, koden var redan rätt.** Läst i detalj innan något rördes (ROTORSAK FÖRE FIX): eventets triggervillkor är `goodwill < 20` (patronEvents.ts, "patron_ignored"), och `apologize`-valets effekt är `patronInfluence{value:20}` → höjer just `goodwill` (eventResolver.ts:1275-1286, `value` mappar till goodwill). `Community.ts:85` dokumenterar fältet ordagrant: "goodwill = patronens tålamod med KLUBBEN... decreases when ignored" — exakt den mekanik eventet redan modellerar; effekten svarar direkt mot triggern. Avvikelsen är ENDAST ordet i subtitlen ("gläder patronen" — happiness-vokabulär) mot en effekt som mekaniskt rör tålamod/goodwill, inte känsloläge. Det är alltså tvärtom mot ursprungsfyndets hypotes: TEXTEN är fel, inte koden — och Code skriver aldrig spelartext (CLAUDE.md). **Ingen kodändring gjord.** Kvar: Opus byter subtitle-ordet till något som beskriver tålamod/förtroende snarare än glädje (t.ex. i stil med "lugnar patronen" — exakt formulering Opus väljer), i samma svep som de fyra TEXT-kandidaterna ovan. Övriga fyra klass C-kandidater (csPress, arc peak-events, economicStress, burnoutReliefService) är redan Opus TEXT/ACCEPTERA — hela klass C kräver alltså NOLL kodändringar från Code. |
| begriplighet-klass-d-e-inventering | Status utan skala (tal utan referensram) + verktyg utan syfte (flik/funktion utan introduktion) | in_progress | Code | §Klass D/E | **KARTLAGT 2026-09-15 (Code). D — samma fält har BÅDE gott och dåligt renderingssätt på olika ställen (inkonsekvensen är själva fyndet):** `PlayerCard.tsx:416-434` (mood-strip, naken siffra) vs. samma fält med bar längre ned i SAMMA komponent (rad 519-538). `OrtenTab.tsx:349` (frivilligmoral), `:730` (klackstämning, har "/100" i text men ingen bar), `KlackenSecondary.tsx:54-56`, `DerbyPrimary.tsx:42` (svagast — rått tal, ingen färg alls), `SeasonBarometer.tsx:84`, `OrtenMap.tsx:184-187/166` saknar alla explicit skala/normalzon. Positiva motexempel för kontrast: `OrtenTab.tsx:625-638`/`:513-522`, `EkonomiTab.tsx:360-370`, `SquadStatusCard.tsx` (`StatBar`), `KlackenMoodMinimal.tsx`/`SquadScreen.tsx` (konverterar till kvalitativ text). **E — otäckta flikar (prioritetsordning):** Orten (hela fliken — lika interaktiv/pengapåverkande som Ekonomi/Bygget men bara en TAB_INTRO-rad, ingen FeatureIntroduction) > Sälj-fliken (oåterkallelig, ekonomiskt betydelsefull, ingen introduktion trots att systersystemen Marknad/Scouting fick det) > Tränare-fliken (nämner "belastning" utan att förklara mekaniken) > Fria-listan (interagerbar, saknar introduktion trots systersystem) > Nu-fliken (default-vy i Trupp, självförklarande men förvalsvy) > Minne (trolig självförklarande, TAB_INTRO-kommentaren motsäger sig själv om varför Akademi fick introduktion men inte Minne/Trupp) > Hem/Match/Tabell (sport-konventionella, låg prioritet). **OPUS DÖMER** vilka som faktiskt behöver kontext/introduktion. --- **OPUS-DOM 2026-09-15. D (status utan skala):** inkonsekvensen är själva fyndet, så domen är en STANDARDISERING, inte per-instans. **Regel: en mätare som visas för spelaren visas ALDRIG som naken siffra — antingen bar med normalzon, eller kvalitativ text.** De positiva motexemplen (StatBar, KlackenMoodMinimal) är redan kanon; de nakna talen ska anpassas till dem. **GRIND:** en design-grind som från `PlayerCard`/`OrtenTab`/`KlackenSecondary`/`DerbyPrimary`/`SeasonBarometer`/`OrtenMap` flaggar en mätarsiffra utan bar/kvalitativ omvandling — samma klass som kontrast- och tap-target-grindarna som redan finns i CI. Code bygger grinden mot den befintliga StatBar-konventionen; då är klass D omöjlig framåt, inte lagad per komponent. `DerbyPrimary.tsx:42` (rått tal, ingen färg) först, den är svagast. INGEN ny text behövs — D är rendering, inte copy. **E (verktyg utan syfte):** samma båge som entré-passets funktionsintroduktioner, så samma lösning (FeatureIntroduction av en redan känd funktionär). Per flik: **Orten — JA, högst prio**, lika konsekvenstung som Ekonomi/Bygget som redan fick det; introduceras av samma ort/kommun-röst som ägnar entré-bågen (kommunkontakten). **Sälj — JA**, oåterkallelig och ekonomiskt tung, systersystemen Marknad/Scouting fick introduktion så denna asymmetri är ren lucka; assistenten eller kassören beroende på var den öppnas (Codex-strukturfråga före Opus skriver rösten). **Tränare-fliken — JA, men TEXT inte introduktion:** den nämner "belastning" utan att förklara mekaniken — en kort förklarande rad räcker, ingen full FeatureIntroduction. **Fria-listan — JA**, samma systersystem-argument som Sälj. **Nu-fliken, Minne, Hem/Match/Tabell — NEJ.** Självförklarande eller sport-konventionella; att introducera dem vore överintroduktion, precis vaktlinjen entré-passet drog. Minne-kommentaren som motsäger sig själv (varför Akademi men inte Minne) — Code rensar kommentaren, ingen introduktion. **Leverans:** D-grinden (Code, egen commit) före E. E-introduktionerna kräver Codex-struktur (vem äger ytan, när öppnas den) FÖRE Opus skriver rösterna — exakt entré-passets ordning: struktur först, röst landar ihop, ingen platshållare i kandidaten. Opus skriver Orten/Sälj/Fria-introduktionerna + Tränare-raden i ett svep när strukturen står. **CLAIM 2026-09-15T00:00:00+02:00 — Code (implementation efter Opus-dom).** --- **CODE-STATUS 2026-09-15 — D:s grind byggd och wirad; E väntar fortsatt på Codex-struktur (oförändrat, inte Codes just nu).** **D — `scripts/metric-scale-guard.mjs` (ny, ratchet-mönster som `ds-guard.mjs`):** flaggar `communityStanding`/`supporterGroup.mood` renderade rakt av i JSX utan `/100` eller en kvalitativ/bar-markör på raden. Wirad i `npm run lint:metric-scale` + `npm run build`-kedjan. **Ärligt om täckningen:** statisk textmatchning kan inte följa variabel-alias (`const cs = communityStanding`, `{morale}`) eller SVG-textnoder (OrtenMap.tsx) — grinden fångar bara raka `communityStanding`/`.mood`-anrop, ett startvärde som skyddar mot NYA sådana framåt, inte ett fullständigt filter för allt investeringen hittade. **Konkreta fixar (delad `klackMoodLabel`-hjälpare i formatters.ts, ersätter tre separata trösklkopior):** `DerbyPrimary.tsx:42` (Opus: "först, den är svagast") — rått `sg.mood` → kvalitativ etikett (peppad/redo/avvaktande/tyst). `KlackenSecondary.tsx:55` — samma fix, en till instans grinden själv fångade vid första körningen. `KlackenMoodMinimal.tsx` — redan korrekt, nu omskriven att DELA samma hjälpare istället för en egen kopia (skydd mot att ordvalen glider isär). Baslinjen står på NOLL — grinden startar rent, inte med grandfathered skuld. **Kvarvarande kända instanser (INTE fixade, utanför grindens räckvidd pga alias/SVG):** `OrtenTab.tsz:349` (morale, aliasnamn), `SeasonBarometer.tsx:84` (via `Stat`-komponentens `value`-prop, arkitekturfråga), `OrtenMap.tsx:166/184` (SVG-textnoder, ingen bar-yta möjlig i den layouten), `PlayerCard.tsx:416-434` (mood-strip saknar bar som SAMMA fil redan har längre ned, rad 519-538 — kopiera mönstret inom filen). `tabIntros.ts`s självmotsägande Minne/Akademi-kommentar rensad (Akademi togs bort ur "förklarar sig själv"-listan, den fick en riktig FeatureIntroduction 2026-09-14) — ingen introduktion ändrad. TypeScript, full svit 5263/5263 och produktionsbuild med SEX grindar (den nya inräknad) gröna. **INTE browserverifierat** — de tre ändrade korten (Derby/Klacken) är villkorade Portal-kort (derby-närhet/klack-röst aktiv) och att konstruera exakt rätt speltillstånd för en live-koll bedömdes för dyrt i den här passets tidsram; ren textsubstitution (tal→ord) inom oförändrad layout/stil, låg visuell risk men OVERIFIERAD — flaggat öppet, inte gömt. |
| begriplighet-klass-f-kartlaggning | Händelse utan efterdyning — terminalval/stora beats (burnout, avsked, konflikt) utan minst en efterföljande synlig konsekvens | in_progress | Code | §Klass F | **KARTLAGT 2026-09-15 (Code). Rotorsak strukturell, inte punktvis:** `redaktorenService.ts`s `fitsSurfaces()` styr allt via en hårdkodad typ-allowlist (`PRESS_TYPES`/`REVIEW_TYPES`) + kräver `subject.kind` för kafferum — och `subject.kind` (`Narrative.ts:364`) saknar en `'manager'`-variant helt, så INGEN managercentrerad händelse kan nå kafferum oavsett significance. Klacken (`klackEchoService.ts`) är strukturellt döv för hela liggarsystemet — läser bara matchresultat. **Tydligaste fyndet:** `burnoutCeiling` har högst significance i hela spelet (100, `eventResolver.ts:2951-2969`) men NÅR AV ALLA fem klasser BARA portal/efterklang/yearbook/push — aldrig kafferum (ingen subject.kind), press eller granska-eko ('decision' är inte i någon allowlist) — kontrasterar mot `patron_withdrawal` (significance 95) som är fullt bevakat på alla ytor. **`supporter_conflict`** (Sture/Elin) skriver INGEN eventLedger-post alls (`eventResolver.ts:1653`, ren mood-mutation) — kan strukturellt aldrig eka någonstans. **Managerns avsked/klubbyte**: `switchManagedClub.ts` skapar ingen ny ledgerpost — nya klubbens kafferum/press kan aldrig referera det generiskt (eget parallellt eko finns dock: `formerClubDidWorse`, `careerBreakService.ts:163-190`). **Legend-pensionering** når kafferum bara som ett extremt generiskt engångseko ("Det pratas om {name}."), aldrig press/granska trots significance 90. **Bonusfynd (byggt men osynligt):** `burnoutMemoryTextService.ts` (scar-specifik relapse-text) är skriven men ALDRIG kopplad in i produktion — bara anropad från ett test; `managerRoundProcessor.ts:116-144` bygger relapse-citat direkt istället. --- **OPUS-DOM 2026-09-15: GRIND (arkitektur), störst av alla begriplighetsfynden. Detta är passets tyngsta utfall.** Att spelets mest betydelsefulla ögonblick når färst ytor är inte en textlucka, det är en saknad schemagren, och den är MIN dom att fälla eftersom `subject.kind` är Opus-låst (Narrative.ts säger uttryckligen: ny kind = vägval Opus dömer). **Domen: LÄGG TILL `'manager'` i `subject.kind`-unionen.** Motivering: managern är redan en förstklassig entitet i schemat (`managerId` finns, `type:'manager_burnout'` finns) men kan inte VARA subject — en asymmetri som gör att redaktorens `fitsSurfaces()` sorterar bort varje managerhändelse från kafferum. `subject: { kind:'manager', id: game.id }` är inte redundant mot managerId: managerId säger VEMS KARRIÄR posten tillhör, subject säger VEM POSTEN HANDLAR OM — för burnout är de samma person, men redaktoren läser subject, inte managerId, för yt-behandling. **CODE-STEG (egen commit, arkitektur):** (1) Lägg `'manager'` till `subject.kind`-unionen i Narrative.ts (och subject2? NEJ — subject2 är bara för genuina tvåpartshändelser, burnout är enpart). (2) `manager_burnout`-byggaren sätter `subject:{kind:'manager',id:game.id}`. (3) `redaktorenService.fitsSurfaces()`: lägg `'decision'`+`'manager_burnout'` till REVIEW_TYPES OCH till kafferums-behandlingen, så burnout når press/granska/kafferum. (4) `supporter_conflict` (`eventResolver.ts:1653`): skriv en `scandal`- eller ny konflikt-liggarpost så den KAN eka — idag ren mood-mutation. (5) Bonusfyndet: koppla in `burnoutMemoryTextService.ts` där `managerRoundProcessor.ts:116-144` idag bygger relapse-citat inline, ELLER radera den döda filen om inline-v/ägen är kanon (Code avgör vilken som är rätt källa, en av dem är död kod). subject.kind-tillägget är ett schemabrott — kör migrering + hela sviten. **VILKA YTOR burnout SKA nå, Opus-dom:** portal + efterklang + yearbook + push (redan) PLUS kafferum (spelarna pratar om att tränaren gick in i väggen) och granska-eko. INTE press — burnout är privat, en presskonferens om managerns utbrändhet vore fel ton. Fem ytor, inte sex. **Klackens dövhet** (läser bara matchresultat) lyfts INTE nu — egen rad, post-launch; klacken SKA vara matchcentrerad, det är inte säkert att den ska eka managerbeats alls (Jacob-fråga, inte grind). **CLAIM 2026-09-15T00:00:00+02:00 — Code (implementation efter Opus-dom).** --- **CODE-STATUS 2026-09-15, delvis levererat — en yta saknar konsument, rapporterat innan stängning.** (1) `subject.kind:'manager'` tillagt i `Narrative.ts` (bakåtkompatibelt — gammal data har bara inte kind:'manager', ingen migrering krävs) + `resolveSubjectName` (`momentLedgerService.ts`) + burnoutCeiling-postens skrivning (`eventResolver.ts`) sätter nu `subject:{kind:'manager',id:game.id}`. (2) **Kafferum: FULLT LEVERERAT.** `redaktorenService.ts`s befintliga `if (post.subject) surfaces.push('coffee_room')` triggar automatiskt; `coffeeRoomService.ts`s redan existerande generiska pool ("Det pratas om {name}.") renderar `game.managerName` utan ny text. (3) **Granska-eko: SCHEMAT KLART, INGEN SYNLIG YTA ÄNNU — ärligt rapporterat, inte gömt.** Lade `if (post.subject?.kind==='manager') surfaces.push('review')` i `fitsSurfaces` (INTE `'decision'`+REVIEW_TYPES som domen föreslog — `'decision'` delas av 5+ orelaterade system, det hade gjort ALLA beslut granskningsbara; subject.kind är den precisa gaten). MEN: grepp av alla `'review'`-konsumenter visar att `agendaForSurface(..., 'review')` bara läses av `reviewCallbackService.ts`s TVÅ smala former-player-callbacks (`post.subject?.kind==='player'`+specifika typer) — ingen generisk "visa granskningsbara poster"-yta finns. Manager-subject-posten är alltså korrekt klassad men NÅS INTE av något UI ännu. Att bygga en riktig yta kräver antingen ny svensk text (Opus) eller en trådningsbeslut om VAR i `GranskaOversikt.tsx` den ska synas — inte gjort här, inte gissat. (4) `supporter_conflict` (`eventResolver.ts`, ny block efter burnoutCeiling-blocket): skriver nu en `'decision'`-post med `subject:{kind:'voice',id:event.voiceId}` (klackledarens redan röstregistrerade identitet) oavsett vilket av de tre valen som görs — samma coffee_room-mekanism som (2), fullt levererat, ingen ny yta behövs. (5) `burnoutMemoryTextService.ts` — **INTE dödkod, INTE raderad.** Läst i detalj: den är INTE en superseterad duplikat av `managerRoundProcessor.ts`s inline-väg (Princip 7-felklassning i domen) — den lägger till en genuin, orörd förbättring (scar-specifik substitution: "Förra gången klev jag tillbaka..." när `zone==='hog'` och en tidigare takval finns) som inline-vägen saknar helt. Text-utan-yta (Princip 7): bevaras, dödmarkeras inte, kräver en egen trådningspass (hitta var `quoteKey`/`helperKey` faktiskt resolvas till visningstext och patcha in substitutionen där) — större än detta pass tillät utan att riskera en hastig, fel koppling. 21/21 nya + 5256/5256 hela sviten, TypeScript och build/fem grindar gröna. **Kvar innan raden kan stängas:** (3)s synliga yta, (5)s wiring-beslut. Bägge är avgränsade följdpass, inte blockerande för resten av passet. |
| begriplighet-klass-h-kartlaggning | Notis utan krok — Attention/push-mallar som refererar system/koncept spelaren inte mött än | verifierad | Code→Opus | §Klass H | **KARTLAGT 2026-09-15 (Code).** Push-copyn bor i `narrativePushCopyResolver.ts` (inte `attentionRouter.ts`, som är en separat in-app-router). Ingen licens-/ekonomikris-/transfermarknadsnotis existerar idag — exemplet i uppdraget var hypotetiskt. Av samtliga verifierade mallar (match_preparation, cup/final/playoff/annandag/derby, season_context tabell/streak, narrative_return revansch/ex-spelare/nemesis/klubbyte/taktikmönster) är alla utom en **självgatade** (kräver att spelaren redan utfört handlingen, eller refererar allmänfotbollsvokabulär spelaren redan mött). **Enda verifierade fyndet:** `narrativePushCopyResolver.ts:264` — "Den siffran står kvar i Krönikan." "Krönikan" är ENDAST ett internt devnamn för liggarsystemet, förekommer ALDRIG som faktisk skärmrubrik i `src/presentation/` (spelarvända motsvarigheten heter "Karriärhistorik", `HistoryScreen.tsx:448`) — kan triggas redan säsong 1. Notisen namnger alltså ett system under ett namn spelaren ALDRIG sett, värre än bara "för tidigt". Saknar helt en gate motsvarande `narrativeActorIsIntroduced()` (som bara kollar AKTÖRER — mecenat/patron/voice — aldrig SYSTEM/skärmnamn). **OPUS DÖMER/SKRIVER:** kort kontextrad eller byt referensen till "Karriärhistorik" — textvalet är Opus, Code skriver aldrig speltext. --- **OPUS-DOM 2026-09-15: TEXT, byt referensen — inte en kontextrad.** "Krönikan" är ett devnamn spelaren aldrig sett; att förklara det i notisen vore att lägga en rad för att rädda ett namn som inte borde stå där. Rätt drag är att använda namnet spelaren FAKTISKT ser i UI:t. **Byt `narrativePushCopyResolver.ts:264`** från "Den siffran står kvar i Krönikan." till: **"Den siffran står kvar i din karriärhistorik."** (gemener, possessiv — push talar TILL spelaren om HENNES historik, inte om ett system vid namn; matchar `HistoryScreen`s rubrik "Karriärhistorik" utan att låta som en menyhänvisning). Ingen kodändring utöver strängen. **Bredare, egen liten rad (Code, post-F):** `narrativeActorIsIntroduced()` gatar AKTÖRER men inte SYSTEMNAMN — en framtida notis som nämner en skärm/ett system vid namn har samma hål. Låg prio, ingen känd andra instans idag, men noterat så nästa systemreferens i push inte återinför problemet. Devnamn (Krönikan, Berättaren, Redaktören, Efterklang) får ALDRIG in i spelarvänd text — det är en stående regel värd en grep-grind: ingen av de fyra devnamnen i `src/presentation/` eller push-copy. |
| begriplighet-b-flerommgangshopp-financelog | Ny bugg hittad AV klass B:s invariant (checkFinanceLogGap), inte en av de två ursprungligen namngivna: när `advanceToNextEvent` hoppar över flera omgångar i ett enda anrop skrivs financeLog bara för SISTA omgången — mellanliggande omgångars löner/intäkter försvinner ur loggen | rapporterad | Code | checkFinanceLogGap, 3×2-stresskörning 2026-09-15 | Mätt konkret: en körning (seed 1) hoppade omgång 29→37 i ett enda `advanceToNextEvent`-anrop; financeLog fick poster för 28,29,30,31,32,33,34,35,37 men 36 SAKNAS HELT, faktisk kassaförändring vs loggad differens ~258 000 kr. Trolig orsak i roundProcessor.ts:s flerommgångs-hoppningslogik (sen säsong, icke-hanterade klubbars omgångar auto-simuleras i bulk) — var exakt tappas mellanliggande omgångars financeLog-skrivning. Ej utredd till rotorsak, bara lokaliserad till symtom+ungefärlig storlek. Nästa steg: hitta den exakta kodvägen (troligen roundProcessor.ts, sök efter flera-omgångar-i-ett-svep-mönster), verifiera om det är en loop-bugg (skriver bara sista varvets state) eller en avsiktlig batch-optimering som glömde logg. |
